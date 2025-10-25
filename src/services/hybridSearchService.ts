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
    return LocalSearchService.searchDestinations(fromStation, mode, maxTime, maxBudget, selectedLabels, timeRangeStart, timeRangeEnd, datetime);
  }
}
