import { estimateMinutes } from '../src/utils/effort';

describe('estimateMinutes — durée corrigée par le dénivelé (Naismith/Tobler)', () => {
  it('marche à plat : 4 km / 4 km/h = 60 min', () => {
    expect(estimateMinutes('walk', 4)).toBe(60);
  });

  it('vélo à plat : 15 km / 15 km/h = 60 min', () => {
    expect(estimateMinutes('bike', 15)).toBe(60);
  });

  it('marche : +600 m de D+ ajoute ~60 min (règle de Naismith)', () => {
    // 4 km plat (60 min) + 600 m × 0,1 min/m (60 min) = 120 min
    expect(estimateMinutes('walk', 4, 600)).toBe(120);
  });

  it('marche : +100 m de D+ ajoute ~10 min', () => {
    expect(estimateMinutes('walk', 0, 100)).toBe(10);
  });

  it('vélo : +500 m de D+ ajoute ~60 min (VAM 500 m/h)', () => {
    expect(estimateMinutes('bike', 0, 500)).toBe(60);
  });

  it('le dénivelé allonge toujours la durée (vs plat)', () => {
    expect(estimateMinutes('walk', 10, 800)).toBeGreaterThan(estimateMinutes('walk', 10));
    expect(estimateMinutes('bike', 30, 600)).toBeGreaterThan(estimateMinutes('bike', 30));
  });

  it('ascent absent ou 0 → durée à plat seule (rétro-compatible)', () => {
    expect(estimateMinutes('walk', 8, 0)).toBe(estimateMinutes('walk', 8));
    expect(estimateMinutes('walk', 8, undefined)).toBe(estimateMinutes('walk', 8));
  });

  it('D+ négatif ignoré (pas de réduction de durée)', () => {
    expect(estimateMinutes('walk', 4, -200)).toBe(60);
  });
});
