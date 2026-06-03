import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigatorSimple';
import { SearchResult } from '../types';

type MapScreenRouteProp = RouteProp<RootStackParamList, 'MapView'>;
type MapScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const CARD_WIDTH = 220;
const CARD_MARGIN = 16;
const POINTER_OFFSET = 12; // space between marker and card bottom
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MapScreen() {
  const route = useRoute<MapScreenRouteProp>();
  const navigation = useNavigation<MapScreenNavigationProp>();
  const mapRef = useRef<MapView>(null);

  const { fromStation, results, mode, maxValue, searchDate, maxTransfers } = route.params;
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [cardPosition, setCardPosition] = useState<{ x: number; y: number } | null>(null);
  const [cardHeight, setCardHeight] = useState(70);

  // Android : react-native-maps n'affiche les marqueurs personnalisés que si
  // tracksViewChanges est vrai au montage (capture de la vue). On l'active
  // brièvement puis on le coupe pour la performance. iOS n'est pas concerné.
  const [androidTrackMarkers, setAndroidTrackMarkers] = useState(Platform.OS === 'android');
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    setAndroidTrackMarkers(true);
    const t = setTimeout(() => setAndroidTrackMarkers(false), 2000);
    return () => clearTimeout(t);
  }, [results]);

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
      const coordinates = [
        { latitude: fromStation.lat, longitude: fromStation.lon },
        ...results.map(result => ({
          latitude: result.to_station.lat,
          longitude: result.to_station.lon,
        })),
      ];

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
        animated: true,
      });
    }
  };

  // Dédupliquer les résultats par station (ne garder que le meilleur résultat par destination)
  const uniqueResults = results.reduce((acc, result) => {
    const existingIndex = acc.findIndex(r => r.to_station.id === result.to_station.id);
    if (existingIndex === -1) {
      acc.push(result);
    } else {
      if (result.duration < acc[existingIndex].duration) {
        acc[existingIndex] = result;
      }
    }
    return acc;
  }, [] as SearchResult[]);

  // Ajuster le zoom automatiquement au chargement
  useEffect(() => {
    if (results.length > 0) {
      setTimeout(() => { fitToAllDestinations(); }, 500);
    }
  }, [results, fromStation]);

  const handleMarkerPress = async (result: SearchResult, e: any) => {
    e.stopPropagation();
    setSelectedResult(result);
    if (mapRef.current) {
      // pointForCoordinate renvoie déjà des dp (vérifié sur Android & iOS).
      // Le décalage venait du recentrage auto de la carte, désormais désactivé
      // via moveOnMarkerPress={false}.
      const point = await mapRef.current.pointForCoordinate({
        latitude: result.to_station.lat,
        longitude: result.to_station.lon,
      });
      setCardPosition(point);
    }
  };

  // Position horizontale de la carte (centrée sur le marqueur, clampée aux bords)
  const cardLeft = cardPosition
    ? Math.max(CARD_MARGIN, Math.min(SCREEN_WIDTH - CARD_WIDTH - CARD_MARGIN, cardPosition.x - CARD_WIDTH / 2))
    : 0;

  // Position verticale : au-dessus du marqueur par défaut, en-dessous si trop près du haut
  const showAbove = cardPosition ? cardPosition.y - cardHeight - POINTER_OFFSET > 60 : true;
  const cardTop = cardPosition
    ? showAbove
      ? cardPosition.y - cardHeight - POINTER_OFFSET
      : cardPosition.y + POINTER_OFFSET + 10
    : 0;

  // Offset horizontal de la pointe (pour la pointer vers le marqueur)
  const pointerLeft = cardPosition
    ? Math.max(12, Math.min(CARD_WIDTH - 24, cardPosition.x - cardLeft - 8))
    : CARD_WIDTH / 2 - 8;

  return (
    <View style={styles.container}>
      {/* Carte plein écran */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        {...(Platform.OS === 'android'
          ? {
              moveOnMarkerPress: false,
              // Faire disparaître l'encadré quand l'utilisateur bouge/zoome la carte
              // (isGesture = geste utilisateur, ignore le recadrage automatique).
              onRegionChange: (_region: any, details?: { isGesture?: boolean }) => {
                if (details?.isGesture) {
                  setSelectedResult(null);
                  setCardPosition(null);
                }
              },
            }
          : {})}
        onPress={() => { setSelectedResult(null); setCardPosition(null); }}
      >
        {/* Point bleu pour la gare de départ */}
        <Marker
          coordinate={{ latitude: fromStation.lat, longitude: fromStation.lon }}
          title={fromStation.name}
          description="Gare de départ"
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={Platform.OS === 'android' ? androidTrackMarkers : false}
        >
          <View style={styles.blueMarker} />
        </Marker>

        {/* Points rouges pour les destinations */}
        {uniqueResults
          .filter(result => result.to_station.id !== fromStation.id)
          .map((result, index) => (
            <Marker
              key={`marker-${result.to_station.id}-${index}`}
              coordinate={{
                latitude: result.to_station.lat,
                longitude: result.to_station.lon,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={
                Platform.OS === 'android'
                  ? (androidTrackMarkers || selectedResult?.to_station.id === result.to_station.id)
                  : selectedResult?.to_station.id === result.to_station.id
              }
              onPress={(e) => handleMarkerPress(result, e)}
            >
              <View style={[
                styles.redMarker,
                selectedResult?.to_station.id === result.to_station.id && styles.redMarkerSelected,
              ]} />
            </Marker>
          ))}
      </MapView>

      {/* Message si aucune destination trouvée (au lieu d'une carte vide) */}
      {results.length === 0 && (
        <View style={[styles.emptyOverlay, { pointerEvents: 'box-none' }]}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucune destination trouvée</Text>
            <Text style={styles.emptyText}>
              Aucun trajet depuis {fromStation.name} ne correspond à vos critères.
              Essayez d'augmenter le temps ou le budget, ou d'élargir vos centres d'intérêt.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.goBack()}>
              <Text style={styles.emptyButtonText}>Modifier la recherche</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bouton pour recentrer la carte */}
      {results.length > 0 && (
        <TouchableOpacity style={styles.recenterButton} onPress={fitToAllDestinations}>
          <Text style={styles.recenterIcon}>⊕</Text>
        </TouchableOpacity>
      )}

      {/* Encadré flottant ancré sur la destination sélectionnée */}
      {selectedResult && cardPosition && (
        <TouchableOpacity
          style={[styles.selectedCard, { left: cardLeft, top: cardTop, width: CARD_WIDTH }]}
          onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}
          onPress={() => navigation.navigate('DestinationDetail', {
            destination: selectedResult,
            searchDate,
            mapParams: { fromStation, results, mode, maxValue, maxTransfers },
          })}
          activeOpacity={0.8}
        >
          <View style={styles.selectedCardContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedCardTitle} numberOfLines={1}>
                {selectedResult.to_station.name}
              </Text>
              <Text style={styles.selectedCardDesc}>
                {Math.floor(selectedResult.duration / 60)}h
                {selectedResult.duration % 60 > 0 ? `${selectedResult.duration % 60}min` : ''}
                {selectedResult.priceRange
                  ? ` · ${selectedResult.priceRange.min}€–${selectedResult.priceRange.max}€`
                  : selectedResult.price ? ` · ${selectedResult.price.toFixed(0)}€` : ''}
              </Text>
            </View>
            <Text style={styles.selectedCardArrow}>›</Text>
          </View>
          {/* Pointe vers le marqueur */}
          {showAbove && (
            <View style={[styles.pointer, { left: pointerLeft }]} />
          )}
          {!showAbove && (
            <View style={[styles.pointerUp, { left: pointerLeft }]} />
          )}
        </TouchableOpacity>
      )}

      {/* Informations en bas — tout l'encadré est cliquable */}
      {results.length > 0 && (
      <TouchableOpacity
        style={styles.infoCard}
        onPress={() => navigation.navigate('ResultsList', {
          fromStation,
          results,
          mode,
          maxValue,
          searchDate,
          maxTransfers,
        })}
        activeOpacity={0.8}
      >
        <View style={styles.infoCardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoCardTitle}>Depuis {fromStation.name}</Text>
            <Text style={styles.infoCardText}>
              {results.length} destination{results.length > 1 ? 's' : ''} trouvée{results.length > 1 ? 's' : ''}
              {mode === 'time' && maxValue
                ? ` · ${Math.floor(maxValue / 60)}h${maxValue % 60 > 0 ? `${maxValue % 60}` : ''} max`
                : mode === 'budget' && maxValue
                ? ` · ${maxValue}€ max`
                : ''}
            </Text>
          </View>
          <Text style={styles.infoCardArrow}>›</Text>
        </View>
      </TouchableOpacity>
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
  redMarkerSelected: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
  },
  selectedCard: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  selectedCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0C3823',
    marginBottom: 2,
  },
  selectedCardDesc: {
    fontSize: 12,
    color: '#5F6368',
  },
  selectedCardArrow: {
    fontSize: 22,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Pointe vers le bas (carte au-dessus du marqueur)
  pointer: {
    position: 'absolute',
    bottom: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },
  // Pointe vers le haut (carte en-dessous du marqueur)
  pointerUp: {
    position: 'absolute',
    top: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
  },
  infoCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  infoCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoCardArrow: {
    fontSize: 28,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0C3823',
    marginBottom: 4,
  },
  infoCardText: {
    fontSize: 13,
    color: '#5F6368',
  },
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    maxWidth: 340,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0C3823',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#5F6368',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 18,
  },
  emptyButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
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
