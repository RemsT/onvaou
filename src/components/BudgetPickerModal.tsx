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

interface BudgetPickerModalProps {
  visible: boolean;
  initialValue?: number;
  onClose: (selectedBudget: number | null) => void;
}

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;

export default function BudgetPickerModal({ visible, initialValue, onClose }: BudgetPickerModalProps) {
  // Generate budget options in 5€ intervals (5, 10, 15, 20, ..., 200)
  const generateBudgetOptions = (): number[] => {
    const options: number[] = [];
    for (let budget = 5; budget <= 200; budget += 5) {
      options.push(budget);
    }
    return options;
  };

  const budgetOptions = generateBudgetOptions();

  const parseInitialValue = (value?: number): number => {
    if (!value) return 5; // Default to 30€ (index 5)
    const index = budgetOptions.indexOf(value);
    return index >= 0 ? index : 5;
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
    onClose(budgetOptions[selectedIndex]);
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
            <Text style={styles.title}>Budget</Text>
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
                {budgetOptions.map((budget, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <TouchableOpacity
                      key={budget}
                      style={styles.wheelItem}
                      onPress={() => {
                        scrollViewRef.current?.scrollTo({
                          y: index * ITEM_HEIGHT,
                          animated: true,
                        });
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.wheelItemText,
                          isSelected && styles.wheelItemTextSelected,
                        ]}
                      >
                        {budget} €
                      </Text>
                    </TouchableOpacity>
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
