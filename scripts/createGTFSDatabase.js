/**
 * Script pour créer une base de données SQLite optimisée à partir des données GTFS
 * Base de données optimisée pour la recherche locale de trajets
 *
 * Avantages par rapport à JSON:
 * - Requêtes ultra-rapides avec index
 * - Consommation mémoire réduite
 * - Recherche spatiale possible (latitude/longitude)
 * - Pas besoin de charger toutes les données en mémoire
 *
 * Usage: node scripts/createGTFSDatabase.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Vérifier si expo-sqlite est disponible ou utiliser better-sqlite3 pour Node
let Database;
try {
  Database = require('better-sqlite3');
} catch (e) {
  console.error('❌ better-sqlite3 n\'est pas installé');
  console.error('Installez-le avec: npm install --save-dev better-sqlite3');
  process.exit(1);
}

const GTFS_DATA_DIR = path.join(__dirname, '..', 'assets', 'sncf_data');
const OUTPUT_DIR = path.join(__dirname, '..', 'assets');
const DB_FILE = path.join(OUTPUT_DIR, 'gtfs.db');

console.log('🗄️  Création de la base de données GTFS optimisée...\n');

/**
 * Initialise la base de données avec les tables et index
 */
function initDatabase() {
  console.log('📋 Création de la structure de la base de données...');

  // Supprimer l'ancienne DB si elle existe
  if (fs.existsSync(DB_FILE)) {
    fs.unlinkSync(DB_FILE);
  }

  const db = new Database(DB_FILE);

  // Table des gares (stops)
  db.exec(`
    CREATE TABLE stops (
      stop_id TEXT PRIMARY KEY,
      stop_name TEXT NOT NULL,
      stop_lat REAL NOT NULL,
      stop_lon REAL NOT NULL,
      parent_station TEXT
    );
  `);

  // Table des routes (lignes)
  db.exec(`
    CREATE TABLE routes (
      route_id TEXT PRIMARY KEY,
      route_short_name TEXT,
      route_long_name TEXT,
      route_type INTEGER
    );
  `);

  // Table des trips (trajets)
  db.exec(`
    CREATE TABLE trips (
      trip_id TEXT PRIMARY KEY,
      route_id TEXT NOT NULL,
      service_id TEXT NOT NULL,
      trip_headsign TEXT,
      FOREIGN KEY (route_id) REFERENCES routes(route_id)
    );
  `);

  // Table des horaires (stop_times)
  db.exec(`
    CREATE TABLE stop_times (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id TEXT NOT NULL,
      stop_id TEXT NOT NULL,
      arrival_time TEXT NOT NULL,
      departure_time TEXT NOT NULL,
      stop_sequence INTEGER NOT NULL,
      FOREIGN KEY (trip_id) REFERENCES trips(trip_id),
      FOREIGN KEY (stop_id) REFERENCES stops(stop_id)
    );
  `);

  // Table des dates de calendrier (calendar_dates)
  // Note: pas de table calendar car les données SNCF utilisent uniquement calendar_dates
  db.exec(`
    CREATE TABLE calendar_dates (
      service_id TEXT NOT NULL,
      date TEXT NOT NULL,
      exception_type INTEGER NOT NULL,
      PRIMARY KEY (service_id, date)
    );
  `);

  // Index pour optimiser les requêtes
  console.log('🔍 Création des index...');

  db.exec(`
    CREATE INDEX idx_stop_times_trip ON stop_times(trip_id);
    CREATE INDEX idx_stop_times_stop ON stop_times(stop_id);
    CREATE INDEX idx_stop_times_departure ON stop_times(departure_time);
    CREATE INDEX idx_stop_times_arrival ON stop_times(arrival_time);
    CREATE INDEX idx_stop_times_sequence ON stop_times(trip_id, stop_sequence);
    CREATE INDEX idx_trips_route ON trips(route_id);
    CREATE INDEX idx_trips_service ON trips(service_id);
    CREATE INDEX idx_stops_name ON stops(stop_name);
    CREATE INDEX idx_stops_location ON stops(stop_lat, stop_lon);
    CREATE INDEX idx_calendar_dates_service ON calendar_dates(service_id);
    CREATE INDEX idx_calendar_dates_date ON calendar_dates(date);
  `);

  console.log('   ✓ Structure et index créés\n');
  return db;
}

/**
 * Lit un fichier CSV et retourne les lignes
 */
async function readCSV(filename) {
  const filePath = path.join(GTFS_DATA_DIR, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`   ⚠️  ${filename} non trouvé, ignoré`);
    return [];
  }

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const rows = [];
  let headers = [];
  let isFirstLine = true;

  for await (const line of rl) {
    if (isFirstLine) {
      headers = line.split(',').map(h => h.trim());
      isFirstLine = false;
      continue;
    }

    const values = line.split(',');
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ? values[index].trim() : '';
    });

    rows.push(row);
  }

  return rows;
}

/**
 * Importe les gares (stops)
 */
async function importStops(db) {
  console.log('📍 Import des gares...');
  const rows = await readCSV('stops.txt');

  if (rows.length === 0) {
    console.log('   ⚠️  Aucune gare à importer');
    return;
  }

  const insert = db.prepare(`
    INSERT INTO stops (stop_id, stop_name, stop_lat, stop_lon, parent_station)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((stops) => {
    for (const stop of stops) {
      if (stop.location_type === '0' || stop.location_type === '') {
        insert.run(
          stop.stop_id,
          stop.stop_name,
          parseFloat(stop.stop_lat) || 0,
          parseFloat(stop.stop_lon) || 0,
          stop.parent_station || null
        );
      }
    }
  });

  insertMany(rows);
  const count = db.prepare('SELECT COUNT(*) as count FROM stops').get().count;
  console.log(`   ✓ ${count} gares importées\n`);
}

/**
 * Importe les routes (lignes)
 */
async function importRoutes(db) {
  console.log('🛤️  Import des lignes...');
  const rows = await readCSV('routes.txt');

  if (rows.length === 0) {
    console.log('   ⚠️  Aucune ligne à importer');
    return;
  }

  const insert = db.prepare(`
    INSERT INTO routes (route_id, route_short_name, route_long_name, route_type)
    VALUES (?, ?, ?, ?)
  `);

  const insertMany = db.transaction((routes) => {
    for (const route of routes) {
      insert.run(
        route.route_id,
        route.route_short_name || '',
        route.route_long_name || '',
        parseInt(route.route_type) || 0
      );
    }
  });

  insertMany(rows);
  const count = db.prepare('SELECT COUNT(*) as count FROM routes').get().count;
  console.log(`   ✓ ${count} lignes importées\n`);
}

/**
 * Importe les trips (trajets)
 */
async function importTrips(db) {
  console.log('🚄 Import des trajets...');
  const rows = await readCSV('trips.txt');

  if (rows.length === 0) {
    console.log('   ⚠️  Aucun trajet à importer');
    return;
  }

  const insert = db.prepare(`
    INSERT INTO trips (trip_id, route_id, service_id, trip_headsign)
    VALUES (?, ?, ?, ?)
  `);

  const insertMany = db.transaction((trips) => {
    let count = 0;
    for (const trip of trips) {
      insert.run(
        trip.trip_id,
        trip.route_id,
        trip.service_id,
        trip.trip_headsign || ''
      );
      count++;
      if (count % 10000 === 0) {
        process.stdout.write(`\r   Import... ${count} trajets`);
      }
    }
  });

  insertMany(rows);
  const count = db.prepare('SELECT COUNT(*) as count FROM trips').get().count;
  console.log(`\r   ✓ ${count} trajets importés\n`);
}

/**
 * Importe les horaires (stop_times)
 */
async function importStopTimes(db) {
  console.log('⏰ Import des horaires...');
  console.log('   (Ceci peut prendre plusieurs minutes)');

  const rows = await readCSV('stop_times.txt');

  if (rows.length === 0) {
    console.log('   ⚠️  Aucun horaire à importer');
    return;
  }

  const insert = db.prepare(`
    INSERT INTO stop_times (trip_id, stop_id, arrival_time, departure_time, stop_sequence)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((stopTimes) => {
    let count = 0;
    for (const st of stopTimes) {
      insert.run(
        st.trip_id,
        st.stop_id,
        st.arrival_time,
        st.departure_time,
        parseInt(st.stop_sequence) || 0
      );
      count++;
      if (count % 50000 === 0) {
        process.stdout.write(`\r   Import... ${count} horaires`);
      }
    }
  });

  insertMany(rows);
  const count = db.prepare('SELECT COUNT(*) as count FROM stop_times').get().count;
  console.log(`\r   ✓ ${count} horaires importés\n`);
}

/**
 * Importe les dates de calendrier (calendar_dates)
 */
async function importCalendarDates(db) {
  console.log('📆 Import des dates de calendrier...');
  const rows = await readCSV('calendar_dates.txt');

  if (rows.length === 0) {
    console.log('   ⚠️  Aucune date de calendrier à importer');
    return;
  }

  const insert = db.prepare(`
    INSERT INTO calendar_dates (service_id, date, exception_type)
    VALUES (?, ?, ?)
  `);

  const insertMany = db.transaction((dates) => {
    for (const date of dates) {
      insert.run(
        date.service_id,
        date.date,
        parseInt(date.exception_type) || 0
      );
    }
  });

  insertMany(rows);
  const count = db.prepare('SELECT COUNT(*) as count FROM calendar_dates').get().count;
  console.log(`   ✓ ${count} dates importées\n`);
}

/**
 * Crée des vues SQL pour faciliter les requêtes
 */
function createViews(db) {
  console.log('👁️  Création des vues SQL...');

  // Vue pour les connexions directes entre gares (même trajet)
  db.exec(`
    CREATE VIEW IF NOT EXISTS direct_connections AS
    SELECT
      st1.trip_id,
      st1.stop_id as from_stop_id,
      s1.stop_name as from_stop_name,
      s1.stop_lat as from_lat,
      s1.stop_lon as from_lon,
      st1.departure_time,
      st1.arrival_time as from_arrival_time,
      st2.stop_id as to_stop_id,
      s2.stop_name as to_stop_name,
      s2.stop_lat as to_lat,
      s2.stop_lon as to_lon,
      st2.arrival_time,
      st2.departure_time as to_departure_time,
      st2.stop_sequence - st1.stop_sequence as nb_stops,
      r.route_short_name,
      r.route_long_name,
      t.service_id,
      t.trip_headsign
    FROM stop_times st1
    JOIN stop_times st2 ON st1.trip_id = st2.trip_id
      AND st2.stop_sequence > st1.stop_sequence
    JOIN stops s1 ON st1.stop_id = s1.stop_id
    JOIN stops s2 ON st2.stop_id = s2.stop_id
    JOIN trips t ON st1.trip_id = t.trip_id
    JOIN routes r ON t.route_id = r.route_id;
  `);

  console.log('   ✓ Vue des connexions directes créée');

  // Vue pour les correspondances possibles dans une gare
  // Trouve tous les départs possibles depuis chaque arrivée
  db.exec(`
    CREATE VIEW IF NOT EXISTS transfer_opportunities AS
    SELECT
      arrival.trip_id as arrival_trip_id,
      arrival.stop_id as transfer_stop_id,
      s.stop_name as transfer_stop_name,
      arrival.arrival_time,
      departure.trip_id as departure_trip_id,
      departure.departure_time,
      departure.stop_id as next_stop_id,
      -- Calcul du temps de correspondance en minutes (approximatif)
      CAST(
        (CAST(substr(departure.departure_time, 1, 2) AS INTEGER) * 60 +
         CAST(substr(departure.departure_time, 4, 2) AS INTEGER)) -
        (CAST(substr(arrival.arrival_time, 1, 2) AS INTEGER) * 60 +
         CAST(substr(arrival.arrival_time, 4, 2) AS INTEGER))
        AS INTEGER
      ) as transfer_time_minutes
    FROM stop_times arrival
    JOIN stop_times departure ON arrival.stop_id = departure.stop_id
      AND arrival.trip_id != departure.trip_id
      AND departure.departure_time > arrival.arrival_time
    JOIN stops s ON arrival.stop_id = s.stop_id
    WHERE transfer_time_minutes >= 5  -- Minimum 5 minutes de correspondance
      AND transfer_time_minutes <= 120; -- Maximum 2 heures d'attente
  `);

  console.log('   ✓ Vue des opportunités de correspondance créée');
  console.log('   ✓ Filtre: 5 min ≤ temps de correspondance ≤ 2h');

  // Index supplémentaires pour optimiser les recherches de correspondances
  console.log('   ⚡ Création d\'index pour les correspondances...');

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_stop_times_stop_arrival
    ON stop_times(stop_id, arrival_time);

    CREATE INDEX IF NOT EXISTS idx_stop_times_stop_departure
    ON stop_times(stop_id, departure_time);

    CREATE INDEX IF NOT EXISTS idx_stop_times_compound
    ON stop_times(stop_id, trip_id, departure_time, arrival_time);
  `);

  console.log('   ✓ Index de correspondances créés');
  console.log('   ✓ Recherche de trajets avec correspondances optimisée\n');
}

/**
 * Crée une table de correspondances pré-calculées (optionnel, pour performance)
 * Attention: Peut prendre du temps et beaucoup d'espace disque
 */
function createTransferTable(db, enabled = false) {
  if (!enabled) {
    return;
  }

  console.log('🔄 Création de la table des correspondances...');
  console.log('   ⚠️  Ceci peut prendre plusieurs minutes');

  db.exec(`
    CREATE TABLE IF NOT EXISTS precalculated_transfers (
      from_stop_id TEXT NOT NULL,
      to_stop_id TEXT NOT NULL,
      via_stop_id TEXT NOT NULL,
      first_trip_id TEXT NOT NULL,
      second_trip_id TEXT NOT NULL,
      from_departure TEXT NOT NULL,
      transfer_arrival TEXT NOT NULL,
      transfer_departure TEXT NOT NULL,
      to_arrival TEXT NOT NULL,
      total_duration_minutes INTEGER,
      transfer_time_minutes INTEGER,
      PRIMARY KEY (first_trip_id, second_trip_id, from_stop_id, to_stop_id)
    );
  `);

  // Cette requête peut être très lente sur de grosses bases
  db.exec(`
    INSERT INTO precalculated_transfers
    SELECT
      leg1.from_stop_id,
      leg2.to_stop_id,
      leg1.to_stop_id as via_stop_id,
      leg1.trip_id as first_trip_id,
      leg2.trip_id as second_trip_id,
      leg1.departure_time as from_departure,
      leg1.arrival_time as transfer_arrival,
      leg2.departure_time as transfer_departure,
      leg2.arrival_time as to_arrival,
      -- Durée totale en minutes
      (CAST(substr(leg2.arrival_time, 1, 2) AS INTEGER) * 60 +
       CAST(substr(leg2.arrival_time, 4, 2) AS INTEGER)) -
      (CAST(substr(leg1.departure_time, 1, 2) AS INTEGER) * 60 +
       CAST(substr(leg1.departure_time, 4, 2) AS INTEGER)) as total_duration_minutes,
      -- Temps de correspondance
      (CAST(substr(leg2.departure_time, 1, 2) AS INTEGER) * 60 +
       CAST(substr(leg2.departure_time, 4, 2) AS INTEGER)) -
      (CAST(substr(leg1.arrival_time, 1, 2) AS INTEGER) * 60 +
       CAST(substr(leg1.arrival_time, 4, 2) AS INTEGER)) as transfer_time_minutes
    FROM direct_connections leg1
    JOIN direct_connections leg2 ON leg1.to_stop_id = leg2.from_stop_id
      AND leg1.trip_id != leg2.trip_id
      AND leg2.departure_time > leg1.arrival_time
    WHERE transfer_time_minutes >= 5
      AND transfer_time_minutes <= 120
    LIMIT 1000000;  -- Limiter pour éviter une explosion de données
  `);

  const count = db.prepare('SELECT COUNT(*) as count FROM precalculated_transfers').get().count;
  console.log(`   ✓ ${count.toLocaleString()} correspondances pré-calculées\n`);
}

/**
 * Affiche des statistiques sur la base de données
 */
function displayStats(db) {
  console.log('📊 Statistiques de la base de données:\n');

  const stats = {
    stops: db.prepare('SELECT COUNT(*) as count FROM stops').get().count,
    routes: db.prepare('SELECT COUNT(*) as count FROM routes').get().count,
    trips: db.prepare('SELECT COUNT(*) as count FROM trips').get().count,
    stopTimes: db.prepare('SELECT COUNT(*) as count FROM stop_times').get().count,
    calendarDates: db.prepare('SELECT COUNT(*) as count FROM calendar_dates').get().count
  };

  console.log(`   Gares:                 ${stats.stops.toLocaleString()}`);
  console.log(`   Lignes:                ${stats.routes.toLocaleString()}`);
  console.log(`   Trajets:               ${stats.trips.toLocaleString()}`);
  console.log(`   Horaires:              ${stats.stopTimes.toLocaleString()}`);
  console.log(`   Dates calendrier:      ${stats.calendarDates.toLocaleString()}`);

  // Taille du fichier
  const fileStats = fs.statSync(DB_FILE);
  const sizeMB = (fileStats.size / 1024 / 1024).toFixed(2);
  console.log(`\n   Taille de la DB:       ${sizeMB} MB`);
}

/**
 * Crée des exemples de requêtes
 */
function createExampleQueries(db) {
  console.log('\n💡 Exemples de requêtes SQL:\n');

  console.log('1. Trouver toutes les connexions directes de Paris Gare de Lyon:');
  console.log(`
  SELECT DISTINCT to_stop_name, COUNT(*) as nb_connections
  FROM direct_connections
  WHERE from_stop_name LIKE '%Paris Gare de Lyon%'
  GROUP BY to_stop_name
  ORDER BY nb_connections DESC
  LIMIT 10;
  `);

  console.log('2. Rechercher les trains partant après une certaine heure:');
  console.log(`
  SELECT from_stop_name, to_stop_name, departure_time, arrival_time, route_short_name
  FROM direct_connections
  WHERE from_stop_name LIKE '%Paris%'
    AND to_stop_name LIKE '%Lyon%'
    AND departure_time >= '08:00:00'
    AND departure_time <= '12:00:00'
  ORDER BY departure_time
  LIMIT 5;
  `);

  console.log('3. Trouver les gares proches d\'une position GPS:');
  console.log(`
  SELECT stop_name, stop_lat, stop_lon,
    ((stop_lat - ?) * (stop_lat - ?) + (stop_lon - ?) * (stop_lon - ?)) as distance_sq
  FROM stops
  ORDER BY distance_sq
  LIMIT 10;
  -- Remplacer ? par vos coordonnées (latitude, longitude)
  `);

  console.log('4. Vérifier si un service circule un jour donné:');
  console.log(`
  SELECT service_id, date, exception_type
  FROM calendar_dates
  WHERE service_id = ? AND date = ?;
  -- exception_type: 1 = service ajouté, 2 = service supprimé
  -- Remplacer ? par le service_id et la date (format YYYYMMDD)
  `);

  console.log('5. 🔄 NOUVEAU: Trouver les trajets avec UNE correspondance:');
  console.log(`
  SELECT
    leg1.from_stop_name as depart,
    leg1.departure_time,
    leg1.to_stop_name as correspondance,
    leg1.arrival_time as arrivee_correspondance,
    leg2.departure_time as depart_correspondance,
    leg2.to_stop_name as arrivee,
    leg2.arrival_time,
    -- Temps de correspondance
    (CAST(substr(leg2.departure_time, 1, 2) AS INTEGER) * 60 +
     CAST(substr(leg2.departure_time, 4, 2) AS INTEGER)) -
    (CAST(substr(leg1.arrival_time, 1, 2) AS INTEGER) * 60 +
     CAST(substr(leg1.arrival_time, 4, 2) AS INTEGER)) as temps_correspondance_min,
    -- Durée totale
    (CAST(substr(leg2.arrival_time, 1, 2) AS INTEGER) * 60 +
     CAST(substr(leg2.arrival_time, 4, 2) AS INTEGER)) -
    (CAST(substr(leg1.departure_time, 1, 2) AS INTEGER) * 60 +
     CAST(substr(leg1.departure_time, 4, 2) AS INTEGER)) as duree_totale_min
  FROM direct_connections leg1
  JOIN direct_connections leg2 ON leg1.to_stop_id = leg2.from_stop_id
    AND leg1.trip_id != leg2.trip_id
    AND leg2.departure_time > leg1.arrival_time
  WHERE leg1.from_stop_name LIKE '%Paris%'
    AND leg2.to_stop_name LIKE '%Marseille%'
    AND leg1.departure_time >= '08:00:00'
    AND temps_correspondance_min >= 5
    AND temps_correspondance_min <= 60
  ORDER BY duree_totale_min
  LIMIT 10;
  `);

  console.log('6. 🔄 NOUVEAU: Trouver les correspondances possibles depuis un trajet:');
  console.log(`
  SELECT
    transfer_stop_name,
    arrival_time,
    COUNT(*) as nb_connexions_disponibles,
    MIN(departure_time) as prochain_depart,
    MIN(transfer_time_minutes) as temps_attente_min
  FROM transfer_opportunities
  WHERE arrival_trip_id = 'TRIP_ID_HERE'
  GROUP BY transfer_stop_name, arrival_time
  ORDER BY transfer_time_minutes;
  `);
}

/**
 * Fonction principale
 */
async function main() {
  try {
    const startTime = Date.now();

    // Créer la base de données
    const db = initDatabase();

    // Importer les données
    await importStops(db);
    await importRoutes(db);
    await importTrips(db);
    await importStopTimes(db);
    await importCalendarDates(db);

    // Créer les vues
    createViews(db);

    // Créer la table de correspondances pré-calculées (optionnel)
    // Mettre à true pour activer (attention: peut être long et volumineux)
    createTransferTable(db, false);

    // Optimiser la base de données
    console.log('🔧 Optimisation de la base de données...');
    db.exec('ANALYZE;');
    db.exec('VACUUM;');
    console.log('   ✓ Optimisation terminée\n');

    // Afficher les statistiques
    displayStats(db);

    // Créer les exemples
    createExampleQueries(db);

    db.close();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Base de données créée avec succès en ${duration}s`);
    console.log(`\n📁 Fichier: ${DB_FILE}`);
    console.log('\n📖 Documentation pour utiliser la DB dans React Native:');
    console.log('   https://docs.expo.dev/versions/latest/sdk/sqlite/');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécuter le script
main();
