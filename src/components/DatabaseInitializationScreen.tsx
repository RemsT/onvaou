/**
 * Écran d'initialisation de la base de données
 * Affiché au premier lancement et lors des mises à jour GTFS
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { InitializationProgress } from '../services/gtfsInitializationService';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TRAIN_WIDTH = 60; // largeur approximative de l'emoji train

interface DatabaseInitializationScreenProps {
  progress: InitializationProgress;
}

// Étapes qui correspondent à un téléchargement réseau
const DOWNLOAD_STEPS = new Set(['download', 'extract', 'reimport']);

export const DatabaseInitializationScreen: React.FC<DatabaseInitializationScreenProps> = ({
  progress
}) => {
  const trainAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  const isDownloadStep = DOWNLOAD_STEPS.has(progress.step);
  const isError = progress.step === 'error';
  const isComplete = progress.step === 'complete';

  // Animation du train qui traverse l'écran (steps de téléchargement)
  useEffect(() => {
    loopRef.current?.stop();
    trainAnim.setValue(0);

    if (!isDownloadStep || isError || isComplete) return;

    loopRef.current = Animated.loop(
      Animated.timing(trainAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loopRef.current.start();

    return () => loopRef.current?.stop();
  }, [isDownloadStep, isError, isComplete]);

  // Animation de pulsation pour l'icône principale (autres steps)
  useEffect(() => {
    if (isDownloadStep || isError || isComplete) {
      pulseAnim.setValue(1);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [isDownloadStep, isError, isComplete]);

  const trainTranslateX = trainAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-TRAIN_WIDTH, SCREEN_WIDTH + TRAIN_WIDTH],
  });

  const getStepTitle = (step: string): string => {
    const titles: Record<string, string> = {
      start: 'Démarrage',
      download: 'Téléchargement',
      extract: 'Extraction',
      reimport: 'Mise à jour de la base',
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
      error: 'Erreur',
    };
    return titles[step] || step;
  };

  const getBarColor = (): string => {
    if (isError) return '#FF3B30';
    if (isComplete) return '#34C759';
    if (isDownloadStep) return '#2196F3';
    return '#4CAF50';
  };

  const getMainTitle = (): string => {
    if (isError) return 'Erreur';
    if (isComplete) return 'Prêt !';
    if (isDownloadStep) return 'Mise à jour des horaires';
    return 'Préparation des données';
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>

        {/* Icône principale (pulsante hors téléchargement) */}
        {!isDownloadStep && (
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
            {isError
              ? <Ionicons name="alert-circle" size={72} color="#FF3B30" />
              : isComplete
              ? <Ionicons name="checkmark-circle" size={72} color="#34C759" />
              : <MaterialCommunityIcons name="train" size={72} color="#0C3823" />
            }
          </Animated.View>
        )}

        {/* Titre principal */}
        <Text style={[styles.title, isError && styles.titleError]}>
          {getMainTitle()}
        </Text>

        {/* Message détaillé */}
        <Text style={[styles.message, isError && styles.messageError]}>
          {progress.message}
        </Text>

        {/* ── Section téléchargement : train animé ── */}
        {isDownloadStep && !isError && !isComplete && (
          <View style={styles.trackSection}>
            {/* Label de l'étape */}
            <Text style={styles.downloadStepLabel}>
              {getStepTitle(progress.step)}…
            </Text>

            {/* Voie ferrée + train */}
            <View style={styles.trackWrapper}>
              {/* Rails */}
              <View style={styles.rail} />
              {/* Traverses */}
              {Array.from({ length: 10 }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.sleeper, { left: `${i * 11}%` as any }]}
                />
              ))}
              {/* Train animé */}
              <Animated.View
                style={[
                  styles.trainEmoji,
                  { transform: [{ translateX: trainTranslateX }] },
                ]}
              >
                <MaterialCommunityIcons name="train-car" size={36} color="#1565C0" />
              </Animated.View>
            </View>

            <Text style={styles.downloadHint}>
              Connexion internet requise · données SNCF en cours de récupération
            </Text>
          </View>
        )}

        {/* ── Section import local : barre de progression + spinner ── */}
        {!isDownloadStep && !isError && !isComplete && (
          <>
            <View style={styles.progressBarContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: `${progress.progress}%`,
                    backgroundColor: getBarColor(),
                  },
                ]}
              />
            </View>

            <Text style={[styles.progressText, { color: getBarColor() }]}>
              {Math.round(progress.progress)}%
            </Text>

            <ActivityIndicator
              size="large"
              color={getBarColor()}
              style={styles.spinner}
            />

            <Text style={styles.stepText}>{getStepTitle(progress.step)}</Text>

            {progress.step === 'import_stop_times' && (
              <Text style={styles.note}>
                Cette étape peut prendre quelques minutes…
              </Text>
            )}
          </>
        )}

        {/* ── Barre de progression pour les steps de téléchargement ── */}
        {isDownloadStep && !isError && !isComplete && progress.progress > 0 && (
          <View style={styles.downloadProgressContainer}>
            <View style={styles.downloadProgressBg}>
              <Animated.View
                style={[
                  styles.downloadProgressFill,
                  { width: `${progress.progress}%` },
                ]}
              />
            </View>
            <Text style={styles.downloadProgressText}>
              {Math.round(progress.progress)}%
            </Text>
          </View>
        )}

        {/* ── Terminé ── */}
        {isComplete && (
          <Ionicons name="checkmark-circle" size={64} color="#34C759" style={styles.completeIcon} />
        )}

        {/* ── Erreur ── */}
        {isError && (
          <>
            <Ionicons name="close-circle" size={64} color="#FF3B30" style={styles.errorIcon} />
            <Text style={styles.errorHelp}>
              Veuillez redémarrer l'application.{'\n'}
              Si le problème persiste, vérifiez votre connexion ou réinstallez l'app.
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
    backgroundColor: '#F7F9FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '85%',
    alignItems: 'center',
  },

  // Icône & titre
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0C3823',
    marginBottom: 12,
    textAlign: 'center',
  },
  titleError: {
    color: '#FF3B30',
  },
  message: {
    fontSize: 14,
    color: '#5F6368',
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 20,
  },
  messageError: {
    color: '#FF3B30',
  },

  // ── Train animé ──
  trackSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  downloadStepLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trackWrapper: {
    width: SCREEN_WIDTH * 0.85,
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 16,
  },
  rail: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#B0BEC5',
    borderRadius: 2,
    top: '50%',
    marginTop: 10,
  },
  sleeper: {
    position: 'absolute',
    width: 6,
    height: 14,
    backgroundColor: '#90A4AE',
    borderRadius: 1,
    top: '50%',
    marginTop: 4,
  },
  trainEmoji: {
    position: 'absolute',
    top: 6,
  },
  downloadHint: {
    fontSize: 11,
    color: '#90A4AE',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Barre de progression download
  downloadProgressContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  downloadProgressBg: {
    width: '100%',
    height: 6,
    backgroundColor: '#BBDEFB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  downloadProgressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 3,
  },
  downloadProgressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2196F3',
  },

  // ── Import local ──
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  spinner: {
    marginBottom: 16,
  },
  stepText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
  },
  note: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },

  // ── États finaux ──
  completeIcon: {
    marginTop: 16,
  },
  errorIcon: {
    marginTop: 16,
    marginBottom: 16,
  },
  errorHelp: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
});
