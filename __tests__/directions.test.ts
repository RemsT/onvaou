import {
  iconForMode,
  labelForMode,
  modeForDistanceKm,
  formatApprox,
  routeToCoords,
} from '../src/utils/directions';
import { TaggedPoi } from '../src/types';

describe('directions — distance approximative (sans routing)', () => {
  describe('iconForMode', () => {
    it('🚶 pour la marche, 🚲 pour le vélo, défaut marche', () => {
      expect(iconForMode('walk')).toBe('🚶');
      expect(iconForMode('bike')).toBe('🚲');
      expect(iconForMode(undefined)).toBe('🚶');
    });
  });

  describe('labelForMode', () => {
    it('libellés FR', () => {
      expect(labelForMode('walk')).toBe('à pied');
      expect(labelForMode('bike')).toBe('à vélo');
    });
  });

  describe('modeForDistanceKm', () => {
    it('≤ 2 km → marche, sinon vélo', () => {
      expect(modeForDistanceKm(0.5)).toBe('walk');
      expect(modeForDistanceKm(2)).toBe('walk');
      expect(modeForDistanceKm(2.1)).toBe('bike');
      expect(modeForDistanceKm(4.8)).toBe('bike');
    });
    it('distance inconnue → vélo (par défaut prudent)', () => {
      expect(modeForDistanceKm(undefined)).toBe('bike');
    });
  });

  describe('formatApprox', () => {
    it('marche (≤2 km) : "🚶 à ~1,4 km"', () => {
      const poi: TaggedPoi = { name: 'Plage', km: 1.4 };
      expect(formatApprox(poi)).toBe('🚶 à ~1,4 km');
    });
    it('vélo (>2 km) : "🚲 à ~3,2 km"', () => {
      const poi: TaggedPoi = { name: 'Lac', km: 3.2 };
      expect(formatApprox(poi)).toBe('🚲 à ~3,2 km');
    });
    it('chaîne vide si distance inconnue', () => {
      expect(formatApprox({ name: 'X' })).toBe('');
    });
  });

  describe('routeToCoords', () => {
    it('convertit [lat,lon][] en {latitude,longitude}[]', () => {
      expect(routeToCoords([[45.1, 5.7], [45.2, 5.8]])).toEqual([
        { latitude: 45.1, longitude: 5.7 },
        { latitude: 45.2, longitude: 5.8 },
      ]);
    });
    it('tableau vide si route absente', () => {
      expect(routeToCoords(undefined)).toEqual([]);
    });
  });
});
