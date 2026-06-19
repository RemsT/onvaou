/**
 * Application principale avec initialisation automatique de la base de données GTFS
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigatorSimple';
import { DatabaseInitializationScreen } from './src/components/DatabaseInitializationScreen';
import { useGTFSInitialization } from './src/hooks/useGTFSInitialization';
import { SearchProvider } from './src/context/SearchContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import { profilePreferencesService } from './src/services/profilePreferencesService';
import { setTrailPrefs } from './src/data/stationLabels';

function AppInner() {
  const { isInitializing, progress } = useGTFSInitialization();

  // Charge les préférences de profil (plages rando/vélo, type, durée) et les pousse vers le filtre.
  // Protégé : une erreur de stockage ne doit jamais bloquer le démarrage.
  useEffect(() => {
    profilePreferencesService.getPreferences().then(setTrailPrefs).catch(() => {});
  }, []);

  if (isInitializing) {
    return <DatabaseInitializationScreen progress={progress} />;
  }

  return (
    <SearchProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </SearchProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppInner />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
