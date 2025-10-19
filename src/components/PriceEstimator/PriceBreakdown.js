import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PriceBreakdown({ breakdown }) {
  const { basePrice, multipliers, priceBeforeDiscount, discountApplied, finalPrice } = breakdown;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Détail du calcul</Text>

      <View style={styles.breakdownCard}>
        <View style={styles.row}>
          <Text style={styles.label}>Prix de base</Text>
          <Text style={styles.value}>{basePrice.toFixed(2)}€</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Multiplicateurs appliqués:</Text>

        <View style={styles.multiplierRow}>
          <Text style={styles.multiplierLabel}>• Délai de réservation</Text>
          <Text style={styles.multiplierValue}>×{multipliers.bookingTime.toFixed(2)}</Text>
        </View>

        <View style={styles.multiplierRow}>
          <Text style={styles.multiplierLabel}>• Heure de départ</Text>
          <Text style={styles.multiplierValue}>×{multipliers.departureTime.toFixed(2)}</Text>
        </View>

        <View style={styles.multiplierRow}>
          <Text style={styles.multiplierLabel}>• Jour de la semaine</Text>
          <Text style={styles.multiplierValue}>×{multipliers.dayOfWeek.toFixed(2)}</Text>
        </View>

        <View style={styles.multiplierRow}>
          <Text style={styles.multiplierLabel}>• Période (vacances)</Text>
          <Text style={styles.multiplierValue}>×{multipliers.vacation.toFixed(2)}</Text>
        </View>

        <View style={styles.multiplierRow}>
          <Text style={styles.multiplierLabel}>• Taux de remplissage</Text>
          <Text style={styles.multiplierValue}>×{multipliers.capacity.toFixed(2)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.boldLabel}>Multiplicateur total</Text>
          <Text style={styles.boldValue}>×{multipliers.total.toFixed(2)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Prix avant réduction</Text>
          <Text style={styles.value}>{priceBeforeDiscount.toFixed(2)}€</Text>
        </View>

        {discountApplied > 0 && (
          <View style={styles.row}>
            <Text style={[styles.label, { color: '#00AA44' }]}>Réduction carte</Text>
            <Text style={[styles.value, { color: '#00AA44' }]}>
              -{discountApplied.toFixed(2)}€
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.finalLabel}>Prix final estimé</Text>
          <Text style={styles.finalValue}>{finalPrice.toFixed(2)}€</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  breakdownCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  label: {
    fontSize: 14,
    color: '#666'
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500'
  },
  boldLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '700'
  },
  boldValue: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '700'
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12
  },
  sectionTitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
    fontWeight: '600'
  },
  multiplierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingLeft: 8
  },
  multiplierLabel: {
    fontSize: 13,
    color: '#666'
  },
  multiplierValue: {
    fontSize: 13,
    color: '#0066FF',
    fontWeight: '600'
  },
  finalLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold'
  },
  finalValue: {
    fontSize: 20,
    color: '#0066FF',
    fontWeight: 'bold'
  }
});
