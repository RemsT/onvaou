/**
 * Écran d'initialisation de la base de données
 * Affiché au premier lancement de l'application
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type { InitializationProgress } from '../services/gtfsInitializationService';

interface DatabaseInitializationScreenProps {
  progress: InitializationProgress;
}

export const DatabaseInitializationScreen: React.FC<DatabaseInitializationScreenProps> = ({
  progress
}) => {
  const getStepTitle = (step: string): string => {
    const titles: Record<string, string> = {
      start: 'Démarrage',
      structure: 'Création de la structure',
      import_stops: 'Import des gares',
      import_routes: 'Import des lignes',
      import_trips: 'Import des trajets',
      import_stop_times: 'Import des horaires',
      import_calendar: 'Import des calendriers',
      views: 'Création des vues',
      indexes: 'Optimisation',
      optimize: 'Finalisation',
      complete: 'Terminé',
      error: 'Erreur'
    };
    return titles[step] || step;
  };

  const isError = progress.step === 'error';
  const isComplete = progress.step === 'complete';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo ou icône */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🚂</Text>
        </View>

        {/* Titre */}
        <Text style={styles.title}>
          {isError
            ? 'Erreur d\'initialisation'
            : isComplete
            ? 'Prêt !'
            : 'Initialisation de la base de données'}
        </Text>

        {/* Message */}
        <Text style={[styles.message, isError && styles.errorMessage]}>
          {progress.message}
        </Text>

        {/* Barre de progression */}
        {!isError && !isComplete && (
          <>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${progress.progress}%` }
                ]}
              />
            </View>

            <Text style={styles.progressText}>
              {Math.round(progress.progress)}%
            </Text>

            {/* Spinner */}
            <ActivityIndicator size="large" color="#007AFF" style={styles.spinner} />

            {/* Étape actuelle */}
            <Text style={styles.stepText}>
              {getStepTitle(progress.step)}
            </Text>

            {/* Note pour les horaires */}
            {progress.step === 'import_stop_times' && (
              <Text style={styles.note}>
                Cette étape peut prendre 2-3 minutes...
              </Text>
            )}
          </>
        )}

        {/* État complet */}
        {isComplete && (
          <Text style={styles.completeIcon}>✅</Text>
        )}

        {/* État erreur */}
        {isError && (
          <>
            <Text style={styles.errorIcon}>❌</Text>
            <Text style={styles.errorHelp}>
              Veuillez redémarrer l'application.
              Si le problème persiste, réinstallez l'app.
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    width: '80%',
    alignItems: 'center'
  },
  iconContainer: {
    marginBottom: 30
  },
  icon: {
    fontSize: 80
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center'
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center'
  },
  errorMessage: {
    color: '#FF3B30'
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 20
  },
  spinner: {
    marginBottom: 20
  },
  stepText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center'
  },
  note: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 16,
    textAlign: 'center'
  },
  completeIcon: {
    fontSize: 60,
    marginTop: 20
  },
  errorIcon: {
    fontSize: 60,
    marginTop: 20,
    marginBottom: 20
  },
  errorHelp: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 12
  }
});
