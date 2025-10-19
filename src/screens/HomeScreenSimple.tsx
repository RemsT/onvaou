import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import CustomDateTimePicker from '../components/DateTimePicker';
import LabelSelectionField from '../components/LabelSelectionField';
import LabelSelectionModal from '../components/LabelSelectionModal';
import TimePickerModal from '../components/TimePickerModal';
import BudgetPickerModal from '../components/BudgetPickerModal';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigatorSimple';
import { LocalStationService } from '../services/localStationService';
import { HybridSearchService } from '../services/hybridSearchService';
import { Station, CityLabel } from '../types';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const [loading, setLoading] = useState(false);
  const [fromStation, setFromStation] = useState<Station | null>(null);
  const [enableTimeFilter, setEnableTimeFilter] = useState(true);
  const [enableBudgetFilter, setEnableBudgetFilter] = useState(false);
  const [maxTime, setMaxTime] = useState<string>('02:00');
  const [maxBudget, setMaxBudget] = useState<string>('30');
  const [stationSearch, setStationSearch] = useState('');
  const [stationSuggestions, setStationSuggestions] = useState<Station[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedLabels, setSelectedLabels] = useState<CityLabel[]>([]);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [showBudgetPickerModal, setShowBudgetPickerModal] = useState(false);
  const [timeRangeStart, setTimeRangeStart] = useState<string>('08:00');
  const [timeRangeEnd, setTimeRangeEnd] = useState<string>('20:00');

  const handleStationSearch = async (text: string) => {
    setStationSearch(text);
    if (text.length > 2) {
      const results = await LocalStationService.searchStations(text);
      setStationSuggestions(results);
    } else {
      setStationSuggestions([]);
    }
  };

  const handleSelectStation = (station: Station) => {
    setFromStation(station);
    setStationSearch('');
    setStationSuggestions([]);
  };

  const handleLabelModalClose = (labels: CityLabel[]) => {
    setSelectedLabels(labels);
    setShowLabelModal(false);
  };

  const handleTimePickerClose = (selectedTime: string | null) => {
    if (selectedTime) {
      setMaxTime(selectedTime);
    }
    setShowTimePickerModal(false);
  };

  const handleBudgetPickerClose = (selectedBudget: number | null) => {
    if (selectedBudget) {
      setMaxBudget(String(selectedBudget));
    }
    setShowBudgetPickerModal(false);
  };

  const validateTimeFormat = (time: string): boolean => {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const convertTimeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const handleSearch = async () => {
    if (!fromStation) {
      Alert.alert('Erreur', 'Veuillez sélectionner une gare de départ');
      return;
    }

    if (!enableTimeFilter && !enableBudgetFilter) {
      Alert.alert('Erreur', 'Veuillez activer au moins un filtre (temps ou budget)');
      return;
    }

    // Convert time format HH:mm to minutes
    const timeValue = enableTimeFilter ? convertTimeToMinutes(maxTime) : undefined;
    const budgetValue = enableBudgetFilter ? parseFloat(maxBudget) : undefined;

    if (enableTimeFilter && (!validateTimeFormat(maxTime) || timeValue! <= 0)) {
      Alert.alert('Erreur', 'Veuillez sélectionner un temps valide');
      return;
    }

    if (enableBudgetFilter && (isNaN(budgetValue!) || budgetValue! <= 0)) {
      Alert.alert('Erreur', 'Veuillez sélectionner un budget valide');
      return;
    }

    if (!validateTimeFormat(timeRangeStart)) {
      Alert.alert('Erreur', 'Format d\'heure de début invalide (HH:MM)');
      return;
    }
    if (!validateTimeFormat(timeRangeEnd)) {
      Alert.alert('Erreur', 'Format d\'heure de fin invalide (HH:MM)');
      return;
    }
    if (timeRangeStart >= timeRangeEnd) {
      Alert.alert('Erreur', 'L\'heure de début doit être antérieure à l\'heure de fin');
      return;
    }

    setLoading(true);
    try {
      const searchMode = enableTimeFilter && enableBudgetFilter ? 'both' : enableTimeFilter ? 'time' : 'budget';

      const results = await HybridSearchService.searchDestinations(
        fromStation,
        searchMode,
        timeValue,
        budgetValue,
        selectedDate || undefined,
        selectedLabels.length > 0 ? selectedLabels : undefined,
        timeRangeStart,
        timeRangeEnd
      );

      navigation.navigate('ResultsList', {
        fromStation,
        results,
        mode: searchMode,
        maxValue: timeValue || budgetValue,
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de récupérer les destinations');
      console.error(error);
    }
    setLoading(false);
  };

  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  const formatTimeDisplay = (time: string): string => {
    const [hours, minutes] = time.split(':');
    return `${hours}h${minutes}`;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
        <Text style={styles.logo}>ONvaOU</Text>
        <Text style={styles.heroSubtitle}>
          Trouvez votre prochaine destination en train
        </Text>
      </View>

      <View style={styles.content}>
        {/* Station Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Gare de départ</Text>

          {fromStation ? (
            <View style={styles.selectedStationCard}>
              <View style={styles.stationInfo}>
                <Text style={styles.stationName}>{fromStation.name}</Text>
                <Text style={styles.stationLabel}>Départ</Text>
              </View>
              <TouchableOpacity
                onPress={() => setFromStation(null)}
                style={styles.changeButton}
              >
                <Text style={styles.changeButtonText}>Modifier</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.searchInputContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Ex: Paris, Lyon, Marseille..."
                  placeholderTextColor="#999"
                  value={stationSearch}
                  onChangeText={handleStationSearch}
                />
              </View>

              {stationSuggestions.length > 0 && (
                <View style={styles.suggestionsCard}>
                  {stationSuggestions.map((station, index) => (
                    <TouchableOpacity
                      key={`${station.id}-${index}`}
                      style={[
                        styles.suggestionItem,
                        index < stationSuggestions.length - 1 && styles.suggestionBorder
                      ]}
                      onPress={() => handleSelectStation(station)}
                    >
                      <Text style={styles.suggestionText}>{station.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* Date & Time Range Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Date et intervalle de temps</Text>
          <CustomDateTimePicker
            value={selectedDate}
            onChange={setSelectedDate}
            minimumDate={new Date()}
            timeRangeStart={timeRangeStart}
            timeRangeEnd={timeRangeEnd}
            onTimeRangeChange={(start, end) => {
              setTimeRangeStart(start);
              setTimeRangeEnd(end);
            }}
          />
        </View>

        {/* Filter Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Filtres de recherche</Text>

          {/* Temps de trajet */}
          <View
            style={[
              styles.filterRow,
              enableTimeFilter && styles.filterRowActive
            ]}
          >
            <TouchableOpacity
              style={styles.filterLeftSection}
              onPress={() => setEnableTimeFilter(!enableTimeFilter)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.customCheckbox,
                enableTimeFilter && styles.customCheckboxActive
              ]}>
                {enableTimeFilter && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.filterTextContainer}>
                <Text style={styles.filterLabel}>Temps de trajet</Text>
                {enableTimeFilter && (
                  <Text style={styles.filterSubLabel}>Maximum</Text>
                )}
              </View>
            </TouchableOpacity>
            {enableTimeFilter && (
              <TouchableOpacity
                style={styles.filterInputContainer}
                onPress={() => setShowTimePickerModal(true)}
              >
                <Text style={styles.filterValueInput}>{formatTimeDisplay(maxTime)}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Budget */}
          <View
            style={[
              styles.filterRow,
              enableBudgetFilter && styles.filterRowActive
            ]}
          >
            <TouchableOpacity
              style={styles.filterLeftSection}
              onPress={() => setEnableBudgetFilter(!enableBudgetFilter)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.customCheckbox,
                enableBudgetFilter && styles.customCheckboxActive
              ]}>
                {enableBudgetFilter && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.filterTextContainer}>
                <Text style={styles.filterLabel}>Budget</Text>
                {enableBudgetFilter && (
                  <Text style={styles.filterSubLabel}>Maximum</Text>
                )}
              </View>
            </TouchableOpacity>
            {enableBudgetFilter && (
              <TouchableOpacity
                style={styles.filterInputContainer}
                onPress={() => setShowBudgetPickerModal(true)}
              >
                <Text style={styles.filterValueInput}>{maxBudget} €</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Button */}
        <TouchableOpacity
          style={[
            styles.searchButton,
            (!fromStation || loading || (!enableTimeFilter && !enableBudgetFilter)) && styles.searchButtonDisabled
          ]}
          onPress={handleSearch}
          disabled={loading || !fromStation || (!enableTimeFilter && !enableBudgetFilter)}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text style={styles.searchButtonText}>Rechercher des destinations</Text>
              <Text style={styles.searchButtonIcon}>→</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Sélectionnez un ou plusieurs filtres pour trouver les destinations accessibles depuis votre gare
          </Text>
        </View>
      </View>

      {/* Label Selection Modal */}
      <LabelSelectionModal
        visible={showLabelModal}
        selectedLabels={selectedLabels}
        onClose={handleLabelModalClose}
      />

      {/* Time Picker Modal */}
      <TimePickerModal
        visible={showTimePickerModal}
        initialValue={maxTime}
        onClose={handleTimePickerClose}
      />

      {/* Budget Picker Modal */}
      <BudgetPickerModal
        visible={showBudgetPickerModal}
        initialValue={parseFloat(maxBudget)}
        onClose={handleBudgetPickerClose}
      />
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },

  // Hero Section
  heroSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: '#4CAF50',
    marginBottom: 4,
    letterSpacing: -1,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#5F6368',
    lineHeight: 18,
    textAlign: 'center',
  },

  content: {
    padding: 16,
  },

  // Card Style
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0C3823',
    marginBottom: 12,
  },

  // Station Selection
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#E8EAED',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0C3823',
    padding: 0,
  },
  suggestionsCard: {
    marginTop: 8,
    backgroundColor: '#F7F9FC',
    borderRadius: 10,
    overflow: 'hidden',
  },
  suggestionItem: {
    padding: 12,
  },
  suggestionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  suggestionText: {
    fontSize: 15,
    color: '#0C3823',
    fontWeight: '500',
  },
  selectedStationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 14,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0C3823',
    marginBottom: 2,
  },
  stationLabel: {
    fontSize: 12,
    color: '#5F6368',
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  changeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },

  // Filtres
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E8EAED',
  },
  filterRowActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  filterLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#B0BEC5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  customCheckboxActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  filterTextContainer: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0C3823',
  },
  filterSubLabel: {
    fontSize: 12,
    color: '#5F6368',
    marginTop: 1,
  },
  filterInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E8EAED',
    minWidth: 90,
  },
  filterValueInput: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0C3823',
    textAlign: 'center',
    padding: 0,
  },
  filterUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5F6368',
    marginLeft: 3,
  },

  // Search Button
  searchButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  searchButtonDisabled: {
    backgroundColor: '#B0BEC5',
    shadowOpacity: 0,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginRight: 6,
  },
  searchButtonIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1565C0',
    lineHeight: 18,
  },
});
