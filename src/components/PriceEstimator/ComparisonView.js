import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ComparisonView({ results }) {
  if (!results || results.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comparaison des options</Text>
      {results.map((option, index) => (
        <View key={index} style={styles.optionCard}>
          <View style={styles.header}>
            <Text style={styles.trainName}>{option.name}</Text>
            {index === 0 && (
              <View style={styles.bestBadge}>
                <Text style={styles.bestText}>MEILLEUR PRIX</Text>
              </View>
            )}
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{option.estimatedPrice.toFixed(2)}€</Text>
            <Text style={styles.range}>
              {option.priceRange.min.toFixed(2)}€ - {option.priceRange.max.toFixed(2)}€
            </Text>
          </View>

          {option.breakdown.specialOffer && (
            <View style={styles.offerTag}>
              <Text style={styles.offerTagText}>
                Offre {option.breakdown.specialOffer}
              </Text>
            </View>
          )}

          <View style={styles.detailsRow}>
            <Text style={styles.detail}>
              Prix de base: {option.breakdown.basePrice.toFixed(2)}€
            </Text>
            <Text style={styles.detail}>
              Distance: {option.breakdown.distance} km
            </Text>
          </View>

          {index < results.length - 1 && (
            <View style={styles.separator} />
          )}
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 Les prix affichés sont des estimations basées sur les tarifs moyens SNCF
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16
  },
  optionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  trainName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  bestBadge: {
    backgroundColor: '#00CC66',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  bestText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold'
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0066FF'
  },
  range: {
    fontSize: 13,
    color: '#666'
  },
  offerTag: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12
  },
  offerTagText: {
    color: '#F57C00',
    fontSize: 12,
    fontWeight: '600'
  },
  detailsRow: {
    marginTop: 8
  },
  detail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 12
  },
  footer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F5F7FA',
    borderRadius: 8
  },
  footerText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18
  }
});
