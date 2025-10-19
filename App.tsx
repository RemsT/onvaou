/**
 * Application principale avec initialisation automatique de la base de données GTFS
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigatorSimple';
import { DatabaseInitializationScreen } from './src/components/DatabaseInitializationScreen';
import { useGTFSInitialization } from './src/hooks/useGTFSInitialization';

export default function App() {
  const { isInitializing, progress } = useGTFSInitialization();

  // Afficher l'écran d'initialisation si la DB n'est pas prête
  if (isInitializing) {
    return <DatabaseInitializationScreen progress={progress} />;
  }

  // Afficher l'application normale une fois la DB prête
  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}
