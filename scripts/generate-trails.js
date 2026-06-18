#!/usr/bin/env node
/**
 * Génère les « sorties à la journée » (randonnée à pied / tour à vélo) rattachées aux gares,
 * 100 % hors-ligne et SANS appel API au runtime (toutes les données sont pré-calculées et
 * embarquées). Calqué sur scripts/generate-tags.js (même grille spatiale + haversine).
 *
 * Entrée : un GeoJSON FeatureCollection de tracés (LineString / MultiLineString) :
 *   - Randonnée → data.gouv « Itinéraires de randonnée dans OpenStreetMap »
 *     https://www.data.gouv.fr/datasets/itineraires-de-randonnee-dans-openstreetmap (ODbL)
 *   - Vélo → ON3V « Véloroutes » (data.gouv) + relations OSM route=bicycle/mtb (boucles VTT)
 *
 * Sortie : src/data/trailsGenerated.ts — Record<uic, Trail[]>.
 *   Trail = { name, mode, loop, km, minutes, accessKm, geom } où `geom` est une polyligne
 *   ENCODÉE précision 6 (décodable par decodePolyline6 de src/services/routingService.ts).
 *
 * Association gare ↔ tracé :
 *   - Boucle (départ ≈ arrivée) → rattachée si un point du tracé est ≤ ACCESS_MAX_KM[mode] d'une gare.
 *   - Linéaire → priorité GARE → GARE : une extrémité ≤ seuil d'une gare ET l'autre ≤ seuil d'une AUTRE.
 *
 * Usage :
 *   node scripts/generate-trails.js --mode walk --in /tmp/rando.geojson
 *   node scripts/generate-trails.js --mode bike --in /tmp/veloroutes.geojson [--limit 500]
 *
 * ⚠️ Étape de build manuelle : télécharger le GeoJSON source avant de lancer (gros fichiers).
 * Attribution ODbL « © contributeurs OpenStreetMap » obligatoire dans l'app.
 */
'use strict';
const fs = require('fs');
const path = require('path');

// ── Args ──────────────────────────────────────────────────────────────────────
const argMode = (() => { const i = process.argv.indexOf('--mode'); return i >= 0 ? process.argv[i + 1] : 'walk'; })();
const argIn = (() => { const i = process.argv.indexOf('--in'); return i >= 0 ? process.argv[i + 1] : null; })();
const LIMIT = (() => { const i = process.argv.indexOf('--limit'); return i >= 0 ? parseInt(process.argv[i + 1], 10) : Infinity; })();
const MODE = argMode === 'bike' ? 'bike' : 'walk';

// ── Réglages ──────────────────────────────────────────────────────────────────
const ACCESS_MAX_KM = { walk: 2, bike: 4 };       // accès gare → tracé (vol d'oiseau)
const SPEED_KMH = { walk: 4, bike: 15 };          // vitesse pour la durée estimée
const MIN_KM = { walk: 1, bike: 3 };              // longueur min (sous laquelle on ignore)
const MAX_KM = { walk: 30, bike: 100 };           // longueur max — au-delà, on DÉCOUPE une section
const LOOP_CLOSE_KM = 0.3;                         // extrémités proches ⇒ boucle
// Pour les LINÉAIRES : walk = priorité gare → gare ; bike = rattaché au point le plus proche
// (les longues véloroutes ne passent près que d'UNE gare → on en propose une section roulable).
const LINEAR_VIA_NEAREST = { walk: false, bike: true };
const SIMPLIFY_TOL_M = 25;                          // tolérance Douglas-Peucker (mètres)
// Tracés gardés par gare (après dédup par nom). Vélo = beaucoup pour la variété (« tous les goûts »).
const TOP_TRAILS = { walk: 8, bike: 40 };
const OUT = path.join(__dirname, '..', 'src', 'data', 'trailsGenerated.ts');

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Douglas-Peucker (perpendiculaire en mètres approximée par haversine).
function simplify(points, tolM) {
  if (points.length < 3) return points;
  const tolKm = tolM / 1000;
  const keep = new Array(points.length).fill(false);
  keep[0] = keep[points.length - 1] = true;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let maxD = 0, idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = perpDistKm(points[i], points[s], points[e]);
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > tolKm && idx !== -1) { keep[idx] = true; stack.push([s, idx], [idx, e]); }
  }
  return points.filter((_, i) => keep[i]);
}
function perpDistKm(p, a, b) {
  // distance point p au segment a-b, en km (approximation plane locale)
  const toXY = (q) => [q[1] * Math.cos((a[0] * Math.PI) / 180) * 111.32, q[0] * 110.57];
  const [px, py] = toXY(p), [ax, ay] = toXY(a), [bx, by] = toXY(b);
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy || 1e-9;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

// Encodeur polyligne précision 6 (compatible decodePolyline6 de routingService.ts).
function encodeNum(num) {
  let sgn = num << 1;
  if (num < 0) sgn = ~sgn;
  let s = '';
  while (sgn >= 0x20) { s += String.fromCharCode((0x20 | (sgn & 0x1f)) + 63); sgn >>= 5; }
  s += String.fromCharCode(sgn + 63);
  return s;
}
function encodePolyline6(points) {
  let lastLat = 0, lastLon = 0, out = '';
  for (const [lat, lon] of points) {
    const la = Math.round(lat * 1e6), lo = Math.round(lon * 1e6);
    out += encodeNum(la - lastLat);
    out += encodeNum(lo - lastLon);
    lastLat = la; lastLon = lo;
  }
  return out;
}

function lengthKm(points) {
  let km = 0;
  for (let i = 1; i < points.length; i++) km += haversine(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1]);
  return km;
}

function featureLines(geom) {
  // Renvoie une liste de tracés [ [lat,lon], ... ] depuis LineString/MultiLineString (GeoJSON = [lon,lat]).
  if (!geom) return [];
  if (geom.type === 'LineString') return [geom.coordinates.map(([lon, lat]) => [lat, lon])];
  if (geom.type === 'MultiLineString') return geom.coordinates.map((l) => l.map(([lon, lat]) => [lat, lon]));
  return [];
}

function main() {
  if (!argIn || !fs.existsSync(argIn)) {
    console.error(`❌ GeoJSON introuvable : ${argIn || '(--in manquant)'}`);
    console.error('Télécharger le GeoJSON source (rando data.gouv / vélo ON3V) puis relancer.');
    process.exit(1);
  }

  // Gares (mêmes regex que generate-tags.js)
  const stationsRaw = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'allStations.ts'), 'utf8');
  const stations = [...stationsRaw.matchAll(/id:\s*(\d+),\s*name:\s*"([^"]+)",\s*sncf_id:\s*"([^"]+)",\s*lat:\s*([\d.]+),\s*lon:\s*([\-\d.]+)/g)]
    .map((m) => { const uic = m[3].match(/(\d{8})/); return { id: +m[1], name: m[2], uic: uic ? uic[1] : null, lat: +m[4], lon: +m[5] }; })
    .filter((s) => s.uic);
  console.log(`📍 ${stations.length} gares chargées · mode=${MODE}`);

  // Index spatial des gares (cellule 0.1° ~11 km)
  const CELL = 0.1;
  const grid = new Map();
  for (const s of stations) {
    const k = `${Math.round(s.lat / CELL)},${Math.round(s.lon / CELL)}`;
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(s);
  }
  const ACCESS = ACCESS_MAX_KM[MODE];
  const cellSpan = Math.ceil(ACCESS / (CELL * 111)) + 1;
  const nearestStation = (lat, lon) => {
    const ci = Math.round(lat / CELL), cj = Math.round(lon / CELL);
    let best = null, bestD = Infinity;
    for (let di = -cellSpan; di <= cellSpan; di++) for (let dj = -cellSpan; dj <= cellSpan; dj++) {
      const bucket = grid.get(`${ci + di},${cj + dj}`); if (!bucket) continue;
      for (const s of bucket) { const d = haversine(lat, lon, s.lat, s.lon); if (d < bestD) { bestD = d; best = s; } }
    }
    return bestD <= ACCESS ? { station: best, km: bestD } : null;
  };

  // Gare la plus proche d'UN point QUELCONQUE du tracé + index de ce point (la « jonction »).
  const nearestStationAlong = (pts) => {
    let best = null;
    for (let i = 0; i < pts.length; i++) {
      const n = nearestStation(pts[i][0], pts[i][1]);
      if (n && (!best || n.km < best.km)) best = { station: n.station, km: n.km, index: i };
    }
    return best;
  };

  // Section contiguë d'au plus maxKm depuis la jonction (vers l'avant, complétée vers l'arrière).
  const clipSection = (pts, joinIdx, maxKm) => {
    const fwd = [pts[joinIdx]];
    let acc = 0;
    for (let i = joinIdx + 1; i < pts.length && acc < maxKm; i++) {
      acc += haversine(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
      fwd.push(pts[i]);
    }
    if (acc >= maxKm * 0.9) return fwd;
    const back = [];
    for (let i = joinIdx - 1; i >= 0 && acc < maxKm; i--) {
      acc += haversine(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
      back.unshift(pts[i]);
    }
    return [...back, ...fwd];
  };

  const geojson = JSON.parse(fs.readFileSync(argIn, 'utf8'));
  const features = (geojson.features || []).slice(0, LIMIT);
  console.log(`🔄 ${features.length} tracés à traiter…`);

  const byStation = new Map(); // uic -> Trail[]
  const push = (uic, trail) => {
    const list = byStation.get(uic) || byStation.set(uic, []).get(uic);
    list.push(trail);
  };

  // Lien « plus d'infos » : site officiel/URL de la relation si présent, sinon page OSM de la relation.
  const urlFor = (props) => {
    if (!props) return '';
    const direct = props.website || props.url || props['contact:website'] || props.wikipedia;
    if (direct && /^https?:\/\//.test(direct)) return direct;
    if (props.wikipedia) return 'https://fr.wikipedia.org/wiki/' + encodeURIComponent(String(props.wikipedia).replace(/^fr:/, ''));
    const osmId = props.osm_id || props['@id'] || props.id;
    if (osmId) return `https://www.openstreetmap.org/relation/${String(osmId).replace(/\D/g, '')}`;
    return '';
  };

  const MINKM = MIN_KM[MODE], MAXKM = MAX_KM[MODE];
  const addTrail = (uic, usePts, loop, accessKm, toUic) => {
    const k = lengthKm(usePts);
    if (k < MINKM) return;
    const geom = encodePolyline6(usePts.map(([la, lo]) => [Math.round(la * 1e6) / 1e6, Math.round(lo * 1e6) / 1e6]));
    push(uic, {
      name: addTrail._name, mode: MODE, loop, km: +k.toFixed(1),
      minutes: Math.round((k / SPEED_KMH[MODE]) * 60), accessKm: +accessKm.toFixed(1),
      ...(toUic ? { toUic } : {}), ...(addTrail._url ? { url: addTrail._url } : {}), geom,
    });
    kept++;
  };

  // Noms de circuits-jeux / parcours non-randonnée à exclure (pas de vraies sorties à pied/vélo).
  const EXCLUDE_NAME = /chasse au tr[eé]sor|tr[eé]sors? cach|jeu de piste|g[eé]ocach|escape|enqu[eê]te|rallye|parcours sant[eé]/i;

  let kept = 0;
  for (const f of features) {
    addTrail._name = (f.properties && (f.properties.name || f.properties.nom || f.properties.ref)) || 'Itinéraire';
    if (EXCLUDE_NAME.test(addTrail._name)) continue; // circuit-jeu, pas une rando/un tour vélo
    addTrail._url = urlFor(f.properties);
    for (const raw of featureLines(f.geometry)) {
      if (raw.length < 2) continue;
      const pts = simplify(raw, SIMPLIFY_TOL_M);
      const km = lengthKm(pts);
      if (km < MINKM) continue;
      const start = pts[0], end = pts[pts.length - 1];
      const isLoop = haversine(start[0], start[1], end[0], end[1]) <= LOOP_CLOSE_KM;

      if (isLoop) {
        if (km > MAXKM) continue; // boucle trop longue pour une sortie
        const j = nearestStationAlong(pts);
        if (j) addTrail(j.station.uic, pts, true, j.km);
      } else if (LINEAR_VIA_NEAREST[MODE]) {
        // Vélo : rattacher au point le plus proche ; découper une section ≤ MAXKM si trop long.
        const j = nearestStationAlong(pts);
        if (j) addTrail(j.station.uic, km > MAXKM ? clipSection(pts, j.index, MAXKM) : pts, false, j.km);
      } else {
        // Marche : priorité gare → gare (deux extrémités près de DEUX gares différentes).
        if (km > MAXKM) continue;
        const a = nearestStation(start[0], start[1]);
        const b = nearestStation(end[0], end[1]);
        if (a && b && a.station.uic !== b.station.uic) addTrail(a.station.uic, pts, false, a.km, b.station.uic);
      }
    }
  }

  // FUSION : repartir des tracés déjà présents (autre mode) pour cumuler rando + vélo.
  // On ne supprime QUE les tracés du mode courant (régénération idempotente de ce mode).
  const out = {};
  if (fs.existsSync(OUT)) {
    try {
      const prev = fs.readFileSync(OUT, 'utf8');
      const eq = prev.indexOf('generatedTrails: Record<string, Trail[]> = ');
      const start = prev.indexOf('{', eq);
      const end = prev.lastIndexOf('}');
      if (eq >= 0 && start >= 0 && end > start) {
        const existing = JSON.parse(prev.slice(start, end + 1));
        for (const [uic, list] of Object.entries(existing)) {
          out[uic] = list.filter((t) => t.mode !== MODE); // garde l'autre mode
        }
      }
    } catch { /* fichier vide/stub → on repart à zéro */ }
  }
  // Ajoute les tracés du mode courant : dédup par NOM (évite les segments répétés d'une même
  // véloroute), puis on garde les plus proches jusqu'au plafond du mode (variété « tous les goûts »).
  const cap = TOP_TRAILS[MODE];
  for (const [uic, list] of byStation) {
    list.sort((x, y) => x.accessKm - y.accessKm);
    const seen = new Set();
    const current = [];
    for (const t of list) {
      const key = t.name.toLowerCase().trim();
      if (seen.has(key)) continue;
      seen.add(key);
      current.push(t);
      if (current.length >= cap) break;
    }
    out[uic] = [...(out[uic] || []), ...current];
  }

  const header = `// AUTO-GÉNÉRÉ — sorties randonnée & vélo rattachées aux gares (ODbL © contributeurs OpenStreetMap) — ${new Date().toISOString().slice(0, 10)}\n// NE PAS ÉDITER À LA MAIN. Régénérer : node scripts/generate-trails.js (voir scripts/README.md)\nimport { Trail } from '../types';\n\nexport const generatedTrails: Record<string, Trail[]> = `;
  fs.writeFileSync(OUT, header + JSON.stringify(out) + ';\n');
  console.log(`✅ ${kept} tracés (${MODE}) rattachés · ${Object.keys(out).length} gares au total · écrit ${path.relative(process.cwd(), OUT)}`);
}

main();
