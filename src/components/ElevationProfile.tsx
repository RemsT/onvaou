import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Mini-profil altimétrique (Phase 2) — barres verticales, 100 % React Native (aucune dépendance
 * native, OK iOS + Android + Expo Go). `profile` = altitudes downsamplées (src/data, champ Trail.profile).
 */
export default function ElevationProfile({
  profile,
  color = '#4CAF50',
  height = 36,
}: {
  profile?: number[];
  color?: string;
  height?: number;
}) {
  if (!profile || profile.length < 2) return null;
  const min = Math.min(...profile);
  const max = Math.max(...profile);
  const range = max - min || 1;
  return (
    <View style={[styles.row, { height }]}>
      {profile.map((e, i) => {
        const h = 3 + ((e - min) / range) * (height - 3);
        return <View key={i} style={[styles.bar, { height: h, backgroundColor: color }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 1.5, marginTop: 6 },
  bar: { flex: 1, borderTopLeftRadius: 1, borderTopRightRadius: 1, opacity: 0.85 },
});
