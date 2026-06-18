import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { recentSearchService, RecentSearch } from '../services/recentSearchService';
import { favoriteDestinationService, FavoriteDestination } from '../services/favoriteDestinationService';
import { useSearchContext } from '../context/SearchContext';
import { CITY_LABELS } from '../types';
import SafeTopBand from '../components/SafeTopBand';

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
function fmtMinutes(min?: number) {
  if (min == null) return '';
  const h = Math.floor(min / 60), m = min % 60;
  return h > 0 ? `${h}h${m ? m.toString().padStart(2, '0') : ''}` : `${m}min`;
}

type Section = 'searches' | 'destinations';

export default function FavoritesScreen() {
  const navigation = useNavigation<any>();
  const { setPendingRelaunch } = useSearchContext();
  const [section, setSection] = useState<Section>('searches');
  const [favorites, setFavorites] = useState<RecentSearch[]>([]);
  const [destinations, setDestinations] = useState<FavoriteDestination[]>([]);

  const reload = useCallback(() => {
    recentSearchService.getFavorites().then(setFavorites);
    favoriteDestinationService.getAll().then(setDestinations);
  }, []);
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const handleUnfavorite = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await recentSearchService.toggleFavorite(id);
    reload();
  };
  const handleRemove = async (id: string) => {
    await recentSearchService.removeFavorite(id);
    reload();
  };
  const handleRelaunch = (s: RecentSearch) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPendingRelaunch(s);
    // Cibler explicitement l'écran Home de la pile : sinon on retombe sur l'écran courant
    // de l'onglet Rechercher (MapView/Détail/Itinéraire) au lieu de la page de recherche.
    navigation.navigate('Rechercher', { screen: 'Home' });
  };

  const handleRemoveDestination = async (id: string) => {
    await favoriteDestinationService.remove(id);
    favoriteDestinationService.getAll().then(setDestinations);
  };
  // Réouvre la fiche destination identique ; horaires rafraîchis pour aujourd'hui à l'arrivée.
  const handleOpenDestination = (d: FavoriteDestination) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Rechercher', {
      screen: 'DestinationDetail',
      params: { destination: d.destination, searchDate: Date.now(), fromFavorites: true },
    });
  };

  const renderSearch = ({ item }: { item: RecentSearch }) => {
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
              <View key={l} style={[styles.tagChip, { backgroundColor: CITY_LABELS[l].color + '22' }]}>
                <Text style={styles.tagChipText}>{CITY_LABELS[l].name}</Text>
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

  const renderDestination = ({ item }: { item: FavoriteDestination }) => {
    const r = item.destination;
    const meta: string[] = [];
    if (r.duration != null) meta.push(fmtMinutes(r.duration));
    if (r.price != null) meta.push(`${Math.round(r.price)}€`);
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => handleOpenDestination(item)}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{r.to_station?.name ?? 'Destination'}</Text>
          <Ionicons name="chevron-forward" size={20} color="#B0BEC5" />
        </View>
        {r.from_station?.name ? (
          <Text style={styles.details}>depuis {r.from_station.name}</Text>
        ) : null}
        {meta.length > 0 && <Text style={styles.details}>{meta.join('  ·  ')}</Text>}
        <View style={styles.footer}>
          <Text style={styles.ts}>Gardée {formatRelativeTime(item.timestamp)}</Text>
          <TouchableOpacity onPress={() => handleRemoveDestination(item.id)} style={styles.removeBtn} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
            <Text style={styles.removeBtnTxt}>Retirer ✕</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const isSearches = section === 'searches';

  return (
    <View style={styles.container}>
      <SafeTopBand />
      {/* Sélecteur Recherches | Destinations */}
      <View style={styles.segment}>
        {(['searches', 'destinations'] as const).map((s) => {
          const active = section === s;
          return (
            <TouchableOpacity
              key={s}
              style={[styles.segBtn, active && styles.segBtnActive]}
              activeOpacity={0.85}
              onPress={() => setSection(s)}
            >
              <Text style={[styles.segText, active && styles.segTextActive]}>
                {s === 'searches' ? `Recherches${favorites.length ? ` (${favorites.length})` : ''}`
                                  : `Destinations${destinations.length ? ` (${destinations.length})` : ''}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isSearches ? (
        <FlatList
          data={favorites}
          renderItem={renderSearch}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="star-outline" size={48} color="#B0BEC5" />
              <Text style={styles.emptyTitle}>Aucune recherche favorite</Text>
              <Text style={styles.emptyText}>Appuyez sur ⭐ dans l'historique pour sauvegarder une recherche</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={destinations}
          renderItem={renderDestination}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bookmark-outline" size={48} color="#B0BEC5" />
              <Text style={styles.emptyTitle}>Aucune destination gardée</Text>
              <Text style={styles.emptyText}>Appuyez sur « Sauvegarder » sur une fiche destination pour la retrouver ici</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  segment: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 4 },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: '#EEF1F4', borderWidth: 1, borderColor: 'transparent' },
  segBtnActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  segText: { fontSize: 14, fontWeight: '600', color: '#5F6368' },
  segTextActive: { color: '#0C3823', fontWeight: '700' },
  list: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E8EAED', shadowColor: '#000', shadowOffset: { width:0,height:2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#0C3823', flex: 1, marginRight: 8 },
  details: { fontSize: 13, color: '#5F6368' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tagChip: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  tagChipText: { fontSize: 12, fontWeight: '600', color: '#0C3823' },
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
