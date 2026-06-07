import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export default function SkeletonCard() {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity: pulseAnim }]}>
      <View style={styles.row}>
        <View style={[styles.bar, { width: '60%' }]} />
        <View style={[styles.bar, { width: 20 }]} />
      </View>
      <View style={[styles.row, { marginTop: 12 }]}>
        <View style={[styles.bar, { width: '30%', height: 12 }]} />
        <View style={[styles.bar, { width: '25%', height: 12 }]} />
      </View>
      <View style={[styles.row, { marginTop: 8 }]}>
        <View style={[styles.bar, { width: '35%', height: 10 }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  bar: {
    height: 16,
    backgroundColor: '#E8EAED',
    borderRadius: 4,
  },
});
