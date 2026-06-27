import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Image,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigatorSimple';
import { CITY_LABELS, CityLabel, TaggedPoi } from '../types';
import { getStationData, getStationTrailsMatching } from '../data/stationLabels';
import { modeForDistanceKm } from '../utils/directions';
import { networkLabel, difficultyLabel, summarizeWaypoints } from '../utils/trailMeta';
import { LocalSearchService } from '../services/localSearchService';
import { favoriteDestinationService } from '../services/favoriteDestinationService';

type DestinationDetailRouteProp = RouteProp<
  RootStackParamList,
  'DestinationDetail'
>;
type DestinationDetailNavigationProp = StackNavigationProp<RootStackParamList>;

/** Lien « plus d'infos » d'un POI : son URL si dispo, sinon une recherche web (toujours cliquable). */
function infoUrl(name: string, url?: string): string {
  return url || `https://www.google.com/search?q=${encodeURIComponent(name)}`;
}

export default function DestinationDetailScreen() {
  const route = useRoute<DestinationDetailRouteProp>();
  const navigation = useNavigation<DestinationDetailNavigationProp>();
  const { destination, searchDate: searchDateParam, mapParams, fromFavorites } = route.params;
  // Date consultée (modifiable sur la fiche). Défaut = date de recherche, sinon aujourd'hui.
  // Les départs/retours et le lien SNCF s'appuient dessus → changer de jour les rafraîchit.
  const [viewDate, setViewDate] = useState<number>(
    searchDateParam ?? (Date.parse(destination.departure_time) || Date.now())
  );
  const searchDate = viewDate;
  // Android : react-native-maps n'affiche les marqueurs personnalisés que si
  // tracksViewChanges capture la vue. Un timer fixe (2s) ne suffit pas : si les
  // tuiles de la carte mettent plus longtemps à charger, le marqueur n'est pas
  // encore capturé → invisible. Comme cette mini-carte n'a que 2-3 marqueurs
  // statiques, on laisse tracksViewChanges actif en permanence sur Android
  // (coût négligeable, fiabilité garantie). iOS n'en a pas besoin.
  const trackMarkers = Platform.OS === 'android';
  const mapRef = useRef<MapView>(null);
  const [expandedTag, setExpandedTag] = useState<CityLabel | null>(null);
  // Retours possibles vers la gare de départ (dans la journée)
  const [returns, setReturns] = useState<Array<{ time: string; arrival: string; duration: number; transfers: number }> | undefined>(undefined);
  const [showReturns, setShowReturns] = useState(false);
  const [showAllDepartures, setShowAllDepartures] = useState(true);
  const [selectedDepartureHHMM, setSelectedDepartureHHMM] = useState<string>(
    destination.allDepartureTimes?.[0] ??
    new Date(destination.departure_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false })
  );

  // IMPORTANT : résoudre les tags via le MÊME identifiant que le filtre de recherche — le code UIC
  // (sncf_id). `to_station_id` est, pour les gares issues du GTFS, un id temporaire aléatoire qui ne
  // résout pas → la fiche n'affichait alors aucun tag (incohérent avec la recherche).
  const numericDestId: number | string = destination.to_station?.sncf_id || destination.to_station_id;
  const stationData = getStationData(numericDestId);
  // Sorties à la journée (rando/vélo) rattachées à la gare d'arrivée (zéro API, géométrie embarquée).
  // Affichées DANS le tag « Randonnée » (à pied) / « Vélo » (à vélo), comme les autres tags.
  const trails = getStationTrailsMatching(numericDestId);
  // Tri « les meilleurs d'abord » : popularité (réseau/balisage/ref) décroissante, puis accès.
  const byPopularity = (a: typeof trails[number], b: typeof trails[number]) =>
    (b.popularity ?? 0) - (a.popularity ?? 0) || a.accessKm - b.accessKm;
  const trailsByTag: Record<string, typeof trails> = {
    randonnee: trails.filter(t => t.mode === 'walk').sort(byPopularity),
    velo: trails.filter(t => t.mode === 'bike').sort(byPopularity),
  };

  // Sauvegarde de la destination (« garder » pour reconsulter via Favoris ▸ Destinations).
  const [isSaved, setIsSaved] = useState(false);
  useEffect(() => {
    let alive = true;
    favoriteDestinationService.isFavorite(destination).then((v) => { if (alive) setIsSaved(v); });
    return () => { alive = false; };
  }, [destination.to_station_id]);
  const handleToggleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nowSaved = await favoriteDestinationService.toggle(destination);
    setIsSaved(nowSaved);
  };

  /**
   * Construit l'URL SNCF Connect avec les paramètres pré-remplis
   */
  const buildSNCFURL = (): string => {
    const baseDate = searchDate ? new Date(searchDate) : new Date(destination.departure_time);
    const fromStation = destination.from_station;
    const toStation = destination.to_station;

    // Format de date: YYYY-MM-DD
    const dateStr = baseDate.toISOString().split('T')[0];

    // Utiliser l'horaire sélectionné par l'utilisateur (HH:MM)
    const timeStr = selectedDepartureHHMM;

    const baseUrl = 'https://www.sncf-connect.com/app/home/search';
    const fromName = fromStation ? encodeURIComponent(fromStation.name) : '';
    const toName = encodeURIComponent(toStation.name);

    if (fromName) {
      return `${baseUrl}?origin=${fromName}&destination=${toName}&outwardDate=${dateStr}&outwardTime=${encodeURIComponent(timeStr)}`;
    } else {
      return `${baseUrl}?destination=${toName}`;
    }
  };

  const handleBooking = async () => {
    const baseDate = searchDate ? new Date(searchDate) : new Date(destination.departure_time);
    const day = baseDate.getDate().toString().padStart(2, '0');
    const month = (baseDate.getMonth() + 1).toString().padStart(2, '0');
    const year = baseDate.getFullYear();
    const fromName = destination.from_station ? destination.from_station.name : '';
    const toName = destination.to_station.name;
    const textToCopy = `depart de ${fromName}, arrivee a ${toName} le ${day}/${month}/${year} a partir de ${selectedDepartureHHMM}`;

    try {
      await Clipboard.setStringAsync(textToCopy);
      Alert.alert(
        'Copié !',
        'SNCF Connect va s\'ouvrir.\nCollez les informations dans la barre de recherche.',
        [{ text: 'OK', onPress: () => Linking.openURL(buildSNCFURL()).catch(console.error) }]
      );
    } catch {
      Linking.openURL(buildSNCFURL()).catch(console.error);
    }
  };

  const departureStation = destination.from_station ?? mapParams?.fromStation ?? null;

  // Charger les retours possibles (destination → gare de départ), après l'arrivée à destination
  // pour le DÉPART SÉLECTIONNÉ dans la plage horaire de la recherche (donc toujours après ton
  // horaire), en respectant le choix direct/correspondance (maxTransfers). Informatif.
  useEffect(() => {
    let alive = true;
    if (!departureStation) { setReturns([]); return; }
    // Heure d'arrivée = départ choisi (dans la plage de recherche) + durée du trajet.
    const [dh, dm] = selectedDepartureHHMM.split(':').map(Number);
    const arrMin = dh * 60 + dm + destination.duration;
    const pad = (n: number) => n.toString().padStart(2, '0');
    const afterTime = `${pad(Math.floor(arrMin / 60) % 24)}:${pad(arrMin % 60)}:00`;
    const maxTransfers = mapParams?.maxTransfers ?? 0;
    LocalSearchService.getReturns(destination.to_station, departureStation, afterTime, maxTransfers)
      .then((r) => { if (alive) setReturns(r); })
      .catch(() => { if (alive) setReturns([]); });
    return () => { alive = false; };
  }, [destination.to_station_id, departureStation?.id, searchDate, selectedDepartureHHMM]);

  // Calculer la région de la carte pour afficher tous les points
  const getMapRegion = () => {
    const points = [];

    // Ajouter la gare de départ
    if (departureStation) {
      points.push({
        lat: departureStation.lat,
        lon: departureStation.lon,
      });
    }

    // Ajouter la gare de correspondance si présente
    if (destination.transferLat && destination.transferLon) {
      points.push({
        lat: destination.transferLat,
        lon: destination.transferLon,
      });
    }

    // Ajouter la gare d'arrivée
    points.push({
      lat: destination.to_station.lat,
      lon: destination.to_station.lon,
    });

    // Calculer les limites (min/max) de tous les points
    const lats = points.map(p => p.lat);
    const lons = points.map(p => p.lon);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    // Calculer le centre
    const centerLat = (minLat + maxLat) / 2;
    const centerLon = (minLon + maxLon) / 2;

    // Calculer les deltas avec une marge de 20%
    const latDelta = (maxLat - minLat) * 1.4;
    const lonDelta = (maxLon - minLon) * 1.4;

    // Assurer un zoom minimum pour les trajets très courts
    const minDelta = 0.1;

    return {
      latitude: centerLat,
      longitude: centerLon,
      latitudeDelta: Math.max(latDelta, minDelta),
      longitudeDelta: Math.max(lonDelta, minDelta),
    };
  };

  // Cadre la carte sur tous les points (départ + correspondance + arrivée) avec
  // une marge, pour qu'ils soient tous visibles quel que soit l'éloignement.
  const fitToPoints = () => {
    const coords: { latitude: number; longitude: number }[] = [];
    if (departureStation) {
      coords.push({ latitude: departureStation.lat, longitude: departureStation.lon });
    }
    if (destination.transferLat && destination.transferLon) {
      coords.push({ latitude: destination.transferLat, longitude: destination.transferLon });
    }
    coords.push({ latitude: destination.to_station.lat, longitude: destination.to_station.lon });

    if (coords.length === 1) {
      mapRef.current?.animateToRegion({
        ...coords[0],
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      }, 300);
      return;
    }
    mapRef.current?.fitToCoordinates(coords, {
      edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
      animated: false,
    });
  };

  // Convertit "HH:MM" en minutes depuis minuit
  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };
  // Ajoute un delta en minutes à "HH:MM" et retourne "HH:MM" (gère le passage minuit)
  const addMinutes = (hhmm: string, delta: number): string => {
    const total = ((toMinutes(hhmm) + delta) % 1440 + 1440) % 1440;
    return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
  };

  // Horaire de départ d'origine (HH:MM) pour calculer le delta
  const originalDepHHMM = new Date(destination.departure_time)
    .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const delta = toMinutes(selectedDepartureHHMM) - toMinutes(originalDepHHMM);

  // Recalculer tous les horaires selon le départ sélectionné
  const originalArrivalHHMM = (destination.arrival_time
    ? new Date(destination.arrival_time)
    : new Date(new Date(destination.departure_time).getTime() + destination.duration * 60000)
  ).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });

  const selectedArrivalHHMM = addMinutes(originalArrivalHHMM, delta);
  const selectedTransferArrivalHHMM = destination.transferArrival
    ? addMinutes(destination.transferArrival.slice(0, 5), delta)
    : undefined;
  const selectedTransferDepartureHHMM = destination.transferDeparture
    ? addMinutes(destination.transferDeparture.slice(0, 5), delta)
    : undefined;

  // Date de référence pour l'affichage (inchangée)
  const referenceDate = new Date(viewDate);

  // Décale la date consultée de ±n jours (plancher = aujourd'hui), rafraîchit horaires + lien SNCF.
  const shiftViewDate = (days: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const d = new Date(viewDate);
    d.setDate(d.getDate() + days);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (d.getTime() < today.getTime()) return;
    setViewDate(d.getTime());
  };
  const isToday = (() => {
    const d = new Date(viewDate); const t = new Date();
    return d.toDateString() === t.toDateString();
  })();

  // Calendrier (au clic sur la date, depuis les favoris) — plancher = aujourd'hui.
  const [showCalendar, setShowCalendar] = useState(false);
  const minDate = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
  const onPickDate = (date?: Date) => {
    if (date) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setViewDate(date.getTime()); }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.stationName}>
            {destination.to_station.real_name || destination.to_station.name}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => {
                if (mapParams) {
                  navigation.navigate('MapView', {
                    fromStation: mapParams.fromStation,
                    results: mapParams.results,
                    mode: mapParams.mode,
                    maxValue: mapParams.maxValue,
                    searchDate,
                    maxTransfers: mapParams.maxTransfers,
                  });
                } else {
                  navigation.goBack();
                }
              }}
            >
              <Ionicons name="map-outline" size={16} color="#4CAF50" />
              <Text style={styles.mapButtonText}>Carte des destinations</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleToggleSave}
              accessibilityLabel={isSaved ? 'Retirer des destinations gardées' : 'Sauvegarder cette destination'}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={isSaved ? '#4CAF50' : '#5F6368'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* À propos + Wikipedia */}
        {stationData && (stationData.description || stationData.tags.length > 0) && (
          <View style={styles.section}>
            {stationData.thumbnailUrl ? (
              <Image
                source={{ uri: stationData.thumbnailUrl }}
                style={styles.cityThumbnail}
                resizeMode="cover"
              />
            ) : null}
            {stationData.description ? (
              <Text style={styles.cityDescription}>{stationData.description}</Text>
            ) : null}
            {stationData.wikipediaUrl ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(stationData.wikipediaUrl!).catch(() => {})}
                style={styles.wikiLink}
              >
                <Ionicons name="open-outline" size={14} color="#1565C0" />
                <Text style={styles.wikiLinkText}>Découvrir sur Wikipedia →</Text>
              </TouchableOpacity>
            ) : null}

            {/* Tags cliquables */}
            {stationData.tags.length > 0 && (
              <View style={styles.tagsSection}>
                <Text style={styles.tagsSectionTitle}>Activités</Text>
                <View style={styles.tagsRow}>
                  {stationData.tags.map(tagEvidence => {
                    const info = CITY_LABELS[tagEvidence.label];
                    if (!info) return null;
                    const isExpanded = expandedTag === tagEvidence.label;
                    return (
                      <View key={tagEvidence.label}>
                        <TouchableOpacity
                          style={[
                            styles.tagBadge,
                            { backgroundColor: info.color + '22' },
                            isExpanded && { backgroundColor: info.color + '3A' },
                          ]}
                          onPress={() => setExpandedTag(prev => prev === tagEvidence.label ? null : tagEvidence.label)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.tagName}>{info.name}</Text>
                          <Text style={styles.tagChevron}>{isExpanded ? '▾' : '›'}</Text>
                        </TouchableOpacity>
                        {isExpanded && (
                          <View style={[styles.tagEvidence, { borderLeftColor: info.color }]}>
                            {tagEvidence.pois && tagEvidence.pois.length > 0 ? (
                              <View style={styles.poiList}>
                                {tagEvidence.pois.map((poi, i) => {
                                  const hasCoords = poi.lat != null && poi.lon != null;
                                  const distTxt = poi.km != null ? `~${poi.km.toFixed(1).replace('.', ',')} km` : '';
                                  // Camping : étoiles (★) ou « non classé », + commune si dispo.
                                  const isCamping = tagEvidence.label === 'camping';
                                  const starsTxt = isCamping
                                    ? (poi.stars ? '★'.repeat(poi.stars) : 'Non classé')
                                    : '';
                                  const subTxt = isCamping
                                    ? [starsTxt, poi.commune].filter(Boolean).join(' · ')
                                    : '';
                                  return (
                                    <View key={`${poi.name}-${i}`} style={styles.poiItem}>
                                      <TouchableOpacity onPress={() => Linking.openURL(infoUrl(poi.name, poi.url)).catch(() => {})}>
                                        <Text style={[styles.poiItemName, { color: info.color }]} numberOfLines={2}>{poi.name}</Text>
                                      </TouchableOpacity>
                                      {subTxt ? <Text style={styles.poiItemSub}>{subTxt}</Text> : null}
                                      <View style={styles.poiItemMeta}>
                                        {distTxt ? <Text style={styles.poiItemDist}>{distTxt}</Text> : <View />}
                                        {hasCoords && (
                                          <TouchableOpacity
                                            onPress={() => navigation.navigate('RouteMap', {
                                              origin: { lat: destination.to_station.lat, lon: destination.to_station.lon, name: destination.to_station.name },
                                              dest: { lat: poi.lat!, lon: poi.lon!, name: poi.name },
                                              destUrl: poi.url,
                                              // POI rando/vélo = point seul (pas de tracé du sentier) → légende dédiée.
                                              pointOnly: tagEvidence.label === 'randonnee' || tagEvidence.label === 'velo',
                                              mode: modeForDistanceKm(poi.km),
                                            })}
                                          >
                                            <Text style={[styles.poiItemGo, { color: info.color }]}>Voir le trajet</Text>
                                          </TouchableOpacity>
                                        )}
                                      </View>
                                    </View>
                                  );
                                })}
                              </View>
                            ) : (tagEvidence.source && !(trailsByTag[tagEvidence.label]?.length)) ? (
                              <TouchableOpacity
                                onPress={() => Linking.openURL(tagEvidence.source).catch(() => {})}
                              >
                                <Text style={[styles.tagSourceLink, { color: info.color }]}>
                                  {tagEvidence.linkLabel || 'En savoir plus'} →
                                </Text>
                              </TouchableOpacity>
                            ) : null}

                            {/* Sorties à la journée (tracé embarqué) sous le tag Randonnée/Vélo */}
                            {(trailsByTag[tagEvidence.label] || []).map((t, i) => (
                              <View key={`trail-${i}`} style={styles.poiItem}>
                                {t.url ? (
                                  <TouchableOpacity onPress={() => Linking.openURL(t.url!).catch(() => {})}>
                                    <Text style={[styles.poiItemName, { color: info.color }]} numberOfLines={2}>{t.name}</Text>
                                  </TouchableOpacity>
                                ) : (
                                  <Text style={styles.poiItemName} numberOfLines={2}>{t.name}</Text>
                                )}
                                {(t.generated || t.ref || networkLabel(t.network) || difficultyLabel(t.difficulty)) ? (
                                  <View style={styles.trailBadges}>
                                    {t.generated ? (
                                      <Text style={styles.trailGenBadge}>Boucle suggérée</Text>
                                    ) : null}
                                    {t.ref ? (
                                      <Text style={[styles.trailRefBadge, { color: info.color, borderColor: info.color }]}>{t.ref}</Text>
                                    ) : null}
                                    {networkLabel(t.network) ? <Text style={styles.trailMetaTag}>{networkLabel(t.network)}</Text> : null}
                                    {difficultyLabel(t.difficulty) ? <Text style={styles.trailMetaTag}>{difficultyLabel(t.difficulty)}</Text> : null}
                                  </View>
                                ) : null}
                                {summarizeWaypoints(t.waypoints) ? (
                                  <Text style={styles.trailWaypoints}>Le long : {summarizeWaypoints(t.waypoints)}</Text>
                                ) : null}
                                <View style={styles.poiItemMeta}>
                                  <Text style={styles.poiItemDist}>{t.loop ? 'Boucle' : 'Gare → gare'} · {t.km.toFixed(0)} km{t.ascent ? ` · ↗ ${t.ascent} m` : ''}</Text>
                                  <TouchableOpacity
                                    onPress={() => navigation.navigate('RouteMap', {
                                      origin: { lat: destination.to_station.lat, lon: destination.to_station.lon, name: destination.to_station.name },
                                      dest: { lat: destination.to_station.lat, lon: destination.to_station.lon, name: t.name },
                                      mode: t.mode,
                                      trail: t,
                                      otherTrails: (trailsByTag[tagEvidence.label] || []).filter(o => o !== t),
                                    })}
                                  >
                                    <Text style={[styles.poiItemGo, { color: info.color }]}>Voir le trajet</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
                <Text style={styles.tagsAttribution}>
                  Source : DATAtourisme (data.gouv.fr)
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Infos principales - Sur une seule ligne */}
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <View style={styles.infoCardCompact}>
              <Text style={styles.infoLabel}>Durée du trajet</Text>
              <Text style={styles.infoValue}>
                {Math.floor(destination.duration / 60)}h{(destination.duration % 60).toString().padStart(2, '0')}
              </Text>
            </View>

            {destination.price && (
              <View style={styles.infoCardCompact}>
                <Text style={styles.infoLabel}>Prix indicatif</Text>
                <Text style={styles.infoValue}>
                  {destination.priceRange
                    ? `${destination.priceRange.min}€ – ${destination.priceRange.max}€`
                    : `${destination.price.toFixed(0)}€`}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Départs dans la plage horaire — AVANT la timeline (uniquement si ≥ 2 horaires) */}
        {destination.allDepartureTimes && destination.allDepartureTimes.length >= 2 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.departureSectionHeader}
              onPress={() => setShowAllDepartures(v => !v)}
              activeOpacity={0.7}
            >
              <Text style={styles.departureSectionTitle}>
                {destination.allDepartureTimes.length} départ{destination.allDepartureTimes.length > 1 ? 's' : ''} dans la plage horaire sélectionnée
              </Text>
              <Text style={styles.departureChevron}>{showAllDepartures ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showAllDepartures && (
              <View style={styles.departureChips}>
                {destination.allDepartureTimes.map((t, i) => {
                  const isSelected = t === selectedDepartureHHMM;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.departureChip, isSelected && styles.departureChipFirst]}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedDepartureHHMM(t); }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.departureChipText, isSelected && styles.departureChipTextFirst]}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Horaires — timeline mise à jour selon le départ sélectionné */}
        <View style={styles.section}>
          {fromFavorites ? (
            // Depuis les favoris : on peut changer la date → les horaires s'adaptent.
            <>
              <View style={styles.dateSelector}>
                <TouchableOpacity
                  onPress={() => shiftViewDate(-1)}
                  disabled={isToday}
                  style={[styles.dateArrow, isToday && styles.dateArrowDisabled]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="chevron-back" size={20} color={isToday ? '#B0BEC5' : '#0C3823'} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateLabelBtn}
                  activeOpacity={0.7}
                  onPress={() => setShowCalendar(true)}
                >
                  <Ionicons name="calendar-outline" size={16} color="#0C3823" />
                  <Text style={styles.dateSelectorLabel}>
                    {isToday ? "Aujourd'hui · " : ''}
                    {referenceDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => shiftViewDate(1)}
                  style={styles.dateArrow}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="chevron-forward" size={20} color="#0C3823" />
                </TouchableOpacity>
              </View>
              <Text style={styles.sectionSubtitle}>Touchez la date pour ouvrir le calendrier · horaires & réservation pour ce jour</Text>

              {/* Calendrier natif (Android : dialog ; iOS : calendrier inline en modal) */}
              {showCalendar && (Platform.OS === 'ios' ? (
                <Modal transparent animationType="fade" visible onRequestClose={() => setShowCalendar(false)}>
                  <TouchableOpacity style={styles.calendarOverlay} activeOpacity={1} onPress={() => setShowCalendar(false)}>
                    <View style={styles.calendarSheet}>
                      <DateTimePicker
                        value={new Date(viewDate)}
                        mode="date"
                        display="inline"
                        locale="fr-FR"
                        minimumDate={minDate}
                        onChange={(_e, date) => onPickDate(date)}
                      />
                      <TouchableOpacity style={styles.calendarDone} onPress={() => setShowCalendar(false)}>
                        <Text style={styles.calendarDoneText}>Valider</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Modal>
              ) : (
                <DateTimePicker
                  value={new Date(viewDate)}
                  mode="date"
                  minimumDate={minDate}
                  onChange={(e, date) => { setShowCalendar(false); if (e.type !== 'dismissed') onPickDate(date); }}
                />
              ))}
            </>
          ) : (
            <Text style={styles.sectionTitle}>
              Horaires pour le {referenceDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          )}
          <View style={styles.timelineContainer}>
            {/* Départ — bleu */}
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.timelineDotDeparture]} />
              <View style={styles.timelineContent}>
                <View style={styles.timelineRow}>
                  <Text style={styles.timelineTime}>{selectedDepartureHHMM}</Text>
                  {destination.from_station && (
                    <Text style={styles.timelineStationBold}>
                      {destination.from_station.name}
                    </Text>
                  )}
                </View>
                <Text style={styles.timelineLabel}>Départ</Text>
              </View>
            </View>

            <View style={styles.timelineLine} />

            {/* Correspondance — orange */}
            {destination.transfers !== undefined && destination.transfers > 0 && destination.transferStation && (
              <>
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, styles.timelineDotTransfer]} />
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineRow}>
                      {selectedTransferArrivalHHMM && (
                        <Text style={styles.timelineTime}>{selectedTransferArrivalHHMM}</Text>
                      )}
                      <Text style={styles.timelineStationBold}>
                        {destination.transferStation}
                      </Text>
                    </View>
                    {selectedTransferArrivalHHMM && selectedTransferDepartureHHMM && (() => {
                      const waitMinutes = toMinutes(selectedTransferDepartureHHMM) - toMinutes(selectedTransferArrivalHHMM);
                      const waitHours = Math.floor(waitMinutes / 60);
                      const waitMins = waitMinutes % 60;
                      return (
                        <Text style={styles.waitTime}>
                          Correspondance · {waitHours > 0 ? `${waitHours}h` : ''}{waitMins.toString().padStart(2, '0')}min d'attente
                        </Text>
                      );
                    })()}
                  </View>
                </View>
                <View style={styles.timelineLine} />

                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, styles.timelineDotTransfer]} />
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineRow}>
                      {selectedTransferDepartureHHMM && (
                        <Text style={styles.timelineTime}>{selectedTransferDepartureHHMM}</Text>
                      )}
                      <Text style={styles.timelineStationBold}>
                        {destination.transferStation}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.timelineLine} />
              </>
            )}

            {/* Arrivée — rouge */}
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.timelineDotArrival]} />
              <View style={styles.timelineContent}>
                <View style={styles.timelineRow}>
                  <Text style={styles.timelineTime}>{selectedArrivalHHMM}</Text>
                  <Text style={styles.timelineStationBold}>
                    {destination.to_station.real_name || destination.to_station.name}
                  </Text>
                </View>
                <Text style={styles.timelineLabel}>Arrivée</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Réservation */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.bookingButton}
            onPress={handleBooking}
          >
            <Text style={styles.bookingButtonText}>
              Rechercher sur SNCF Connect
            </Text>
          </TouchableOpacity>
        </View>

        {/* Retours possibles dans la journée */}
        {returns !== undefined && (
          <View style={styles.section}>
            {returns.length > 0 ? (
              <>
                <TouchableOpacity
                  style={styles.departureSectionHeader}
                  onPress={() => setShowReturns(v => !v)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.departureSectionTitle}>
                    {returns.length} retour{returns.length > 1 ? 's' : ''} possible{returns.length > 1 ? 's' : ''} vers {departureStation?.name}
                    {'  ·  '}dernier à {returns[returns.length - 1].time.replace(':', 'h')}
                  </Text>
                  <Text style={styles.departureChevron}>{showReturns ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                {showReturns && (
                  <View style={styles.departureChips}>
                    {returns.map((r, i) => (
                      <View key={i} style={styles.departureChip}>
                        <Text style={styles.departureChipText}>
                          {r.time.replace(':', 'h')}{r.transfers > 0 ? ' · corresp.' : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <View style={[styles.returnCard, styles.returnCardWarn]}>
                <Text style={styles.returnTextWarn}>
                  Aucun train de retour trouvé — vérifiez avant de partir.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Carte compacte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Localisation</Text>
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_DEFAULT}
              style={styles.map}
              initialRegion={getMapRegion()}
              onMapReady={fitToPoints}
              scrollEnabled={true}
              zoomEnabled={true}
              pitchEnabled={false}
              rotateEnabled={true}
            >
              {/* Gare de départ - Bleu */}
                  {departureStation && (
                    <Marker
                      coordinate={{
                        latitude: departureStation.lat,
                        longitude: departureStation.lon,
                      }}
                      title={departureStation.name}
                      anchor={{ x: 0.5, y: 0.5 }}
                      tracksViewChanges={trackMarkers}
                    >
                      <View style={styles.blueMarker} />
                    </Marker>
                  )}

                  {/* Gare de correspondance - Orange */}
                  {destination.transfers !== undefined && destination.transfers > 0 && destination.transferStation && destination.transferLat && destination.transferLon && (
                    <Marker
                      coordinate={{
                        latitude: destination.transferLat,
                        longitude: destination.transferLon,
                      }}
                      title={destination.transferStation}
                      anchor={{ x: 0.5, y: 0.5 }}
                      tracksViewChanges={trackMarkers}
                    >
                      <View style={styles.orangeMarker} />
                    </Marker>
                  )}

                  {/* Gare d'arrivée - Rouge */}
                  <Marker
                    coordinate={{
                      latitude: destination.to_station.lat,
                      longitude: destination.to_station.lon,
                    }}
                    title={destination.to_station.real_name || destination.to_station.name}
                    anchor={{ x: 0.5, y: 0.5 }}
                    tracksViewChanges={trackMarkers}
                  >
                    <View style={styles.redMarker} />
                  </Marker>
            </MapView>
          </View>

          {/* Légende */}
          <View style={styles.mapLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
              <Text style={styles.legendText}>Départ</Text>
            </View>
            {destination.transfers !== undefined && destination.transfers > 0 && destination.transferLat && destination.transferLon && (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
                <Text style={styles.legendText}>Correspondance</Text>
              </View>
            )}
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
              <Text style={styles.legendText}>Arrivée</Text>
            </View>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>
            💡 Les prix et horaires affichés sont estimés. Consultez les sites de réservation pour les informations en temps réel.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
    marginTop: 10,
    alignItems: 'center',
  },
  stationName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0C3823',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  shareButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  mapButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
  section: {
    marginBottom: 20,
  },
  // Wikipedia & description
  cityThumbnail: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    marginBottom: 10,
  },
  cityDescription: {
    fontSize: 13,
    color: '#5F6368',
    lineHeight: 20,
    marginBottom: 8,
  },
  wikiLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  wikiLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1565C0',
  },
  // Tags / activités
  tagsSection: {
    marginTop: 4,
  },
  tagsAttribution: {
    fontSize: 12,
    color: '#9E9E9E',
    fontStyle: 'italic',
    marginTop: 10,
  },
  poiList: {
    gap: 4,
  },
  poiLink: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  poiPlain: {
    fontSize: 12,
    color: '#5F6368',
    lineHeight: 18,
  },
  poiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 2,
  },
  poiInfo: { flex: 1 },
  poiAccess: {
    fontSize: 11,
    color: '#5F6368',
    marginTop: 1,
  },
  poiGoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  poiGoText: { fontSize: 11, fontWeight: '700' },
  // ── Point/sortie en bloc : titre (jusqu'à 2 lignes), puis distance + Voir le trajet ──
  poiItem: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEF1F4',
    gap: 4,
  },
  poiItemName: { fontSize: 14, fontWeight: '700', color: '#0C3823', lineHeight: 19 },
  poiItemSub: { fontSize: 12, color: '#8A6D3B', marginTop: 2, fontWeight: '600' },
  poiItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  poiItemDist: { fontSize: 12, color: '#5F6368' },
  poiItemGo: { fontSize: 13, fontWeight: '700' },
  // Badges « données riches » (Phase 1) : ref (GR/EuroVelo), portée du réseau, difficulté.
  trailBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  trailRefBadge: {
    fontSize: 11, fontWeight: '800', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6, borderWidth: 1.5,
  },
  trailMetaTag: {
    fontSize: 11, fontWeight: '600', color: '#5F6368', backgroundColor: '#EEF1F4',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  trailWaypoints: { fontSize: 12, color: '#5F6368', marginTop: 3 },
  trailGenBadge: {
    fontSize: 11, fontWeight: '700', color: '#7B5800', backgroundColor: '#FFF3D6',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  returnCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  returnCardWarn: { backgroundColor: '#FFF3E0' },
  returnTextWarn: { fontSize: 14, fontWeight: '600', color: '#E65100' },
  returnHint: { fontSize: 12, color: '#5F6368', marginTop: 8, marginBottom: 6 },
  tagsSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0C3823',
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'column',
    gap: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
  },
  tagName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0C3823',
  },
  tagChevron: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5F6368',
    marginLeft: 8,
  },
  tagEvidence: {
    marginTop: 6,
    marginBottom: 4,
    padding: 10,
    backgroundColor: '#F7F9FC',
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  tagReason: {
    fontSize: 12,
    color: '#5F6368',
    lineHeight: 18,
    marginBottom: 4,
  },
  tagSourceLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0C3823',
    marginBottom: 12,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dateArrow: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#EEF1F4',
  },
  dateArrowDisabled: { backgroundColor: '#F7F9FC' },
  dateLabelBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 6, borderRadius: 8, backgroundColor: '#EEF1F4',
  },
  dateSelectorLabel: {
    fontSize: 15, fontWeight: '700', color: '#0C3823',
    textTransform: 'capitalize',
  },
  sectionSubtitle: { fontSize: 12, color: '#5F6368', marginTop: 4, marginBottom: 8 },
  calendarOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  calendarSheet: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12 },
  calendarDone: {
    backgroundColor: '#4CAF50', paddingVertical: 12, borderRadius: 12,
    alignItems: 'center', marginTop: 8,
  },
  calendarDoneText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  trailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#E8EAED',
  },
  trailName: { fontSize: 14, fontWeight: '700', color: '#0C3823' },
  trailInfo: { fontSize: 12, color: '#5F6368', marginTop: 2 },
  trailBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#4CAF50', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
  },
  trailBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  trailCredit: { fontSize: 11, color: '#9E9E9E', marginTop: 10 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  infoCardCompact: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoLabel: {
    fontSize: 12,
    color: '#5F6368',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  timelineContainer: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginTop: 4,
    marginRight: 10,
  },
  timelineLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E8EAED',
    marginLeft: 4,
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0C3823',
    marginBottom: 1,
  },
  timelineLabel: {
    fontSize: 12,
    color: '#5F6368',
    marginTop: 1,
  },
  timelineStation: {
    fontSize: 12,
    color: '#5F6368',
    marginTop: 2,
    fontStyle: 'italic',
  },
  // Couleurs par rôle (identiques à la carte)
  timelineDotDeparture: {
    backgroundColor: '#2196F3',
  },
  timelineDotTransfer: {
    backgroundColor: '#FF9800',
  },
  timelineDotArrival: {
    backgroundColor: '#F44336',
  },
  transferBadge: {
    backgroundColor: '#FFF3E0',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFB74D',
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  transferBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F57C00',
  },
  waitTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5F6368',
    marginTop: 4,
    fontStyle: 'italic',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timelineStationBold: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0C3823',
  },
  departureSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  departureSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0C3823',
    flex: 1,
    flexWrap: 'wrap',
  },
  departureChevron: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  departureChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 8,
  },
  departureChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F1F5F1',
    borderWidth: 1,
    borderColor: '#D0E8D0',
  },
  departureChipFirst: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  departureChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0C3823',
  },
  departureChipTextFirst: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bookingButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bookingButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1565C0',
    marginBottom: 20,
  },
  infoBoxText: {
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 20,
  },
  mapLegend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  legendText: {
    fontSize: 12,
    color: '#5F6368',
    fontWeight: '500',
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  blueMarker: {
    backgroundColor: '#2196F3',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  orangeMarker: {
    backgroundColor: '#FF9800',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  redMarker: {
    backgroundColor: '#F44336',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
});
