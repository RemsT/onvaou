import {
  parseStars,
  campingMatches,
  DEFAULT_PREFERENCES,
  TrailPreferences,
} from '../src/services/profilePreferencesService';
import { TaggedPoi } from '../src/types';

const prefs = (over: Partial<TrailPreferences>): TrailPreferences => ({
  ...DEFAULT_PREFERENCES,
  ...over,
});
const poi = (over: Partial<TaggedPoi>): TaggedPoi => ({ name: 'Camping', ...over });

describe('parseStars — extraction des étoiles DATAtourisme', () => {
  it('« 3 étoiles#… » → 3', () => {
    expect(parseStars('3 étoiles#Classement officiel des hébergements touristiques')).toBe(3);
  });

  it('« 4 étoiles#Classement… » → 4', () => {
    expect(parseStars('4 étoiles#Classement')).toBe(4);
  });

  it('extrait les étoiles même précédées d\'un autre classement', () => {
    expect(parseStars('Qualité Tourisme#…|2 étoiles#…')).toBe(2);
  });

  it('« étoile » au singulier → 1', () => {
    expect(parseStars('1 étoile#…')).toBe(1);
  });

  it('chaîne sans étoile → undefined', () => {
    expect(parseStars('Qualité Tourisme#Label')).toBeUndefined();
  });

  it('chaîne vide / null / undefined → undefined', () => {
    expect(parseStars('')).toBeUndefined();
    expect(parseStars(null)).toBeUndefined();
    expect(parseStars(undefined)).toBeUndefined();
  });

  it('valeur hors plage 1-5 → undefined', () => {
    expect(parseStars('7 étoiles#…')).toBeUndefined();
    expect(parseStars('0 étoiles#…')).toBeUndefined();
  });
});

describe('campingMatches — filtre Profil (étoiles min + non classés)', () => {
  it('classé ≥ min → true', () => {
    expect(campingMatches(poi({ stars: 4 }), prefs({ campingMinStars: 3 }))).toBe(true);
  });

  it('classé < min → false', () => {
    expect(campingMatches(poi({ stars: 2 }), prefs({ campingMinStars: 3 }))).toBe(false);
  });

  it('stars == min exactement → true', () => {
    expect(campingMatches(poi({ stars: 3 }), prefs({ campingMinStars: 3 }))).toBe(true);
  });

  it('5 étoiles avec min 5 → true', () => {
    expect(campingMatches(poi({ stars: 5 }), prefs({ campingMinStars: 5 }))).toBe(true);
  });

  it('min = 0 → tous les classés passent', () => {
    expect(campingMatches(poi({ stars: 1 }), prefs({ campingMinStars: 0 }))).toBe(true);
    expect(campingMatches(poi({ stars: 5 }), prefs({ campingMinStars: 0 }))).toBe(true);
  });

  it('non classé + includeUnrated=true → true', () => {
    expect(campingMatches(poi({}), prefs({ campingIncludeUnrated: true }))).toBe(true);
  });

  it('non classé + includeUnrated=false → false', () => {
    expect(campingMatches(poi({}), prefs({ campingIncludeUnrated: false }))).toBe(false);
  });

  it('non classé ignore campingMinStars (seul includeUnrated compte)', () => {
    expect(campingMatches(poi({}), prefs({ campingMinStars: 5, campingIncludeUnrated: true }))).toBe(true);
  });

  it('défauts non restrictifs : tout passe', () => {
    expect(campingMatches(poi({ stars: 2 }), DEFAULT_PREFERENCES)).toBe(true);
    expect(campingMatches(poi({}), DEFAULT_PREFERENCES)).toBe(true);
  });
});
