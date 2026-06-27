import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Linking } from 'react-native';
import { CITY_LABELS, CityLabel } from '../types';
import { getStationData, getStationTags } from '../data/stationLabels';

interface StationLabelsProps {
  stationId: number | string;
  maxDisplay?: number;
  compact?: boolean;
}

export default function StationLabels({
  stationId,
  maxDisplay = 3,
  compact = false,
}: StationLabelsProps) {
  const [expandedLabel, setExpandedLabel] = useState<CityLabel | null>(null);

  // Passer l'id tel quel : getStationTags/resolveUic gère id interne, code UIC ET sncf_id complet.
  // (parseInt cassait un sncf_id type "stop_area:OCE:SA:87746008".)
  const tags = getStationTags(stationId);

  if (tags.length === 0) return null;

  const displayTags = tags.slice(0, maxDisplay);
  const remainingCount = tags.length - maxDisplay;
  const expandedTag = expandedLabel ? tags.find(t => t.label === expandedLabel) : null;

  const handleBadgePress = (label: CityLabel) => {
    if (compact) return;
    setExpandedLabel(prev => prev === label ? null : label);
  };

  return (
    <View>
      <View style={styles.container}>
        {displayTags.map((tag) => {
          const info = CITY_LABELS[tag.label];
          if (!info) return null;
          return (
            <TouchableOpacity
              key={tag.label}
              onPress={() => handleBadgePress(tag.label)}
              activeOpacity={compact ? 1 : 0.7}
              style={[
                styles.labelBadge,
                compact && styles.labelBadgeCompact,
                { backgroundColor: info.color + '20', borderColor: info.color },
                expandedLabel === tag.label && styles.labelBadgeExpanded,
              ]}
            >
              {!compact && (
                <Text style={[styles.labelText, { color: info.color }]}>{info.name}</Text>
              )}
            </TouchableOpacity>
          );
        })}
        {remainingCount > 0 && (
          <View style={[styles.labelBadge, styles.moreBadge]}>
            <Text style={styles.moreText}>+{remainingCount}</Text>
          </View>
        )}
      </View>

      {/* Expandable evidence panel */}
      {expandedTag && (
        <View style={[styles.evidencePanel, { borderLeftColor: CITY_LABELS[expandedTag.label]?.color }]}>
          <Text style={styles.evidenceReason}>{expandedTag.reason}</Text>
          {expandedTag.source ? (
            <TouchableOpacity onPress={() => Linking.openURL(expandedTag.source).catch(() => {})}>
              <Text style={[styles.evidenceLink, { color: CITY_LABELS[expandedTag.label]?.color }]}>
                {expandedTag.linkLabel || 'En savoir plus'} →
              </Text>
            </TouchableOpacity>
          ) : null}
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
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  labelBadgeExpanded: {
    opacity: 0.8,
  },
  labelIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '600',
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
  evidencePanel: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#F7F9FC',
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  evidenceReason: {
    fontSize: 12,
    color: '#333',
    lineHeight: 18,
    marginBottom: 4,
  },
  evidenceLink: {
    fontSize: 12,
    fontWeight: '700',
  },
});
