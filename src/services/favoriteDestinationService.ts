import AsyncStorage from '@react-native-async-storage/async-storage';
import { SearchResult } from '../types';

/**
 * Destinations sauvegardées (« gardées ») par l'utilisateur, indépendantes des recherches favorites.
 *
 * On stocke le `SearchResult` COMPLET de la destination afin de pouvoir ré-ouvrir directement
 * l'écran DestinationDetail (carte, activités/tags, « Voir le trajet », lien SNCF) sans relancer
 * de recherche. Les horaires de train (départs/retours, date du lien SNCF) sont, eux, rafraîchis
 * au runtime à la réouverture (date du jour par défaut, modifiable sur la fiche).
 *
 * Déduplication par gare d'arrivée (`to_station_id`/UIC) : une même destination n'apparaît qu'une fois.
 */
const KEY = '@onvaou_fav_destinations_v1';

export interface FavoriteDestination {
  id: string;          // identifiant stable = uic/to_station_id
  timestamp: number;   // date de sauvegarde
  destination: SearchResult;
}

/** Clé de déduplication d'une destination (gare d'arrivée). */
function destKey(r: SearchResult): string {
  return String(r.to_station_id ?? r.to_station?.name ?? r.id);
}

async function load(): Promise<FavoriteDestination[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FavoriteDestination[]) : [];
  } catch {
    return [];
  }
}

async function persist(list: FavoriteDestination[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export const favoriteDestinationService = {
  async getAll(): Promise<FavoriteDestination[]> {
    return (await load()).sort((a, b) => b.timestamp - a.timestamp);
  },

  async isFavorite(result: SearchResult): Promise<boolean> {
    const key = destKey(result);
    return (await load()).some((f) => f.id === key);
  },

  /** Sauvegarde une destination (no-op si déjà présente). */
  async save(result: SearchResult): Promise<void> {
    const key = destKey(result);
    const list = await load();
    if (list.some((f) => f.id === key)) return;
    await persist([{ id: key, timestamp: Date.now(), destination: result }, ...list]);
  },

  async remove(id: string): Promise<void> {
    const list = await load();
    await persist(list.filter((f) => f.id !== id));
  },

  /** Bascule le statut sauvegardé ; renvoie le nouvel état (true = désormais favori). */
  async toggle(result: SearchResult): Promise<boolean> {
    const key = destKey(result);
    const list = await load();
    if (list.some((f) => f.id === key)) {
      await persist(list.filter((f) => f.id !== key));
      return false;
    }
    await persist([{ id: key, timestamp: Date.now(), destination: result }, ...list]);
    return true;
  },
};
