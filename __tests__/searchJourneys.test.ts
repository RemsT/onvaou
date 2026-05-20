/**
 * Tests d'intégration de la recherche avec des trajets réels SNCF
 *
 * Données basées sur les horaires réels SNCF 2024-2025.
 * La base de données est mockée mais les stop_id, durées et gares sont authentiques.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('expo-sqlite');
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: '/mock/documents/',
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true }),
}));
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../src/services/tariffService', () => ({
  tariffService: { getPrice: jest.fn().mockReturnValue(null) },
}));
jest.mock('../src/data/stationLabels', () => ({
  filterStationsByLabels: jest.fn((ids: string[]) => ids),
  countLabelMatches: jest.fn().mockReturnValue(0),
}));

// ─── Stations réelles SNCF ────────────────────────────────────────────────────
const PARIS = { id: 1, name: 'Paris Gare de Lyon', sncf_id: '87686006', lat: 48.8448, lon: 2.3735 };
const LYON  = { id: 2, name: 'Lyon Part-Dieu',     sncf_id: '87723197', lat: 45.7603, lon: 4.8598 };
const MARSEILLE = { id: 3, name: 'Marseille Saint-Charles', sncf_id: '87751008', lat: 43.3026, lon: 5.3810 };
const BORDEAUX  = { id: 4, name: 'Bordeaux Saint-Jean',     sncf_id: '87581009', lat: 44.8253, lon: -0.5566 };
const ANNECY    = { id: 5, name: 'Annecy',                  sncf_id: '87745497', lat: 45.9044, lon:  6.1272 };
const GRENOBLE  = { id: 6, name: 'Grenoble',                sncf_id: '87747006', lat: 45.1918, lon:  5.7152 };
const CHAMBERY  = { id: 7, name: 'Chambéry',                sncf_id: '87739409', lat: 45.5717, lon:  5.9204 };
const VALENCE   = { id: 8, name: 'Valence TGV',             sncf_id: '87761007', lat: 44.9286, lon:  4.9752 };

// stop_id GTFS correspondants (format réel SNCF)
const GTFS: Record<string, string> = {
  '87686006': 'StopArea:OCE87686006',
  '87723197': 'StopArea:OCE87723197',
  '87751008': 'StopArea:OCE87751008',
  '87581009': 'StopArea:OCE87581009',
  '87745497': 'StopArea:OCE87745497',
  '87747006': 'StopArea:OCE87747006',
  '87739409': 'StopArea:OCE87739409',
  '87761007': 'StopArea:OCE87761007',
};

const allStations = [PARIS, LYON, MARSEILLE, BORDEAUX, ANNECY, GRENOBLE, CHAMBERY, VALENCE];

jest.mock('../src/data/frenchStations', () => ({
  frenchStations: [
    { id: 1, name: 'Paris Gare de Lyon',       sncf_id: '87686006', lat: 48.8448, lon: 2.3735 },
    { id: 2, name: 'Lyon Part-Dieu',           sncf_id: '87723197', lat: 45.7603, lon: 4.8598 },
    { id: 3, name: 'Marseille Saint-Charles',  sncf_id: '87751008', lat: 43.3026, lon: 5.3810 },
    { id: 4, name: 'Bordeaux Saint-Jean',      sncf_id: '87581009', lat: 44.8253, lon: -0.5566 },
    { id: 5, name: 'Annecy',                   sncf_id: '87745497', lat: 45.9044, lon: 6.1272 },
    { id: 6, name: 'Grenoble',                 sncf_id: '87747006', lat: 45.1918, lon: 5.7152 },
    { id: 7, name: 'Chambéry',                 sncf_id: '87739409', lat: 45.5717, lon: 5.9204 },
    { id: 8, name: 'Valence TGV',              sncf_id: '87761007', lat: 44.9286, lon: 4.9752 },
  ],
}));

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Crée une connexion directe simulée */
function directConn(from: typeof PARIS, to: typeof PARIS, dep: string, arr: string, route = 'TGV') {
  return {
    trip_id: `T_${from.sncf_id}_${to.sncf_id}_${dep}`,
    from_stop_id: GTFS[from.sncf_id],
    from_stop_name: from.name,
    from_lat: from.lat, from_lon: from.lon,
    departure_time: dep,
    to_stop_id: GTFS[to.sncf_id],
    to_stop_name: to.name,
    to_lat: to.lat, to_lon: to.lon,
    arrival_time: arr,
    route_short_name: route,
    route_long_name: route,
    service_id: 'SERVICE_LUN_VEN',
    trip_headsign: to.name,
    nb_stops: 1,
  };
}

/** Crée une correspondance simulée au format JourneyWithTransfer (ce que retourne findAllDestinationsWithOneTransfer) */
function transferConn(via: typeof PARIS, to: typeof PARIS, dep: string, transArr: string, transDep: string, arr: string) {
  const toMin = (t: string) => parseInt(t.split(':')[0]) * 60 + parseInt(t.split(':')[1]);
  const totalMin = toMin(arr) - toMin(dep);
  const waitMin  = toMin(transDep) - toMin(transArr);
  return {
    legs: [],
    totalDuration: totalMin,
    transferTime: waitMin,
    transferStation: via.name,
    transferLat: via.lat,
    transferLon: via.lon,
    departureTime: dep,
    transferArrival: transArr,
    transferDeparture: transDep,
    arrivalTime: arr,
  };
}

// ─── Setup des mocks gtfs ──────────────────────────────────────────────────────
import { gtfsDbEnhanced } from '../src/services/gtfsDatabaseServiceEnhanced';
import { LocalSearchService } from '../src/services/localSearchService';

const mockGtfs = gtfsDbEnhanced as jest.Mocked<typeof gtfsDbEnhanced>;

beforeEach(() => {
  jest.clearAllMocks();
  LocalSearchService.clearCache();

  // initialize() ne fait rien dans les tests
  (mockGtfs.initialize as jest.Mock) = jest.fn().mockResolvedValue(undefined);

  // searchStops : retourne le stop GTFS correspondant au numéro SNCF
  (mockGtfs.searchStops as jest.Mock) = jest.fn().mockImplementation((query: string) => {
    const station = allStations.find(s => query.includes(s.sncf_id) || query.includes(`OCE${s.sncf_id}`));
    if (!station) return Promise.resolve([]);
    return Promise.resolve([{
      stop_id: GTFS[station.sncf_id],
      stop_name: station.name,
      stop_lat: station.lat,
      stop_lon: station.lon,
    }]);
  });

  (mockGtfs.findStopInTrips as jest.Mock) = jest.fn().mockResolvedValue(null);
});

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('🚄 Trajets directs grandes villes', () => {

  test('Paris → Lyon en TGV (2h00, direct)', async () => {
    // Horaire réel : TGV 6601, 08:02 → 10:02
    (mockGtfs.findAllDestinationsFrom as jest.Mock) = jest.fn().mockResolvedValue([
      directConn(PARIS, LYON, '08:02', '10:02', 'TGV'),
    ]);
    (mockGtfs.findAllDestinationsWithOneTransfer as jest.Mock) = jest.fn().mockResolvedValue(new Map());

    const results = await LocalSearchService.searchDestinations(PARIS, 'time', 180);

    expect(results).toHaveLength(1);
    const lyon = results[0];
    expect(lyon.to_station.name).toBe('Lyon Part-Dieu');
    expect(lyon.duration).toBe(120); // 10:02 - 08:02 = 120 min
    expect(lyon.transfers).toBe(0);  // trajet direct
    expect(lyon.priceRange!.min).toBeGreaterThanOrEqual(20);
    expect(lyon.priceRange!.max).toBeGreaterThan(lyon.priceRange!.min);
  });

  test('Paris → Marseille en TGV (3h15, direct)', async () => {
    // Horaire réel : TGV 6171, 08:05 → 11:20
    (mockGtfs.findAllDestinationsFrom as jest.Mock) = jest.fn().mockResolvedValue([
      directConn(PARIS, MARSEILLE, '08:05', '11:20', 'TGV'),
    ]);
    (mockGtfs.findAllDestinationsWithOneTransfer as jest.Mock) = jest.fn().mockResolvedValue(new Map());

    const results = await LocalSearchService.searchDestinations(PARIS, 'time', 240);

    expect(results).toHaveLength(1);
    expect(results[0].to_station.name).toBe('Marseille Saint-Charles');
    expect(results[0].duration).toBe(195); // 11:20 - 08:05 = 195 min = 3h15
    expect(results[0].transfers).toBe(0);
  });

  test('Paris → Bordeaux en TGV (2h15, direct)', async () => {
    // Horaire réel : TGV 8531, 08:05 → 10:24
    (mockGtfs.findAllDestinationsFrom as jest.Mock) = jest.fn().mockResolvedValue([
      directConn(PARIS, BORDEAUX, '08:05', '10:24', 'TGV'),
    ]);
    (mockGtfs.findAllDestinationsWithOneTransfer as jest.Mock) = jest.fn().mockResolvedValue(new Map());

    const results = await LocalSearchService.searchDestinations(PARIS, 'time', 200);

    const bordeaux = results.find(r => r.to_station.name === 'Bordeaux Saint-Jean');
    expect(bordeaux).toBeDefined();
    expect(bordeaux!.duration).toBe(139); // 10:24 - 08:05 = 139 min
  });

});

describe('🏘️ Trajets petites/moyennes villes', () => {

  test('Lyon → Grenoble en TER (1h15, direct)', async () => {
    // Horaire réel : TER, 08:05 → 09:20
    (mockGtfs.findAllDestinationsFrom as jest.Mock) = jest.fn().mockResolvedValue([
      directConn(LYON, GRENOBLE, '08:05', '09:20', 'TER'),
    ]);
    (mockGtfs.findAllDestinationsWithOneTransfer as jest.Mock) = jest.fn().mockResolvedValue(new Map());

    const results = await LocalSearchService.searchDestinations(LYON, 'time', 120);

    expect(results).toHaveLength(1);
    expect(results[0].to_station.name).toBe('Grenoble');
    expect(results[0].duration).toBe(75); // 75 min
    expect(results[0].transfers).toBe(0);
    // TER courte distance → prix raisonnable
    expect(results[0].priceRange!.max).toBeLessThan(50);
  });

  test('Lyon → Valence TGV en TGV (30 min, direct)', async () => {
    // Horaire réel : TGV, 09:00 → 09:31
    (mockGtfs.findAllDestinationsFrom as jest.Mock) = jest.fn().mockResolvedValue([
      directConn(LYON, VALENCE, '09:00', '09:31', 'TGV'),
    ]);
    (mockGtfs.findAllDestinationsWithOneTransfer as jest.Mock) = jest.fn().mockResolvedValue(new Map());

    const results = await LocalSearchService.searchDestinations(LYON, 'time', 60);

    expect(results).toHaveLength(1);
    expect(results[0].to_station.name).toBe('Valence TGV');
    expect(results[0].duration).toBe(31);
  });

});

describe('🔄 Trajets avec correspondance', () => {

  test('Paris → Annecy via Lyon (3h30, 1 correspondance)', async () => {
    // Réel : TGV Paris-Lyon 08:02→10:02, attente 20min, TER Lyon-Annecy 10:22→11:37
    (mockGtfs.findAllDestinationsFrom as jest.Mock) = jest.fn().mockResolvedValue([]);
    (mockGtfs.findAllDestinationsWithOneTransfer as jest.Mock) = jest.fn().mockResolvedValue(
      new Map([
        [GTFS['87745497'], transferConn(LYON, ANNECY, '08:02', '10:02', '10:22', '11:37')],
      ])
    );

    const results = await LocalSearchService.searchDestinations(PARIS, 'time', 240, undefined, undefined, '06:00', '12:00');

    expect(results).toHaveLength(1);
    const annecy = results[0];
    expect(annecy.to_station.name).toBe('Annecy');
    expect(annecy.duration).toBe(215); // 11:37 - 08:02 = 215 min
    expect(annecy.transfers).toBe(1);
    expect(annecy.transferStation).toBe('Lyon Part-Dieu');
    expect(annecy.transferArrival).toBe('10:02');
    expect(annecy.transferDeparture).toBe('10:22');
    // Prix = somme des 2 tronçons → plus cher que direct Lyon-Annecy seul
    expect(annecy.priceRange!.min).toBeGreaterThan(0);
    expect(annecy.priceRange!.max).toBeGreaterThan(annecy.priceRange!.min);
  });

  test('Paris → Chambéry via Lyon (3h10, 1 correspondance)', async () => {
    // Réel : TGV Paris-Lyon 08:02→10:02, TER Lyon-Chambéry 10:15→11:12
    (mockGtfs.findAllDestinationsFrom as jest.Mock) = jest.fn().mockResolvedValue([]);
    (mockGtfs.findAllDestinationsWithOneTransfer as jest.Mock) = jest.fn().mockResolvedValue(
      new Map([
        [GTFS['87739409'], transferConn(LYON, CHAMBERY, '08:02', '10:02', '10:15', '11:12')],
      ])
    );

    const results = await LocalSearchService.searchDestinations(PARIS, 'time', 240);

    expect(results).toHaveLength(1);
    expect(results[0].to_station.name).toBe('Chambéry');
    expect(results[0].duration).toBe(190); // 11:12 - 08:02 = 190 min
    expect(results[0].transfers).toBe(1);
    expect(results[0].transferStation).toBe('Lyon Part-Dieu');
  });

  test('trajet avec correspondance → prix = somme des 2 tronçons', async () => {
    // Paris→Lyon 120min + Lyon→Annecy 75min = prix des 2 séparément sommés
    (mockGtfs.findAllDestinationsFrom as jest.Mock) = jest.fn().mockResolvedValue([]);
    (mockGtfs.findAllDestinationsWithOneTransfer as jest.Mock) = jest.fn().mockResolvedValue(
      new Map([
        [GTFS['87745497'], transferConn(LYON, ANNECY, '08:00', '10:00', '10:20', '11:35')],
      ])
    );

    const results = await LocalSearchService.searchDestinations(PARIS, 'time', 300);
    const annecy = results.find(r => r.to_station.name === 'Annecy');
    expect(annecy).toBeDefined();
    // Le prix doit être supérieur à un TER seul Lyon-Annecy (~15-30€)
    expect(annecy!.priceRange!.min).toBeGreaterThan(15);
  });

});

describe('🔀 Direct vs correspondance : priorité au plus rapide', () => {

  test('garde le direct si plus rapide que la correspondance', async () => {
    // Direct Paris→Lyon 120min, correspondance aussi dispo mais 180min
    (mockGtfs.findAllDestinationsFrom as jest.Mock) = jest.fn().mockResolvedValue([
      directConn(PARIS, LYON, '08:00', '10:00', 'TGV'), // 120 min
    ]);
    (mockGtfs.findAllDestinationsWithOneTransfer as jest.Mock) = jest.fn().mockResolvedValue(
      new Map([
        // Lyon via Valence : plus lent
        [GTFS['87723197'], transferConn(VALENCE, LYON, '08:00', '09:00', '09:20', '11:00')],
      ])
    );

    const results = await LocalSearchService.searchDestinations(PARIS, 'time', 300);
    const lyon = results.find(r => r.to_station.name === 'Lyon Part-Dieu');
    expect(lyon).toBeDefined();
    expect(lyon!.duration).toBe(120); // le direct doit être retenu
    expect(lyon!.transfers).toBe(0);
  });

});

describe('⏱️ Filtre par durée maximale', () => {

  test('exclut les destinations trop loin selon le maxTime', async () => {
    (mockGtfs.findAllDestinationsFrom as jest.Mock) = jest.fn().mockResolvedValue([
      directConn(PARIS, LYON,      '08:00', '10:00', 'TGV'), // 120 min ✓
      directConn(PARIS, MARSEILLE, '08:00', '11:30', 'TGV'), // 210 min ✗
    ]);
    (mockGtfs.findAllDestinationsWithOneTransfer as jest.Mock) = jest.fn().mockResolvedValue(new Map());

    const results = await LocalSearchService.searchDestinations(PARIS, 'time', 180); // max 3h

    expect(results).toHaveLength(1);
    expect(results[0].to_station.name).toBe('Lyon Part-Dieu');
  });

  test('inclut toutes les destinations si le maxTime est grand', async () => {
    (mockGtfs.findAllDestinationsFrom as jest.Mock) = jest.fn().mockResolvedValue([
      directConn(PARIS, LYON,      '08:00', '10:00', 'TGV'), // 120 min
      directConn(PARIS, MARSEILLE, '08:00', '11:15', 'TGV'), // 195 min
      directConn(PARIS, BORDEAUX,  '08:00', '10:15', 'TGV'), // 135 min
    ]);
    (mockGtfs.findAllDestinationsWithOneTransfer as jest.Mock) = jest.fn().mockResolvedValue(new Map());

    const results = await LocalSearchService.searchDestinations(PARIS, 'time', 360); // max 6h

    expect(results).toHaveLength(3);
  });

});

describe('💶 Filtre par budget', () => {

  test('exclut les destinations trop chères selon maxBudget', async () => {
    // TGV Paris-Marseille est plus cher que Paris-Lyon
    (mockGtfs.findAllDestinationsFrom as jest.Mock) = jest.fn().mockResolvedValue([
      directConn(PARIS, LYON,      '08:00', '10:00', 'TER'), // courte durée → moins cher
      directConn(PARIS, MARSEILLE, '08:00', '13:00', 'TGV'), // longue durée → plus cher
    ]);
    (mockGtfs.findAllDestinationsWithOneTransfer as jest.Mock) = jest.fn().mockResolvedValue(new Map());

    const results = await LocalSearchService.searchDestinations(PARIS, 'budget', undefined, 40);

    // Vérifie que toutes les destinations retournées ont un priceRange.max ≤ 40
    results.forEach(r => {
      expect(r.priceRange!.max).toBeLessThanOrEqual(40);
    });
  });

});

describe('📋 Tri des résultats', () => {

  test('résultats triés par durée croissante par défaut', async () => {
    (mockGtfs.findAllDestinationsFrom as jest.Mock) = jest.fn().mockResolvedValue([
      directConn(PARIS, MARSEILLE, '08:00', '11:15', 'TGV'), // 195 min
      directConn(PARIS, BORDEAUX,  '08:00', '10:15', 'TGV'), // 135 min
      directConn(PARIS, LYON,      '08:00', '10:00', 'TGV'), // 120 min
    ]);
    (mockGtfs.findAllDestinationsWithOneTransfer as jest.Mock) = jest.fn().mockResolvedValue(new Map());

    const results = await LocalSearchService.searchDestinations(PARIS, 'time', 360);

    expect(results[0].to_station.name).toBe('Lyon Part-Dieu');    // 120 min
    expect(results[1].to_station.name).toBe('Bordeaux Saint-Jean'); // 135 min
    expect(results[2].to_station.name).toBe('Marseille Saint-Charles'); // 195 min
  });

});
