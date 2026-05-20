// Mocks des modules natifs avant tout import
jest.mock('expo-sqlite');
jest.mock('expo-file-system/legacy');
jest.mock('../src/services/tariffService', () => ({
  tariffService: { getPrice: jest.fn().mockReturnValue(null) },
}));
jest.mock('../src/data/frenchStations', () => ({ frenchStations: [] }));
jest.mock('../src/data/stationLabels', () => ({
  filterStationsByLabels: jest.fn((ids: string[]) => ids),
  countLabelMatches: jest.fn().mockReturnValue(0),
}));
jest.mock('../src/services/gtfsDatabaseServiceEnhanced', () => ({
  gtfsDbEnhanced: {
    initialize: jest.fn().mockResolvedValue(undefined),
    searchStops: jest.fn().mockResolvedValue([]),
    findAllDestinationsFrom: jest.fn().mockResolvedValue([]),
    findAllDestinationsWithOneTransfer: jest.fn().mockResolvedValue(new Map()),
    findStopInTrips: jest.fn().mockResolvedValue(null),
  },
}));

import { LocalSearchService } from '../src/services/localSearchService';

// Accès aux méthodes privées pour les tests
const svc = LocalSearchService as any;

describe('LocalSearchService.timeToMinutes', () => {
  it('00:00 → 0', () => expect(svc.timeToMinutes('00:00')).toBe(0));
  it('01:00 → 60', () => expect(svc.timeToMinutes('01:00')).toBe(60));
  it('08:30 → 510', () => expect(svc.timeToMinutes('08:30')).toBe(510));
  it('23:59 → 1439', () => expect(svc.timeToMinutes('23:59')).toBe(1439));
});

describe('LocalSearchService.calculateDuration', () => {
  it('trajet simple 08:00 → 10:30 = 150 min', () => {
    expect(svc.calculateDuration('08:00', '10:30')).toBe(150);
  });

  it('trajet nocturne 22:00 → 02:00 = 240 min (lendemain)', () => {
    expect(svc.calculateDuration('22:00', '02:00')).toBe(240);
  });

  it('même heure = 0 min', () => {
    expect(svc.calculateDuration('10:00', '10:00')).toBe(0);
  });

  it('1 minute = 1 min', () => {
    expect(svc.calculateDuration('10:00', '10:01')).toBe(1);
  });
});

describe('LocalSearchService.extractCityName', () => {
  it('Paris Gare du Nord → paris', () => {
    expect(svc.extractCityName('Paris Gare du Nord')).toBe('paris');
  });

  it('Lyon Part-Dieu → lyon', () => {
    expect(svc.extractCityName('Lyon Part-Dieu')).toBe('lyon');
  });

  it('Saint-Étienne → saint-étienne', () => {
    const result = svc.extractCityName('Saint-Étienne');
    expect(result).toMatch(/saint/i);
  });

  it('Marseille Saint-Charles → marseille', () => {
    expect(svc.extractCityName('Marseille Saint-Charles')).toBe('marseille');
  });

  it('Bordeaux Saint-Jean → bordeaux', () => {
    expect(svc.extractCityName('Bordeaux Saint-Jean')).toBe('bordeaux');
  });
});

describe('LocalSearchService.areSameCity', () => {
  const makeStation = (name: string) => ({
    id: 1, name, sncf_id: '00000000', lat: 0, lon: 0,
  });

  it('Paris Nord et Paris Montparnasse → même ville', () => {
    expect(svc.areSameCity(
      makeStation('Paris Gare du Nord'),
      makeStation('Paris Montparnasse')
    )).toBe(true);
  });

  it('Lyon et Marseille → villes différentes', () => {
    expect(svc.areSameCity(
      makeStation('Lyon Part-Dieu'),
      makeStation('Marseille Saint-Charles')
    )).toBe(false);
  });

  it('même gare → même ville', () => {
    const s = makeStation('Bordeaux Saint-Jean');
    expect(svc.areSameCity(s, s)).toBe(true);
  });
});
