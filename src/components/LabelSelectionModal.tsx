import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { CityLabel, CITY_LABELS, UI_LABELS } from '../types';

interface LabelSelectionModalProps {
  visible: boolean;
  selectedLabels: CityLabel[];
  labelFilterMode: 'OR' | 'AND';
  hiddenLabels?: CityLabel[]; // labels non proposés (ex. 'velo' en mode à pied)
  onClose: (selectedLabels: CityLabel[], mode: 'OR' | 'AND') => void;
}

export default function LabelSelectionModal({
  visible,
  selectedLabels,
  labelFilterMode,
  hiddenLabels = [],
  onClose,
}: LabelSelectionModalProps) {
  const [tempSelected, setTempSelected] = useState<CityLabel[]>(selectedLabels);
  const [tempMode, setTempMode] = useState<'OR' | 'AND'>(labelFilterMode);
  const visibleLabels = UI_LABELS.filter(l => !hiddenLabels.includes(l));

  // Re-synchroniser avec les centres déjà sélectionnés à chaque ouverture
  useEffect(() => {
    if (visible) {
      setTempSelected(selectedLabels);
      setTempMode(labelFilterMode);
    }
  }, [visible]);

  const toggle = (label: CityLabel) => {
    setTempSelected(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={() => onClose(selectedLabels, labelFilterMode)}>
      <Pressable style={styles.overlay} onPress={() => onClose(selectedLabels, labelFilterMode)}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Centres d'intérêt</Text>
            <TouchableOpacity onPress={() => onClose(selectedLabels, labelFilterMode)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Clear */}
          <View style={styles.actionsBar}>
            <Text style={styles.countText}>
              {tempSelected.length} / {visibleLabels.length} sélectionné{tempSelected.length > 1 ? 's' : ''}
            </Text>
            <View style={styles.actionsButtons}>
              <TouchableOpacity onPress={() => setTempSelected([...visibleLabels])}>
                <Text style={styles.selectAllBtn}>Tout sélectionner</Text>
              </TouchableOpacity>
              {tempSelected.length > 0 && (
                <TouchableOpacity onPress={() => setTempSelected([])}>
                  <Text style={styles.clearBtn}>Effacer</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Labels */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {visibleLabels.map(label => {
              const info = CITY_LABELS[label];
              const selected = tempSelected.includes(label);
              return (
                <TouchableOpacity
                  key={label}
                  style={[styles.row, selected && styles.rowSelected]}
                  onPress={() => toggle(label)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, selected && { backgroundColor: '#4CAF50', borderColor: '#4CAF50' }]}>
                    {selected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.rowName}>{info.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => onClose(selectedLabels, labelFilterMode)}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={() => onClose(tempSelected, tempMode)}>
              <Text style={styles.confirmText}>Valider ({tempSelected.length})</Text>
            </TouchableOpacity>
          </View>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%', paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E8EAED' },
  title: { fontSize: 20, fontWeight: '700', color: '#0C3823' },
  closeBtn: { fontSize: 24, color: '#5F6368', fontWeight: '300' },
  actionsBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#F7F9FC' },
  actionsButtons: { flexDirection: 'row', gap: 12 },
  countText: { fontSize: 14, color: '#5F6368', fontWeight: '600' },
  selectAllBtn: { fontSize: 14, fontWeight: '600', color: '#4CAF50' },
  clearBtn: { fontSize: 14, fontWeight: '600', color: '#E74C3C' },
  content: { paddingHorizontal: 20, paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, marginBottom: 8, backgroundColor: '#F7F9FC' },
  rowSelected: { backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#C8E6C9' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#B0BEC5', backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkmark: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  rowName: { fontSize: 15, fontWeight: '600', color: '#0C3823', flex: 1 },
  modeSection: { paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#E8EAED' },
  modeLabel: { fontSize: 13, fontWeight: '600', color: '#5F6368', marginBottom: 8 },
  modeToggle: { flexDirection: 'row', gap: 8 },
  modeBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F7F9FC', alignItems: 'center', borderWidth: 1.5, borderColor: '#E8EAED' },
  modeBtnActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  modeBtnText: { fontSize: 13, fontWeight: '600', color: '#5F6368' },
  modeBtnTextActive: { color: '#2E7D32' },
  footer: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 12, gap: 12, borderTopWidth: 1, borderTopColor: '#E8EAED' },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F7F9FC', alignItems: 'center', borderWidth: 1, borderColor: '#E8EAED' },
  cancelText: { fontSize: 16, fontWeight: '600', color: '#5F6368' },
  confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#4CAF50', alignItems: 'center' },
  confirmText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
