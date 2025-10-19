import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LocalDatabaseService } from '../services/localDatabaseService';

export default function DatabaseTestScreen() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    checkStatus();
  }, []);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    console.log(message);
  };

  const checkStatus = async () => {
    const status = await LocalDatabaseService.getInitializationStatus();
    setIsInitialized(status.isInitialized && !status.needsUpdate);
    addLog(`Status: ${status.isInitialized ? 'Initialisée' : 'Non initialisée'}`);
  };

  const handleInitialize = async () => {
    setIsInitializing(true);
    setLogs([]);
    addLog('Démarrage de l\'initialisation...');

    try {
      await LocalDatabaseService.initialize();
      addLog('✅ Initialisation terminée avec succès!');
      setIsInitialized(true);
      await loadStats();
    } catch (error) {
      addLog(`❌ Erreur: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleReset = async () => {
    addLog('Réinitialisation de la base de données...');
    await LocalDatabaseService.reset();
    setIsInitialized(false);
    setStats(null);
    setSearchResults([]);
    addLog('✅ Base réinitialisée');
  };

  const loadStats = async () => {
    try {
      const stops = await LocalDatabaseService.getAllStations();
      setStats({
        totalStations: stops.length,
      });
      addLog(`📊 ${stops.length} gares dans la base`);
    } catch (error) {
      addLog(`Erreur chargement stats: ${error}`);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    addLog(`Recherche: "${searchQuery}"`);
    try {
      const results = await LocalDatabaseService.searchStations(searchQuery, 20);
      setSearchResults(results);
      addLog(`✅ ${results.length} résultats trouvés`);
    } catch (error) {
      addLog(`❌ Erreur recherche: ${error}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Test Base de Données</Text>
        <Text style={styles.subtitle}>
          {isInitialized ? '✅ Base initialisée' : '⚠️  Base non initialisée'}
        </Text>
      </View>

      {/* Boutons d'action */}
      <View style={styles.actionsCard}>
        {!isInitialized && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, isInitializing && styles.buttonDisabled]}
            onPress={handleInitialize}
            disabled={isInitializing}
          >
            {isInitializing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Initialiser la Base</Text>
            )}
          </TouchableOpacity>
        )}

        {isInitialized && (
          <>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={loadStats}
            >
              <Text style={styles.buttonText}>📊 Charger les Stats</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={handleReset}
            >
              <Text style={styles.buttonText}>🗑️ Réinitialiser</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Statistiques */}
      {stats && (
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Statistiques</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Gares totales:</Text>
            <Text style={styles.statValue}>{stats.totalStations}</Text>
          </View>
        </View>
      )}

      {/* Recherche */}
      {isInitialized && (
        <View style={styles.searchCard}>
          <Text style={styles.cardTitle}>Recherche de Gares</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Nom de gare (ex: Paris)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>🔍</Text>
            </TouchableOpacity>
          </View>

          {searchResults.length > 0 && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Résultats ({searchResults.length}):</Text>
              {searchResults.map((station, index) => (
                <View key={index} style={styles.resultItem}>
                  <Text style={styles.resultName}>{station.stop_name}</Text>
                  <Text style={styles.resultDetails}>
                    ID: {station.stop_id}
                  </Text>
                  {station.stop_lat && station.stop_lon && (
                    <Text style={styles.resultDetails}>
                      📍 {station.stop_lat.toFixed(4)}, {station.stop_lon.toFixed(4)}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Logs */}
      <View style={styles.logsCard}>
        <Text style={styles.cardTitle}>Logs</Text>
        <ScrollView style={styles.logsContainer} nestedScrollEnabled>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logText}>{log}</Text>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0C3823',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#5F6368',
  },
  actionsCard: {
    margin: 16,
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  secondaryButton: {
    backgroundColor: '#2196F3',
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0C3823',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#5F6368',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0C3823',
  },
  searchCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  searchButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 20,
  },
  resultsContainer: {
    marginTop: 16,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5F6368',
    marginBottom: 8,
  },
  resultItem: {
    backgroundColor: '#F7F9FC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0C3823',
    marginBottom: 4,
  },
  resultDetails: {
    fontSize: 12,
    color: '#5F6368',
  },
  logsCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    maxHeight: 300,
  },
  logsContainer: {
    maxHeight: 200,
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#0C3823',
    marginBottom: 4,
  },
});
