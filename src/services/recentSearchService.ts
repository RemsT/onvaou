import AsyncStorage from '@react-native-async-storage/async-storage';
import { Station, CityLabel } from '../types';

// Stockage séparé : l'historique et les favoris sont deux listes indépendantes.
// Supprimer/purger l'historique n'affecte jamais les favoris (et inversement).
const KEY_HISTORY = '@onvaou_history_v3';
const KEY_FAVORITES = '@onvaou_favorites_v3';
const KEY_LEGACY = '@onvaou_searches_v2'; // ancienne liste unique (migration)
const MAX_HISTORY = 10;

export interface RecentSearch {
  id: string;
  timestamp: number;
  isFavorite: boolean;
  fromStation: Station;
  enableTimeFilter: boolean;
  enableBudgetFilter: boolean;
  maxTime: string;
  maxBudget: string;
  selectedDate: number | null;
  selectedLabels: CityLabel[];
  labelFilterMode: 'OR' | 'AND';
  timeRangeStart: string;
  timeRangeEnd: string;
  includeTransfers: boolean;
}

async function loadKey(key: string): Promise<RecentSearch[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as RecentSearch[]) : [];
  } catch {
    return [];
  }
}

async function saveKey(key: string, list: RecentSearch[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(list));
}

// Migration unique depuis l'ancienne liste unique vers les deux listes séparées.
let migrated = false;
async function migrate(): Promise<void> {
  if (migrated) return;
  const existing = await AsyncStorage.getItem(KEY_HISTORY);
  if (existing === null) {
    const legacyRaw = await AsyncStorage.getItem(KEY_LEGACY);
    const legacy: RecentSearch[] = legacyRaw ? JSON.parse(legacyRaw) : [];
    await saveKey(KEY_HISTORY, legacy);
    await saveKey(KEY_FAVORITES, legacy.filter(s => s.isFavorite));
  }
  migrated = true;
}

const sortDesc = (list: RecentSearch[]) => [...list].sort((a, b) => b.timestamp - a.timestamp);

export const recentSearchService = {
  async save(params: Omit<RecentSearch, 'id' | 'timestamp' | 'isFavorite'>): Promise<void> {
    await migrate();
    const history = await loadKey(KEY_HISTORY);
    const entry: RecentSearch = {
      ...params,
      id: Date.now().toString(),
      timestamp: Date.now(),
      isFavorite: false,
    };
    await saveKey(KEY_HISTORY, [entry, ...history].slice(0, MAX_HISTORY));
  },

  async getAll(): Promise<RecentSearch[]> {
    await migrate();
    return sortDesc(await loadKey(KEY_HISTORY));
  },

  async getFavorites(): Promise<RecentSearch[]> {
    await migrate();
    return sortDesc(await loadKey(KEY_FAVORITES));
  },

  async get(): Promise<RecentSearch | null> {
    await migrate();
    const sorted = sortDesc(await loadKey(KEY_HISTORY));
    return sorted.length > 0 ? sorted[0] : null;
  },

  // Bascule le statut favori d'un enregistrement (depuis l'historique ou les favoris).
  // Ajoute une copie dans les favoris, ou l'en retire, sans toucher à l'historique.
  async toggleFavorite(id: string): Promise<void> {
    await migrate();
    const favorites = await loadKey(KEY_FAVORITES);
    const history = await loadKey(KEY_HISTORY);
    const isFav = favorites.some(f => f.id === id);

    if (isFav) {
      // Retirer des favoris + remettre l'étoile vide dans l'historique
      await saveKey(KEY_FAVORITES, favorites.filter(f => f.id !== id));
      await saveKey(KEY_HISTORY, history.map(h => h.id === id ? { ...h, isFavorite: false } : h));
    } else {
      // Ajouter aux favoris (copie de l'enregistrement de l'historique)
      const src = history.find(h => h.id === id);
      if (src) {
        await saveKey(KEY_FAVORITES, [{ ...src, isFavorite: true }, ...favorites]);
        await saveKey(KEY_HISTORY, history.map(h => h.id === id ? { ...h, isFavorite: true } : h));
      }
    }
  },

  // Supprime un enregistrement de l'HISTORIQUE uniquement (les favoris persistent).
  async remove(id: string): Promise<void> {
    await migrate();
    const history = await loadKey(KEY_HISTORY);
    await saveKey(KEY_HISTORY, history.filter(h => h.id !== id));
  },

  // Supprime un enregistrement des FAVORIS uniquement (l'historique persiste).
  async removeFavorite(id: string): Promise<void> {
    await migrate();
    const favorites = await loadKey(KEY_FAVORITES);
    await saveKey(KEY_FAVORITES, favorites.filter(f => f.id !== id));
    // Remet l'étoile vide dans l'historique si l'enregistrement y est encore présent
    const history = await loadKey(KEY_HISTORY);
    if (history.some(h => h.id === id)) {
      await saveKey(KEY_HISTORY, history.map(h => h.id === id ? { ...h, isFavorite: false } : h));
    }
  },

  // Vide l'HISTORIQUE uniquement (les favoris persistent).
  async clear(): Promise<void> {
    await migrate();
    await saveKey(KEY_HISTORY, []);
  },
};
