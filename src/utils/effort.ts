/**
 * Durée réaliste d'une sortie corrigée par le dénivelé (F2 de la feuille de route rando/vélo).
 *
 * `minutes = km / vitesse` ment dès qu'il y a du D+ : 10 km plats ≠ 10 km avec 800 m de montée.
 * On corrige par le dénivelé positif :
 *   - Marche → règle de Naismith : temps plat + 1 h pour 600 m de montée (≈ +10 min / 100 m D+).
 *   - Vélo → pénalité de montée (l'ascension domine le temps en côte) ; on ajoute ~ (D+ / VAM) où
 *     VAM ≈ 500 m/h (vitesse ascensionnelle d'un cycliste de loisir chargé).
 *
 * Le D+ vient de l'enrichissement SRTM (Phase 2). Sans D+ connu, on retombe sur la vitesse plate
 * (rétro-compatible avec les durées déjà générées).
 */

// Vitesses sur le plat (km/h), cohérentes avec scripts/generate-trails.js.
const FLAT_KMH = { walk: 4, bike: 15 } as const;
// Naismith : +1 h par 600 m de montée → minutes ajoutées par mètre de D+.
const WALK_MIN_PER_ASCENT_M = 60 / 600; // 0.1 min/m (≈ 10 min / 100 m)
// Vélo : vitesse ascensionnelle moyenne (m/h) → minutes ajoutées par mètre de D+.
const BIKE_VAM_M_PER_H = 500;
const BIKE_MIN_PER_ASCENT_M = 60 / BIKE_VAM_M_PER_H; // 0.12 min/m

/**
 * Durée estimée (minutes, arrondies) pour `km` à plat + `ascentM` de dénivelé positif, selon le mode.
 * `ascentM` omis/0 → durée à plat seule.
 */
export function estimateMinutes(mode: 'walk' | 'bike', km: number, ascentM?: number): number {
  const flat = (km / FLAT_KMH[mode]) * 60;
  const climb = (ascentM && ascentM > 0)
    ? ascentM * (mode === 'bike' ? BIKE_MIN_PER_ASCENT_M : WALK_MIN_PER_ASCENT_M)
    : 0;
  return Math.round(flat + climb);
}
