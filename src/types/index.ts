// Types pour l'application ONvaOU

// ──────────────────────────────────────────────────────────────────────────
// Registre de tags UNIQUE (source de vérité) : src/config/tags.json
// Consommé par l'app (ci-dessous) ET le script de génération
// (scripts/generate-tags.js). Ajouter un tag = ajouter une entrée JSON,
// aucun code à modifier ici. Voir le plan v2 / CLAUDE.md.
// ──────────────────────────────────────────────────────────────────────────
import tagsConfig from '../config/tags.json';

// Une clé de tag (ex: 'plage-mer'). Dérivée du registre — pas une union figée
// pour rester extensible (l'app n'a aucun switch exhaustif sur ces clés).
export type CityLabel = string;

export interface TagDisplay {
  name: string;
  icon: string;
  color: string;
}

// Affichage (nom/icône/couleur) construit depuis le registre.
export const CITY_LABELS: Record<string, TagDisplay> = Object.fromEntries(
  (tagsConfig as Array<{ key: string; name: string; icon: string; color: string }>).map((t) => [
    t.key,
    { name: t.name, icon: t.icon, color: t.color },
  ])
);

// Tags exposés dans l'UI de filtrage (ordre du registre).
export const UI_LABELS: CityLabel[] = (tagsConfig as Array<{ key: string }>).map((t) => t.key);

export interface TaggedPoi {
  name: string;            // Nom du lieu (ex: "Zoo de la Flèche")
  url?: string;            // Lien officiel si disponible
  lat?: number;            // Coordonnées du POI (itinéraire exact)
  lon?: number;
  mode?: 'walk' | 'bike';  // Mode d'accès retenu (à pied / vélo)
  minutes?: number;        // Durée réelle (min) dans ce mode
  km?: number;             // Distance réelle (km) dans ce mode
  ascent?: number;         // Dénivelé positif (m) — effort vélo
  route?: [number, number][]; // Tracé SIMPLIFIÉ [lat,lon] (~10-12 pts) pour l'aperçu in-app
  stars?: number;          // Classement (camping) : 1-5 étoiles ; absent = non classé
  commune?: string;        // Commune (camping) pour l'affichage
}

/**
 * Sortie à la journée (randonnée à pied ou tour à vélo) rattachée à une gare, PRÉ-CALCULÉE
 * hors-ligne et embarquée (aucun appel API au runtime). Voir scripts/generate-trails.js.
 * `geom` = polyligne encodée précision 6 (décodable par decodePolyline6 de routingService.ts).
 */
export interface Trail {
  name: string;
  mode: 'walk' | 'bike';
  loop: boolean;            // true = boucle (départ ≈ arrivée), false = linéaire gare → gare
  km: number;              // longueur du tracé
  minutes: number;         // durée estimée (Naismith/Tobler une fois le D+ connu, sinon vitesse plate)
  accessKm: number;        // distance vol d'oiseau gare → départ du tracé
  toUic?: string;          // pour les linéaires : gare d'arrivée (sortie gare → gare)
  url?: string;            // lien cliquable « plus d'infos » (site officiel ou relation OSM)
  geom: string;            // polyligne encodée précision 6
  // ── Champs enrichis (optionnels, rétro-compatibles) — voir feuille de route rando/vélo v2 ──
  ref?: string;            // ex. "GR 65", "EV6" (depuis OSM)
  network?: string;        // portée du réseau : lwn/rwn/nwn/iwn (rando) ou lcn/rcn/ncn/icn (vélo)
  activity?: 'hiking' | 'foot' | 'bike' | 'mtb';
  surface?: number;        // % de revêtement « naturel » (dérivé des tags OSM)
  ascent?: number;         // D+ (m) — SRTM, profil lissé
  descent?: number;        // D- (m)
  profile?: number[];      // profil altimétrique downsamplé (~20-30 pts) pour l'affichage
  difficulty?: string;     // sac_scale (T1-T6) / mtb:scale + indice IBP
  popularity?: number;     // proxy de tri (multi-réseaux, Wikidata, richesse des tags)
  waypoints?: { name: string; type: string; km: number; lat: number; lon: number }[]; // POIs le long
  generated?: boolean;     // true = boucle SUGGÉRÉE (générée par routing, pas un itinéraire OSM balisé)
}

// ── Itinérance multi-jours (graphe d'étapes) ────────────────────────────────
// Nœuds = gares + hébergements ; arêtes = un segment faisable en UNE journée.
export interface Accommodation {
  id: string;
  name: string;
  type: 'refuge' | 'gite' | 'cabane' | 'camping';
  lat: number;
  lon: number;
  uic?: string;             // renseigné si l'hébergement est (proche d') une gare
  season?: string;          // période d'ouverture (refuges.info / OSM opening_hours)
  reservationPhone?: string;
  reservationUrl?: string;
}

export interface StageEdge {
  fromId: string;           // id de nœud (uic de gare ou id d'hébergement)
  toId: string;
  mode: 'walk' | 'bike';
  km: number;
  ascent: number;
  minutes: number;
  geom: string;             // polyligne encodée précision 6
  water?: { km: number; lat: number; lon: number }[];                 // points d'eau le long
  resupply?: { name: string; km: number; lat: number; lon: number }[]; // commerces/épiceries
}

export interface Trek {
  name?: string;
  mode: 'walk' | 'bike';
  stages: StageEdge[];
  totalKm: number;
  totalAscent: number;
  fromUic: string;
  toUic?: string;           // gare d'arrivée (absent si boucle = retour gare de départ)
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
