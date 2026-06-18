import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import SafeTopBand from '../components/SafeTopBand';
import RangeSlider from '../components/RangeSlider';
import SingleSlider from '../components/SingleSlider';
import { setTrailPrefs } from '../data/stationLabels';
import {
  profilePreferencesService,
  TrailPreferences,
  DEFAULT_PREFERENCES,
} from '../services/profilePreferencesService';

const RANDO_MAX = 60;   // plafonds de saisie
const VELO_MAX = 200;

// Champ km éditable au clavier (commit sur blur / validation), borné [min,max].
function KmField({ label, value, min, max, onCommit }: {
  label: string; value: number; min: number; max: number; onCommit: (v: number) => void;
}) {
  const [txt, setTxt] = useState(String(value));
  useEffect(() => { setTxt(String(value)); }, [value]);
  const commit = () => {
    let n = parseInt(txt, 10);
    if (isNaN(n)) n = value;
    n = Math.max(min, Math.min(max, n));
    onCommit(n);
    setTxt(String(n));
  };
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldInputWrap}>
        <TextInput
          style={styles.fieldInput}
          keyboardType="number-pad"
          value={txt}
          onChangeText={t => setTxt(t.replace(/[^0-9]/g, ''))}
          onBlur={commit}
          onSubmitEditing={commit}
          returnKeyType="done"
          maxLength={3}
          selectTextOnFocus
        />
        <Text style={styles.fieldUnit}>km</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const [prefs, setPrefs] = useState<TrailPreferences>(DEFAULT_PREFERENCES);

  useFocusEffect(useCallback(() => {
    profilePreferencesService.getPreferences().then(setPrefs);
  }, []));

  // Applique + persiste à chaque changement (cohérent avec le filtre via setTrailPrefs).
  const update = (next: TrailPreferences) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPrefs(next);
    setTrailPrefs(next);
    profilePreferencesService.savePreferences(next);
  };

  const setRandoMin = (v: number) => update({ ...prefs, randoKm: [v, Math.max(v, prefs.randoKm[1])] });
  const setRandoMax = (v: number) => update({ ...prefs, randoKm: [Math.min(v, prefs.randoKm[0]), v] });
  const setVeloMin = (v: number) => update({ ...prefs, veloKm: [v, Math.max(v, prefs.veloKm[1])] });
  const setVeloMax = (v: number) => update({ ...prefs, veloKm: [Math.min(v, prefs.veloKm[0]), v] });
  const setRandoRange = (r: [number, number]) => update({ ...prefs, randoKm: r });
  const setVeloRange = (r: [number, number]) => update({ ...prefs, veloKm: r });
  const kmFmt = (n: number) => `${n} km`;
  const types: Array<{ label: string; value: TrailPreferences['trailType'] }> = [
    { label: 'Boucle', value: 'loop' }, { label: 'Linéaire', value: 'linear' }, { label: 'Les deux', value: 'both' },
  ];

  return (
    <View style={styles.container}>
      <SafeTopBand />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.pageTitle}>Profil</Text>
        <Text style={styles.pageSubtitle}>Sorties à la journée</Text>
        <Text style={styles.subtitle}>
          Ces critères s'appliquent quand tu coches Randonnée ou Vélo dans une recherche.
        </Text>

        {/* Randonnée */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Randonnée à pied</Text>
          <RangeSlider min={0} max={RANDO_MAX} step={5} value={prefs.randoKm} onChange={setRandoRange} format={kmFmt} />
          <View style={styles.fieldsRow}>
            <KmField label="Min" value={prefs.randoKm[0]} min={0} max={RANDO_MAX} onCommit={setRandoMin} />
            <KmField label="Max" value={prefs.randoKm[1]} min={0} max={RANDO_MAX} onCommit={setRandoMax} />
          </View>
        </View>

        {/* Vélo */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tour à vélo</Text>
          <RangeSlider min={0} max={VELO_MAX} step={10} value={prefs.veloKm} onChange={setVeloRange} format={kmFmt} />
          <View style={styles.fieldsRow}>
            <KmField label="Min" value={prefs.veloKm[0]} min={0} max={VELO_MAX} onCommit={setVeloMin} />
            <KmField label="Max" value={prefs.veloKm[1]} min={0} max={VELO_MAX} onCommit={setVeloMax} />
          </View>
        </View>

        {/* Type — 3 boutons pleine largeur, titre centré */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, styles.cardTitleCenter]}>Type de parcours</Text>
          <View style={styles.segmentRow}>
            {types.map(t => {
              const active = prefs.trailType === t.value;
              return (
                <TouchableOpacity key={t.value} style={[styles.segBtn, active && styles.segBtnActive]}
                  onPress={() => update({ ...prefs, trailType: t.value })} activeOpacity={0.85}>
                  <Text style={[styles.segBtnText, active && styles.segBtnTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Temps de marche max — appliqué UNIQUEMENT en mode « à pied » */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Temps de marche max (mode à pied)</Text>
          <Text style={styles.cardHint}>Distance max à pied vers un site, prise en compte seulement si tu cherches « à pied ».</Text>
          <SingleSlider
            min={5} max={60} step={5}
            value={prefs.maxWalkMinutes}
            onChange={(v) => update({ ...prefs, maxWalkMinutes: v })}
            format={(n) => `${n} min`}
          />
        </View>

        {/* Durée max — curseur de Aucune à 6 h (par heure) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Durée estimée max du tour</Text>
          <SingleSlider
            min={0} max={360} step={60}
            value={prefs.maxMinutes ?? 0}
            onChange={(v) => update({ ...prefs, maxMinutes: v === 0 ? null : v })}
            format={(n) => (n === 0 ? 'Aucune limite' : `${n / 60} h`)}
          />
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={() => update(DEFAULT_PREFERENCES)} activeOpacity={0.8}>
          <Text style={styles.resetText}>Réinitialiser</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  content: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#0C3823', textAlign: 'center' },
  pageSubtitle: { fontSize: 16, fontWeight: '600', color: '#4CAF50', textAlign: 'center', marginTop: 2 },
  subtitle: { fontSize: 13, color: '#5F6368', marginTop: 8, marginBottom: 8, lineHeight: 18, textAlign: 'center' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 12,
    borderWidth: 1, borderColor: '#E8EAED', gap: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0C3823', marginBottom: 2 },
  cardTitleCenter: { textAlign: 'center' },
  cardHint: { fontSize: 12, color: '#5F6368', marginTop: -4, marginBottom: 2 },
  // Champs Min/Max : étiquette + box rapprochées et centrées sous chaque moitié.
  fieldsRow: { flexDirection: 'row', gap: 12 },
  fieldRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  fieldLabel: { fontSize: 14, color: '#5F6368' },
  fieldInputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F7F9FC', borderRadius: 10, borderWidth: 1, borderColor: '#E8EAED',
    paddingHorizontal: 10, paddingVertical: 6, justifyContent: 'center',
  },
  fieldInput: {
    fontSize: 16, fontWeight: '700', color: '#0C3823', textAlign: 'center',
    minWidth: 34, padding: 0,
  },
  fieldUnit: { fontSize: 14, color: '#5F6368', fontWeight: '600' },
  // Type de parcours : 3 boutons occupant toute la largeur, équitablement.
  segmentRow: { flexDirection: 'row', gap: 8 },
  segBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 10,
    backgroundColor: '#EEF1F4', borderWidth: 1, borderColor: 'transparent',
  },
  segBtnActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  segBtnText: { fontSize: 14, fontWeight: '600', color: '#5F6368' },
  segBtnTextActive: { color: '#0C3823', fontWeight: '700' },
  resetBtn: { marginTop: 18, alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 20 },
  resetText: { fontSize: 14, fontWeight: '600', color: '#9E9E9E' },
});
