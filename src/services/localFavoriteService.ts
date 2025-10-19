import AsyncStorage from '@react-native-async-storage/async-storage';
import { Station } from '../types';
import { LocalStationService } from './localStationService';

const FAVORITES_KEY = '@onvaou_favorites';

export interface LocalFavorite {
  stationId: number;
  addedAt: string;
}

export class LocalFavoriteService {
  /**
   * Récupère tous les favoris
   */
  static async getFavorites(): Promise<Station[]> {
    try {
      const favoritesJson = await AsyncStorage.getItem(FAVORITES_KEY);
      if (!favoritesJson) return [];

      const favorites: LocalFavorite[] = JSON.parse(favoritesJson);

      // Récupérer les détails des stations
      const stations: Station[] = [];
      for (const fav of favorites) {
        const station = await LocalStationService.getStationById(fav.stationId);
        if (station) {
          stations.push(station);
        }
      }

      return stations;
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  /**
   * Ajoute une station aux favoris
   */
  static async addFavorite(stationId: number): Promise<boolean> {
    try {
      const favoritesJson = await AsyncStorage.getItem(FAVORITES_KEY);
      const favorites: LocalFavorite[] = favoritesJson
        ? JSON.parse(favoritesJson)
        : [];

      // Vérifier si déjà en favoris
      if (favorites.some((fav) => fav.stationId === stationId)) {
        return false;
      }

      favorites.push({
        stationId,
        addedAt: new Date().toISOString(),
      });

      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      return true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      return false;
    }
  }

  /**
   * Supprime une station des favoris
   */
  static async removeFavorite(stationId: number): Promise<boolean> {
    try {
      const favoritesJson = await AsyncStorage.getItem(FAVORITES_KEY);
      if (!favoritesJson) return false;

      const favorites: LocalFavorite[] = JSON.parse(favoritesJson);
      const filteredFavorites = favorites.filter(
        (fav) => fav.stationId !== stationId
      );

      await AsyncStorage.setItem(
        FAVORITES_KEY,
        JSON.stringify(filteredFavorites)
      );
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      return false;
    }
  }

  /**
   * Vérifie si une station est en favoris
   */
  static async isFavorite(stationId: number): Promise<boolean> {
    try {
      const favoritesJson = await AsyncStorage.getItem(FAVORITES_KEY);
      if (!favoritesJson) return false;

      const favorites: LocalFavorite[] = JSON.parse(favoritesJson);
      return favorites.some((fav) => fav.stationId === stationId);
    } catch (error) {
      console.error('Error checking favorite:', error);
      return false;
    }
  }

  /**
   * Vide tous les favoris
   */
  static async clearFavorites(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(FAVORITES_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing favorites:', error);
      return false;
    }
  }
}
