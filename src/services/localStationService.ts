import { Station } from '../types';
import { allStations } from '../data/allStations';
import { LocationService } from './locationService';

/**
 * Service de recherche de gares avec autocomplete optimisé
 */
export class LocalStationService {
  /**
   * Recherche de gares avec autocomplete intelligent
   * - Recherche par nom de gare
   * - Priorité aux correspondances exactes
   * - Limite à 10 résultats pour de meilleures performances
   */
  static async searchStations(query: string): Promise<Station[]> {
    // Simulation d'un délai réseau léger
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (!query || query.length < 2) {
      return [];
    }

    const normalizedQuery = query.toLowerCase().trim();

    // Diviser la requête en mots pour une recherche plus flexible
    const queryWords = normalizedQuery.split(' ').filter(word => word.length > 0);

    const results = allStations
      .map(station => {
        const stationNameLower = station.name.toLowerCase();
        let score = 0;

        // Correspondance exacte = score maximum
        if (stationNameLower === normalizedQuery) {
          score = 1000;
        }
        // Commence par la requête = score élevé
        else if (stationNameLower.startsWith(normalizedQuery)) {
          score = 500;
        }
        // Contient tous les mots = score moyen
        else if (queryWords.every(word => stationNameLower.includes(word))) {
          score = 100;
        }
        // Contient au moins un mot = score faible
        else if (queryWords.some(word => stationNameLower.includes(word))) {
          score = 10;
        }

        return { station, score };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) // Limiter à 10 résultats
      .map(result => result.station);

    // Grouper par ville et ajouter "Toutes les gares" pour les villes avec plusieurs gares
    const cityGroups = new Map<string, Station[]>();

    results.forEach(station => {
      // Extraire le nom de la ville
      let cityName = station.name.split(/[-\s]/)[0].trim();

      // Gérer les cas spéciaux
      if (cityName.toLowerCase() === 'saint' || cityName.toLowerCase() === 'sainte') {
        const parts = station.name.split(/[-\s]/);
        if (parts.length > 1) {
          cityName = `${parts[0]} ${parts[1]}`.trim();
        }
      }

      if (!cityGroups.has(cityName)) {
        cityGroups.set(cityName, []);
      }
      cityGroups.get(cityName)!.push(station);
    });

    // Construire la liste finale avec les options "Toutes les gares"
    const finalResults: Station[] = [];
    const processedCities = new Set<string>();

    results.forEach(station => {
      let cityName = station.name.split(/[-\s]/)[0].trim();

      if (cityName.toLowerCase() === 'saint' || cityName.toLowerCase() === 'sainte') {
        const parts = station.name.split(/[-\s]/);
        if (parts.length > 1) {
          cityName = `${parts[0]} ${parts[1]}`.trim();
        }
      }

      const cityStations = cityGroups.get(cityName) || [];

      // Si c'est la première gare de cette ville et qu'il y a plusieurs gares
      if (!processedCities.has(cityName) && cityStations.length > 1) {
        // Ajouter l'option "Toutes les gares" en premier
        const allStationsOption: Station = {
          id: `${cityName}-all-stations`,
          name: `${cityName} - Toutes les gares`,
          sncf_id: cityStations[0].sncf_id, // Utiliser le SNCF ID de la première gare
          lat: cityStations[0].lat,
          lon: cityStations[0].lon,
          real_name: cityStations[0].name, // Garder la référence à la vraie gare
        };
        finalResults.push(allStationsOption);
        processedCities.add(cityName);
      }

      finalResults.push(station);
    });

    return finalResults;
  }

  /**
   * Recherche de la gare la plus proche d'une position
   */
  static async getNearestStation(
    latitude: number,
    longitude: number
  ): Promise<Station | null> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    let nearestStation: Station | null = null;
    let minDistance = Infinity;

    for (const station of allStations) {
      const distance = LocationService.calculateDistance(
        latitude,
        longitude,
        station.lat,
        station.lon
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestStation = station;
      }
    }

    return nearestStation;
  }

  /**
   * Récupérer une gare par son ID
   */
  static async getStationById(id: number): Promise<Station | null> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return allStations.find((station) => station.id === id) || null;
  }

  /**
   * Récupérer toutes les gares
   */
  static getAllStations(): Station[] {
    return allStations;
  }

  /**
   * Récupérer les gares les plus fréquentées (premières de la liste)
   */
  static getPopularStations(limit: number = 20): Station[] {
    return allStations.slice(0, limit);
  }
}
