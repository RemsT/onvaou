// Injection du tag « camping » dans getStationData : on mocke les données générées pour ne pas
// dépendre du contenu de campingsGenerated.ts (régénéré séparément). Annecy = UIC 87746008.
jest.mock('../src/data/campingsGenerated', () => ({
  generatedCampings: {
    '87746008': [
      { name: 'Camping du Lac', lat: 45.9, lon: 6.13, km: 1.0, stars: 4, commune: 'Annecy' },
      { name: 'Camping nature', lat: 45.91, lon: 6.14, km: 4.0, commune: 'Annecy' }, // non classé, plus loin
    ],
  },
}));

import {
  getStationData,
  getStationLabels,
  setTrailPrefs,
  setTravelMode,
} from '../src/data/stationLabels';
import { DEFAULT_PREFERENCES } from '../src/services/profilePreferencesService';

const ID_ANNECY = 3175;

afterEach(() => {
  setTravelMode('bike');
  setTrailPrefs(DEFAULT_PREFERENCES);
});

describe('getStationData — injection du tag camping', () => {
  it('expose le label camping quand la gare a ≥ 1 camping conforme (défauts, à vélo)', () => {
    // Défaut : mode vélo, 30 min → ~6,5 km : les deux campings (1 et 4 km) passent.
    setTrailPrefs(DEFAULT_PREFERENCES);
    expect(getStationLabels(ID_ANNECY)).toContain('camping');
    const camping = getStationData(ID_ANNECY)?.tags.find(t => t.label === 'camping');
    expect(camping).toBeDefined();
    expect(camping?.pois?.length).toBe(2);
    // POIs triés étoiles ↓ : le 4★ avant le non classé.
    expect(camping?.pois?.[0].stars).toBe(4);
  });

  it('mode à vélo : le temps max d\'accès borne aussi les campings', () => {
    // À vélo, 10 min → ~2,2 km : le camping à 4 km est exclu, celui à 1 km reste.
    setTravelMode('bike');
    setTrailPrefs({ ...DEFAULT_PREFERENCES, maxAccessMinutes: 10 });
    const camping = getStationData(ID_ANNECY)?.tags.find(t => t.label === 'camping');
    expect(camping?.pois?.length).toBe(1);
    expect(camping?.pois?.[0].name).toBe('Camping du Lac');
  });

  it('★ min élevé + non classés exclus → le label camping disparaît', () => {
    setTrailPrefs({ ...DEFAULT_PREFERENCES, campingMinStars: 5, campingIncludeUnrated: false });
    expect(getStationLabels(ID_ANNECY)).not.toContain('camping');
  });

  it('★ min = 4 + non classés exclus → ne garde que le camping 4★', () => {
    setTrailPrefs({ ...DEFAULT_PREFERENCES, campingMinStars: 4, campingIncludeUnrated: false });
    const camping = getStationData(ID_ANNECY)?.tags.find(t => t.label === 'camping');
    expect(camping?.pois?.length).toBe(1);
    expect(camping?.pois?.[0].name).toBe('Camping du Lac');
  });

  it('mode à pied : les campings au-delà du temps d\'accès max sont retirés', () => {
    // maxAccessMinutes=30 → ~2 km à pied : le camping à 4 km est exclu, celui à 1 km reste.
    setTravelMode('walk');
    setTrailPrefs({ ...DEFAULT_PREFERENCES, maxAccessMinutes: 30 });
    const camping = getStationData(ID_ANNECY)?.tags.find(t => t.label === 'camping');
    expect(camping?.pois?.length).toBe(1);
    expect(camping?.pois?.[0].name).toBe('Camping du Lac');
  });
});
