import AsyncStorage from '@react-native-async-storage/async-storage';
import { Station, CityLabel } from '../types';

const RECENT_SEARCH_KEY = '@onvaou_last_search';

export interface RecentSearch {
  fromStation: Station;
  enableTimeFilter: boolean;
  enableBudgetFilter: boolean;
  maxTime: string;
  maxBudget: string;
  selectedDate: number | null; // timestamp ms
  selectedLabels: CityLabel[];
  labelFilterMode: 'OR' | 'AND';
  timeRangeStart: string;
  timeRangeEnd: string;
  includeTransfers: boolean;
}

export const recentSearchService = {
  async save(params: RecentSearch): Promise<void> {
    await AsyncStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(params));
  },

  async get(): Promise<RecentSearch | null> {
    const raw = await AsyncStorage.getItem(RECENT_SEARCH_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as RecentSearch;
    } catch {
      return null;
    }
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(RECENT_SEARCH_KEY);
  },
};
