import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { recentSearchService, RecentSearch } from '../services/recentSearchService';
import { useSearchContext } from '../context/SearchContext';
import { CITY_LABELS } from '../types';

function formatRelativeTime(ts: number): string {
  const d = Date.now() - ts;
  if (d < 3600000) return `il y a ${Math.max(1, Math.floor(d / 60000))}min`;
  if (d < 86400000) return `il y a ${Math.floor(d / 3600000)}h`;
  if (d < 172800000) return 'hier';
  return new Date(ts).toLocaleDateString('fr-FR', { weekday: 'long' });
}
const fmt = (h: string) => h.replace(':', 'h');
function fmtDur(h: string) {
  const [hh, mm] = h.split(':').map(Number);
  return hh > 0 ? `${hh}h${mm > 0 ? mm.toString().padStart(2,'0') : ''}` : `${mm}min`;
}

export default function FavoritesScreen() {
  const navigation = useNavigation<any>();
  const { setPendingRelaunch } = useSearchContext();
  const [favorites, setFavorites] = useState<RecentSearch[]>([]);

  useFocusEffect(useCallback(() => {
    recentSearchService.getFavorites().then(setFavorites);
  }, []));

  const handleUnfavorite = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await recentSearchService.toggleFavorite(id);
    recentSearchService.getFavorites().then(setFavorites);
  };

  const handleRemove = async (id: string) => {
    await recentSearchService.removeFavorite(id);
    recentSearchService.getFavorites().then(setFavorites);
  };

  const handleRelaunch = (s: RecentSearch) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPendingRelaunch(s);
    navigation.navigate('Rechercher');
  };

  const renderItem = ({ item }: { item: RecentSearch }) => {
    const filters: string[] = [];
    if (item.enableTimeFilter) filters.push(`${fmtDur(item.maxTime)} max`);
    if (item.enableBudgetFilter) filters.push(`${item.maxBudget}€ max`);
    if (item.includeTransfers) filters.push('Direct');
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{item.fromStation.name}</Text>
          <TouchableOpacity onPress={() => handleUnfavorite(item.id)} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
            <Ionicons name="star" size={20} color="#FFB300" />
          </TouchableOpacity>
        </View>
        <Text style={styles.details}>
          {item.selectedDate ? `${new Date(item.selectedDate).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})} · ` : ''}
          {fmt(item.timeRangeStart)}→{fmt(item.timeRangeEnd)}
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
        <View style={styles.footer}>
          <Text style={styles.ts}>{formatRelativeTime(item.timestamp)}</Text>
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => handleRemove(item.id)} style={styles.removeBtn}>
              <Text style={styles.removeBtnTxt}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleRelaunch(item)} style={styles.btn}>
              <Text style={styles.btnTxt}>Relancer →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList data={favorites} renderItem={renderItem} keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={48} color="#B0BEC5" />
            <Text style={styles.emptyTitle}>Aucun favori</Text>
            <Text style={styles.emptyText}>Appuyez sur ⭐ dans l'historique pour sauvegarder une recherche</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  list: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E8EAED', shadowColor: '#000', shadowOffset: { width:0,height:2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#0C3823', flex: 1, marginRight: 8 },
  details: { fontSize: 13, color: '#5F6368' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tagChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 2 },
  tagChipText: { fontSize: 11, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  ts: { fontSize: 12, color: '#9E9E9E' },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  removeBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  removeBtnTxt: { fontSize: 14, color: '#9E9E9E' },
  btn: { backgroundColor: '#4CAF50', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  btnTxt: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0C3823' },
  emptyText: { fontSize: 14, color: '#5F6368', textAlign: 'center' },
});
