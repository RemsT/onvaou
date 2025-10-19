import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { estimateTrainPrice, compareTrainOptions } from '../../services/priceEstimation';
import TripInputForm from './TripInputForm';
import PriceDisplay from './PriceDisplay';
import PriceBreakdown from './PriceBreakdown';
import RecommendationsList from './RecommendationsList';
import ComparisonView from './ComparisonView';

export default function PriceEstimator({ initialRoute = null }) {
  const [loading, setLoading] = useState(false);
  const [priceResult, setPriceResult] = useState(null);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const handleEstimate = async (params) => {
    setLoading(true);
    try {
      // Simuler un délai réseau pour l'UX
      await new Promise(resolve => setTimeout(resolve, 500));

      const result = estimateTrainPrice(params);
      setPriceResult(result);
      setShowComparison(false);
      setComparisonResults(null);
    } catch (error) {
      console.error('Erreur estimation prix:', error);
      alert('Erreur lors du calcul du prix');
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async (params) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const results = compareTrainOptions(params);
      setComparisonResults(results);
      setShowComparison(true);
      setPriceResult(null);
    } catch (error) {
      console.error('Erreur comparaison:', error);
      alert('Erreur lors de la comparaison');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Estimation Prix SNCF</Text>
        <Text style={styles.subtitle}>Prix estimés basés sur la tarification réelle</Text>
      </View>

      <TripInputForm
        onEstimate={handleEstimate}
        onCompare={handleCompare}
        initialRoute={initialRoute}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Calcul en cours...</Text>
        </View>
      )}

      {!loading && priceResult && !showComparison && (
        <>
          <PriceDisplay result={priceResult} />

          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => setShowBreakdown(!showBreakdown)}
          >
            <Text style={styles.detailsButtonText}>
              {showBreakdown ? '▼ Masquer les détails' : '► Voir le détail du calcul'}
            </Text>
          </TouchableOpacity>

          {showBreakdown && <PriceBreakdown breakdown={priceResult.breakdown} />}

          {priceResult.recommendations && priceResult.recommendations.length > 0 && (
            <RecommendationsList recommendations={priceResult.recommendations} />
          )}
        </>
      )}

      {!loading && showComparison && comparisonResults && (
        <ComparisonView results={comparisonResults} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA'
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40
  },
  header: {
    marginBottom: 20,
    alignItems: 'center'
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  },
  loadingContainer: {
    marginTop: 40,
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666'
  },
  detailsButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  detailsButtonText: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '600',
    textAlign: 'center'
  }
});
