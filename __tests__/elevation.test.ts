const { ascentDescent, downsampleProfile, estimateMinutes, effortLevel } = require('../scripts/lib/elevation');

describe('ascentDescent — D+/D- avec filtre anti-bruit', () => {
  it('montée puis descente nettes', () => {
    expect(ascentDescent([0, 100, 0], 10)).toEqual({ ascent: 100, descent: 100 });
  });

  it('monotone croissant cumule le D+', () => {
    expect(ascentDescent([0, 10, 20, 30], 7).ascent).toBe(30);
  });

  it('ignore le bruit sous le seuil (n\'inflate pas le D+)', () => {
    expect(ascentDescent([0, 3, 0, 3, 0, 4], 7)).toEqual({ ascent: 0, descent: 0 });
  });

  it('seuil : un palier juste au seuil compte', () => {
    expect(ascentDescent([0, 7], 7).ascent).toBe(7);
  });

  it('< 2 points → 0', () => {
    expect(ascentDescent([42], 10)).toEqual({ ascent: 0, descent: 0 });
  });
});

describe('downsampleProfile', () => {
  it('≤ n points : renvoyé tel quel (arrondi)', () => {
    expect(downsampleProfile([1, 2, 3], 24)).toEqual([1, 2, 3]);
  });

  it('> n points : réduit à n, garde extrémités', () => {
    const big = Array.from({ length: 100 }, (_, i) => i);
    const p = downsampleProfile(big, 24);
    expect(p.length).toBe(24);
    expect(p[0]).toBe(0);
    expect(p[p.length - 1]).toBe(99);
  });
});

describe('estimateMinutes — Naismith (miroir de src/utils/effort)', () => {
  it('marche à plat', () => { expect(estimateMinutes('walk', 4, 0)).toBe(60); });
  it('marche + 600 m D+ → +60 min', () => { expect(estimateMinutes('walk', 4, 600)).toBe(120); });
  it('vélo + 500 m D+ → +60 min', () => { expect(estimateMinutes('bike', 0, 500)).toBe(60); });
});

describe('effortLevel — niveau dérivé de km + D+', () => {
  it('marche : facile / modéré / difficile', () => {
    expect(effortLevel('walk', 4, 0)).toBe('Facile');
    expect(effortLevel('walk', 10, 0)).toBe('Modéré');
    expect(effortLevel('walk', 10, 2000)).toBe('Difficile');
  });
  it('vélo : seuils plus élevés (distances plus longues)', () => {
    expect(effortLevel('bike', 20, 0)).toBe('Facile');
    expect(effortLevel('bike', 30, 0)).toBe('Modéré');
  });
});
