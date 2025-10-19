import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { CityLabel, CITY_LABELS } from '../types';

interface LabelSelectionModalProps {
  visible: boolean;
  selectedLabels: CityLabel[];
  onClose: (selectedLabels: CityLabel[]) => void;
}

export default function LabelSelectionModal({
  visible,
  selectedLabels,
  onClose,
}: LabelSelectionModalProps) {
  const [tempSelectedLabels, setTempSelectedLabels] = useState<CityLabel[]>(selectedLabels);

  const toggleLabel = (label: CityLabel) => {
    if (tempSelectedLabels.includes(label)) {
      setTempSelectedLabels(tempSelectedLabels.filter(l => l !== label));
    } else {
      setTempSelectedLabels([...tempSelectedLabels, label]);
    }
  };

  const handleConfirm = () => {
    onClose(tempSelectedLabels);
  };

  const handleCancel = () => {
    setTempSelectedLabels(selectedLabels);
    onClose(selectedLabels);
  };

  const handleClearAll = () => {
    setTempSelectedLabels([]);
  };

  const allLabels = Object.keys(CITY_LABELS) as CityLabel[];

  // Grouper les labels par catégorie
  const labelGroups = {
    'Activités & Nature': [
      'plage-mer',
      'sports-nautiques',
      'montagne',
      'randonnee',
      'nature-ecotourisme',
      'sports-hiver',
    ] as CityLabel[],
    'Culture & Patrimoine': [
      'culture-histoire',
      'art-architecture',
      'gastronomie',
      'oenologie',
    ] as CityLabel[],
    'Lifestyle & Détente': [
      'kid-friendly',
      'ville-thermale',
      'vie-nocturne',
      'shopping',
    ] as CityLabel[],
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <Pressable style={styles.overlay} onPress={handleCancel}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Centres d'intérêt</Text>
            <TouchableOpacity onPress={handleCancel}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <View style={styles.actionsBar}>
            <Text style={styles.selectedCount}>
              {tempSelectedLabels.length} sélectionné{tempSelectedLabels.length > 1 ? 's' : ''}
            </Text>
            {tempSelectedLabels.length > 0 && (
              <TouchableOpacity onPress={handleClearAll}>
                <Text style={styles.clearButton}>Tout effacer</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Content */}
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {Object.entries(labelGroups).map(([groupName, groupLabels]) => (
              <View key={groupName} style={styles.labelGroup}>
                <Text style={styles.groupTitle}>{groupName}</Text>
                {groupLabels.map((label) => {
                  const labelInfo = CITY_LABELS[label];
                  const isSelected = tempSelectedLabels.includes(label);

                  return (
                    <TouchableOpacity
                      key={label}
                      style={[
                        styles.checkboxRow,
                        isSelected && styles.checkboxRowSelected
                      ]}
                      onPress={() => toggleLabel(label)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.checkboxLeft}>
                        <View style={[
                          styles.checkbox,
                          isSelected && { backgroundColor: labelInfo.color, borderColor: labelInfo.color }
                        ]}>
                          {isSelected && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <Text style={styles.labelIcon}>{labelInfo.icon}</Text>
                        <Text style={styles.labelName}>{labelInfo.name}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>
                Valider ({tempSelectedLabels.length})
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0C3823',
  },
  closeButton: {
    fontSize: 24,
    color: '#5F6368',
    fontWeight: '300',
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F7F9FC',
  },
  selectedCount: {
    fontSize: 14,
    color: '#5F6368',
    fontWeight: '600',
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E74C3C',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  labelGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0C3823',
    marginBottom: 12,
    marginTop: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F7F9FC',
  },
  checkboxRowSelected: {
    backgroundColor: '#E8F5E9',
  },
  checkboxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#B0BEC5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  labelIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  labelName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0C3823',
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8EAED',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F7F9FC',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5F6368',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
