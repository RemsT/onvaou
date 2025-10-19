import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';

interface TimeRange {
  startHour: number;
  endHour: number;
}

interface TimeRangePickerProps {
  value: TimeRange | null;
  onChange: (range: TimeRange) => void;
  label?: string;
}

const TimeRangePicker: React.FC<TimeRangePickerProps> = ({
  value,
  onChange,
  label,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [tempRange, setTempRange] = useState<TimeRange>(
    value || { startHour: 8, endHour: 20 }
  );
  const [editingMode, setEditingMode] = useState<'start' | 'end'>('start');

  const formatHour = (hour: number): string => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const formatTimeRange = (range: TimeRange): string => {
    return `${formatHour(range.startHour)} - ${formatHour(range.endHour)}`;
  };

  const confirmTimeRange = () => {
    // Vérifier que l'heure de fin est après l'heure de début
    if (tempRange.endHour <= tempRange.startHour) {
      // Ajuster automatiquement
      const adjustedRange = {
        ...tempRange,
        endHour: Math.min(tempRange.startHour + 4, 23)
      };
      setTempRange(adjustedRange);
      onChange(adjustedRange);
    } else {
      onChange(tempRange);
    }
    setShowModal(false);
  };

  const cancelSelection = () => {
    setTempRange(value || { startHour: 8, endHour: 20 });
    setShowModal(false);
  };

  const openModal = () => {
    const rangeToUse = value || { startHour: 8, endHour: 20 };
    setTempRange(rangeToUse);
    setEditingMode('start');
    setShowModal(true);
  };

  const handleHourSelect = (hour: number) => {
    if (editingMode === 'start') {
      setTempRange({ ...tempRange, startHour: hour });
      // Auto-ajuster l'heure de fin si nécessaire
      if (hour >= tempRange.endHour) {
        setTempRange({
          startHour: hour,
          endHour: Math.min(hour + 4, 23)
        });
      }
    } else {
      // S'assurer que l'heure de fin est après l'heure de début
      if (hour > tempRange.startHour) {
        setTempRange({ ...tempRange, endHour: hour });
      }
    }
  };

  // Générer les heures (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const renderHourPicker = () => {
    const isStartMode = editingMode === 'start';
    const selectedHour = isStartMode ? tempRange.startHour : tempRange.endHour;

    return (
      <ScrollView style={styles.hourScrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.hoursGrid}>
          {hours.map((hour) => {
            const isSelected = hour === selectedHour;
            const isDisabled = !isStartMode && hour <= tempRange.startHour;

            return (
              <TouchableOpacity
                key={hour}
                style={[
                  styles.hourCell,
                  isSelected && styles.hourCellSelected,
                  isDisabled && styles.hourCellDisabled,
                ]}
                onPress={() => handleHourSelect(hour)}
                disabled={isDisabled}
              >
                <Text style={[
                  styles.hourText,
                  isSelected && styles.hourTextSelected,
                  isDisabled && styles.hourTextDisabled,
                ]}>
                  {hour.toString().padStart(2, '0')}:00
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Bouton principal */}
      {value ? (
        <View style={styles.selectedRangeCard}>
          <View style={styles.rangeInfo}>
            <Text style={styles.rangeLabel}>Créneau horaire</Text>
            <Text style={styles.rangeValue}>{formatTimeRange(value)}</Text>
          </View>
          <TouchableOpacity
            onPress={openModal}
            style={styles.modifyButton}
          >
            <Text style={styles.modifyButtonText}>Modifier</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={openModal}
          activeOpacity={0.7}
        >
          <Text style={styles.emptyButtonText}>Sélectionner un créneau horaire</Text>
        </TouchableOpacity>
      )}

      {/* Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={cancelSelection}
          />
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={cancelSelection} style={styles.headerButton}>
                <Text style={styles.cancelButton}>Annuler</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Créneau horaire</Text>
              <TouchableOpacity onPress={confirmTimeRange} style={styles.headerButton}>
                <Text style={styles.confirmButton}>OK</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Preview Card */}
              <View style={styles.previewCard}>
                <TouchableOpacity
                  style={[styles.previewRow, editingMode === 'start' && styles.previewRowActive]}
                  onPress={() => setEditingMode('start')}
                >
                  <View style={styles.previewTextContainer}>
                    <Text style={styles.previewLabel}>Heure de départ (min)</Text>
                    <Text style={styles.previewValue}>{formatHour(tempRange.startHour)}</Text>
                  </View>
                  {editingMode === 'start' && <Text style={styles.activeIndicator}>✓</Text>}
                </TouchableOpacity>
                <View style={styles.previewDivider} />
                <TouchableOpacity
                  style={[styles.previewRow, editingMode === 'end' && styles.previewRowActive]}
                  onPress={() => setEditingMode('end')}
                >
                  <View style={styles.previewTextContainer}>
                    <Text style={styles.previewLabel}>Heure de départ (max)</Text>
                    <Text style={styles.previewValue}>{formatHour(tempRange.endHour)}</Text>
                  </View>
                  {editingMode === 'end' && <Text style={styles.activeIndicator}>✓</Text>}
                </TouchableOpacity>
              </View>

              {/* Info Text */}
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  {editingMode === 'start'
                    ? '📅 Sélectionnez l\'heure de départ minimale'
                    : '📅 Sélectionnez l\'heure de départ maximale'}
                </Text>
              </View>

              {/* Picker Section */}
              <View style={styles.pickerSection}>
                {renderHourPicker()}
              </View>

              {/* Current Range Display */}
              <View style={styles.currentRangeDisplay}>
                <Text style={styles.currentRangeLabel}>Créneau sélectionné :</Text>
                <Text style={styles.currentRangeValue}>
                  {formatTimeRange(tempRange)}
                </Text>
                <Text style={styles.currentRangeHint}>
                  Trains partant entre {formatHour(tempRange.startHour)} et {formatHour(tempRange.endHour)}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    color: '#0C3823',
  },

  // État vide (non sélectionné)
  emptyButton: {
    backgroundColor: '#F7F9FC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#E8EAED',
  },
  emptyButtonText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },

  // État sélectionné
  selectedRangeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  rangeInfo: {
    flex: 1,
  },
  rangeLabel: {
    fontSize: 12,
    color: '#5F6368',
    marginBottom: 4,
    fontWeight: '500',
  },
  rangeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0C3823',
  },
  modifyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  modifyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#F7F9FC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  headerButton: {
    minWidth: 70,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0C3823',
  },
  cancelButton: {
    fontSize: 16,
    color: '#5F6368',
    fontWeight: '500',
  },
  confirmButton: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '700',
    textAlign: 'right',
  },

  // Preview Card
  previewCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  previewRowActive: {
    backgroundColor: '#E8F5E9',
  },
  previewDivider: {
    height: 1,
    backgroundColor: '#E8EAED',
    marginHorizontal: 16,
  },
  previewTextContainer: {
    flex: 1,
  },
  previewLabel: {
    fontSize: 12,
    color: '#5F6368',
    marginBottom: 2,
    fontWeight: '500',
  },
  previewValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0C3823',
  },
  activeIndicator: {
    fontSize: 20,
    color: '#4CAF50',
    fontWeight: '700',
  },

  // Info Box
  infoBox: {
    backgroundColor: '#E3F2FD',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    padding: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#1565C0',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Picker section
  pickerSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },

  // Heure Picker
  hourScrollView: {
    maxHeight: 300,
  },
  hoursGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hourCell: {
    width: '22%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#F7F9FC',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  hourCellSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  hourCellDisabled: {
    backgroundColor: '#F0F0F0',
    opacity: 0.5,
  },
  hourText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C3823',
  },
  hourTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  hourTextDisabled: {
    color: '#B0BEC5',
  },

  // Current Range Display
  currentRangeDisplay: {
    backgroundColor: '#4CAF50',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  currentRangeLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 4,
    fontWeight: '500',
  },
  currentRangeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  currentRangeHint: {
    fontSize: 11,
    color: '#E8F5E9',
    fontWeight: '500',
  },
});

export default TimeRangePicker;
