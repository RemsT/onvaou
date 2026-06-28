/**
 * Routing piéton/vélo au runtime via l'instance publique Valhalla de FOSSGIS
 * (https://valhalla1.openstreetmap.de) — gratuite, sans clé d'API.
 *
 * Utilisé par RouteMapScreen pour afficher le VRAI tracé de l'itinéraire sur la
 * carte native (au lieu de la ligne droite à vol d'oiseau). En cas d'échec réseau
 * ou de réponse invalide, on renvoie null : l'appelant retombe sur la ligne droite.
 */

const VALHALLA_URL = 'https://valhalla1.openstreetmap.de/route';

type LatLng = { latitude: number; longitude: number };

export type RouteResult = {
  coords: LatLng[]; // tracé décodé (gare → POI)
  km: number;       // distance réelle du tracé
  minutes: number;  // durée estimée par Valhalla
};

/** Décode une polyligne encodée précision 6 (Valhalla, et géométries `Trail.geom` embarquées). */
export function decodePolyline6(str: string): LatLng[] {
  const coords: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const factor = 1e6;

  while (index < str.length) {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coords.push({ latitude: lat / factor, longitude: lng / factor });
  }
  return coords;
}

/**
 * Calcule l'itinéraire piéton (walk) ou vélo (bike) entre deux points.
 * Renvoie null si le routing échoue (réseau, timeout, réponse inattendue).
 */
export async function fetchRoute(
  origin: { lat: number; lon: number },
  dest: { lat: number; lon: number },
  mode: 'walk' | 'bike'
): Promise<RouteResult | null> {
  const costing = mode === 'bike' ? 'bicycle' : 'pedestrian';
  const body = {
    locations: [
      { lat: origin.lat, lon: origin.lon },
      { lat: dest.lat, lon: dest.lon },
    ],
    costing,
    directions_options: { units: 'kilometers' },
  };

  // Une tentative (timeout 8 s).
  const attempt = async (): Promise<RouteResult | null> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(VALHALLA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const json = await res.json();
      const legs = json?.trip?.legs;
      if (!Array.isArray(legs) || legs.length === 0) return null;

      const coords: LatLng[] = [];
      for (const leg of legs) {
        if (typeof leg.shape === 'string') coords.push(...decodePolyline6(leg.shape));
      }
      if (coords.length < 2) return null;

      const summary = json.trip.summary ?? {};
      return {
        coords,
        km: typeof summary.length === 'number' ? summary.length : 0,
        minutes: typeof summary.time === 'number' ? Math.round(summary.time / 60) : 0,
      };
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  };

  // Retry : l'instance Valhalla publique échoue parfois (limite/timeout transitoire) → on retente
  // une fois avant d'abandonner (l'« itinéraire indisponible » devient ainsi plus rare).
  for (let i = 0; i < 2; i++) {
    const r = await attempt();
    if (r) return r;
    if (i === 0) await new Promise((resolve) => setTimeout(resolve, 600));
  }
  return null;
}
