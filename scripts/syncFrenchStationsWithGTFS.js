#!/usr/bin/env node

/**
 * Script pour synchroniser frenchStations.ts avec les vrais numéros GTFS
 *
 * Problème : Les numéros SNCF dans frenchStations ne correspondent pas toujours
 * aux numéros dans les données GTFS (ex: Limoges 87584007 vs 87592006)
 *
 * Solution : Lire stops.txt et mettre à jour les numéros dans frenchStations.ts
 */

const fs = require('fs');
const path = require('path');

const STOPS_FILE = path.join(__dirname, '../assets/sncf_data/stops.txt');
const FRENCH_STATIONS_FILE = path.join(__dirname, '../src/data/frenchStations.ts');

console.log('🔄 Synchronisation de frenchStations avec GTFS...\n');

// 1. Lire le fichier stops.txt
console.log('📖 Lecture de stops.txt...');
const stopsContent = fs.readFileSync(STOPS_FILE, 'utf-8');
const lines = stopsContent.split('\n');
const headers = lines[0].split(',');

// Trouver les index des colonnes
const stopIdIdx = headers.indexOf('stop_id');
const stopNameIdx = headers.indexOf('stop_name');
const locationTypeIdx = headers.indexOf('location_type');

console.log(`✅ ${lines.length - 1} lignes lues\n`);

// 2. Extraire les StopArea (gares principales)
console.log('🔍 Extraction des StopArea (gares principales)...');
const gtfsStations = new Map(); // nom_gare -> { stop_id, sncf_number }

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const row = line.split(',');
  const stopId = row[stopIdIdx];
  const stopName = row[stopNameIdx];
  const locationType = row[locationTypeIdx];

  // Garder seulement les StopArea (location_type = 1)
  if (locationType === '1' && stopId && stopId.startsWith('StopArea:OCE')) {
    // Extraire le numéro à 8 chiffres
    const match = stopId.match(/\d{8}/);
    if (match) {
      const sncfNumber = match[0];

      // Normaliser le nom (enlever accents, majuscules, etc.)
      const normalizedName = stopName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // Enlever les accents

      gtfsStations.set(normalizedName, {
        stopId,
        sncfNumber,
        originalName: stopName
      });
    }
  }
}

console.log(`✅ ${gtfsStations.size} gares GTFS extraites\n`);

// 3. Lire frenchStations.ts
console.log('📖 Lecture de frenchStations.ts...');
const frenchStationsContent = fs.readFileSync(FRENCH_STATIONS_FILE, 'utf-8');

// 4. Chercher les incohérences
console.log('🔍 Recherche des incohérences...\n');

// Parser les stations dans frenchStations (regex pour extraire les objets)
const stationRegex = /{[^}]+}/g;
const stations = frenchStationsContent.match(stationRegex);

let corrections = 0;
let notFound = 0;
const changes = [];

if (stations) {
  console.log(`📊 ${stations.length} stations dans frenchStations.ts\n`);

  stations.forEach((stationStr) => {
    // Extraire name et sncf_id
    const nameMatch = stationStr.match(/name:\s*['"]([^'"]+)['"]/);
    const sncfIdMatch = stationStr.match(/sncf_id:\s*['"](\d{8})['"]/);

    if (nameMatch && sncfIdMatch) {
      const name = nameMatch[1];
      const currentSncfId = sncfIdMatch[1];

      // Normaliser le nom pour la comparaison
      const normalizedName = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      // Chercher dans GTFS
      const gtfsStation = gtfsStations.get(normalizedName);

      if (gtfsStation) {
        if (gtfsStation.sncfNumber !== currentSncfId) {
          console.log(`⚠️  ${name}`);
          console.log(`   frenchStations: ${currentSncfId}`);
          console.log(`   GTFS:           ${gtfsStation.sncfNumber}`);
          console.log(`   → CORRECTION NÉCESSAIRE\n`);

          changes.push({
            name,
            oldId: currentSncfId,
            newId: gtfsStation.sncfNumber
          });
          corrections++;
        }
      } else {
        console.log(`❌ ${name} : Non trouvé dans GTFS`);
        notFound++;
      }
    }
  });
}

console.log('\n📊 RÉSUMÉ :');
console.log(`   ✅ Stations correctes : ${stations.length - corrections - notFound}`);
console.log(`   ⚠️  Corrections nécessaires : ${corrections}`);
console.log(`   ❌ Non trouvées dans GTFS : ${notFound}`);

// 5. Proposer les corrections
if (corrections > 0) {
  console.log('\n❓ Voulez-vous appliquer ces corrections ? (y/n)');
  console.log('   Cela va modifier frenchStations.ts');

  // Pour l'instant, juste afficher les corrections sans les appliquer
  console.log('\n💡 Pour appliquer automatiquement, ajoutez le flag --apply');
  console.log('   Exemple: node syncFrenchStationsWithGTFS.js --apply');

  if (process.argv.includes('--apply')) {
    console.log('\n🔧 Application des corrections...');

    let newContent = frenchStationsContent;
    changes.forEach(change => {
      // Remplacer l'ancien sncf_id par le nouveau
      const oldPattern = new RegExp(`(sncf_id:\\s*['"])${change.oldId}(['"])`, 'g');
      newContent = newContent.replace(oldPattern, `$1${change.newId}$2`);
    });

    // Sauvegarder
    fs.writeFileSync(FRENCH_STATIONS_FILE, newContent, 'utf-8');
    console.log(`✅ ${corrections} corrections appliquées dans frenchStations.ts`);
  }
} else {
  console.log('\n✅ Aucune correction nécessaire !');
}

console.log('\n✨ Terminé !');
