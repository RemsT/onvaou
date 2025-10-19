/**
 * Calculateur de prix SNCF
 */

import {
  TRAIN_TYPES,
  BASE_PRICE_PER_KM,
  MIN_PRICES,
  MAX_PRICES,
  BOOKING_TIME_MULTIPLIERS,
  DEPARTURE_TIME_MULTIPLIERS,
  DAY_OF_WEEK_MULTIPLIERS,
  VACATION_MULTIPLIERS,
  CAPACITY_MULTIPLIERS,
  VACATION_PERIODS,
  LONG_WEEKENDS,
  REFERENCE_ROUTES
} from './constants';

import { applyDiscountCard } from './discounts';
import { generateRecommendations } from './recommendations';

/**
 * Calcule le nombre de jours jusqu'au voyage
 */
export function getDaysUntilTravel(travelDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const travel = new Date(travelDate);
  travel.setHours(0, 0, 0, 0);
  return Math.floor((travel - today) / (1000 * 60 * 60 * 24));
}

/**
 * Détermine la catégorie de délai de réservation
 */
export function getBookingTimeCategory(daysUntilTravel) {
  if (daysUntilTravel === 0) return 'same_day';
  if (daysUntilTravel === 1) return 'next_day';
  if (daysUntilTravel <= 3) return 'within_3_days';
  if (daysUntilTravel <= 7) return 'within_week';
  if (daysUntilTravel <= 14) return 'within_2_weeks';
  if (daysUntilTravel <= 30) return 'within_month';
  if (daysUntilTravel <= 90) return 'within_3_months';
  return 'more_than_3_months';
}

/**
 * Détermine la catégorie horaire
 */
export function getDepartureTimeCategory(hour) {
  if (hour >= 5 && hour < 7) return 'early_morning';
  if (hour >= 7 && hour < 9) return 'morning_peak';
  if (hour >= 9 && hour < 11) return 'mid_morning';
  if (hour >= 11 && hour < 14) return 'lunch_time';
  if (hour >= 14 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'evening_peak';
  if (hour >= 20 && hour < 22) return 'late_evening';
  return 'night';
}

/**
 * Obtient le multiplicateur du jour de la semaine
 */
export function getDayOfWeekMultiplier(date) {
  const dayOfWeek = new Date(date).getDay();
  return DAY_OF_WEEK_MULTIPLIERS[dayOfWeek];
}

/**
 * Vérifie si la date est en période de vacances
 */
export function getVacationMultiplier(date) {
  const travelDate = new Date(date);

  // Vérifier les périodes de vacances
  for (const period of VACATION_PERIODS) {
    const start = new Date(period.start);
    const end = new Date(period.end);
    if (travelDate >= start && travelDate <= end) {
      return VACATION_MULTIPLIERS[period.type];
    }
  }

  // Vérifier les week-ends prolongés
  for (const weekend of LONG_WEEKENDS) {
    const start = new Date(weekend.start);
    const end = new Date(weekend.end);
    if (travelDate >= start && travelDate <= end) {
      return VACATION_MULTIPLIERS.long_weekend;
    }
  }

  return VACATION_MULTIPLIERS.normal_period;
}

/**
 * Estime le niveau de capacité
 */
export function estimateCapacityLevel(
  trainType,
  daysUntilTravel,
  hour,
  dayMultiplier,
  vacationMultiplier
) {
  let demandScore = 1.0;

  const timeCategory = getDepartureTimeCategory(hour);
  if (timeCategory === 'morning_peak' || timeCategory === 'evening_peak') {
    demandScore *= 1.4;
  }

  demandScore *= dayMultiplier;
  demandScore *= vacationMultiplier;

  if (daysUntilTravel <= 3) {
    demandScore *= 1.3;
  } else if (daysUntilTravel > 30) {
    demandScore *= 0.7;
  }

  if (demandScore >= 1.5) return 'almost_full';
  if (demandScore >= 1.3) return 'high_demand';
  if (demandScore >= 1.1) return 'moderate';
  if (demandScore >= 0.9) return 'available';
  return 'low_demand';
}

/**
 * Fonction principale d'estimation du prix
 */
export function estimateTrainPrice(params) {
  const {
    distance,
    trainType = TRAIN_TYPES.TGV_INOUI,
    departureDate,
    departureHour = 12,
    passengerAge = 30,
    discountCard = 'NONE',
    route = null
  } = params;

  // ÉTAPE 1: Prix de base
  const basePricePerKm = BASE_PRICE_PER_KM[trainType];
  let basePrice = distance * basePricePerKm;

  basePrice = Math.max(MIN_PRICES[trainType], basePrice);
  basePrice = Math.min(MAX_PRICES[trainType], basePrice);

  // Calibrage sur trajets de référence
  if (route && REFERENCE_ROUTES[route]) {
    const refRoute = REFERENCE_ROUTES[route];
    const avgRefPrice = (refRoute.avg_price_range.min + refRoute.avg_price_range.max) / 2;
    basePrice = basePrice * 0.7 + avgRefPrice * 0.3;
  }

  // ÉTAPE 2: Multiplicateurs temporels
  const daysUntilTravel = getDaysUntilTravel(departureDate);
  const bookingTimeCategory = getBookingTimeCategory(daysUntilTravel);
  const bookingTimeMultiplier = BOOKING_TIME_MULTIPLIERS[bookingTimeCategory];

  const departureTimeCategory = getDepartureTimeCategory(departureHour);
  const departureTimeMultiplier = DEPARTURE_TIME_MULTIPLIERS[departureTimeCategory];

  const dayOfWeekMultiplier = getDayOfWeekMultiplier(departureDate);
  const vacationMultiplier = getVacationMultiplier(departureDate);

  // ÉTAPE 3: Capacité
  const estimatedCapacity = estimateCapacityLevel(
    trainType,
    daysUntilTravel,
    departureHour,
    dayOfWeekMultiplier,
    vacationMultiplier
  );
  const capacityMultiplier = CAPACITY_MULTIPLIERS[estimatedCapacity];

  // ÉTAPE 4: Prix avant réduction
  let priceBeforeDiscount = basePrice *
    bookingTimeMultiplier *
    departureTimeMultiplier *
    dayOfWeekMultiplier *
    vacationMultiplier *
    capacityMultiplier;

  // ÉTAPE 5: Offres spéciales
  let specialOffer = null;

  // PREM'S
  if (daysUntilTravel >= 90 && trainType === TRAIN_TYPES.TGV_INOUI) {
    priceBeforeDiscount = basePrice * 0.30; // -70%
    specialOffer = 'PREMS';
  }

  // OUIGO prix fixes
  if (trainType === TRAIN_TYPES.TGV_OUIGO) {
    const ouigoPrices = [10, 16, 25, 35, 59];
    priceBeforeDiscount = ouigoPrices.reduce((prev, curr) =>
      Math.abs(curr - priceBeforeDiscount) < Math.abs(prev - priceBeforeDiscount) ? curr : prev
    );
    specialOffer = 'OUIGO';
  }

  // ÉTAPE 6: Carte de réduction
  const isPeakTime = departureTimeCategory === 'morning_peak' ||
                     departureTimeCategory === 'evening_peak';

  let finalPrice = priceBeforeDiscount;
  let discountApplied = 0;

  if (discountCard !== 'NONE') {
    const priceWithCard = applyDiscountCard(
      priceBeforeDiscount,
      discountCard,
      isPeakTime,
      passengerAge
    );
    discountApplied = priceBeforeDiscount - priceWithCard;
    finalPrice = priceWithCard;
  }

  // ÉTAPE 7: Limites et arrondi
  finalPrice = Math.max(MIN_PRICES[trainType], finalPrice);
  finalPrice = Math.min(MAX_PRICES[trainType], finalPrice);
  finalPrice = Math.round(finalPrice * 100) / 100;

  // ÉTAPE 8: Fourchette de prix
  const priceRange = {
    min: Math.max(MIN_PRICES[trainType], Math.round((finalPrice * 0.85) * 100) / 100),
    max: Math.min(MAX_PRICES[trainType], Math.round((finalPrice * 1.15) * 100) / 100),
    average: finalPrice
  };

  // Résultat
  return {
    estimatedPrice: finalPrice,
    priceRange: priceRange,
    currency: 'EUR',
    breakdown: {
      basePrice: Math.round(basePrice * 100) / 100,
      distance: distance,
      trainType: trainType,
      multipliers: {
        bookingTime: bookingTimeMultiplier,
        departureTime: departureTimeMultiplier,
        dayOfWeek: dayOfWeekMultiplier,
        vacation: vacationMultiplier,
        capacity: capacityMultiplier,
        total: Math.round((bookingTimeMultiplier * departureTimeMultiplier *
                          dayOfWeekMultiplier * vacationMultiplier *
                          capacityMultiplier) * 100) / 100
      },
      priceBeforeDiscount: Math.round(priceBeforeDiscount * 100) / 100,
      discountApplied: Math.round(discountApplied * 100) / 100,
      specialOffer: specialOffer,
      finalPrice: finalPrice
    },
    travelInfo: {
      daysUntilTravel: daysUntilTravel,
      bookingCategory: bookingTimeCategory,
      departureTimeCategory: departureTimeCategory,
      capacityLevel: estimatedCapacity,
      isPeakTime: isPeakTime
    },
    recommendations: generateRecommendations(params, daysUntilTravel, finalPrice, trainType)
  };
}

/**
 * Compare plusieurs options de trains
 */
export function compareTrainOptions(baseParams) {
  const options = [];

  // TGV INOUI
  options.push({
    name: 'TGV INOUI',
    ...estimateTrainPrice({ ...baseParams, trainType: TRAIN_TYPES.TGV_INOUI })
  });

  // OUIGO (si >200km)
  if (baseParams.distance > 200) {
    options.push({
      name: 'TGV OUIGO',
      ...estimateTrainPrice({ ...baseParams, trainType: TRAIN_TYPES.TGV_OUIGO })
    });
  }

  // INTERCITÉS
  if (baseParams.distance > 100 && baseParams.distance < 800) {
    options.push({
      name: 'INTERCITÉS',
      ...estimateTrainPrice({ ...baseParams, trainType: TRAIN_TYPES.INTERCITES })
    });
  }

  return options.sort((a, b) => a.estimatedPrice - b.estimatedPrice);
}
