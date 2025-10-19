import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RecommendationsList({ recommendations }) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#FF6B35';
      case 'medium': return '#F7931E';
      case 'low': return '#00CC66';
      default: return '#999';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💡 Comment économiser</Text>
      {recommendations.map((rec, index) => (
        <View key={index} style={styles.recommendationCard}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{rec.icon}</Text>
          </View>
          <View style={styles.content}>
            <Text style={styles.message}>{rec.message}</Text>
            <Text style={[styles.saving, { color: getPriorityColor(rec.priority) }]}>
              Économie potentielle: ~{rec.potential_saving}€
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  recommendationCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2
  },
  iconContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: {
    fontSize: 28
  },
  content: {
    flex: 1
  },
  message: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 4
  },
  saving: {
    fontSize: 13,
    fontWeight: '600'
  }
});
