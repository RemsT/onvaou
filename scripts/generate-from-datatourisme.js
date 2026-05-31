#!/usr/bin/env node
/**
 * Génère des tags de gares à partir de DATAtourisme (base nationale officielle
 * des points d'intérêt touristiques, data.gouv.fr / ADN Tourisme).
 *
 * Principe : pour chaque gare, on compte les POI de chaque catégorie dans un
 * rayon donné. Au-dessus d'un seuil, la gare reçoit le tag correspondant.
 *
 * Entrée : /tmp/dt_place.csv (datatourisme-place.csv, ~279 Mo)
 *   Télécharger : la ressource "datatourisme-place.csv" du dataset
 *   https://www.data.gouv.fr/datasets/datatourisme-la-base-nationale-des-donnees-publiques-dinformation-touristique-en-open-data
 *
 * Sortie : src/data/stationLabelsGenerated.ts (fusionné par stationLabels.ts,
 *   les entrées manuelles restant prioritaires).
 */

'use strict';
const fs = require('fs');
const readline = require('readline');
const path = require('path');

const CSV = process.argv[2] || '/tmp/dt_place.csv';
const DATATOURISME_URL = 'https://www.data.gouv.fr/datasets/datatourisme-la-base-nationale-des-donnees-publiques-dinformation-touristique-en-open-data';

// Mapping classe d'ontologie DATAtourisme → notre tag, avec rayon (km) et seuil.
// Seuils calibrés pour des tags DISCRIMINANTS (ville vraiment notable).
const TAG_CONFIG = {
  'plage-mer':      { classes: ['Beach', 'BeachClub'], radiusKm: 10, minCount: 1, noun: 'plages' },
  'montagne':       { classes: ['Mountain', 'MountainResort'], radiusKm: 15, minCount: 1, noun: 'sites de montagne' },
  'lacs-rivieres':  { classes: ['Lake', 'Waterfall'], radiusKm: 8, minCount: 1, noun: 'lacs/cascades' },
  'sports-hiver':   { classes: ['CrossCountrySkiResort', 'DownhillSkiResort', 'DownhillSkiRun', 'CrossCountrySkiTrail'], radiusKm: 12, minCount: 1, noun: 'domaines de ski' },
  'randonnee':      { classes: ['EducationalTrail', 'NaturalPark'], radiusKm: 8, minCount: 2, noun: 'sentiers/parcs naturels' },
  'culture-histoire':{ classes: ['Castle', 'FortifiedCastle', 'CastleAndPrestigeMansion', 'Museum', 'CulturalSite', 'RemarkableBuilding', 'TechnicalHeritage'], radiusKm: 4, minCount: 8, noun: 'sites culturels majeurs' },
  'gastronomie':    { classes: ['Cellar', 'GourmetRestaurant', 'TastingProvider'], radiusKm: 5, minCount: 6, noun: 'caves/tables gastronomiques' },
  'kid-friendly':   { classes: ['ThemePark', 'ZooAnimalPark', 'VivariumAquarium'], radiusKm: 10, minCount: 1, noun: 'parcs de loisirs/zoos' },
};

// Classe d'ontologie → tag (index inverse)
const CLASS_TO_TAG = {};
for (const [tag, cfg] of Object.entries(TAG_CONFIG)) {
  for (const c of cfg.classes) CLASS_TO_TAG[c] = tag;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Découpe une ligne CSV en respectant les guillemets
function parseCSVLine(line) {
  const out = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
    else if (ch === ',' && !inQ) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

async function main() {
  if (!fs.existsSync(CSV)) {
    console.error(`❌ Fichier introuvable : ${CSV}`);
    console.error('Télécharger datatourisme-place.csv depuis data.gouv.fr et le placer là.');
    process.exit(1);
  }

  // 1. Charger les gares
  const stationsRaw = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'allStations.ts'), 'utf8');
  const stations = [...stationsRaw.matchAll(/id:\s*(\d+),\s*name:\s*"([^"]+)",\s*sncf_id:\s*"([^"]+)",\s*lat:\s*([\d.]+),\s*lon:\s*([\-\d.]+)/g)].map(m => {
    const uic = m[3].match(/(\d{8})/);
    return { id: +m[1], name: m[2], uic: uic ? uic[1] : null, lat: +m[4], lon: +m[5] };
  }).filter(s => s.uic);
  console.log(`📍 ${stations.length} gares chargées`);

  // Index spatial des gares : cellule 0.1° (~11 km)
  const CELL = 0.1;
  const key = (la, lo) => `${Math.round(la / CELL)},${Math.round(lo / CELL)}`;
  const stationGrid = new Map();
  for (const s of stations) {
    const k = key(s.lat, s.lon);
    if (!stationGrid.has(k)) stationGrid.set(k, []);
    stationGrid.get(k).push(s);
    s.counts = {};      // { tag: count }
    s.pois = {};        // { tag: [{name, url, dist}] } — 3 plus proches
    s.communes = {};    // { commune: count } → ville dominante pour le lien Wikipédia
  }
  const TOP_POIS = 3;

  // 2. Streamer le CSV des POI
  console.log('🔄 Lecture des POI DATAtourisme…');
  const rl = readline.createInterface({ input: fs.createReadStream(CSV), crlfDelay: Infinity });
  let lineNo = 0, matchedPois = 0;
  const MAX_R = 25; // rayon max → on regarde les cellules voisines dans ce rayon
  const cellSpan = Math.ceil(MAX_R / (CELL * 111)) + 1;

  for await (const line of rl) {
    lineNo++;
    if (lineNo === 1) continue; // header
    if (lineNo % 100000 === 0) console.log(`  ${lineNo} lignes, ${matchedPois} POI pertinents`);

    // Parse minimal : on a besoin des 4 premiers champs (nom, cats, lat, lon)
    const cols = parseCSVLine(line);
    const name = (cols[0] || '').trim();
    const cats = cols[1] || '';
    const lat = parseFloat(cols[2]), lon = parseFloat(cols[3]);
    if (!lat || !lon) continue;

    // URL officielle du lieu : 1ère URL http(s) trouvée dans le champ Contacts
    const urlMatch = (cols[10] || '').match(/https?:\/\/[^\s#|<>"]+/);
    const url = urlMatch ? urlMatch[0] : '';

    // Commune du POI (col 5 "Code_postal_et_commune" = "08170#Haybes")
    const commune = (cols[5] || '').split('#')[1] || '';

    // Quel(s) tag(s) ce POI représente-t-il ?
    const poiTags = new Set();
    for (const part of cats.split('|')) {
      const cls = part.split('#')[1];
      const tag = cls && CLASS_TO_TAG[cls];
      if (tag) poiTags.add(tag);
    }
    if (poiTags.size === 0) continue;
    matchedPois++;

    // Trouver les gares proches et incrémenter les compteurs
    const ci = Math.round(lat / CELL), cj = Math.round(lon / CELL);
    for (let di = -cellSpan; di <= cellSpan; di++) {
      for (let dj = -cellSpan; dj <= cellSpan; dj++) {
        const bucket = stationGrid.get(`${ci + di},${cj + dj}`);
        if (!bucket) continue;
        for (const s of bucket) {
          const dist = haversine(lat, lon, s.lat, s.lon);
          for (const tag of poiTags) {
            if (dist <= TAG_CONFIG[tag].radiusKm) {
              s.counts[tag] = (s.counts[tag] || 0) + 1;
              // Garder les 3 lieux les plus proches (nom + url) pour ce tag
              if (name) {
                const list = s.pois[tag] || (s.pois[tag] = []);
                if (list.length < TOP_POIS || dist < list[list.length - 1].dist) {
                  // éviter les doublons de nom
                  if (!list.some(p => p.name === name)) {
                    list.push({ name, url, dist });
                    list.sort((a, b) => a.dist - b.dist);
                    if (list.length > TOP_POIS) list.length = TOP_POIS;
                  }
                }
              }
            }
          }
          // Commune dominante : POI à moins de 5 km de la gare
          if (commune && dist <= 5) {
            s.communes[commune] = (s.communes[commune] || 0) + 1;
          }
        }
      }
    }
  }
  console.log(`✅ ${lineNo} lignes lues, ${matchedPois} POI pertinents`);

  // 3. Générer les tags par gare selon les seuils
  const out = {};
  const stats = {};
  for (const s of stations) {
    const tags = [];
    for (const [tag, cfg] of Object.entries(TAG_CONFIG)) {
      const n = s.counts[tag] || 0;
      if (n >= cfg.minCount) {
        const pois = (s.pois[tag] || []).map(p => ({ name: p.name, url: p.url || undefined }));
        const names = pois.map(p => p.name);
        // Raison : nomme les lieux précis quand on les a
        let reason;
        if (names.length > 0) {
          const extra = n - names.length;
          reason = `À proximité : ${names.join(', ')}` + (extra > 0 ? ` et ${extra} autre${extra > 1 ? 's' : ''}` : '');
        } else {
          reason = `${n} ${cfg.noun} recensés à proximité`;
        }
        // Source principale : 1er lieu avec lien, sinon le jeu de données DATAtourisme
        const firstWithUrl = pois.find(p => p.url);
        tags.push({
          label: tag,
          reason,
          source: firstWithUrl ? firstWithUrl.url : DATATOURISME_URL,
          linkLabel: firstWithUrl ? firstWithUrl.name : 'Voir sur DATAtourisme',
          confidence: Math.min(95, 50 + n * 3),
          pois,
          _count: n,
        });
        stats[tag] = (stats[tag] || 0) + 1;
      }
    }
    if (tags.length > 0) {
      tags.sort((a, b) => b._count - a._count);
      // Commune dominante → lien Wikipédia de la ville
      let wikipediaUrl;
      const communes = Object.entries(s.communes);
      if (communes.length > 0) {
        communes.sort((a, b) => b[1] - a[1]);
        const city = communes[0][0].replace(/\s+\d+(er|e)?$/i, '').trim(); // retire arrondissement
        if (city) wikipediaUrl = 'https://fr.wikipedia.org/wiki/' + encodeURIComponent(city.replace(/ /g, '_'));
      }
      out[s.uic] = { wikipediaUrl, tags: tags.map(({ _count, ...t }) => t) };
    }
  }

  console.log(`\n📊 Gares taguées : ${Object.keys(out).length}`);
  console.log('Par tag :', JSON.stringify(stats, null, 0));

  // 4. Écrire le fichier généré
  const entries = Object.entries(out).map(([uic, data]) => {
    const tagsStr = data.tags.map(t => {
      const poisStr = (t.pois && t.pois.length)
        ? `, pois: ${JSON.stringify(t.pois)}`
        : '';
      return `    { label: '${t.label}', reason: ${JSON.stringify(t.reason)}, source: ${JSON.stringify(t.source)}, linkLabel: ${JSON.stringify(t.linkLabel)}, confidence: ${t.confidence}${poisStr} },`;
    }).join('\n');
    const wikiStr = data.wikipediaUrl ? `    wikipediaUrl: ${JSON.stringify(data.wikipediaUrl)},\n` : '';
    return `  "${uic}": {\n${wikiStr}    tags: [\n${tagsStr}\n    ],\n  },`;
  }).join('\n');

  const header = `// AUTO-GÉNÉRÉ depuis DATAtourisme (data.gouv.fr / ADN Tourisme) — ${new Date().toISOString().slice(0, 10)}\n// NE PAS ÉDITER À LA MAIN. Régénérer : node scripts/generate-from-datatourisme.js\nimport { StationData } from '../types';\n\nexport const generatedLabels: Record<string, StationData> = {\n`;
  fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'stationLabelsGenerated.ts'), header + entries + '\n};\n');
  console.log('\n✅ Écrit : src/data/stationLabelsGenerated.ts');
}

main().catch(e => { console.error(e); process.exit(1); });
