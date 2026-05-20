jest.mock('../src/services/tariffService', () => ({
  tariffService: { getPrice: jest.fn().mockReturnValue(null) },
}));

import { PriceEstimationService } from '../src/services/priceEstimationService';

describe('PriceEstimationService.estimatePrice', () => {
  beforeEach(() => {
    // Vider le cache entre chaque test pour éviter les interférences
    (PriceEstimationService as any).priceCache.clear();
  });

  it('retourne min < average < max', () => {
    const result = PriceEstimationService.estimatePrice(400, 120);
    expect(result.min).toBeLessThan(result.average);
    expect(result.average).toBeLessThan(result.max);
  });

  it('prix minimum absolu de 5€', () => {
    const result = PriceEstimationService.estimatePrice(10, 15);
    expect(result.min).toBeGreaterThanOrEqual(5);
  });

  it('TGV longue distance (Paris-Marseille ~660km, 190min) → prix cohérents', () => {
    const result = PriceEstimationService.estimatePrice(660, 190);
    expect(result.min).toBeGreaterThanOrEqual(20);
    expect(result.max).toBeLessThanOrEqual(400);
    expect(result.average).toBeGreaterThan(0);
  });

  it('TER courte distance (~50km, 60min) → moins cher que TGV', () => {
    const ter = PriceEstimationService.estimatePrice(50, 60);
    const tgv = PriceEstimationService.estimatePrice(400, 100);
    expect(ter.average).toBeLessThan(tgv.average);
  });

  it('distance plus grande → prix plus élevé (à vitesse similaire)', () => {
    const court = PriceEstimationService.estimatePrice(100, 60);
    const long = PriceEstimationService.estimatePrice(500, 300);
    expect(long.average).toBeGreaterThan(court.average);
  });

  it('retourne des multiples de 5€', () => {
    const result = PriceEstimationService.estimatePrice(300, 120);
    expect(result.min % 5).toBe(0);
    expect(result.average % 5).toBe(0);
    expect(result.max % 5).toBe(0);
  });
});

describe('PriceEstimationService.estimatePriceWithTransfers', () => {
  beforeEach(() => {
    (PriceEstimationService as any).priceCache.clear();
  });

  it('avec correspondance → plus cher que sans', () => {
    const sans = PriceEstimationService.estimatePriceWithTransfers(200, 120, 0);
    const avec = PriceEstimationService.estimatePriceWithTransfers(200, 120, 1);
    expect(avec.average).toBeGreaterThanOrEqual(sans.average);
  });

  it('supplément par correspondance est positif', () => {
    (PriceEstimationService as any).priceCache.clear();
    const sans = PriceEstimationService.estimatePriceWithTransfers(300, 150, 0);
    (PriceEstimationService as any).priceCache.clear();
    const avec = PriceEstimationService.estimatePriceWithTransfers(300, 150, 1);
    // Le supplément est arrondi à 5€ près, donc ≥ 5
    expect(avec.average - sans.average).toBeGreaterThanOrEqual(5);
  });
});

describe('PriceEstimationService.formatPrice', () => {
  it('affiche une fourchette si min ≠ max', () => {
    expect(PriceEstimationService.formatPrice(50, 30, 80)).toBe('30€ - 80€');
  });

  it('affiche un prix fixe si min = max', () => {
    expect(PriceEstimationService.formatPrice(50, 50, 50)).toBe('50€');
  });
});

describe('PriceEstimationService.getPrice', () => {
  const { tariffService } = require('../src/services/tariffService');

  beforeEach(() => {
    (PriceEstimationService as any).priceCache.clear();
    tariffService.getPrice.mockReset();
  });

  it('utilise le tarif réel si disponible', () => {
    tariffService.getPrice.mockReturnValue({ min: 35, max: 120 });
    const result = PriceEstimationService.getPrice('87686006', '87723197', 465, 120);
    expect(result.isReal).toBe(true);
    expect(result.min).toBe(35);
    expect(result.max).toBe(120);
    expect(result.average).toBe(Math.round((35 + 120) / 2));
  });

  it('fallback estimation si pas de tarif réel', () => {
    tariffService.getPrice.mockReturnValue(null);
    const result = PriceEstimationService.getPrice('87686006', '00000000', 300, 120);
    expect(result.isReal).toBe(false);
    expect(result.min).toBeGreaterThan(0);
  });
});
