/**
 * Partage du tracé d'une sortie au format GPX (« ouvrir dans Garmin/Komoot »).
 *
 * Cross-plateforme iOS + Android via la feuille de partage native (expo-sharing) ; écrit un fichier
 * temporaire dans le cache (expo-file-system, nouvelle API File/Paths SDK 54). Importe les modules
 * natifs ICI seulement — `buildGpx` (src/utils/gpx.ts) reste pur/testable.
 */
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { decodePolyline6 } from '../services/routingService';
import { buildGpx, GpxPoint } from './gpx';
import { Trail } from '../types';

/** Décode la geom du tracé, construit le GPX (avec altitudes si profil dispo) et ouvre le partage. */
export async function shareTrailGpx(trail: Trail): Promise<void> {
  const coords = decodePolyline6(trail.geom);
  if (!coords.length) return;

  // Si un profil altimétrique existe (Phase 2), on le ré-échantillonne le long des points du tracé.
  const profile = trail.profile;
  const lastIdx = Math.max(1, coords.length - 1);
  const points: GpxPoint[] = coords.map((c, i) => {
    let ele: number | undefined;
    if (profile && profile.length) {
      const j = Math.round((i / lastIdx) * (profile.length - 1));
      ele = profile[Math.min(profile.length - 1, j)];
    }
    return { lat: c.latitude, lon: c.longitude, ele };
  });

  const gpx = buildGpx(trail.name, points);
  const safe = (trail.name || 'itineraire').replace(/[^a-z0-9]+/gi, '_').slice(0, 40) || 'itineraire';
  // Nom horodaté → jamais de collision avec un fichier déjà présent dans le cache.
  const file = new File(Paths.cache, `${safe}-${Date.now()}.gpx`);
  file.create();
  file.write(gpx);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/gpx+xml',
      dialogTitle: 'Exporter le tracé (GPX)',
      UTI: 'com.topografix.gpx',
    });
  }
}
