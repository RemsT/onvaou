// Types pour l'application ONvaOU

export type CityLabel =
  | 'kid-friendly'
  | 'sports-nautiques'
  | 'randonnee'
  | 'culture-histoire'
  | 'gastronomie'
  | 'plage-mer'
  | 'montagne'
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
  'oenologie': { name: 'Vin & Vignobles', icon: '🍷', color: '#8B4789' },
  'sports-hiver': { name: 'Sports d\'hiver', icon: '⛷️', color: '#AED9E0' },
  'ville-thermale': { name: 'Bien-être', icon: '♨️', color: '#FFB6B9' },
  'art-architecture': { name: 'Art & Design', icon: '🎨', color: '#C7CEEA' },
  'nature-ecotourisme': { name: 'Nature & Éco', icon: '🌿', color: '#7AC74F' },
  'vie-nocturne': { name: 'Vie nocturne', icon: '🎉', color: '#9B59B6' },
  'shopping': { name: 'Shopping', icon: '🛍️', color: '#E74C3C' },
};

export interface Station {
  id: number | string;
  name: string;
  sncf_id: string;
  lat: number;
  lon: number;
  labels?: CityLabel[];
  real_name?: string; // Nom de la vraie gare pour les destinations groupées "Toutes les gares"
}

export interface SearchParams {
  from_station_id: number;
  mode: 'time' | 'budget' | 'both';
  max_time?: number; // en minutes
  max_budget?: number; // en euros
  max_value?: number; // pour compatibilité ancienne version
}

export interface SearchResult {
  id: number;
  search_id: number;
  from_station?: Station; // Gare de départ (optionnel pour compatibilité)
  to_station_id: number;
  to_station: Station;
  duration: number; // en minutes
  price: number; // en euros (prix moyen)
  priceRange?: { min: number; max: number }; // Range de prix estimé
  departure_time: string;
  arrival_time?: string;
  nb_transfers?: number; // Deprecated: use transfers instead
  transfers?: number; // Nombre de correspondances (0 = direct, 1 = 1 changement, etc.)
  transferStation?: string; // Nom de la gare de correspondance
  transferLat?: number; // Latitude de la gare de correspondance
  transferLon?: number; // Longitude de la gare de correspondance
  transferArrival?: string; // Heure d'arrivée à la gare de correspondance
  transferDeparture?: string; // Heure de départ de la gare de correspondance
  route_name?: string; // Nom de la route (ex: TGV, TER, etc.)
  route_type?: 'TGV' | 'INTERCITES' | 'TER' | 'RER' | 'AUTRE'; // Type de train
  navitia_data?: any; // Données complètes de Navitia si disponibles
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
