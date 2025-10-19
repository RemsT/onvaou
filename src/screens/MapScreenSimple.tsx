import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigatorSimple';
import { SearchResult } from '../types';

type MapScreenRouteProp = RouteProp<RootStackParamList, 'MapView'>;
type MapScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function MapScreen() {
  const route = useRoute<MapScreenRouteProp>();
  const navigation = useNavigation<MapScreenNavigationProp>();
  const mapRef = useRef<MapView>(null);

  const { fromStation, results, mode, maxValue } = route.params;
  const [selectedDestination, setSelectedDestination] = useState<SearchResult | null>(null);

  // Calculer la région initiale pour centrer la carte
  const initialRegion = {
    latitude: fromStation.lat,
    longitude: fromStation.lon,
    latitudeDelta: 3,
    longitudeDelta: 3,
  };

  // Fonction pour ajuster le zoom sur toutes les destinations
  const fitToAllDestinations = () => {
    if (mapRef.current && results.length > 0) {
      // Créer un tableau de toutes les coordonnées (départ + destinations)
      const coordinates = [
        {
          latitude: fromStation.lat,
          longitude: fromStation.lon,
        },
        ...results.map(result => ({
          latitude: result.to_station.lat,
          longitude: result.to_station.lon,
        })),
      ];

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: {
          top: 100,
          right: 50,
          bottom: 300, // Plus d'espace en bas pour la carte d'info
          left: 50,
        },
        animated: true,
      });
    }
  };

  // Dédupliquer les résultats par station (ne garder que le meilleur résultat par destination)
  const uniqueResults = results.reduce((acc, result) => {
    const existingIndex = acc.findIndex(r => r.to_station.id === result.to_station.id);
    if (existingIndex === -1) {
      // Nouvelle destination, l'ajouter
      acc.push(result);
    } else {
      // Destination existante, garder celle avec la durée la plus courte
      if (result.duration < acc[existingIndex].duration) {
        acc[existingIndex] = result;
      }
    }
    return acc;
  }, [] as SearchResult[]);

  // Ajuster le zoom automatiquement au chargement
  useEffect(() => {
    if (results.length > 0) {
      // Attendre que la carte soit prête puis ajuster le zoom
      setTimeout(() => {
        fitToAllDestinations();
      }, 500); // Délai pour s'assurer que la carte est montée
    }
  }, [results, fromStation]);

  return (
    <View style={styles.container}>
      {/* Carte plein écran avec MapView native */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
      >
        {/* Point bleu pour la gare de départ */}
        <Marker
          coordinate={{
            latitude: fromStation.lat,
            longitude: fromStation.lon,
          }}
          title={fromStation.name}
          description="Gare de départ"
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.blueMarker} />
        </Marker>

        {/* Points rouges pour les destinations (exclure la gare de départ) */}
        {uniqueResults
          .filter(result =>
            result.to_station.lat !== fromStation.lat ||
            result.to_station.lon !== fromStation.lon
          )
          .map((result) => (
            <Marker
              key={`marker-${result.to_station.id}`}
              coordinate={{
                latitude: result.to_station.lat,
                longitude: result.to_station.lon,
              }}
              title={result.to_station.name}
              description={`${result.duration} min - ${result.price.toFixed(2)}€`}
              onPress={() => setSelectedDestination(result)}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.redMarker} />
            </Marker>
          ))}
      </MapView>

      {/* Bouton pour recentrer la carte */}
      <TouchableOpacity
        style={styles.recenterButton}
        onPress={fitToAllDestinations}
      >
        <Text style={styles.recenterIcon}>⊕</Text>
      </TouchableOpacity>

      {/* Informations en bas */}
      {selectedDestination ? (
        <View style={styles.destinationCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.destinationName}>
              {selectedDestination.to_station.name}
            </Text>
            <TouchableOpacity onPress={() => setSelectedDestination(null)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.destinationInfo}>
            Durée: {selectedDestination.duration} min
          </Text>
          <Text style={styles.destinationInfo}>
            Prix: {selectedDestination.price.toFixed(2)}€
          </Text>
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() =>
              navigation.navigate('DestinationDetail', {
                destination: selectedDestination,
              })
            }
          >
            <Text style={styles.detailButtonText}>Voir les détails</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>
            Depuis {fromStation.name}
          </Text>
          <Text style={styles.infoCardText}>
            {results.length} destination{results.length > 1 ? 's' : ''} trouvée{results.length > 1 ? 's' : ''}
          </Text>
          {mode === 'time' && maxValue && (
            <Text style={styles.infoCardText}>
              Temps max: {Math.floor(maxValue / 60)}h
              {maxValue % 60 > 0 ? ` ${maxValue % 60}min` : ''}
            </Text>
          )}
          {mode === 'budget' && maxValue && (
            <Text style={styles.infoCardText}>Budget max: {maxValue}€</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
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
  redMarker: {
    backgroundColor: '#F44336',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  destinationCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  destinationName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0C3823',
    flex: 1,
  },
  closeButton: {
    fontSize: 28,
    color: '#5F6368',
    paddingLeft: 10,
  },
  destinationInfo: {
    fontSize: 16,
    color: '#0C3823',
    marginBottom: 8,
  },
  detailButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  detailButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0C3823',
    marginBottom: 8,
  },
  infoCardText: {
    fontSize: 14,
    color: '#5F6368',
    marginBottom: 4,
  },
  recenterButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#FFFFFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#E8EAED',
  },
  recenterIcon: {
    fontSize: 28,
    color: '#0C3823',
    fontWeight: 'bold',
  },
});
