import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import PriceEstimator from '../components/PriceEstimator';

export default function PriceEstimationScreen({ route }) {
  const { originStation, destinationStation, distance } = route?.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <PriceEstimator
        initialRoute={
          originStation && destinationStation
            ? `${originStation}-${destinationStation}`
            : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA'
  }
});
