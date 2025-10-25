import { Station, SearchResult, CityLabel } from '../types';
import { frenchStations } from '../data/frenchStations';
import { LocationService } from './locationService';
import { filterStationsByLabels, countLabelMatches } from '../data/stationLabels';
import { PriceEstimationService } from './priceEstimationService';
import { gtfsDbEnhanced } from './gtfsDatabaseServiceEnhanced';

// Mode debug activé uniquement en développement
const DEBUG_MODE = __DEV__;
const debugLog = (...args: any[]) => {
  if (DEBUG_MODE) console.log(...args);
};
const errorLog = console.error; // Les erreurs sont toujours affichées

// Type pour une connexion train (compatible avec l'ancien TrainConnection)
interface TrainConnection {
  from_station_id: string;
  to_station_id: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  route_name: string;
  route_type: 'TGV' | 'INTERCITES' | 'TER' | 'RER' | 'AUTRE';
  transfers?: number; // Nombre de correspondances (0 = direct, 1 = 1 changement, etc.)
  transferStation?: string; // Nom de la gare de correspondance
}

export class LocalSearchService {
  // Cache pour les stations GTFS (évite les recherches répétées)
  private static stationCache = new Map<string, Station | null>();

  /**
   * Convertit un sncf_id (court ou long) en format GTFS long
   * Ex: "87686006" -> "StopArea:OCE87686006"
   * Ex: "stop_area:OCE:SA:87723197" -> trouve le stop correspondant
   * Retourne null si la conversion échoue
   */
  private static async findGTFSStopId(sncfId: string): Promise<string | null> {
    try {
      debugLog(`[LocalSearchService] 🔎 Recherche GTFS pour: ${sncfId}`);

      // Extraire le numéro à 8 chiffres du sncf_id
      const match = sncfId.match(/\d{8}/);
      if (!match) {
        errorLog(`[LocalSearchService] ❌ Impossible d'extraire le numéro SNCF de: ${sncfId}`);
        return null;
      }

      const sncfNumber = match[0];
      debugLog(`[LocalSearchService] 🔢 Numéro SNCF extrait: ${sncfNumber}`);

      // Chercher dans la base de données GTFS
      await gtfsDbEnhanced.initialize();

      // Format GTFS attendu : StopArea:OCE87686006 ou StopPoint:OCE...-87686006
      // On cherche d'abord les StopArea (ce sont les gares principales)
      const stopAreaId = `StopArea:OCE${sncfNumber}`;
      debugLog(`[LocalSearchService] 🔍 Recherche de: ${stopAreaId}`);

      // Rechercher par nom exact d'abord
      const stopsByName = await gtfsDbEnhanced.searchStops(stopAreaId, 1);

      if (stopsByName.length > 0) {
        debugLog(`[LocalSearchService] ✅ Stop GTFS trouvé (exact): ${stopsByName[0].stop_id}`);
        return stopsByName[0].stop_id;
      }

      // Sinon rechercher avec juste le numéro
      debugLog(`[LocalSearchService] 🔍 Recherche alternative avec: ${sncfNumber}`);
      const stopsByNumber = await gtfsDbEnhanced.searchStops(sncfNumber, 10);

      debugLog(`[LocalSearchService] 📊 ${stopsByNumber.length} stops trouvés`);
      if (stopsByNumber.length > 0) {
        debugLog(`[LocalSearchService] 📝 Exemples: ${stopsByNumber.slice(0, 3).map(s => `${s.stop_id} (${s.stop_name})`).join(', ')}`);
      }

      if (stopsByNumber.length > 0) {
        // TOUJOURS prioriser les StopArea (gares principales)
        // Les connexions GTFS sont sur les StopArea, pas les StopPoint
        const stopArea = stopsByNumber.find(s => s.stop_id.startsWith('StopArea:'));

        if (stopArea) {
          debugLog(`[LocalSearchService] ✅ Stop GTFS trouvé (StopArea): ${stopArea.stop_id} (${stopArea.stop_name})`);
          return stopArea.stop_id;
        }

        // Si vraiment aucun StopArea, prendre le premier
        debugLog(`[LocalSearchService] ⚠️ Aucun StopArea trouvé, utilisation de: ${stopsByNumber[0].stop_id}`);
        return stopsByNumber[0].stop_id;
      }

      errorLog(`[LocalSearchService] ❌ Aucun stop GTFS trouvé pour le numéro: ${sncfNumber}`);
      debugLog(`[LocalSearchService] 🔍 Tentative de recherche par nom de gare (sncf_id peut être incorrect)...`);

      // FALLBACK: Chercher par nom de gare depuis frenchStations
      // Car le sncf_id dans frenchStations peut être différent du numéro dans GTFS
      const station = frenchStations.find(s => s.sncf_id === sncfNumber);
      if (station) {
        debugLog(`[LocalSearchService] 📍 Recherche par nom: "${station.name}"`);
        const stopsByStationName = await gtfsDbEnhanced.searchStops(station.name, 5);
        debugLog(`[LocalSearchService] 📊 ${stopsByStationName.length} stops trouvés par nom`);

        if (stopsByStationName.length > 0) {
          const stopArea = stopsByStationName.find(s => s.stop_id.startsWith('StopArea:'));
          if (stopArea) {
            debugLog(`[LocalSearchService] ✅ Stop trouvé par nom: ${stopArea.stop_id} (${stopArea.stop_name})`);
            return stopArea.stop_id;
          }
          debugLog(`[LocalSearchService] ✅ Stop trouvé par nom: ${stopsByStationName[0].stop_id}`);
          return stopsByStationName[0].stop_id;
        }
      }

      errorLog(`[LocalSearchService] ❌ Impossible de trouver cette gare dans GTFS`);
      return null;
    } catch (error) {
      errorLog('[LocalSearchService] ❌ ERREUR recherche GTFS stop:', error);
      return null;
    }
  }

  /**
   * Trouve une station par son stop_id GTFS (avec cache)
   * Si la station n'existe pas dans frenchStations, la crée depuis les données GTFS
   */
  private static async findStationByGTFSId(gtfsStopId: string): Promise<Station | null> {
    // Vérifier le cache d'abord
    if (this.stationCache.has(gtfsStopId)) {
      return this.stationCache.get(gtfsStopId)!;
    }

    // Extraire le numéro SNCF du format GTFS
    // Ex: "StopPoint:OCE87686006" -> "87686006"
    const match = gtfsStopId.match(/\d{8}/);
    if (!match) {
      this.stationCache.set(gtfsStopId, null);
      return null;
    }

    const sncfNumber = match[0];

    // D'abord, chercher dans frenchStations
    const existingStation = frenchStations.find(s => s.sncf_id === sncfNumber);
    if (existingStation) {
      this.stationCache.set(gtfsStopId, existingStation);
      return existingStation;
    }

    // Si pas trouvé, créer une station depuis la base de données GTFS
    try {
      await gtfsDbEnhanced.initialize();

      // Chercher le stop dans la DB
      const stops = await gtfsDbEnhanced.searchStops(sncfNumber, 1);

      if (stops.length === 0) {
        this.stationCache.set(gtfsStopId, null);
        return null;
      }

      const gtfsStop = stops[0];

      // Créer une nouvelle station à partir des données GTFS
      const newStation: Station = {
        id: 999999 + Math.floor(Math.random() * 100000), // ID temporaire unique
        name: gtfsStop.stop_name,
        sncf_id: sncfNumber,
        lat: gtfsStop.stop_lat,
        lon: gtfsStop.stop_lon,
      };

      this.stationCache.set(gtfsStopId, newStation);
      return newStation;
    } catch (error) {
      errorLog('[LocalSearchService] Erreur création station depuis GTFS:', error);
      this.stationCache.set(gtfsStopId, null);
      return null;
    }
  }

  /**
   * Extrait le nom de la ville depuis le nom de la gare
   * Ex: "Paris Gare du Nord" -> "Paris"
   * Ex: "Lyon Part-Dieu" -> "Lyon"
   * Ex: "Marseille Saint-Charles" -> "Marseille"
   */
  private static extractCityName(stationName: string): string {
    // Enlever les accents et mettre en minuscules pour la comparaison
    const normalized = stationName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // Liste des suffixes de gares à ignorer
    const suffixes = [
      'gare',
      'station',
      'tgv',
      'ville',
      'centre',
      'nord',
      'sud',
      'est',
      'ouest',
      'part-dieu',
      'perrache',
      'saint-charles',
      'montparnasse',
      'saint-lazare',
      'austerlitz',
      'bercy',
      'flandres',
      'europe',
      'rive droite',
      'rive gauche',
      'chantiers',
      'matabiau',
      'saint-roch',
      'saint-jean',
      'saint-laud',
      'chateaucreux',
      'viotte',
      'franche-comte',
      'montbeliard',
      'saint-gervais',
      'loché',
      'challes-les-eaux',
      'le revard',
      'chessy',
      'charles de gaulle',
      'saint-exupery',
      'valescure',
      'draguignan',
      'greoux-les-bains',
    ];

    // Séparer par espaces ou tirets
    const parts = normalized.split(/[\s-]+/);

    // Prendre le premier mot (généralement le nom de la ville)
    // Sauf si c'est un préfixe commun comme "saint", "sainte", etc.
    let cityName = parts[0];

    // Gérer les noms composés comme "Saint-Étienne", "Aix-en-Provence", etc.
    if (
      (cityName === 'saint' || cityName === 'sainte') &&
      parts.length > 1 &&
      !suffixes.includes(parts[1])
    ) {
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
   * Recherche les destinations accessibles depuis une gare
   */
  static async searchDestinations(
    fromStation: Station,
    mode: 'time' | 'budget' | 'both',
    maxTime?: number,
    maxBudget?: number,
    selectedLabels?: CityLabel[],
    timeRangeStart?: string,
    timeRangeEnd?: string,
    searchDate?: Date
  ): Promise<SearchResult[]> {
    debugLog('========================================');
    debugLog('[LocalSearchService] 🔍 RECHERCHE DÉMARRÉE');
    debugLog(`[LocalSearchService] Gare: ${fromStation.name}`);
    debugLog(`[LocalSearchService] SNCF ID: ${fromStation.sncf_id}`);
    debugLog(`[LocalSearchService] Mode: ${mode}`);
    debugLog(`[LocalSearchService] Max Time: ${maxTime}`);
    debugLog('========================================');

    // UTILISATION EXCLUSIVE DES DONNÉES GTFS
    if (!fromStation.sncf_id) {
      errorLog('[LocalSearchService] ❌ Pas de SNCF ID pour cette gare');
      return [];
    }

    debugLog('[LocalSearchService] ✓ SNCF ID présent, recherche GTFS...');

    try {
      const gtfsResults = await this.searchWithGTFS(
        fromStation,
        mode,
        maxTime,
        maxBudget,
        selectedLabels,
        timeRangeStart,
        timeRangeEnd,
        searchDate
      );

      debugLog('========================================');
      debugLog(`[LocalSearchService] ✅ RÉSULTAT GTFS : ${gtfsResults.length} destinations`);
      debugLog('[LocalSearchService] 🎯 DURÉES RÉELLES DEPUIS HORAIRES SNCF');
      debugLog('========================================');

      return gtfsResults;
    } catch (error) {
      errorLog('[LocalSearchService] ❌ ERREUR GTFS:', error);
      errorLog('[LocalSearchService] Impossible de récupérer les horaires');
      return [];
    }
  }

  /**
   * Recherche avec les vraies horaires GTFS
   */
  private static async searchWithGTFS(
    fromStation: Station,
    mode: 'time' | 'budget' | 'both',
    maxTime?: number,
    maxBudget?: number,
    selectedLabels?: CityLabel[],
    timeRangeStart?: string,
    timeRangeEnd?: string,
    searchDate?: Date
  ): Promise<SearchResult[]> {
    debugLog('[LocalSearchService] 🚂 Recherche avec horaires GTFS réels');
    debugLog(`[LocalSearchService] 📅 Filtres: maxTime=${maxTime}min, maxBudget=${maxBudget}€`);
    debugLog(`[LocalSearchService] ⏰ Plage horaire: ${timeRangeStart} - ${timeRangeEnd}`);

    if (!fromStation.sncf_id) {
      errorLog('[LocalSearchService] ❌ Pas de SNCF ID pour la gare de départ');
      return [];
    }

    try {
      // Initialiser la base de données GTFS si nécessaire
      await gtfsDbEnhanced.initialize();
      debugLog('[LocalSearchService] ✅ Base de données GTFS initialisée');

      // Convertir le SNCF ID en format GTFS
      const fromGTFSId = await this.findGTFSStopId(fromStation.sncf_id);
      if (!fromGTFSId) {
        errorLog('[LocalSearchService] ❌ Impossible de convertir SNCF ID en GTFS ID');
        return [];
      }

      debugLog(`[LocalSearchService] ✓ GTFS ID de départ: ${fromGTFSId}`);

      // Utiliser l'heure de début de plage ou l'heure actuelle
      const departureTime = timeRangeStart || new Date().toTimeString().slice(0, 8);
      debugLog(`[LocalSearchService] 🕐 Heure de départ: ${departureTime}`);

      // 🚀 RECHERCHE OPTIMISÉE BULK: Connexions directes + correspondances
      debugLog('[LocalSearchService] 🚀 Recherche BULK destinations (direct + correspondances)...');
      const searchStartTime = Date.now();

      // Map pour stocker la meilleure connexion par destination
      const bestConnectionByDestination = new Map<string, TrainConnection>();

      // 1️⃣ CONNEXIONS DIRECTES (sans changement)
      debugLog('[LocalSearchService] 📍 Étape 1/2: Connexions directes...');
      debugLog(`[LocalSearchService] 🔍 Recherche depuis: ${fromGTFSId}`);
      debugLog(`[LocalSearchService] 🕐 Plage horaire: ${departureTime} - ${timeRangeEnd}`);
      const step1Start = Date.now();
      const directConnections = await gtfsDbEnhanced.findAllDestinationsFrom(
        fromGTFSId,
        departureTime,
        timeRangeEnd,
        2000
      );
      const step1Time = Date.now() - step1Start;
      debugLog(`[LocalSearchService] ✅ ${directConnections.length} connexions directes (${step1Time}ms)`);

      if (directConnections.length === 0) {
        console.warn('[LocalSearchService] ⚠️ AUCUNE connexion directe trouvée! Vérifiez:');
        console.warn('  1. La base de données GTFS est-elle initialisée?');
        console.warn('  2. La vue direct_connections contient-elle des données?');
        console.warn('  3. Le stop_id de départ est-il correct?');
      }

      for (const conn of directConnections) {
        const durationMinutes = this.calculateDuration(conn.departure_time, conn.arrival_time);
        const existing = bestConnectionByDestination.get(conn.to_stop_id);

        if (!existing || durationMinutes < existing.duration_minutes) {
          bestConnectionByDestination.set(conn.to_stop_id, {
            from_station_id: fromGTFSId,
            to_station_id: conn.to_stop_id,
            departure_time: conn.departure_time.slice(0, 5),
            arrival_time: conn.arrival_time.slice(0, 5),
            duration_minutes: durationMinutes,
            route_name: conn.route_short_name || conn.route_long_name,
            route_type: this.detectRouteType(conn.route_short_name || conn.route_long_name),
            transfers: 0, // Direct = 0 correspondances
          });
        }
      }

      // 2️⃣ TRAJETS AVEC 1 CORRESPONDANCE - BULK OPTIMISÉ
      debugLog('[LocalSearchService] 🔄 Étape 2/2: Trajets avec 1 correspondance (BULK)...');
      const step2Start = Date.now();
      const oneTransferMap = await gtfsDbEnhanced.findAllDestinationsWithOneTransfer(
        fromGTFSId,
        departureTime,
        timeRangeEnd,
        120, // Max 2h d'attente entre les trains
        5000, // Limite augmentée à 5000 trajets pour trouver plus de destinations
        maxTime // Même limite de temps que pour les trajets directs
      );
      const step2Time = Date.now() - step2Start;
      debugLog(`[LocalSearchService] ✅ ${oneTransferMap.size} destinations avec 1 correspondance (${step2Time}ms)`);

      // Ajouter TOUTES les destinations avec 1 correspondance
      // Cela inclut les destinations sans trajet direct ET celles avec un trajet direct plus lent
      let transfersAdded = 0;
      let transfersReplaced = 0;
      let transfersSkipped = 0;

      for (const [destId, journey] of oneTransferMap.entries()) {
        const existing = bestConnectionByDestination.get(destId);

        // Toujours ajouter le trajet avec correspondance s'il n'existe pas
        // OU s'il est plus rapide que le trajet direct existant
        if (!existing) {
          // Pas de trajet direct vers cette destination, ajouter le trajet avec correspondance
          bestConnectionByDestination.set(destId, {
            from_station_id: fromGTFSId,
            to_station_id: destId,
            departure_time: journey.departureTime || '08:00',
            arrival_time: journey.arrivalTime || '10:00',
            duration_minutes: journey.totalDuration,
            route_name: '2 trains', // Indique qu'il y a 2 segments
            route_type: 'TER',
            transfers: 1, // 1 correspondance
            transferStation: journey.transferStation,
            transferLat: journey.transferLat,
            transferLon: journey.transferLon,
            // Horaires de correspondance
            transferArrival: journey.transferArrival,
            transferDeparture: journey.transferDeparture,
          });
          transfersAdded++;
        } else if (journey.totalDuration < existing.duration_minutes) {
          // Le trajet avec correspondance est plus rapide, remplacer
          bestConnectionByDestination.set(destId, {
            from_station_id: fromGTFSId,
            to_station_id: destId,
            departure_time: journey.departureTime || '08:00',
            arrival_time: journey.arrivalTime || '10:00',
            duration_minutes: journey.totalDuration,
            route_name: '2 trains',
            route_type: 'TER',
            transfers: 1,
            transferStation: journey.transferStation,
            transferLat: journey.transferLat,
            transferLon: journey.transferLon,
            // Horaires de correspondance
            transferArrival: journey.transferArrival,
            transferDeparture: journey.transferDeparture,
          });
          transfersReplaced++;
        } else {
          // Le trajet direct est plus rapide, on garde le trajet direct
          transfersSkipped++;
        }
      }

      debugLog(`[LocalSearchService] 📊 Correspondances: ${transfersAdded} ajoutées, ${transfersReplaced} remplacent un direct, ${transfersSkipped} ignorées (direct plus rapide)`);

      debugLog(`[LocalSearchService] 📊 ${bestConnectionByDestination.size} destinations uniques trouvées`);

      // DEBUG: Afficher quelques destinations trouvées
      const sampleDests = Array.from(bestConnectionByDestination.keys()).slice(0, 10);
      debugLog(`[LocalSearchService] 🔍 Exemples de destinations: ${sampleDests.map(d => d.slice(-8)).join(', ')}`);

      // Convertir la Map en array
      const connections: TrainConnection[] = Array.from(bestConnectionByDestination.values());

      // Créer une map pour regrouper les destinations par numéro SNCF
      // Stocke également les calculs de distance/prix pour éviter les recalculs
      const destinationsMap = new Map<string, {
        connection: TrainConnection;
        station: Station;
        distance: number;
        priceEstimate: { min: number; max: number; average: number };
        sncfNumber: string;
      }>();

      // 🚀 OPTIMISATION: Pré-charger TOUTES les stations en PARALLÈLE
      debugLog('[LocalSearchService] ⚡ Pré-chargement des stations en parallèle...');
      const step3Start = Date.now();
      const uniqueStopIds = [...new Set(connections.map(c => c.to_station_id))];
      debugLog(`[LocalSearchService] 📍 ${uniqueStopIds.length} stations uniques à charger`);

      // Charger toutes les stations en parallèle (beaucoup plus rapide)
      await Promise.all(
        uniqueStopIds.map(stopId => this.findStationByGTFSId(stopId))
      );
      const step3Time = Date.now() - step3Start;
      debugLog(`[LocalSearchService] ✅ Stations pré-chargées dans le cache (${step3Time}ms)`);

      // Compteurs de filtrage
      let filteredStationNotFound = 0;
      let filteredSameCity = 0;
      let filteredTimeRange = 0;
      let filteredDuration = 0;
      let filteredDurationWithTransfers = 0; // Nouveau compteur
      let filteredPrice = 0;

      // Pré-calculer le nom de ville de la gare de départ (pour éviter de le recalculer à chaque fois)
      const fromCityName = this.extractCityName(fromStation.name);

      // Traiter chaque connexion (maintenant ultra-rapide car tout est dans le cache)
      for (const conn of connections) {
        // DEBUG: Afficher les premières correspondances pour vérifier
        if (conn.transfers && conn.transfers > 0 && filteredDuration < 3) {
          debugLog(`[LocalSearchService] 🔍 DEBUG Correspondance: ${conn.to_station_id}, durée=${conn.duration_minutes}min, transfers=${conn.transfers}, station=${conn.transferStation}`);
        }

        // Récupérer la station depuis le cache (instantané)
        const toStation = this.stationCache.get(conn.to_station_id);
        if (!toStation) {
          filteredStationNotFound++;
          if (conn.transfers && conn.transfers > 0) {
            debugLog(`[LocalSearchService] ⚠️ Station non trouvée pour correspondance: ${conn.to_station_id}`);
          }
          continue;
        }

        // Extraire le numéro SNCF pour la clé de la map (une seule fois)
        const sncfMatch = conn.to_station_id.match(/\d{8}/);
        if (!sncfMatch) {
          filteredStationNotFound++;
          continue;
        }
        const toSncfNumber = sncfMatch[0];

        // Exclure la même ville (utilise le nom pré-calculé)
        const toCityName = this.extractCityName(toStation.name);
        if (fromCityName === toCityName) {
          filteredSameCity++;
          if (conn.transfers && conn.transfers > 0) {
            debugLog(`[LocalSearchService] ⚠️ Correspondance éliminée (même ville): ${fromStation.name} → ${toStation.name} via ${conn.transferStation}`);
          }
          continue;
        }

        // ===== FILTRES HORAIRES =====
        // Parser les heures de départ (format HH:MM)
        const departureTime = conn.departure_time; // Format: "HH:MM"

        // Appliquer le filtre de plage horaire sur l'heure de DÉPART
        if (timeRangeStart && timeRangeEnd) {
          const depMinutes = this.timeToMinutes(departureTime);
          const startMinutes = this.timeToMinutes(timeRangeStart);
          const endMinutes = this.timeToMinutes(timeRangeEnd);

          if (depMinutes < startMinutes || depMinutes > endMinutes) {
            filteredTimeRange++;
            continue; // Heure de départ hors de la plage
          }
        }

        // ===== FILTRE DE DURÉE =====
        // La durée inclut déjà le temps en train + temps d'attente pour les correspondances
        const durationMinutes = conn.duration_minutes;

        if (mode === 'time' && maxTime && durationMinutes > maxTime) {
          filteredDuration++;
          if (conn.transfers && conn.transfers > 0) {
            filteredDurationWithTransfers++;
          }
          continue;
        }
        if (mode === 'both' && maxTime && durationMinutes > maxTime) {
          filteredDuration++;
          if (conn.transfers && conn.transfers > 0) {
            filteredDurationWithTransfers++;
          }
          continue;
        }

        // ===== CALCUL DE DISTANCE ET PRIX (UNE SEULE FOIS) =====
        // Calculer la distance et le prix maintenant pour pouvoir les réutiliser
        const distance = LocationService.calculateDistance(
          fromStation.lat,
          fromStation.lon,
          toStation.lat,
          toStation.lon
        );
        const priceEstimate = PriceEstimationService.estimatePrice(distance, durationMinutes);

        // Utiliser priceRange.max pour le filtre budget (le prix max possible)
        if (mode === 'budget' && maxBudget && priceEstimate.max > maxBudget) {
          filteredPrice++;
          continue;
        }
        if (mode === 'both' && maxBudget && priceEstimate.max > maxBudget) {
          filteredPrice++;
          continue;
        }

        // Garder seulement la meilleure connexion par destination
        const existing = destinationsMap.get(toSncfNumber);
        if (!existing || durationMinutes < existing.connection.duration_minutes) {
          destinationsMap.set(toSncfNumber, {
            connection: conn,
            station: toStation,
            distance,
            priceEstimate,
            sncfNumber: toSncfNumber,
          });
        }
      }

      // Compter combien de destinations avec correspondances ont passé le filtrage
      const destinationsWithTransfers = Array.from(destinationsMap.values()).filter(
        dest => dest.connection.transfers && dest.connection.transfers > 0
      ).length;

      debugLog(`[LocalSearchService] 🎯 ${destinationsMap.size} destinations après filtrage (dont ${destinationsWithTransfers} avec correspondances)`);
      debugLog(`[LocalSearchService] ❌ ${connections.length - destinationsMap.size} destinations éliminées:`);
      debugLog(`  - Station non trouvée: ${filteredStationNotFound}`);
      debugLog(`  - Même ville: ${filteredSameCity}`);
      debugLog(`  - Hors plage horaire: ${filteredTimeRange}`);
      debugLog(`  - Durée trop longue: ${filteredDuration} (dont ${filteredDurationWithTransfers} avec correspondances)`);
      debugLog(`  - Prix trop élevé: ${filteredPrice}`);

      // Convertir en SearchResult[]
      // OPTIMISATION: Utilise les distances et prix déjà calculés (pas de recalcul)
      let results: SearchResult[] = Array.from(destinationsMap.values()).map(({ connection, station, distance, priceEstimate }) => {

        // Créer un datetime ISO complet pour departure/arrival
        const today = searchDate || new Date();
        const [depHour, depMin] = connection.departure_time.split(':').map(Number);
        const [arrHour, arrMin] = connection.arrival_time.split(':').map(Number);

        const departureDate = new Date(today);
        departureDate.setHours(depHour, depMin, 0, 0);

        const arrivalDate = new Date(today);
        arrivalDate.setHours(arrHour, arrMin, 0, 0);

        // Si arrivée < départ, c'est le lendemain
        if (arrivalDate < departureDate) {
          arrivalDate.setDate(arrivalDate.getDate() + 1);
        }

        return {
          id: station.id,
          search_id: 0,
          from_station: fromStation,
          to_station_id: station.id,
          to_station: station,
          duration: connection.duration_minutes,
          price: priceEstimate.average,
          priceRange: {
            min: priceEstimate.min,
            max: priceEstimate.max,
          },
          departure_time: departureDate.toISOString(),
          arrival_time: arrivalDate.toISOString(),
          route_name: connection.route_name,
          route_type: connection.route_type,
          transfers: connection.transfers, // Nombre de correspondances
          transferStation: connection.transferStation, // Gare de correspondance si applicable
          transferLat: connection.transferLat, // Latitude gare de correspondance
          transferLon: connection.transferLon, // Longitude gare de correspondance
          transferArrival: connection.transferArrival, // Heure d'arrivée à la gare de correspondance
          transferDeparture: connection.transferDeparture, // Heure de départ de la gare de correspondance
        };
      });

      // Grouper par ville et créer des destinations "Toutes les gares"
      const cityGroups = new Map<string, SearchResult[]>();

      results.forEach(result => {
        // Extraire le nom de la ville (avant le tiret ou premier mot)
        const stationName = result.to_station.name;
        let cityName = stationName.split(/[-\s]/)[0].trim();

        // Gérer les cas spéciaux
        if (cityName.toLowerCase() === 'saint' || cityName.toLowerCase() === 'sainte') {
          const parts = stationName.split(/[-\s]/);
          if (parts.length > 1) {
            cityName = `${parts[0]} ${parts[1]}`.trim();
          }
        }

        if (!cityGroups.has(cityName)) {
          cityGroups.set(cityName, []);
        }
        cityGroups.get(cityName)!.push(result);
      });

      // Ajouter des destinations "Toutes les gares" pour les villes avec plusieurs gares
      cityGroups.forEach((stations, cityName) => {
        if (stations.length > 1) {
          // Trouver la meilleure connexion (durée la plus courte)
          const bestConnection = stations.reduce((best, current) =>
            current.duration < best.duration ? current : best
          );

          // Créer une destination groupée
          // Le nom affiché sera "{Ville} - Toutes les gares" dans la liste
          // Mais on garde la référence à la vraie gare pour la page de détail
          const groupedDestination: SearchResult = {
            ...bestConnection,
            id: `${cityName}-all-stations`,
            to_station: {
              ...bestConnection.to_station,
              // On garde le nom de la vraie gare dans un champ personnalisé
              real_name: bestConnection.to_station.name,
              name: `${cityName} - Toutes les gares`,
            },
            to_station_id: `${cityName}-all-stations`,
          };

          results.push(groupedDestination);
        }
      });

      // Filtrer par labels si nécessaire
      if (selectedLabels && selectedLabels.length > 0) {
        const filteredIds = filterStationsByLabels(
          results.map(r => r.to_station_id),
          selectedLabels
        );
        results = results.filter(r => filteredIds.includes(r.to_station_id));

        // Trier par nombre de labels correspondants, puis par durée
        results.sort((a, b) => {
          const matchesA = countLabelMatches(a.to_station_id, selectedLabels);
          const matchesB = countLabelMatches(b.to_station_id, selectedLabels);
          if (matchesB !== matchesA) {
            return matchesB - matchesA;
          }
          return a.duration - b.duration;
        });
      } else {
        // Trier par durée croissante
        results.sort((a, b) => a.duration - b.duration);
      }

      const totalTime = Date.now() - searchStartTime;
      debugLog(`[LocalSearchService] ✅ ${results.length} destinations finales retournées`);
      debugLog(`[LocalSearchService] ⏱️ Temps total de recherche: ${totalTime}ms`);

      return results;
    } catch (error) {
      errorLog('[LocalSearchService] ❌ Erreur recherche GTFS:', error);
      return [];
    }
  }

  /**
   * Convertit un horaire HH:MM en minutes depuis minuit
   */
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Calcule la durée en minutes entre deux horaires
   */
  private static calculateDuration(startTime: string, endTime: string): number {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    // Si l'arrivée est avant le départ, c'est le lendemain
    if (end < start) {
      return (24 * 60 - start) + end;
    }

    return end - start;
  }

  /**
   * Détecte le type de route à partir du nom
   */
  private static detectRouteType(routeName: string): 'TGV' | 'INTERCITES' | 'TER' | 'RER' | 'AUTRE' {
    const upper = routeName.toUpperCase();

    if (upper.includes('TGV') || upper.includes('INOUI') || upper.includes('OUIGO')) {
      return 'TGV';
    }
    if (upper.includes('INTERCITES') || upper.includes('IC')) {
      return 'INTERCITES';
    }
    if (upper.includes('TER')) {
      return 'TER';
    }
    if (upper.includes('RER') || upper.includes('TRANSILIEN')) {
      return 'RER';
    }

    return 'AUTRE';
  }
}
