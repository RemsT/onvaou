/**
 * Service pour interroger la base de données GTFS SQLite
 * Optimisé pour la recherche locale de trajets
 */

import * as SQLite from 'expo-sqlite';
// Utiliser l'API legacy d'Expo FileSystem (compatible avec SDK 54+)
import * as FileSystem from 'expo-file-system/legacy';

export interface Stop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  parent_station?: string;
}

export interface Connection {
  trip_id: string;
  from_stop_id: string;
  from_stop_name: string;
  from_lat: number;
  from_lon: number;
  departure_time: string;
  to_stop_id: string;
  to_stop_name: string;
  to_lat: number;
  to_lon: number;
  arrival_time: string;
  route_short_name: string;
  route_long_name: string;
  service_id: string;
  trip_headsign: string;
}

export interface CalendarService {
  service_id: string;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
  start_date: string;
  end_date: string;
}

class GTFSDatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;

  /**
   * Initialise la connexion à la base de données
   * Note: La base de données est créée automatiquement par gtfsInitializationService
   * au premier lancement de l'application
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const dbPath = `${FileSystem.documentDirectory}SQLite/gtfs.db`;

      // Vérifier que la base de données existe
      const dbInfo = await FileSystem.getInfoAsync(dbPath);
      if (!dbInfo.exists) {
        throw new Error(
          'Base de données GTFS non trouvée. Elle sera créée automatiquement au prochain lancement de l\'application.'
        );
      }

      // Ouvrir la base de données existante
      this.db = await SQLite.openDatabaseAsync('gtfs.db');
      this.initialized = true;
      console.log('✅ Base de données GTFS initialisée');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de la DB GTFS:', error);
      throw error;
    }
  }

  /**
   * Recherche des gares par nom (autocomplétion)
   */
  async searchStops(query: string, limit: number = 20): Promise<Stop[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const searchPattern = `%${query}%`;
    const result = await this.db.getAllAsync<Stop>(
      `SELECT stop_id, stop_name, stop_lat, stop_lon, parent_station
       FROM stops
       WHERE stop_name LIKE ?
       ORDER BY stop_name
       LIMIT ?`,
      [searchPattern, limit]
    );

    return result;
  }

  /**
   * Trouve les gares proches d'une position GPS
   */
  async findNearbyStops(
    latitude: number,
    longitude: number,
    limit: number = 10
  ): Promise<(Stop & { distance: number })[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Calcul de distance approximatif (square euclidien)
    // Pour une distance réelle, utiliser la formule de Haversine
    const result = await this.db.getAllAsync<Stop & { distance_sq: number }>(
      `SELECT stop_id, stop_name, stop_lat, stop_lon, parent_station,
              ((stop_lat - ?) * (stop_lat - ?) + (stop_lon - ?) * (stop_lon - ?)) as distance_sq
       FROM stops
       ORDER BY distance_sq
       LIMIT ?`,
      [latitude, latitude, longitude, longitude, limit]
    );

    // Convertir en distance approximative en km
    return result.map(stop => ({
      ...stop,
      distance: Math.sqrt(stop.distance_sq) * 111 // Approximation: 1 degré ≈ 111 km
    }));
  }

  /**
   * Trouve toutes les connexions directes entre deux gares
   */
  async findDirectConnections(
    fromStopId: string,
    toStopId: string,
    departureTimeMin?: string,
    departureTimeMax?: string,
    limit: number = 50
  ): Promise<Connection[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    let query = `
      SELECT * FROM direct_connections
      WHERE from_stop_id = ? AND to_stop_id = ?
    `;
    const params: any[] = [fromStopId, toStopId];

    if (departureTimeMin) {
      query += ` AND departure_time >= ?`;
      params.push(departureTimeMin);
    }

    if (departureTimeMax) {
      query += ` AND departure_time <= ?`;
      params.push(departureTimeMax);
    }

    query += ` ORDER BY departure_time LIMIT ?`;
    params.push(limit);

    const result = await this.db.getAllAsync<Connection>(query, params);
    return result;
  }

  /**
   * Trouve toutes les destinations depuis une gare
   */
  async findDestinationsFrom(
    fromStopId: string,
    departureTimeMin?: string,
    departureTimeMax?: string
  ): Promise<{ stop_name: string; stop_id: string; nb_connections: number }[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    let query = `
      SELECT to_stop_id as stop_id, to_stop_name as stop_name, COUNT(*) as nb_connections
      FROM direct_connections
      WHERE from_stop_id = ?
    `;
    const params: any[] = [fromStopId];

    if (departureTimeMin) {
      query += ` AND departure_time >= ?`;
      params.push(departureTimeMin);
    }

    if (departureTimeMax) {
      query += ` AND departure_time <= ?`;
      params.push(departureTimeMax);
    }

    query += `
      GROUP BY to_stop_id, to_stop_name
      ORDER BY nb_connections DESC
    `;

    const result = await this.db.getAllAsync<{
      stop_name: string;
      stop_id: string;
      nb_connections: number;
    }>(query, params);

    return result;
  }

  /**
   * Vérifie si un service circule à une date donnée
   * Utilise uniquement calendar_dates (pas de table calendar dans notre DB)
   */
  async isServiceActiveOnDate(serviceId: string, date: Date): Promise<boolean> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Format YYYYMMDD
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

    // Vérifier dans calendar_dates
    const calendarDate = await this.db.getFirstAsync<{ exception_type: number }>(
      `SELECT exception_type FROM calendar_dates
       WHERE service_id = ? AND date = ?`,
      [serviceId, dateStr]
    );

    if (calendarDate) {
      // 1 = service ajouté, 2 = service supprimé
      return calendarDate.exception_type === 1;
    }

    // Si pas d'entrée dans calendar_dates, on suppose que le service ne circule pas
    // (approche conservatrice)
    return false;
  }

  /**
   * Filtre les connexions par date
   */
  async filterConnectionsByDate(
    connections: Connection[],
    date: Date
  ): Promise<Connection[]> {
    const filtered: Connection[] = [];

    for (const connection of connections) {
      const isActive = await this.isServiceActiveOnDate(connection.service_id, date);
      if (isActive) {
        filtered.push(connection);
      }
    }

    return filtered;
  }

  /**
   * Recherche de trajet avec correspondances (algorithme simple)
   * Pour un algorithme plus complexe, utiliser Dijkstra ou A*
   */
  async findJourney(
    fromStopId: string,
    toStopId: string,
    departureTime: string,
    date: Date,
    maxTransfers: number = 2
  ): Promise<Connection[][]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Rechercher d'abord les connexions directes
    const directConnections = await this.findDirectConnections(
      fromStopId,
      toStopId,
      departureTime,
      undefined,
      10
    );

    const validDirectConnections = await this.filterConnectionsByDate(
      directConnections,
      date
    );

    if (validDirectConnections.length > 0) {
      return validDirectConnections.map(c => [c]);
    }

    // Si pas de connexion directe et maxTransfers > 0, chercher avec 1 correspondance
    if (maxTransfers >= 1) {
      const journeysWithTransfer = await this.findJourneyWithOneTransfer(
        fromStopId,
        toStopId,
        departureTime,
        date
      );

      if (journeysWithTransfer.length > 0) {
        return journeysWithTransfer;
      }
    }

    return [];
  }

  /**
   * Recherche de trajets avec une correspondance
   */
  private async findJourneyWithOneTransfer(
    fromStopId: string,
    toStopId: string,
    departureTime: string,
    date: Date
  ): Promise<Connection[][]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Trouver toutes les gares intermédiaires possibles
    const firstLegs = await this.findDirectConnections(
      fromStopId,
      '',
      departureTime,
      undefined,
      100
    );

    const validFirstLegs = await this.filterConnectionsByDate(firstLegs, date);

    const journeys: Connection[][] = [];

    for (const firstLeg of validFirstLegs) {
      // Chercher une correspondance depuis la gare d'arrivée du premier trajet
      // avec un délai de correspondance minimum de 5 minutes
      const arrivalMinutes = this.timeToMinutes(firstLeg.arrival_time);
      const connectionTime = this.minutesToTime(arrivalMinutes + 5);

      const secondLegs = await this.findDirectConnections(
        firstLeg.to_stop_id,
        toStopId,
        connectionTime,
        undefined,
        10
      );

      const validSecondLegs = await this.filterConnectionsByDate(secondLegs, date);

      for (const secondLeg of validSecondLegs) {
        journeys.push([firstLeg, secondLeg]);
      }

      // Limiter le nombre de résultats
      if (journeys.length >= 5) {
        break;
      }
    }

    return journeys;
  }

  /**
   * Convertit un temps HH:MM:SS en minutes
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convertit des minutes en HH:MM:SS
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
  }

  /**
   * Obtient des statistiques sur la base de données
   */
  async getStats(): Promise<{
    stops: number;
    routes: number;
    trips: number;
    stopTimes: number;
  }> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stops = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM stops'
    );
    const routes = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM routes'
    );
    const trips = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM trips'
    );
    const stopTimes = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM stop_times'
    );

    return {
      stops: stops?.count || 0,
      routes: routes?.count || 0,
      trips: trips?.count || 0,
      stopTimes: stopTimes?.count || 0
    };
  }

  /**
   * Ferme la connexion à la base de données
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.initialized = false;
    }
  }
}

// Export singleton
export const gtfsDb = new GTFSDatabaseService();
