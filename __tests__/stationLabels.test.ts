import {
  getStationLabels,
  getStationTags,
  getStationData,
  filterStationsByLabels,
  countLabelMatches,
} from '../src/data/stationLabels';

describe('stationLabels — données manuelles', () => {
  describe('getStationLabels', () => {
    it('retourne les labels d\'Annecy (id=14)', () => {
      const labels = getStationLabels(14);
      expect(labels).toContain('lacs-rivieres');
      expect(labels).toContain('montagne');
    });

    it('retourne les labels de Bordeaux (id=33)', () => {
      const labels = getStationLabels(33);
      expect(labels).toContain('oenologie');
      expect(labels).toContain('gastronomie');
      expect(labels).toContain('culture-histoire');
    });

    it('retourne [] pour une gare inconnue', () => {
      expect(getStationLabels(9999)).toEqual([]);
    });

    it('Nice (id=19) a le tag plage-mer', () => {
      expect(getStationLabels(19)).toContain('plage-mer');
    });

    it('Chamonix / Grenoble (id=12) a montagne et sports-hiver', () => {
      const labels = getStationLabels(12);
      expect(labels).toContain('montagne');
      expect(labels).toContain('sports-hiver');
    });
  });

  describe('getStationData', () => {
    it('Annecy a une description', () => {
      const data = getStationData(14);
      expect(data).not.toBeNull();
      expect(data?.description).toContain('Annecy');
    });

    it('Annecy a une URL Wikipedia', () => {
      const data = getStationData(14);
      expect(data?.wikipediaUrl).toContain('wikipedia.org');
    });

    it('Lac d\'Annecy a une source SANDRE', () => {
      const data = getStationData(14);
      const lacTag = data?.tags.find(t => t.label === 'lacs-rivieres');
      expect(lacTag).toBeDefined();
      expect(lacTag?.source).toContain('sandre');
    });

    it('retourne null pour une gare inconnue', () => {
      expect(getStationData(9999)).toBeNull();
    });
  });

  describe('getStationTags', () => {
    it('retourne des TagEvidence avec reason et source', () => {
      const tags = getStationTags(14); // Annecy
      expect(tags.length).toBeGreaterThan(0);
      tags.forEach(t => {
        expect(t.reason).toBeTruthy();
        expect(t.source).toBeTruthy();
        expect(t.confidence).toBeGreaterThan(0);
      });
    });

    it('retourne [] pour une gare inconnue', () => {
      expect(getStationTags(9999)).toEqual([]);
    });
  });
});

describe('filterStationsByLabels', () => {
  const ids = [10, 12, 14, 18, 19, 33, 89]; // Lyon, Grenoble, Annecy, Marseille, Nice, Bordeaux, Ajaccio

  describe('mode OR (défaut)', () => {
    it('filtre par plage-mer — retourne les villes côtières', () => {
      const result = filterStationsByLabels(ids, ['plage-mer']);
      expect(result).toContain(18); // Marseille
      expect(result).toContain(19); // Nice
      expect(result).toContain(89); // Ajaccio
      expect(result).not.toContain(10); // Lyon (pas en bord de mer)
    });

    it('filtre par montagne — retourne les villes alpines', () => {
      const result = filterStationsByLabels(ids, ['montagne']);
      expect(result).toContain(12); // Grenoble
      expect(result).toContain(14); // Annecy
      expect(result).not.toContain(18); // Marseille
    });

    it('filtre OR plage-mer + montagne — union des deux', () => {
      const result = filterStationsByLabels(ids, ['plage-mer', 'montagne'], 'OR');
      expect(result).toContain(18); // Marseille (plage)
      expect(result).toContain(12); // Grenoble (montagne)
      expect(result).not.toContain(10); // Lyon (ni plage ni montagne)
    });

    it('retourne tous les ids si labels vide', () => {
      const result = filterStationsByLabels(ids, []);
      expect(result).toEqual(ids);
    });
  });

  describe('mode AND', () => {
    it('filtre AND plage-mer + randonnee — uniquement Ajaccio (a les deux)', () => {
      const result = filterStationsByLabels(ids, ['plage-mer', 'randonnee'], 'AND');
      expect(result).toContain(89); // Ajaccio a plage ET randonnée (GR20)
      expect(result).not.toContain(18); // Marseille (plage mais pas randonnée dans ces données)
      expect(result).not.toContain(12); // Grenoble (randonnée mais pas plage)
    });

    it('AND avec un label absent retourne []', () => {
      const result = filterStationsByLabels([10], ['montagne', 'plage-mer'], 'AND');
      expect(result).toEqual([]); // Lyon n'a ni montagne ni plage
    });
  });

  it('fonctionne avec des ids string', () => {
    const result = filterStationsByLabels(['14', '18'], ['plage-mer']);
    expect(result).toContain('18');
    expect(result).not.toContain('14');
  });
});

describe('countLabelMatches', () => {
  it('Ajaccio (id=89) a 2 labels parmi [plage-mer, randonnee]', () => {
    expect(countLabelMatches(89, ['plage-mer', 'randonnee'])).toBe(2);
  });

  it('Lyon (id=10) a 0 match parmi [plage-mer, montagne]', () => {
    expect(countLabelMatches(10, ['plage-mer', 'montagne'])).toBe(0);
  });

  it('Grenoble (id=12) a 2 match parmi [montagne, sports-hiver, plage-mer]', () => {
    expect(countLabelMatches(12, ['montagne', 'sports-hiver', 'plage-mer'])).toBe(2);
  });

  it('retourne 0 pour une gare inconnue', () => {
    expect(countLabelMatches(9999, ['montagne'])).toBe(0);
  });

  it('fonctionne avec des ids string', () => {
    expect(countLabelMatches('14', ['lacs-rivieres'])).toBe(1);
  });
});

describe('intégrité des données', () => {
  it('tous les tags ont un label valide dans CITY_LABELS', () => {
    const { stationLabels } = require('../src/data/stationLabels');
    const { CITY_LABELS } = require('../src/types');
    const validLabels = Object.keys(CITY_LABELS);

    Object.entries(stationLabels).forEach(([id, data]: [string, any]) => {
      data.tags.forEach((t: any) => {
        expect(validLabels).toContain(t.label);
      });
    });
  });

  it('tous les tags ont reason, source et linkLabel non vides', () => {
    const { stationLabels } = require('../src/data/stationLabels');
    Object.entries(stationLabels).forEach(([id, data]: [string, any]) => {
      data.tags.forEach((t: any) => {
        expect(t.reason).toBeTruthy();
        expect(t.source).toBeTruthy();
        expect(t.linkLabel).toBeTruthy();
      });
    });
  });

  it('confidence est entre 0 et 100', () => {
    const { stationLabels } = require('../src/data/stationLabels');
    Object.entries(stationLabels).forEach(([id, data]: [string, any]) => {
      data.tags.forEach((t: any) => {
        expect(t.confidence).toBeGreaterThanOrEqual(0);
        expect(t.confidence).toBeLessThanOrEqual(100);
      });
    });
  });

  it('le tag lacs-rivieres existe pour Annecy et Chambéry', () => {
    expect(getStationLabels(14)).toContain('lacs-rivieres'); // Annecy
    expect(getStationLabels(13)).toContain('lacs-rivieres'); // Chambéry
  });
});
