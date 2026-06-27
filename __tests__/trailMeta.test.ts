import { networkLabel, difficultyLabel } from '../src/utils/trailMeta';

describe('networkLabel — portée du réseau OSM', () => {
  it('rando : iwn/nwn/rwn/lwn', () => {
    expect(networkLabel('iwn')).toBe('International');
    expect(networkLabel('nwn')).toBe('National');
    expect(networkLabel('rwn')).toBe('Régional');
    expect(networkLabel('lwn')).toBe('Local');
  });

  it('vélo : icn/ncn/rcn/lcn', () => {
    expect(networkLabel('icn')).toBe('International');
    expect(networkLabel('ncn')).toBe('National');
    expect(networkLabel('rcn')).toBe('Régional');
    expect(networkLabel('lcn')).toBe('Local');
  });

  it('insensible à la casse', () => {
    expect(networkLabel('IWN')).toBe('International');
  });

  it('absent / inconnu → ""', () => {
    expect(networkLabel()).toBe('');
    expect(networkLabel('')).toBe('');
    expect(networkLabel('xyz')).toBe('');
  });
});

describe('difficultyLabel — échelle SAC', () => {
  it('mappe T1..T6 vers un libellé', () => {
    expect(difficultyLabel('T1')).toBe('T1 · Facile');
    expect(difficultyLabel('T3')).toBe('T3 · Exigeant');
    expect(difficultyLabel('T6')).toBe('T6 · Alpin');
  });

  it('insensible à la casse', () => {
    expect(difficultyLabel('t2')).toBe('T2 · Modéré');
  });

  it('absent → ""', () => {
    expect(difficultyLabel()).toBe('');
    expect(difficultyLabel('')).toBe('');
  });

  it('valeur inconnue → renvoyée telle quelle', () => {
    expect(difficultyLabel('T9')).toBe('T9');
  });
});
