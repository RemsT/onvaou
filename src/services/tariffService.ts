/**
 * Service de tarification SNCF réelle
 * Télécharge les vrais tarifs depuis ressources.data.sncf.com
 * et les met en cache localement.
 *
 * Sources :
 *  - Intercités : tarifs-intercites (325 KB)
 *  - TGV INOUI / OUIGO : tarifs-tgv-inoui-ouigo (~3 MB)
 *
 * Format CSV (séparateur `;`) :
 *  Intercités : transporteur;origine;origine_uic8;destination;destination_uic8;classe;profil_tarifaire;type_place;prix_min;prix_max
 *  TGV        : transporteur;gare_origine;gare_origine_code_uic;gare_destination;gare_destination_code_uic;classe;profil_tarifaire;prix_minimum;prix_maximum
 */

import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INTERCITIES_URL =
  'https://ressources.data.sncf.com/api/explore/v2.1/catalog/datasets/tarifs-intercites/exports/csv';
const TGV_URL =
  'https://ressources.data.sncf.com/api/explore/v2.1/catalog/datasets/tarifs-tgv-inoui-ouigo/exports/csv';

const TARIFS_DIR = `${FileSystem.documentDirectory}tarifs/`;
const INTERCITIES_CACHE = `${TARIFS_DIR}intercites.csv`;
const TGV_CACHE = `${TARIFS_DIR}tgv.csv`;
const TIMESTAMP_KEY = 'tarifs_download_date';
const MAX_AGE_DAYS = 7;

type PriceEntry = { min: number; max: number };

class TariffService {
  /** Map clé : "${uic8_from}-${uic8_to}" → {min, max} */
  private tariffMap = new Map<string, PriceEntry>();
  private loaded = false;

  // ─────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────

  /**
   * Cherche le prix réel pour un trajet (UIC8 → UIC8).
   * Essaie les deux sens (A→B et B→A) car certaines lignes
   * n'ont les tarifs que dans un seul sens.
   * Renvoie null si aucune donnée disponible.
   */
  getPrice(fromUIC8: string, toUIC8: string): PriceEntry | null {
    if (!this.loaded) return null;
    const key = `${fromUIC8}-${toUIC8}`;
    const reverse = `${toUIC8}-${fromUIC8}`;
    return this.tariffMap.get(key) ?? this.tariffMap.get(reverse) ?? null;
  }

  /**
   * Charge les tarifs (télécharge si nécessaire).
   * À appeler une fois au démarrage de l'app.
   */
  async loadTariffs(): Promise<void> {
    try {
      await this.ensureDirExists();

      const shouldDownload = await this.isStale();
      if (shouldDownload) {
        await this.downloadTariffs();
      }

      await this.parseTariffs();

      // Si aucune paire chargée après parsing, le fichier est probablement corrompu
      // → forcer un re-téléchargement
      if (this.tariffMap.size === 0 && !shouldDownload) {
        console.log('⚠️ Aucun tarif parsé, re-téléchargement...');
        await this.downloadTariffs();
        await this.parseTariffs();
      }

      this.loaded = true;
      console.log(`✅ Tarifs chargés : ${this.tariffMap.size} paires O/D`);
    } catch (error) {
      // En cas d'échec, on continue sans tarifs réels (fallback vers estimation)
      console.warn('⚠️ Impossible de charger les tarifs SNCF :', error);
      this.loaded = true; // marquer comme chargé pour ne pas bloquer
    }
  }

  // ─────────────────────────────────────────────
  // Download
  // ─────────────────────────────────────────────

  private async ensureDirExists(): Promise<void> {
    const info = await FileSystem.getInfoAsync(TARIFS_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(TARIFS_DIR, { intermediates: true });
    }
  }

  private async isStale(): Promise<boolean> {
    const [intercitiesInfo, tgvInfo] = await Promise.all([
      FileSystem.getInfoAsync(INTERCITIES_CACHE),
      FileSystem.getInfoAsync(TGV_CACHE),
    ]);
    if (!intercitiesInfo.exists || !tgvInfo.exists) return true;

    const dateStr = await AsyncStorage.getItem(TIMESTAMP_KEY);
    if (!dateStr) return true;

    const lastDownload = new Date(dateStr);
    const ageDays = (Date.now() - lastDownload.getTime()) / 86_400_000;
    return ageDays > MAX_AGE_DAYS;
  }

  private async downloadTariffs(): Promise<void> {
    console.log('⬇️  Téléchargement des tarifs SNCF...');

    await Promise.all([
      FileSystem.downloadAsync(INTERCITIES_URL, INTERCITIES_CACHE),
      FileSystem.downloadAsync(TGV_URL, TGV_CACHE),
    ]);

    await AsyncStorage.setItem(TIMESTAMP_KEY, new Date().toISOString());
    console.log('✅ Tarifs téléchargés');
  }

  // ─────────────────────────────────────────────
  // Parsing
  // ─────────────────────────────────────────────

  private async parseTariffs(): Promise<void> {
    this.tariffMap.clear();

    const [intercitiesExists, tgvExists] = await Promise.all([
      FileSystem.getInfoAsync(INTERCITIES_CACHE),
      FileSystem.getInfoAsync(TGV_CACHE),
    ]);

    if (intercitiesExists.exists) {
      const csv = await FileSystem.readAsStringAsync(INTERCITIES_CACHE);
      this.parseIntercitiesCSV(csv);
    }

    if (tgvExists.exists) {
      const csv = await FileSystem.readAsStringAsync(TGV_CACHE);
      this.parseTGVCSV(csv);
    }
  }

  /**
   * Intercités CSV :
   * transporteur;origine;origine_uic8;destination;destination_uic8;
   * classe;profil_tarifaire;type_place;prix_min;prix_max
   */
  private parseIntercitiesCSV(csv: string): void {
    const lines = csv.split(/\r?\n/);
    if (lines.length < 2) return;

    const headers = lines[0].replace(/^\uFEFF/, '').split(';').map(h => h.trim());
    const fromUICIdx = headers.indexOf('origine_uic8');
    const toUICIdx = headers.indexOf('destination_uic8');
    const classeIdx = headers.indexOf('classe');
    const minIdx = headers.indexOf('prix_min');
    const maxIdx = headers.indexOf('prix_max');

    if (fromUICIdx < 0 || toUICIdx < 0 || minIdx < 0 || maxIdx < 0) {
      console.warn('⚠️ CSV Intercités : colonnes inattendues', headers);
      return;
    }

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(';');
      if (cols.length <= maxIdx) continue;
      if (cols[classeIdx]?.trim() !== '2') continue; // 2e classe uniquement

      const fromUIC = cols[fromUICIdx]?.trim();
      const toUIC = cols[toUICIdx]?.trim();
      const min = parseFloat(cols[minIdx]);
      const max = parseFloat(cols[maxIdx]);

      if (!fromUIC || !toUIC || isNaN(min) || isNaN(max)) continue;

      this.mergeEntry(`${fromUIC}-${toUIC}`, min, max);
    }
  }

  /**
   * TGV CSV :
   * transporteur;gare_origine;gare_origine_code_uic;gare_destination;
   * gare_destination_code_uic;classe;profil_tarifaire;prix_minimum;prix_maximum
   */
  private parseTGVCSV(csv: string): void {
    const lines = csv.split(/\r?\n/);
    if (lines.length < 2) return;

    const headers = lines[0].replace(/^\uFEFF/, '').split(';').map(h => h.trim());
    const fromUICIdx = headers.indexOf('gare_origine_code_uic');
    const toUICIdx = headers.indexOf('gare_destination_code_uic');
    const classeIdx = headers.indexOf('classe');
    const minIdx = headers.indexOf('prix_minimum');
    const maxIdx = headers.indexOf('prix_maximum');

    if (fromUICIdx < 0 || toUICIdx < 0 || minIdx < 0 || maxIdx < 0) {
      console.warn('⚠️ CSV TGV : colonnes inattendues', headers);
      return;
    }

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(';');
      if (cols.length <= maxIdx) continue;
      if (cols[classeIdx]?.trim() !== '2') continue;

      const fromUIC = cols[fromUICIdx]?.trim();
      const toUIC = cols[toUICIdx]?.trim();
      const min = parseFloat(cols[minIdx]);
      const max = parseFloat(cols[maxIdx]);

      if (!fromUIC || !toUIC || isNaN(min) || isNaN(max)) continue;

      this.mergeEntry(`${fromUIC}-${toUIC}`, min, max);
    }
  }

  /**
   * Fusionne une entrée O/D : garde le min le plus bas et le max le plus haut
   * (plusieurs profils tarifaires par paire → on veut l'amplitude totale)
   */
  private mergeEntry(key: string, min: number, max: number): void {
    const existing = this.tariffMap.get(key);
    if (!existing) {
      this.tariffMap.set(key, { min, max });
    } else {
      this.tariffMap.set(key, {
        min: Math.min(existing.min, min),
        max: Math.max(existing.max, max),
      });
    }
  }
}

export const tariffService = new TariffService();
