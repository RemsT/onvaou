import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';

interface TimePickerModalProps {
  visible: boolean;
  initialValue?: string; // Format "HH:mm"
  onClose: (selectedTime: string | null) => void;
}

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;

export default function TimePickerModal({ visible, initialValue, onClose }: TimePickerModalProps) {
  // Generate time options in 15-minute intervals (00:15, 00:30, 00:45, 01:00, etc.)
  const generateTimeOptions = (): string[] => {
    const options: string[] = [];
    for (let hours = 0; hours <= 12; hours++) {
      for (let minutes = 0; minutes < 60; minutes += 15) {
        if (hours === 0 && minutes === 0) continue; // Skip 00:00
        const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        options.push(timeString);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const parseInitialValue = (value?: string): number => {
    if (!value) return 7; // Default to 02:00 (index 7)
    const index = timeOptions.indexOf(value);
    return index >= 0 ? index : 7;
  };

  const [selectedIndex, setSelectedIndex] = useState(parseInitialValue(initialValue));
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && scrollViewRef.current) {
      // Scroll to selected item when modal opens
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: selectedIndex * ITEM_HEIGHT,
          animated: false,
        });
      }, 100);
    }
  }, [visible]);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    setSelectedIndex(index);
  };

  const handleScrollBegin = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    setSelectedIndex(index);
  };

  const handleConfirm = () => {
    onClose(timeOptions[selectedIndex]);
  };

  const handleCancel = () => {
    onClose(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Temps de trajet maximum</Text>
          </View>

          <View style={styles.pickerContainer}>
            <View style={styles.wheelPickerWrapper}>
              {/* Scrollable wheel */}
              <ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onScroll={handleScroll}
                onScrollBeginDrag={handleScrollBegin}
                onMomentumScrollEnd={handleScroll}
                scrollEventThrottle={16}
                contentContainerStyle={{
                  paddingVertical: ITEM_HEIGHT * 2,
                }}
              >
                {timeOptions.map((time, index) => {
                  const isSelected = index === selectedIndex;
                  const [hours, minutes] = time.split(':');
                  const formattedTime = `${hours}h${minutes}`;
                  return (
                    <View key={time} style={styles.wheelItem}>
                      <Text
                        style={[
                          styles.wheelItemText,
                          isSelected && styles.wheelItemTextSelected,
                        ]}
                      >
                        {formattedTime}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: Dimensions.get('window').width - 60,
    maxWidth: 400,
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0C3823',
    textAlign: 'center',
  },
  pickerContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  wheelPickerWrapper: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    width: 200,
    position: 'relative',
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelItemText: {
    fontSize: 22,
    color: '#0C3823',
    fontWeight: '600',
  },
  wheelItemTextSelected: {
    fontSize: 26,
    color: '#4CAF50',
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E8EAED',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E8EAED',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5F6368',
  },
  confirmButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#4CAF50',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
