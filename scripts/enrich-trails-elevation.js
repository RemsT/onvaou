#!/usr/bin/env node
/**
 * Phase 2 — enrichit src/data/trailsGenerated.ts avec l'élévation (SRTM 30 m, hors-ligne au build).
 *
 * Pour chaque tracé : décode la geom, DENSIFIE (~100 m) pour un D+ réaliste, échantillonne l'altitude
 * (scripts/lib/srtm.js), calcule D+/D- avec FILTRE anti-bruit, un profil downsamplé, recalcule la
 * durée (Naismith) et, à défaut de sac_scale, un niveau d'effort. Réécrit le fichier (idempotent).
 *
 * Réexécuter après generate-trails. Puis `npm run build-content`.
 *   node scripts/enrich-trails-elevation.js [--limit N]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { elevationsAlong } = require('./lib/srtm');
const { decodePolyline6, ascentDescent, downsampleProfile, estimateMinutes, effortLevel } = require('./lib/elevation');

const FILE = path.join(__dirname, '..', 'src', 'data', 'trailsGenerated.ts');
const STEP_KM = 0.1;     // densification ~100 m (capte les montées entre sommets de la polyligne)
const THRESHOLD_M = 10;  // filtre anti-bruit SRTM 30 m pour le D+
const MAX_PTS = 2000;    // garde-fou par tracé
const LIMIT = (() => { const i = process.argv.indexOf('--limit'); return i >= 0 ? parseInt(process.argv[i + 1], 10) : Infinity; })();

function haversine(a, b, c, d) {
  const R = 6371, dLat = ((c - a) * Math.PI) / 180, dLon = ((d - b) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a * Math.PI) / 180) * Math.cos((c * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function densify(points, stepKm) {
  if (points.length < 2) return points;
  const out = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const [la0, lo0] = points[i - 1], [la1, lo1] = points[i];
    const n = Math.max(1, Math.floor(haversine(la0, lo0, la1, lo1) / stepKm));
    for (let j = 1; j <= n; j++) { const t = j / n; out.push([la0 + (la1 - la0) * t, lo0 + (lo1 - lo0) * t]); }
    if (out.length > MAX_PTS) break;
  }
  return out;
}

async function main() {
  const src = fs.readFileSync(FILE, 'utf8');
  const start = src.indexOf('{', src.indexOf('generatedTrails'));
  const end = src.lastIndexOf('}');
  const data = JSON.parse(src.slice(start, end + 1));

  const uics = Object.keys(data).slice(0, LIMIT === Infinity ? undefined : LIMIT);
  let total = 0, done = 0, withAsc = 0;
  for (const u of uics) total += data[u].length;
  console.log(`⛰️  Élévation SRTM sur ${total} tracés (${uics.length} gares)…`);

  for (const uic of uics) {
    for (const t of data[uic]) {
      const pts = densify(decodePolyline6(t.geom), STEP_KM);
      const elevs = await elevationsAlong(pts);
      const valid = elevs.filter((e) => e != null);
      if (valid.length >= 2) {
        const { ascent, descent } = ascentDescent(valid, THRESHOLD_M);
        t.ascent = ascent;
        t.descent = descent;
        t.profile = downsampleProfile(valid, 24);
        t.minutes = estimateMinutes(t.mode, t.km, ascent);
        if (!t.difficulty) t.difficulty = effortLevel(t.mode, t.km, ascent);
        if (ascent > 0) withAsc++;
      }
      done++;
      if (done % 500 === 0) console.log(`  ${done}/${total}…`);
    }
  }

  const header = src.slice(0, start);
  fs.writeFileSync(FILE, header + JSON.stringify(data) + ';\n');
  console.log(`✅ ${done} tracés enrichis (${withAsc} avec D+ > 0) · réécrit ${path.relative(path.join(__dirname, '..'), FILE)}`);
  console.log('➡️  Lance maintenant : npm run build-content');
}

main().catch((e) => { console.error(e); process.exit(1); });
