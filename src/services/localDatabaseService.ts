import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SNCFDataLoader } from './sncfDataLoader';

const DB_NAME = 'sncf_data.db';
const DB_VERSION_KEY = '@sncf_db_version';
const DB_INITIALIZED_KEY = '@sncf_db_initialized';
const CURRENT_DB_VERSION = '1.0.0';

// URLs pour les fichiers SNCF (à héberger sur un serveur)
const DATA_URLS = {
  stops: 'https://your-server.com/sncf_data/stops.txt',
  routes: 'https://your-server.com/sncf_data/routes.txt',
  trips: 'https://your-server.com/sncf_data/trips.txt',
  stop_times: 'https://your-server.com/sncf_data/stop_times.txt',
  calendar_dates: 'https://your-server.com/sncf_data/calendar_dates.txt',
};

export class LocalDatabaseService {
  private static db: SQLite.SQLiteDatabase | null = null;

  /**
   * Initialise la base de données
   */
  static async initialize(): Promise<void> {
    try {
      // Ouvrir la base de données
      this.db = await SQLite.openDatabaseAsync(DB_NAME);

      // Vérifier si la base est déjà initialisée
      const isInitialized = await AsyncStorage.getItem(DB_INITIALIZED_KEY);
      const currentVersion = await AsyncStorage.getItem(DB_VERSION_KEY);

      if (!isInitialized || currentVersion !== CURRENT_DB_VERSION) {
        console.log('Initialisation de la base de données...');
        await this.createTables();
        await this.downloadAndPopulateData();
        await AsyncStorage.setItem(DB_INITIALIZED_KEY, 'true');
        await AsyncStorage.setItem(DB_VERSION_KEY, CURRENT_DB_VERSION);
        console.log('Base de données initialisée avec succès');
      } else {
        console.log('Base de données déjà initialisée');
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la base de données:', error);
      throw error;
    }
  }

  /**
   * Crée les tables de la base de données
   */
  private static async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      -- Table des gares
      CREATE TABLE IF NOT EXISTS stops (
        stop_id TEXT PRIMARY KEY,
        stop_name TEXT NOT NULL,
        stop_desc TEXT,
        stop_lat REAL,
        stop_lon REAL,
        zone_id TEXT,
        stop_url TEXT,
        location_type INTEGER,
        parent_station TEXT
      );

      -- Index pour les recherches par nom
      CREATE INDEX IF NOT EXISTS idx_stops_name ON stops(stop_name);
      CREATE INDEX IF NOT EXISTS idx_stops_location ON stops(stop_lat, stop_lon);

      -- Table des lignes
      CREATE TABLE IF NOT EXISTS routes (
        route_id TEXT PRIMARY KEY,
        agency_id TEXT,
        route_short_name TEXT,
        route_long_name TEXT,
        route_desc TEXT,
        route_type INTEGER,
        route_url TEXT,
        route_color TEXT,
        route_text_color TEXT
      );

      -- Table des trajets
      CREATE TABLE IF NOT EXISTS trips (
        trip_id TEXT PRIMARY KEY,
        route_id TEXT,
        service_id TEXT,
        trip_headsign TEXT,
        trip_short_name TEXT,
        direction_id INTEGER,
        block_id TEXT,
        shape_id TEXT,
        wheelchair_accessible INTEGER,
        bikes_allowed INTEGER,
        FOREIGN KEY (route_id) REFERENCES routes(route_id)
      );

      -- Table des horaires
      CREATE TABLE IF NOT EXISTS stop_times (
        trip_id TEXT,
        arrival_time TEXT,
        departure_time TEXT,
        stop_id TEXT,
        stop_sequence INTEGER,
        stop_headsign TEXT,
        pickup_type INTEGER,
        drop_off_type INTEGER,
        shape_dist_traveled REAL,
        PRIMARY KEY (trip_id, stop_sequence),
        FOREIGN KEY (trip_id) REFERENCES trips(trip_id),
        FOREIGN KEY (stop_id) REFERENCES stops(stop_id)
      );

      -- Index pour les recherches d'horaires
      CREATE INDEX IF NOT EXISTS idx_stop_times_stop ON stop_times(stop_id);
      CREATE INDEX IF NOT EXISTS idx_stop_times_departure ON stop_times(departure_time);

      -- Table des dates de service
      CREATE TABLE IF NOT EXISTS calendar_dates (
        service_id TEXT,
        date TEXT,
        exception_type INTEGER,
        PRIMARY KEY (service_id, date)
      );

      -- Index pour les recherches par date
      CREATE INDEX IF NOT EXISTS idx_calendar_dates_date ON calendar_dates(date);
    `);

    console.log('Tables créées avec succès');
  }

  /**
   * Télécharge et importe les données SNCF
   */
  private static async downloadAndPopulateData(): Promise<void> {
    console.log('Téléchargement des données SNCF...');

    // Pour l'instant, on utilise les fichiers locaux
    // En production, il faudra les télécharger depuis un serveur
    await this.importLocalData();
  }

  /**
   * Importe les données depuis les fichiers locaux
   */
  private static async importLocalData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log('📦 Import des données SNCF locales...');

      // Importer les fichiers dans l'ordre
      await this.importStops();
      await this.importRoutes();
      await this.importTrips();
      await this.importStopTimes();
      await this.importCalendarDates();

      console.log('✅ Toutes les données ont été importées avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'import des données:', error);
      throw error;
    }
  }

  /**
   * Importe les gares (stops.txt)
   */
  private static async importStops(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    console.log('📍 Import des gares...');
    const { headers, rows } = await SNCFDataLoader.loadAndParseFile('stops.txt');

    await this.db.execAsync('BEGIN TRANSACTION');

    try {
      let imported = 0;
      for (const row of rows) {
        if (row.length < 9) continue;

        await this.db.runAsync(
          `INSERT OR REPLACE INTO stops
           (stop_id, stop_name, stop_desc, stop_lat, stop_lon, zone_id, stop_url, location_type, parent_station)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          row
        );

        imported++;
        if (imported % 500 === 0) {
          console.log(`   ${imported} gares...`);
        }
      }

      await this.db.execAsync('COMMIT');
      console.log(`✓ ${imported} gares importées`);
    } catch (error) {
      await this.db.execAsync('ROLLBACK');
      throw error;
    }
  }

  /**
   * Importe les lignes (routes.txt)
   */
  private static async importRoutes(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    console.log('🚂 Import des lignes...');
    const { headers, rows } = await SNCFDataLoader.loadAndParseFile('routes.txt');

    await this.db.execAsync('BEGIN TRANSACTION');

    try {
      let imported = 0;
      for (const row of rows) {
        if (row.length < 9) continue;

        await this.db.runAsync(
          `INSERT OR REPLACE INTO routes
           (route_id, agency_id, route_short_name, route_long_name, route_desc, route_type, route_url, route_color, route_text_color)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          row
        );

        imported++;
      }

      await this.db.execAsync('COMMIT');
      console.log(`✓ ${imported} lignes importées`);
    } catch (error) {
      await this.db.execAsync('ROLLBACK');
      throw error;
    }
  }

  /**
   * Importe les trajets (trips.txt)
   */
  private static async importTrips(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    console.log('🛤️  Import des trajets...');
    const { headers, rows } = await SNCFDataLoader.loadAndParseFile('trips.txt');

    await this.db.execAsync('BEGIN TRANSACTION');

    try {
      let imported = 0;
      for (const row of rows) {
        if (row.length < 10) continue;

        await this.db.runAsync(
          `INSERT OR REPLACE INTO trips
           (trip_id, route_id, service_id, trip_headsign, trip_short_name, direction_id, block_id, shape_id, wheelchair_accessible, bikes_allowed)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          row
        );

        imported++;
        if (imported % 5000 === 0) {
          console.log(`   ${imported} trajets...`);
          await this.db.execAsync('COMMIT');
          await this.db.execAsync('BEGIN TRANSACTION');
        }
      }

      await this.db.execAsync('COMMIT');
      console.log(`✓ ${imported} trajets importés`);
    } catch (error) {
      await this.db.execAsync('ROLLBACK');
      throw error;
    }
  }

  /**
   * Importe les horaires (stop_times.txt) - Le plus gros fichier!
   */
  private static async importStopTimes(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    console.log('⏰ Import des horaires (cela peut prendre plusieurs minutes)...');
    const { headers, rows } = await SNCFDataLoader.loadAndParseFile('stop_times.txt');

    await this.db.execAsync('BEGIN TRANSACTION');

    try {
      let imported = 0;
      for (const row of rows) {
        if (row.length < 9) continue;

        await this.db.runAsync(
          `INSERT OR REPLACE INTO stop_times
           (trip_id, arrival_time, departure_time, stop_id, stop_sequence, stop_headsign, pickup_type, drop_off_type, shape_dist_traveled)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          row
        );

        imported++;
        if (imported % 10000 === 0) {
          console.log(`   ${imported} horaires...`);
          await this.db.execAsync('COMMIT');
          await this.db.execAsync('BEGIN TRANSACTION');
        }
      }

      await this.db.execAsync('COMMIT');
      console.log(`✓ ${imported} horaires importés`);
    } catch (error) {
      await this.db.execAsync('ROLLBACK');
      throw error;
    }
  }

  /**
   * Importe les dates de service (calendar_dates.txt)
   */
  private static async importCalendarDates(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    console.log('📅 Import des dates de service...');
    const { headers, rows } = await SNCFDataLoader.loadAndParseFile('calendar_dates.txt');

    await this.db.execAsync('BEGIN TRANSACTION');

    try {
      let imported = 0;
      for (const row of rows) {
        if (row.length < 3) continue;

        await this.db.runAsync(
          `INSERT OR REPLACE INTO calendar_dates
           (service_id, date, exception_type)
           VALUES (?, ?, ?)`,
          row
        );

        imported++;
        if (imported % 5000 === 0) {
          console.log(`   ${imported} dates...`);
          await this.db.execAsync('COMMIT');
          await this.db.execAsync('BEGIN TRANSACTION');
        }
      }

      await this.db.execAsync('COMMIT');
      console.log(`✓ ${imported} dates importées`);
    } catch (error) {
      await this.db.execAsync('ROLLBACK');
      throw error;
    }
  }

  /**
   * Télécharge un fichier depuis une URL
   */
  private static async downloadFile(url: string, filename: string): Promise<string> {
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      fileUri,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        console.log(`Téléchargement de ${filename}: ${(progress * 100).toFixed(0)}%`);
      }
    );

    const result = await downloadResumable.downloadAsync();
    if (!result) throw new Error(`Échec du téléchargement de ${filename}`);

    return result.uri;
  }

  /**
   * Parse un fichier CSV et retourne les lignes
   */
  private static async parseCSV(fileUri: string): Promise<string[][]> {
    const content = await FileSystem.readAsStringAsync(fileUri);
    const lines = content.split('\n');
    const result: string[][] = [];

    for (const line of lines) {
      if (line.trim()) {
        const values = line.split(',').map(v => v.trim());
        result.push(values);
      }
    }

    return result;
  }

  /**
   * Recherche des gares par nom
   */
  static async searchStations(query: string, limit: number = 20): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(
      `SELECT * FROM stops
       WHERE stop_name LIKE ?
       AND location_type = 1
       ORDER BY stop_name
       LIMIT ?`,
      [`%${query}%`, limit]
    );

    return results;
  }

  /**
   * Récupère toutes les gares
   */
  static async getAllStations(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(
      'SELECT * FROM stops WHERE location_type = 1 ORDER BY stop_name'
    );

    return results;
  }

  /**
   * Obtient les horaires de départ depuis une gare
   */
  static async getDepartures(stopId: string, date: string, limit: number = 50): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(
      `SELECT
        st.departure_time,
        st.stop_headsign,
        t.trip_headsign,
        r.route_short_name,
        r.route_long_name,
        s.stop_name as destination
      FROM stop_times st
      JOIN trips t ON st.trip_id = t.trip_id
      JOIN routes r ON t.route_id = r.route_id
      JOIN stops s ON st.stop_id = s.stop_id
      JOIN calendar_dates cd ON t.service_id = cd.service_id
      WHERE st.stop_id = ?
      AND cd.date = ?
      AND cd.exception_type = 1
      ORDER BY st.departure_time
      LIMIT ?`,
      [stopId, date, limit]
    );

    return results;
  }

  /**
   * Obtient le statut de l'initialisation
   */
  static async getInitializationStatus(): Promise<{
    isInitialized: boolean;
    version: string | null;
    needsUpdate: boolean;
  }> {
    const isInitialized = await AsyncStorage.getItem(DB_INITIALIZED_KEY);
    const version = await AsyncStorage.getItem(DB_VERSION_KEY);

    return {
      isInitialized: isInitialized === 'true',
      version,
      needsUpdate: version !== CURRENT_DB_VERSION,
    };
  }

  /**
   * Réinitialise la base de données
   */
  static async reset(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }

    await AsyncStorage.removeItem(DB_INITIALIZED_KEY);
    await AsyncStorage.removeItem(DB_VERSION_KEY);

    // Supprimer le fichier de base de données
    const dbPath = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;
    const fileInfo = await FileSystem.getInfoAsync(dbPath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(dbPath);
    }

    console.log('Base de données réinitialisée');
  }

  /**
   * Ferme la base de données
   */
  static async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}
