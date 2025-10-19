import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PriceDisplay({ result }) {
  const { estimatedPrice, priceRange, currency, breakdown, travelInfo } = result;

  const getCapacityColor = (level) => {
    switch (level) {
      case 'almost_full': return '#FF4444';
      case 'high_demand': return '#FF8800';
      case 'moderate': return '#FFBB00';
      case 'available': return '#00CC66';
      case 'low_demand': return '#00AA44';
      default: return '#999';
    }
  };

  const getCapacityLabel = (level) => {
    switch (level) {
      case 'almost_full': return 'Quasi complet';
      case 'high_demand': return 'Forte demande';
      case 'moderate': return 'Demande modérée';
      case 'available': return 'Places disponibles';
      case 'low_demand': return 'Faible demande';
      default: return '';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.priceCard}>
        <Text style={styles.label}>Prix estimé</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{estimatedPrice.toFixed(2)}€</Text>
          {breakdown.specialOffer && (
            <View style={styles.offerBadge}>
              <Text style={styles.offerText}>{breakdown.specialOffer}</Text>
            </View>
          )}
        </View>

        <Text style={styles.rangeText}>
          Fourchette: {priceRange.min.toFixed(2)}€ - {priceRange.max.toFixed(2)}€
        </Text>

        {breakdown.discountApplied > 0 && (
          <View style={styles.savingsContainer}>
            <Text style={styles.savingsText}>
              ✓ Économie: {breakdown.discountApplied.toFixed(2)}€ avec votre carte
            </Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Réservation</Text>
            <Text style={styles.infoValue}>
              {travelInfo.daysUntilTravel === 0 ? 'Aujourd\'hui' :
               travelInfo.daysUntilTravel === 1 ? 'Demain' :
               `Dans ${travelInfo.daysUntilTravel} jours`}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Disponibilité</Text>
            <View style={styles.capacityBadge}>
              <View style={[
                styles.capacityDot,
                { backgroundColor: getCapacityColor(travelInfo.capacityLevel) }
              ]} />
              <Text style={[
                styles.infoValue,
                { color: getCapacityColor(travelInfo.capacityLevel) }
              ]}>
                {getCapacityLabel(travelInfo.capacityLevel)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20
  },
  priceCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#0066FF'
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600'
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  price: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#0066FF'
  },
  offerBadge: {
    marginLeft: 12,
    backgroundColor: '#00CC66',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  offerText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  rangeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16
  },
  savingsContainer: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  savingsText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600'
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0'
  },
  infoItem: {
    flex: 1
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600'
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  capacityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6
  }
});
