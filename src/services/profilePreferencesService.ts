import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trail, TaggedPoi } from '../types';

/**
 * Préférences de profil pour les sorties à la journée (rando / vélo).
 *
 * Ces critères filtrent les tours quand le tag Randonnée et/ou Vélo est sélectionné dans une
 * recherche : une destination ne « compte » comme rando/vélo que si elle possède un tour
 * conforme (distance dans la plage, type compatible, durée ≤ max). Cohérent partout (filtre de
 * recherche + affichage de la fiche) via stationLabels.setTrailPrefs.
 */
const KEY = '@onvaou_profile_v1';

export interface TrailPreferences {
  randoKm: [number, number];   // plage de distance randonnée (km)
  veloKm: [number, number];    // plage de distance vélo (km)
  trailType: 'loop' | 'linear' | 'both';
  maxMinutes: number | null;   // durée estimée max d'un tour (min), null = pas de limite
  maxAccessMinutes: number;    // temps max pour rejoindre un centre d'intérêt (min) — converti en
                               // distance selon le mode (à pied ~4 km/h, à vélo ~13 km/h)
  campingMinStars: number;     // camping : nombre d'étoiles minimum (0 = indifférent)
  campingIncludeUnrated: boolean; // camping : afficher les campings non classés
}

// Vitesses (km/h) pour convertir un temps d'accès en distance à vol d'oiseau, selon le mode.
const WALK_KMH = 4;
const BIKE_KMH = 13;
/** Rayon (km) accessible en `minutes` selon le mode de déplacement (temps max du profil). */
export function accessMinutesToKm(minutes: number, mode: 'walk' | 'bike'): number {
  return (minutes / 60) * (mode === 'bike' ? BIKE_KMH : WALK_KMH);
}

// Défauts NON restrictifs : on montre tout par défaut (couvre toute la plage des tours générés —
// rando jusqu'à 30 km, vélo jusqu'à 100 km), l'utilisateur resserre ensuite s'il le souhaite.
// Des min trop hauts masqueraient la moitié des tours (beaucoup de courts < 10 km).
export const DEFAULT_PREFERENCES: TrailPreferences = {
  randoKm: [1, 60],
  veloKm: [3, 200],
  trailType: 'both',
  maxMinutes: null,
  maxAccessMinutes: 30, // temps max pour rejoindre un centre d'intérêt (les deux modes)
  campingMinStars: 0,            // indifférent par défaut
  campingIncludeUnrated: true,   // afficher les campings non classés par défaut
};

/** Extrait le nombre d'étoiles d'un champ « Classements_du_POI » DATAtourisme (ex. « 3 étoiles#… »). */
export function parseStars(classements: string | undefined | null): number | undefined {
  if (!classements) return undefined;
  const m = classements.match(/(\d+)\s*étoiles?/i);
  if (!m) return undefined;
  const n = parseInt(m[1], 10);
  return n >= 1 && n <= 5 ? n : undefined;
}

/** Un camping (POI avec `stars?`) respecte-t-il les préférences de profil ? */
export function campingMatches(poi: TaggedPoi, prefs: TrailPreferences): boolean {
  if (poi.stars == null) return prefs.campingIncludeUnrated; // non classé
  return poi.stars >= prefs.campingMinStars;
}

/** Un tour respecte-t-il les préférences (selon son mode) ? */
export function trailMatchesPreferences(trail: Trail, prefs: TrailPreferences): boolean {
  const [min, max] = trail.mode === 'bike' ? prefs.veloKm : prefs.randoKm;
  if (trail.km < min || trail.km > max) return false;
  if (prefs.trailType === 'loop' && !trail.loop) return false;
  if (prefs.trailType === 'linear' && trail.loop) return false;
  if (prefs.maxMinutes != null && trail.minutes > prefs.maxMinutes) return false;
  return true;
}

export const profilePreferencesService = {
  async getPreferences(): Promise<TrailPreferences> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (!raw) return DEFAULT_PREFERENCES;
      // Fusionne avec les défauts pour rester robuste si le schéma évolue.
      return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<TrailPreferences>) };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  },

  async savePreferences(prefs: TrailPreferences): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
  },
};
