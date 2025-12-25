/**
 * Service pour interroger l'API Navitia.io
 * Documentation: https://doc.navitia.io/
 */

import { Station } from '../types';

// Clé API Navitia - À remplacer par votre propre clé obtenue sur https://www.navitia.io/
// Pour obtenir une clé gratuite: https://www.navitia.io/register/
const NAVITIA_API_KEY = process.env.EXPO_PUBLIC_NAVITIA_API_KEY || 'YOUR_NAVITIA_API_KEY';
const NAVITIA_BASE_URL = 'https://api.navitia.io/v1';

export interface NavitiaJourney {
  duration: number; // en secondes
  nb_transfers: number;
  departure_date_time: string;
  arrival_date_time: string;
  sections: NavitiaSection[];
  co2_emission?: {
    value: number;
    unit: string;
  };
}

export interface NavitiaSection {
  type: string; // 'public_transport', 'street_network', 'waiting', etc.
  mode?: string; // 'walking', 'bike', etc.
  duration: number;
  from: NavitiaPlace;
  to: NavitiaPlace;
  display_informations?: {
    network: string;
    direction: string;
    code: string;
    name: string;
  };
}

export interface NavitiaPlace {
  id: string;
  name: string;
  embedded_type: string;
  stop_point?: {
    id: string;
    name: string;
    coord: {
      lat: string;
      lon: string;
    };
  };
}

export interface NavitiaResponse {
  journeys: NavitiaJourney[];
  links: any[];
  tickets?: any[];
}

export class NavitiaService {
  /**
   * Construit l'URL de base avec authentification
   */
  private static getAuthHeaders(): HeadersInit {
    return {
      'Authorization': `Basic ${btoa(NAVITIA_API_KEY + ':')}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Convertit une Station en coordonnées Navitia (lon;lat)
   */
  private static stationToCoords(station: Station): string {
    return `${station.lon};${station.lat}`;
  }

  /**
   * Recherche des trajets entre deux gares
   * @param from Gare de départ
   * @param to Gare d'arrivée
   * @param datetime Date et heure de départ (optionnel, par défaut = maintenant)
   * @param count Nombre de résultats souhaités (par défaut = 5)
   * @returns Liste des trajets possibles
   */
  static async searchJourneys(
    from: Station,
    to: Station,
    datetime?: Date,
    count: number = 5
  ): Promise<NavitiaJourney[]> {
    try {
      const fromCoords = this.stationToCoords(from);
      const toCoords = this.stationToCoords(to);

      // Format de date Navitia: YYYYMMDDTHHmmss
      const dateStr = datetime
        ? this.formatNavitiaDate(datetime)
        : this.formatNavitiaDate(new Date());

      const url = `${NAVITIA_BASE_URL}/journeys?from=${fromCoords}&to=${toCoords}&datetime=${dateStr}&count=${count}&data_freshness=realtime`;

      console.log('Navitia API Request:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Navitia API Error: ${response.status} ${response.statusText}`);
      }

      const data: NavitiaResponse = await response.json();

      if (!data.journeys || data.journeys.length === 0) {
        console.warn('Aucun trajet trouvé pour cette recherche');
        return [];
      }

      return data.journeys;
    } catch (error) {
      console.error('Erreur lors de la recherche de trajets Navitia:', error);
      throw error;
    }
  }

  /**
   * Recherche des trajets depuis une gare vers plusieurs destinations
   * @param from Gare de départ
   * @param destinations Liste des gares de destination
   * @param datetime Date et heure de départ (optionnel)
   * @returns Map des destinations avec leurs trajets
   */
  static async searchMultipleDestinations(
    from: Station,
    destinations: Station[],
    datetime?: Date
  ): Promise<Map<number | string, NavitiaJourney[]>> {
    const results = new Map<number | string, NavitiaJourney[]>();

    // Recherche en parallèle pour toutes les destinations
    const promises = destinations.map(async (destination) => {
      try {
        const journeys = await this.searchJourneys(from, destination, datetime, 1);
        return { stationId: destination.id, journeys };
      } catch (error) {
        console.error(`Erreur pour la destination ${destination.name}:`, error);
        return { stationId: destination.id, journeys: [] };
      }
    });

    const responses = await Promise.all(promises);

    responses.forEach(({ stationId, journeys }) => {
      results.set(stationId, journeys);
    });

    return results;
  }

  /**
   * Formate une date au format Navitia (YYYYMMDDTHHmmss)
   */
  private static formatNavitiaDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  }

  /**
   * Estime le prix d'un trajet (Navitia ne fournit pas toujours les prix)
   * Estimation basée sur la durée et la distance
   */
  static estimatePrice(journey: NavitiaJourney): number {
    // Prix estimé: environ 0.15€ par minute de trajet
    const durationMinutes = journey.duration / 60;
    const basePrice = durationMinutes * 0.15;

    // Ajouter un supplément pour les correspondances
    const transferPrice = journey.nb_transfers * 2;

    return Math.round((basePrice + transferPrice) * 100) / 100;
  }

  /**
   * Vérifie si la clé API est configurée
   */
  static isConfigured(): boolean {
    return NAVITIA_API_KEY !== 'YOUR_NAVITIA_API_KEY';
  }
}
