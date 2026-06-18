#!/usr/bin/env node
/**
 * Génère les tags de gares « plausibles à pied/vélo » à partir de DATAtourisme.
 *
 * Pas de routing (ni API, ni moteur local) : on resserre le rayon à VOL D'OISEAU pour ne garder
 * que des POI plausibles sans voiture (≤ KEEP_MAX_KM). L'app affiche la distance approximative et
 * un bouton « Voir le trajet » qui ouvre Maps (lequel calcule le vrai itinéraire à la demande).
 *
 * Piloté par le registre UNIQUE src/config/tags.json (classes DATAtourisme).
 * Un tag n'est émis pour une gare que s'il reste ≥ 1 POI ≤ KEEP_MAX_KM. On stocke nom/url/lat/lon/km.
 *
 * Entrée : /tmp/dt_place.csv (datatourisme-place.csv ~280 Mo, data.gouv.fr)
 * Sortie : src/data/stationLabelsGenerated.ts
 * Options : --limit N (ne traiter que N gares — test)
 */
'use strict';
const fs = require('fs');
const readline = require('readline');
const path = require('path');

const CSV = process.argv.find((a) => a.endsWith('.csv')) || '/tmp/dt_place.csv';
const LIMIT = (() => {
  const i = process.argv.indexOf('--limit');
  return i >= 0 ? parseInt(process.argv[i + 1], 10) : Infinity;
})();
const DATATOURISME_URL =
  'https://www.data.gouv.fr/datasets/datatourisme-la-base-nationale-des-donnees-publiques-dinformation-touristique-en-open-data';

// ── Cap à vol d'oiseau (pré-filtre, sans routing) ─────────────────────────────
// Borne « ≤ 20 min de vélo » : à ~13 km/h en vélo et avec un détour réel ~1,4×, 20 min ≈ 4,3 km
// par la route ⇒ ~3 km à vol d'oiseau. On garde une marge raisonnable. Le filtre fin (minutes
// réelles Valhalla, MAX_BIKE_MIN dans src/utils/directions.ts) s'applique ensuite au runtime.
const BIKE_MAX_MIN = 20;          // cap d'accessibilité vélo (cohérent avec MAX_BIKE_MIN côté app)
const BIKE_SPEED_KMH = 13;        // vitesse vélo moyenne urbaine/périurbaine
const DETOUR_FACTOR = 1.4;        // route réelle vs vol d'oiseau
const KEEP_MAX_KM = Math.round(((BIKE_MAX_MIN / 60) * BIKE_SPEED_KMH) / DETOUR_FACTOR * 10) / 10; // ≈ 3,1 km
const TOP_POIS = 3;    // POI gardés (les plus proches) par tag

// ── Registre de tags (source unique) ─────────────────────────────────────────
const tagsConfig = require(path.join(__dirname, '..', 'src', 'config', 'tags.json'));
const TAG_CONFIG = {};
const CLASS_TO_TAG = {};
for (const t of tagsConfig) {
  TAG_CONFIG[t.key] = { classes: t.datatourismeClasses, noun: t.noun || 'sites' };
  for (const c of t.datatourismeClasses) CLASS_TO_TAG[c] = t.key;
}

// ── Exclusions par nom (POIs mal classés par DATAtourisme) ────────────────────
// Global = jeux/énigmes (pas une vraie sortie) ; par tag = intrus spécifiques.
const EXCLUDE_GLOBAL = /chasse aux? tr[eé]sor|tr[eé]sors? cach|jeu de piste|g[eé]ocach|escape (game|room)|murder party|m[eè]ne ton enqu|rallye/i;
const EXCLUDE_PER_TAG = {
  randonnee: /discover walks|free tour|city tour|happy moov|visite guid[eé]e|guided (walk|tour)|segway|parcours urbain/i,
  'kid-friendly': /lancer de hache|hache'?lor|axe throwing|poulailler/i,
  'plage-mer': /canal de d[eé]charge|station d['’]?[eé]puration|d[eé]chetterie/i,
  'sports-hiver': /accompagnateur/i,
};
function isExcluded(tag, name) {
  if (EXCLUDE_GLOBAL.test(name)) return true;
  const re = EXCLUDE_PER_TAG[tag];
  return re ? re.test(name) : false;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
    console.error('Télécharger datatourisme-place.csv depuis data.gouv.fr → /tmp/dt_place.csv');
    process.exit(1);
  }

  // 1. Charger les gares
  const stationsRaw = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'allStations.ts'), 'utf8');
  let stations = [...stationsRaw.matchAll(/id:\s*(\d+),\s*name:\s*"([^"]+)",\s*sncf_id:\s*"([^"]+)",\s*lat:\s*([\d.]+),\s*lon:\s*([\-\d.]+)/g)].map((m) => {
    const uic = m[3].match(/(\d{8})/);
    return { id: +m[1], name: m[2], uic: uic ? uic[1] : null, lat: +m[4], lon: +m[5] };
  }).filter((s) => s.uic);
  if (LIMIT !== Infinity) stations = stations.slice(0, LIMIT);
  console.log(`📍 ${stations.length} gares chargées`);

  // Index spatial des gares : cellule 0.1° (~11 km)
  const CELL = 0.1;
  const key = (la, lo) => `${Math.round(la / CELL)},${Math.round(lo / CELL)}`;
  const stationGrid = new Map();
  for (const s of stations) {
    const k = key(s.lat, s.lon);
    if (!stationGrid.has(k)) stationGrid.set(k, []);
    stationGrid.get(k).push(s);
    s.pois = {};      // { tag: [{name,url,lat,lon,dist}] } — TOP_POIS plus proches ≤ KEEP_MAX_KM
    s.communes = {};  // { commune: count } → ville dominante (lien Wikipédia)
  }

  // 2. Streamer le CSV des POI
  console.log('🔄 Lecture des POI DATAtourisme…');
  const rl = readline.createInterface({ input: fs.createReadStream(CSV), crlfDelay: Infinity });
  let lineNo = 0, matchedPois = 0;
  // Cellules voisines à inspecter pour couvrir KEEP_MAX_KM
  const cellSpan = Math.ceil(KEEP_MAX_KM / (CELL * 111)) + 1;

  for await (const line of rl) {
    lineNo++;
    if (lineNo === 1) continue; // header
    if (lineNo % 100000 === 0) console.log(`  ${lineNo} lignes, ${matchedPois} POI pertinents`);

    const cols = parseCSVLine(line);
    const name = (cols[0] || '').trim();
    const cats = cols[1] || '';
    const lat = parseFloat(cols[2]), lon = parseFloat(cols[3]);
    if (!lat || !lon) continue;
    const urlMatch = (cols[10] || '').match(/https?:\/\/[^\s#|<>"]+/);
    const url = urlMatch ? urlMatch[0] : '';
    const commune = (cols[5] || '').split('#')[1] || '';

    const poiTags = new Set();
    for (const part of cats.split('|')) {
      const cls = part.split('#')[1];
      const tag = cls && CLASS_TO_TAG[cls];
      if (tag && !isExcluded(tag, name)) poiTags.add(tag);
    }
    // Visites audioguidées/guidées : relèvent de Culture & Histoire, pas de Randonnée.
    if (poiTags.has('randonnee') && /audio.?guid|visite audio|visite guid[eé]e|balade audioguid/i.test(name)) {
      poiTags.delete('randonnee');
      poiTags.add('culture-histoire');
    }
    if (poiTags.size === 0) continue;
    matchedPois++;

    const ci = Math.round(lat / CELL), cj = Math.round(lon / CELL);
    for (let di = -cellSpan; di <= cellSpan; di++) {
      for (let dj = -cellSpan; dj <= cellSpan; dj++) {
        const bucket = stationGrid.get(`${ci + di},${cj + dj}`);
        if (!bucket) continue;
        for (const s of bucket) {
          const dist = haversine(lat, lon, s.lat, s.lon);
          if (dist > KEEP_MAX_KM) continue; // cap à vol d'oiseau
          for (const tag of poiTags) {
            if (!name) continue;
            const list = s.pois[tag] || (s.pois[tag] = []);
            if ((list.length < TOP_POIS || dist < list[list.length - 1].dist) && !list.some((p) => p.name === name)) {
              list.push({ name, url, lat, lon, dist });
              list.sort((a, b) => a.dist - b.dist);
              if (list.length > TOP_POIS) list.length = TOP_POIS;
            }
          }
          if (commune && dist <= 5) s.communes[commune] = (s.communes[commune] || 0) + 1;
        }
      }
    }
  }
  console.log(`✅ ${lineNo} lignes lues, ${matchedPois} POI pertinents`);

  // 3. Générer les tags (un tag = au moins 1 POI ≤ KEEP_MAX_KM)
  const out = {};
  const stats = {};
  for (const s of stations) {
    const tags = [];
    for (const [tag] of Object.entries(TAG_CONFIG)) {
      const pois = (s.pois[tag] || []).map((p) => ({
        name: p.name,
        url: p.url || undefined,
        lat: Math.round(p.lat * 1e5) / 1e5,
        lon: Math.round(p.lon * 1e5) / 1e5,
        km: Math.round(p.dist * 10) / 10,
      }));
      if (pois.length === 0) continue;
      const names = pois.map((p) => p.name);
      const firstWithUrl = pois.find((p) => p.url);
      tags.push({
        label: tag,
        reason: `À proximité (à vol d'oiseau) : ${names.join(', ')}`,
        source: firstWithUrl ? firstWithUrl.url : DATATOURISME_URL,
        linkLabel: firstWithUrl ? firstWithUrl.name : 'Voir sur DATAtourisme',
        confidence: Math.min(95, 60 + pois.length * 8),
        pois,
        _near: pois[0].km,
      });
      stats[tag] = (stats[tag] || 0) + 1;
    }
    if (tags.length > 0) {
      tags.sort((a, b) => a._near - b._near); // activité la plus proche d'abord
      let wikipediaUrl;
      const communes = Object.entries(s.communes);
      if (communes.length > 0) {
        communes.sort((a, b) => b[1] - a[1]);
        const city = communes[0][0].replace(/\s+\d+(er|e)?$/i, '').trim();
        if (city) wikipediaUrl = 'https://fr.wikipedia.org/wiki/' + encodeURIComponent(city.replace(/ /g, '_'));
      }
      out[s.uic] = { wikipediaUrl, tags: tags.map(({ _near, ...t }) => t) };
    }
  }

  console.log(`\n📊 Gares taguées : ${Object.keys(out).length}`);
  console.log('Par tag :', JSON.stringify(stats));

  // 4. Écrire le fichier généré
  const entries = Object.entries(out).map(([uic, data]) => {
    const tagsStr = data.tags.map((t) => {
      const poisStr = t.pois && t.pois.length ? `, pois: ${JSON.stringify(t.pois)}` : '';
      return `    { label: '${t.label}', reason: ${JSON.stringify(t.reason)}, source: ${JSON.stringify(t.source)}, linkLabel: ${JSON.stringify(t.linkLabel)}, confidence: ${t.confidence}${poisStr} },`;
    }).join('\n');
    const wikiStr = data.wikipediaUrl ? `    wikipediaUrl: ${JSON.stringify(data.wikipediaUrl)},\n` : '';
    return `  "${uic}": {\n${wikiStr}    tags: [\n${tagsStr}\n    ],\n  },`;
  }).join('\n');

  const header = `// AUTO-GÉNÉRÉ — tags plausibles à pied/vélo (DATAtourisme, cap ${KEEP_MAX_KM} km à vol d'oiseau) — ${new Date().toISOString().slice(0, 10)}\n// NE PAS ÉDITER À LA MAIN. Régénérer : node scripts/generate-tags.js (voir scripts/README.md)\nimport { StationData } from '../types';\n\nexport const generatedLabels: Record<string, StationData> = {\n`;
  fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'stationLabelsGenerated.ts'), header + entries + '\n};\n');
  console.log('\n✅ Écrit : src/data/stationLabelsGenerated.ts');
}

main().catch((e) => { console.error(e); process.exit(1); });
