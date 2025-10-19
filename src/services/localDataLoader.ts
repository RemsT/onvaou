import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

/**
 * Service pour charger les fichiers SNCF depuis les assets locaux
 */
export class LocalDataLoader {
  /**
   * Charge un fichier CSV depuis les assets
   */
  static async loadAssetFile(filename: string): Promise<string> {
    try {
      // Pour les fichiers dans assets/sncf_data/
      // On utilise require() pour les charger
      const assetPath = `../../assets/sncf_data/${filename}`;

      // En développement, lire directement depuis le dossier src/data
      const localPath = `${FileSystem.documentDirectory}../../../src/data/sncf_data/${filename}`;

      try {
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        if (fileInfo.exists) {
          console.log(`Lecture du fichier local: ${filename}`);
          return await FileSystem.readAsStringAsync(localPath);
        }
      } catch (e) {
        console.log('Fichier local non trouvé, tentative avec assets');
      }

      // Fallback: essayer de charger depuis assets
      console.log(`Chargement depuis assets: ${filename}`);
      const asset = Asset.fromModule(require(`../../assets/sncf_data/${filename}`));
      await asset.downloadAsync();

      if (asset.localUri) {
        return await FileSystem.readAsStringAsync(asset.localUri);
      }

      throw new Error(`Impossible de charger ${filename}`);
    } catch (error) {
      console.error(`Erreur lors du chargement de ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Parse un contenu CSV en lignes
   */
  static parseCSVContent(content: string): string[][] {
    const lines = content.split('\n');
    const result: string[][] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      // Parser CSV avec gestion des guillemets
      const values = this.parseCSVLine(line);
      result.push(values);
    }

    return result;
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
   * Charge et parse un fichier CSV complet
   */
  static async loadAndParseCSV(filename: string): Promise<{
    headers: string[];
    rows: string[][];
  }> {
    const content = await this.loadAssetFile(filename);
    const allLines = this.parseCSVContent(content);

    if (allLines.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = allLines[0];
    const rows = allLines.slice(1);

    return { headers, rows };
  }
}
