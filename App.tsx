/**
 * Application principale avec initialisation automatique de la base de données GTFS
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigatorSimple';
import { DatabaseInitializationScreen } from './src/components/DatabaseInitializationScreen';
import { useGTFSInitialization } from './src/hooks/useGTFSInitialization';
import { SearchProvider } from './src/context/SearchContext';

export default function App() {
  const { isInitializing, progress } = useGTFSInitialization();

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
