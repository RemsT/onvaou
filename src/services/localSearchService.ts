import { Station, SearchResult, CityLabel } from '../types';
import { frenchStations } from '../data/frenchStations';
import { LocationService } from './locationService';
import { filterStationsByLabels, countLabelMatches } from '../data/stationLabels';
import { PriceEstimationService } from './priceEstimationService';
import { gtfsDbEnhanced } from './gtfsDatabaseServiceEnhanced';

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
      console.log(`[LocalSearchService] 🔎 Recherche GTFS pour: ${sncfId}`);

      // Extraire le numéro à 8 chiffres du sncf_id
      const match = sncfId.match(/\d{8}/);
      if (!match) {
        console.error(`[LocalSearchService] ❌ Impossible d'extraire le numéro SNCF de: ${sncfId}`);
        return null;
      }

      const sncfNumber = match[0];
      console.log(`[LocalSearchService] 🔢 Numéro SNCF extrait: ${sncfNumber}`);

      // Chercher dans la base de données GTFS
      await gtfsDbEnhanced.initialize();

      // Format GTFS attendu : StopArea:OCE87686006 ou StopPoint:OCE...-87686006
      // On cherche d'abord les StopArea (ce sont les gares principales)
      const stopAreaId = `StopArea:OCE${sncfNumber}`;
      console.log(`[LocalSearchService] 🔍 Recherche de: ${stopAreaId}`);

      // Rechercher par nom exact d'abord
      const stopsByName = await gtfsDbEnhanced.searchStops(stopAreaId, 1);

      if (stopsByName.length > 0) {
        console.log(`[LocalSearchService] ✅ Stop GTFS trouvé (exact): ${stopsByName[0].stop_id}`);
        return stopsByName[0].stop_id;
      }

      // Sinon rechercher avec juste le numéro
      console.log(`[LocalSearchService] 🔍 Recherche alternative avec: ${sncfNumber}`);
      const stopsByNumber = await gtfsDbEnhanced.searchStops(sncfNumber, 10);

      console.log(`[LocalSearchService] 📊 ${stopsByNumber.length} stops trouvés`);
      if (stopsByNumber.length > 0) {
        console.log(`[LocalSearchService] 📝 Exemples: ${stopsByNumber.slice(0, 3).map(s => `${s.stop_id} (${s.stop_name})`).join(', ')}`);
      }

      if (stopsByNumber.length > 0) {
        // TOUJOURS prioriser les StopArea (gares principales)
        // Les connexions GTFS sont sur les StopArea, pas les StopPoint
        const stopArea = stopsByNumber.find(s => s.stop_id.startsWith('StopArea:'));

        if (stopArea) {
          console.log(`[LocalSearchService] ✅ Stop GTFS trouvé (StopArea): ${stopArea.stop_id} (${stopArea.stop_name})`);
          return stopArea.stop_id;
        }

        // Si vraiment aucun StopArea, prendre le premier
        console.log(`[LocalSearchService] ⚠️ Aucun StopArea trouvé, utilisation de: ${stopsByNumber[0].stop_id}`);
        return stopsByNumber[0].stop_id;
      }

      console.error(`[LocalSearchService] ❌ Aucun stop GTFS trouvé pour le numéro: ${sncfNumber}`);
      console.log(`[LocalSearchService] 🔍 Tentative de recherche par nom de gare (sncf_id peut être incorrect)...`);

      // FALLBACK: Chercher par nom de gare depuis frenchStations
      // Car le sncf_id dans frenchStations peut être différent du numéro dans GTFS
      const station = frenchStations.find(s => s.sncf_id === sncfNumber);
      if (station) {
        console.log(`[LocalSearchService] 📍 Recherche par nom: "${station.name}"`);
        const stopsByStationName = await gtfsDbEnhanced.searchStops(station.name, 5);
        console.log(`[LocalSearchService] 📊 ${stopsByStationName.length} stops trouvés par nom`);

        if (stopsByStationName.length > 0) {
          const stopArea = stopsByStationName.find(s => s.stop_id.startsWith('StopArea:'));
          if (stopArea) {
            console.log(`[LocalSearchService] ✅ Stop trouvé par nom: ${stopArea.stop_id} (${stopArea.stop_name})`);
            return stopArea.stop_id;
          }
          console.log(`[LocalSearchService] ✅ Stop trouvé par nom: ${stopsByStationName[0].stop_id}`);
          return stopsByStationName[0].stop_id;
        }
      }

      console.error(`[LocalSearchService] ❌ Impossible de trouver cette gare dans GTFS`);
      return null;
    } catch (error) {
      console.error('[LocalSearchService] ❌ ERREUR recherche GTFS stop:', error);
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
      console.error('[LocalSearchService] Erreur création station depuis GTFS:', error);
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
    timeRangeEnd?: string
  ): Promise<SearchResult[]> {
    console.log('========================================');
    console.log('[LocalSearchService] 🔍 RECHERCHE DÉMARRÉE');
    console.log(`[LocalSearchService] Gare: ${fromStation.name}`);
    console.log(`[LocalSearchService] SNCF ID: ${fromStation.sncf_id}`);
    console.log(`[LocalSearchService] Mode: ${mode}`);
    console.log(`[LocalSearchService] Max Time: ${maxTime}`);
    console.log('========================================');

    // UTILISATION EXCLUSIVE DES DONNÉES GTFS
    if (!fromStation.sncf_id) {
      console.error('[LocalSearchService] ❌ Pas de SNCF ID pour cette gare');
      return [];
    }

    console.log('[LocalSearchService] ✓ SNCF ID présent, recherche GTFS...');

    try {
      const gtfsResults = await this.searchWithGTFS(
        fromStation,
        mode,
        maxTime,
        maxBudget,
        selectedLabels,
        timeRangeStart,
        timeRangeEnd
      );

      console.log('========================================');
      console.log(`[LocalSearchService] ✅ RÉSULTAT GTFS : ${gtfsResults.length} destinations`);
      console.log('[LocalSearchService] 🎯 DURÉES RÉELLES DEPUIS HORAIRES SNCF');
      console.log('========================================');

      return gtfsResults;
    } catch (error) {
      console.error('[LocalSearchService] ❌ ERREUR GTFS:', error);
      console.error('[LocalSearchService] Impossible de récupérer les horaires');
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
    timeRangeEnd?: string
  ): Promise<SearchResult[]> {
    console.log('[LocalSearchService] 🚂 Recherche avec horaires GTFS réels');
    console.log(`[LocalSearchService] 📅 Filtres: maxTime=${maxTime}min, maxBudget=${maxBudget}€`);
    console.log(`[LocalSearchService] ⏰ Plage horaire: ${timeRangeStart} - ${timeRangeEnd}`);

    if (!fromStation.sncf_id) {
      console.error('[LocalSearchService] ❌ Pas de SNCF ID pour la gare de départ');
      return [];
    }

    try {
      // Initialiser la base de données GTFS si nécessaire
      await gtfsDbEnhanced.initialize();
      console.log('[LocalSearchService] ✅ Base de données GTFS initialisée');

      // Convertir le SNCF ID en format GTFS
      const fromGTFSId = await this.findGTFSStopId(fromStation.sncf_id);
      if (!fromGTFSId) {
        console.error('[LocalSearchService] ❌ Impossible de convertir SNCF ID en GTFS ID');
        return [];
      }

      console.log(`[LocalSearchService] ✓ GTFS ID de départ: ${fromGTFSId}`);

      // Utiliser l'heure de début de plage ou l'heure actuelle
      const departureTime = timeRangeStart || new Date().toTimeString().slice(0, 8);
      console.log(`[LocalSearchService] 🕐 Heure de départ: ${departureTime}`);

      // 🚀 RECHERCHE OPTIMISÉE BULK: Connexions directes + correspondances
      console.log('[LocalSearchService] 🚀 Recherche BULK destinations (direct + correspondances)...');
      const searchStartTime = Date.now();

      // Map pour stocker la meilleure connexion par destination
      const bestConnectionByDestination = new Map<string, TrainConnection>();

      // 1️⃣ CONNEXIONS DIRECTES (sans changement)
      console.log('[LocalSearchService] 📍 Étape 1/2: Connexions directes...');
      const step1Start = Date.now();
      const directConnections = await gtfsDbEnhanced.findAllDestinationsFrom(
        fromGTFSId,
        departureTime,
        timeRangeEnd,
        2000
      );
      const step1Time = Date.now() - step1Start;
      console.log(`[LocalSearchService] ✅ ${directConnections.length} connexions directes (${step1Time}ms)`);

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
      console.log('[LocalSearchService] 🔄 Étape 2/2: Trajets avec 1 correspondance (BULK)...');
      const step2Start = Date.now();
      const oneTransferMap = await gtfsDbEnhanced.findAllDestinationsWithOneTransfer(
        fromGTFSId,
        departureTime,
        timeRangeEnd,
        120, // Max 2h d'attente
        2000 // Limite à 2000 trajets
      );
      const step2Time = Date.now() - step2Start;
      console.log(`[LocalSearchService] ✅ ${oneTransferMap.size} destinations avec 1 correspondance (${step2Time}ms)`);

      // Ajouter les trajets avec 1 correspondance qui n'ont pas de connexion directe
      // OU qui sont plus rapides que la connexion directe
      for (const [destId, journey] of oneTransferMap.entries()) {
        const existing = bestConnectionByDestination.get(destId);

        // Ajouter seulement si pas de connexion directe OU si le trajet avec correspondance est plus rapide
        if (!existing || journey.totalDuration < existing.duration_minutes) {
          bestConnectionByDestination.set(destId, {
            from_station_id: fromGTFSId,
            to_station_id: destId,
            departure_time: '08:00', // Simplifié pour l'instant
            arrival_time: '10:00',   // Simplifié pour l'instant
            duration_minutes: journey.totalDuration,
            route_name: '2 trains', // Indique qu'il y a 2 segments
            route_type: 'TER',
            transfers: 1, // 1 correspondance
            transferStation: journey.transferStation,
          });
        }
      }

      console.log(`[LocalSearchService] 📊 ${bestConnectionByDestination.size} destinations uniques trouvées`);

      // DEBUG: Afficher quelques destinations trouvées
      const sampleDests = Array.from(bestConnectionByDestination.keys()).slice(0, 10);
      console.log(`[LocalSearchService] 🔍 Exemples de destinations: ${sampleDests.map(d => d.slice(-8)).join(', ')}`);

      // Convertir la Map en array
      const connections: TrainConnection[] = Array.from(bestConnectionByDestination.values());

      // Créer une map pour regrouper les destinations par numéro SNCF
      const destinationsMap = new Map<string, {
        connection: TrainConnection;
        station: Station;
      }>();

      // 🚀 OPTIMISATION: Pré-charger TOUTES les stations en PARALLÈLE
      console.log('[LocalSearchService] ⚡ Pré-chargement des stations en parallèle...');
      const step3Start = Date.now();
      const uniqueStopIds = [...new Set(connections.map(c => c.to_station_id))];
      console.log(`[LocalSearchService] 📍 ${uniqueStopIds.length} stations uniques à charger`);

      // Charger toutes les stations en parallèle (beaucoup plus rapide)
      await Promise.all(
        uniqueStopIds.map(stopId => this.findStationByGTFSId(stopId))
      );
      const step3Time = Date.now() - step3Start;
      console.log(`[LocalSearchService] ✅ Stations pré-chargées dans le cache (${step3Time}ms)`);

      // Compteurs de filtrage
      let filteredStationNotFound = 0;
      let filteredSameCity = 0;
      let filteredTimeRange = 0;
      let filteredDuration = 0;
      let filteredPrice = 0;

      // Traiter chaque connexion (maintenant ultra-rapide car tout est dans le cache)
      for (const conn of connections) {
        // Récupérer la station depuis le cache (instantané)
        const toStation = this.stationCache.get(conn.to_station_id);
        if (!toStation) {
          filteredStationNotFound++;
          continue;
        }

        // Extraire le numéro SNCF pour la clé de la map
        const sncfMatch = conn.to_station_id.match(/\d{8}/);
        if (!sncfMatch) {
          filteredStationNotFound++;
          continue;
        }
        const toSncfNumber = sncfMatch[0];

        // Exclure la même ville
        if (this.areSameCity(fromStation, toStation)) {
          filteredSameCity++;
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
        const durationMinutes = conn.duration_minutes;
        if (mode === 'time' && maxTime && durationMinutes > maxTime) {
          // DEBUG: Log les destinations éliminées par durée
          if (toStation.name.includes('Lille') || toStation.name.includes('Lyon')) {
            console.log(`[LocalSearchService] ⏱️ ${toStation.name} éliminé: durée ${durationMinutes}min > max ${maxTime}min`);
          }
          filteredDuration++;
          continue;
        }
        if (mode === 'both' && maxTime && durationMinutes > maxTime) {
          filteredDuration++;
          continue;
        }

        // ===== FILTRE DE PRIX =====
        // Estimer le prix basé sur la distance réelle
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
          });
        }
      }

      console.log(`[LocalSearchService] 🎯 ${destinationsMap.size} destinations après filtrage`);
      console.log(`[LocalSearchService] ❌ ${connections.length - destinationsMap.size} destinations éliminées:`);
      console.log(`  - Station non trouvée: ${filteredStationNotFound}`);
      console.log(`  - Même ville: ${filteredSameCity}`);
      console.log(`  - Hors plage horaire: ${filteredTimeRange}`);
      console.log(`  - Durée trop longue: ${filteredDuration}`);
      console.log(`  - Prix trop élevé: ${filteredPrice}`);

      // Convertir en SearchResult[]
      let results: SearchResult[] = Array.from(destinationsMap.values()).map(({ connection, station }) => {
        // Calculer distance pour estimation prix
        const distance = LocationService.calculateDistance(
          fromStation.lat,
          fromStation.lon,
          station.lat,
          station.lon
        );
        const priceEstimate = PriceEstimationService.estimatePrice(distance, connection.duration_minutes);

        // Créer un datetime ISO complet pour departure/arrival
        const today = new Date();
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
        };
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
      console.log(`[LocalSearchService] ✅ ${results.length} destinations finales retournées`);
      console.log(`[LocalSearchService] ⏱️ Temps total de recherche: ${totalTime}ms`);

      return results;
    } catch (error) {
      console.error('[LocalSearchService] ❌ Erreur recherche GTFS:', error);
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
