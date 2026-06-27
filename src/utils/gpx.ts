/**
 * Export GPX d'un tracé (feuille de route rando/vélo v2 — « ouvrir dans Garmin/Komoot »).
 *
 * Pur (aucune dépendance native) : construit une chaîne GPX 1.1 à partir d'une liste de points.
 * Le décodage de `Trail.geom` (polyligne précision 6) se fait en amont via decodePolyline6
 * (src/services/routingService.ts) ; on passe ici les points déjà décodés pour rester testable.
 */

export interface GpxPoint {
  lat: number;
  lon: number;
  ele?: number; // altitude (m), si disponible (profil SRTM)
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] as string)
  );
}

const fix6 = (n: number) => n.toFixed(6);

/**
 * Construit un document GPX (track unique) pour `name` et `points`.
 * Attribution OSM incluse (données ODbL). Retourne la chaîne XML complète.
 */
export function buildGpx(name: string, points: GpxPoint[]): string {
  const trkpts = points
    .map((p) => {
      const ele = p.ele != null ? `<ele>${Math.round(p.ele)}</ele>` : '';
      return `<trkpt lat="${fix6(p.lat)}" lon="${fix6(p.lon)}">${ele}</trkpt>`;
    })
    .join('');
  const safe = escapeXml(name || 'Itinéraire');
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<gpx version="1.1" creator="ONvaOU" xmlns="http://www.topografix.com/GPX/1/1">' +
    `<metadata><name>${safe}</name>` +
    '<copyright author="OpenStreetMap contributors"><license>https://opendatacommons.org/licenses/odbl/</license></copyright>' +
    '</metadata>' +
    `<trk><name>${safe}</name><trkseg>${trkpts}</trkseg></trk>` +
    '</gpx>'
  );
}
