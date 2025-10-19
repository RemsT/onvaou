import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CityLabel, CITY_LABELS } from '../types';

interface LabelSelectionFieldProps {
  selectedLabels: CityLabel[];
  onPress: () => void;
}

export default function LabelSelectionField({
  selectedLabels,
  onPress,
}: LabelSelectionFieldProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {selectedLabels.length === 0 ? (
          <Text style={styles.placeholder}>Sélectionner des centres d'intérêt...</Text>
        ) : (
          <View style={styles.selectedLabelsContainer}>
            {selectedLabels.slice(0, 3).map((label) => {
              const labelInfo = CITY_LABELS[label];
              return (
                <View
                  key={label}
                  style={[
                    styles.labelChip,
                    { backgroundColor: labelInfo.color + '20', borderColor: labelInfo.color }
                  ]}
                >
                  <Text style={styles.labelChipIcon}>{labelInfo.icon}</Text>
                  <Text
                    style={[styles.labelChipText, { color: labelInfo.color }]}
                    numberOfLines={1}
                  >
                    {labelInfo.name}
                  </Text>
                </View>
              );
            })}
            {selectedLabels.length > 3 && (
              <View style={styles.moreChip}>
                <Text style={styles.moreText}>+{selectedLabels.length - 3}</Text>
              </View>
            )}
          </View>
        )}
      </View>
      <Text style={styles.arrowIcon}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#E8EAED',
    minHeight: 48,
  },
  content: {
    flex: 1,
  },
  placeholder: {
    fontSize: 14,
    color: '#999',
  },
  selectedLabelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  labelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 120,
  },
  labelChipIcon: {
    fontSize: 12,
    marginRight: 3,
  },
  labelChipText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  moreChip: {
    backgroundColor: '#E8EAED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5F6368',
  },
  arrowIcon: {
    fontSize: 20,
    fontWeight: '300',
    color: '#5F6368',
    marginLeft: 6,
  },
});
