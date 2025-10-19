/**
 * Service d'estimation des prix de train
 * Basé sur les tarifs SNCF 2024-2025 et la distance parcourue
 */

export class PriceEstimationService {
  /**
   * Calcule une estimation du prix d'un trajet en train
   * Les prix sont basés sur :
   * - Distance parcourue
   * - Type de train estimé (TGV, Intercités, TER)
   * - Tarification SNCF moyenne (hors promos et tarifs dynamiques)
   *
   * @param distance Distance en kilomètres
   * @param duration Durée en minutes
   * @returns Object contenant prix moyen et range {min, max}
   */
  static estimatePrice(distance: number, duration: number): {
    average: number;
    min: number;
    max: number;
  } {
    // Déterminer le type de train probable selon distance et vitesse
    const speedKmH = (distance / duration) * 60;

    let basePrice: number;
    let minMultiplier: number;
    let maxMultiplier: number;

    if (speedKmH > 200) {
      // TGV (> 200 km/h)
      // Tarifs réels TGV 2024-2025 : 0.25€ à 0.45€ par km en moyenne
      // Exemples réels:
      // - Paris-Lyon (465km) : 35€ (Prems) à 120€ (Flex) = 0.08€ à 0.26€/km
      // - Paris-Marseille (775km) : 45€ (Prems) à 180€ (Flex) = 0.06€ à 0.23€/km
      // - Paris-Bordeaux (580km) : 40€ (Prems) à 150€ (Flex) = 0.07€ à 0.26€/km

      if (distance < 200) {
        // TGV courte distance (ex: Paris-Reims)
        basePrice = distance * 0.35 + 15; // Frais fixes + distance
        minMultiplier = 0.5; // OUIGO / Prems anticipé
        maxMultiplier = 2.0; // Last minute / 1ère classe
      } else if (distance < 500) {
        // TGV moyenne distance (ex: Paris-Lyon, Paris-Bordeaux)
        basePrice = distance * 0.28 + 20;
        minMultiplier = 0.4; // Prems / OUIGO
        maxMultiplier = 1.8; // Flex / dernière minute
      } else {
        // TGV longue distance (ex: Paris-Marseille, Paris-Nice)
        basePrice = distance * 0.24 + 30;
        minMultiplier = 0.35; // Prems très anticipé
        maxMultiplier = 1.6; // Standard flex
      }
    } else if (speedKmH > 100) {
      // Intercités (100-200 km/h)
      // Tarifs réels Intercités 2024-2025 : 0.15€ à 0.25€ par km
      // Exemples réels:
      // - Paris-Clermont (420km) : 35€ à 75€ = 0.08€ à 0.18€/km
      // - Toulouse-Bordeaux (245km) : 25€ à 55€ = 0.10€ à 0.22€/km

      basePrice = distance * 0.20 + 12;
      minMultiplier = 0.6; // Tarif réduit / anticipé
      maxMultiplier = 1.5; // Tarif plein / dernière minute
    } else {
      // TER (< 100 km/h)
      // Tarifs réels TER 2024-2025 : 0.12€ à 0.18€ par km
      // Exemples réels:
      // - Lyon-Grenoble (105km) : 15€ à 25€ = 0.14€ à 0.24€/km
      // - Marseille-Aix (30km) : 8€ à 12€ = 0.27€ à 0.40€/km

      if (distance < 50) {
        // TER très courte distance
        basePrice = distance * 0.25 + 5; // Prix minimum plus élevé
        minMultiplier = 0.75; // Tarif réduit
        maxMultiplier = 1.4; // Tarif plein
      } else if (distance < 150) {
        // TER courte/moyenne distance
        basePrice = distance * 0.18 + 8;
        minMultiplier = 0.7;
        maxMultiplier = 1.35;
      } else {
        // TER longue distance
        basePrice = distance * 0.15 + 10;
        minMultiplier = 0.65;
        maxMultiplier = 1.3;
      }
    }

    // Ajustements selon la distance totale
    if (distance < 30) {
      // Très courts trajets : prix minimum absolu
      basePrice = Math.max(basePrice, 8);
    } else if (distance < 100) {
      // Courts trajets
      basePrice = Math.max(basePrice, 12);
    } else if (distance > 700) {
      // Très longs trajets : légère dégressivité
      basePrice *= 0.95;
    }

    // Ajouter une légère variation aléatoire pour simuler les tarifs dynamiques (+/- 5%)
    const randomFactor = 0.95 + (Math.random() * 0.1); // Entre 0.95 et 1.05
    basePrice *= randomFactor;

    // Arrondir les prix (multiples de 5€ pour plus de réalisme)
    const average = Math.round(basePrice / 5) * 5;
    const min = Math.round((basePrice * minMultiplier) / 5) * 5;
    const max = Math.round((basePrice * maxMultiplier) / 5) * 5;

    // S'assurer que min < average < max
    return {
      average: Math.max(average, min + 5),
      min: Math.max(min, 5),
      max: Math.max(max, average + 10),
    };
  }

  /**
   * Estime le prix avec correspondances
   * Ajoute un supplément si correspondances
   */
  static estimatePriceWithTransfers(
    distance: number,
    duration: number,
    nbTransfers: number = 0
  ): {
    average: number;
    min: number;
    max: number;
  } {
    const baseEstimate = this.estimatePrice(distance, duration);

    // Ajouter un petit supplément pour les correspondances (5-10€)
    const transferSupplement = nbTransfers * 7;

    return {
      average: baseEstimate.average + transferSupplement,
      min: baseEstimate.min + Math.floor(transferSupplement * 0.7),
      max: baseEstimate.max + Math.ceil(transferSupplement * 1.3),
    };
  }

  /**
   * Formatte le prix en chaîne de caractères
   */
  static formatPrice(average: number, min: number, max: number): string {
    if (min === max) {
      return `${average}€`;
    }
    return `${min}€ - ${max}€`;
  }

  /**
   * Retourne un message d'avertissement sur les estimations
   */
  static getPriceWarning(): string {
    return 'Prix estimés - Les tarifs réels peuvent varier selon la période, le type de billet et les promotions en cours.';
  }

  /**
   * Retourne des conseils pour obtenir les meilleurs prix
   */
  static getPriceTips(): string[] {
    return [
      'Réservez à l\'avance pour bénéficier des tarifs Prems (jusqu\'à 70% de réduction)',
      'Voyagez en heures creuses pour des tarifs plus avantageux',
      'Utilisez une carte de réduction (Jeune, Senior, etc.) pour économiser 30%',
      'Consultez OUIGO pour des prix bas sur certaines lignes TGV',
      'Comparez les prix sur voyages-sncf.com pour trouver la meilleure offre',
    ];
  }
}
