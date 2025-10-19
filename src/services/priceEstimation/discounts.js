/**
 * Gestion des cartes de réduction SNCF
 */

import { DISCOUNT_CARDS } from './constants';

/**
 * Applique une carte de réduction au prix
 */
export function applyDiscountCard(basePrice, cardType, isPeakTime, passengerAge) {
  if (!cardType || cardType === 'NONE') {
    return basePrice;
  }

  const card = DISCOUNT_CARDS[cardType];
  if (!card) {
    return basePrice;
  }

  // Vérifier l'âge si applicable
  if (card.age_range) {
    if (passengerAge < card.age_range[0] || passengerAge > card.age_range[1]) {
      return basePrice;
    }
  }

  // Déterminer le pourcentage de réduction
  let discountPercent = 0;
  if (card.discount_percent.peak && card.discount_percent.off_peak) {
    discountPercent = isPeakTime ? card.discount_percent.peak : card.discount_percent.off_peak;
  } else if (card.discount_percent.weekend) {
    discountPercent = card.discount_percent.weekend;
  }

  return basePrice * (1 - discountPercent / 100);
}

/**
 * Retourne les cartes éligibles pour un passager
 */
export function getEligibleCards(passengerAge) {
  const eligible = [];

  Object.entries(DISCOUNT_CARDS).forEach(([key, card]) => {
    if (key === 'NONE') {
      eligible.push({ key, ...card });
      return;
    }

    if (!card.age_range) {
      eligible.push({ key, ...card });
    } else if (passengerAge >= card.age_range[0] && passengerAge <= card.age_range[1]) {
      eligible.push({ key, ...card });
    }
  });

  return eligible;
}
