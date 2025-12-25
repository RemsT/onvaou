/**
 * Service d'initialisation de la base de données GTFS
 * Crée automatiquement la DB au premier lancement de l'application
 */

import * as SQLite from 'expo-sqlite';
// Utiliser l'API legacy d'Expo FileSystem (compatible avec SDK 54+)
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';

interface InitializationProgress {
  step: string;
  progress: number; // 0-100
  message: string;
}

type ProgressCallback = (progress: InitializationProgress) => void;

class GTFSInitializationService {
  private dbPath: string;
  private dbName = 'gtfs.db';

  constructor() {
    // Utiliser l'API FileSystem
    const docDir = FileSystem.documentDirectory || '';
    this.dbPath = `${docDir}SQLite/${this.dbName}`;
  }

  /**
   * Vérifie si la base de données existe déjà
   */
  async isDatabaseInitialized(): Promise<boolean> {
    try {
      console.log(`📂 Chemin de gtfs.db: ${this.dbPath}`);
      const dbInfo = await FileSystem.getInfoAsync(this.dbPath);
      console.log(`📊 Base de données existe: ${dbInfo.exists}`);
      return dbInfo.exists;
    } catch (error) {
      console.error('Erreur lors de la vérification de la DB:', error);
      return false;
    }
  }

  /**
   * Initialise la base de données au premier lancement
   */
  async initializeDatabase(
    onProgress?: ProgressCallback
  ): Promise<boolean> {
    try {
      const isInitialized = await this.isDatabaseInitialized();

      if (isInitialized) {
        console.log('✅ Base de données déjà initialisée');
        onProgress?.({
          step: 'complete',
          progress: 100,
          message: 'Base de données prête'
        });
        return true;
      }

      console.log('🚀 Première initialisation de la base de données GTFS...');
      onProgress?.({
        step: 'start',
        progress: 0,
        message: 'Démarrage de l\'initialisation...'
      });

      // Créer le dossier SQLite avec permissions explicites
      const dbDir = `${FileSystem.documentDirectory}SQLite`;
      const dirInfo = await FileSystem.getInfoAsync(dbDir);
      if (!dirInfo.exists) {
        console.log(`📁 Création du dossier: ${dbDir}`);
        await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
      } else {
        console.log(`✓ Dossier SQLite existe: ${dbDir}`);
      }

      // Vérifier les permissions du dossier
      console.log(`📂 Dossier SQLite: ${dbDir}`);
      console.log(`📂 Chemin complet DB: ${this.dbPath}`);

      // Créer la base de données avec options explicites
      console.log(`🔓 Ouverture de la base de données en mode lecture/écriture...`);
      const db = await SQLite.openDatabaseAsync(this.dbName, {
        useNewConnection: true,
      });

      // Créer la structure
      await this.createDatabaseStructure(db, onProgress);

      // Importer les données
      await this.importGTFSData(db, onProgress);

      // Créer les vues et index
      await this.createViewsAndIndexes(db, onProgress);

      // Optimisation légère (ANALYZE seulement, pas de VACUUM qui est très lent)
      onProgress?.({
        step: 'optimize',
        progress: 95,
        message: 'Finalisation...'
      });
      // VACUUM est très lent et pas nécessaire à la première initialisation
      // await db.execAsync('VACUUM;');

      // ANALYZE uniquement pour optimiser les requêtes
      await db.execAsync('ANALYZE;');

      // Activer le mode WAL pour permettre les lectures concurrentes
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.execAsync('PRAGMA locking_mode = NORMAL;');
      await db.execAsync('PRAGMA synchronous = NORMAL;');
      console.log('✅ Mode WAL activé pour lectures concurrentes');

      // NE PAS fermer la connexion immédiatement
      // Laisser gtfsDatabaseServiceEnhanced réutiliser cette connexion
      console.log('✅ Base de données prête, fermeture de la connexion...');

      await db.closeAsync();
      console.log('✅ Connexion d\'initialisation fermée');

      // Attendre 2 secondes pour s'assurer que la connexion est libérée
      // Android peut prendre plus de temps que iOS pour libérer les verrous SQLite
      console.log('⏳ Attente de la libération du verrou SQLite...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      onProgress?.({
        step: 'complete',
        progress: 100,
        message: 'Base de données initialisée avec succès !'
      });

      console.log('✅ Base de données GTFS créée avec succès');
      return true;

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de la DB:', error);
      onProgress?.({
        step: 'error',
        progress: 0,
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
      return false;
    }
  }

  /**
   * Crée la structure de la base de données
   */
  private async createDatabaseStructure(
    db: SQLite.SQLiteDatabase,
    onProgress?: ProgressCallback
  ): Promise<void> {
    onProgress?.({
      step: 'structure',
      progress: 5,
      message: 'Création de la structure de la base de données...'
    });

    // Table stops
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS stops (
        stop_id TEXT PRIMARY KEY,
        stop_name TEXT NOT NULL,
        stop_lat REAL NOT NULL,
        stop_lon REAL NOT NULL,
        parent_station TEXT
      );
    `);

    // Table routes
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS routes (
        route_id TEXT PRIMARY KEY,
        route_short_name TEXT,
        route_long_name TEXT,
        route_type INTEGER
      );
    `);

    // Table trips
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS trips (
        trip_id TEXT PRIMARY KEY,
        route_id TEXT NOT NULL,
        service_id TEXT NOT NULL,
        trip_headsign TEXT,
        FOREIGN KEY (route_id) REFERENCES routes(route_id)
      );
    `);

    // Table stop_times
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS stop_times (
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

    // Table calendar_dates
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS calendar_dates (
        service_id TEXT NOT NULL,
        date TEXT NOT NULL,
        exception_type INTEGER NOT NULL,
        PRIMARY KEY (service_id, date)
      );
    `);

    console.log('✓ Structure créée');
  }

  /**
   * Importe les données GTFS depuis les assets
   */
  private async importGTFSData(
    db: SQLite.SQLiteDatabase,
    onProgress?: ProgressCallback
  ): Promise<void> {
    // Import stops
    onProgress?.({
      step: 'import_stops',
      progress: 10,
      message: 'Import des gares...'
    });
    await this.importStops(db);

    // Import routes
    onProgress?.({
      step: 'import_routes',
      progress: 20,
      message: 'Import des lignes...'
    });
    await this.importRoutes(db);

    // Import trips
    onProgress?.({
      step: 'import_trips',
      progress: 30,
      message: 'Import des trajets...'
    });
    await this.importTrips(db);

    // Import stop_times (le plus long)
    onProgress?.({
      step: 'import_stop_times',
      progress: 40,
      message: 'Import des horaires (peut prendre 4-5 minutes)...'
    });
    await this.importStopTimes(db);

    // Import calendar_dates
    onProgress?.({
      step: 'import_calendar',
      progress: 70,
      message: 'Import des calendriers...'
    });
    await this.importCalendarDates(db);
  }

  /**
   * Mapping statique des fichiers GTFS
   * (React Native ne supporte pas le require() dynamique)
   */
  private getAssetModule(filename: string): number | null {
    const assetMap: { [key: string]: number } = {
      'stops.txt': require('../../assets/sncf_data/stops.txt'),
      'routes.txt': require('../../assets/sncf_data/routes.txt'),
      'trips.txt': require('../../assets/sncf_data/trips.txt'),
      'stop_times.txt': require('../../assets/sncf_data/stop_times.txt'),
      'calendar_dates.txt': require('../../assets/sncf_data/calendar_dates.txt'),
    };

    return assetMap[filename] || null;
  }

  /**
   * Lit un fichier CSV depuis les assets
   */
  private async readCSVFromAssets(filename: string): Promise<string[][]> {
    try {
      console.log(`📂 Lecture de ${filename}...`);

      // Obtenir le module d'asset
      const assetModule = this.getAssetModule(filename);
      if (!assetModule) {
        throw new Error(`Fichier ${filename} non trouvé dans le mapping`);
      }

      // Charger le fichier depuis assets/sncf_data
      const asset = Asset.fromModule(assetModule);
      await asset.downloadAsync();

      if (!asset.localUri) {
        throw new Error(`Impossible de charger ${filename}`);
      }

      console.log(`✓ Fichier ${filename} chargé depuis ${asset.localUri}`);

      const content = await FileSystem.readAsStringAsync(asset.localUri);
      const lines = content.split('\n').filter(line => line.trim());

      console.log(`✓ ${lines.length} lignes lues depuis ${filename}`);

      if (lines.length === 0) {
        return [];
      }

      // Parser le CSV
      const rows: string[][] = [];
      for (let i = 0; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        rows.push(values);
      }

      return rows;

    } catch (error) {
      console.error(`❌ Erreur lors de la lecture de ${filename}:`, error);
      return [];
    }
  }

  /**
   * Import des gares
   * OPTIMISÉ: Import par batch
   */
  private async importStops(db: SQLite.SQLiteDatabase): Promise<void> {
    console.log('📍 Début import des gares...');
    const rows = await this.readCSVFromAssets('stops.txt');
    console.log(`📊 ${rows.length} lignes lues depuis stops.txt`);

    if (rows.length <= 1) {
      console.log('⚠️  Pas de données (seulement header)');
      return;
    }

    const headers = rows[0];
    const stopIdIdx = headers.indexOf('stop_id');
    const stopNameIdx = headers.indexOf('stop_name');
    const stopLatIdx = headers.indexOf('stop_lat');
    const stopLonIdx = headers.indexOf('stop_lon');
    const parentStationIdx = headers.indexOf('parent_station');
    const locationTypeIdx = headers.indexOf('location_type');

    const seenStopIds = new Set<string>();
    const BATCH_SIZE = 100;
    let importedCount = 0;

    await db.withTransactionAsync(async () => {
      let batchValues: any[] = [];
      let batchPlaceholders: string[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const stopId = row[stopIdIdx];
        const locationType = row[locationTypeIdx] || '0';

        if ((locationType === '0' || locationType === '1' || locationType === '') && !seenStopIds.has(stopId)) {
          batchPlaceholders.push('(?, ?, ?, ?, ?)');
          batchValues.push(
            stopId,
            row[stopNameIdx],
            parseFloat(row[stopLatIdx]) || 0,
            parseFloat(row[stopLonIdx]) || 0,
            row[parentStationIdx] || null
          );
          seenStopIds.add(stopId);

          // Exécuter par batch
          if (batchPlaceholders.length >= BATCH_SIZE) {
            const sql = `INSERT OR IGNORE INTO stops (stop_id, stop_name, stop_lat, stop_lon, parent_station) VALUES ${batchPlaceholders.join(', ')}`;
            await db.runAsync(sql, batchValues);
            importedCount += batchPlaceholders.length;
            batchValues = [];
            batchPlaceholders = [];
          }
        }
      }

      // Insérer le dernier batch
      if (batchPlaceholders.length > 0) {
        const sql = `INSERT OR IGNORE INTO stops (stop_id, stop_name, stop_lat, stop_lon, parent_station) VALUES ${batchPlaceholders.join(', ')}`;
        await db.runAsync(sql, batchValues);
        importedCount += batchPlaceholders.length;
      }
    });

    console.log(`✅ ${importedCount} gares importées`);
  }

  /**
   * Import des routes
   */
  private async importRoutes(db: SQLite.SQLiteDatabase): Promise<void> {
    const rows = await this.readCSVFromAssets('routes.txt');
    if (rows.length <= 1) return;

    const headers = rows[0];
    const routeIdIdx = headers.indexOf('route_id');
    const routeShortNameIdx = headers.indexOf('route_short_name');
    const routeLongNameIdx = headers.indexOf('route_long_name');
    const routeTypeIdx = headers.indexOf('route_type');

    await db.withTransactionAsync(async () => {
      const stmt = await db.prepareAsync(
        'INSERT OR IGNORE INTO routes (route_id, route_short_name, route_long_name, route_type) VALUES (?, ?, ?, ?)'
      );

      try {
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          await stmt.executeAsync([
            row[routeIdIdx],
            row[routeShortNameIdx] || '',
            row[routeLongNameIdx] || '',
            parseInt(row[routeTypeIdx]) || 0
          ]);
        }
      } finally {
        await stmt.finalizeAsync();
      }
    });

    console.log('✓ Lignes importées');
  }

  /**
   * Import des trips
   */
  private async importTrips(db: SQLite.SQLiteDatabase): Promise<void> {
    const rows = await this.readCSVFromAssets('trips.txt');
    if (rows.length <= 1) return;

    const headers = rows[0];
    const tripIdIdx = headers.indexOf('trip_id');
    const routeIdIdx = headers.indexOf('route_id');
    const serviceIdIdx = headers.indexOf('service_id');
    const tripHeadsignIdx = headers.indexOf('trip_headsign');

    await db.withTransactionAsync(async () => {
      const stmt = await db.prepareAsync(
        'INSERT OR IGNORE INTO trips (trip_id, route_id, service_id, trip_headsign) VALUES (?, ?, ?, ?)'
      );

      try {
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          await stmt.executeAsync([
            row[tripIdIdx],
            row[routeIdIdx],
            row[serviceIdIdx],
            row[tripHeadsignIdx] || ''
          ]);
        }
      } finally {
        await stmt.finalizeAsync();
      }
    });

    console.log('✓ Trajets importés');
  }

  /**
   * Import des horaires (stop_times) - Le plus long !
   * OPTIMISÉ: Import par batch de 500 rows
   */
  private async importStopTimes(db: SQLite.SQLiteDatabase): Promise<void> {
    const rows = await this.readCSVFromAssets('stop_times.txt');
    if (rows.length <= 1) return;

    const headers = rows[0];
    const tripIdIdx = headers.indexOf('trip_id');
    const stopIdIdx = headers.indexOf('stop_id');
    const arrivalTimeIdx = headers.indexOf('arrival_time');
    const departureTimeIdx = headers.indexOf('departure_time');
    const stopSequenceIdx = headers.indexOf('stop_sequence');

    const totalRows = rows.length - 1;
    console.log(`Import de ${totalRows} horaires (optimisé par batch)...`);

    // OPTIMISATION: Désactiver les contraintes temporairement pour plus de vitesse
    await db.execAsync('PRAGMA foreign_keys = OFF;');
    await db.execAsync('PRAGMA synchronous = OFF;');
    await db.execAsync('PRAGMA journal_mode = MEMORY;');
    await db.execAsync('PRAGMA locking_mode = EXCLUSIVE;'); // Lock exclusif pendant l'import

    const BATCH_SIZE = 500;
    let processedRows = 0;

    await db.withTransactionAsync(async () => {
      for (let batchStart = 1; batchStart < rows.length; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, rows.length);

        // Construire une requête INSERT avec valeurs multiples
        const values: any[] = [];
        const placeholders: string[] = [];

        for (let i = batchStart; i < batchEnd; i++) {
          const row = rows[i];
          placeholders.push('(?, ?, ?, ?, ?)');
          values.push(
            row[tripIdIdx],
            row[stopIdIdx],
            row[arrivalTimeIdx],
            row[departureTimeIdx],
            parseInt(row[stopSequenceIdx]) || 0
          );
        }

        // Exécuter l'insertion en batch
        const sql = `INSERT OR IGNORE INTO stop_times (trip_id, stop_id, arrival_time, departure_time, stop_sequence) VALUES ${placeholders.join(', ')}`;
        await db.runAsync(sql, values);

        processedRows += (batchEnd - batchStart);

        // Log progress every 10000 rows
        if (processedRows % 10000 === 0 || processedRows === totalRows) {
          console.log(`  ${processedRows}/${totalRows} horaires importés (${Math.round(processedRows / totalRows * 100)}%)...`);
        }
      }
    });

    // Réactiver les contraintes et configurer pour les lectures concurrentes
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await db.execAsync('PRAGMA synchronous = NORMAL;');
    await db.execAsync('PRAGMA journal_mode = WAL;'); // Mode WAL pour lectures concurrentes
    await db.execAsync('PRAGMA locking_mode = NORMAL;'); // Retour au mode normal

    console.log('✓ Horaires importés');
  }

  /**
   * Import des dates de calendrier
   */
  private async importCalendarDates(db: SQLite.SQLiteDatabase): Promise<void> {
    const rows = await this.readCSVFromAssets('calendar_dates.txt');
    if (rows.length <= 1) return;

    const headers = rows[0];
    const serviceIdIdx = headers.indexOf('service_id');
    const dateIdx = headers.indexOf('date');
    const exceptionTypeIdx = headers.indexOf('exception_type');

    await db.withTransactionAsync(async () => {
      const stmt = await db.prepareAsync(
        'INSERT OR IGNORE INTO calendar_dates (service_id, date, exception_type) VALUES (?, ?, ?)'
      );

      try {
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          await stmt.executeAsync([
            row[serviceIdIdx],
            row[dateIdx],
            parseInt(row[exceptionTypeIdx]) || 0
          ]);
        }
      } finally {
        await stmt.finalizeAsync();
      }
    });

    console.log('✓ Calendriers importés');
  }

  /**
   * Crée les vues et index
   */
  private async createViewsAndIndexes(
    db: SQLite.SQLiteDatabase,
    onProgress?: ProgressCallback
  ): Promise<void> {
    onProgress?.({
      step: 'views',
      progress: 75,
      message: 'Création des vues et index...'
    });

    // Vue direct_connections
    await db.execAsync(`
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

    // Vue transfer_opportunities
    await db.execAsync(`
      CREATE VIEW IF NOT EXISTS transfer_opportunities AS
      SELECT
        arrival.trip_id as arrival_trip_id,
        arrival.stop_id as transfer_stop_id,
        s.stop_name as transfer_stop_name,
        arrival.arrival_time,
        departure.trip_id as departure_trip_id,
        departure.departure_time,
        departure.stop_id as next_stop_id,
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
      WHERE transfer_time_minutes >= 5
        AND transfer_time_minutes <= 120;
    `);

    onProgress?.({
      step: 'indexes',
      progress: 85,
      message: 'Création des index d\'optimisation...'
    });

    // Créer les index
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_stop_times_trip ON stop_times(trip_id);
      CREATE INDEX IF NOT EXISTS idx_stop_times_stop ON stop_times(stop_id);
      CREATE INDEX IF NOT EXISTS idx_stop_times_departure ON stop_times(departure_time);
      CREATE INDEX IF NOT EXISTS idx_stop_times_arrival ON stop_times(arrival_time);
      CREATE INDEX IF NOT EXISTS idx_stop_times_sequence ON stop_times(trip_id, stop_sequence);
      CREATE INDEX IF NOT EXISTS idx_stop_times_stop_arrival ON stop_times(stop_id, arrival_time);
      CREATE INDEX IF NOT EXISTS idx_stop_times_stop_departure ON stop_times(stop_id, departure_time);
      CREATE INDEX IF NOT EXISTS idx_trips_route ON trips(route_id);
      CREATE INDEX IF NOT EXISTS idx_trips_service ON trips(service_id);
      CREATE INDEX IF NOT EXISTS idx_stops_name ON stops(stop_name);
      CREATE INDEX IF NOT EXISTS idx_stops_location ON stops(stop_lat, stop_lon);
      CREATE INDEX IF NOT EXISTS idx_stops_parent_station ON stops(parent_station);
      CREATE INDEX IF NOT EXISTS idx_calendar_dates_service ON calendar_dates(service_id);
      CREATE INDEX IF NOT EXISTS idx_calendar_dates_date ON calendar_dates(date);
    `);

    console.log('✓ Vues et index créés');
  }

  /**
   * Supprime la base de données (pour forcer une réinitialisation)
   */
  async resetDatabase(): Promise<void> {
    try {
      // IMPORTANT: Fermer toutes les connexions ouvertes avant de supprimer
      console.log('🔒 Fermeture des connexions existantes...');

      // Importer dynamiquement pour éviter les dépendances circulaires
      const { gtfsDbEnhanced } = await import('./gtfsDatabaseServiceEnhanced');
      await gtfsDbEnhanced.close();

      // Attendre un peu pour être sûr que la connexion est bien fermée
      await new Promise(resolve => setTimeout(resolve, 500));

      const dbInfo = await FileSystem.getInfoAsync(this.dbPath);
      if (dbInfo.exists) {
        console.log('🗑️  Suppression de la base de données...');
        await FileSystem.deleteAsync(this.dbPath);
        console.log('✓ Base de données supprimée');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la DB:', error);
      throw error;
    }
  }
}

// Export singleton
export const gtfsInitService = new GTFSInitializationService();
export type { InitializationProgress };
