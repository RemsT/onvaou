import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CITY_LABELS, CityLabel } from '../types';
import { getStationLabels } from '../data/stationLabels';

interface StationLabelsProps {
  stationId: number;
  maxDisplay?: number;
  compact?: boolean;
}

export default function StationLabels({
  stationId,
  maxDisplay = 3,
  compact = false
}: StationLabelsProps) {
  const labels = getStationLabels(stationId);

  if (labels.length === 0) {
    return null;
  }

  const displayLabels = labels.slice(0, maxDisplay);
  const remainingCount = labels.length - maxDisplay;

  return (
    <View style={styles.container}>
      {displayLabels.map((label) => {
        const labelInfo = CITY_LABELS[label];
        return (
          <View
            key={label}
            style={[
              styles.labelBadge,
              compact && styles.labelBadgeCompact,
              { backgroundColor: labelInfo.color + '20', borderColor: labelInfo.color }
            ]}
          >
            {!compact && <Text style={styles.labelIcon}>{labelInfo.icon}</Text>}
            <Text style={[
              styles.labelText,
              compact && styles.labelTextCompact,
              { color: labelInfo.color }
            ]}>
              {labelInfo.name}
            </Text>
          </View>
        );
      })}
      {remainingCount > 0 && (
        <View style={[styles.labelBadge, styles.moreBadge]}>
          <Text style={styles.moreText}>+{remainingCount}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  labelBadgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  labelIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  labelTextCompact: {
    fontSize: 10,
  },
  moreBadge: {
    backgroundColor: '#F7F9FC',
    borderColor: '#B0BEC5',
  },
  moreText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5F6368',
  },
});
