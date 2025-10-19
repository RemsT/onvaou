/**
 * Service AMÉLIORÉ pour interroger la base de données GTFS SQLite
 * Optimisé pour la recherche de trajets avec CORRESPONDANCES
 *
 * Utilise les vues SQL transfer_opportunities pour des performances maximales
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
  nb_stops?: number;
}

export interface JourneyWithTransfer {
  legs: Connection[];
  totalDuration: number;
  transferTime?: number;
  transferStation?: string;
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

class GTFSDatabaseServiceEnhanced {
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

      // Vérifier que la vue direct_connections existe et contient des données
      const viewExists = await this.db.getAllAsync<any>(
        `SELECT name FROM sqlite_master WHERE type='view' AND name='direct_connections'`
      );

      if (viewExists.length === 0) {
        console.error('❌ PROBLÈME: La vue direct_connections n\'existe pas !');
      } else {
        console.log('✅ Vue direct_connections existe');

        // Compter les connexions
        const count = await this.db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM direct_connections LIMIT 1`
        );

        console.log(`📊 Nombre de connexions dans direct_connections: ${count?.count || 0}`);

        if (count && count.count > 0) {
          // Afficher un exemple de connexion
          const example = await this.db.getFirstAsync<any>(
            `SELECT from_stop_id, to_stop_id, departure_time FROM direct_connections LIMIT 1`
          );
          console.log(`📌 Exemple de connexion: ${example?.from_stop_id} -> ${example?.to_stop_id} à ${example?.departure_time}`);
        } else {
          console.error('❌ PROBLÈME: La vue direct_connections est VIDE !');
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de la DB GTFS:', error);
      throw error;
    }
  }

  /**
   * Recherche des gares par nom ou par ID
   */
  async searchStops(query: string, limit: number = 20): Promise<Stop[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const searchPattern = `%${query}%`;
    const result = await this.db.getAllAsync<Stop>(
      `SELECT stop_id, stop_name, stop_lat, stop_lon, parent_station
       FROM stops
       WHERE stop_name LIKE ? OR stop_id LIKE ?
       ORDER BY
         CASE
           WHEN stop_id = ? THEN 1
           WHEN stop_id LIKE ? THEN 2
           ELSE 3
         END,
         stop_name
       LIMIT ?`,
      [searchPattern, searchPattern, query, query + '%', limit]
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

    const result = await this.db.getAllAsync<Stop & { distance_sq: number }>(
      `SELECT stop_id, stop_name, stop_lat, stop_lon, parent_station,
              ((stop_lat - ?) * (stop_lat - ?) + (stop_lon - ?) * (stop_lon - ?)) as distance_sq
       FROM stops
       ORDER BY distance_sq
       LIMIT ?`,
      [latitude, latitude, longitude, longitude, limit]
    );

    return result.map(stop => ({
      ...stop,
      distance: Math.sqrt(stop.distance_sq) * 111
    }));
  }

  /**
   * Trouve toutes les connexions directes entre deux gares
   * Supporte à la fois les StopArea et StopPoint
   * Si un StopArea est donné, recherche aussi les connexions depuis/vers ses StopPoints enfants
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

    // D'abord vérifier si la vue direct_connections existe
    const viewCheck = await this.db.getAllAsync<any>(
      `SELECT name FROM sqlite_master WHERE type='view' AND name='direct_connections'`
    );

    if (viewCheck.length === 0) {
      console.error('❌ La vue direct_connections n\'existe pas !');
      return [];
    }

    // Rechercher les connexions en incluant les StopPoints enfants si StopArea est fourni
    let query = `
      SELECT DISTINCT dc.* FROM direct_connections dc
      LEFT JOIN stops from_stops ON dc.from_stop_id = from_stops.stop_id
      LEFT JOIN stops to_stops ON dc.to_stop_id = to_stops.stop_id
      WHERE (
        dc.from_stop_id = ? OR from_stops.parent_station = ?
      ) AND (
        dc.to_stop_id = ? OR to_stops.parent_station = ?
      )
    `;
    const params: any[] = [fromStopId, fromStopId, toStopId, toStopId];

    if (departureTimeMin) {
      query += ` AND dc.departure_time >= ?`;
      params.push(departureTimeMin);
    }

    if (departureTimeMax) {
      query += ` AND dc.departure_time <= ?`;
      params.push(departureTimeMax);
    }

    query += ` ORDER BY dc.departure_time LIMIT ?`;
    params.push(limit);

    const result = await this.db.getAllAsync<Connection>(query, params);

    return result;
  }

  /**
   * 🚀 OPTIMISÉ: Trouve TOUTES les destinations accessibles depuis une gare en UNE SEULE requête SQL
   * Beaucoup plus rapide que de chercher destination par destination
   */
  async findAllDestinationsFrom(
    fromStopId: string,
    departureTimeMin?: string,
    departureTimeMax?: string,
    limit: number = 500
  ): Promise<Connection[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Recherche toutes les destinations accessibles depuis fromStopId (incluant les StopPoints enfants)
    let query = `
      SELECT DISTINCT dc.* FROM direct_connections dc
      LEFT JOIN stops from_stops ON dc.from_stop_id = from_stops.stop_id
      WHERE (dc.from_stop_id = ? OR from_stops.parent_station = ?)
    `;
    const params: any[] = [fromStopId, fromStopId];

    if (departureTimeMin) {
      query += ` AND dc.departure_time >= ?`;
      params.push(departureTimeMin);
    }

    if (departureTimeMax) {
      query += ` AND dc.departure_time <= ?`;
      params.push(departureTimeMax);
    }

    query += ` ORDER BY dc.to_stop_id, dc.departure_time LIMIT ?`;
    params.push(limit);

    console.log(`[findAllDestinationsFrom] 🚀 Recherche BULK de toutes les destinations depuis ${fromStopId}`);
    const result = await this.db.getAllAsync<Connection>(query, params);
    console.log(`[findAllDestinationsFrom] ✅ ${result.length} connexions trouvées`);

    return result;
  }

  /**
   * 🚀 BULK OPTIMISÉ: Trouve TOUTES les destinations avec 1 correspondance depuis une gare
   * Retourne les meilleures connexions groupées par destination
   */
  async findAllDestinationsWithOneTransfer(
    fromStopId: string,
    departureTimeMin?: string,
    departureTimeMax?: string,
    maxWaitMinutes: number = 120,
    limit: number = 500
  ): Promise<Map<string, JourneyWithTransfer>> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    console.log(`[findAllDestinationsWithOneTransfer] 🔄 Recherche BULK avec 1 correspondance depuis ${fromStopId}`);

    const query = `
      SELECT
        -- Informations du trajet
        leg2.to_stop_id as destination_id,
        leg2.to_stop_name as destination_name,

        -- Premier segment
        leg1.departure_time,
        leg1.arrival_time as transfer_arrival,
        leg1.route_short_name as route1,
        leg1.to_stop_name as transfer_station,

        -- Deuxième segment
        leg2.departure_time as transfer_departure,
        leg2.arrival_time,
        leg2.route_short_name as route2,

        -- Calculs
        (CAST(substr(leg2.departure_time, 1, 2) AS INTEGER) * 60 +
         CAST(substr(leg2.departure_time, 4, 2) AS INTEGER)) -
        (CAST(substr(leg1.arrival_time, 1, 2) AS INTEGER) * 60 +
         CAST(substr(leg1.arrival_time, 4, 2) AS INTEGER)) as transfer_wait_minutes,

        (CAST(substr(leg2.arrival_time, 1, 2) AS INTEGER) * 60 +
         CAST(substr(leg2.arrival_time, 4, 2) AS INTEGER)) -
        (CAST(substr(leg1.departure_time, 1, 2) AS INTEGER) * 60 +
         CAST(substr(leg1.departure_time, 4, 2) AS INTEGER)) as total_duration_minutes

      FROM direct_connections leg1
      LEFT JOIN stops from_stops ON leg1.from_stop_id = from_stops.stop_id
      JOIN direct_connections leg2
        ON leg1.to_stop_id = leg2.from_stop_id
        AND leg1.trip_id != leg2.trip_id
        AND leg2.departure_time > leg1.arrival_time

      WHERE (leg1.from_stop_id = ? OR from_stops.parent_station = ?)
        ${departureTimeMin ? 'AND leg1.departure_time >= ?' : ''}
        ${departureTimeMax ? 'AND leg1.departure_time <= ?' : ''}
        AND transfer_wait_minutes >= 5
        AND transfer_wait_minutes <= ?
        AND total_duration_minutes <= 480

      ORDER BY leg2.to_stop_id, total_duration_minutes
      LIMIT ?;
    `;

    const params: any[] = [fromStopId, fromStopId];
    if (departureTimeMin) params.push(departureTimeMin);
    if (departureTimeMax) params.push(departureTimeMax);
    params.push(maxWaitMinutes, limit);

    const results = await this.db.getAllAsync<any>(query, params);
    console.log(`[findAllDestinationsWithOneTransfer] ✅ ${results.length} trajets avec correspondance trouvés`);

    // Regrouper par destination (garder seulement le meilleur par destination)
    const destinationMap = new Map<string, JourneyWithTransfer>();

    for (const row of results) {
      const destId = row.destination_id;

      // Si on a déjà une meilleure connexion pour cette destination, ignorer
      if (destinationMap.has(destId)) continue;

      // Créer le journey simplifié
      destinationMap.set(destId, {
        legs: [], // On ne stocke pas les détails complets pour économiser la mémoire
        totalDuration: row.total_duration_minutes,
        transferTime: row.transfer_wait_minutes,
        transferStation: row.transfer_station
      } as any);
    }

    console.log(`[findAllDestinationsWithOneTransfer] 📍 ${destinationMap.size} destinations uniques`);
    return destinationMap;
  }

  /**
   * 🔄 NOUVEAU: Recherche de trajets avec UNE correspondance (optimisé SQL)
   * Utilise une requête SQL unique au lieu de boucles
   * Supporte les StopArea en recherchant aussi les StopPoints enfants
   */
  async findJourneyWithOneTransfer(
    fromStopId: string,
    toStopId: string,
    departureTime: string,
    maxWaitMinutes: number = 120,
    limit: number = 10
  ): Promise<JourneyWithTransfer[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Requête SQL optimisée pour trouver les trajets avec 1 correspondance
    // Inclut la recherche dans les StopPoints enfants
    const query = `
      SELECT
        -- Premier trajet
        leg1.trip_id as trip1_id,
        leg1.from_stop_id as from_stop_id,
        leg1.from_stop_name as from_stop_name,
        leg1.from_lat,
        leg1.from_lon,
        leg1.departure_time,
        leg1.to_stop_id as transfer_stop_id,
        leg1.to_stop_name as transfer_stop_name,
        leg1.to_lat as transfer_lat,
        leg1.to_lon as transfer_lon,
        leg1.arrival_time as transfer_arrival,
        leg1.route_short_name as route1_short_name,
        leg1.route_long_name as route1_long_name,
        leg1.service_id as service1_id,
        leg1.trip_headsign as trip1_headsign,
        leg1.nb_stops as nb_stops_leg1,

        -- Deuxième trajet
        leg2.trip_id as trip2_id,
        leg2.departure_time as transfer_departure,
        leg2.to_stop_id as to_stop_id,
        leg2.to_stop_name as to_stop_name,
        leg2.to_lat,
        leg2.to_lon,
        leg2.arrival_time,
        leg2.route_short_name as route2_short_name,
        leg2.route_long_name as route2_long_name,
        leg2.service_id as service2_id,
        leg2.trip_headsign as trip2_headsign,
        leg2.nb_stops as nb_stops_leg2,

        -- Calculs
        (CAST(substr(leg2.departure_time, 1, 2) AS INTEGER) * 60 +
         CAST(substr(leg2.departure_time, 4, 2) AS INTEGER)) -
        (CAST(substr(leg1.arrival_time, 1, 2) AS INTEGER) * 60 +
         CAST(substr(leg1.arrival_time, 4, 2) AS INTEGER)) as transfer_time_minutes,

        (CAST(substr(leg2.arrival_time, 1, 2) AS INTEGER) * 60 +
         CAST(substr(leg2.arrival_time, 4, 2) AS INTEGER)) -
        (CAST(substr(leg1.departure_time, 1, 2) AS INTEGER) * 60 +
         CAST(substr(leg1.departure_time, 4, 2) AS INTEGER)) as total_duration_minutes

      FROM direct_connections leg1
      LEFT JOIN stops from_stops ON leg1.from_stop_id = from_stops.stop_id
      JOIN direct_connections leg2
        ON leg1.to_stop_id = leg2.from_stop_id
        AND leg1.trip_id != leg2.trip_id
        AND leg2.departure_time > leg1.arrival_time
      LEFT JOIN stops to_stops ON leg2.to_stop_id = to_stops.stop_id

      WHERE (leg1.from_stop_id = ? OR from_stops.parent_station = ?)
        AND (leg2.to_stop_id = ? OR to_stops.parent_station = ?)
        AND leg1.departure_time >= ?
        AND transfer_time_minutes >= 5
        AND transfer_time_minutes <= ?

      ORDER BY total_duration_minutes, transfer_time_minutes
      LIMIT ?;
    `;

    const results = await this.db.getAllAsync<any>(
      query,
      [fromStopId, fromStopId, toStopId, toStopId, departureTime, maxWaitMinutes, limit]
    );

    // Transformer les résultats en JourneyWithTransfer
    return results.map(row => ({
      legs: [
        {
          trip_id: row.trip1_id,
          from_stop_id: row.from_stop_id,
          from_stop_name: row.from_stop_name,
          from_lat: row.from_lat,
          from_lon: row.from_lon,
          departure_time: row.departure_time,
          to_stop_id: row.transfer_stop_id,
          to_stop_name: row.transfer_stop_name,
          to_lat: row.transfer_lat,
          to_lon: row.transfer_lon,
          arrival_time: row.transfer_arrival,
          route_short_name: row.route1_short_name,
          route_long_name: row.route1_long_name,
          service_id: row.service1_id,
          trip_headsign: row.trip1_headsign,
          nb_stops: row.nb_stops_leg1
        },
        {
          trip_id: row.trip2_id,
          from_stop_id: row.transfer_stop_id,
          from_stop_name: row.transfer_stop_name,
          from_lat: row.transfer_lat,
          from_lon: row.transfer_lon,
          departure_time: row.transfer_departure,
          to_stop_id: row.to_stop_id,
          to_stop_name: row.to_stop_name,
          to_lat: row.to_lat,
          to_lon: row.to_lon,
          arrival_time: row.arrival_time,
          route_short_name: row.route2_short_name,
          route_long_name: row.route2_long_name,
          service_id: row.service2_id,
          trip_headsign: row.trip2_headsign,
          nb_stops: row.nb_stops_leg2
        }
      ],
      totalDuration: row.total_duration_minutes,
      transferTime: row.transfer_time_minutes,
      transferStation: row.transfer_stop_name
    }));
  }

  /**
   * 🔄 NOUVEAU: Recherche de trajets avec DEUX correspondances (optimisé SQL)
   * Supporte les StopArea en recherchant aussi les StopPoints enfants
   */
  async findJourneyWithTwoTransfers(
    fromStopId: string,
    toStopId: string,
    departureTime: string,
    maxWaitMinutes: number = 120,
    limit: number = 5
  ): Promise<JourneyWithTransfer[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Requête pour 2 correspondances - peut être lente !
    // Inclut la recherche dans les StopPoints enfants
    const query = `
      SELECT
        -- Premier trajet
        leg1.trip_id as trip1_id,
        leg1.from_stop_id, leg1.from_stop_name, leg1.from_lat, leg1.from_lon,
        leg1.departure_time,
        leg1.to_stop_id as transfer1_stop_id,
        leg1.to_stop_name as transfer1_stop_name,
        leg1.arrival_time as transfer1_arrival,
        leg1.route_short_name as route1_short_name,
        leg1.service_id as service1_id,
        leg1.nb_stops as nb_stops_leg1,

        -- Deuxième trajet
        leg2.trip_id as trip2_id,
        leg2.departure_time as transfer1_departure,
        leg2.to_stop_id as transfer2_stop_id,
        leg2.to_stop_name as transfer2_stop_name,
        leg2.arrival_time as transfer2_arrival,
        leg2.route_short_name as route2_short_name,
        leg2.service_id as service2_id,
        leg2.nb_stops as nb_stops_leg2,

        -- Troisième trajet
        leg3.trip_id as trip3_id,
        leg3.departure_time as transfer2_departure,
        leg3.to_stop_id, leg3.to_stop_name, leg3.to_lat, leg3.to_lon,
        leg3.arrival_time,
        leg3.route_short_name as route3_short_name,
        leg3.service_id as service3_id,
        leg3.nb_stops as nb_stops_leg3,

        -- Durée totale
        (CAST(substr(leg3.arrival_time, 1, 2) AS INTEGER) * 60 +
         CAST(substr(leg3.arrival_time, 4, 2) AS INTEGER)) -
        (CAST(substr(leg1.departure_time, 1, 2) AS INTEGER) * 60 +
         CAST(substr(leg1.departure_time, 4, 2) AS INTEGER)) as total_duration_minutes

      FROM direct_connections leg1
      LEFT JOIN stops from_stops ON leg1.from_stop_id = from_stops.stop_id
      JOIN direct_connections leg2
        ON leg1.to_stop_id = leg2.from_stop_id
        AND leg1.trip_id != leg2.trip_id
        AND leg2.departure_time > leg1.arrival_time
      JOIN direct_connections leg3
        ON leg2.to_stop_id = leg3.from_stop_id
        AND leg2.trip_id != leg3.trip_id
        AND leg3.departure_time > leg2.arrival_time
      LEFT JOIN stops to_stops ON leg3.to_stop_id = to_stops.stop_id

      WHERE (leg1.from_stop_id = ? OR from_stops.parent_station = ?)
        AND (leg3.to_stop_id = ? OR to_stops.parent_station = ?)
        AND leg1.departure_time >= ?
        AND total_duration_minutes <= 480  -- Maximum 8h de trajet

      ORDER BY total_duration_minutes
      LIMIT ?;
    `;

    const results = await this.db.getAllAsync<any>(
      query,
      [fromStopId, fromStopId, toStopId, toStopId, departureTime, limit]
    );

    return results.map(row => ({
      legs: [
        {
          trip_id: row.trip1_id,
          from_stop_id: row.from_stop_id,
          from_stop_name: row.from_stop_name,
          from_lat: row.from_lat,
          from_lon: row.from_lon,
          departure_time: row.departure_time,
          to_stop_id: row.transfer1_stop_id,
          to_stop_name: row.transfer1_stop_name,
          to_lat: 0, to_lon: 0,
          arrival_time: row.transfer1_arrival,
          route_short_name: row.route1_short_name,
          route_long_name: '',
          service_id: row.service1_id,
          trip_headsign: '',
          nb_stops: row.nb_stops_leg1
        },
        {
          trip_id: row.trip2_id,
          from_stop_id: row.transfer1_stop_id,
          from_stop_name: row.transfer1_stop_name,
          from_lat: 0, from_lon: 0,
          departure_time: row.transfer1_departure,
          to_stop_id: row.transfer2_stop_id,
          to_stop_name: row.transfer2_stop_name,
          to_lat: 0, to_lon: 0,
          arrival_time: row.transfer2_arrival,
          route_short_name: row.route2_short_name,
          route_long_name: '',
          service_id: row.service2_id,
          trip_headsign: '',
          nb_stops: row.nb_stops_leg2
        },
        {
          trip_id: row.trip3_id,
          from_stop_id: row.transfer2_stop_id,
          from_stop_name: row.transfer2_stop_name,
          from_lat: 0, from_lon: 0,
          departure_time: row.transfer2_departure,
          to_stop_id: row.to_stop_id,
          to_stop_name: row.to_stop_name,
          to_lat: row.to_lat,
          to_lon: row.to_lon,
          arrival_time: row.arrival_time,
          route_short_name: row.route3_short_name,
          route_long_name: '',
          service_id: row.service3_id,
          trip_headsign: '',
          nb_stops: row.nb_stops_leg3
        }
      ],
      totalDuration: row.total_duration_minutes,
      transferStation: `${row.transfer1_stop_name}, ${row.transfer2_stop_name}`
    }));
  }

  /**
   * 🔄 AMÉLIORATION: Recherche complète de trajets (direct + correspondances)
   */
  async findAllJourneys(
    fromStopId: string,
    toStopId: string,
    departureTime: string,
    maxTransfers: number = 2
  ): Promise<JourneyWithTransfer[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const allJourneys: JourneyWithTransfer[] = [];

    // 1. Connexions directes
    console.log('Recherche de connexions directes...');
    const directConnections = await this.findDirectConnections(
      fromStopId,
      toStopId,
      departureTime,
      undefined,
      10
    );

    allJourneys.push(...directConnections.map(conn => ({
      legs: [conn],
      totalDuration: this.calculateDuration(conn.departure_time, conn.arrival_time),
      transferTime: 0
    })));

    // 2. Avec 1 correspondance
    if (maxTransfers >= 1) {
      console.log('Recherche avec 1 correspondance...');
      const oneTransfer = await this.findJourneyWithOneTransfer(
        fromStopId,
        toStopId,
        departureTime,
        120,
        10
      );
      allJourneys.push(...oneTransfer);
    }

    // 3. Avec 2 correspondances (seulement si pas assez de résultats)
    if (maxTransfers >= 2 && allJourneys.length < 5) {
      console.log('Recherche avec 2 correspondances...');
      const twoTransfers = await this.findJourneyWithTwoTransfers(
        fromStopId,
        toStopId,
        departureTime,
        120,
        5
      );
      allJourneys.push(...twoTransfers);
    }

    // Trier par durée totale
    allJourneys.sort((a, b) => a.totalDuration - b.totalDuration);

    return allJourneys.slice(0, 15); // Limiter à 15 résultats
  }

  /**
   * Calcule la durée entre deux horaires (en minutes)
   */
  private calculateDuration(startTime: string, endTime: string): number {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    return end - start;
  }

  /**
   * Convertit un temps HH:MM:SS en minutes
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Vérifie si un service circule à une date donnée
   * Utilise uniquement calendar_dates (pas de table calendar dans notre DB)
   */
  async isServiceActiveOnDate(serviceId: string, date: Date): Promise<boolean> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

    // Vérifier dans calendar_dates
    const calendarDate = await this.db.getFirstAsync<{ exception_type: number }>(
      `SELECT exception_type FROM calendar_dates
       WHERE service_id = ? AND date = ?`,
      [serviceId, dateStr]
    );

    if (calendarDate) {
      // exception_type: 1 = service ajouté, 2 = service supprimé
      return calendarDate.exception_type === 1;
    }

    // Si pas d'entrée dans calendar_dates, on suppose que le service ne circule pas
    // (approche conservatrice)
    return false;
  }

  /**
   * Filtre les trajets par date
   */
  async filterJourneysByDate(
    journeys: JourneyWithTransfer[],
    date: Date
  ): Promise<JourneyWithTransfer[]> {
    const filtered: JourneyWithTransfer[] = [];

    for (const journey of journeys) {
      let isValid = true;

      for (const leg of journey.legs) {
        const isActive = await this.isServiceActiveOnDate(leg.service_id, date);
        if (!isActive) {
          isValid = false;
          break;
        }
      }

      if (isValid) {
        filtered.push(journey);
      }
    }

    return filtered;
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
export const gtfsDbEnhanced = new GTFSDatabaseServiceEnhanced();
