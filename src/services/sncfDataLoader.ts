/**
 * Service pour charger les fichiers SNCF locaux
 * Utilise require() pour embarquer les fichiers dans le bundle Expo
 */

// Import des fichiers CSV comme assets
const stopsData = require('../data/sncf_data/stops.txt');
const routesData = require('../data/sncf_data/routes.txt');
const tripsData = require('../data/sncf_data/trips.txt');
const stopTimesData = require('../data/sncf_data/stop_times.txt');
const calendarDatesData = require('../data/sncf_data/calendar_dates.txt');

export class SNCFDataLoader {
  /**
   * Charge le contenu d'un fichier SNCF
   */
  static async loadFileContent(filename: string): Promise<string> {
    // Note: Avec Expo, les fichiers .txt requis via require() retournent leur URI
    // On doit utiliser fetch pour lire leur contenu
    let fileUri: any;

    switch (filename) {
      case 'stops.txt':
        fileUri = stopsData;
        break;
      case 'routes.txt':
        fileUri = routesData;
        break;
      case 'trips.txt':
        fileUri = tripsData;
        break;
      case 'stop_times.txt':
        fileUri = stopTimesData;
        break;
      case 'calendar_dates.txt':
        fileUri = calendarDatesData;
        break;
      default:
        throw new Error(`Fichier inconnu: ${filename}`);
    }

    try {
      const response = await fetch(fileUri);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error(`Erreur lors du chargement de ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Parse une ligne CSV en tenant compte des guillemets
   */
  static parseCSVLine(line: string): string[] {
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
   * Parse le contenu CSV complet
   */
  static parseCSVContent(content: string): { headers: string[]; rows: string[][] } {
    const lines = content.split('\n');
    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = this.parseCSVLine(lines[0]);
    const rows: string[][] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = this.parseCSVLine(line);
      rows.push(values);
    }

    return { headers, rows };
  }

  /**
   * Charge et parse un fichier CSV
   */
  static async loadAndParseFile(filename: string): Promise<{ headers: string[]; rows: string[][] }> {
    const content = await this.loadFileContent(filename);
    return this.parseCSVContent(content);
  }
}
