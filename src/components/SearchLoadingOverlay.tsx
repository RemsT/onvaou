import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CityLabel, CITY_LABELS } from '../types';
import { Station } from '../types';

interface Props {
  fromStation: Station;
  selectedDate: Date | null;
  timeRangeStart: string;
  timeRangeEnd: string;
  enableTimeFilter: boolean;
  maxTime: string;
  enableBudgetFilter: boolean;
  maxBudget: string;
  directOnly: boolean;
  selectedLabels: CityLabel[];
}

function fmt(hhmm: string) { return hhmm.replace(':', 'h'); }
function fmtDur(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h > 0 ? `${h}h${m > 0 ? m.toString().padStart(2, '0') : ''}` : `${m}min`;
}
function fmtDate(d: Date) {
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// Trois points animés, style onboarding (vert #4CAF50)
function LoadingDots() {
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current;
  useEffect(() => {
    const loops = dots.map((d, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 180),
        Animated.timing(d, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        Animated.delay((2 - i) * 180),
      ]))
    );
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, []);
  return (
    <View style={styles.dotsRow}>
      {dots.map((anim, i) => (
        <Animated.View key={i} style={[styles.dot, { opacity: anim }]} />
      ))}
    </View>
  );
}

export default function SearchLoadingOverlay({
  fromStation, selectedDate, timeRangeStart, timeRangeEnd,
  enableTimeFilter, maxTime, enableBudgetFilter, maxBudget,
  directOnly, selectedLabels,
}: Props) {
  // Pulsation douce de l'icône train
  const pulse = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.12, duration: 700, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, []);

  const filters: string[] = [];
  if (enableTimeFilter) filters.push(`${fmtDur(maxTime)} max`);
  if (enableBudgetFilter) filters.push(`${maxBudget} € max`);
  if (directOnly) filters.push('Direct');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Animated.View style={[styles.content, { opacity: fadeIn }]}>

        {/* Icône train animée (style slide onboarding) */}
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <Ionicons name="train-outline" size={80} color="#4CAF50" style={styles.icon} />
        </Animated.View>

        {/* Titre + points */}
        <Text style={styles.title}>Recherche en cours</Text>
        <LoadingDots />

        {/* Récap de la recherche */}
        <View style={styles.recap}>
          <RecapRow icon="location-outline" value={fromStation.name} bold />
          {selectedDate && <RecapRow icon="calendar-outline" value={fmtDate(selectedDate)} />}
          <RecapRow icon="time-outline" value={`${fmt(timeRangeStart)} → ${fmt(timeRangeEnd)}`} />
          {filters.length > 0 && <RecapRow icon="options-outline" value={filters.join('  ·  ')} />}
        </View>

        {/* Tags */}
        {selectedLabels.length > 0 && (
          <View style={styles.tagRow}>
            {selectedLabels.map(l => (
              <View key={l} style={[styles.tagChip, { borderColor: CITY_LABELS[l].color }]}>
                <Text style={[styles.tagChipText, { color: CITY_LABELS[l].color }]}>
                  {CITY_LABELS[l].name}
                </Text>
              </View>
            ))}
          </View>
        )}

      </Animated.View>
    </SafeAreaView>
  );
}

function RecapRow({ icon, value, bold }: { icon: any; value: string; bold?: boolean }) {
  return (
    <View style={styles.recapRow}>
      <Ionicons name={icon} size={18} color="#4CAF50" />
      <Text style={[styles.recapValue, bold && styles.recapValueBold]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  icon: {
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0C3823',
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  recap: {
    width: '100%',
    backgroundColor: '#F7F9FC',
    borderRadius: 16,
    padding: 18,
    gap: 12,
    marginTop: 8,
  },
  recapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recapValue: {
    flex: 1,
    fontSize: 15,
    color: '#5F6368',
    fontWeight: '500',
  },
  recapValueBold: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0C3823',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  tagChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
