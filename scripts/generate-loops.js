#!/usr/bin/env node
/**
 * Track B — boucles SUGGÉRÉES générées depuis le réseau de chemins OSM via GraphHopper local
 * (`algorithm=round_trip`), au build, embarquées (zéro API runtime). Donne des boucles même là où il
 * n'existe aucun itinéraire balisé (approche Komoot/Trail Router).
 *
 * Prérequis : GraphHopper tourne en local (profils foot+bike, round_trip) → http://localhost:8989.
 * Stratégie : COMBLEMENT DE LACUNES — on ne génère que pour les gares ayant peu de tracés d'un mode
 * (MIN_EXISTING), pour borner le nombre d'appels (le round_trip flexible est lent).
 *
 *   node scripts/generate-loops.js [--limit N] [--min 5] [--gh http://localhost:8989]
 *   puis: node scripts/generate-waypoints.js && npm run build-content
 */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const { estimateMinutes } = require('./lib/elevation');

const FILE = path.join(__dirname, '..', 'src', 'data', 'trailsGenerated.ts');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
const LIMIT = parseInt(arg('--limit', 'Infinity'), 10);
const MIN_EXISTING = parseInt(arg('--min', '5'), 10);   // gares avec < MIN tracés du mode → on génère
const GH = arg('--gh', 'http://localhost:8989');
const DIST = { foot: [8000, 14000], bike: [25000, 45000] }; // distances cibles (m) par mode
const SEEDS = [1];                                          // graines round_trip (variété)
const TOP_GEN = { foot: 4, bike: 4 };                      // max boucles générées gardées /gare/mode

// Encodeur polyligne précision 6 (compatible decodePolyline6 de l'app).
function encNum(num) { let s = num < 0 ? ~(num << 1) : num << 1, o = ''; while (s >= 0x20) { o += String.fromCharCode((0x20 | (s & 0x1f)) + 63); s >>= 5; } return o + String.fromCharCode(s + 63); }
function encodePolyline6(pts) { let la = 0, lo = 0, o = ''; for (const [lat, lon] of pts) { const y = Math.round(lat * 1e6), x = Math.round(lon * 1e6); o += encNum(y - la) + encNum(x - lo); la = y; lo = x; } return o; }

function ghRoundTrip(lat, lon, profile, distance, seed) {
  const url = `${GH}/route?profile=${profile}&algorithm=round_trip&point=${lat},${lon}` +
    `&round_trip.distance=${distance}&round_trip.seed=${seed}&points_encoded=false&elevation=true&instructions=false&ch.disable=true`;
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let d = ''; res.on('data', (c) => (d += c));
      res.on('end', () => { try { const j = JSON.parse(d); resolve(j.paths && j.paths[0] ? j.paths[0] : null); } catch { resolve(null); } });
    }).on('error', () => resolve(null));
  });
}

function loadStations() {
  const raw = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'allStations.ts'), 'utf8');
  return [...raw.matchAll(/id:\s*(\d+),\s*name:\s*"([^"]+)",\s*sncf_id:\s*"([^"]+)",\s*lat:\s*([\d.]+),\s*lon:\s*([\-\d.]+)/g)]
    .map((m) => { const u = m[3].match(/(\d{8})/); return { name: m[2], uic: u ? u[1] : null, lat: +m[4], lon: +m[5] }; })
    .filter((s) => s.uic);
}

async function main() {
  const src = fs.readFileSync(FILE, 'utf8');
  const head = src.slice(0, src.indexOf('{', src.indexOf('generatedTrails')));
  const data = JSON.parse(src.slice(src.indexOf('{', src.indexOf('generatedTrails')), src.lastIndexOf('}') + 1));

  let stations = loadStations();
  // Filtre bbox optionnel (--bbox minLon,minLat,maxLon,maxLat) : ne router que les gares d'une région
  // (utile quand GraphHopper n'a importé qu'un PBF régional).
  const bboxArg = arg('--bbox', null);
  if (bboxArg) {
    const [w, s, e, n] = bboxArg.split(',').map(Number);
    stations = stations.filter((st) => st.lon >= w && st.lon <= e && st.lat >= s && st.lat <= n);
    console.log(`📍 ${stations.length} gares dans la bbox`);
  }
  if (isFinite(LIMIT)) stations = stations.slice(0, LIMIT);

  let calls = 0, added = 0, gares = 0;
  for (const s of stations) {
    const existing = data[s.uic] || [];
    for (const mode of ['foot', 'bike']) {
      const tmode = mode === 'foot' ? 'walk' : 'bike';
      const have = existing.filter((t) => t.mode === tmode && !t.generated).length;
      if (have >= MIN_EXISTING) continue; // assez de tracés balisés → pas besoin de combler
      const loops = [];
      for (const dist of DIST[mode]) for (const seed of SEEDS) {
        calls++;
        const p = await ghRoundTrip(s.lat, s.lon, mode, dist, seed);
        if (!p || !p.points || !p.points.coordinates) continue;
        const pts = p.points.coordinates.map(([lon, lat]) => [Math.round(lat * 1e6) / 1e6, Math.round(lon * 1e6) / 1e6]);
        if (pts.length < 2) continue;
        const km = Math.round((p.distance / 1000) * 10) / 10;
        const ascent = Math.round(p.ascend || 0), descent = Math.round(p.descend || 0);
        loops.push({
          name: `Boucle ${km} km depuis ${s.name}`, mode: tmode, loop: true, km,
          minutes: estimateMinutes(tmode, km, ascent), accessKm: 0, ascent, descent,
          activity: mode === 'foot' ? 'hiking' : 'bike', generated: true,
          geom: encodePolyline6(pts),
        });
      }
      // Dédup par km arrondi (évite quasi-doublons), garde TOP_GEN.
      const seen = new Set(); const keep = [];
      for (const l of loops.sort((a, b) => a.km - b.km)) { const k = Math.round(l.km); if (seen.has(k)) continue; seen.add(k); keep.push(l); if (keep.length >= TOP_GEN[mode]) break; }
      if (keep.length) { data[s.uic] = [...(data[s.uic] || []), ...keep]; added += keep.length; }
    }
    if (data[s.uic] && data[s.uic].some((t) => t.generated)) gares++;
    if (calls % 200 === 0) console.log(`  ${calls} appels GH · ${added} boucles · ${gares} gares`);
  }

  fs.writeFileSync(FILE, head + JSON.stringify(data) + ';\n');
  console.log(`✅ ${added} boucles générées (${gares} gares comblées, ${calls} appels) · réécrit trailsGenerated.ts`);
  console.log('➡️  Lance : node scripts/generate-waypoints.js && npm run build-content');
}

main();
