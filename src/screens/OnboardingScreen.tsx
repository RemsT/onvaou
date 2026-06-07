import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Dimensions, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const SCREEN_WIDTH = Dimensions.get('window').width;
export const ONBOARDING_KEY = 'onboarding_v1';

const SLIDES = [
  {
    icon: 'train-outline' as const,
    title: 'ONvaOU',
    subtitle: 'Découvrez où vous pouvez aller en train depuis chez vous',
  },
  {
    icon: 'search-outline' as const,
    title: 'Cherchez facilement',
    subtitle: 'Choisissez votre gare, une date et une plage horaire — toutes les destinations accessibles s\'affichent sur une carte',
  },
  {
    icon: 'map-outline' as const,
    title: 'Explorez et réservez',
    subtitle: 'Filtrez par activité et consultez les infos touristiques',
  },
];

interface Props {
  onFinish: () => void;
}

export default function OnboardingScreen({ onFinish }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateSlide = () => {
    slideAnim.setValue(15);
    Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  };

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    onFinish();
  };

  const goTo = (index: number) => {
    flatRef.current?.scrollToOffset({ offset: index * SCREEN_WIDTH, animated: true });
    setCurrentIndex(index);
    animateSlide();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      goTo(currentIndex + 1);
    } else {
      finish();
    }
  };

  const isLast = currentIndex === SLIDES.length - 1;

  const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => (
    <Animated.View style={[styles.slide, { transform: [{ translateY: slideAnim }] }]}>
      <Ionicons name={item.icon} size={80} color="#4CAF50" style={styles.icon} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Bouton Passer */}
      <View style={styles.topRow}>
        {!isLast ? (
          <TouchableOpacity onPress={finish} style={styles.skipBtn}>
            <Text style={styles.skipTxt}>Passer</Text>
          </TouchableOpacity>
        ) : <View />}
      </View>

      {/* Slides */}
      <FlatList
        ref={flatRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.flatList}
        getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
      />

      {/* Dots de progression */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)}>
            <View style={[styles.dot, i === currentIndex && styles.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Bouton suivant / commencer */}
      <TouchableOpacity style={styles.nextBtn} onPress={goNext} activeOpacity={0.85}>
        <Text style={styles.nextBtnTxt}>
          {isLast ? 'Commencer !' : 'Suivant →'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center' },
  topRow: {
    width: '100%',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 8,
    height: 44,
  },
  skipBtn: { paddingVertical: 8, paddingHorizontal: 4 },
  skipTxt: { fontSize: 15, color: '#9E9E9E', fontWeight: '500' },
  flatList: { width: SCREEN_WIDTH },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  icon: { marginBottom: 8 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0C3823',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#5F6368',
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E8EAED',
  },
  dotActive: {
    backgroundColor: '#4CAF50',
    width: 24,
  },
  nextBtn: {
    backgroundColor: '#4CAF50',
    width: SCREEN_WIDTH - 48,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnTxt: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
