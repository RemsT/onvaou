/**
 * Application principale avec initialisation automatique de la base de données GTFS
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigatorSimple';
import { DatabaseInitializationScreen } from './src/components/DatabaseInitializationScreen';
import { useGTFSInitialization } from './src/hooks/useGTFSInitialization';
import { SearchProvider } from './src/context/SearchContext';
import { profilePreferencesService } from './src/services/profilePreferencesService';
import { setTrailPrefs } from './src/data/stationLabels';

export default function App() {
  const { isInitializing, progress } = useGTFSInitialization();

  // Charge les préférences de profil (plages rando/vélo, type, durée) et les pousse vers le filtre.
  useEffect(() => {
    profilePreferencesService.getPreferences().then(setTrailPrefs);
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
