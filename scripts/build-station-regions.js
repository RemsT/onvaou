#!/usr/bin/env node
/**
 * Assigne chaque gare (allStations.ts, lat/lon) à sa RÉGION métropolitaine (point-dans-polygone sur
 * les contours data.gouv) → src/data/stationRegions.ts. Sert aux packs régionaux (gare→pack).
 *
 * Entrée : /tmp/regions.geojson (france-geojson, 13 régions). Sortie : src/data/stationRegions.ts.
 *   node scripts/build-station-regions.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const GEO = '/tmp/regions.geojson';
const OUT = path.join(__dirname, '..', 'src', 'data', 'stationRegions.ts');

// code INSEE → slug (nom de pack) + nom affiché.
const SLUG = {
  '11': ['ile-de-france', 'Île-de-France'],
  '24': ['centre-val-de-loire', 'Centre-Val de Loire'],
  '27': ['bourgogne-franche-comte', 'Bourgogne-Franche-Comté'],
  '28': ['normandie', 'Normandie'],
  '32': ['hauts-de-france', 'Hauts-de-France'],
  '44': ['grand-est', 'Grand Est'],
  '52': ['pays-de-la-loire', 'Pays de la Loire'],
  '53': ['bretagne', 'Bretagne'],
  '75': ['nouvelle-aquitaine', 'Nouvelle-Aquitaine'],
  '76': ['occitanie', 'Occitanie'],
  '84': ['auvergne-rhone-alpes', 'Auvergne-Rhône-Alpes'],
  '93': ['provence-alpes-cote-d-azur', "Provence-Alpes-Côte d'Azur"],
  '94': ['corse', 'Corse'],
};

// Ray-casting sur un anneau [[lon,lat],…].
function inRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if (((yi > lat) !== (yj > lat)) && (lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
// Polygon = [outerRing, ...holes] ; on teste l'anneau extérieur (les régions n'ont pas de trous utiles).
function inPolygon(lon, lat, poly) { return inRing(lon, lat, poly[0]); }
function inFeature(lon, lat, geom) {
  if (geom.type === 'Polygon') return inPolygon(lon, lat, geom.coordinates);
  if (geom.type === 'MultiPolygon') return geom.coordinates.some((p) => inPolygon(lon, lat, p));
  return false;
}

function main() {
  if (!fs.existsSync(GEO)) { console.error(`❌ ${GEO} introuvable (télécharger regions.geojson)`); process.exit(1); }
  const regions = JSON.parse(fs.readFileSync(GEO, 'utf8')).features
    .map((f) => ({ code: f.properties.code, geom: f.geometry }))
    .filter((r) => SLUG[r.code]);
  // Bbox par feature pour court-circuiter le ray-casting.
  for (const r of regions) {
    let minLon = 180, minLat = 90, maxLon = -180, maxLat = -90;
    const polys = r.geom.type === 'Polygon' ? [r.geom.coordinates] : r.geom.coordinates;
    for (const p of polys) for (const [lon, lat] of p[0]) { if (lon < minLon) minLon = lon; if (lon > maxLon) maxLon = lon; if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat; }
    r.bbox = [minLon, minLat, maxLon, maxLat];
  }

  const raw = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'allStations.ts'), 'utf8');
  const stations = [...raw.matchAll(/sncf_id:\s*"([^"]+)",\s*lat:\s*([\d.]+),\s*lon:\s*([\-\d.]+)/g)]
    .map((m) => { const u = m[1].match(/(\d{8})/); return u ? { uic: u[1], lat: +m[2], lon: +m[3] } : null; })
    .filter(Boolean);

  const map = {};
  let assigned = 0;
  for (const s of stations) {
    for (const r of regions) {
      const [a, b, c, d] = r.bbox;
      if (s.lon < a || s.lon > c || s.lat < b || s.lat > d) continue;
      if (inFeature(s.lon, s.lat, r.geom)) { map[s.uic] = SLUG[r.code][0]; assigned++; break; }
    }
  }
  console.log(`📍 ${assigned}/${stations.length} gares assignées à une région`);
  const counts = {};
  for (const v of Object.values(map)) counts[v] = (counts[v] || 0) + 1;
  console.log('Par région :', JSON.stringify(counts));

  const regionsArr = Object.entries(SLUG).map(([code, [key, name]]) => ({ key, name }));
  const header = `// AUTO-GÉNÉRÉ par scripts/build-station-regions.js — NE PAS ÉDITER.\n` +
    `// Gare (UIC) → région (slug de pack). Sert aux packs régionaux hors-ligne.\n\n` +
    `export interface RegionInfo { key: string; name: string; }\n` +
    `export const REGIONS: RegionInfo[] = ${JSON.stringify(regionsArr, null, 0)};\n\n` +
    `export const stationRegions: Record<string, string> = `;
  fs.writeFileSync(OUT, header + JSON.stringify(map) + ';\n');
  console.log(`✅ Écrit ${path.relative(path.join(__dirname, '..'), OUT)}`);
}

main();
