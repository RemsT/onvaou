/**
 * Génération de recommandations d'économies
 */

import { TRAIN_TYPES } from './constants';

export function generateRecommendations(params, daysUntilTravel, currentPrice, trainType) {
  const recommendations = [];

  // Recommandation sur le timing
  if (daysUntilTravel < 7) {
    recommendations.push({
      type: 'booking_time',
      icon: '📅',
      message: 'Réservez plus tôt pour obtenir des prix PREM\'S jusqu\'à -70%',
      potential_saving: Math.round(currentPrice * 0.4),
      priority: 'high'
    });
  }

  // Recommandation sur l'heure
  const hour = params.departureHour;
  if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 20)) {
    recommendations.push({
      type: 'departure_time',
      icon: '⏰',
      message: 'Voyagez en dehors des heures de pointe pour économiser jusqu\'à 30%',
      potential_saving: Math.round(currentPrice * 0.25),
      priority: 'medium'
    });
  }

  // Recommandation OUIGO
  if (trainType === TRAIN_TYPES.TGV_INOUI && currentPrice > 30 && params.distance > 200) {
    recommendations.push({
      type: 'train_type',
      icon: '🚄',
      message: 'Considérez OUIGO pour le même trajet à partir de 10€',
      potential_saving: Math.max(10, Math.round(currentPrice * 0.6)),
      priority: 'high'
    });
  }

  // Recommandation carte de réduction
  if (params.discountCard === 'NONE') {
    const age = params.passengerAge;
    if (age >= 12 && age <= 27) {
      recommendations.push({
        type: 'discount_card',
        icon: '💳',
        message: 'Carte Jeune (50€/an): jusqu\'à -60% sur vos trajets',
        potential_saving: Math.round(currentPrice * 0.4),
        priority: 'high'
      });
    } else if (age >= 60) {
      recommendations.push({
        type: 'discount_card',
        icon: '💳',
        message: 'Carte Senior+ (49€/an): jusqu\'à -60% sur vos trajets',
        potential_saving: Math.round(currentPrice * 0.4),
        priority: 'high'
      });
    } else {
      recommendations.push({
        type: 'discount_card',
        icon: '💳',
        message: 'Carte Avantage (49€/an): jusqu\'à -40% sur vos trajets',
        potential_saving: Math.round(currentPrice * 0.3),
        priority: 'medium'
      });
    }
  }

  // Trier par priorité et économies potentielles
  recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return b.potential_saving - a.potential_saving;
  });

  return recommendations;
}
