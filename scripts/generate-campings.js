#!/usr/bin/env node
/**
 * Génère les campings rattachés aux gares à partir de DATAtourisme.
 *
 * Calqué sur generate-tags.js (grille spatiale 0,1° + haversine, même parsing CSV). Hors-ligne,
 * AUCUNE API/clé. On ne garde que les POI de classe `CampingAndCaravanning` (col Categories), à
 * VOL D'OISEAU ≤ RADIUS_KM d'une gare. Les ÉTOILES viennent de la colonne `Classements_du_POI`
 * (ex. « 3 étoiles#… ») via parseStars (réutilisé par l'app, src/services/profilePreferencesService).
 *
 * Le plafond « mode à pied » (temps de marche max du profil) est appliqué au runtime côté app
 * (stationLabels.ts), PAS ici : on embarque les campings dans un rayon large et l'app filtre.
 *
 * Entrée : /tmp/dt_place.csv (datatourisme-place.csv ~280 Mo, data.gouv.fr)
 * Sortie : src/data/campingsGenerated.ts  (REMPLACE le fichier)
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

const CAMPING_CLASS = 'CampingAndCaravanning';
const RADIUS_KM = 10;   // rayon de rattachement à vol d'oiseau (cohérent avec tags.json camping.radiusKm)
const TOP = 6;          // campings gardés par gare (étoiles ↓ puis distance ↑)

// Miroir EXACT de parseStars (src/services/profilePreferencesService.ts, testé côté Jest) : le
// générateur tourne sous Node pur et ne peut pas require un .ts — on duplique la logique (une regex).
function parseStars(classements) {
  if (!classements) return undefined;
  const m = String(classements).match(/(\d+)\s*étoiles?/i);
  if (!m) return undefined;
  const n = parseInt(m[1], 10);
  return n >= 1 && n <= 5 ? n : undefined;
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

// Tri d'affichage : étoiles décroissantes (non classé en dernier) puis distance croissante.
function compareCampings(a, b) {
  const sa = a.stars || 0, sb = b.stars || 0;
  if (sa !== sb) return sb - sa;
  return a.dist - b.dist;
}

async function main() {
  if (!fs.existsSync(CSV)) {
    console.error(`❌ Fichier introuvable : ${CSV}`);
    console.error('Télécharger datatourisme-place.csv depuis data.gouv.fr → /tmp/dt_place.csv');
    process.exit(1);
  }

  // 1. Charger les gares (mêmes UIC que generate-tags.js)
  const stationsRaw = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'allStations.ts'), 'utf8');
  let stations = [...stationsRaw.matchAll(/id:\s*(\d+),\s*name:\s*"([^"]+)",\s*sncf_id:\s*"([^"]+)",\s*lat:\s*([\d.]+),\s*lon:\s*([\-\d.]+)/g)].map((m) => {
    const uic = m[3].match(/(\d{8})/);
    return { id: +m[1], name: m[2], uic: uic ? uic[1] : null, lat: +m[4], lon: +m[5] };
  }).filter((s) => s.uic);
  if (LIMIT !== Infinity) stations = stations.slice(0, LIMIT);
  console.log(`📍 ${stations.length} gares chargées`);

  // Index spatial des gares : cellule 0.1° (~11 km)
  const CELL = 0.1;
  const stationGrid = new Map();
  for (const s of stations) {
    const k = `${Math.round(s.lat / CELL)},${Math.round(s.lon / CELL)}`;
    if (!stationGrid.has(k)) stationGrid.set(k, []);
    stationGrid.get(k).push(s);
    s.campings = []; // [{name,url,lat,lon,dist,stars?,commune?}]
  }

  // 2. Streamer le CSV
  console.log('🔄 Lecture des campings DATAtourisme…');
  const rl = readline.createInterface({ input: fs.createReadStream(CSV), crlfDelay: Infinity });
  let lineNo = 0, matched = 0;
  const cellSpan = Math.ceil(RADIUS_KM / (CELL * 111)) + 1;

  for await (const line of rl) {
    lineNo++;
    if (lineNo === 1) continue; // header
    if (lineNo % 100000 === 0) console.log(`  ${lineNo} lignes, ${matched} campings`);

    const cols = parseCSVLine(line);
    const name = (cols[0] || '').trim();
    const cats = cols[1] || '';
    if (!name) continue;
    if (!cats.split('|').some((part) => part.split('#')[1] === CAMPING_CLASS)) continue;
    const lat = parseFloat(cols[2]), lon = parseFloat(cols[3]);
    if (!lat || !lon) continue;

    const urlMatch = (cols[10] || '').match(/https?:\/\/[^\s#|<>"]+/);
    const url = urlMatch ? urlMatch[0] : '';
    const commune = ((cols[5] || '').split('#')[1] || '').replace(/\s+\d+(er|e)?$/i, '').trim();
    const stars = parseStars(cols[11]);
    matched++;

    const ci = Math.round(lat / CELL), cj = Math.round(lon / CELL);
    for (let di = -cellSpan; di <= cellSpan; di++) {
      for (let dj = -cellSpan; dj <= cellSpan; dj++) {
        const bucket = stationGrid.get(`${ci + di},${cj + dj}`);
        if (!bucket) continue;
        for (const s of bucket) {
          const dist = haversine(lat, lon, s.lat, s.lon);
          if (dist > RADIUS_KM) continue;
          if (s.campings.some((c) => c.name === name)) continue;
          s.campings.push({ name, url, lat, lon, dist, stars, commune });
        }
      }
    }
  }
  console.log(`✅ ${lineNo} lignes lues, ${matched} campings`);

  // 3. Construire la sortie : top TOP par gare, triés étoiles ↓ puis distance ↑
  const out = {};
  let total = 0, rated = 0;
  for (const s of stations) {
    if (s.campings.length === 0) continue;
    s.campings.sort(compareCampings);
    const pois = s.campings.slice(0, TOP).map((c) => {
      const poi = {
        name: c.name,
        url: c.url || undefined,
        lat: Math.round(c.lat * 1e5) / 1e5,
        lon: Math.round(c.lon * 1e5) / 1e5,
        km: Math.round(c.dist * 10) / 10,
      };
      if (c.stars) { poi.stars = c.stars; rated++; }
      if (c.commune) poi.commune = c.commune;
      return poi;
    });
    out[s.uic] = pois;
    total += pois.length;
  }

  console.log(`\n📊 Gares avec camping : ${Object.keys(out).length} — ${total} campings (${rated} classés)`);

  // 4. Écrire le fichier généré
  const entries = Object.entries(out)
    .map(([uic, pois]) => `  "${uic}": ${JSON.stringify(pois)},`)
    .join('\n');
  const header = `// AUTO-GÉNÉRÉ — campings rattachés aux gares (DATAtourisme, rayon ${RADIUS_KM} km à vol d'oiseau) — ${new Date().toISOString().slice(0, 10)}\n` +
    `// NE PAS ÉDITER À LA MAIN. Régénérer : node scripts/generate-campings.js (voir scripts/README.md)\n` +
    `// Étoiles via Classements_du_POI ; ${DATATOURISME_URL}\n` +
    `import { TaggedPoi } from '../types';\n\nexport const generatedCampings: Record<string, TaggedPoi[]> = {\n`;
  fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'campingsGenerated.ts'), header + entries + '\n};\n');
  console.log('\n✅ Écrit : src/data/campingsGenerated.ts');
}

main().catch((e) => { console.error(e); process.exit(1); });
