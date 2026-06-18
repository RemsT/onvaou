import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';

/**
 * Slider de plage à DEUX poignées (min/max), 100 % JS (PanResponder) — aucune dépendance native,
 * compatible iOS, Android et Expo Go. Valeurs « snappées » au pas. Les poignées ne se croisent pas.
 */
const THUMB = 26;
const TRACK_H = 5;
const BRAND = '#4CAF50';

export default function RangeSlider({ min, max, step, value, onChange, format }: {
  min: number; max: number; step: number; value: [number, number];
  onChange: (v: [number, number]) => void; format?: (n: number) => string;
}) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const startRef = useRef(0);
  // Refs vers les dernières valeurs/callback : les PanResponder sont créés une fois.
  const valueRef = useRef(value); valueRef.current = value;
  const onChangeRef = useRef(onChange); onChangeRef.current = onChange;
  const fmt = format ?? ((n: number) => String(n));

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    widthRef.current = w; setWidth(w);
  };

  const span = Math.max(1, max - min);
  const valToX = (v: number) => (width <= 0 ? 0 : ((v - min) / span) * width);
  const snap = (v: number) => {
    const s = Math.round(v / step) * step;
    return Math.max(min, Math.min(max, s));
  };

  const makeResponder = (which: 'lo' | 'hi') => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      startRef.current = which === 'lo' ? valueRef.current[0] : valueRef.current[1];
    },
    onPanResponderMove: (_e, g) => {
      const w = widthRef.current || 1;
      const [lo, hi] = valueRef.current;
      let nv = snap(startRef.current + (g.dx / w) * span);
      if (which === 'lo') { nv = Math.min(nv, hi); if (nv !== lo) onChangeRef.current([nv, hi]); }
      else { nv = Math.max(nv, lo); if (nv !== hi) onChangeRef.current([lo, nv]); }
    },
  });
  const loResp = useRef(makeResponder('lo')).current;
  const hiResp = useRef(makeResponder('hi')).current;

  const loX = valToX(value[0]);
  const hiX = valToX(value[1]);

  return (
    <View style={styles.wrap}>
      <View style={styles.labels}>
        <Text style={styles.value}>{fmt(value[0])}</Text>
        <Text style={styles.value}>{fmt(value[1])}</Text>
      </View>
      <View style={styles.trackArea} onLayout={onLayout}>
        <View style={styles.track} />
        <View style={[styles.trackFill, { left: loX, width: Math.max(0, hiX - loX) }]} />
        {width > 0 && (
          <>
            <View {...loResp.panHandlers} style={[styles.thumb, { left: loX - THUMB / 2 }]} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} />
            <View {...hiResp.panHandlers} style={[styles.thumb, { left: hiX - THUMB / 2 }]} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  value: { fontSize: 14, fontWeight: '800', color: '#0C3823' },
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
