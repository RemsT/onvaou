import React, { useState, useRef, useEffect } from 'react';
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
  Keyboard,
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
import { useGTFSInitialization } from '../hooks/useGTFSInitialization';
import { DatabaseInitializationScreen } from '../components/DatabaseInitializationScreen';
import { Station, CityLabel, CITY_LABELS } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { recentSearchService, RecentSearch } from '../services/recentSearchService';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const [loading, setLoading] = useState(false);
  const [fromStation, setFromStation] = useState<Station | null>(null);
  const [enableTimeFilter, setEnableTimeFilter] = useState(false);
  const [enableBudgetFilter, setEnableBudgetFilter] = useState(false);
  const [maxTime, setMaxTime] = useState<string>('02:00');
  const [maxBudget, setMaxBudget] = useState<string>('30');
  const [stationSearch, setStationSearch] = useState('');
  const [stationSuggestions, setStationSuggestions] = useState<Station[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedLabels, setSelectedLabels] = useState<CityLabel[]>([]);
  const [labelFilterMode, setLabelFilterMode] = useState<'OR' | 'AND'>('OR');
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [showBudgetPickerModal, setShowBudgetPickerModal] = useState(false);
  const [timeRangeStart, setTimeRangeStart] = useState<string>('08:00');
  const [timeRangeEnd, setTimeRangeEnd] = useState<string>('12:00');
  // Checkbox "trajet direct" — non cochée par défaut (correspondances autorisées)
  const [directOnly, setDirectOnly] = useState(false);
  const stationInputRef = useRef<any>(null);

  // Recherche récente
  const [recentSearch, setRecentSearch] = useState<RecentSearch | null>(null);

  // Initialisation de la base de données GTFS
  const { isInitializing, progress: initProgress, initializeDatabase, isGTFSStale } = useGTFSInitialization();
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    recentSearchService.get().then(setRecentSearch);
  }, []);

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
    Keyboard.dismiss(); // Fermer le clavier immédiatement
    setFromStation(station);
    setStationSearch('');
    setStationSuggestions([]);
  };

  const handleRelaunch = async (recent: RecentSearch) => {
    setFromStation(recent.fromStation);
    setEnableTimeFilter(recent.enableTimeFilter);
    setEnableBudgetFilter(recent.enableBudgetFilter);
    setMaxTime(recent.maxTime);
    setMaxBudget(recent.maxBudget);
    setSelectedDate(recent.selectedDate ? new Date(recent.selectedDate) : null);
    setSelectedLabels(recent.selectedLabels);
    setLabelFilterMode(recent.labelFilterMode ?? 'OR');
    setTimeRangeStart(recent.timeRangeStart);
    setTimeRangeEnd(recent.timeRangeEnd);
    setDirectOnly(recent.includeTransfers ?? false);
  };

  const handleLabelModalClose = (labels: CityLabel[], mode: 'OR' | 'AND') => {
    setSelectedLabels(labels);
    setLabelFilterMode(mode);
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

      const maxTransfers = directOnly ? 0 : 1;

      const results = await HybridSearchService.searchDestinations(
        fromStation,
        searchMode,
        timeValue,
        budgetValue,
        selectedDate || undefined,
        selectedLabels.length > 0 ? selectedLabels : undefined,
        timeRangeStart,
        timeRangeEnd,
        maxTransfers,
        labelFilterMode
      );

      // Filtrer si "trajet direct" coché : exclure les correspondances
      const filteredResults = directOnly
        ? results.filter(r => (r.transfers ?? 0) === 0)
        : results;

      recentSearchService.save({
        fromStation,
        enableTimeFilter,
        enableBudgetFilter,
        maxTime,
        maxBudget,
        selectedDate: selectedDate ? selectedDate.getTime() : null,
        selectedLabels,
        labelFilterMode,
        timeRangeStart,
        timeRangeEnd,
        includeTransfers: directOnly,
      });

      navigation.navigate('MapView', {
        fromStation,
        results: filteredResults,
        mode: searchMode,
        maxValue: timeValue || budgetValue,
        searchDate: (selectedDate || new Date()).getTime(),
        maxTransfers,
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

  const handleUpdateData = () => {
    Alert.alert(
      'Mettre à jour les données',
      'Les horaires GTFS ont plus de 6 mois. Mettre à jour télécharge les données les plus récentes depuis data.sncf.com (connexion internet requise, peut prendre quelques minutes).',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Mettre à jour',
          onPress: async () => {
            setIsUpdating(true);
            try {
              await initializeDatabase(false, true);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de mettre à jour les données. Vérifiez votre connexion.');
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ]
    );
  };

  const handleResetDatabase = async () => {
    Alert.alert(
      'Réinitialiser la base de données',
      'Cette opération va supprimer et recréer la base de données GTFS. Cela peut prendre 1-2 minutes. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            try {
              await initializeDatabase(true);
              Alert.alert('Succès', 'Base de données réinitialisée avec succès !');
            } catch (error) {
              console.error(error);
              Alert.alert('Erreur', 'Échec de la réinitialisation de la base de données');
            }
          }
        }
      ]
    );
  };

  // Afficher l'écran d'initialisation si en cours
  if (isInitializing) {
    return <DatabaseInitializationScreen progress={initProgress} />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
        <Text style={styles.logo}>ONvaOU</Text>
        <Text style={styles.heroSubtitle}>
          Trouvez votre prochaine destination en train
        </Text>
      </View>

      <View style={styles.content}>
        {/* Bannière dernière recherche */}
        {recentSearch && !loading && (
          <TouchableOpacity
            style={styles.recentSearchBanner}
            onPress={() => handleRelaunch(recentSearch)}
            activeOpacity={0.8}
          >
            <Ionicons name="time-outline" size={18} color="#4CAF50" />
            <View style={styles.recentSearchContent}>
              <Text style={styles.recentSearchTitle}>Dernière recherche</Text>
              <Text style={styles.recentSearchSummary} numberOfLines={1}>
                {recentSearch.fromStation.name}
                {recentSearch.enableTimeFilter ? ` · ${recentSearch.maxTime.replace(':', 'h')} max` : ''}
                {recentSearch.enableBudgetFilter ? ` · ${recentSearch.maxBudget}€ max` : ''}
                {recentSearch.selectedDate ? ` · ${new Date(recentSearch.selectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : ''}
              </Text>
            </View>
            <Text style={styles.recentSearchAction}>Relancer →</Text>
          </TouchableOpacity>
        )}

        {/* Station Card */}
        <View style={[styles.card, loading && styles.filterRowDisabled]}>
          <Text style={styles.cardTitle}>Gare de départ</Text>

          {fromStation ? (
            <View style={styles.selectedStationCard}>
              <View style={styles.stationInfo}>
                <Text style={styles.stationName}>{fromStation.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => { setFromStation(null); setTimeout(() => stationInputRef.current?.focus(), 100); }}
                style={styles.changeButton}
                disabled={loading}
              >
                <Text style={styles.changeButtonText}>Modifier</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.searchInputContainer}>
                <TextInput
                  ref={stationInputRef}
                  style={styles.searchInput}
                  placeholder="Ex: Paris, Lyon, Marseille..."
                  placeholderTextColor="#999"
                  value={stationSearch}
                  onChangeText={handleStationSearch}
                  editable={!loading}
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
                      disabled={loading}
                      activeOpacity={0.7}
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
        <View style={[styles.card, loading && styles.filterRowDisabled]}>
          <Text style={styles.cardTitle}>Date et heure de départ</Text>
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
            disabled={loading}
          />
        </View>

        {/* Filter Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Filtres de recherche</Text>

          {/* Temps de trajet */}
          <View
            style={[
              styles.filterRow,
              enableTimeFilter && styles.filterRowActive,
              loading && styles.filterRowDisabled
            ]}
          >
            <TouchableOpacity
              style={styles.filterLeftSection}
              onPress={() => setEnableTimeFilter(!enableTimeFilter)}
              activeOpacity={0.7}
              disabled={loading}
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
                disabled={loading}
              >
                <Text style={styles.filterValueInput}>{formatTimeDisplay(maxTime)}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Budget */}
          <View
            style={[
              styles.filterRow,
              enableBudgetFilter && styles.filterRowActive,
              loading && styles.filterRowDisabled,
            ]}
          >
            <TouchableOpacity
              style={styles.filterLeftSection}
              onPress={() => setEnableBudgetFilter(!enableBudgetFilter)}
              activeOpacity={0.7}
              disabled={loading}
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
                disabled={loading}
              >
                <Text style={styles.filterValueInput}>{maxBudget} €</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Trajet direct */}
          <View
            style={[
              styles.filterRow,
              directOnly && styles.filterRowActive,
              loading && styles.filterRowDisabled,
            ]}
          >
            <TouchableOpacity
              style={styles.filterLeftSection}
              onPress={() => setDirectOnly(v => !v)}
              activeOpacity={0.7}
              disabled={loading}
            >
              <View style={[
                styles.customCheckbox,
                directOnly && styles.customCheckboxActive
              ]}>
                {directOnly && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.filterTextContainer}>
                <Text style={styles.filterLabel}>Trajet direct</Text>
              </View>
            </TouchableOpacity>
          </View>

        </View>

        {/* Centres d'intérêt Card */}
        <TouchableOpacity
          style={[
            styles.card,
            styles.labelsCard,
            selectedLabels.length > 0 && styles.labelsCardActive,
            loading && styles.filterRowDisabled,
          ]}
          onPress={() => setShowLabelModal(true)}
          activeOpacity={0.8}
          disabled={loading}
        >
          <View style={styles.labelsCardHeader}>
            <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Centres d'intérêt</Text>
            {selectedLabels.length > 0 ? (
              <TouchableOpacity
                onPress={() => setSelectedLabels([])}
                disabled={loading}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.labelsCardClear}>Effacer ✕</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.labelsCardOptional}>optionnel</Text>
            )}
          </View>
          {selectedLabels.length === 0 ? (
            <Text style={styles.labelsCardPlaceholder}>
              Filtrer par activité : montagne, plage, randonnée...
            </Text>
          ) : (
            <View style={styles.labelsChipsRow}>
              {selectedLabels.map(label => (
                <View
                  key={label}
                  style={[styles.labelsChip, { borderColor: '#4CAF50', backgroundColor: '#E8F5E9' }]}
                >
                  <Text style={styles.labelsChipText}>{CITY_LABELS[label]?.name || label}</Text>
                </View>
              ))}
            </View>
          )}
          <Text style={styles.labelsCardArrow}>Modifier ›</Text>
        </TouchableOpacity>

        {/* Search Button */}
        <TouchableOpacity
          style={[
            styles.searchButton,
            (!fromStation || !selectedDate || loading || (!enableTimeFilter && !enableBudgetFilter)) && styles.searchButtonDisabled
          ]}
          onPress={handleSearch}
          disabled={loading || !fromStation || !selectedDate || (!enableTimeFilter && !enableBudgetFilter)}
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

        {/* Hint when button is disabled */}
        {!loading && (!fromStation || !selectedDate || (!enableTimeFilter && !enableBudgetFilter)) && (
          <Text style={styles.searchHint}>
            {!fromStation
              ? '← Sélectionnez une gare de départ'
              : !selectedDate
              ? '← Sélectionnez une date de départ'
              : '← Activez au moins un filtre'}
          </Text>
        )}

        {/* Info Card */}
        {!loading && (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Sélectionnez un ou plusieurs filtres pour trouver les destinations accessibles depuis votre gare
            </Text>
          </View>
        )}

        {/* Disclaimer affiché uniquement pendant la recherche */}
        {loading && (
          <View style={styles.searchingDisclaimer}>
            <Text style={styles.searchingDisclaimerText}>
              Horaires théoriques · Prix indicatifs
            </Text>
            <Text style={styles.searchingDisclaimerSub}>
              Consultez SNCF Connect pour les horaires et tarifs exacts
            </Text>
          </View>
        )}

        {/* Bannière de mise à jour des données GTFS */}
        {isGTFSStale && (
          <TouchableOpacity
            style={[styles.updateBanner, isUpdating && styles.updateBannerDisabled]}
            onPress={handleUpdateData}
            disabled={loading || isUpdating}
          >
            <Ionicons name="refresh" size={22} color="#1565C0" style={styles.updateBannerIcon} />
            <View style={styles.updateBannerContent}>
              <Text style={styles.updateBannerTitle}>Données horaires datées</Text>
              <Text style={styles.updateBannerText}>
                Les horaires ont plus de 6 mois. Appuyez pour télécharger les données à jour depuis SNCF.
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Reset Database Button */}
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetDatabase}
          disabled={loading}
        >
          <Ionicons name="settings-outline" size={12} color="#C0C0C0" />
          <Text style={styles.resetButtonText}>Réinitialiser la base de données</Text>
        </TouchableOpacity>
      </View>

      {/* Label Selection Modal */}
      <LabelSelectionModal
        visible={showLabelModal}
        selectedLabels={selectedLabels}
        labelFilterMode={labelFilterMode}
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

  // Bannière dernière recherche
  recentSearchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recentSearchContent: {
    flex: 1,
  },
  recentSearchTitle: {
    fontSize: 12,
    color: '#5F6368',
    marginBottom: 2,
  },
  recentSearchSummary: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0C3823',
  },
  recentSearchAction: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4CAF50',
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
  filterRowDisabled: {
    opacity: 0.5,
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
  filterSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5F6368',
    marginTop: 12,
    marginBottom: 6,
  },
  labelsCard: {
    gap: 8,
  },
  labelsCardActive: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  labelsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  labelsCardOptional: {
    fontSize: 11,
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
  labelsCardClear: {
    fontSize: 12,
    color: '#E74C3C',
    fontWeight: '600',
  },
  labelsCardPlaceholder: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  labelsChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  labelsChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  labelsChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
    textTransform: 'capitalize',
  },
  labelsCardArrow: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'right',
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

  // Transfers Filter
  transfersFilterSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8EAED',
  },
  transfersFilterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5F6368',
    marginBottom: 10,
  },
  transfersCheckboxRowHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 20,
  },
  transfersCheckboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transfersCheckboxLabelInline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C3823',
    marginLeft: 8,
  },

  // Reset Database Button
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 12,
    marginBottom: 20,
    opacity: 0.5,
  },
  resetButtonText: {
    color: '#9E9E9E',
    fontSize: 11,
  },

  // Search hint
  searchHint: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
  },

  // Disclaimer affiché pendant la recherche
  searchingDisclaimer: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  searchingDisclaimerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5F6368',
  },
  searchingDisclaimerSub: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 3,
    textAlign: 'center',
  },

  // Bannière de mise à jour GTFS
  updateBanner: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  updateBannerDisabled: {
    opacity: 0.5,
  },
  updateBannerIcon: {
    marginRight: 4,
  },
  updateBannerContent: {
    flex: 1,
  },
  updateBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D47A1',
    marginBottom: 2,
  },
  updateBannerText: {
    fontSize: 11,
    color: '#1565C0',
    lineHeight: 16,
  },
});
