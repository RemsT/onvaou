#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const STOPS_FILE = path.join(__dirname, '../assets/sncf_data/stops.txt');
const OUTPUT_FILE = path.join(__dirname, '../src/data/allStations.ts');

console.log('🚂 Génération de allStations.ts depuis GTFS\n');

// Lire stops.txt
const content = fs.readFileSync(STOPS_FILE, 'utf-8');
const lines = content.split('\n');
const headers = lines[0].split(',');

const stopIdIdx = headers.indexOf('stop_id');
const stopNameIdx = headers.indexOf('stop_name');
const stopLatIdx = headers.indexOf('stop_lat');
const stopLonIdx = headers.indexOf('stop_lon');
const locationTypeIdx = headers.indexOf('location_type');

const stations = [];
let id = 1;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const row = line.split(',');
  const locationType = row[locationTypeIdx];

  if (locationType === '1') {
    const stopId = row[stopIdIdx];
    const match = stopId.match(/\d{8}/);

    if (match) {
      const sncfNumber = match[0];
      stations.push({
        id: id++,
        name: row[stopNameIdx],
        sncf_id: `stop_area:OCE:SA:${sncfNumber}`,
        lat: parseFloat(row[stopLatIdx]) || 0,
        lon: parseFloat(row[stopLonIdx]) || 0
      });
    }
  }
}

// Trier par nom
stations.sort((a, b) => a.name.localeCompare(b.name, 'fr'));

// Générer le fichier
let tsContent = 'export const allStations = [\n';

stations.forEach((s, i) => {
  const isLast = i === stations.length - 1;
  // Utiliser JSON.stringify pour échapper automatiquement tous les caractères spéciaux
  const name = JSON.stringify(s.name);
  const sncfId = JSON.stringify(s.sncf_id);

  tsContent += `  { id: ${s.id}, name: ${name}, sncf_id: ${sncfId}, lat: ${s.lat}, lon: ${s.lon} }${isLast ? '' : ','}\n`;
});

tsContent += '];\n';

// Backup
if (fs.existsSync(OUTPUT_FILE)) {
  fs.copyFileSync(OUTPUT_FILE, OUTPUT_FILE.replace('.ts', '.backup.ts'));
  console.log('💾 Backup créé\n');
}

// Sauvegarder
fs.writeFileSync(OUTPUT_FILE, tsContent);

console.log(`✅ allStations.ts généré avec ${stations.length} gares\n`);

// Vérifier quelques gares
const andorre = stations.find(s => s.name.includes('Andorre'));
const limoges = stations.find(s => s.name.includes('Limoges') && s.name.includes('Bénédictins'));

if (andorre) console.log(`✅ Andorre : ${andorre.name}`);
if (limoges) console.log(`✅ Limoges : ${limoges.sncf_id}`);

console.log('\n✨ Terminé !');
