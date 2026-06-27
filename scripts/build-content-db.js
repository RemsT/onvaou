#!/usr/bin/env node
/**
 * Construit la base SQLite « contenu » embarquée (F1) à partir des données générées
 * (stationLabelsGenerated / trailsGenerated / campingsGenerated).
 *
 * But : sortir ces ~9 Mo du bundle JS (où ils sont parsés à CHAQUE lancement → RAM + démarrage)
 * vers un fichier .db interrogé à la demande par code UIC (sync, getAllSync) au runtime.
 *
 * Sortie : assets/content.db (3 tables : labels / trails / campings, 1 ligne par UIC, valeur = JSON).
 * Le runtime copie cet asset puis l'ouvre en lecture seule (cf. contentDatabaseService).
 *
 * Réexécuter après chaque régénération des données : node scripts/build-content-db.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'src', 'data');
const OUT = path.join(ROOT, 'assets', 'content.db');

// Extrait l'objet/dictionnaire exporté d'un fichier *Generated.ts et l'évalue.
// Les .ts générés contiennent un seul littéral `export const X = { … };` ; trails/campings sont du
// JSON pur (JSON.stringify), stationLabels est un littéral JS (clés non quotées) → eval gère les deux.
function readGenerated(file, exportName) {
  const src = fs.readFileSync(path.join(DATA, file), 'utf8');
  const marker = `${exportName}`;
  const eq = src.indexOf('=', src.indexOf(marker));
  const start = src.indexOf('{', eq);
  const end = src.lastIndexOf('}');
  if (eq < 0 || start < 0 || end <= start) throw new Error(`Format inattendu : ${file}`);
  const literal = src.slice(start, end + 1);
  // eslint-disable-next-line no-eval
  return eval('(' + literal + ')'); // fichier généré par nos scripts → contenu de confiance
}

function main() {
  console.log('📥 Lecture des données générées…');
  const labels = readGenerated('stationLabelsGenerated.ts', 'generatedLabels');
  const trails = readGenerated('trailsGenerated.ts', 'generatedTrails');
  const campings = readGenerated('campingsGenerated.ts', 'generatedCampings');
  console.log(`  labels: ${Object.keys(labels).length} gares · trails: ${Object.keys(trails).length} · campings: ${Object.keys(campings).length}`);

  if (fs.existsSync(OUT)) fs.unlinkSync(OUT);
  const db = new Database(OUT);
  db.pragma('journal_mode = DELETE'); // pas de -wal : un seul fichier embarqué
  db.exec(`
    CREATE TABLE labels   (uic TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE trails   (uic TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE campings (uic TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE meta     (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `);

  const insert = (table, dict) => {
    const stmt = db.prepare(`INSERT INTO ${table} (uic, data) VALUES (?, ?)`);
    const tx = db.transaction((entries) => {
      for (const [uic, value] of entries) stmt.run(uic, JSON.stringify(value));
    });
    tx(Object.entries(dict));
  };
  insert('labels', labels);
  insert('trails', trails);
  insert('campings', campings);

  // Version = empreinte simple (somme des tailles) pour invalider la copie runtime si les données changent.
  const version = `${Object.keys(labels).length}-${Object.keys(trails).length}-${Object.keys(campings).length}-${new Date().toISOString().slice(0, 10)}`;
  db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)').run('version', version);
  db.close();

  // Version exportée en TS : le runtime copie l'asset sous content-<version>.db ; un changement de
  // version ⇒ nouveau nom de fichier ⇒ recopie automatique (robuste aux mises à jour de l'app).
  const verFile = path.join(DATA, 'contentDbVersion.ts');
  fs.writeFileSync(verFile,
    `// AUTO-GÉNÉRÉ par scripts/build-content-db.js — NE PAS ÉDITER.\n` +
    `export const CONTENT_DB_VERSION = ${JSON.stringify(version)};\n`);

  const sizeMb = (fs.statSync(OUT).size / 1e6).toFixed(1);
  console.log(`✅ Écrit ${path.relative(ROOT, OUT)} (${sizeMb} Mo) · version ${version}`);
  console.log(`✅ Écrit ${path.relative(ROOT, verFile)}`);
}

main();
