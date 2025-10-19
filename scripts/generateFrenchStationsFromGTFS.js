#!/usr/bin/env node

/**
 * Génère frenchStations.ts depuis les données GTFS
 * Inclut TOUTES les gares StopArea (3500+ au lieu de 501)
 */

const fs = require('fs');
const path = require('path');

const STOPS_FILE = path.join(__dirname, '../assets/sncf_data/stops.txt');
const OUTPUT_FILE = path.join(__dirname, '../src/data/frenchStations.ts');
const BACKUP_FILE = path.join(__dirname, '../src/data/frenchStations.backup.ts');

console.log('🚂 Génération de frenchStations.ts depuis GTFS\n');

// 1. Backup de l'ancien fichier
console.log('💾 Sauvegarde de l\'ancien frenchStations.ts...');
if (fs.existsSync(OUTPUT_FILE)) {
  fs.copyFileSync(OUTPUT_FILE, BACKUP_FILE);
  console.log(`✅ Sauvegardé dans ${path.basename(BACKUP_FILE)}\n`);
}

// 2. Lire stops.txt
console.log('📖 Lecture de stops.txt...');
const content = fs.readFileSync(STOPS_FILE, 'utf-8');
const lines = content.split('\n');
const headers = lines[0].split(',');

const stopIdIdx = headers.indexOf('stop_id');
const stopNameIdx = headers.indexOf('stop_name');
const stopLatIdx = headers.indexOf('stop_lat');
const stopLonIdx = headers.indexOf('stop_lon');
const locationTypeIdx = headers.indexOf('location_type');

console.log(`✅ ${lines.length - 1} lignes lues\n`);

// 3. Extraire toutes les StopArea
console.log('🔍 Extraction des StopArea (gares principales)...');
const stations = [];
let id = 1;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const row = line.split(',');
  const locationType = row[locationTypeIdx];

  // Garder seulement les StopArea (gares principales)
  if (locationType === '1') {
    const stopId = row[stopIdIdx];
    const match = stopId.match(/\d{8}/);

    if (match) {
      const name = row[stopNameIdx];
      const lat = parseFloat(row[stopLatIdx]) || 0;
      const lon = parseFloat(row[stopLonIdx]) || 0;

      stations.push({
        id: id++,
        name: name,
        sncf_id: match[0],
        lat: lat,
        lon: lon
      });
    }
  }
}

console.log(`✅ ${stations.length} gares extraites\n`);

// 4. Trier par nom
stations.sort((a, b) => a.name.localeCompare(b.name, 'fr'));

// 5. Générer le fichier TypeScript
console.log('📝 Génération du fichier TypeScript...');

let tsContent = `import { Station } from '../types';

/**
 * Liste complète des gares SNCF françaises
 * Générée automatiquement depuis les données GTFS
 *
 * Nombre de gares : ${stations.length}
 * Source : assets/sncf_data/stops.txt
 * Généré le : ${new Date().toISOString()}
 */

export const frenchStations: Station[] = [
`;

// Ajouter les stations
stations.forEach((station, index) => {
  const isLast = index === stations.length - 1;
  tsContent += `  {\n`;
  tsContent += `    id: ${station.id},\n`;
  tsContent += `    name: "${station.name.replace(/"/g, '\\"')}",\n`;
  tsContent += `    sncf_id: "${station.sncf_id}",\n`;
  tsContent += `    lat: ${station.lat},\n`;
  tsContent += `    lon: ${station.lon},\n`;
  tsContent += `  }${isLast ? '' : ','}\n`;
});

tsContent += `];\n`;

// 6. Écrire le fichier
fs.writeFileSync(OUTPUT_FILE, tsContent, 'utf-8');

console.log(`✅ Fichier généré : ${path.basename(OUTPUT_FILE)}`);
console.log(`📊 ${stations.length} gares incluses\n`);

// 7. Statistiques
console.log('📊 STATISTIQUES :');
console.log(`   Avant : ~501 gares`);
console.log(`   Après : ${stations.length} gares`);
console.log(`   Gain  : +${stations.length - 501} gares\n`);

// Vérifier que Limoges Bénédictins est inclus
const limoges = stations.find(s => s.name.includes('Limoges') && s.name.includes('Bénédictins'));
if (limoges) {
  console.log('✅ Vérification : Limoges Bénédictins est inclus !');
  console.log(`   ID GTFS : ${limoges.sncf_id}`);
  console.log(`   Nom     : ${limoges.name}\n`);
} else {
  console.log('⚠️  Limoges Bénédictins non trouvé\n');
}

console.log('✨ Terminé !');
console.log(`💡 L'ancien fichier est sauvegardé dans ${path.basename(BACKUP_FILE)}`);
