import { buildGpx } from '../src/utils/gpx';

describe('buildGpx — export GPX d\'un tracé', () => {
  const pts = [
    { lat: 45.9, lon: 6.13 },
    { lat: 45.91, lon: 6.14, ele: 520 },
  ];

  it('produit un GPX 1.1 valide avec en-tête et track', () => {
    const gpx = buildGpx('Boucle du Lac', pts);
    expect(gpx).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(gpx).toContain('<gpx version="1.1"');
    expect(gpx).toContain('<trk><name>Boucle du Lac</name><trkseg>');
    expect(gpx.match(/<trkpt /g)?.length).toBe(2);
  });

  it('inclut l\'altitude quand elle est fournie, pas sinon', () => {
    const gpx = buildGpx('x', pts);
    expect(gpx).toContain('<ele>520</ele>');
    // le 1er point n'a pas d'altitude → un seul <ele>
    expect(gpx.match(/<ele>/g)?.length).toBe(1);
  });

  it('formate les coordonnées à 6 décimales', () => {
    const gpx = buildGpx('x', [{ lat: 45.9, lon: 6.13 }]);
    expect(gpx).toContain('lat="45.900000" lon="6.130000"');
  });

  it('échappe les caractères XML du nom', () => {
    const gpx = buildGpx('Tour <Mont> & "Cie"', pts);
    expect(gpx).toContain('Tour &lt;Mont&gt; &amp; &quot;Cie&quot;');
    expect(gpx).not.toContain('Tour <Mont>');
  });

  it('inclut l\'attribution OpenStreetMap (ODbL)', () => {
    const gpx = buildGpx('x', pts);
    expect(gpx).toContain('OpenStreetMap contributors');
    expect(gpx).toContain('odbl');
  });

  it('nom vide → « Itinéraire » par défaut', () => {
    expect(buildGpx('', pts)).toContain('<name>Itinéraire</name>');
  });
});
