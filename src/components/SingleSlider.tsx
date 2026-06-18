import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';

/**
 * Slider à UNE poignée, 100 % JS (PanResponder) — aucune dépendance native (iOS/Android/Expo Go).
 * Valeur « snappée » au pas.
 */
const THUMB = 26;
const TRACK_H = 5;
const BRAND = '#4CAF50';

export default function SingleSlider({ min, max, step, value, onChange, format }: {
  min: number; max: number; step: number; value: number;
  onChange: (v: number) => void; format?: (n: number) => string;
}) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const startRef = useRef(0);
  const valueRef = useRef(value); valueRef.current = value;
  const onChangeRef = useRef(onChange); onChangeRef.current = onChange;
  const fmt = format ?? ((n: number) => String(n));
  const span = Math.max(1, max - min);
  const valToX = (v: number) => (width <= 0 ? 0 : ((v - min) / span) * width);
  const snap = (v: number) => Math.max(min, Math.min(max, Math.round(v / step) * step));

  const resp = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { startRef.current = valueRef.current; },
    onPanResponderMove: (_e, g) => {
      const w = widthRef.current || 1;
      const nv = snap(startRef.current + (g.dx / w) * span);
      if (nv !== valueRef.current) onChangeRef.current(nv);
    },
  })).current;

  const x = valToX(value);
  return (
    <View style={styles.wrap}>
      <Text style={styles.value}>{fmt(value)}</Text>
      <View
        style={styles.trackArea}
        onLayout={(e: LayoutChangeEvent) => { const w = e.nativeEvent.layout.width; widthRef.current = w; setWidth(w); }}
      >
        <View style={styles.track} />
        <View style={[styles.trackFill, { width: Math.max(0, x) }]} />
        {width > 0 && (
          <View {...resp.panHandlers} style={[styles.thumb, { left: x - THUMB / 2 }]} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  value: { fontSize: 14, fontWeight: '800', color: '#0C3823', textAlign: 'center' },
  trackArea: { height: THUMB, justifyContent: 'center' },
  track: { height: TRACK_H, borderRadius: TRACK_H / 2, backgroundColor: '#E0E4E8' },
  trackFill: { position: 'absolute', height: TRACK_H, borderRadius: TRACK_H / 2, backgroundColor: BRAND },
  thumb: {
    position: 'absolute', top: 0,
    width: THUMB, height: THUMB, borderRadius: THUMB / 2,
    backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: BRAND,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2,
    elevation: 3,
  },
});
