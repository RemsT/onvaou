import { LocationService } from '../src/services/locationService';

describe('LocationService.calculateDistance', () => {
  it('retourne 0 pour deux points identiques', () => {
    expect(LocationService.calculateDistance(48.8566, 2.3522, 48.8566, 2.3522)).toBe(0);
  });

  it('calcule Paris → Lyon (~465 km)', () => {
    const dist = LocationService.calculateDistance(48.8534, 2.3488, 45.7640, 4.8357);
    expect(dist).toBeGreaterThan(390);
    expect(dist).toBeLessThan(420);
  });

  it('calcule Paris → Marseille (~660 km)', () => {
    const dist = LocationService.calculateDistance(48.8534, 2.3488, 43.2965, 5.3811);
    expect(dist).toBeGreaterThan(630);
    expect(dist).toBeLessThan(720);
  });

  it('calcule Paris → Bordeaux (~500 km)', () => {
    const dist = LocationService.calculateDistance(48.8534, 2.3488, 44.8378, -0.5792);
    expect(dist).toBeGreaterThan(470);
    expect(dist).toBeLessThan(540);
  });

  it('est symétrique (A→B = B→A)', () => {
    const ab = LocationService.calculateDistance(48.8566, 2.3522, 45.764, 4.8357);
    const ba = LocationService.calculateDistance(45.764, 4.8357, 48.8566, 2.3522);
    expect(Math.abs(ab - ba)).toBeLessThan(0.001);
  });
});
