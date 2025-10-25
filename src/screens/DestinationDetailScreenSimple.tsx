import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Dimensions,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigatorSimple';

type DestinationDetailRouteProp = RouteProp<
  RootStackParamList,
  'DestinationDetail'
>;
type DestinationDetailNavigationProp = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

export default function DestinationDetailScreen() {
  const route = useRoute<DestinationDetailRouteProp>();
  const navigation = useNavigation<DestinationDetailNavigationProp>();
  const { destination, searchDate } = route.params;
  const [mapReady, setMapReady] = useState(false);

  /**
   * Construit l'URL de réservation avec les paramètres pré-remplis
   */
  const buildBookingURL = (platform: 'sncf' | 'trainline'): string => {
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

    if (platform === 'sncf') {
      // URL SNCF Connect avec paramètres
      // Format: https://www.sncf-connect.com/app/home/search?origin={from}&destination={to}&date={date}&time={time}
      const baseUrl = 'https://www.sncf-connect.com/app/home/search';

      // Utiliser le nom de la gare pour la recherche
      const fromName = fromStation ? encodeURIComponent(fromStation.name) : '';
      const toName = encodeURIComponent(toStation.name);

      if (fromName) {
        return `${baseUrl}?origin=${fromName}&destination=${toName}&outwardDate=${dateStr}&outwardTime=${encodeURIComponent(timeStr)}`;
      } else {
        // Si pas de gare de départ, juste la destination
        return `${baseUrl}?destination=${toName}`;
      }
    } else {
      // URL Trainline avec paramètres
      // Format: https://www.thetrainline.com/book/results?origin={from}&destination={to}&outwardDate={date}&outwardTime={time}
      const baseUrl = 'https://www.thetrainline.com/book/results';

      const fromName = fromStation ? encodeURIComponent(fromStation.name) : '';
      const toName = encodeURIComponent(toStation.name);

      if (fromName) {
        return `${baseUrl}?origin=${fromName}&destination=${toName}&outwardDate=${dateStr}&outwardHour=${timeStr.split(':')[0]}&outwardMin=${timeStr.split(':')[1]}`;
      } else {
        return `${baseUrl}?destination=${toName}`;
      }
    }
  };

  const handleBooking = async (platform: 'sncf' | 'trainline') => {
    // Si c'est SNCF Connect, copier d'abord dans le presse-papier
    if (platform === 'sncf') {
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
          'SNCF Connect va s\'ouvrir! Collez les informations dans la barre de recherche.',
          [
            {
              text: 'OK',
              onPress: () => {
                const url = buildBookingURL(platform);
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
    } else {
      // Pour Trainline, comportement normal
      const url = buildBookingURL(platform);
      console.log(`Opening ${platform} with URL:`, url);
      Linking.openURL(url).catch((error) => {
        console.error('Error opening URL:', error);
        Alert.alert('Erreur', "Impossible d'ouvrir le lien");
      });
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
          <Text style={styles.stationName}>{destination.to_station.name}</Text>
        </View>

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
                <Text style={styles.infoLabel}>Prix estimé</Text>
                <Text style={styles.infoValue}>
                  {destination.price.toFixed(2)}€
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
            {/* Départ */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
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

            {/* Correspondance si présente */}
            {destination.transfers !== undefined && destination.transfers > 0 && destination.transferStation && (
              <>
                {/* Arrivée à la gare de correspondance */}
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, styles.timelineDotTransfer]} />
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineRow}>
                      {destination.transferArrival && (
                        <Text style={styles.timelineTimeTransfer}>
                          {destination.transferArrival}
                        </Text>
                      )}
                      <Text style={styles.timelineStationBold}>
                        {destination.transferStation}
                      </Text>
                    </View>
                    {/* Temps d'attente sous l'heure d'arrivée */}
                    {destination.transferArrival && destination.transferDeparture && (() => {
                      const [arrH, arrM] = destination.transferArrival.split(':').map(Number);
                      const [depH, depM] = destination.transferDeparture.split(':').map(Number);
                      const waitMinutes = (depH * 60 + depM) - (arrH * 60 + arrM);
                      const waitHours = Math.floor(waitMinutes / 60);
                      const waitMins = waitMinutes % 60;
                      return (
                        <Text style={styles.waitTime}>
                          Attente: {waitHours}h{waitMins.toString().padStart(2, '0')}
                        </Text>
                      );
                    })()}
                  </View>
                </View>
                <View style={styles.timelineLine} />

                {/* Départ de la gare de correspondance */}
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, styles.timelineDotTransfer]} />
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineRow}>
                      {destination.transferDeparture && (
                        <Text style={styles.timelineTimeTransfer}>
                          {destination.transferDeparture}
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

            {/* Arrivée */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <View style={styles.timelineRow}>
                  <Text style={styles.timelineTime}>
                    {arrivalTime.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <Text style={styles.timelineStationBold}>
                    {destination.to_station.name}
                  </Text>
                </View>
                <Text style={styles.timelineLabel}>
                  Arrivée
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Réservation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Réserver</Text>

          <TouchableOpacity
            style={styles.bookingButton}
            onPress={() => handleBooking('sncf')}
          >
            <Text style={styles.bookingButtonText}>
              Réserver sur SNCF Connect
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bookingButton, styles.bookingButtonSecondary]}
            onPress={() => handleBooking('trainline')}
          >
            <Text
              style={[
                styles.bookingButtonText,
                styles.bookingButtonTextSecondary,
              ]}
            >
              Voir sur Trainline
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
                    title={destination.to_station.name}
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
  },
  stationName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
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
  timelineDotTransfer: {
    backgroundColor: '#FFB74D',
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
  timelineTimeTransfer: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F57C00',
    marginBottom: 2,
  },
  waitTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F57C00',
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
  bookingButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowOpacity: 0,
  },
  bookingButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bookingButtonTextSecondary: {
    color: '#4CAF50',
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
