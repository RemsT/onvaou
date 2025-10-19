import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';

interface ImportProgress {
  file: string;
  progress: number;
  total: number;
  status: 'downloading' | 'processing' | 'complete' | 'error';
  message?: string;
}

export type ProgressCallback = (progress: ImportProgress) => void;

export class DataImportService {
  /**
   * Télécharge et importe tous les fichiers SNCF
   */
  static async downloadAndImportAll(
    db: SQLite.SQLiteDatabase,
    baseUrl: string,
    onProgress?: ProgressCallback
  ): Promise<void> {
    const files = [
      { name: 'stops.txt', table: 'stops', parser: this.parseStops },
      { name: 'routes.txt', table: 'routes', parser: this.parseRoutes },
      { name: 'trips.txt', table: 'trips', parser: this.parseTrips },
      { name: 'stop_times.txt', table: 'stop_times', parser: this.parseStopTimes },
      { name: 'calendar_dates.txt', table: 'calendar_dates', parser: this.parseCalendarDates },
    ];

    for (const file of files) {
      try {
        onProgress?.({
          file: file.name,
          progress: 0,
          total: 100,
          status: 'downloading',
          message: `Téléchargement de ${file.name}...`,
        });

        // Télécharger le fichier
        const fileUri = await this.downloadFile(
          `${baseUrl}/${file.name}`,
          file.name,
          (progress) => {
            onProgress?.({
              file: file.name,
              progress: progress * 50, // 50% pour le téléchargement
              total: 100,
              status: 'downloading',
            });
          }
        );

        onProgress?.({
          file: file.name,
          progress: 50,
          total: 100,
          status: 'processing',
          message: `Traitement de ${file.name}...`,
        });

        // Parser et importer
        await file.parser(db, fileUri, (progress, total) => {
          const percentage = 50 + (progress / total) * 50; // 50% restants pour l'import
          onProgress?.({
            file: file.name,
            progress: percentage,
            total: 100,
            status: 'processing',
          });
        });

        // Supprimer le fichier temporaire
        await FileSystem.deleteAsync(fileUri, { idempotent: true });

        onProgress?.({
          file: file.name,
          progress: 100,
          total: 100,
          status: 'complete',
          message: `${file.name} importé avec succès`,
        });
      } catch (error) {
        onProgress?.({
          file: file.name,
          progress: 0,
          total: 100,
          status: 'error',
          message: `Erreur: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
        throw error;
      }
    }
  }

  /**
   * Télécharge un fichier avec progression
   */
  private static async downloadFile(
    url: string,
    filename: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      fileUri,
      {},
      (downloadProgress) => {
        const progress =
          downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        onProgress?.(progress);
      }
    );

    const result = await downloadResumable.downloadAsync();
    if (!result) throw new Error(`Échec du téléchargement de ${filename}`);

    return result.uri;
  }

  /**
   * Parse et importe le fichier stops.txt
   */
  private static async parseStops(
    db: SQLite.SQLiteDatabase,
    fileUri: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<void> {
    const content = await FileSystem.readAsStringAsync(fileUri);
    const lines = content.split('\n');
    const header = lines[0].split(',');

    await db.execAsync('BEGIN TRANSACTION');

    try {
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = this.parseCSVLine(lines[i]);
        if (values.length < 9) continue;

        await db.runAsync(
          `INSERT OR REPLACE INTO stops
           (stop_id, stop_name, stop_desc, stop_lat, stop_lon, zone_id, stop_url, location_type, parent_station)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          values
        );

        if (i % 100 === 0) {
          onProgress?.(i, lines.length);
        }
      }

      await db.execAsync('COMMIT');
      onProgress?.(lines.length, lines.length);
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  }

  /**
   * Parse et importe le fichier routes.txt
   */
  private static async parseRoutes(
    db: SQLite.SQLiteDatabase,
    fileUri: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<void> {
    const content = await FileSystem.readAsStringAsync(fileUri);
    const lines = content.split('\n');

    await db.execAsync('BEGIN TRANSACTION');

    try {
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = this.parseCSVLine(lines[i]);
        if (values.length < 9) continue;

        await db.runAsync(
          `INSERT OR REPLACE INTO routes
           (route_id, agency_id, route_short_name, route_long_name, route_desc, route_type, route_url, route_color, route_text_color)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          values
        );

        if (i % 100 === 0) {
          onProgress?.(i, lines.length);
        }
      }

      await db.execAsync('COMMIT');
      onProgress?.(lines.length, lines.length);
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  }

  /**
   * Parse et importe le fichier trips.txt
   */
  private static async parseTrips(
    db: SQLite.SQLiteDatabase,
    fileUri: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<void> {
    const content = await FileSystem.readAsStringAsync(fileUri);
    const lines = content.split('\n');

    await db.execAsync('BEGIN TRANSACTION');

    try {
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = this.parseCSVLine(lines[i]);
        if (values.length < 10) continue;

        await db.runAsync(
          `INSERT OR REPLACE INTO trips
           (trip_id, route_id, service_id, trip_headsign, trip_short_name, direction_id, block_id, shape_id, wheelchair_accessible, bikes_allowed)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          values
        );

        if (i % 1000 === 0) {
          onProgress?.(i, lines.length);
        }
      }

      await db.execAsync('COMMIT');
      onProgress?.(lines.length, lines.length);
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  }

  /**
   * Parse et importe le fichier stop_times.txt (le plus gros fichier)
   */
  private static async parseStopTimes(
    db: SQLite.SQLiteDatabase,
    fileUri: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<void> {
    const content = await FileSystem.readAsStringAsync(fileUri);
    const lines = content.split('\n');

    await db.execAsync('BEGIN TRANSACTION');

    try {
      let batchCount = 0;
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = this.parseCSVLine(lines[i]);
        if (values.length < 9) continue;

        await db.runAsync(
          `INSERT OR REPLACE INTO stop_times
           (trip_id, arrival_time, departure_time, stop_id, stop_sequence, stop_headsign, pickup_type, drop_off_type, shape_dist_traveled)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          values
        );

        batchCount++;

        // Commit par batch de 5000 pour optimiser
        if (batchCount >= 5000) {
          await db.execAsync('COMMIT');
          await db.execAsync('BEGIN TRANSACTION');
          batchCount = 0;
        }

        if (i % 1000 === 0) {
          onProgress?.(i, lines.length);
        }
      }

      await db.execAsync('COMMIT');
      onProgress?.(lines.length, lines.length);
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  }

  /**
   * Parse et importe le fichier calendar_dates.txt
   */
  private static async parseCalendarDates(
    db: SQLite.SQLiteDatabase,
    fileUri: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<void> {
    const content = await FileSystem.readAsStringAsync(fileUri);
    const lines = content.split('\n');

    await db.execAsync('BEGIN TRANSACTION');

    try {
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = this.parseCSVLine(lines[i]);
        if (values.length < 3) continue;

        await db.runAsync(
          `INSERT OR REPLACE INTO calendar_dates
           (service_id, date, exception_type)
           VALUES (?, ?, ?)`,
          values
        );

        if (i % 1000 === 0) {
          onProgress?.(i, lines.length);
        }
      }

      await db.execAsync('COMMIT');
      onProgress?.(lines.length, lines.length);
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  }

  /**
   * Parse une ligne CSV en tenant compte des guillemets
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Estime la taille totale des fichiers à télécharger
   */
  static getEstimatedDownloadSize(): number {
    // En MB
    return 60; // Environ 60 MB pour tous les fichiers SNCF
  }
}
