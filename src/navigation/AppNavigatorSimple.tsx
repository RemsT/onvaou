import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Station, SearchResult, Trail } from '../types';

import HomeScreen from '../screens/HomeScreenSimple';
import ResultsListScreen from '../screens/ResultsListScreen';
import MapScreen from '../screens/MapScreenSimple';
import FavoritesScreen from '../screens/FavoritesScreenSimple';
import DestinationDetailScreen from '../screens/DestinationDetailScreenSimple';
import RouteMapScreen from '../screens/RouteMapScreen';
import HistoriqueScreen from '../screens/HistoriqueScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OnboardingScreen, { ONBOARDING_KEY } from '../screens/OnboardingScreen';

// Paramètres du stack de recherche (onglet Rechercher)
export type RootStackParamList = {
  Home: undefined;
  ResultsList: {
    fromStation: Station;
    results: SearchResult[];
    mode: 'time' | 'budget' | 'both';
    maxValue?: number;
    searchDate?: number;
    maxTransfers?: number;
  };
  MapView: {
    fromStation: Station;
    results: SearchResult[];
    mode: 'time' | 'budget' | 'both';
    maxValue?: number;
    searchDate?: number;
    maxTransfers?: number;
  };
  DestinationDetail: {
    destination: SearchResult;
    searchDate?: number;
    // true = ouvert depuis Favoris ▸ Destinations → autorise le changement de date/heure.
    fromFavorites?: boolean;
    mapParams?: {
      fromStation: Station;
      results: SearchResult[];
      mode: 'time' | 'budget' | 'both';
      maxValue?: number;
      maxTransfers?: number;
    };
  };
  RouteMap: {
    origin: { lat: number; lon: number; name: string };
    dest: { lat: number; lon: number; name: string };
    destUrl?: string;   // lien « voir le site » de l'activité (marqueur destination cliquable)
    pointOnly?: boolean; // activité rando/vélo connue seulement par un point (pas de tracé de sentier)
    mode?: 'walk' | 'bike';
    // Mode « rando/vélo » : trace la géométrie embarquée du tracé (zéro API) + ses infos.
    trail?: Trail;
    // Autres parcours du même mode accessibles depuis la gare (traits fins cliquables).
    otherTrails?: Trail[];
  };
};

// Paramètres du stack racine (onboarding uniquement)
type AppStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

type TabParamList = {
  Rechercher: undefined;
  Favoris: undefined;
  Historique: undefined;
  Profil: undefined;
};

const SearchStack = createStackNavigator<RootStackParamList>();
const AppStack = createStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const HEADER_STYLE = { backgroundColor: '#4CAF50' };
const HEADER_OPTIONS = {
  headerStyle: HEADER_STYLE,
  headerTintColor: '#ffffff' as const,
  headerTitleStyle: { fontWeight: '800' as const, fontSize: 22 },
  headerBackTitle: '',
};

function SearchNavigator() {
  return (
    <SearchStack.Navigator id={undefined} screenOptions={HEADER_OPTIONS}>
      <SearchStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <SearchStack.Screen
        name="MapView"
        component={MapScreen}
        options={{ headerShown: false }}
      />
      <SearchStack.Screen
        name="ResultsList"
        component={ResultsListScreen}
        options={{ title: 'Résultats', ...HEADER_OPTIONS }}
      />
      <SearchStack.Screen
        name="DestinationDetail"
        component={DestinationDetailScreen}
        options={{ title: 'Destination', ...HEADER_OPTIONS }}
      />
      <SearchStack.Screen
        name="RouteMap"
        component={RouteMapScreen}
        options={{ title: 'Itinéraire', ...HEADER_OPTIONS }}
      />
    </SearchStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E8EAED',
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 80 : 64,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarIcon: ({ focused, color }) => {
          const icons: Record<string, [string, string]> = {
            Rechercher: ['search', 'search-outline'],
            Favoris: ['heart', 'heart-outline'],
            Historique: ['time', 'time-outline'],
            Profil: ['options', 'options-outline'],
          };
          const [active, inactive] = icons[route.name] ?? ['ellipse', 'ellipse-outline'];
          return <Ionicons name={(focused ? active : inactive) as any} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Rechercher" component={SearchNavigator} />
      <Tab.Screen name="Favoris" component={FavoritesScreen} />
      <Tab.Screen name="Historique" component={HistoriqueScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'Main' | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(v => {
      setInitialRoute(v === '1' ? 'Main' : 'Onboarding');
    });
  }, []);

  if (initialRoute === null) return null;

  return (
    <NavigationContainer>
      <AppStack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
        {initialRoute === 'Onboarding' ? (
          <AppStack.Screen name="Onboarding">
            {({ navigation }) => (
              <OnboardingScreen onFinish={() => navigation.replace('Main')} />
            )}
          </AppStack.Screen>
        ) : null}
        <AppStack.Screen name="Main" component={MainTabs} />
      </AppStack.Navigator>
    </NavigationContainer>
  );
}
