/**
 * Constantes SNCF pour l'estimation des prix
 */

export const TRAIN_TYPES = {
  TGV_INOUI: 'TGV_INOUI',
  TGV_OUIGO: 'TGV_OUIGO',
  INTERCITES: 'INTERCITES',
  TER: 'TER',
  TRANSILIEN: 'TRANSILIEN'
};

export const TRAIN_TYPE_LABELS = {
  TGV_INOUI: 'TGV INOUI',
  TGV_OUIGO: 'OUIGO',
  INTERCITES: 'INTERCITÉS',
  TER: 'TER',
  TRANSILIEN: 'TRANSILIEN'
};

export const BASE_PRICE_PER_KM = {
  TGV_INOUI: 0.195,
  TGV_OUIGO: 0.08,
  INTERCITES: 0.14,
  TER: 0.12,
  TRANSILIEN: 0.10
};

export const MIN_PRICES = {
  TGV_INOUI: 15,
  TGV_OUIGO: 10,
  INTERCITES: 5,
  TER: 2,
  TRANSILIEN: 1.90
};

export const MAX_PRICES = {
  TGV_INOUI: 200,
  TGV_OUIGO: 59,
  INTERCITES: 85,
  TER: 50,
  TRANSILIEN: 20
};

export const BOOKING_TIME_MULTIPLIERS = {
  same_day: 1.45,
  next_day: 1.35,
  within_3_days: 1.25,
  within_week: 1.15,
  within_2_weeks: 1.05,
  within_month: 0.95,
  within_3_months: 0.85,
  more_than_3_months: 0.75
};

export const DEPARTURE_TIME_MULTIPLIERS = {
  early_morning: 0.90,
  morning_peak: 1.25,
  mid_morning: 1.10,
  lunch_time: 0.95,
  afternoon: 1.15,
  evening_peak: 1.30,
  late_evening: 1.00,
  night: 0.85
};

export const DAY_OF_WEEK_MULTIPLIERS = {
  0: 1.25, // Dimanche
  1: 1.20, // Lundi
  2: 1.10, // Mardi
  3: 1.05, // Mercredi
  4: 1.15, // Jeudi
  5: 1.35, // Vendredi
  6: 1.10  // Samedi
};

export const VACATION_MULTIPLIERS = {
  peak_vacation: 1.50,
  vacation_departure: 1.65,
  vacation_return: 1.60,
  school_vacation: 1.30,
  long_weekend: 1.40,
  normal_period: 1.00
};

export const CAPACITY_MULTIPLIERS = {
  almost_full: 1.40,
  high_demand: 1.25,
  moderate: 1.10,
  available: 1.00,
  low_demand: 0.85
};

export const DISCOUNT_CARDS = {
  NONE: {
    name: 'Aucune carte',
    discount_percent: { peak: 0, off_peak: 0 }
  },
  JEUNE: {
    name: 'Carte Jeune (-12-27 ans)',
    age_range: [12, 27],
    discount_percent: { peak: 30, off_peak: 60 },
    annual_cost: 50
  },
  SENIOR: {
    name: 'Carte Senior+ (60+ ans)',
    age_range: [60, 120],
    discount_percent: { peak: 30, off_peak: 60 },
    annual_cost: 49
  },
  AVANTAGE: {
    name: 'Carte Avantage (28-59 ans)',
    age_range: [28, 59],
    discount_percent: { peak: 30, off_peak: 40 },
    annual_cost: 49
  },
  WEEKEND: {
    name: 'Carte Week-end',
    age_range: [0, 120],
    discount_percent: { weekend: 30 },
    annual_cost: 49
  }
};

// Périodes de vacances 2025-2026
export const VACATION_PERIODS = [
  { start: '2025-02-08', end: '2025-02-23', type: 'school_vacation' },
  { start: '2025-04-05', end: '2025-04-21', type: 'school_vacation' },
  { start: '2025-07-05', end: '2025-08-31', type: 'peak_vacation' },
  { start: '2025-12-20', end: '2026-01-05', type: 'peak_vacation' },
  { start: '2025-07-04', end: '2025-07-06', type: 'vacation_departure' },
  { start: '2025-08-29', end: '2025-08-31', type: 'vacation_return' }
];

export const LONG_WEEKENDS = [
  { start: '2025-05-01', end: '2025-05-04', name: '1er mai' },
  { start: '2025-05-08', end: '2025-05-11', name: '8 mai' },
  { start: '2025-05-29', end: '2025-06-01', name: 'Ascension' },
  { start: '2025-07-14', end: '2025-07-14', name: '14 juillet' },
  { start: '2025-11-11', end: '2025-11-11', name: '11 novembre' }
];

export const REFERENCE_ROUTES = {
  'Paris-Lyon': { distance: 463, avg_price_range: { min: 25, max: 120 } },
  'Paris-Marseille': { distance: 775, avg_price_range: { min: 35, max: 140 } },
  'Paris-Bordeaux': { distance: 584, avg_price_range: { min: 30, max: 125 } },
  'Paris-Lille': { distance: 225, avg_price_range: { min: 20, max: 80 } },
  'Paris-Strasbourg': { distance: 489, avg_price_range: { min: 25, max: 110 } },
  'Paris-Nantes': { distance: 385, avg_price_range: { min: 25, max: 100 } },
  'Lyon-Marseille': { distance: 325, avg_price_range: { min: 20, max: 70 } }
};
