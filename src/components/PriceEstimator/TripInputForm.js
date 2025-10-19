import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { TRAIN_TYPES, TRAIN_TYPE_LABELS } from '../../services/priceEstimation';
import DiscountCardSelector from './DiscountCardSelector';

export default function TripInputForm({ onEstimate, onCompare, initialRoute }) {
  const [distance, setDistance] = useState('463');
  const [trainType, setTrainType] = useState(TRAIN_TYPES.TGV_INOUI);
  const [departureDate, setDepartureDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [departureHour, setDepartureHour] = useState(14);
  const [passengerAge, setPassengerAge] = useState('30');
  const [discountCard, setDiscountCard] = useState('NONE');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleEstimate = () => {
    const params = {
      distance: parseFloat(distance) || 0,
      trainType,
      departureDate: departureDate.toISOString().split('T')[0],
      departureHour: parseInt(departureHour),
      passengerAge: parseInt(passengerAge) || 30,
      discountCard,
      route: initialRoute
    };

    onEstimate(params);
  };

  const handleCompare = () => {
    const params = {
      distance: parseFloat(distance) || 0,
      departureDate: departureDate.toISOString().split('T')[0],
      departureHour: parseInt(departureHour),
      passengerAge: parseInt(passengerAge) || 30,
      discountCard,
      route: initialRoute
    };

    onCompare(params);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Distance du trajet (km)</Text>
        <TextInput
          style={styles.input}
          value={distance}
          onChangeText={setDistance}
          keyboardType="numeric"
          placeholder="Ex: 463"
        />

        <Text style={styles.label}>Type de train</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={trainType}
            onValueChange={setTrainType}
            style={styles.picker}
          >
            {Object.entries(TRAIN_TYPE_LABELS).map(([key, label]) => (
              <Picker.Item key={key} label={label} value={key} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Date de départ</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateButtonText}>
            {departureDate.toLocaleDateString('fr-FR')}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={departureDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setDepartureDate(selectedDate);
              }
            }}
          />
        )}

        <Text style={styles.label}>Heure de départ</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={departureHour}
            onValueChange={setDepartureHour}
            style={styles.picker}
          >
            {Array.from({ length: 24 }, (_, i) => (
              <Picker.Item key={i} label={`${i}h00`} value={i} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Âge du passager</Text>
        <TextInput
          style={styles.input}
          value={passengerAge}
          onChangeText={setPassengerAge}
          keyboardType="numeric"
          placeholder="Ex: 30"
        />

        <DiscountCardSelector
          value={discountCard}
          onChange={setDiscountCard}
          passengerAge={parseInt(passengerAge) || 30}
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleEstimate}>
          <Text style={styles.primaryButtonText}>Estimer le prix</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleCompare}>
          <Text style={styles.secondaryButtonText}>Comparer les options</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA'
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden'
  },
  picker: {
    height: 50
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#FAFAFA'
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333'
  },
  primaryButton: {
    backgroundColor: '#0066FF',
    padding: 16,
    borderRadius: 10,
    marginTop: 24,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  secondaryButton: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 10,
    marginTop: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0066FF'
  },
  secondaryButtonText: {
    color: '#0066FF',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
