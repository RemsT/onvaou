'use strict';
/**
 * Échantillonnage d'altitude SRTM 30 m depuis les tuiles publiques AWS « skadi » (sans clé) :
 * https://s3.amazonaws.com/elevation-tiles-prod/skadi/<Nxx>/<NxxEyyy>.hgt.gz
 * Tuiles 1°×1°, SRTM1 = 3601×3601 entiers int16 big-endian. Téléchargées à la demande et mises en
 * cache local (build-time uniquement ; AUCUN appel au runtime de l'app).
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const https = require('https');

const SIZE = 3601;                 // SRTM1 (30 m)
const VOID = -32768;               // valeur « pas de donnée »
const CACHE = process.env.SRTM_CACHE || '/tmp/srtm';

const tiles = new Map();           // name -> Int16Array | null (null = indisponible/océan)

function tileName(lat, lon) {
  const la = Math.floor(lat), lo = Math.floor(lon);
  const ns = la >= 0 ? 'N' : 'S';
  const ew = lo >= 0 ? 'E' : 'W';
  const sla = String(Math.abs(la)).padStart(2, '0');
  const slo = String(Math.abs(lo)).padStart(3, '0');
  return `${ns}${sla}${ew}${slo}`;
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode === 404) { file.close(); fs.unlink(dest, () => {}); return resolve(false); }
      if (res.statusCode !== 200) { file.close(); fs.unlink(dest, () => {}); return reject(new Error(`HTTP ${res.statusCode}`)); }
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(true)));
    }).on('error', (e) => { fs.unlink(dest, () => {}); reject(e); });
  });
}

async function loadTile(name) {
  if (tiles.has(name)) return tiles.get(name);
  if (!fs.existsSync(CACHE)) fs.mkdirSync(CACHE, { recursive: true });
  const hgt = path.join(CACHE, `${name}.hgt`);
  if (!fs.existsSync(hgt)) {
    const gz = path.join(CACHE, `${name}.hgt.gz`);
    const url = `https://s3.amazonaws.com/elevation-tiles-prod/skadi/${name.slice(0, 3)}/${name}.hgt.gz`;
    const ok = await download(url, gz);
    if (!ok) { tiles.set(name, null); return null; }       // tuile inexistante (océan)
    fs.writeFileSync(hgt, zlib.gunzipSync(fs.readFileSync(gz)));
    fs.unlinkSync(gz);
  }
  const buf = fs.readFileSync(hgt);
  // int16 big-endian → Int16Array (on lit via DataView pour l'endianness)
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const arr = new Int16Array(SIZE * SIZE);
  for (let i = 0; i < arr.length; i++) arr[i] = dv.getInt16(i * 2, false);
  tiles.set(name, arr);
  return arr;
}

function sampleTile(arr, lat, lon) {
  // Position fractionnaire dans la tuile (ligne 0 = haut = lat+1).
  const latF = lat - Math.floor(lat);
  const lonF = lon - Math.floor(lon);
  const row = (1 - latF) * (SIZE - 1);
  const col = lonF * (SIZE - 1);
  const r0 = Math.floor(row), c0 = Math.floor(col);
  const r1 = Math.min(r0 + 1, SIZE - 1), c1 = Math.min(c0 + 1, SIZE - 1);
  const v = (r, c) => arr[r * SIZE + c];
  const q11 = v(r0, c0), q12 = v(r0, c1), q21 = v(r1, c0), q22 = v(r1, c1);
  if ([q11, q12, q21, q22].some((q) => q === VOID)) {
    // Repli : moyenne des valeurs valides, sinon null.
    const ok = [q11, q12, q21, q22].filter((q) => q !== VOID);
    return ok.length ? ok.reduce((a, b) => a + b, 0) / ok.length : null;
  }
  const fr = row - r0, fc = col - c0;
  const top = q11 * (1 - fc) + q12 * fc;
  const bot = q21 * (1 - fc) + q22 * fc;
  return top * (1 - fr) + bot * fr;
}

/** Altitude (m) en (lat,lon), ou null si indisponible. Télécharge/charge la tuile au besoin. */
async function elevationAt(lat, lon) {
  const arr = await loadTile(tileName(lat, lon));
  if (!arr) return null;
  const e = sampleTile(arr, lat, lon);
  return e == null ? null : e;
}

/** Échantillonne une liste de points [[lat,lon],…] → [altitudes] (null si indispo). */
async function elevationsAlong(points) {
  const out = [];
  for (const [lat, lon] of points) out.push(await elevationAt(lat, lon));
  return out;
}

module.exports = { elevationAt, elevationsAlong, tileName };
