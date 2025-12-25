/**
 * Service de recherche hybride
 * Utilise l'API Navitia si disponible, sinon utilise les données locales
 */

import { Station, SearchResult, CityLabel } from '../types';
import { NavitiaService, NavitiaJourney } from './navitiaService';
import { LocalSearchService } from './localSearchService';
import { frenchStations } from '../data/frenchStations';
import { filterStationsByLabels } from '../data/stationLabels';

export class HybridSearchService {
  /**
   * Extrait le nom de la ville depuis le nom de la gare
   */
  private static extractCityName(stationName: string): string {
    const normalized = stationName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const parts = normalized.split(/[\s-]+/);
    let cityName = parts[0];

    // Gérer les noms composés
    if ((cityName === 'saint' || cityName === 'sainte') && parts.length > 1) {
      cityName = parts[0] + '-' + parts[1];
    } else if (cityName === 'aix' && parts.length > 1 && parts[1] === 'en') {
      cityName = 'aix-en-provence';
    } else if (cityName === 'aix' && parts.length > 1 && parts[1] === 'les') {
      cityName = 'aix-les-bains';
    }

    return cityName;
  }

  /**
   * Vérifie si deux gares sont dans la même ville
   */
  private static areSameCity(station1: Station, station2: Station): boolean {
    const city1 = this.extractCityName(station1.name);
    const city2 = this.extractCityName(station2.name);
    return city1 === city2;
  }

  /**
   * Recherche des destinations avec horaires réels ou estimés
   */
  static async searchDestinations(
    fromStation: Station,
    mode: 'time' | 'budget' | 'both',
    maxTime?: number,
    maxBudget?: number,
    datetime?: Date,
    selectedLabels?: CityLabel[],
    timeRangeStart?: string,
    timeRangeEnd?: string
  ): Promise<SearchResult[]> {
    // Utilisation des données locales uniquement (APIs désactivées temporairement)
    console.log('Utilisation des données locales avec estimation des prix');

    // Vérifier si c'est une gare "Toutes les gares"
    if (typeof fromStation.id === 'string' && fromStation.id.includes('-all-stations')) {
      // Extraire le nom de la ville
      const cityName = fromStation.id.replace('-all-stations', '');

      // Trouver toutes les gares de cette ville
      const cityStations = frenchStations.filter(station => {
        let stationCityName = station.name.split(/[-\s]/)[0].trim();

        // Gérer les cas spéciaux
        if (stationCityName.toLowerCase() === 'saint' || stationCityName.toLowerCase() === 'sainte') {
          const parts = station.name.split(/[-\s]/);
          if (parts.length > 1) {
            stationCityName = `${parts[0]} ${parts[1]}`.trim();
          }
        }

        return stationCityName === cityName;
      });

      console.log(`🚀 Recherche optimisée depuis ${cityStations.length} gares de ${cityName}`);

      // OPTIMISATION: Lancer toutes les recherches en parallèle
      const searchPromises = cityStations.map(station =>
        LocalSearchService.searchDestinations(
          station,
          mode,
          maxTime,
          maxBudget,
          selectedLabels,
          timeRangeStart,
          timeRangeEnd,
          datetime
        )
      );

      // Attendre que toutes les recherches soient terminées
      const allResultsArrays = await Promise.all(searchPromises);

      // Fusionner et dédupliquer les résultats
      const destinationMap = new Map<string, SearchResult>();

      allResultsArrays.forEach(results => {
        results.forEach(result => {
          const destKey = String(result.to_station_id);
          const existing = destinationMap.get(destKey);

          // Garder le meilleur résultat (durée la plus courte)
          if (!existing || result.duration < existing.duration) {
            destinationMap.set(destKey, result);
          }
        });
      });

      // Convertir en tableau et trier par durée
      const finalResults = Array.from(destinationMap.values());
      finalResults.sort((a, b) => a.duration - b.duration);

      console.log(`✅ ${finalResults.length} destinations trouvées après déduplication`);

      return finalResults;
    }

    return LocalSearchService.searchDestinations(fromStation, mode, maxTime, maxBudget, selectedLabels, timeRangeStart, timeRangeEnd, datetime);
  }
}
