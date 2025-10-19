import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getEligibleCards } from '../../services/priceEstimation';

export default function DiscountCardSelector({ value, onChange, passengerAge }) {
  const eligibleCards = getEligibleCards(passengerAge);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Carte de réduction</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={value}
          onValueChange={onChange}
          style={styles.picker}
        >
          {eligibleCards.map((card) => (
            <Picker.Item key={card.key} label={card.name} value={card.key} />
          ))}
        </Picker>
      </View>
      {value !== 'NONE' && eligibleCards.find(c => c.key === value)?.annual_cost > 0 && (
        <Text style={styles.hint}>
          Coût annuel: {eligibleCards.find(c => c.key === value).annual_cost}€
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden'
  },
  picker: {
    height: 50
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic'
  }
});
