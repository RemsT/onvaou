/**
 * Distance approximative d'un POI (à vol d'oiseau) + ouverture de l'itinéraire.
 *
 * On NE calcule PAS le routing : l'app affiche une distance approximative et délègue le vrai
 * itinéraire (durée + mode) à Maps via openDirections. Le mode suggéré (marche/vélo) est dérivé
 * de la distance pour l'icône et le travelmode du lien.
 *
 * Ouverture dans Google Maps via l'URL universelle (iOS + Android, Expo Go, aucun module natif) :
 * `https://www.google.com/maps/dir/?api=1&origin=…&destination=…&travelmode=walking|bicycling`.
 * Ouvre l'app Google Maps si installée (lien universel), sinon le navigateur. Mode = marche/vélo
 * déduit de la distance.
 */
import { Linking, Platform } from 'react-native';
import { TaggedPoi } from '../types';

// Seuil (km, à vol d'oiseau) en dessous duquel on suggère la marche, sinon le vélo.
const WALK_SUGGEST_KM = 2;

// Cap d'accessibilité : au-delà, une activité/POI est jugée trop loin à vélo et masquée.
// Sert au filtre fin runtime (minutes réelles Valhalla) ET de référence au pré-filtre génération.
export const MAX_BIKE_MIN = 20;

/** True si le temps de trajet vélo (minutes réelles) dépasse le cap d'accessibilité. */
export function isBeyondBikeCap(minutes?: number): boolean {
  return minutes != null && minutes > MAX_BIKE_MIN;
}

/** Mode suggéré à partir de la distance à vol d'oiseau. */
export function modeForDistanceKm(km?: number): 'walk' | 'bike' {
  return km != null && km <= WALK_SUGGEST_KM ? 'walk' : 'bike';
}

export function iconForMode(mode?: 'walk' | 'bike'): string {
  return mode === 'bike' ? '🚲' : '🚶';
}

export function labelForMode(mode?: 'walk' | 'bike'): string {
  return mode === 'bike' ? 'à vélo' : 'à pied';
}

function travelModeFor(mode?: 'walk' | 'bike'): 'walking' | 'bicycling' {
  return mode === 'bike' ? 'bicycling' : 'walking';
}

const fr1 = (n: number) => n.toFixed(1).replace('.', ',');

/** Ex: "🚶 à ~1,4 km" / "🚲 à ~3,2 km" (distance à vol d'oiseau). '' si distance inconnue. */
export function formatApprox(poi: TaggedPoi): string {
  if (poi.km == null) return '';
  const icon = iconForMode(modeForDistanceKm(poi.km));
  return `${icon} à ~${fr1(poi.km)} km`;
}

/** Convertit le tracé stocké [lat,lon][] en coords react-native-maps. */
export function routeToCoords(
  route?: [number, number][]
): { latitude: number; longitude: number }[] {
  return (route ?? []).map(([lat, lon]) => ({ latitude: lat, longitude: lon }));
}

type Origin = { lat: number; lon: number };
type DirPoi = { name: string; lat?: number; lon?: number; mode?: 'walk' | 'bike'; km?: number };

/**
 * Lance la navigation gare → POI dans l'app de cartes native, plateforme-aware :
 * - iOS + marche → Apple Plans (`maps.apple.com`, `dirflg=w`), installé par défaut sur iOS.
 * - iOS + vélo → Google Maps (le schéma d'URL Apple n'a pas de flag vélo).
 * - Android → Google Maps avec `dir_action=navigate` (démarre la navigation turn-by-turn).
 * Le mode marche/vélo est déduit de la distance si non fourni.
 */
export function openDirections(origin: Origin, poi: DirPoi): void {
  const mode = poi.mode ?? modeForDistanceKm(poi.km);
  const o = `${origin.lat},${origin.lon}`;
  const dest =
    poi.lat != null && poi.lon != null ? `${poi.lat},${poi.lon}` : encodeURIComponent(poi.name);

  // iOS en marche : Apple Plans (le vélo n'existe pas dans le schéma d'URL Apple → Google).
  if (Platform.OS === 'ios' && mode !== 'bike') {
    const appleUrl = `http://maps.apple.com/?saddr=${o}&daddr=${dest}&dirflg=w`;
    Linking.openURL(appleUrl).catch(() => {});
    return;
  }

  const travelmode = travelModeFor(mode);
  // dir_action=navigate démarre directement la navigation turn-by-turn (au lieu du simple aperçu).
  const googleUrl = `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${dest}&travelmode=${travelmode}&dir_action=navigate`;
  Linking.openURL(googleUrl).catch(() => {});
}
