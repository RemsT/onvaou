/**
 * Libellés d'affichage des métadonnées de sortie (Phase 1 — données riches OSM).
 * Purs (aucune dépendance) → réutilisables dans l'UI et testables.
 *
 * - `network` OSM : portée du réseau d'itinéraires (iwn/nwn/rwn/lwn pour la rando,
 *   icn/ncn/rcn/lcn pour le vélo) → International / National / Régional / Local.
 * - `difficulty` : échelle SAC (T1–T6) stockée par le générateur depuis `sac_scale` OSM.
 */

const NETWORK_LABELS: Record<string, string> = {
  iwn: 'International', icn: 'International',
  nwn: 'National', ncn: 'National',
  rwn: 'Régional', rcn: 'Régional',
  lwn: 'Local', lcn: 'Local',
};

/** Libellé de portée du réseau (ex. « National »), ou '' si inconnu. */
export function networkLabel(network?: string): string {
  if (!network) return '';
  return NETWORK_LABELS[network.toLowerCase()] || '';
}

const SAC_LABELS: Record<string, string> = {
  T1: 'T1 · Facile',
  T2: 'T2 · Modéré',
  T3: 'T3 · Exigeant',
  T4: 'T4 · Difficile',
  T5: 'T5 · Très difficile',
  T6: 'T6 · Alpin',
};

/** Libellé de difficulté SAC (ex. « T3 · Exigeant »), ou '' si absent/inconnu. */
export function difficultyLabel(difficulty?: string): string {
  if (!difficulty) return '';
  return SAC_LABELS[difficulty.toUpperCase()] || difficulty;
}

// ── POIs le long du tracé (Phase 3B) ────────────────────────────────────────
const WAYPOINT_ICONS: Record<string, string> = {
  water: '💧', viewpoint: '👁️', summit: '⛰️', shelter: '🛖',
};

/** Icône d'un waypoint (eau / point de vue / sommet / abri). */
export function waypointIcon(type?: string): string {
  return (type && WAYPOINT_ICONS[type]) || '📍';
}

/** Résumé compact des waypoints d'un tracé, ex. « 💧3 · 👁️2 · ⛰️1 », ou '' si aucun. */
export function summarizeWaypoints(waypoints?: { type: string }[]): string {
  if (!waypoints || !waypoints.length) return '';
  const order = ['water', 'viewpoint', 'summit', 'shelter'];
  const counts: Record<string, number> = {};
  for (const w of waypoints) counts[w.type] = (counts[w.type] || 0) + 1;
  return order
    .filter((t) => counts[t])
    .map((t) => `${WAYPOINT_ICONS[t]}${counts[t]}`)
    .join(' · ');
}
