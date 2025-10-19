import { CityLabel } from '../types';

/**
 * Labels associés à chaque gare/ville
 * Basé sur les attractions et caractéristiques principales de chaque destination
 */
export const cityLabels: Record<number, CityLabel[]> = {
  // Paris et Île-de-France
  1: ['culture-histoire', 'art-architecture', 'shopping', 'gastronomie', 'vie-nocturne'], // Paris Gare du Nord
  2: ['culture-histoire', 'art-architecture', 'shopping', 'gastronomie', 'vie-nocturne'], // Paris Gare de Lyon
  3: ['culture-histoire', 'art-architecture', 'shopping', 'gastronomie', 'vie-nocturne'], // Paris Montparnasse
  4: ['culture-histoire', 'art-architecture', 'shopping', 'gastronomie', 'vie-nocturne'], // Paris Saint-Lazare
  5: ['culture-histoire', 'art-architecture', 'shopping', 'gastronomie', 'vie-nocturne'], // Paris Est
  6: ['culture-histoire', 'art-architecture', 'shopping', 'gastronomie'], // Paris Bercy
  7: ['culture-histoire', 'art-architecture', 'shopping', 'gastronomie'], // Paris Austerlitz
  8: ['kid-friendly'], // Marne-la-Vallée Chessy (Disneyland)
  9: ['culture-histoire', 'art-architecture'], // Versailles Chantiers

  // Auvergne-Rhône-Alpes
  10: ['gastronomie', 'culture-histoire', 'shopping', 'vie-nocturne'], // Lyon Part-Dieu
  11: ['gastronomie', 'culture-histoire', 'shopping'], // Lyon Perrache
  12: ['montagne', 'randonnee', 'sports-hiver', 'nature-ecotourisme'], // Grenoble
  13: ['montagne', 'randonnee', 'sports-hiver', 'nature-ecotourisme'], // Chambéry
  14: ['montagne', 'randonnee', 'sports-hiver', 'nature-ecotourisme'], // Annecy
  15: ['gastronomie', 'oenologie'], // Valence TGV
  16: ['culture-histoire', 'art-architecture'], // Saint-Étienne
  17: ['nature-ecotourisme', 'randonnee', 'gastronomie'], // Clermont-Ferrand

  // Provence-Alpes-Côte d'Azur
  18: ['plage-mer', 'culture-histoire', 'gastronomie', 'shopping'], // Marseille Saint-Charles
  19: ['plage-mer', 'culture-histoire', 'art-architecture', 'vie-nocturne'], // Nice Ville
  20: ['plage-mer', 'sports-nautiques'], // Toulon
  21: ['culture-histoire', 'art-architecture', 'gastronomie'], // Aix-en-Provence TGV
  22: ['culture-histoire', 'gastronomie', 'oenologie'], // Avignon TGV
  23: ['culture-histoire', 'gastronomie', 'oenologie'], // Avignon Centre
  24: ['plage-mer', 'vie-nocturne', 'shopping'], // Cannes
  25: ['plage-mer', 'culture-histoire'], // Antibes

  // Occitanie
  26: ['gastronomie', 'culture-histoire', 'vie-nocturne', 'shopping'], // Toulouse Matabiau
  27: ['plage-mer', 'culture-histoire', 'gastronomie', 'vie-nocturne'], // Montpellier Saint-Roch
  28: ['culture-histoire', 'gastronomie'], // Nîmes
  29: ['plage-mer', 'culture-histoire', 'gastronomie'], // Perpignan
  30: ['oenologie', 'gastronomie'], // Béziers
  31: ['plage-mer', 'oenologie'], // Narbonne
  32: ['culture-histoire', 'kid-friendly'], // Carcassonne

  // Nouvelle-Aquitaine
  33: ['oenologie', 'gastronomie', 'culture-histoire', 'shopping'], // Bordeaux Saint-Jean
  34: ['plage-mer', 'sports-nautiques', 'kid-friendly', 'gastronomie'], // La Rochelle
  35: ['culture-histoire', 'gastronomie'], // Poitiers
  36: ['culture-histoire', 'gastronomie'], // Limoges
  37: ['culture-histoire', 'gastronomie'], // Angoulême
  38: ['montagne', 'randonnee', 'gastronomie'], // Pau
  39: ['plage-mer', 'sports-nautiques', 'gastronomie'], // Bayonne
  40: ['plage-mer', 'sports-nautiques', 'vie-nocturne'], // Biarritz

  // Pays de la Loire
  41: ['culture-histoire', 'shopping', 'gastronomie', 'vie-nocturne'], // Nantes
  42: ['culture-histoire', 'gastronomie', 'oenologie'], // Angers
  43: ['culture-histoire', 'gastronomie'], // Le Mans
  44: ['plage-mer', 'sports-nautiques'], // Saint-Nazaire
  45: ['culture-histoire', 'gastronomie'], // Laval

  // Bretagne
  46: ['culture-histoire', 'gastronomie', 'shopping', 'vie-nocturne'], // Rennes
  47: ['plage-mer', 'sports-nautiques', 'gastronomie'], // Brest
  48: ['plage-mer', 'culture-histoire', 'gastronomie'], // Quimper
  49: ['plage-mer', 'randonnee', 'nature-ecotourisme'], // Saint-Brieuc
  50: ['plage-mer', 'sports-nautiques', 'gastronomie'], // Lorient
  51: ['plage-mer', 'culture-histoire', 'gastronomie'], // Vannes

  // Centre-Val de Loire
  52: ['culture-histoire', 'gastronomie', 'oenologie'], // Tours
  53: ['culture-histoire', 'gastronomie'], // Orléans
  54: ['culture-histoire', 'oenologie'], // Blois
  55: ['culture-histoire', 'gastronomie'], // Bourges
  56: ['nature-ecotourisme', 'culture-histoire'], // Châteauroux

  // Grand Est
  57: ['culture-histoire', 'gastronomie', 'oenologie', 'shopping'], // Strasbourg Ville
  58: ['culture-histoire', 'gastronomie'], // Metz Ville
  59: ['oenologie', 'culture-histoire', 'gastronomie'], // Reims
  60: ['culture-histoire', 'art-architecture', 'gastronomie'], // Nancy Ville
  61: ['culture-histoire', 'shopping'], // Mulhouse Ville
  62: ['oenologie', 'gastronomie', 'culture-histoire'], // Colmar
  63: ['oenologie', 'gastronomie'], // Épernay
  64: ['culture-histoire', 'gastronomie'], // Troyes
  65: ['nature-ecotourisme', 'randonnee'], // Charleville-Mézières

  // Hauts-de-France
  66: ['culture-histoire', 'shopping', 'gastronomie', 'vie-nocturne'], // Lille Flandres
  67: ['culture-histoire', 'shopping', 'gastronomie', 'vie-nocturne'], // Lille Europe
  68: ['culture-histoire', 'gastronomie'], // Amiens
  69: ['culture-histoire', 'gastronomie'], // Arras
  70: ['plage-mer', 'shopping'], // Calais Ville
  71: ['plage-mer', 'sports-nautiques'], // Dunkerque
  72: ['culture-histoire'], // Valenciennes
  73: ['culture-histoire'], // Douai
  74: ['shopping', 'gastronomie'], // Tourcoing
  75: ['shopping', 'gastronomie'], // Roubaix

  // Normandie
  76: ['culture-histoire', 'art-architecture', 'gastronomie'], // Rouen Rive-Droite
  77: ['plage-mer', 'sports-nautiques', 'gastronomie'], // Le Havre
  78: ['culture-histoire', 'gastronomie', 'kid-friendly'], // Caen
  79: ['plage-mer', 'culture-histoire'], // Cherbourg
  80: ['plage-mer', 'gastronomie'], // Dieppe
  81: ['culture-histoire', 'gastronomie'], // Évreux Normandie

  // Bourgogne-Franche-Comté
  82: ['oenologie', 'gastronomie', 'culture-histoire'], // Dijon Ville
  83: ['culture-histoire', 'nature-ecotourisme'], // Besançon Viotte
  84: ['montagne', 'nature-ecotourisme'], // Belfort Montbéliard TGV
  85: ['oenologie', 'gastronomie'], // Mâcon Ville
  86: ['oenologie', 'culture-histoire'], // Auxerre Saint-Gervais
  87: ['culture-histoire', 'gastronomie'], // Nevers
  88: ['oenologie', 'gastronomie', 'culture-histoire'], // Chalon-sur-Saône

  // Corse
  89: ['plage-mer', 'sports-nautiques', 'randonnee', 'nature-ecotourisme', 'gastronomie'], // Ajaccio
  90: ['plage-mer', 'sports-nautiques', 'randonnee', 'nature-ecotourisme', 'gastronomie'], // Bastia
  91: ['plage-mer', 'sports-nautiques', 'nature-ecotourisme'], // Calvi
  92: ['randonnee', 'nature-ecotourisme', 'montagne'], // Corte
};

/**
 * Retourne les labels d'une station
 */
export function getStationLabels(stationId: number): CityLabel[] {
  return cityLabels[stationId] || [];
}

/**
 * Filtre les stations par labels
 */
export function filterStationsByLabels(stationIds: number[], labels: CityLabel[]): number[] {
  if (labels.length === 0) {
    return stationIds;
  }

  return stationIds.filter(id => {
    const stationLabels = cityLabels[id] || [];
    return labels.some(label => stationLabels.includes(label));
  });
}
