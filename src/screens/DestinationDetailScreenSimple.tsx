import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Image,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigatorSimple';
import { CITY_LABELS, CityLabel } from '../types';
import { getStationData } from '../data/stationLabels';

type DestinationDetailRouteProp = RouteProp<
  RootStackParamList,
  'DestinationDetail'
>;
type DestinationDetailNavigationProp = StackNavigationProp<RootStackParamList>;

export default function DestinationDetailScreen() {
  const route = useRoute<DestinationDetailRouteProp>();
  const navigation = useNavigation<DestinationDetailNavigationProp>();
  const { destination, searchDate, mapParams } = route.params;
  const [mapReady, setMapReady] = useState(false);
  const [expandedTag, setExpandedTag] = useState<CityLabel | null>(null);

  const numericDestId = typeof destination.to_station_id === 'number'
    ? destination.to_station_id
    : parseInt(String(destination.to_station_id));
  const stationData = getStationData(numericDestId);

  /**
   * Construit l'URL SNCF Connect avec les paramètres pré-remplis
   */
  const buildSNCFURL = (): string => {
    const departureTime = new Date(destination.departure_time);
    const fromStation = destination.from_station;
    const toStation = destination.to_station;

    // Format de date: YYYY-MM-DD
    const dateStr = departureTime.toISOString().split('T')[0];

    // Format de l'heure: HH:MM
    const timeStr = departureTime.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

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
    const fromStation = destination.from_station;
    const toStation = destination.to_station;

    // Utiliser la date et l'heure du train
    const trainDepartureTime = new Date(destination.departure_time);

    // Arrondir à l'heure inférieure
    const roundedHour = trainDepartureTime.getHours();
    const timeStr = `${roundedHour.toString().padStart(2, '0')}:00`;

    // Format de date: JJ/MM/AAAA
    const day = trainDepartureTime.getDate().toString().padStart(2, '0');
    const month = (trainDepartureTime.getMonth() + 1).toString().padStart(2, '0');
    const year = trainDepartureTime.getFullYear();
    const dateStr = `${day}/${month}/${year}`;

    const fromName = fromStation ? fromStation.name : '';
    const toName = toStation.name;

    // Construire le texte à copier: depart de {gare depart}, arrivee a {gare d'arrivee} le {date} a partir de {heure}
    const textToCopy = `depart de ${fromName}, arrivee a ${toName} le ${dateStr} a partir de ${timeStr}`;

    try {
      await Clipboard.setStringAsync(textToCopy);

      // Afficher la confirmation et ouvrir SNCF Connect
      Alert.alert(
        'Copié !',
        'SNCF Connect va s\'ouvrir.\nCollez les informations dans la barre de recherche.',
        [
          {
            text: 'OK',
            onPress: () => {
              const url = buildSNCFURL();
              Linking.openURL(url).catch((error) => {
                console.error('Error opening URL:', error);
                Alert.alert('Erreur', "Impossible d'ouvrir le lien");
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Erreur', 'Impossible de copier dans le presse-papier');
    }
  };

  // Calculer la région de la carte pour afficher tous les points
  const getMapRegion = () => {
    const points = [];

    // Ajouter la gare de départ
    if (destination.from_station) {
      points.push({
        lat: destination.from_station.lat,
        lon: destination.from_station.lon,
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

  // Utiliser directement les timestamps ISO des horaires
  const departureTime = new Date(destination.departure_time);
  const arrivalTime = destination.arrival_time
    ? new Date(destination.arrival_time)
    : new Date(departureTime.getTime() + destination.duration * 60000);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.stationName}>
            {destination.to_station.real_name || destination.to_station.name}
          </Text>
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
                            { backgroundColor: info.color + '20', borderColor: info.color },
                            isExpanded && { backgroundColor: info.color + '40' },
                          ]}
                          onPress={() => setExpandedTag(prev => prev === tagEvidence.label ? null : tagEvidence.label)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.tagName, { color: info.color }]}>{info.name}</Text>
                        </TouchableOpacity>
                        {isExpanded && (
                          <View style={[styles.tagEvidence, { borderLeftColor: info.color }]}>
                            <Text style={styles.tagReason}>{tagEvidence.reason}</Text>
                            {tagEvidence.source ? (
                              <TouchableOpacity
                                onPress={() => Linking.openURL(tagEvidence.source).catch(() => {})}
                              >
                                <Text style={[styles.tagSourceLink, { color: info.color }]}>
                                  {tagEvidence.linkLabel || 'En savoir plus'} →
                                </Text>
                              </TouchableOpacity>
                            ) : null}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
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

        {/* Horaires */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Horaires pour le {departureTime.toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </Text>
          <View style={styles.timelineContainer}>
            {/* Départ — bleu */}
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.timelineDotDeparture]} />
              <View style={styles.timelineContent}>
                <View style={styles.timelineRow}>
                  <Text style={styles.timelineTime}>
                    {departureTime.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
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
                      {destination.transferArrival && (
                        <Text style={styles.timelineTime}>
                          {destination.transferArrival.slice(0, 5)}
                        </Text>
                      )}
                      <Text style={styles.timelineStationBold}>
                        {destination.transferStation}
                      </Text>
                    </View>
                    {destination.transferArrival && destination.transferDeparture && (() => {
                      const [arrH, arrM] = destination.transferArrival.split(':').map(Number);
                      const [depH, depM] = destination.transferDeparture.split(':').map(Number);
                      const waitMinutes = (depH * 60 + depM) - (arrH * 60 + arrM);
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
                      {destination.transferDeparture && (
                        <Text style={styles.timelineTime}>
                          {destination.transferDeparture.slice(0, 5)}
                        </Text>
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
                  <Text style={styles.timelineTime}>
                    {arrivalTime.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
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
          <Text style={styles.sectionTitle}>Rechercher sur SNCF Connect</Text>

          <TouchableOpacity
            style={styles.bookingButton}
            onPress={handleBooking}
          >
            <Text style={styles.bookingButtonText}>
              Rechercher sur SNCF Connect
            </Text>
          </TouchableOpacity>
        </View>

        {/* Carte compacte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Localisation</Text>
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_DEFAULT}
              style={styles.map}
              initialRegion={getMapRegion()}
              onMapReady={() => setMapReady(true)}
              scrollEnabled={true}
              zoomEnabled={true}
              pitchEnabled={false}
              rotateEnabled={true}
            >
              {mapReady && (
                <>
                  {/* Gare de départ - Bleu */}
                  {destination.from_station && (
                    <Marker
                      coordinate={{
                        latitude: destination.from_station.lat,
                        longitude: destination.from_station.lon,
                      }}
                      title={destination.from_station.name}
                      anchor={{ x: 0.5, y: 0.5 }}
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
                  >
                    <View style={styles.redMarker} />
                  </Marker>
                </>
              )}
            </MapView>
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
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
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
    color: '#444',
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
  tagsSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0C3823',
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  tagIcon: {
    fontSize: 14,
  },
  tagName: {
    fontSize: 12,
    fontWeight: '700',
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
    color: '#333',
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
    fontSize: 11,
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
    fontSize: 11,
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
    width: 12,
    height: 12,
    borderRadius: 6,
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
    width: 12,
    height: 12,
    borderRadius: 6,
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
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
});
