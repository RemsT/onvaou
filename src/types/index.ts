// Types pour l'application ONvaOU

export type CityLabel =
  | 'plage-mer'
  | 'montagne'
  | 'lacs-rivieres'
  | 'sports-hiver'
  | 'randonnee'
  | 'culture-histoire'
  | 'gastronomie'
  | 'kid-friendly';

export const CITY_LABELS: Record<CityLabel, { name: string; icon: string; color: string }> = {
  'plage-mer': { name: 'Plage & Mer', icon: '🏖️', color: '#56CCF2' },
  'montagne': { name: 'Montagne', icon: '⛰️', color: '#8B7355' },
  'lacs-rivieres': { name: 'Lacs & Rivières', icon: '🏊', color: '#3FA7D6' },
  'sports-hiver': { name: 'Sports d\'hiver', icon: '⛷️', color: '#AED9E0' },
  'randonnee': { name: 'Randonnée', icon: '🥾', color: '#95E1D3' },
  'culture-histoire': { name: 'Culture & Histoire', icon: '🏛️', color: '#F38181' },
  'gastronomie': { name: 'Gastronomie', icon: '🍽️', color: '#FFA07A' },
  'kid-friendly': { name: 'Famille', icon: '👨‍👩‍👧‍👦', color: '#FF6B6B' },
};

// Les 8 tags exposés dans l'UI de filtrage
export const UI_LABELS: CityLabel[] = [
  'plage-mer',
  'montagne',
  'lacs-rivieres',
  'sports-hiver',
  'randonnee',
  'culture-histoire',
  'gastronomie',
  'kid-friendly',
];

export interface TaggedPoi {
  name: string;   // Nom du lieu (ex: "Zoo de la Flèche")
  url?: string;   // Lien officiel si disponible
}

export interface TagEvidence {
  label: CityLabel;
  reason: string;       // ex: "Lac d'Annecy (2 727 ha) à 0,5 km"
  source: string;       // URL cliquable dans l'app
  linkLabel: string;    // Texte du bouton lien
  confidence: number;   // 0-100
  pois?: TaggedPoi[];   // Lieux précis recensés (DATAtourisme) avec leurs liens
}

export interface StationData {
  tags: TagEvidence[];
  description?: string;    // Résumé court de la ville
  wikipediaUrl?: string;   // Page Wikipedia complète
  thumbnailUrl?: string;   // Image Wikipedia
}

export interface Station {
  id: number | string;
  name: string;
  sncf_id: string;
  lat: number;
  lon: number;
  labels?: CityLabel[];
  real_name?: string;
}

export interface SearchParams {
  from_station_id: number;
  mode: 'time' | 'budget' | 'both';
  max_time?: number;
  max_budget?: number;
  max_value?: number;
}

export interface SearchResult {
  id: number | string;
  search_id: number;
  from_station?: Station;
  to_station_id: number | string;
  to_station: Station;
  duration: number;
  price: number;
  priceRange?: { min: number; max: number };
  departure_time: string;
  arrival_time?: string;
  nb_transfers?: number;
  transfers?: number;
  transferStation?: string;
  transferLat?: number;
  transferLon?: number;
  transferArrival?: string;
  transferDeparture?: string;
  route_name?: string;
  route_type?: 'TGV' | 'INTERCITES' | 'TER' | 'RER' | 'AUTRE';
  navitia_data?: any;
  tripCount?: number;
  allDepartureTimes?: string[];
}

export interface Search {
  id: number;
  user_id: string;
  from_station_id: number;
  from_station?: Station;
  mode: 'time' | 'budget';
  max_value: number;
  created_at: string;
  results?: SearchResult[];
}

export interface Favorite {
  id: number;
  user_id: string;
  to_station_id: number;
  to_station?: Station;
  added_at: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}
