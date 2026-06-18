import React from 'react';
import { View, Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Bandeau plein (couleur de marque) couvrant la zone de la barre de statut :
 * encoche / Dynamic Island (iOS) et poinçon caméra (Android), pour qu'aucun
 * contenu ne soit masqué. À placer en PREMIER enfant des écrans sans header.
 *
 * Hauteur = inset haut (Dynamic Island/notch sur iOS, hauteur de status bar sur
 * Android). `light` = texte de la barre de statut clair (par défaut, sur fond vert).
 */
const BRAND = '#4CAF50';

export default function SafeTopBand({ color = BRAND, light = true }: { color?: string; light?: boolean }) {
  const insets = useSafeAreaInsets();
  // Repli Android si l'inset n'est pas remonté : hauteur native de la status bar.
  const height = insets.top || (Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 0 : 0);
  return (
    <>
      <StatusBar style={light ? 'light' : 'dark'} backgroundColor={color} translucent={false} />
      <View style={{ height, backgroundColor: color }} />
    </>
  );
}
