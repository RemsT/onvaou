import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { recentSearchService, RecentSearch } from '../services/recentSearchService';
import { useSearchContext } from '../context/SearchContext';
import { CITY_LABELS } from '../types';

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 3600000) return `il y a ${Math.max(1, Math.floor(diff / 60000))}min`;
  if (diff < 86400000) return `il y a ${Math.floor(diff / 3600000)}h`;
  if (diff < 172800000) return 'hier';
  return new Date(timestamp).toLocaleDateString('fr-FR', { weekday: 'long' });
}

function formatHHMM(hhmm: string): string {
  return hhmm.replace(':', 'h');
}

function formatDuration(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  return h > 0 ? `${h}h${m > 0 ? m.toString().padStart(2, '0') : ''}` : `${m}min`;
}

export default function HistoriqueScreen() {
  const navigation = useNavigation<any>();
  const { setPendingRelaunch } = useSearchContext();
  const [searches, setSearches] = useState<RecentSearch[]>([]);

  useFocusEffect(
    useCallback(() => {
      recentSearchService.getAll().then(setSearches);
    }, [])
  );

  const handleToggleFavorite = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await recentSearchService.toggleFavorite(id);
    recentSearchService.getAll().then(setSearches);
  };

  const handleRemove = async (id: string) => {
    await recentSearchService.remove(id);
    recentSearchService.getAll().then(setSearches);
  };

  const handleRelaunch = (search: RecentSearch) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPendingRelaunch(search);
    navigation.navigate('Rechercher');
  };

  const renderItem = ({ item }: { item: RecentSearch }) => {
    const filters: string[] = [];
    if (item.enableTimeFilter) filters.push(`${formatDuration(item.maxTime)} max`);
    if (item.enableBudgetFilter) filters.push(`${item.maxBudget}€ max`);
    if (item.includeTransfers) filters.push('Direct');

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.stationName} numberOfLines={1}>
            {item.fromStation.name}
          </Text>
          <TouchableOpacity
            onPress={() => handleToggleFavorite(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={item.isFavorite ? 'star' : 'star-outline'}
              size={20}
              color={item.isFavorite ? '#FFB300' : '#9E9E9E'}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.details}>
          {item.selectedDate
            ? `${new Date(item.selectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · `
            : ''}
          {formatHHMM(item.timeRangeStart)}→{formatHHMM(item.timeRangeEnd)}
          {filters.length > 0 ? `  ·  ${filters.join(' · ')}` : ''}
        </Text>

        {item.selectedLabels.length > 0 && (
          <View style={styles.tagRow}>
            {item.selectedLabels.map(l => (
              <View key={l} style={[styles.tagChip, { borderColor: CITY_LABELS[l].color }]}>
                <Text style={[styles.tagChipText, { color: CITY_LABELS[l].color }]}>
                  {CITY_LABELS[l].name}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.timestamp}>{formatRelativeTime(item.timestamp)}</Text>
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => handleRemove(item.id)} style={styles.removeBtn}>
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleRelaunch(item)} style={styles.relaunchBtn}>
              <Text style={styles.relaunchBtnText}>Relancer →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={searches}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={48} color="#B0BEC5" />
            <Text style={styles.emptyTitle}>Aucune recherche</Text>
            <Text style={styles.emptyText}>Lancez votre première recherche 🔍</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  list: { padding: 16, paddingTop: 24, paddingBottom: 32 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stationName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0C3823',
    flex: 1,
    marginRight: 8,
  },
  details: {
    fontSize: 13,
    color: '#5F6368',
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tagChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 2 },
  tagChipText: { fontSize: 11, fontWeight: '600' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  removeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeBtnText: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  relaunchBtn: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  relaunchBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0C3823',
  },
  emptyText: {
    fontSize: 14,
    color: '#5F6368',
  },
});
