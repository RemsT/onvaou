import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LocalDatabaseService } from '../services/localDatabaseService';
import { DataImportService } from '../services/dataImportService';

interface DatabaseInitScreenProps {
  onInitializationComplete: () => void;
}

export default function DatabaseInitScreen({ onInitializationComplete }: DatabaseInitScreenProps) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [currentFile, setCurrentFile] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkInitializationStatus();
  }, []);

  const checkInitializationStatus = async () => {
    try {
      const status = await LocalDatabaseService.getInitializationStatus();

      if (status.isInitialized && !status.needsUpdate) {
        // Base de données déjà initialisée
        onInitializationComplete();
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error);
    }
  };

  const startInitialization = async () => {
    setIsInitializing(true);
    setError(null);
    setProgress(0);
    setStatus('Initialisation en cours...');

    try {
      await LocalDatabaseService.initialize();

      setStatus('Base de données initialisée avec succès !');
      setProgress(100);

      // Attendre 1 seconde puis passer à l'écran principal
      setTimeout(() => {
        onInitializationComplete();
      }, 1000);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
      setIsInitializing(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    startInitialization();
  };

  const downloadSize = DataImportService.getEstimatedDownloadSize();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <Text style={styles.logo}>ONvaOU</Text>
        <Text style={styles.subtitle}>Bienvenue !</Text>

        {!isInitializing && !error && (
          <>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Initialisation requise</Text>
              <Text style={styles.infoText}>
                Pour utiliser l'application, nous devons télécharger les horaires de train SNCF.
              </Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Taille estimée:</Text>
                <Text style={styles.infoValue}>{downloadSize} MB</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Temps estimé:</Text>
                <Text style={styles.infoValue}>2-5 minutes</Text>
              </View>
              <Text style={styles.infoNote}>
                Note: Cette opération nécessite une connexion Internet et n'est effectuée qu'une seule fois.
              </Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={startInitialization}>
              <Text style={styles.buttonText}>Commencer le téléchargement</Text>
            </TouchableOpacity>
          </>
        )}

        {isInitializing && (
          <>
            <View style={styles.progressCard}>
              <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />

              {currentFile && (
                <Text style={styles.currentFile}>Traitement: {currentFile}</Text>
              )}

              <View style={styles.progressBarContainer}>
                <View
                  style={[styles.progressBar, { width: `${progress}%` }]}
                />
              </View>

              <Text style={styles.progressText}>{Math.round(progress)}%</Text>

              {status && <Text style={styles.statusText}>{status}</Text>}
            </View>
          </>
        )}

        {error && (
          <>
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Erreur</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleRetry}>
              <Text style={styles.buttonText}>Réessayer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => Alert.alert(
                'Aide',
                'Vérifiez votre connexion Internet et réessayez. Si le problème persiste, contactez le support.'
              )}
            >
              <Text style={styles.secondaryButtonText}>Besoin d'aide ?</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: '#4CAF50',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0C3823',
    marginBottom: 40,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0C3823',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#5F6368',
    lineHeight: 22,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#5F6368',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#0C3823',
    fontWeight: '700',
  },
  infoNote: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 12,
    lineHeight: 18,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  loader: {
    marginBottom: 24,
  },
  currentFile: {
    fontSize: 14,
    color: '#5F6368',
    marginBottom: 16,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#E8EAED',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#5F6368',
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#C62828',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#D32F2F',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 15,
    fontWeight: '600',
  },
});
