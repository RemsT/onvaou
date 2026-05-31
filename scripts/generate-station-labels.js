#!/usr/bin/env node
/**
 * Générateur automatique de tags pour les gares SNCF
 *
 * Sources utilisées (toutes gratuites / open data) :
 *  - Communes littorales : data.gouv.fr
 *  - Altitude           : GeoNames API (GEONAMES_USERNAME requis, gratuit)
 *  - Lacs & rivières    : SANDRE API (api.sandre.eaufrance.fr)
 *  - Monuments classés  : Base Mérimée (data.culture.gouv.fr)
 *  - Parcs naturels     : data.gouv.fr (PNR)
 *  - Ski stations       : scripts/sources/ski-stations.json
 *  - Description+catégs : Wikipedia API (fr)
 *  - Corrections manuelle: scripts/sources/manual_overrides.json
 *
 * Usage :
 *   node scripts/generate-station-labels.js [--dry-run]
 *
 * Secrets :
 *   GEONAMES_USERNAME=moncompte  (gratuit sur geonames.org)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const DRY_RUN = process.argv.includes('--dry-run');
const GEONAMES_USER = process.env.GEONAMES_USERNAME || 'demo';

// ─── Helpers HTTP ─────────────────────────────────────────────────────────────

async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'ONvaOU-app/1.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error(`JSON parse error for ${url}: ${data.slice(0, 200)}`)); }
      });
    }).on('error', reject);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Sources statiques ────────────────────────────────────────────────────────

const SOURCES_DIR = path.join(__dirname, 'sources');

function loadJSON(file) {
  const p = path.join(SOURCES_DIR, file);
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const SKI_STATIONS = loadJSON('ski-stations.json');         // [{ name, lat, lon, url }]
const FAMILY_DESTINATIONS = loadJSON('family-destinations.json'); // [{ name, lat, lon, url }]
const COASTAL_COMMUNES = loadJSON('coastal-communes.json'); // Set of INSEE codes
const MANUAL_OVERRIDES = loadJSON('manual_overrides.json');

// Départements côtiers (code INSEE = 2 premiers chiffres du code commune)
const COASTAL_DEPARTMENTS = new Set([
  '06','11','13','14','17','22','29','30','34','35','40','44',
  '50','56','59','62','64','66','67','76','83','85'
]);

// ─── Tagging par source ────────────────────────────────────────────────────────

function isCoastal(lat, lon, inseeCode) {
  if (inseeCode) {
    const dept = String(inseeCode).slice(0, 2);
    return COASTAL_DEPARTMENTS.has(dept);
  }
  // Fallback géographique simple (France métropolitaine)
  if (lat < 42.5 && lon > 2.5 && lon < 4.5) return true; // Méditerranée Pyrénées-Orientales
  return false;
}

async function getAltitude(lat, lon) {
  try {
    const url = `http://api.geonames.org/srtm3JSON?lat=${lat}&lng=${lon}&username=${GEONAMES_USER}`;
    const data = await fetchJSON(url);
    return data.srtm3 || 0;
  } catch {
    return 0;
  }
}

function hasSectionNearby(list, lat, lon, radiusKm = 25) {
  function dist(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
  return list.find(s => dist(lat, lon, s.lat, s.lon) <= radiusKm) || null;
}

async function getLakeNearby(lat, lon, radiusKm = 15) {
  try {
    const margin = radiusKm / 111;
    const url = `https://api.sandre.eaufrance.fr/referentiels/v1/PlanEau.json?bbox=${lon-margin},${lat-margin},${lon+margin},${lat+margin}&limit=5`;
    const data = await fetchJSON(url);
    const features = data?.features || [];
    return features.find(f => (f.properties?.SurfaceEnHa || 0) >= 50) || null;
  } catch {
    return null;
  }
}

async function getMonumentsNearby(lat, lon, radiusKm = 5) {
  try {
    const url = `https://data.culture.gouv.fr/api/explore/v2.1/catalog/datasets/liste-des-immeubles-proteges-au-titre-des-monuments-historiques/records?where=within_distance(geolocalisation,%20geom\'POINT(${lon}%20${lat})\',%20${radiusKm}km)&limit=5&select=nom_courant,ref_merimee`;
    const data = await fetchJSON(url);
    return data?.results || [];
  } catch {
    return [];
  }
}

async function getWikipediaData(cityName) {
  try {
    const encoded = encodeURIComponent(cityName.split(' ')[0]);
    const summaryUrl = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
    const catsUrl = `https://fr.wikipedia.org/w/api.php?action=query&titles=${encoded}&prop=categories&cllimit=30&format=json`;

    const [summary, catsData] = await Promise.all([
      fetchJSON(summaryUrl),
      fetchJSON(catsUrl),
    ]);

    const pages = catsData?.query?.pages || {};
    const cats = Object.values(pages)[0]?.categories?.map(c => c.title) || [];

    return {
      description: summary?.extract?.split('. ').slice(0, 2).join('. ') + '.',
      wikipediaUrl: summary?.content_urls?.desktop?.page,
      thumbnailUrl: summary?.thumbnail?.source,
      categories: cats,
    };
  } catch {
    return { description: null, wikipediaUrl: null, thumbnailUrl: null, categories: [] };
  }
}

// ─── Règles de détection par catégories Wikipedia ─────────────────────────────

const WIKI_CAT_RULES = [
  { label: 'sports-hiver', patterns: ['Station de sports d\'hiver', 'Station de ski'] },
  { label: 'montagne', patterns: ['Commune de la Haute', 'Commune des Alpes', 'Commune des Pyrénées', 'Commune de Savoie', 'Commune de Haute-Savoie', 'Col de montagne'] },
  { label: 'plage-mer', patterns: ['Commune littorale', 'Station balnéaire'] },
  { label: 'randonnee', patterns: ['Parc naturel régional', 'Parc national', 'GR '] },
  { label: 'culture-histoire', patterns: ['Monument historique', 'Patrimoine mondial', 'UNESCO'] },
  { label: 'gastronomie', patterns: ['Appellation d\'origine', 'AOC', 'Vignoble', 'gastronomie'] },
  { label: 'kid-friendly', patterns: ['Parc d\'attractions', 'Zoo', 'Aquarium'] },
];

function tagsFromCategories(categories) {
  const found = [];
  for (const rule of WIKI_CAT_RULES) {
    const match = categories.find(c => rule.patterns.some(p => c.includes(p)));
    if (match) found.push({ label: rule.label, catMatch: match });
  }
  return found;
}

// ─── Tagging complet d'une gare ───────────────────────────────────────────────

async function tagStation(station) {
  const { id, name, lat, lon, inseeCode } = station;
  const tags = [];
  let description = null;
  let wikipediaUrl = null;
  let thumbnailUrl = null;

  // Passe 1 : sources déterministes
  if (isCoastal(lat, lon, inseeCode)) {
    tags.push({
      label: 'plage-mer',
      reason: `Commune côtière (${COASTAL_DEPARTMENTS.has(String(inseeCode).slice(0,2)) ? 'département littoral' : 'position géographique'})`,
      source: 'https://www.data.gouv.fr/datasets/communes-littorales-mer-ou-estuaire',
      linkLabel: 'Communes littorales — data.gouv.fr',
      confidence: 95,
    });
  }

  const skiNear = hasSectionNearby(Array.isArray(SKI_STATIONS) ? SKI_STATIONS : [], lat, lon, 25);
  if (skiNear) {
    tags.push({
      label: 'sports-hiver',
      reason: `Station de ski "${skiNear.name}" à ${Math.round(skiNear.dist || 20)}km`,
      source: skiNear.url || `https://fr.wikipedia.org/wiki/${encodeURIComponent(skiNear.name)}`,
      linkLabel: `Voir la station ${skiNear.name}`,
      confidence: 90,
    });
  }

  const familyNear = hasSectionNearby(Array.isArray(FAMILY_DESTINATIONS) ? FAMILY_DESTINATIONS : [], lat, lon, 30);
  if (familyNear) {
    tags.push({
      label: 'kid-friendly',
      reason: `"${familyNear.name}" à ${Math.round(familyNear.dist || 20)}km`,
      source: familyNear.url || 'https://www.france.fr/fr/famille',
      linkLabel: `Voir ${familyNear.name}`,
      confidence: 85,
    });
  }

  // Altitude (montagne)
  const altitude = await getAltitude(lat, lon);
  if (altitude > 700) {
    tags.push({
      label: 'montagne',
      reason: `Altitude ${altitude}m (seuil montagne : >700m)`,
      source: `https://www.geonames.org/`,
      linkLabel: 'Voir sur GeoNames',
      confidence: 90,
    });
  }

  // Lac proche (SANDRE)
  const lake = await getLakeNearby(lat, lon);
  if (lake) {
    const lakeName = lake.properties?.NomPlanDEau || 'Plan d\'eau';
    const surface = Math.round(lake.properties?.SurfaceEnHa || 0);
    tags.push({
      label: 'lacs-rivieres',
      reason: `${lakeName} (${surface} ha) à proximité`,
      source: `https://www.sandre.eaufrance.fr/`,
      linkLabel: 'Voir sur SANDRE Eaufrance',
      confidence: 95,
    });
  }

  // Monuments classés (Base Mérimée)
  const monuments = await getMonumentsNearby(lat, lon);
  if (monuments.length >= 2) {
    tags.push({
      label: 'culture-histoire',
      reason: `${monuments.length} monuments historiques classés dans un rayon de 5km`,
      source: `https://www.pop.culture.gouv.fr/`,
      linkLabel: 'Voir sur Base Mérimée',
      confidence: 85,
    });
  }

  // Passe 2 : Wikipedia
  const wiki = await getWikipediaData(name);
  description = wiki.description;
  wikipediaUrl = wiki.wikipediaUrl;
  thumbnailUrl = wiki.thumbnailUrl;

  const catTags = tagsFromCategories(wiki.categories);
  for (const ct of catTags) {
    if (!tags.find(t => t.label === ct.label)) {
      tags.push({
        label: ct.label,
        reason: `Catégorie Wikipedia : "${ct.catMatch}"`,
        source: wiki.wikipediaUrl || `https://fr.wikipedia.org/wiki/${encodeURIComponent(name)}`,
        linkLabel: 'Voir sur Wikipedia',
        confidence: 75,
      });
    }
  }

  return { tags, description, wikipediaUrl, thumbnailUrl };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🚀 Génération des tags de gares ${DRY_RUN ? '(DRY RUN)' : ''}`);

  // Charger les gares
  const allStationsPath = path.join(__dirname, '..', 'src', 'data', 'allStations.ts');
  const rawStations = fs.readFileSync(allStationsPath, 'utf8');

  // Parser les gares (format TypeScript → JSON approximatif), incluant sncf_id
  const stationMatches = [...rawStations.matchAll(/\{[^}]*id:\s*(\d+)[^}]*name:\s*['"]([^'"]+)['"][^}]*sncf_id:\s*['"]([^'"]+)['"][^}]*lat:\s*([\d.]+)[^}]*lon:\s*([\-\d.]+)[^}]*\}/g)];
  const stations = stationMatches.map(m => {
    const uicMatch = m[3].match(/(\d{8})/);
    return {
      id: parseInt(m[1]),
      name: m[2],
      sncf_id: m[3],
      uic: uicMatch ? uicMatch[1] : null,
      lat: parseFloat(m[4]),
      lon: parseFloat(m[5]),
    };
  });

  console.log(`📊 ${stations.length} gares à traiter`);

  // Codes UIC déjà tagués manuellement dans stationLabels.ts (à ne pas écraser)
  const existingLabels = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'data', 'stationLabels.ts'), 'utf8'
  );
  const MANUAL_UICS = new Set([...existingLabels.matchAll(/"(\d{8})":\s*\{/g)].map(m => m[1]));
  const toProcess = stations.filter(s => s.uic && !MANUAL_UICS.has(s.uic));
  console.log(`⚙️  ${toProcess.length} gares à traiter (${MANUAL_UICS.size} manuelles conservées)`);

  if (DRY_RUN) {
    console.log('\n📋 Mode DRY RUN — exemple sur 5 gares :');
    for (const s of toProcess.slice(0, 5)) {
      const result = await tagStation(s);
      console.log(`  [${s.id}] ${s.name}: ${result.tags.map(t => t.label).join(', ') || '(aucun tag)'}`);
      await sleep(500);
    }
    console.log('\n✅ Dry run terminé — aucun fichier modifié');
    return;
  }

  // Lire le stationLabels.ts actuel pour y ajouter
  const outputData = {};
  const stats = {};
  const lowConfidence = [];
  let tagged = 0;

  for (const [i, station] of toProcess.entries()) {
    if (i % 50 === 0) console.log(`  Progress: ${i}/${toProcess.length} (${tagged} taguées)`);

    const result = await tagStation(station);
    if (result.tags.length > 0) {
      outputData[station.uic] = result; // clé = code UIC stable
      tagged++;
      for (const t of result.tags) {
        stats[t.label] = (stats[t.label] || 0) + 1;
        if (t.confidence < 70) lowConfidence.push({ station: station.name, uic: station.uic, ...t });
      }
    }

    // Appliquer manual_overrides (clé = code UIC)
    const overrides = MANUAL_OVERRIDES[station.uic];
    if (overrides && outputData[station.uic]) {
      if (overrides.add) outputData[station.uic].tags.push(...overrides.add);
      if (overrides.remove) outputData[station.uic].tags = outputData[station.uic].tags.filter(t => !overrides.remove.includes(t.label));
    }

    await sleep(200); // Respecter les rate limits des APIs
  }

  // Générer le rapport
  const report = {
    generated_at: new Date().toISOString(),
    total_stations: stations.length,
    manual_stations: MANUAL_UICS.size,
    auto_tagged_stations: tagged,
    by_label: stats,
    low_confidence: lowConfidence.slice(0, 50),
  };

  const reportPath = path.join(__dirname, '..', 'src', 'data', 'tagging_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Rapport écrit : ${reportPath}`);
  console.log(`   Stats: ${JSON.stringify(stats)}`);
  console.log(`   Low confidence: ${lowConfidence.length} tags`);

  // Générer les nouvelles entrées à insérer dans stationLabels.ts
  const newEntries = Object.entries(outputData)
    .map(([id, data]) => {
      const tagsStr = data.tags.map(t =>
        `    { label: '${t.label}', reason: ${JSON.stringify(t.reason)}, source: ${JSON.stringify(t.source)}, linkLabel: ${JSON.stringify(t.linkLabel)}, confidence: ${t.confidence} },`
      ).join('\n');
      return `  "${id}": {\n    description: ${JSON.stringify(data.description || '')},\n    wikipediaUrl: ${JSON.stringify(data.wikipediaUrl || '')},\n    thumbnailUrl: ${JSON.stringify(data.thumbnailUrl || '')},\n    tags: [\n${tagsStr}\n    ],\n  },`;
    })
    .join('\n');

  const appendPath = path.join(__dirname, '..', 'src', 'data', 'stationLabels_generated.ts');
  fs.writeFileSync(appendPath, `// AUTO-GENERATED — ${new Date().toISOString()}\n// Fusionner avec stationLabels.ts\nexport const generatedLabels = {\n${newEntries}\n};\n`);

  console.log(`\n✅ Généré : ${appendPath}`);
  console.log(`   → Fusionner manuellement avec src/data/stationLabels.ts après revue`);
}

main().catch(console.error);
