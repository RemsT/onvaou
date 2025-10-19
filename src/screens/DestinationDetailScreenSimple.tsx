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
  const { destination } = route.params;
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

  const handleBooking = (platform: 'sncf' | 'trainline') => {
    const url = buildBookingURL(platform);

    console.log(`Opening ${platform} with URL:`, url);

    Linking.openURL(url).catch((error) => {
      console.error('Error opening URL:', error);
      Alert.alert('Erreur', "Impossible d'ouvrir le lien");
    });
  };

  // Calculer la région de la carte pour afficher la destination
  const getMapRegion = () => {
    const lat = destination.to_station.lat;
    const lon = destination.to_station.lon;

    return {
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.3,
      longitudeDelta: 0.3,
    };
  };

  const departureTime = new Date(destination.departure_time);
  const arrivalTime = new Date(
    departureTime.getTime() + destination.duration * 60000
  );

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
                {Math.floor(destination.duration / 60)}h
                {destination.duration % 60 > 0
                  ? ` ${destination.duration % 60}min`
                  : ''}
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
          <Text style={styles.sectionTitle}>Horaires</Text>
          <View style={styles.timelineContainer}>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTime}>
                  {departureTime.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <Text style={styles.timelineLabel}>Départ</Text>
              </View>
            </View>

            <View style={styles.timelineLine} />

            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTime}>
                  {arrivalTime.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <Text style={styles.timelineLabel}>
                  Arrivée à {destination.to_station.name}
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
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginTop: 4,
    marginRight: 12,
  },
  timelineLine: {
    width: 2,
    height: 30,
    backgroundColor: '#E8EAED',
    marginLeft: 5,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0C3823',
    marginBottom: 2,
  },
  timelineLabel: {
    fontSize: 13,
    color: '#5F6368',
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
