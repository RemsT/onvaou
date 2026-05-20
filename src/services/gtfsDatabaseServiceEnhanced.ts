/**
 * Service AMÉLIORÉ pour interroger la base de données GTFS SQLite
 * Optimisé pour la recherche de trajets avec CORRESPONDANCES
 *
 * Utilise les vues SQL transfer_opportunities pour des performances maximales
 */

import * as SQLite from 'expo-sqlite';
// Utiliser l'API legacy d'Expo FileSystem (compatible avec SDK 54+)
import * as FileSystem from 'expo-file-system/legacy';

// Mode debug activé uniquement en développement
const DEBUG_MODE = __DEV__;
const debugLog = (...args: any[]) => {
  if (DEBUG_MODE) console.log(...args);
};
const errorLog = console.error;

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
  transferLat?: number;
  transferLon?: number;
  departureTime?: string;
  transferArrival?: string;
  transferDeparture?: string;
  arrivalTime?: string;
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
  private initializationPromise: Promise<void> | null = null;

  /**
   * Ferme la connexion à la base de données
   */
  async close(): Promise<void> {
    if (this.db) {
      try {
        await this.db.closeAsync();
        debugLog('✅ Connexion GTFS fermée');
      } catch (error) {
        errorLog('Erreur lors de la fermeture de la connexion GTFS:', error);
      }
      this.db = null;
      this.initialized = false;
      this.initializationPromise = null;
    }
  }

  /**
   * Initialise la connexion à la base de données
   * Note: La base de données est créée automatiquement par gtfsInitializationService
   * au premier lancement de l'application
   */
  async initialize(): Promise<void> {
    // Si déjà initialisé, retourner immédiatement
    if (this.initialized && this.db) {
      return;
    }

    // Si une initialisation est en cours, attendre qu'elle se termine
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Créer une nouvelle promesse d'initialisation
    this.initializationPromise = this._performInitialization();
    return this.initializationPromise;
  }

  /**
   * Effectue l'initialisation réelle avec retry logic (méthode privée)
   */
  private async _performInitialization(): Promise<void> {
    const MAX_RETRIES = 5;
    const BASE_DELAY_MS = 500; // Délai de base de 500ms

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        debugLog(`[GTFSDatabaseServiceEnhanced] Tentative d'ouverture ${attempt}/${MAX_RETRIES}...`);

        const dbPath = `${FileSystem.documentDirectory}SQLite/gtfs.db`;

        // Vérifier que la base de données existe
        const dbInfo = await FileSystem.getInfoAsync(dbPath);
        if (!dbInfo.exists) {
          throw new Error(
            'Base de données GTFS non trouvée. Elle sera créée automatiquement au prochain lancement de l\'application.'
          );
        }

        // Ouvrir la base de données existante avec connexion partagée
        // useNewConnection: false permet de réutiliser la connexion existante si disponible
        this.db = await SQLite.openDatabaseAsync('gtfs.db', {
          useNewConnection: false,
        });
        this.initialized = true;
        debugLog('✅ Base de données GTFS initialisée (connexion partagée)');

      // Vérifier que la vue direct_connections existe et contient des données
      const viewExists = await this.db.getAllAsync<any>(
        `SELECT name FROM sqlite_master WHERE type='view' AND name='direct_connections'`
      );

      if (viewExists.length === 0) {
        errorLog('❌ PROBLÈME: La vue direct_connections n\'existe pas !');
        debugLog('🔧 Création automatique de la vue direct_connections...');

        // Créer la vue automatiquement
        await this.createDirectConnectionsView();

        debugLog('✅ Vue direct_connections créée avec succès');
      }

      // Vérifier le contenu de la vue (que ce soit une vue existante ou nouvellement créée)
      const count = await this.db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM direct_connections LIMIT 1`
      );

      debugLog(`📊 Nombre de connexions dans direct_connections: ${count?.count || 0}`);

      if (count && count.count > 0) {
        // Afficher un exemple de connexion
        const example = await this.db.getFirstAsync<any>(
          `SELECT from_stop_id, to_stop_id, departure_time FROM direct_connections LIMIT 1`
        );
        debugLog(`📌 Exemple de connexion: ${example?.from_stop_id} -> ${example?.to_stop_id} à ${example?.departure_time}`);

        // Afficher les types de trains dans la base
        const routeTypes = await this.db.getAllAsync<any>(
          `SELECT route_short_name, COUNT(*) as count
           FROM routes
           GROUP BY route_short_name
           ORDER BY count DESC
           LIMIT 10`
        );
        debugLog(`🚂 Types de trains dans la base GTFS:`);
        routeTypes.forEach(rt => {
          debugLog(`   ${rt.route_short_name || 'N/A'}: ${rt.count} routes`);
        });
      } else {
        errorLog('❌ PROBLÈME: La vue direct_connections est VIDE !');
        errorLog('💡 Les tables sous-jacentes (stop_times, trips, routes, stops) sont probablement vides');
        errorLog('💡 Solution: Réinitialiser la base de données GTFS complètement');
      }

      // Initialisation réussie, sortir de la boucle de retry
      debugLog(`✅ Initialisation réussie à la tentative ${attempt}`);
      return;

    } catch (error: any) {
      // Si c'est une erreur de database locked et qu'il reste des tentatives
      const isDatabaseLockedError = error?.message?.includes('database is locked') ||
                                     error?.message?.includes('database locked');

      if (isDatabaseLockedError && attempt < MAX_RETRIES) {
        // Calculer le délai avec backoff exponentiel (500ms, 1000ms, 2000ms, 4000ms, 8000ms)
        const delayMs = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        errorLog(`⚠️ Base de données verrouillée (tentative ${attempt}/${MAX_RETRIES}), nouvelle tentative dans ${delayMs}ms...`);

        // Fermer la connexion potentiellement bloquée
        if (this.db) {
          try {
            await this.db.closeAsync();
          } catch (closeError) {
            // Ignorer les erreurs de fermeture
          }
          this.db = null;
          this.initialized = false;
        }

        // Attendre avant de réessayer
        await new Promise(resolve => setTimeout(resolve, delayMs));

        // Continue la boucle pour réessayer
        continue;
      }

      // Si c'est la dernière tentative ou une autre erreur, propager l'erreur
      errorLog('❌ Erreur lors de l\'initialisation de la DB GTFS:', error);
      this.initialized = false;
      this.db = null;
      throw error;
    }
  }

  // Si on arrive ici, toutes les tentatives ont échoué
  throw new Error('Impossible d\'ouvrir la base de données après plusieurs tentatives');
}

  /**
   * Crée la vue direct_connections si elle n'existe pas
   */
  private async createDirectConnectionsView(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    await this.db.execAsync(`
      CREATE VIEW IF NOT EXISTS direct_connections AS
      SELECT
        st1.trip_id,
        st1.stop_id as from_stop_id,
        s1.stop_name as from_stop_name,
        s1.stop_lat as from_lat,
        s1.stop_lon as from_lon,
        st1.departure_time,
        st1.arrival_time as from_arrival_time,
        st2.stop_id as to_stop_id,
        s2.stop_name as to_stop_name,
        s2.stop_lat as to_lat,
        s2.stop_lon as to_lon,
        st2.arrival_time,
        st2.departure_time as to_departure_time,
        st2.stop_sequence - st1.stop_sequence as nb_stops,
        r.route_short_name,
        r.route_long_name,
        t.service_id,
        t.trip_headsign
      FROM stop_times st1
      JOIN stop_times st2 ON st1.trip_id = st2.trip_id
        AND st2.stop_sequence > st1.stop_sequence
      JOIN stops s1 ON st1.stop_id = s1.stop_id
      JOIN stops s2 ON st2.stop_id = s2.stop_id
      JOIN trips t ON st1.trip_id = t.trip_id
      JOIN routes r ON t.route_id = r.route_id;
    `);

    // Créer les index critiques pour optimiser les requêtes de recherche
    await this.createOptimizationIndexes();
  }

  /**
   * Crée les index d'optimisation pour accélérer les recherches
   */
  private async createOptimizationIndexes(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    debugLog('🚀 Création des index d\'optimisation...');

    // Index pour les recherches sur stops avec parent_station
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_stops_parent_lookup ON stops(stop_id, parent_station);
    `);

    // Index pour améliorer les jointures dans findAllDestinationsWithOneTransfer
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_stop_times_trip_seq ON stop_times(trip_id, stop_sequence);
    `);

    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_stop_times_stop_dep_time ON stop_times(stop_id, departure_time);
    `);

    debugLog('✅ Index d\'optimisation créés');
  }

  /**
   * Cherche un stop_id utilisé dans stop_times qui contient le numéro SNCF
   * Fallback quand le format stop_id a changé dans un nouveau fichier GTFS
   */
  async findStopInTrips(sncfNumber: string): Promise<string | null> {
    if (!this.db) return null;
    try {
      const row = await this.db.getFirstAsync<{ stop_id: string }>(
        `SELECT DISTINCT st.stop_id
         FROM stop_times st
         JOIN stops s ON st.stop_id = s.stop_id
         WHERE st.stop_id LIKE ? OR s.stop_id LIKE ?
         ORDER BY
           CASE WHEN st.stop_id LIKE 'StopArea%' THEN 1 ELSE 2 END
         LIMIT 1`,
        [`%${sncfNumber}%`, `%${sncfNumber}%`]
      );
      return row?.stop_id ?? null;
    } catch {
      return null;
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
      errorLog('❌ La vue direct_connections n\'existe pas !');
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
   * Résout tous les stop_id utilisables dans stop_times pour une gare donnée.
   * Un fromStopId peut être un StopArea (jamais dans stop_times) ou un StopPoint.
   * On retourne : le StopArea lui-même + tous ses StopPoints enfants + le fromStopId tel quel.
   * Cela permet d'utiliser un WHERE IN (...) efficace sur la vue direct_connections.
   */
  private async resolveStopIds(fromStopId: string): Promise<string[]> {
    if (!this.db) return [fromStopId];

    const rows = await this.db.getAllAsync<{ stop_id: string }>(
      `SELECT stop_id FROM stops WHERE stop_id = ? OR parent_station = ?`,
      [fromStopId, fromStopId]
    );

    const ids = rows.map(r => r.stop_id);
    // Toujours inclure l'ID original au cas où il n'est pas dans la table stops
    if (!ids.includes(fromStopId)) ids.push(fromStopId);

    debugLog(`[resolveStopIds] ${fromStopId} → ${ids.length} stop IDs: ${ids.slice(0, 5).join(', ')}${ids.length > 5 ? '…' : ''}`);
    return ids;
  }

  /**
   * 🚀 OPTIMISÉ: Trouve TOUTES les destinations accessibles depuis une gare en UNE SEULE requête SQL
   * Utilise resolveStopIds pour éviter le LEFT JOIN + OR coûteux sur la vue direct_connections.
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

    const stopIds = await this.resolveStopIds(fromStopId);
    const ph = stopIds.map(() => '?').join(',');

    // ROW_NUMBER() pour garder UN seul trajet par destination (le premier départ)
    // évite le problème de LIMIT atteint à cause des doublons (même OD, trains différents)
    let innerWhere = `from_stop_id IN (${ph})`;
    const params: any[] = [...stopIds];

    if (departureTimeMin) {
      innerWhere += ` AND departure_time >= ?`;
      params.push(departureTimeMin);
    }
    if (departureTimeMax) {
      innerWhere += ` AND departure_time <= ?`;
      params.push(departureTimeMax);
    }

    const query = `
      WITH best_per_dest AS (
        SELECT *,
          ROW_NUMBER() OVER (PARTITION BY to_stop_id ORDER BY departure_time) as rn
        FROM direct_connections
        WHERE ${innerWhere}
      )
      SELECT trip_id, from_stop_id, from_stop_name, from_lat, from_lon,
             departure_time, to_stop_id, to_stop_name, to_lat, to_lon,
             arrival_time, to_departure_time, nb_stops, route_short_name,
             route_long_name, service_id, trip_headsign
      FROM best_per_dest
      WHERE rn = 1
      ORDER BY to_stop_id
      LIMIT ?
    `;
    params.push(limit);

    debugLog(`[findAllDestinationsFrom] 🚀 Recherche BULK (1 trajet/destination) depuis ${stopIds.length} stop IDs (${fromStopId})`);
    const result = await this.db.getAllAsync<Connection>(query, params);
    debugLog(`[findAllDestinationsFrom] ✅ ${result.length} destinations uniques trouvées`);

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
    limit: number = 500,
    maxTotalDuration?: number
  ): Promise<Map<string, JourneyWithTransfer>> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    debugLog(`[findAllDestinationsWithOneTransfer] 🔄 Recherche BULK avec 1 correspondance depuis ${fromStopId}`);

    const stopIds = await this.resolveStopIds(fromStopId);
    const ph = stopIds.map(() => '?').join(',');

    // ROW_NUMBER() pour garder le MEILLEUR trajet par destination (durée minimale)
    const query = `
      WITH raw_transfers AS (
        SELECT
          leg2.to_stop_id as destination_id,
          leg2.to_stop_name as destination_name,
          leg1.departure_time,
          leg1.arrival_time as transfer_arrival,
          leg1.route_short_name as route1,
          leg1.to_stop_name as transfer_station,
          leg1.to_lat as transfer_lat,
          leg1.to_lon as transfer_lon,
          leg2.departure_time as transfer_departure,
          leg2.arrival_time,
          leg2.route_short_name as route2,

          (CAST(substr(leg2.departure_time, 1, 2) AS INTEGER) * 60 +
           CAST(substr(leg2.departure_time, 4, 2) AS INTEGER)) -
          (CAST(substr(leg1.arrival_time, 1, 2) AS INTEGER) * 60 +
           CAST(substr(leg1.arrival_time, 4, 2) AS INTEGER)) as transfer_wait_minutes,

          (CAST(substr(leg2.arrival_time, 1, 2) AS INTEGER) * 60 +
           CAST(substr(leg2.arrival_time, 4, 2) AS INTEGER)) -
          (CAST(substr(leg1.departure_time, 1, 2) AS INTEGER) * 60 +
           CAST(substr(leg1.departure_time, 4, 2) AS INTEGER)) as total_duration_minutes

        FROM direct_connections leg1
        JOIN direct_connections leg2
          ON leg1.to_stop_id = leg2.from_stop_id
          AND leg1.trip_id != leg2.trip_id
          AND leg2.departure_time > leg1.arrival_time

        WHERE leg1.from_stop_id IN (${ph})
          ${departureTimeMin ? 'AND leg1.departure_time >= ?' : ''}
          ${departureTimeMax ? 'AND leg1.departure_time <= ?' : ''}
      ),
      filtered AS (
        SELECT *,
          ROW_NUMBER() OVER (PARTITION BY destination_id ORDER BY total_duration_minutes) as rn
        FROM raw_transfers
        WHERE transfer_wait_minutes >= 5
          AND transfer_wait_minutes <= ?
          ${maxTotalDuration ? 'AND total_duration_minutes <= ?' : ''}
      )
      SELECT destination_id, destination_name, departure_time, transfer_arrival,
             route1, transfer_station, transfer_lat, transfer_lon,
             transfer_departure, arrival_time, route2,
             transfer_wait_minutes, total_duration_minutes
      FROM filtered
      WHERE rn = 1
      ORDER BY destination_id
      LIMIT ?;
    `;

    const params: any[] = [...stopIds];
    if (departureTimeMin) params.push(departureTimeMin);
    if (departureTimeMax) params.push(departureTimeMax);
    params.push(maxWaitMinutes);
    if (maxTotalDuration) params.push(maxTotalDuration);
    params.push(limit);

    debugLog(`[findAllDestinationsWithOneTransfer] 📝 Paramètres: fromStopId=${fromStopId}, timeMin=${departureTimeMin}, timeMax=${departureTimeMax}, maxWait=${maxWaitMinutes}, maxTotalDuration=${maxTotalDuration || 'N/A'}, limit=${limit}`);

    // DEBUG: Vérifier si la vue direct_connections existe et contient des données
    try {
      const countResult = await this.db.getAllAsync<any>('SELECT COUNT(*) as count FROM direct_connections LIMIT 1');
      debugLog(`[findAllDestinationsWithOneTransfer] 📊 Nombre de lignes dans direct_connections: ${countResult[0]?.count || 0}`);
    } catch (error) {
      errorLog(`[findAllDestinationsWithOneTransfer] ❌ Erreur en vérifiant direct_connections:`, error);
    }

    const results = await this.db.getAllAsync<any>(query, params);
    debugLog(`[findAllDestinationsWithOneTransfer] ✅ ${results.length} trajets avec correspondance trouvés`);

    // DEBUG: Afficher quelques exemples si trouvés
    if (results.length > 0) {
      debugLog(`[findAllDestinationsWithOneTransfer] 🔍 Exemples:`, results.slice(0, 3).map(r => `${r.destination_name} via ${r.transfer_station}`));
    }

    // DEBUG: Vérifier si Annecy est dans les résultats
    const annecyResults = results.filter(r => r.destination_name && r.destination_name.toLowerCase().includes('annecy'));
    if (annecyResults.length > 0) {
      debugLog(`[findAllDestinationsWithOneTransfer] 🎯 Annecy trouvé: ${annecyResults.length} trajets`);
      annecyResults.forEach(r => {
        debugLog(`   → ${r.destination_name} via ${r.transfer_station}, durée: ${r.total_duration_minutes}min`);
      });
    } else {
      debugLog(`[findAllDestinationsWithOneTransfer] ⚠️ Annecy NOT FOUND dans les 2000 résultats SQL`);
    }

    // Regrouper par destination (garder seulement le meilleur par destination)
    const destinationMap = new Map<string, JourneyWithTransfer>();

    for (const row of results) {
      const destId = row.destination_id;

      // Si on a déjà une meilleure connexion pour cette destination, ignorer
      if (destinationMap.has(destId)) continue;

      // Créer le journey avec les horaires de correspondance
      destinationMap.set(destId, {
        legs: [], // On ne stocke pas les détails complets pour économiser la mémoire
        totalDuration: row.total_duration_minutes,
        transferTime: row.transfer_wait_minutes,
        transferStation: row.transfer_station,
        transferLat: row.transfer_lat,              // Coordonnées gare de correspondance
        transferLon: row.transfer_lon,              // Coordonnées gare de correspondance
        // Horaires détaillés pour affichage
        departureTime: row.departure_time,           // Heure départ 1er train
        transferArrival: row.transfer_arrival,       // Heure arrivée gare de correspondance
        transferDeparture: row.transfer_departure,   // Heure départ gare de correspondance
        arrivalTime: row.arrival_time                // Heure arrivée finale
      } as any);
    }

    debugLog(`[findAllDestinationsWithOneTransfer] 📍 ${destinationMap.size} destinations uniques`);
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
    debugLog('Recherche de connexions directes...');
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
      debugLog('Recherche avec 1 correspondance...');
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
      debugLog('Recherche avec 2 correspondances...');
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
}

// Export singleton
export const gtfsDbEnhanced = new GTFSDatabaseServiceEnhanced();
