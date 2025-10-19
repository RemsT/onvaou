import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LocalFavoriteService } from '../services/localFavoriteService';
import { Station } from '../types';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  // Recharger les favoris quand l'écran est affiché
  useFocusEffect(
    React.useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    setLoading(true);
    const favs = await LocalFavoriteService.getFavorites();
    setFavorites(favs);
    setLoading(false);
  };

  const handleRemoveFavorite = async (stationId: number) => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous retirer cette destination de vos favoris ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const success = await LocalFavoriteService.removeFavorite(stationId);
            if (success) {
              setFavorites((prev) =>
                prev.filter((fav) => fav.id !== stationId)
              );
            } else {
              Alert.alert('Erreur', 'Impossible de supprimer le favori');
            }
          },
        },
      ]
    );
  };

  const renderFavoriteItem = ({ item }: { item: Station }) => (
    <View style={styles.favoriteItem}>
      <View style={styles.favoriteInfo}>
        <Text style={styles.stationName}>{item.name}</Text>
        <Text style={styles.coordinates}>
          {item.lat.toFixed(4)}, {item.lon.toFixed(4)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveFavorite(item.id)}
      >
        <Text style={styles.removeButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>☆</Text>
        <Text style={styles.emptyText}>Aucun favori</Text>
        <Text style={styles.emptySubtext}>
          Ajoutez des destinations à vos favoris pour les retrouver ici
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes favoris</Text>
        <Text style={styles.count}>{favorites.length} destination{favorites.length > 1 ? 's' : ''}</Text>
      </View>
      <FlatList
        data={favorites}
        renderItem={renderFavoriteItem}
        keyExtractor={(item, index) => `favorite-${item.id}-${index}`}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F7F9FC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0C3823',
  },
  count: {
    fontSize: 14,
    color: '#5F6368',
    marginTop: 5,
  },
  listContent: {
    padding: 10,
  },
  favoriteItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  favoriteInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C3823',
    marginBottom: 5,
  },
  coordinates: {
    fontSize: 14,
    color: '#5F6368',
  },
  removeButton: {
    padding: 10,
  },
  removeButtonText: {
    fontSize: 24,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0C3823',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#5F6368',
    textAlign: 'center',
    maxWidth: 280,
  },
});
