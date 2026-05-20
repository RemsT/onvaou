import { __mockDb } from '../__mocks__/expo-sqlite';

jest.mock('expo-sqlite');
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: '/mock/documents/',
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true }),
}));

import { GTFSDatabaseServiceEnhanced } from '../src/services/gtfsDatabaseServiceEnhanced';

// Classe exposée pour tests : on crée une instance fresh
let service: any;

beforeEach(() => {
  jest.clearAllMocks();
  // Réinitialiser l'état d'initialisation
  service = new (GTFSDatabaseServiceEnhanced as any)();
  service.db = __mockDb;
  service.initialized = true;
});

describe('GTFSDatabaseServiceEnhanced.searchStops', () => {
  it('retourne les stops correspondants', async () => {
    __mockDb.getAllAsync.mockResolvedValueOnce([
      { stop_id: 'StopArea:OCE87686006', stop_name: 'Paris Gare de Lyon', stop_lat: 48.84, stop_lon: 2.37 },
    ]);
    const result = await service.searchStops('Paris', 5);
    expect(result).toHaveLength(1);
    expect(result[0].stop_name).toBe('Paris Gare de Lyon');
  });

  it('retourne un tableau vide si aucun résultat', async () => {
    __mockDb.getAllAsync.mockResolvedValueOnce([]);
    const result = await service.searchStops('XYZinexistant', 5);
    expect(result).toHaveLength(0);
  });
});

describe('GTFSDatabaseServiceEnhanced.findAllDestinationsFrom', () => {
  it('retourne les connexions depuis une gare', async () => {
    // resolveStopIds
    __mockDb.getAllAsync.mockResolvedValueOnce([
      { stop_id: 'StopArea:OCE87686006' },
    ]);
    // query principale
    __mockDb.getAllAsync.mockResolvedValueOnce([
      {
        trip_id: 'T1',
        from_stop_id: 'StopArea:OCE87686006',
        from_stop_name: 'Paris Gare de Lyon',
        from_lat: 48.84,
        from_lon: 2.37,
        departure_time: '08:00',
        to_stop_id: 'StopArea:OCE87723197',
        to_stop_name: 'Lyon Part-Dieu',
        to_lat: 45.76,
        to_lon: 4.83,
        arrival_time: '10:00',
        route_short_name: 'TGV',
        route_long_name: 'Paris-Lyon',
        service_id: 'S1',
        trip_headsign: 'Lyon',
        nb_stops: 1,
      },
    ]);

    const result = await service.findAllDestinationsFrom('StopArea:OCE87686006', '06:00', '20:00', 100);
    expect(result).toHaveLength(1);
    expect(result[0].to_stop_name).toBe('Lyon Part-Dieu');
    expect(result[0].departure_time).toBe('08:00');
  });

  it('retourne tableau vide si aucune connexion', async () => {
    __mockDb.getAllAsync.mockResolvedValueOnce([{ stop_id: 'StopArea:OCE87686006' }]);
    __mockDb.getAllAsync.mockResolvedValueOnce([]);
    const result = await service.findAllDestinationsFrom('StopArea:OCE87686006');
    expect(result).toHaveLength(0);
  });
});

describe('GTFSDatabaseServiceEnhanced.findStopInTrips', () => {
  it('retourne le stop_id si trouvé dans stop_times', async () => {
    __mockDb.getFirstAsync.mockResolvedValueOnce({ stop_id: 'StopArea:OCE87686006' });
    const result = await service.findStopInTrips('87686006');
    expect(result).toBe('StopArea:OCE87686006');
  });

  it('retourne null si aucun stop trouvé', async () => {
    __mockDb.getFirstAsync.mockResolvedValueOnce(null);
    const result = await service.findStopInTrips('00000000');
    expect(result).toBeNull();
  });
});
