import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';

interface DateTimePickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  label?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  timeRangeStart?: string;
  timeRangeEnd?: string;
  onTimeRangeChange?: (start: string, end: string) => void;
  disabled?: boolean;
}

const CustomDateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  label,
  minimumDate,
  timeRangeStart = '00:00',
  timeRangeEnd = '23:59',
  onTimeRangeChange,
  disabled = false,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [tempDate, setTempDate] = useState(value || new Date());
  const [editingMode, setEditingMode] = useState<'date' | 'time' | 'timeRange'>('date');
  const [currentMonth, setCurrentMonth] = useState(new Date(value || new Date()));
  const [tempTimeRangeStart, setTempTimeRangeStart] = useState(timeRangeStart);
  const [tempTimeRangeEnd, setTempTimeRangeEnd] = useState(timeRangeEnd);
  const [selectedStartIndex, setSelectedStartIndex] = useState(0);
  const [selectedEndIndex, setSelectedEndIndex] = useState(0);
  const scrollViewStartRef = useRef<ScrollView>(null);
  const scrollViewEndRef = useRef<ScrollView>(null);

  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    return `${hours}:00`;
  };

  const formatMonthYear = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      year: 'numeric'
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  const confirmDateTime = () => {
    onChange(tempDate);
    if (onTimeRangeChange) {
      onTimeRangeChange(tempTimeRangeStart, tempTimeRangeEnd);
    }
    setShowModal(false);
  };

  const cancelSelection = () => {
    setTempDate(value || new Date());
    setTempTimeRangeStart(timeRangeStart);
    setTempTimeRangeEnd(timeRangeEnd);
    setShowModal(false);
  };

  const openModal = () => {
    const dateToUse = value || new Date();
    setTempDate(dateToUse);
    setCurrentMonth(new Date(dateToUse));
    setTempTimeRangeStart(timeRangeStart);
    setTempTimeRangeEnd(timeRangeEnd);
    setEditingMode('date');
    setShowModal(true);
  };

  // Générer les jours du calendrier
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (Date | null)[] = [];

    // Ajouter les jours vides au début
    for (let i = 0; i < (startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1); i++) {
      days.push(null);
    }

    // Ajouter les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isDateDisabled = (date: Date | null): boolean => {
    if (!date) return true;
    if (minimumDate && date < minimumDate) return true;
    return false;
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const handleDateSelect = (date: Date) => {
    const newDate = new Date(tempDate);
    newDate.setFullYear(date.getFullYear());
    newDate.setMonth(date.getMonth());
    newDate.setDate(date.getDate());
    setTempDate(newDate);
  };

  const handleHourSelect = (hour: number) => {
    const newDate = new Date(tempDate);
    newDate.setHours(hour);
    newDate.setMinutes(0);
    newDate.setSeconds(0);
    setTempDate(newDate);
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Générer les heures (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Fonction pour gérer la sélection des heures de la plage
  const handleTimeRangeStartSelect = (hour: number) => {
    const newTime = `${hour.toString().padStart(2, '0')}:00`;
    setTempTimeRangeStart(newTime);
  };

  const handleTimeRangeEndSelect = (hour: number) => {
    const newTime = `${hour.toString().padStart(2, '0')}:00`;
    setTempTimeRangeEnd(newTime);
  };

  const parseHourFromTime = (time: string): number => {
    const parts = time.split(':');
    return parseInt(parts[0], 10);
  };

  const renderCalendar = () => {
    const days = generateCalendarDays();
    const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

    return (
      <View style={styles.calendarContainer}>
        {/* Header du calendrier */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={previousMonth} style={styles.monthButton}>
            <Text style={styles.monthButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthYear}>{formatMonthYear(currentMonth)}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.monthButton}>
            <Text style={styles.monthButtonText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Jours de la semaine */}
        <View style={styles.weekDaysContainer}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.weekDay}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Grille des jours */}
        <View style={styles.daysGrid}>
          {days.map((day, index) => {
            const isDisabled = isDateDisabled(day);
            const isSelected = day && isSameDay(day, tempDate);
            const isToday = day && isSameDay(day, new Date());

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellSelected,
                  isToday && !isSelected && styles.dayCellToday,
                  isDisabled && styles.dayCellDisabled,
                ]}
                onPress={() => day && !isDisabled && handleDateSelect(day)}
                disabled={isDisabled}
              >
                {day && (
                  <Text style={[
                    styles.dayText,
                    isSelected && styles.dayTextSelected,
                    isToday && !isSelected && styles.dayTextToday,
                    isDisabled && styles.dayTextDisabled,
                  ]}>
                    {day.getDate()}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderHourPicker = () => {
    return (
      <ScrollView style={styles.hourScrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.hoursGrid}>
          {hours.map((hour) => {
            const isSelected = hour === tempDate.getHours();
            return (
              <TouchableOpacity
                key={hour}
                style={[
                  styles.hourCell,
                  isSelected && styles.hourCellSelected,
                ]}
                onPress={() => handleHourSelect(hour)}
              >
                <Text style={[
                  styles.hourText,
                  isSelected && styles.hourTextSelected,
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

  const ITEM_HEIGHT = 50;
  const VISIBLE_ITEMS = 5;

  useEffect(() => {
    if (editingMode === 'timeRange') {
      const startHour = parseHourFromTime(tempTimeRangeStart);
      const endHour = parseHourFromTime(tempTimeRangeEnd);

      if (startHour !== selectedStartIndex) {
        setSelectedStartIndex(startHour);
      }
      if (endHour !== selectedEndIndex) {
        setSelectedEndIndex(endHour);
      }

      setTimeout(() => {
        scrollViewStartRef.current?.scrollTo({
          y: startHour * ITEM_HEIGHT,
          animated: false,
        });
        scrollViewEndRef.current?.scrollTo({
          y: endHour * ITEM_HEIGHT,
          animated: false,
        });
      }, 100);
    }
  }, [editingMode]);

  const handleScrollStart = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    if (index !== selectedStartIndex) {
      setSelectedStartIndex(index);
      handleTimeRangeStartSelect(index);
    }
  };

  const handleScrollEnd = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    if (index !== selectedEndIndex) {
      setSelectedEndIndex(index);
      handleTimeRangeEndSelect(index);
    }
  };

  // Vérifier si l'heure de fin est invalide (inférieure ou égale à l'heure de début)
  const isTimeRangeValid = () => {
    const startHour = parseHourFromTime(tempTimeRangeStart);
    const endHour = parseHourFromTime(tempTimeRangeEnd);
    return endHour > startHour;
  };

  const renderTimeRangePicker = () => {
    return (
      <View style={styles.timeRangePickerContainer}>
        {/* Heure de début */}
        <View style={styles.wheelPickerSection}>
          <Text style={styles.wheelPickerLabel}>Heure de début</Text>
          <View style={styles.wheelPickerWrapper}>
            <ScrollView
              ref={scrollViewStartRef}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onScroll={handleScrollStart}
              scrollEventThrottle={16}
              contentContainerStyle={{
                paddingVertical: ITEM_HEIGHT * 2,
              }}
            >
              {hours.map((hour, index) => {
                const isSelected = index === selectedStartIndex;
                return (
                  <TouchableOpacity
                    key={`start-${hour}`}
                    style={styles.wheelItem}
                    onPress={() => {
                      scrollViewStartRef.current?.scrollTo({
                        y: index * ITEM_HEIGHT,
                        animated: true,
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.wheelItemText,
                      isSelected && styles.wheelItemTextSelected,
                    ]}>
                      {hour.toString().padStart(2, '0')}h00
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Séparateur */}
        <View style={styles.wheelSeparator}>
          <Text style={styles.wheelSeparatorText}>→</Text>
        </View>

        {/* Heure de fin */}
        <View style={styles.wheelPickerSection}>
          <Text style={styles.wheelPickerLabel}>Heure de fin</Text>
          <View style={styles.wheelPickerWrapper}>
            <ScrollView
              ref={scrollViewEndRef}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onScroll={handleScrollEnd}
              scrollEventThrottle={16}
              contentContainerStyle={{
                paddingVertical: ITEM_HEIGHT * 2,
              }}
            >
              {hours.map((hour, index) => {
                const isSelected = index === selectedEndIndex;
                const isDisabled = hour <= selectedStartIndex;
                return (
                  <TouchableOpacity
                    key={`end-${hour}`}
                    style={styles.wheelItem}
                    onPress={() => {
                      if (!isDisabled) {
                        scrollViewEndRef.current?.scrollTo({
                          y: index * ITEM_HEIGHT,
                          animated: true,
                        });
                      }
                    }}
                    activeOpacity={isDisabled ? 1 : 0.7}
                    disabled={isDisabled}
                  >
                    <Text style={[
                      styles.wheelItemText,
                      isSelected && styles.wheelItemTextSelected,
                      isDisabled && styles.wheelItemTextDisabled,
                    ]}>
                      {hour.toString().padStart(2, '0')}h00
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Bouton principal */}
      {value ? (
        <View style={styles.selectedDateTimeCard}>
          <View style={styles.dateTimeInfo}>
            <View style={styles.dateTimeRow}>
              <Text style={styles.dateTimeLabel}>Date:</Text>
              <Text style={styles.dateTimeValue}>{formatDate(value)}</Text>
            </View>
            <View style={styles.dateTimeRow}>
              <Text style={styles.dateTimeLabel}>Intervalle:</Text>
              <Text style={styles.dateTimeValue}>{timeRangeStart} - {timeRangeEnd}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={openModal}
            style={styles.modifyButton}
            disabled={disabled}
          >
            <Text style={styles.modifyButtonText}>Modifier</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={openModal}
          activeOpacity={0.7}
          disabled={disabled}
        >
          <Text style={styles.emptyButtonText}>Sélectionner une date et un intervalle</Text>
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
              <Text style={styles.modalTitle}>Date et heure de départ</Text>
              <TouchableOpacity
                onPress={confirmDateTime}
                style={styles.headerButton}
                disabled={!isTimeRangeValid()}
              >
                <Text style={[
                  styles.confirmButton,
                  !isTimeRangeValid() && styles.confirmButtonDisabled
                ]}>OK</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Preview Card */}
              <View style={styles.previewCard}>
                <TouchableOpacity
                  style={[styles.previewRow, editingMode === 'date' && styles.previewRowActive]}
                  onPress={() => setEditingMode('date')}
                >
                  <View style={styles.previewTextContainer}>
                    <Text style={styles.previewLabel}>Date</Text>
                    <Text style={styles.previewValue}>{formatDate(tempDate)}</Text>
                  </View>
                  {editingMode === 'date' && <Text style={styles.activeIndicator}>✓</Text>}
                </TouchableOpacity>
                <View style={styles.previewDivider} />
                <TouchableOpacity
                  style={[styles.previewRow, editingMode === 'timeRange' && styles.previewRowActive]}
                  onPress={() => setEditingMode('timeRange')}
                >
                  <View style={styles.previewTextContainer}>
                    <Text style={styles.previewLabel}>Intervalle de temps</Text>
                    <Text style={styles.previewValue}>
                      {isTimeRangeValid()
                        ? `${tempTimeRangeStart} - ${tempTimeRangeEnd}`
                        : `${tempTimeRangeStart} - `
                      }
                    </Text>
                  </View>
                  {editingMode === 'timeRange' && <Text style={styles.activeIndicator}>✓</Text>}
                </TouchableOpacity>
              </View>

              {/* Picker Section */}
              <View style={styles.pickerSection}>
                {editingMode === 'date' && renderCalendar()}
                {editingMode === 'timeRange' && renderTimeRangePicker()}
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

  // État sélectionné (comme la gare)
  selectedDateTimeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  dateTimeInfo: {
    flex: 1,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateTimeLabel: {
    fontSize: 13,
    color: '#5F6368',
    fontWeight: '500',
    marginRight: 6,
    width: 60,
  },
  dateTimeValue: {
    fontSize: 16,
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
  confirmButtonDisabled: {
    color: '#B0BEC5',
    opacity: 0.5,
  },

  // Preview Card
  previewCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
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

  // Picker section
  pickerSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },

  // Calendrier
  calendarContainer: {
    width: '100%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  monthButtonText: {
    fontSize: 28,
    color: '#4CAF50',
    fontWeight: '600',
  },
  monthYear: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0C3823',
    textTransform: 'capitalize',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5F6368',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  dayCellSelected: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 8,
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0C3823',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayTextToday: {
    color: '#4CAF50',
    fontWeight: '700',
  },
  dayTextDisabled: {
    color: '#B0BEC5',
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
  hourText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C3823',
  },
  hourTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  hourCellDisabled: {
    opacity: 0.3,
  },
  hourTextDisabled: {
    color: '#B0BEC5',
  },

  // Time Range Styles
  timeRangeSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0C3823',
    marginBottom: 12,
  },

  // Wheel Picker Styles
  timeRangePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  wheelPickerSection: {
    flex: 1,
    alignItems: 'center',
  },
  wheelPickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5F6368',
    marginBottom: 8,
  },
  wheelPickerWrapper: {
    width: '100%',
    height: 250,
    position: 'relative',
    justifyContent: 'center',
  },
  wheelItem: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelItemText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#0C3823',
  },
  wheelItemTextSelected: {
    fontSize: 26,
    fontWeight: '800',
    color: '#4CAF50',
  },
  wheelItemTextDisabled: {
    color: '#B0BEC5',
    opacity: 0.3,
  },
  wheelSeparator: {
    width: 40,
    alignItems: 'center',
    height: 250,
    justifyContent: 'center',
    paddingTop: 30,
  },
  wheelSeparatorText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
  },
});

export default CustomDateTimePicker;
