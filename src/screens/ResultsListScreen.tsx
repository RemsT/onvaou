import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Share,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigatorSimple';
import { SearchResult, CITY_LABELS } from '../types';
import StationLabels from '../components/StationLabels';
import { PriceEstimationService } from '../services/priceEstimationService';
import { getStationTags } from '../data/stationLabels';

type ResultsListRouteProp = RouteProp<RootStackParamList, 'ResultsList'>;
type ResultsListNavigationProp = StackNavigationProp<RootStackParamList>;
type SortType = 'duration' | 'departure' | 'price';
type SortOrder = 'asc' | 'desc';

export default function ResultsListScreen() {
  const route = useRoute<ResultsListRouteProp>();
  const navigation = useNavigation<ResultsListNavigationProp>();

  const { fromStation, results, mode, maxValue, searchDate, maxTransfers } = route.params;
  const [sortType, setSortType] = useState<SortType>('duration');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const listRef = useRef<FlatList>(null);

  const handleSortChange = (newSortType: SortType) => {
    if (newSortType === sortType) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortType(newSortType);
      setSortOrder('asc');
    }
    setTimeout(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }), 50);
  };

  // Trier les résultats selon le type de tri sélectionné
  const sortedResults = [...results].sort((a, b) => {
    let comparison = 0;

    if (sortType === 'duration') {
      comparison = a.duration - b.duration;
    } else if (sortType === 'price') {
      const aMax = a.priceRange?.max ?? a.price ?? 0;
      const bMax = b.priceRange?.max ?? b.price ?? 0;
      comparison = aMax - bMax;
    } else {
      comparison = new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime();
    }

    // Inverser si ordre décroissant
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleDestinationPress = (destination: SearchResult) => {
    navigation.navigate('DestinationDetail', {
      destination,
      searchDate,
      mapParams: { fromStation, results: sortedResults, mode, maxValue, maxTransfers },
    });
  };

  const renderDestinationItem = ({ item }: { item: SearchResult }) => {
    const numId = typeof item.to_station_id === 'number' ? item.to_station_id : parseInt(String(item.to_station_id));
    const tags = getStationTags(numId);

    return (
      <TouchableOpacity
        style={styles.destinationCard}
        onPress={() => handleDestinationPress(item)}
      >
        <View style={styles.destinationHeader}>
          <Text style={styles.destinationName}>{item.to_station.name}</Text>
          <Text style={styles.arrow}>›</Text>
        </View>
        <View style={styles.destinationDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Durée:</Text>
            <Text style={styles.detailText}>
              {Math.floor(item.duration / 60)}h
              {item.duration % 60 > 0 ? ` ${item.duration % 60}min` : ''}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabelSmall}>Départ:</Text>
            <Text style={styles.detailTextSmall}>
              {new Date(item.departure_time).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              {item.tripCount != null && item.tripCount >= 2
                ? ` · ${item.tripCount} trains`
                : ''}
            </Text>
          </View>
          {item.priceRange && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Prix:</Text>
              <Text style={styles.detailText}>
                {item.priceRange.min}€ - {item.priceRange.max}€
              </Text>
            </View>
          )}
          {item.transfers !== undefined && item.transfers > 0 && (
            <View style={styles.transferBadge}>
              <Text style={styles.transferBadgeText}>
                {item.transfers} correspondance{item.transfers > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
        {tags.length > 0 && (
          <View style={styles.tagRow}>
            {tags.map(t => (
              <View key={t.label} style={[styles.tagChip, { borderColor: CITY_LABELS[t.label].color }]}>
                <Text style={[styles.tagChipText, { color: CITY_LABELS[t.label].color }]}>
                  {CITY_LABELS[t.label].name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Depuis {fromStation.name}</Text>
          <View style={styles.headerRow}>
            <Text style={styles.headerSubtitle}>
              {sortedResults.length} destination{sortedResults.length > 1 ? 's' : ''} trouvée{sortedResults.length > 1 ? 's' : ''}
            </Text>
            {mode === 'time' && maxValue && (
              <Text style={styles.headerCriteria}>
                · {Math.floor(maxValue / 60)}h{maxValue % 60 > 0 ? `${maxValue % 60}min` : ''} max
              </Text>
            )}
            {mode === 'budget' && maxValue && (
              <Text style={styles.headerCriteria}>· {maxValue}€ max</Text>
            )}
            {mode === 'both' && (
              <Text style={styles.headerCriteria}>· temps & budget</Text>
            )}
            {maxTransfers === 0 && (
              <View style={styles.directBadge}>
                <Text style={styles.directBadgeText}>Direct</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortType === 'duration' && styles.sortButtonActive,
            ]}
            onPress={() => handleSortChange('duration')}
          >
            <View style={styles.sortButtonContent}>
              <Text
                style={[
                  styles.sortButtonText,
                  sortType === 'duration' && styles.sortButtonTextActive,
                ]}
              >
                Durée
              </Text>
              {sortType === 'duration' && (
                <Text
                  style={[
                    styles.sortArrow,
                    sortType === 'duration' && styles.sortArrowActive,
                  ]}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Text>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortType === 'departure' && styles.sortButtonActive,
            ]}
            onPress={() => handleSortChange('departure')}
          >
            <View style={styles.sortButtonContent}>
              <Text
                style={[
                  styles.sortButtonText,
                  sortType === 'departure' && styles.sortButtonTextActive,
                ]}
              >
                Heure de départ
              </Text>
              {sortType === 'departure' && (
                <Text
                  style={[
                    styles.sortArrow,
                    sortType === 'departure' && styles.sortArrowActive,
                  ]}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Text>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortType === 'price' && styles.sortButtonActive,
            ]}
            onPress={() => handleSortChange('price')}
          >
            <View style={styles.sortButtonContent}>
              <Text
                style={[
                  styles.sortButtonText,
                  sortType === 'price' && styles.sortButtonTextActive,
                ]}
              >
                Prix max
              </Text>
              {sortType === 'price' && (
                <Text
                  style={[
                    styles.sortArrow,
                    sortType === 'price' && styles.sortArrowActive,
                  ]}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Liste des résultats */}
      {sortedResults.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Aucune destination trouvée</Text>
          <Text style={styles.emptySubtext}>
            Essayez de modifier vos critères de recherche
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={sortedResults}
          renderItem={renderDestinationItem}
          keyExtractor={(item, index) => `result-${item.to_station_id}-${item.duration}-${index}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => navigation.goBack()}
              tintColor="#4CAF50"
              colors={['#4CAF50']}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerContent: {
    marginBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.95,
  },
  headerCriteria: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.85,
  },
  directBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
  },
  directBadgeText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  destinationCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  destinationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  destinationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C3823',
    flex: 1,
  },
  arrow: {
    fontSize: 24,
    color: '#4CAF50',
  },
  destinationDetails: {
    flexDirection: 'row',
    gap: 15,
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5F6368',
  },
  detailText: {
    fontSize: 14,
    color: '#0C3823',
  },
  detailLabelSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5F6368',
  },
  detailTextSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0C3823',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
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
  sortContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  sortLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5F6368',
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F7F9FC',
    borderWidth: 2,
    borderColor: '#E8EAED',
    alignItems: 'center',
  },
  sortButtonActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  sortButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5F6368',
  },
  sortButtonTextActive: {
    color: '#4CAF50',
  },
  sortArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5F6368',
  },
  sortArrowActive: {
    color: '#4CAF50',
  },
  transferBadge: {
    backgroundColor: '#FFF3E0',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  transferBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F57C00',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tagChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: 'transparent',
  },
  tagChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
