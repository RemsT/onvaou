#!/usr/bin/env node
/**
 * Phase 3B — POIs « le long du tracé » : eau, points de vue, sommets, abris à ≤ BUFFER_M d'un tracé.
 * Source : Overpass (OSM, ODbL), interrogé par tuiles UNIQUEMENT là où il y a des sorties (build-time,
 * zéro appel runtime). Écrit `waypoints[]` sur chaque Trail de src/data/trailsGenerated.ts.
 *
 *   node scripts/generate-waypoints.js   (puis: npm run build-content)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');
const { decodePolyline6 } = require('./lib/elevation');

const FILE = path.join(__dirname, '..', 'src', 'data', 'trailsGenerated.ts');
const BUFFER_KM = 0.3;     // distance max POI ↔ tracé
const TILE = 1;            // tuile Overpass 1°×1°, seulement celles contenant un tracé
const CAP = 6;             // waypoints gardés par tracé
const CELL = 0.005;        // grille spatiale (~500 m) pour le matching
const OVERPASS = 'https://overpass-api.de/api/interpreter';

function haversine(a, b, c, d) {
  const R = 6371, dLat = ((c - a) * Math.PI) / 180, dLon = ((d - b) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a * Math.PI) / 180) * Math.cos((c * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function poiType(tags) {
  if (tags.natural === 'peak') return 'summit';
  if (tags.tourism === 'viewpoint') return 'viewpoint';
  if (tags.amenity === 'drinking_water' || tags.natural === 'spring') return 'water';
  if (tags.amenity === 'shelter') return 'shelter';
  return null;
}

function overpass(bbox) {
  const [s, w, n, e] = bbox;
  const q = `[out:json][timeout:180];(` +
    `node[natural=peak](${s},${w},${n},${e});` +
    `node[tourism=viewpoint](${s},${w},${n},${e});` +
    `node[amenity=drinking_water](${s},${w},${n},${e});` +
    `node[natural=spring](${s},${w},${n},${e});` +
    `node[amenity=shelter](${s},${w},${n},${e});` +
    `);out;`;
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'ONvaOU/2.0 (waypoints build)', 'Accept': 'application/json' };
    const req = https.request(OVERPASS, { method: 'POST', headers }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => { try { resolve(JSON.parse(data).elements || []); } catch (err) { reject(err); } });
    });
    req.on('error', reject);
    req.write('data=' + encodeURIComponent(q));
    req.end();
  });
}

async function main() {
  const src = fs.readFileSync(FILE, 'utf8');
  const start = src.indexOf('{', src.indexOf('generatedTrails'));
  const data = JSON.parse(src.slice(start, src.lastIndexOf('}') + 1));

  // 1) Décoder les tracés, calculer le km cumulé par point, indexer dans une grille spatiale.
  const grid = new Map();
  const key = (la, lo) => `${Math.round(la / CELL)},${Math.round(lo / CELL)}`;
  const tilesNeeded = new Set();
  let trailCount = 0;
  for (const uic of Object.keys(data)) {
    for (const t of data[uic]) {
      const pts = decodePolyline6(t.geom);
      t.__pts = pts;
      let cum = 0; const cums = [0];
      for (let i = 1; i < pts.length; i++) { cum += haversine(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]); cums.push(cum); }
      t.__cums = cums;
      t.__cand = [];
      for (let i = 0; i < pts.length; i++) {
        const [la, lo] = pts[i];
        const k = key(la, lo);
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k).push({ t, i, la, lo });
        tilesNeeded.add(`${Math.floor(la / TILE)},${Math.floor(lo / TILE)}`);
      }
      trailCount++;
    }
  }
  console.log(`📍 ${trailCount} tracés · ${tilesNeeded.size} tuiles Overpass à interroger`);

  // 2) Interroger Overpass tuile par tuile et matcher les POIs au tracé le plus proche.
  const span = Math.ceil(BUFFER_KM / (CELL * 111)) + 1;
  let tileNo = 0, poiMatched = 0;
  for (const tk of tilesNeeded) {
    tileNo++;
    const [ti, tj] = tk.split(',').map(Number);
    let els;
    try { els = await overpass([ti, tj, ti + TILE, tj + TILE]); }
    catch (e) { console.warn(`  tuile ${tileNo}/${tilesNeeded.size} échec (${e.message}) — réessai`); await sleep(5000); try { els = await overpass([ti, tj, ti + TILE, tj + TILE]); } catch { els = []; } }
    for (const el of els) {
      const type = poiType(el.tags || {});
      if (!type || el.lat == null) continue;
      const ci = Math.round(el.lat / CELL), cj = Math.round(el.lon / CELL);
      let best = null;
      for (let di = -span; di <= span; di++) for (let dj = -span; dj <= span; dj++) {
        const bucket = grid.get(`${ci + di},${cj + dj}`); if (!bucket) continue;
        for (const p of bucket) {
          const dist = haversine(el.lat, el.lon, p.la, p.lo);
          if (dist <= BUFFER_KM && (!best || dist < best.dist)) best = { dist, p };
        }
      }
      if (best) {
        const name = (el.tags.name) || (type === 'water' ? 'Point d\'eau' : type === 'summit' ? 'Sommet' : type === 'viewpoint' ? 'Point de vue' : 'Abri');
        best.p.t.__cand.push({ name, type, km: Math.round(best.p.t.__cums[best.p.i] * 10) / 10, lat: +el.lat.toFixed(5), lon: +el.lon.toFixed(5), dist: best.dist });
        poiMatched++;
      }
    }
    if (tileNo % 10 === 0) console.log(`  ${tileNo}/${tilesNeeded.size} tuiles · ${poiMatched} POIs rattachés`);
    await sleep(1200); // politesse Overpass
  }

  // 3) Finaliser : dédup (nom+type), tri par km, cap, nettoyage des champs transitoires.
  let withWp = 0;
  for (const uic of Object.keys(data)) {
    for (const t of data[uic]) {
      const seen = new Set();
      const wp = t.__cand
        .sort((a, b) => a.dist - b.dist)
        .filter((w) => { const k = w.type + '|' + w.name; if (seen.has(k)) return false; seen.add(k); return true; })
        .sort((a, b) => a.km - b.km)
        .slice(0, CAP)
        .map(({ dist, ...w }) => w);
      if (wp.length) { t.waypoints = wp; withWp++; }
      delete t.__pts; delete t.__cums; delete t.__cand;
    }
  }

  fs.writeFileSync(FILE, src.slice(0, start) + JSON.stringify(data) + ';\n');
  console.log(`✅ ${poiMatched} POIs rattachés · ${withWp} tracés avec waypoints · réécrit trailsGenerated.ts`);
  console.log('➡️  Lance : npm run build-content');
}

main().catch((e) => { console.error(e); process.exit(1); });
