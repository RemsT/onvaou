// Types pour l'application ONvaOU

export type CityLabel =
  | 'kid-friendly'
  | 'sports-nautiques'
  | 'randonnee'
  | 'culture-histoire'
  | 'gastronomie'
  | 'plage-mer'
  | 'montagne'
  | 'lacs-rivieres'
  | 'oenologie'
  | 'sports-hiver'
  | 'ville-thermale'
  | 'art-architecture'
  | 'nature-ecotourisme'
  | 'vie-nocturne'
  | 'shopping';

export const CITY_LABELS: Record<CityLabel, { name: string; icon: string; color: string }> = {
  'kid-friendly': { name: 'Famille', icon: '👨‍👩‍👧‍👦', color: '#FF6B6B' },
  'sports-nautiques': { name: 'Sports nautiques', icon: '🏄', color: '#4ECDC4' },
  'randonnee': { name: 'Randonnée', icon: '🥾', color: '#95E1D3' },
  'culture-histoire': { name: 'Culture & Histoire', icon: '🏛️', color: '#F38181' },
  'gastronomie': { name: 'Gastronomie', icon: '🍽️', color: '#FFA07A' },
  'plage-mer': { name: 'Plage & Mer', icon: '🏖️', color: '#56CCF2' },
  'montagne': { name: 'Montagne', icon: '⛰️', color: '#8B7355' },
  'lacs-rivieres': { name: 'Lacs & Rivières', icon: '🏊', color: '#3FA7D6' },
  'oenologie': { name: 'Vin & Vignobles', icon: '🍷', color: '#8B4789' },
  'sports-hiver': { name: 'Sports d\'hiver', icon: '⛷️', color: '#AED9E0' },
  'ville-thermale': { name: 'Bien-être', icon: '♨️', color: '#FFB6B9' },
  'art-architecture': { name: 'Art & Design', icon: '🎨', color: '#C7CEEA' },
  'nature-ecotourisme': { name: 'Nature & Éco', icon: '🌿', color: '#7AC74F' },
  'vie-nocturne': { name: 'Vie nocturne', icon: '🎉', color: '#9B59B6' },
  'shopping': { name: 'Shopping', icon: '🛍️', color: '#E74C3C' },
};

// Les 7 tags exposés dans l'UI de filtrage (les autres restent dans les données)
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

export interface TagEvidence {
  label: CityLabel;
  reason: string;       // ex: "Lac d'Annecy (2 727 ha) à 0,5 km"
  source: string;       // URL cliquable dans l'app
  linkLabel: string;    // Texte du bouton lien
  confidence: number;   // 0-100
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
