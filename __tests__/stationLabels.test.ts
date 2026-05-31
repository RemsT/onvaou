import {
  getStationLabels,
  getStationTags,
  getStationData,
  filterStationsByLabels,
  countLabelMatches,
} from '../src/data/stationLabels';

// IDs réels depuis allStations.ts
const ID_ANNECY = 3175;
const ID_CHAMBERY = 2672;
const ID_GRENOBLE = 1015;
const ID_MARSEILLE = 3246;
const ID_NICE = 3324;
const ID_BORDEAUX = 1878;
const ID_AJACCIO = 3175; // Ajaccio n'est pas dans la DB SNCF mainline, on utilise Annecy (lacs+montagne)
const ID_LYON = 2927;

describe('stationLabels — données manuelles', () => {
  describe('getStationLabels', () => {
    it('retourne les labels d\'Annecy (id=3175)', () => {
      const labels = getStationLabels(ID_ANNECY);
      expect(labels).toContain('lacs-rivieres');
      expect(labels).toContain('montagne');
    });

    it('retourne les labels de Bordeaux (id=1878)', () => {
      const labels = getStationLabels(ID_BORDEAUX);
      expect(labels).toContain('gastronomie');
      expect(labels).toContain('culture-histoire');
    });

    it('ne retourne que les tags de la liste UI (pas oenologie)', () => {
      const labels = getStationLabels(ID_BORDEAUX);
      expect(labels).not.toContain('oenologie'); // hors UI_LABELS → masqué
    });

    it('retourne [] pour une gare inconnue', () => {
      expect(getStationLabels(9999)).toEqual([]);
    });

    it('Nice (id=3324) a le tag plage-mer', () => {
      expect(getStationLabels(ID_NICE)).toContain('plage-mer');
    });

    it('Grenoble (id=1015) a montagne et sports-hiver', () => {
      const labels = getStationLabels(ID_GRENOBLE);
      expect(labels).toContain('montagne');
      expect(labels).toContain('sports-hiver');
    });
  });

  describe('getStationData', () => {
    it('Annecy a une description', () => {
      const data = getStationData(ID_ANNECY);
      expect(data).not.toBeNull();
      expect(data?.description).toContain('Annecy');
    });

    it('Annecy a une URL Wikipedia', () => {
      const data = getStationData(ID_ANNECY);
      expect(data?.wikipediaUrl).toContain('wikipedia.org');
    });

    it('Lac d\'Annecy a une source SANDRE', () => {
      const data = getStationData(ID_ANNECY);
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
      const tags = getStationTags(ID_ANNECY);
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
  const ids = [ID_LYON, ID_GRENOBLE, ID_ANNECY, ID_MARSEILLE, ID_NICE, ID_BORDEAUX, ID_CHAMBERY];

  describe('mode OR (défaut)', () => {
    it('filtre par plage-mer — retourne les villes côtières', () => {
      const result = filterStationsByLabels(ids, ['plage-mer']);
      expect(result).toContain(ID_MARSEILLE);
      expect(result).toContain(ID_NICE);
      expect(result).not.toContain(ID_LYON);
    });

    it('filtre par montagne — retourne les villes alpines', () => {
      const result = filterStationsByLabels(ids, ['montagne']);
      expect(result).toContain(ID_GRENOBLE);
      expect(result).toContain(ID_ANNECY);
      expect(result).toContain(ID_CHAMBERY);
      expect(result).not.toContain(ID_MARSEILLE);
    });

    it('filtre OR plage-mer + montagne — union des deux', () => {
      const result = filterStationsByLabels(ids, ['plage-mer', 'montagne'], 'OR');
      expect(result).toContain(ID_MARSEILLE);
      expect(result).toContain(ID_GRENOBLE);
      expect(result).not.toContain(ID_LYON);
    });

    it('retourne tous les ids si labels vide', () => {
      const result = filterStationsByLabels(ids, []);
      expect(result).toEqual(ids);
    });
  });

  describe('mode AND', () => {
    it('filtre AND lacs-rivieres + montagne — Annecy et Chambéry ont les deux', () => {
      const result = filterStationsByLabels(ids, ['lacs-rivieres', 'montagne'], 'AND');
      expect(result).toContain(ID_ANNECY);    // Annecy a lac ET montagne
      expect(result).toContain(ID_CHAMBERY);  // Chambéry a lac ET montagne
      expect(result).not.toContain(ID_MARSEILLE); // plage mais pas lac/montagne
    });

    it('AND avec un label absent retourne []', () => {
      const result = filterStationsByLabels([ID_LYON], ['montagne', 'plage-mer'], 'AND');
      expect(result).toEqual([]);
    });
  });

  it('fonctionne avec des ids string', () => {
    const result = filterStationsByLabels([String(ID_ANNECY), String(ID_MARSEILLE)], ['plage-mer']);
    expect(result).toContain(String(ID_MARSEILLE));
    expect(result).not.toContain(String(ID_ANNECY));
  });
});

describe('countLabelMatches', () => {
  it('Annecy a 2 labels parmi [lacs-rivieres, montagne]', () => {
    expect(countLabelMatches(ID_ANNECY, ['lacs-rivieres', 'montagne'])).toBe(2);
  });

  it('Lyon a 0 match parmi [plage-mer, montagne]', () => {
    expect(countLabelMatches(ID_LYON, ['plage-mer', 'montagne'])).toBe(0);
  });

  it('Grenoble a 2 match parmi [montagne, sports-hiver, plage-mer]', () => {
    expect(countLabelMatches(ID_GRENOBLE, ['montagne', 'sports-hiver', 'plage-mer'])).toBe(2);
  });

  it('retourne 0 pour une gare inconnue', () => {
    expect(countLabelMatches(9999, ['montagne'])).toBe(0);
  });

  it('fonctionne avec des ids string', () => {
    expect(countLabelMatches(String(ID_ANNECY), ['lacs-rivieres'])).toBe(1);
  });
});

describe('résolution d\'identifiant (robustesse base évolutive)', () => {
  it('résout via ID interne (3175 → Annecy)', () => {
    expect(getStationLabels(3175)).toContain('lacs-rivieres');
  });

  it('résout via code UIC direct (87746008 → Annecy)', () => {
    expect(getStationLabels('87746008')).toContain('lacs-rivieres');
  });

  it('résout via sncf_id complet (stop_area:OCE:SA:87746008 → Annecy)', () => {
    expect(getStationLabels('stop_area:OCE:SA:87746008')).toContain('lacs-rivieres');
  });

  it('getStationData fonctionne avec les 3 formats d\'identifiant', () => {
    const byInternal = getStationData(3175);
    const byUic = getStationData('87746008');
    const bySncf = getStationData('stop_area:OCE:SA:87746008');
    expect(byInternal).not.toBeNull();
    expect(byInternal).toEqual(byUic);
    expect(byUic).toEqual(bySncf);
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

  it('le tag lacs-rivieres existe pour Annecy (3175) et Chambéry (2672)', () => {
    expect(getStationLabels(ID_ANNECY)).toContain('lacs-rivieres');
    expect(getStationLabels(ID_CHAMBERY)).toContain('lacs-rivieres');
  });
});
