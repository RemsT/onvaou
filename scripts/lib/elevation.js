'use strict';
/**
 * Maths d'élévation (Phase 2) — pures, sans I/O, testables (require depuis Node ET les tests Jest).
 * Utilisé par scripts/enrich-trails-elevation.js.
 */

/** Décode une polyligne encodée précision 6 → [[lat,lon],…] (miroir de decodePolyline6 côté app). */
function decodePolyline6(str) {
  const coords = [];
  let index = 0, lat = 0, lng = 0;
  while (index < str.length) {
    let result = 0, shift = 0, b;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0; shift = 0;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push([lat / 1e6, lng / 1e6]);
  }
  return coords;
}

/**
 * Dénivelé positif/négatif avec FILTRE anti-bruit (seuil en m) : indispensable avec SRTM (bruité),
 * sinon la somme des micro-variations SURESTIME fortement le D+. On ne compte un mouvement que
 * lorsqu'il dépasse `threshold` depuis la dernière référence retenue.
 */
function ascentDescent(elevs, threshold = 7) {
  const clean = elevs.filter((e) => typeof e === 'number' && isFinite(e));
  if (clean.length < 2) return { ascent: 0, descent: 0 };
  let ascent = 0, descent = 0, ref = clean[0];
  for (const e of clean) {
    const d = e - ref;
    if (d >= threshold) { ascent += d; ref = e; }
    else if (d <= -threshold) { descent += -d; ref = e; }
  }
  return { ascent: Math.round(ascent), descent: Math.round(descent) };
}

/** Réduit un profil d'altitudes à ~`n` points (pour l'affichage d'un mini-graphe). */
function downsampleProfile(elevs, n = 24) {
  const clean = elevs.filter((e) => typeof e === 'number' && isFinite(e));
  if (clean.length <= n) return clean.map((e) => Math.round(e));
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(Math.round(clean[Math.round((i / (n - 1)) * (clean.length - 1))]));
  }
  return out;
}

/** Durée corrigée par le dénivelé (Naismith/Tobler) — miroir de src/utils/effort.ts. */
function estimateMinutes(mode, km, ascentM) {
  const flatKmh = mode === 'bike' ? 15 : 4;
  const minPerM = mode === 'bike' ? 60 / 500 : 60 / 600;
  const flat = (km / flatKmh) * 60;
  const climb = ascentM && ascentM > 0 ? ascentM * minPerM : 0;
  return Math.round(flat + climb);
}

/**
 * Niveau d'effort (faute de sac_scale OSM) dérivé de la distance + du D+.
 * Score « km-effort » ≈ km + D+/100 (≈ 1 unité par 100 m de montée). Seuils selon le mode.
 */
function effortLevel(mode, km, ascentM) {
  const score = km + (ascentM > 0 ? ascentM : 0) / 100;
  const t = mode === 'bike' ? [25, 50, 80] : [8, 16, 25];
  if (score < t[0]) return 'Facile';
  if (score < t[1]) return 'Modéré';
  if (score < t[2]) return 'Soutenu';
  return 'Difficile';
}

module.exports = { decodePolyline6, ascentDescent, downsampleProfile, estimateMinutes, effortLevel };
