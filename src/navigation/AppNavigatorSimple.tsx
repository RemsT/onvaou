import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Station, SearchResult } from '../types';

// Import des écrans simplifiés
import HomeScreen from '../screens/HomeScreenSimple';
import ResultsListScreen from '../screens/ResultsListScreen';
import MapScreen from '../screens/MapScreenSimple';
import FavoritesScreen from '../screens/FavoritesScreenSimple';
import DestinationDetailScreen from '../screens/DestinationDetailScreenSimple';

// Types de navigation
export type RootStackParamList = {
  Home: undefined;
  Favorites: undefined;
  ResultsList: {
    fromStation: Station;
    results: SearchResult[];
    mode: 'time' | 'budget' | 'both';
    maxValue?: number;
  };
  MapView: {
    fromStation: Station;
    results: SearchResult[];
    mode: 'time' | 'budget' | 'both';
    maxValue?: number;
  };
  DestinationDetail: {
    destination: SearchResult;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      {/* @ts-ignore - Problème de typage avec React Navigation */}
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4A7C2C',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Favorites"
          component={FavoritesScreen}
          options={{
            title: 'Mes Favoris',
            headerStyle: {
              backgroundColor: '#4A7C2C',
            },
            headerTintColor: '#ffffff',
          }}
        />
        <Stack.Screen
          name="ResultsList"
          component={ResultsListScreen}
          options={{
            title: 'Résultats',
            headerStyle: {
              backgroundColor: '#4CAF50',
            },
            headerTintColor: '#ffffff',
            headerTitleStyle: {
              fontWeight: '800',
              fontSize: 22,
            },
            headerBackTitle: '',
          }}
        />
        <Stack.Screen
          name="MapView"
          component={MapScreen}
          options={{
            title: 'Carte',
            headerStyle: {
              backgroundColor: '#4CAF50',
            },
            headerTintColor: '#ffffff',
            headerTitleStyle: {
              fontWeight: '800',
              fontSize: 22,
            },
            headerBackTitle: '',
          }}
        />
        <Stack.Screen
          name="DestinationDetail"
          component={DestinationDetailScreen}
          options={{
            title: 'Destination',
            headerStyle: {
              backgroundColor: '#4CAF50',
            },
            headerTintColor: '#ffffff',
            headerTitleStyle: {
              fontWeight: '800',
              fontSize: 22,
            },
            headerBackTitle: '',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
