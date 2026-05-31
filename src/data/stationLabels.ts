import { CityLabel, StationData, TagEvidence } from '../types';

/**
 * Tags des gares françaises avec descriptions et sources vérifiables.
 * IDs = vrais IDs de src/data/allStations.ts (réseau SNCF mainline).
 * Pour regénérer les ~2500 autres gares : node scripts/generate-station-labels.js
 * Dernière mise à jour manuelle : 2026-05-31
 */

const W = 'https://fr.wikipedia.org/wiki/';
const SANDRE = 'https://www.sandre.eaufrance.fr/geo/PlanEau/';

function tag(label: CityLabel, reason: string, source: string, linkLabel: string, confidence = 90): TagEvidence {
  return { label, reason, source, linkLabel, confidence };
}

export const stationLabels: Record<number, StationData> = {

  // ─── Paris & Île-de-France ────────────────────────────────────────────────
  731: { // Paris Gare du Nord
    description: 'Paris, capitale de la France, métropole mondiale pour ses musées, gastronomie et architecture.',
    wikipediaUrl: W + 'Paris',
    tags: [
      tag('culture-histoire', 'Plus de 130 musées dont le Louvre et le Musée d\'Orsay', W + 'Paris', 'Découvrir Paris', 100),
      tag('gastronomie', 'Capitale gastronomique mondiale, restaurants étoilés Michelin', W + 'Gastronomie_française', 'Voir la gastronomie', 100),
    ],
  },
  2552: { // Paris Gare de Lyon
    description: 'Paris, capitale de la France.',
    wikipediaUrl: W + 'Paris',
    tags: [
      tag('culture-histoire', 'Plus de 130 musées dont le Louvre et le Musée d\'Orsay', W + 'Paris', 'Découvrir Paris', 100),
      tag('gastronomie', 'Capitale gastronomique mondiale', W + 'Gastronomie_française', 'Voir la gastronomie', 100),
    ],
  },
  1147: { // Paris Montparnasse
    description: 'Paris Montparnasse, quartier culturel et artistique.',
    wikipediaUrl: W + 'Montparnasse',
    tags: [
      tag('culture-histoire', 'Quartier Montparnasse, musées, cimetière célèbre', W + 'Montparnasse', 'Découvrir Montparnasse', 95),
      tag('gastronomie', 'Crêperies bretonnes, brasseries historiques', W + 'Gastronomie_française', 'Voir la gastronomie', 85),
    ],
  },
  1137: { // Paris Saint-Lazare
    description: 'Paris Saint-Lazare, quartier des grands magasins et de l\'Opéra.',
    wikipediaUrl: W + 'Paris',
    tags: [
      tag('culture-histoire', 'Opéra Garnier, Musée de l\'Orangerie, Palais Royal', W + 'Opéra_Garnier', 'Voir l\'Opéra Garnier', 100),
      tag('shopping', 'Galeries Lafayette, Printemps Haussmann', W + 'Galeries_Lafayette', 'Voir les grands magasins', 100),
    ],
  },
  178: { // Paris Est
    description: 'Paris Est, porte vers l\'Alsace, la Champagne et l\'Europe centrale.',
    wikipediaUrl: W + 'Paris',
    tags: [
      tag('culture-histoire', 'Canal Saint-Martin, quartiers animés du 10e', W + 'Canal_Saint-Martin', 'Voir le Canal Saint-Martin', 85),
    ],
  },
  2554: { // Paris Bercy
    description: 'Paris Bercy, quartier vivant et culturel.',
    wikipediaUrl: W + 'Paris',
    tags: [
      tag('culture-histoire', 'Bercy Village, Cinémathèque, Bois de Vincennes', W + 'Paris', 'Voir Paris', 80),
    ],
  },
  1745: { // Paris Austerlitz
    description: 'Paris Austerlitz, quartier latin et Museum national.',
    wikipediaUrl: W + 'Paris',
    tags: [
      tag('culture-histoire', 'Museum national d\'Histoire naturelle, Jardin des plantes', W + 'Muséum_national_d\'Histoire_naturelle', 'Voir le Museum', 90),
    ],
  },
  171: { // Marne-la-Vallée Chessy
    description: 'Marne-la-Vallée accueille Disneyland Paris, premier parc d\'attractions européen.',
    wikipediaUrl: W + 'Disneyland_Paris',
    tags: [
      tag('kid-friendly', 'Disneyland Paris, 1er parc d\'attractions d\'Europe', W + 'Disneyland_Paris', 'Voir Disneyland Paris', 100),
    ],
  },
  1150: { // Versailles Chantiers
    description: 'Versailles est connue pour son château classé UNESCO, résidence des rois de France.',
    wikipediaUrl: W + 'Versailles',
    tags: [
      tag('culture-histoire', 'Château de Versailles classé UNESCO, jardins Le Nôtre', W + 'Château_de_Versailles', 'Voir le Château de Versailles', 100),
    ],
  },

  // ─── Auvergne-Rhône-Alpes ────────────────────────────────────────────────
  2927: { // Lyon Part Dieu
    description: 'Lyon, capitale des Gaules classée UNESCO, reconnue comme la capitale gastronomique de la France.',
    wikipediaUrl: W + 'Lyon',
    tags: [
      tag('gastronomie', 'Capitale gastronomique de France, bouchons lyonnais, Paul Bocuse', W + 'Gastronomie_lyonnaise', 'Découvrir la gastronomie lyonnaise', 100),
      tag('culture-histoire', 'Vieux Lyon classé UNESCO, musée gallo-romain, traboules', W + 'Vieux-Lyon', 'Voir le Vieux Lyon', 100),
    ],
  },
  2908: { // Lyon Perrache
    description: 'Lyon, au cœur de la presqu\'île lyonnaise.',
    wikipediaUrl: W + 'Lyon',
    tags: [
      tag('gastronomie', 'Capitale gastronomique de France, bouchons lyonnais', W + 'Gastronomie_lyonnaise', 'Découvrir la gastronomie lyonnaise', 100),
      tag('culture-histoire', 'Vieux Lyon classé UNESCO, traboules', W + 'Vieux-Lyon', 'Voir le Vieux Lyon', 100),
    ],
  },
  1015: { // Grenoble
    description: 'Grenoble est une ville universitaire au pied des Alpes, porte d\'entrée vers de nombreuses stations de ski.',
    wikipediaUrl: W + 'Grenoble',
    tags: [
      tag('montagne', 'Grenoble entourée de 3 massifs : Belledonne, Chartreuse, Vercors', W + 'Grenoble', 'Voir Grenoble', 100),
      tag('sports-hiver', 'Accès à Chamrousse, Les Deux Alpes, Alpe d\'Huez', W + 'Chamrousse', 'Voir les stations de ski', 95),
      tag('randonnee', 'Parc Naturel Régional du Vercors à 20km, GR91', 'https://www.pnr-vercors.fr/', 'Voir le Parc du Vercors', 95),
    ],
  },
  2672: { // Chambéry
    description: 'Chambéry est la préfecture de la Savoie, proche du Lac du Bourget, plus grand lac naturel de France.',
    wikipediaUrl: W + 'Chambéry',
    tags: [
      tag('montagne', 'Préfecture de Savoie, massif des Bauges à 15km', W + 'Chambéry', 'Voir Chambéry', 95),
      tag('lacs-rivieres', 'Lac du Bourget (4 450 ha), plus grand lac naturel de France, à 8km', SANDRE + 'FRF44', 'Voir le Lac du Bourget sur SANDRE', 100),
      tag('sports-hiver', 'Accès aux Saisies, Porte des Alpes, Belledonne', W + 'Savoie', 'Voir les stations', 90),
      tag('randonnee', 'Parc Naturel Régional du Massif des Bauges à 15km', 'https://www.parcdesbauges.com/', 'Voir le Parc des Bauges', 90),
    ],
  },
  3099: { // Aix-les-Bains
    description: 'Aix-les-Bains est une ville thermale en bord du Lac du Bourget, plus grand lac naturel de France.',
    wikipediaUrl: W + 'Aix-les-Bains',
    tags: [
      tag('lacs-rivieres', 'Lac du Bourget (4 450 ha), plus grand lac naturel de France, riverain direct', SANDRE + 'FRF44', 'Voir le Lac du Bourget sur SANDRE', 100),
      tag('montagne', 'Préalpes de Savoie, Dent du Chat dominant le lac', W + 'Aix-les-Bains', 'Voir Aix-les-Bains', 85),
      tag('ville-thermale', 'Station thermale réputée depuis l\'Antiquité romaine', W + 'Aix-les-Bains', 'Voir Aix-les-Bains', 100),
    ],
  },
  3175: { // Annecy
    description: 'Annecy, surnommée la "Venise des Alpes", est une ville de Haute-Savoie bordée d\'un lac aux eaux cristallines.',
    wikipediaUrl: W + 'Annecy',
    tags: [
      tag('lacs-rivieres', 'Lac d\'Annecy (2 727 ha), l\'un des lacs les plus purs d\'Europe', SANDRE + 'FRF10', 'Voir le Lac d\'Annecy sur SANDRE', 100),
      tag('montagne', 'Haute-Savoie, massif des Aravis, vue sur les Alpes', W + 'Annecy', 'Voir Annecy', 95),
      tag('randonnee', 'Tour du Lac d\'Annecy, Parc des Bauges à 20km', 'https://www.cirkwi.com/fr/circuit/21009-tour-du-lac-d-annecy', 'Voir le tour du lac', 95),
      tag('sports-hiver', 'La Clusaz, Le Grand-Bornand à 30km', W + 'La_Clusaz', 'Voir La Clusaz', 85),
    ],
  },
  3402: { // Valence TGV
    description: 'Valence est la préfecture de la Drôme, porte d\'entrée de la Drôme provençale.',
    wikipediaUrl: W + 'Valence_(Drôme)',
    tags: [
      tag('oenologie', 'AOC Crozes-Hermitage, Hermitage, Cornas à 15km', 'https://www.inter-rhone.com/', 'Voir les AOC du Rhône Nord', 95),
      tag('gastronomie', 'Vignobles de Crozes-Hermitage AOC, cuisine provençale', 'https://www.inter-rhone.com/', 'Voir les vins', 85),
    ],
  },
  2974: { // Saint-Étienne Châteaucreux
    description: 'Saint-Étienne est une ville industrielle reconvertie en capitale du design.',
    wikipediaUrl: W + 'Saint-Étienne',
    tags: [
      tag('culture-histoire', 'Ville Créative UNESCO du design, musée d\'art moderne', W + 'Saint-Étienne', 'Voir Saint-Étienne', 85),
      tag('art-architecture', 'Cité du Design, patrimoine industriel', W + 'Cité_du_Design', 'Voir la Cité du Design', 90),
    ],
  },
  3041: { // Clermont-Ferrand
    description: 'Clermont-Ferrand est la préfecture du Puy-de-Dôme, entourée de volcans du Massif Central.',
    wikipediaUrl: W + 'Clermont-Ferrand',
    tags: [
      tag('randonnee', 'Parc Naturel Régional des Volcans d\'Auvergne, GR441 autour du Puy de Dôme', 'https://www.parc-volcans-auvergne.com/', 'Voir le Parc des Volcans', 100),
      tag('nature-ecotourisme', 'Chaîne des Puys classée UNESCO, réserve biosphère', W + 'Chaîne_des_Puys', 'Voir la Chaîne des Puys', 100),
      tag('gastronomie', 'AOC Fourme d\'Ambert, Saint-Nectaire, Cantal', 'https://www.inao.gouv.fr/', 'Voir les AOC Auvergne', 90),
    ],
  },

  // ─── Provence-Alpes-Côte d'Azur ──────────────────────────────────────────
  3246: { // Marseille Saint-Charles
    description: 'Marseille est la deuxième ville de France, fondée il y a 2 600 ans sur la Méditerranée.',
    wikipediaUrl: W + 'Marseille',
    tags: [
      tag('plage-mer', 'Calanques de Marseille, côte méditerranéenne, plages des Catalans', W + 'Calanques_de_Marseille', 'Voir les calanques', 100),
      tag('culture-histoire', 'Ville fondée en 600 av. J.-C., MuCEM, Notre-Dame de la Garde', W + 'Marseille', 'Découvrir Marseille', 100),
      tag('gastronomie', 'Bouillabaisse, navettes, marchés du Vieux Port', W + 'Bouillabaisse', 'Voir la gastronomie marseillaise', 95),
    ],
  },
  3324: { // Nice-Ville
    description: 'Nice est la cinquième ville de France, capitale de la Côte d\'Azur.',
    wikipediaUrl: W + 'Nice',
    tags: [
      tag('plage-mer', 'Promenade des Anglais, plages de la Baie des Anges, Méditerranée', W + 'Promenade_des_Anglais', 'Voir la Promenade des Anglais', 100),
      tag('culture-histoire', 'Vieux-Nice classé, musée Matisse, musée Chagall', W + 'Vieux-Nice', 'Voir le Vieux-Nice', 95),
      tag('gastronomie', 'Socca, pissaladière, cuisine niçoise AOC', W + 'Cuisine_niçoise', 'Voir la cuisine niçoise', 90),
    ],
  },
  3305: { // Toulon
    description: 'Toulon est une ville méditerranéenne et premier port militaire de France.',
    wikipediaUrl: W + 'Toulon',
    tags: [
      tag('plage-mer', 'Côte méditerranéenne, plages de Mourillon, îles d\'Or à proximité', W + 'Toulon', 'Voir Toulon', 95),
      tag('sports-nautiques', 'Voile, plongée, premier port militaire de France', W + 'Port_de_Toulon', 'Voir le port', 85),
    ],
  },
  998: { // Aix-en-Provence TGV
    description: 'Aix-en-Provence est une ville provençale élégante, ville de Cézanne.',
    wikipediaUrl: W + 'Aix-en-Provence',
    tags: [
      tag('culture-histoire', 'Ville de Cézanne, cathédrale Saint-Sauveur, cours Mirabeau', W + 'Aix-en-Provence', 'Découvrir Aix-en-Provence', 95),
      tag('gastronomie', 'Calissons d\'Aix AOC, marchés provençaux, rosés de Provence', W + 'Calisson', 'Voir la gastronomie provençale', 90),
    ],
  },
  3254: { // Aix-en-Provence centre
    description: 'Aix-en-Provence est une ville provençale élégante.',
    wikipediaUrl: W + 'Aix-en-Provence',
    tags: [
      tag('culture-histoire', 'Ville de Cézanne, cathédrale Saint-Sauveur, cours Mirabeau', W + 'Aix-en-Provence', 'Découvrir Aix-en-Provence', 95),
      tag('gastronomie', 'Calissons d\'Aix AOC, rosés de Provence', W + 'Calisson', 'Voir la gastronomie', 90),
    ],
  },
  997: { // Avignon TGV
    description: 'Avignon est une cité médiévale classée UNESCO, connue pour son Palais des Papes.',
    wikipediaUrl: W + 'Avignon',
    tags: [
      tag('culture-histoire', 'Palais des Papes classé UNESCO, pont Saint-Bénézet, remparts', W + 'Palais_des_papes_d\'Avignon', 'Voir le Palais des Papes', 100),
      tag('oenologie', 'AOC Châteauneuf-du-Pape, Gigondas à 20km', 'https://www.inter-rhone.com/', 'Voir les vins du Rhône', 95),
    ],
  },
  3423: { // Avignon Centre
    description: 'Avignon Centre, au cœur de la cité des papes.',
    wikipediaUrl: W + 'Avignon',
    tags: [
      tag('culture-histoire', 'Palais des Papes classé UNESCO, festival d\'Avignon', W + 'Palais_des_papes_d\'Avignon', 'Voir le Palais des Papes', 100),
      tag('oenologie', 'AOC Châteauneuf-du-Pape à 20km', 'https://www.inter-rhone.com/', 'Voir les vins du Rhône', 90),
    ],
  },
  3363: { // Cannes
    description: 'Cannes est une ville méditerranéenne connue pour son festival du film.',
    wikipediaUrl: W + 'Cannes',
    tags: [
      tag('plage-mer', 'Croisette, plages de sable fin, îles de Lérins', W + 'Cannes', 'Voir Cannes', 100),
      tag('vie-nocturne', 'Festival de Cannes, casinos, clubs sur la Croisette', W + 'Festival_de_Cannes', 'Voir le Festival de Cannes', 90),
    ],
  },
  3366: { // Antibes
    description: 'Antibes est une ville fortifiée de la Côte d\'Azur avec un musée Picasso.',
    wikipediaUrl: W + 'Antibes',
    tags: [
      tag('plage-mer', 'Plages de la Garoupe, Cap d\'Antibes, Méditerranée', W + 'Antibes', 'Voir Antibes', 95),
      tag('culture-histoire', 'Musée Picasso, remparts de Vauban, vieille ville', W + 'Château_Grimaldi_(Antibes)', 'Voir le Musée Picasso', 90),
    ],
  },

  // ─── Occitanie ────────────────────────────────────────────────────────────
  2106: { // Toulouse Matabiau
    description: 'Toulouse est la quatrième ville de France, capitale de l\'aéronautique et ville rose.',
    wikipediaUrl: W + 'Toulouse',
    tags: [
      tag('culture-histoire', 'Basilique Saint-Sernin classée UNESCO, Capitole, Cité de l\'Espace', W + 'Toulouse', 'Découvrir Toulouse', 100),
      tag('gastronomie', 'Cassoulet, saucisse de Toulouse, foie gras', W + 'Cassoulet', 'Voir la gastronomie toulousaine', 90),
    ],
  },
  3448: { // Montpellier Saint-Roch
    description: 'Montpellier est une ville dynamique du Languedoc, proche de la mer.',
    wikipediaUrl: W + 'Montpellier',
    tags: [
      tag('plage-mer', 'Palavas-les-Flots, La Grande-Motte à 15km, Méditerranée', W + 'Montpellier', 'Voir les plages', 90),
      tag('culture-histoire', 'Place de la Comédie, musée Fabre, écusson médiéval', W + 'Montpellier', 'Découvrir Montpellier', 85),
    ],
  },
  3458: { // Nîmes Centre
    description: 'Nîmes est une ville romaine avec des monuments exceptionnellement bien conservés.',
    wikipediaUrl: W + 'Nîmes',
    tags: [
      tag('culture-histoire', 'Arènes romaines (1er siècle), Maison Carrée classée UNESCO', W + 'Arènes_de_Nîmes', 'Voir les Arènes de Nîmes', 100),
    ],
  },
  3524: { // Perpignan
    description: 'Perpignan est la capitale de la Catalogne française.',
    wikipediaUrl: W + 'Perpignan',
    tags: [
      tag('plage-mer', 'Canet-en-Roussillon, côte vermeille à 15km', W + 'Perpignan', 'Voir les plages', 90),
      tag('culture-histoire', 'Palais des rois de Majorque, cathédrale Saint-Jean', W + 'Palais_des_rois_de_Majorque', 'Voir le Palais', 90),
    ],
  },
  3485: { // Béziers
    description: 'Béziers est une ville languedocienne sur le Canal du Midi.',
    wikipediaUrl: W + 'Béziers',
    tags: [
      tag('oenologie', 'Vignobles de Saint-Chinian, Faugères, Languedoc AOC', W + 'Vignoble_du_Languedoc', 'Voir les vins', 90),
      tag('culture-histoire', 'Canal du Midi classé UNESCO à 5km', W + 'Canal_du_Midi', 'Voir le Canal du Midi', 90),
    ],
  },
  3488: { // Narbonne
    description: 'Narbonne est une ville antique sur la Via Domitia.',
    wikipediaUrl: W + 'Narbonne',
    tags: [
      tag('plage-mer', 'Gruissan, Narbonne Plage à 15km', W + 'Narbonne', 'Voir les plages', 85),
      tag('oenologie', 'AOC Corbières, Fitou, La Clape', W + 'Vignoble_du_Languedoc', 'Voir les vins', 90),
    ],
  },
  2217: { // Carcassonne
    description: 'Carcassonne est une cité médiévale fortifiée classée au patrimoine mondial de l\'UNESCO.',
    wikipediaUrl: W + 'Carcassonne',
    tags: [
      tag('culture-histoire', 'Cité médiévale classée UNESCO, château comtal, remparts XIIe siècle', W + 'Carcassonne', 'Découvrir la Cité de Carcassonne', 100),
      tag('kid-friendly', 'Cité médiévale idéale pour les familles, son et lumière', W + 'Carcassonne', 'Voir Carcassonne', 85),
    ],
  },

  // ─── Nouvelle-Aquitaine ────────────────────────────────────────────────────
  1878: { // Bordeaux Saint-Jean
    description: 'Bordeaux est une ville UNESCO réputée pour ses vins et son architecture néoclassique.',
    wikipediaUrl: W + 'Bordeaux',
    tags: [
      tag('oenologie', 'Capitale mondiale du vin, 57 AOC dont Médoc, Saint-Émilion, Pomerol', W + 'Vignoble_de_Bordeaux', 'Voir les vignobles bordelais', 100),
      tag('gastronomie', 'Canelé bordelais, lamproie, huîtres du Bassin d\'Arcachon', W + 'Canelé', 'Voir la gastronomie bordelaise', 95),
      tag('culture-histoire', 'Port de la Lune classé UNESCO, place de la Bourse, Cité du Vin', W + 'Bordeaux', 'Découvrir Bordeaux', 100),
    ],
  },
  1617: { // La Rochelle
    description: 'La Rochelle est une ville portuaire de Charente-Maritime réputée pour son vieux port.',
    wikipediaUrl: W + 'La_Rochelle',
    tags: [
      tag('plage-mer', 'Côte atlantique, plages de Châtelaillon, île de Ré à 30km', W + 'La_Rochelle', 'Voir La Rochelle', 95),
      tag('sports-nautiques', 'Voile, kitesurf, port de plaisance, Route du Rhum', W + 'La_Rochelle', 'Voir le port', 90),
      tag('kid-friendly', 'Aquarium de La Rochelle, tours médiévales', W + 'Aquarium_de_La_Rochelle', 'Voir l\'aquarium', 85),
    ],
  },
  1816: { // Poitiers
    description: 'Poitiers est une ville médiévale avec de nombreuses églises romanes.',
    wikipediaUrl: W + 'Poitiers',
    tags: [
      tag('culture-histoire', 'Baptistère Saint-Jean (IVe siècle), Notre-Dame-la-Grande, art roman', W + 'Poitiers', 'Découvrir Poitiers', 90),
    ],
  },
  1988: { // Limoges Bénédictins
    description: 'Limoges est la capitale mondiale de la porcelaine et de l\'émail.',
    wikipediaUrl: W + 'Limoges',
    tags: [
      tag('culture-histoire', 'Porcelaine de Limoges, cathédrale Saint-Étienne', W + 'Porcelaine_de_Limoges', 'Voir la porcelaine', 90),
    ],
  },
  1925: { // Angoulême
    description: 'Angoulême est la capitale mondiale de la bande dessinée.',
    wikipediaUrl: W + 'Angoulême',
    tags: [
      tag('culture-histoire', 'Festival international de la BD, cathédrale Saint-Pierre', W + 'Festival_international_de_la_bande_dessinée_d\'Angoulême', 'Voir le festival BD', 90),
      tag('gastronomie', 'Cognac AOC à 30km', W + 'Cognac_(eau-de-vie)', 'Voir le cognac', 85),
    ],
  },
  2450: { // Pau
    description: 'Pau est une ville de piémont pyrénéen avec un boulevard des Pyrénées remarquable.',
    wikipediaUrl: W + 'Pau',
    tags: [
      tag('montagne', 'Porte des Pyrénées, vue panoramique sur la chaîne', W + 'Pau', 'Voir Pau', 90),
      tag('randonnee', 'Chemin de Saint-Jacques GR65, Parc National des Pyrénées', W + 'Chemin_de_Saint-Jacques-de-Compostelle_(via_Turonensis)', 'Voir le GR65', 90),
    ],
  },
  2467: { // Bayonne
    description: 'Bayonne est une ville basque réputée pour son jambon et son chocolat.',
    wikipediaUrl: W + 'Bayonne',
    tags: [
      tag('plage-mer', 'Côte basque, Biarritz à 8km, Anglet', W + 'Bayonne', 'Voir Bayonne', 90),
      tag('gastronomie', 'Jambon de Bayonne IGP, chocolat basque', W + 'Jambon_de_Bayonne', 'Voir le jambon de Bayonne', 100),
    ],
  },
  2477: { // Biarritz
    description: 'Biarritz est une station balnéaire du Pays Basque connue pour le surf.',
    wikipediaUrl: W + 'Biarritz',
    tags: [
      tag('plage-mer', 'Grande Plage, plage de la Côte des Basques, Atlantique', W + 'Biarritz', 'Voir les plages de Biarritz', 100),
      tag('sports-nautiques', 'Capitale européenne du surf, compétitions internationales', W + 'Biarritz', 'Voir le surf à Biarritz', 100),
    ],
  },

  // ─── Pays de la Loire ────────────────────────────────────────────────────
  1554: { // Nantes
    description: 'Nantes est la sixième ville de France, ancienne capitale de Bretagne.',
    wikipediaUrl: W + 'Nantes',
    tags: [
      tag('culture-histoire', 'Château des Ducs de Bretagne, machines de l\'île', W + 'Château_des_ducs_de_Bretagne', 'Voir le château', 95),
      tag('gastronomie', 'Muscadet AOC, beurre blanc nantais, galettes', W + 'Muscadet', 'Voir le muscadet', 85),
    ],
  },
  1601: { // Angers Saint-Laud
    description: 'Angers est la préfecture du Maine-et-Loire, connue pour son château médiéval.',
    wikipediaUrl: W + 'Angers',
    tags: [
      tag('culture-histoire', 'Château d\'Angers (tapisserie de l\'Apocalypse)', W + 'Château_d\'Angers', 'Voir le Château d\'Angers', 95),
      tag('oenologie', 'AOC Anjou, Coteaux du Layon, Savennières', 'https://www.vinsvaldeloire.fr/', 'Voir les vins d\'Anjou', 90),
    ],
  },
  1186: { // Le Mans
    description: 'Le Mans est connue pour ses 24 Heures du Mans et sa vieille ville médiévale.',
    wikipediaUrl: W + 'Le_Mans',
    tags: [
      tag('culture-histoire', 'Cité Plantagenêt, cathédrale Saint-Julien, 24 Heures du Mans', W + 'Le_Mans', 'Voir Le Mans', 85),
    ],
  },
  1588: { // Saint-Nazaire
    description: 'Saint-Nazaire est une ville portuaire à l\'embouchure de la Loire.',
    wikipediaUrl: W + 'Saint-Nazaire',
    tags: [
      tag('plage-mer', 'Côte atlantique, plage de Saint-Marc, embouchure de la Loire', W + 'Saint-Nazaire', 'Voir Saint-Nazaire', 80),
    ],
  },
  1544: { // Laval
    description: 'Laval est la préfecture de la Mayenne.',
    wikipediaUrl: W + 'Laval_(Mayenne)',
    tags: [
      tag('culture-histoire', 'Vieux château médiéval, musée d\'Art Naïf Henri Rousseau', W + 'Laval_(Mayenne)', 'Voir Laval', 75),
    ],
  },

  // ─── Bretagne ─────────────────────────────────────────────────────────────
  1411: { // Rennes
    description: 'Rennes est la capitale de la Bretagne, ville universitaire dynamique.',
    wikipediaUrl: W + 'Rennes',
    tags: [
      tag('culture-histoire', 'Centre médiéval, parlement de Bretagne, musée de Bretagne', W + 'Rennes', 'Découvrir Rennes', 90),
      tag('gastronomie', 'Galettes bretonnes, cidre IGP, marché des Lices', W + 'Crêpe_bretonne', 'Voir la gastronomie bretonne', 90),
    ],
  },
  1480: { // Brest
    description: 'Brest est une ville bretonne en pointe finistèrienne.',
    wikipediaUrl: W + 'Brest',
    tags: [
      tag('plage-mer', 'Presqu\'île de Crozon à 30km, Finistère, côte atlantique', W + 'Brest', 'Voir Brest', 90),
      tag('sports-nautiques', 'Voile, rade de Brest, Océanopolis', W + 'Océanopolis', 'Voir Océanopolis', 85),
    ],
  },
  1484: { // Quimper
    description: 'Quimper est la préfecture du Finistère.',
    wikipediaUrl: W + 'Quimper',
    tags: [
      tag('plage-mer', 'Bénodet à 20km, côte du Finistère', W + 'Quimper', 'Voir les plages', 85),
      tag('culture-histoire', 'Cathédrale Saint-Corentin, festival de Cornouaille', W + 'Quimper', 'Découvrir Quimper', 90),
    ],
  },
  1445: { // Saint-Brieuc
    description: 'Saint-Brieuc est la préfecture des Côtes-d\'Armor.',
    wikipediaUrl: W + 'Saint-Brieuc',
    tags: [
      tag('plage-mer', 'Baie de Saint-Brieuc, Côtes-d\'Armor', W + 'Saint-Brieuc', 'Voir Saint-Brieuc', 85),
      tag('randonnee', 'GR34 (sentier des douaniers côtiers)', W + 'GR34', 'Voir le GR34', 90),
    ],
  },
  1497: { // Lorient
    description: 'Lorient est une ville bretonne connue pour son festival interceltique.',
    wikipediaUrl: W + 'Lorient',
    tags: [
      tag('plage-mer', 'Côte atlantique, presqu\'île de Quiberon à 40km', W + 'Lorient', 'Voir Lorient', 85),
      tag('sports-nautiques', 'Voile, Vendée Globe, port de plaisance', W + 'Lorient', 'Voir le port', 85),
    ],
  },
  1505: { // Vannes
    description: 'Vannes est une ville médiévale bretonne aux portes du golfe du Morbihan.',
    wikipediaUrl: W + 'Vannes',
    tags: [
      tag('plage-mer', 'Golfe du Morbihan, archipel de 40 îles', W + 'Golfe_du_Morbihan', 'Voir le Golfe du Morbihan', 95),
      tag('culture-histoire', 'Remparts médiévaux, cathédrale Saint-Pierre', W + 'Vannes', 'Découvrir Vannes', 90),
    ],
  },

  // ─── Centre-Val de Loire ──────────────────────────────────────────────────
  1754: { // Tours
    description: 'Tours est la capitale de la Touraine, au cœur du Val de Loire classé UNESCO.',
    wikipediaUrl: W + 'Tours',
    tags: [
      tag('culture-histoire', 'Val de Loire classé UNESCO, cathédrale Saint-Gatien', W + 'Tours', 'Découvrir Tours', 95),
      tag('oenologie', 'AOC Vouvray, Montlouis, Chinon, Bourgueil', 'https://www.vinsvaldeloire.fr/', 'Voir les vins du Val de Loire', 95),
    ],
  },
  1719: { // Orléans
    description: 'Orléans est la ville de Jeanne d\'Arc, au bord de la Loire.',
    wikipediaUrl: W + 'Orléans',
    tags: [
      tag('culture-histoire', 'Ville de Jeanne d\'Arc, cathédrale Sainte-Croix', W + 'Orléans', 'Découvrir Orléans', 90),
    ],
  },
  1784: { // Blois-Chambord
    description: 'Blois est une ville royale du Val de Loire avec un château des rois de France.',
    wikipediaUrl: W + 'Blois',
    tags: [
      tag('culture-histoire', 'Château royal de Blois, Val de Loire classé UNESCO', W + 'Château_de_Blois', 'Voir le Château de Blois', 95),
      tag('oenologie', 'AOC Cheverny, Valençay, vignobles du Val de Loire', 'https://www.vinsvaldeloire.fr/', 'Voir les vins', 85),
    ],
  },
  1854: { // Bourges
    description: 'Bourges est une ville médiévale du Cher avec une cathédrale gothique classée UNESCO.',
    wikipediaUrl: W + 'Bourges',
    tags: [
      tag('culture-histoire', 'Cathédrale Saint-Étienne classée UNESCO, Palais Jacques Cœur', W + 'Cathédrale_Saint-Étienne_de_Bourges', 'Voir la cathédrale de Bourges', 100),
    ],
  },
  2086: { // Châteauroux
    description: 'Châteauroux est la préfecture de l\'Indre.',
    wikipediaUrl: W + 'Châteauroux',
    tags: [
      tag('nature-ecotourisme', 'Brenne — Parc Naturel Régional à 40km, étangs et oiseaux', 'https://www.parc-naturel-brenne.fr/', 'Voir le Parc de la Brenne', 85),
    ],
  },

  // ─── Grand Est ────────────────────────────────────────────────────────────
  589: { // Strasbourg
    description: 'Strasbourg est la capitale de l\'Alsace et siège du Parlement européen, vieille ville classée UNESCO.',
    wikipediaUrl: W + 'Strasbourg',
    tags: [
      tag('culture-histoire', 'Grande Île classée UNESCO, cathédrale Notre-Dame, Parlement européen', W + 'Strasbourg', 'Découvrir Strasbourg', 100),
      tag('gastronomie', 'Choucroute alsacienne, baeckeoffe, tarte flambée', W + 'Gastronomie_alsacienne', 'Voir la gastronomie alsacienne', 95),
      tag('oenologie', 'Route des vins d\'Alsace, Riesling, Gewurztraminer AOC', 'https://www.vinsalsace.com/', 'Voir les vins d\'Alsace', 95),
    ],
  },
  515: { // Metz
    description: 'Metz est une ville lorraine avec une cathédrale gothique aux vitraux de Chagall.',
    wikipediaUrl: W + 'Metz',
    tags: [
      tag('culture-histoire', 'Cathédrale Saint-Étienne (lanterne de Dieu), Centre Pompidou-Metz', W + 'Cathédrale_Saint-Étienne_de_Metz', 'Voir la cathédrale de Metz', 95),
      tag('gastronomie', 'Quiche lorraine, mirabelle de Lorraine IGP', W + 'Quiche_lorraine', 'Voir la gastronomie lorraine', 85),
    ],
  },
  331: { // Reims
    description: 'Reims est la ville du sacre des rois de France et de la champagne.',
    wikipediaUrl: W + 'Reims',
    tags: [
      tag('culture-histoire', 'Cathédrale Notre-Dame classée UNESCO, sacre des rois de France', W + 'Cathédrale_Notre-Dame_de_Reims', 'Voir la cathédrale de Reims', 100),
      tag('oenologie', 'Champagne AOC, caves de Reims, Moët & Chandon, Veuve Clicquot', W + 'Champagne_(AOC)', 'Voir les caves de champagne', 100),
    ],
  },
  242: { // Nancy
    description: 'Nancy est la capitale de la Lorraine avec la place Stanislas classée UNESCO.',
    wikipediaUrl: W + 'Nancy',
    tags: [
      tag('culture-histoire', 'Place Stanislas classée UNESCO, École de Nancy (Art Nouveau)', W + 'Place_Stanislas', 'Voir la Place Stanislas', 100),
      tag('art-architecture', 'Art Nouveau de l\'École de Nancy', W + 'École_de_Nancy', 'Voir l\'Art Nouveau', 95),
    ],
  },
  1709: { // Mulhouse
    description: 'Mulhouse est une ville alsacienne avec des musées techniques d\'exception.',
    wikipediaUrl: W + 'Mulhouse',
    tags: [
      tag('culture-histoire', 'Cité du Train (plus grand musée ferroviaire d\'Europe), Cité de l\'Automobile', W + 'Cité_du_Train', 'Voir la Cité du Train', 90),
    ],
  },
  423: { // Colmar
    description: 'Colmar est une ville alsacienne pittoresque avec ses maisons à colombages.',
    wikipediaUrl: W + 'Colmar',
    tags: [
      tag('oenologie', 'Route des vins d\'Alsace à 5km, Gewurztraminer, Riesling', 'https://www.vinsalsace.com/', 'Voir la route des vins', 100),
      tag('gastronomie', 'Tarte flambée, choucroute, baeckeoffe', W + 'Gastronomie_alsacienne', 'Voir la gastronomie alsacienne', 90),
      tag('culture-histoire', 'Petite Venise, maisons à colombages, musée Unterlinden', W + 'Colmar', 'Découvrir Colmar', 95),
    ],
  },
  339: { // Épernay
    description: 'Épernay est la capitale mondiale du champagne avec son Avenue de Champagne.',
    wikipediaUrl: W + 'Épernay',
    tags: [
      tag('oenologie', 'Avenue de Champagne, Moët & Chandon, Pol Roger, caves champagne', W + 'Épernay', 'Voir l\'Avenue de Champagne', 100),
      tag('gastronomie', 'Champagne AOC, gastronomie champenoise', W + 'Champagne_(AOC)', 'Voir les caves', 100),
    ],
  },
  203: { // Troyes
    description: 'Troyes est une ville médiévale champenoise avec un centre historique exceptionnel.',
    wikipediaUrl: W + 'Troyes',
    tags: [
      tag('culture-histoire', 'Centre médiéval exceptionnel, 7 églises gothiques, maisons à pans de bois', W + 'Troyes', 'Découvrir Troyes', 95),
    ],
  },
  355: { // Charleville-Mézières
    description: 'Charleville-Mézières est la préfecture des Ardennes, patrie de Rimbaud.',
    wikipediaUrl: W + 'Charleville-Mézières',
    tags: [
      tag('randonnee', 'Forêt des Ardennes, vallée de la Meuse, GR12', W + 'Charleville-Mézières', 'Voir Charleville-Mézières', 80),
    ],
  },

  // ─── Hauts-de-France ──────────────────────────────────────────────────────
  799: { // Lille Flandres
    description: 'Lille est la capitale des Hauts-de-France, métropole avec un remarquable centre flamand.',
    wikipediaUrl: W + 'Lille',
    tags: [
      tag('culture-histoire', 'Vieux-Lille flamand, musée des Beaux-Arts, citadelle Vauban', W + 'Lille', 'Découvrir Lille', 95),
      tag('gastronomie', 'Carbonnade flamande, moules-frites, maroilles', W + 'Carbonnade_flamande', 'Voir la gastronomie du Nord', 90),
    ],
  },
  728: { // Lille Europe
    description: 'Lille Europe, gare internationale au cœur de la métropole lilloise.',
    wikipediaUrl: W + 'Lille',
    tags: [
      tag('culture-histoire', 'Vieux-Lille, musée des Beaux-Arts, citadelle Vauban', W + 'Lille', 'Découvrir Lille', 95),
      tag('gastronomie', 'Carbonnade flamande, moules, maroilles', W + 'Carbonnade_flamande', 'Voir la gastronomie', 90),
    ],
  },
  951: { // Amiens
    description: 'Amiens est la préfecture de la Somme avec la plus grande cathédrale gothique de France.',
    wikipediaUrl: W + 'Amiens',
    tags: [
      tag('culture-histoire', 'Cathédrale Notre-Dame classée UNESCO, hortillonnages, Jules Verne', W + 'Cathédrale_Notre-Dame_d\'Amiens', 'Voir la cathédrale d\'Amiens', 100),
    ],
  },
  1041: { // Arras
    description: 'Arras est une ville du Pas-de-Calais avec des places flamandes remarquables.',
    wikipediaUrl: W + 'Arras',
    tags: [
      tag('culture-histoire', 'Places flamandes, beffroi classé UNESCO, mémoriaux 14-18', W + 'Arras', 'Découvrir Arras', 90),
    ],
  },
  986: { // Calais Ville
    description: 'Calais est un port de la Manche et ville de la dentelle.',
    wikipediaUrl: W + 'Calais',
    tags: [
      tag('plage-mer', 'Côte d\'Opale, Cap Blanc-Nez à 15km, Manche', W + 'Calais', 'Voir Calais', 85),
    ],
  },
  780: { // Dunkerque
    description: 'Dunkerque est une ville portuaire du Nord réputée pour son carnaval.',
    wikipediaUrl: W + 'Dunkerque',
    tags: [
      tag('plage-mer', 'Côte d\'Opale, plage de Malo-les-Bains, mer du Nord', W + 'Dunkerque', 'Voir Dunkerque', 80),
    ],
  },
  1077: { // Valenciennes
    description: 'Valenciennes est une ville du Nord avec un musée des Beaux-Arts remarquable.',
    wikipediaUrl: W + 'Valenciennes',
    tags: [
      tag('culture-histoire', 'Musée des Beaux-Arts (Rubens, Watteau), beffroi', W + 'Valenciennes', 'Voir Valenciennes', 80),
    ],
  },
  1090: { // Douai
    description: 'Douai est une ville flamande du Nord avec un célèbre beffroi.',
    wikipediaUrl: W + 'Douai',
    tags: [
      tag('culture-histoire', 'Beffroi classé UNESCO, musée de la Chartreuse', W + 'Douai', 'Voir Douai', 80),
    ],
  },
  819: { // Tourcoing
    description: 'Tourcoing est une ville de la métropole lilloise.',
    wikipediaUrl: W + 'Tourcoing',
    tags: [
      tag('shopping', 'Métropole lilloise, galeries commerciales', W + 'Tourcoing', 'Voir Tourcoing', 70),
    ],
  },
  827: { // Roubaix
    description: 'Roubaix est une ville textile reconvertie en cité du design.',
    wikipediaUrl: W + 'Roubaix',
    tags: [
      tag('shopping', 'La Condition Publique, McArthurGlen, ville du textile', W + 'Roubaix', 'Voir Roubaix', 75),
    ],
  },

  // ─── Normandie ────────────────────────────────────────────────────────────
  1297: { // Rouen Rive Droite
    description: 'Rouen est la capitale de la Normandie, ville de Jeanne d\'Arc.',
    wikipediaUrl: W + 'Rouen',
    tags: [
      tag('culture-histoire', 'Cathédrale Notre-Dame (peinte par Monet), Gros-Horloge, Vieux-Rouen', W + 'Cathédrale_Notre-Dame_de_Rouen', 'Voir la cathédrale de Rouen', 95),
      tag('gastronomie', 'Canard à la rouennaise, camembert, calvados AOC', W + 'Rouen', 'Voir la gastronomie normande', 85),
    ],
  },
  1315: { // Le Havre
    description: 'Le Havre est une ville portuaire normande classée UNESCO.',
    wikipediaUrl: W + 'Le_Havre',
    tags: [
      tag('plage-mer', 'Côte Normande, plage du Havre, Étretat à 30km', W + 'Le_Havre', 'Voir Le Havre', 90),
      tag('culture-histoire', 'Centre-ville classé UNESCO reconstruit par Auguste Perret', W + 'Le_Havre', 'Voir Le Havre', 90),
    ],
  },
  1360: { // Caen
    description: 'Caen est la capitale de la Normandie et ville mémorial du Débarquement.',
    wikipediaUrl: W + 'Caen',
    tags: [
      tag('culture-histoire', 'Mémorial de Caen, château de Guillaume le Conquérant', W + 'Mémorial_de_Caen', 'Voir le Mémorial de Caen', 95),
      tag('gastronomie', 'Trippes à la mode de Caen, calvados AOC, camembert de Normandie', W + 'Calvados_(eau-de-vie)', 'Voir les produits normands', 90),
      tag('kid-friendly', 'Mémorial de Caen, plages du Débarquement à 20km', W + 'Caen', 'Voir Caen', 80),
    ],
  },
  1381: { // Cherbourg
    description: 'Cherbourg est un port normand de la Manche.',
    wikipediaUrl: W + 'Cherbourg-en-Cotentin',
    tags: [
      tag('plage-mer', 'Presqu\'île du Cotentin, côte normande', W + 'Cherbourg-en-Cotentin', 'Voir Cherbourg', 85),
      tag('culture-histoire', 'Cité de la Mer (transatlantiques)', W + 'Cité_de_la_Mer', 'Voir la Cité de la Mer', 85),
    ],
  },
  1324: { // Dieppe
    description: 'Dieppe est une station balnéaire normande.',
    wikipediaUrl: W + 'Dieppe',
    tags: [
      tag('plage-mer', 'Côte d\'Albâtre, falaises, plage de galets normande', W + 'Dieppe', 'Voir Dieppe', 90),
    ],
  },
  1139: { // Évreux Normandie
    description: 'Évreux est la préfecture de l\'Eure en Normandie.',
    wikipediaUrl: W + 'Évreux',
    tags: [
      tag('culture-histoire', 'Cathédrale Notre-Dame, musée d\'Évreux', W + 'Évreux', 'Voir Évreux', 75),
    ],
  },

  // ─── Bourgogne-Franche-Comté ──────────────────────────────────────────────
  2749: { // Dijon
    description: 'Dijon est la capitale de la Bourgogne, ville de la moutarde et des grands vins.',
    wikipediaUrl: W + 'Dijon',
    tags: [
      tag('oenologie', 'Route des Grands Crus de Bourgogne, Gevrey-Chambertin, Pommard AOC', W + 'Vignoble_de_Bourgogne', 'Voir les vignobles de Bourgogne', 100),
      tag('gastronomie', 'Moutarde de Dijon, pain d\'épices, escargots de Bourgogne', W + 'Moutarde_de_Dijon', 'Voir la gastronomie dijonnaise', 95),
      tag('culture-histoire', 'Palais des Ducs, musée des Beaux-Arts', W + 'Dijon', 'Découvrir Dijon', 90),
    ],
  },
  2825: { // Besançon Viotte
    description: 'Besançon est la capitale de la Franche-Comté avec une citadelle classée UNESCO.',
    wikipediaUrl: W + 'Besançon',
    tags: [
      tag('culture-histoire', 'Citadelle de Vauban classée UNESCO, horloge astronomique', W + 'Citadelle_de_Besançon', 'Voir la Citadelle', 95),
      tag('lacs-rivieres', 'Boucles du Doubs, gorges du Doubs à 30km', W + 'Doubs_(rivière)', 'Voir les gorges du Doubs', 85),
    ],
  },
  2963: { // Mâcon
    description: 'Mâcon est une ville bourguignonne sur la Saône, porte du Mâconnais viticole.',
    wikipediaUrl: W + 'Mâcon',
    tags: [
      tag('oenologie', 'AOC Mâcon, Pouilly-Fuissé, Saint-Véran', W + 'Vignoble_du_Mâconnais', 'Voir les vins du Mâconnais', 95),
    ],
  },
  2537: { // Auxerre Saint-Gervais
    description: 'Auxerre est une ville de Bourgogne sur l\'Yonne.',
    wikipediaUrl: W + 'Auxerre',
    tags: [
      tag('oenologie', 'Chablis AOC à 20km, vignobles de l\'Yonne', W + 'Chablis_(AOC)', 'Voir les vins de Chablis', 90),
      tag('culture-histoire', 'Cathédrale Saint-Étienne, abbaye Saint-Germain', W + 'Auxerre', 'Voir Auxerre', 80),
    ],
  },
  2600: { // Nevers
    description: 'Nevers est la préfecture de la Nièvre, connue pour sa faïence.',
    wikipediaUrl: W + 'Nevers',
    tags: [
      tag('culture-histoire', 'Faïence de Nevers, cathédrale, circuit de Nevers Magny-Cours', W + 'Nevers', 'Voir Nevers', 80),
    ],
  },
  2953: { // Chalon-sur-Saône
    description: 'Chalon-sur-Saône est une ville viticole bourguignonne, berceau de la photographie.',
    wikipediaUrl: W + 'Chalon-sur-Saône',
    tags: [
      tag('oenologie', 'Côte Chalonnaise, AOC Mercurey, Givry, Rully', W + 'Côte_chalonnaise', 'Voir les vins chalonnais', 90),
      tag('culture-histoire', 'Musée Nicéphore Niépce (invention de la photographie)', W + 'Nicéphore_Niépce', 'Voir le Musée Niépce', 85),
    ],
  },
};

// ─── Fonctions d'accès ────────────────────────────────────────────────────

export function getStationData(stationId: number): StationData | null {
  return stationLabels[stationId] || null;
}

export function getStationLabels(stationId: number): CityLabel[] {
  return stationLabels[stationId]?.tags.map(t => t.label) || [];
}

export function getStationTags(stationId: number): TagEvidence[] {
  return stationLabels[stationId]?.tags || [];
}

export function filterStationsByLabels(
  stationIds: (number | string)[],
  labels: CityLabel[],
  mode: 'OR' | 'AND' = 'OR'
): (number | string)[] {
  if (labels.length === 0) return stationIds;
  return stationIds.filter(id => {
    const numId = typeof id === 'number' ? id : parseInt(String(id));
    const stationLabelValues = getStationLabels(numId);
    if (mode === 'AND') return labels.every(l => stationLabelValues.includes(l));
    return labels.some(l => stationLabelValues.includes(l));
  });
}

export function countLabelMatches(stationId: number | string, labels: CityLabel[]): number {
  const numId = typeof stationId === 'number' ? stationId : parseInt(String(stationId));
  return getStationLabels(numId).filter(l => labels.includes(l)).length;
}
