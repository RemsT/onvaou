/**
 * Base SQLite « contenu » (F1) — labels / trails / campings par code UIC.
 *
 * Objectif : sortir ces ~9 Mo du bundle JS (parsés à chaque lancement) vers un fichier .db
 * INTERROGÉ À LA DEMANDE (sync, getFirstSync) → démarrage plus rapide, RAM réduite.
 *
 * - App (iOS/Android) : l'asset assets/content.db est copié une fois sous SQLite/content-<version>.db
 *   (le nom versionné force la recopie après une mise à jour des données), puis ouvert en sync.
 * - Node / tests (pas d'expo-sqlite chargé) : repli paresseux sur les .ts générés (require), de sorte
 *   que la suite de tests continue de fonctionner sans device.
 *
 * `getStationData` (stationLabels.ts) étant synchrone et appelé en boucle, on garde des lectures
 * SYNCHRONES ici. `initContentDatabase()` doit être awaité au démarrage AVANT toute recherche.
 */
import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { CONTENT_DB_VERSION } from '../data/contentDbVersion';
import { StationData, Trail, TaggedPoi } from '../types';

let db: SQLite.SQLiteDatabase | null = null;
let ready = false;

// ── Repli .ts (Node/tests, ou si la base n'est pas prête) ─────────────────────
// require paresseux : sur device avec la base prête, ces modules ne sont jamais évalués.
const fb: { labels?: any; trails?: any; campings?: any } = {};
const fbLabels = () => (fb.labels ??= require('../data/stationLabelsGenerated').generatedLabels);
const fbTrails = () => (fb.trails ??= require('../data/trailsGenerated').generatedTrails);
const fbCampings = () => (fb.campings ??= require('../data/campingsGenerated').generatedCampings);

/** Copie l'asset content.db (si besoin) et ouvre la base en lecture sync. Idempotent, sans throw. */
export async function initContentDatabase(): Promise<void> {
  if (ready) return;
  try {
    const dbName = `content-${CONTENT_DB_VERSION}.db`;
    const dir = `${FileSystem.documentDirectory}SQLite`;
    const target = `${dir}/${dbName}`;
    const info = await FileSystem.getInfoAsync(target);
    if (!info.exists) {
      const asset = Asset.fromModule(require('../../assets/content.db'));
      await asset.downloadAsync();
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
      await FileSystem.copyAsync({ from: asset.localUri || asset.uri, to: target });
    }
    db = SQLite.openDatabaseSync(dbName);
    ready = true;
    // Diagnostic device : confirme que la base est LUE (et non le repli .ts) + comptes par table.
    const n = (t: string) => db!.getFirstSync<{ n: number }>(`SELECT COUNT(*) n FROM ${t}`)?.n ?? 0;
    console.log(`✅ Base contenu SQLite active (${dbName}) — labels ${n('labels')}, trails ${n('trails')}, campings ${n('campings')}`);
  } catch (e) {
    // Repli .ts : l'app reste fonctionnelle (plus lourde au démarrage) plutôt que de casser.
    console.warn('⚠️ content.db indisponible — repli sur les données embarquées (.ts)', e);
    ready = false;
  }
}

function rowData(table: 'labels' | 'trails' | 'campings', uic: string): string | null {
  const row = db!.getFirstSync<{ data: string }>(`SELECT data FROM ${table} WHERE uic = ?`, [uic]);
  return row ? row.data : null;
}

/** StationData générée pour une gare (ou null). */
export function getGeneratedLabels(uic: string): StationData | null {
  if (ready && db) {
    const d = rowData('labels', uic);
    return d ? (JSON.parse(d) as StationData) : null;
  }
  return fbLabels()[uic] ?? null;
}

/**
 * TOUTES les labels générées (dictionnaire complet). Réservé aux diagnostics/tests : le runtime
 * fusionne par UIC (getGeneratedLabels), donc cette fonction n'est PAS appelée sur device → les
 * ~4,4 Mo ne sont jamais chargés en bloc en production.
 */
export function getAllGeneratedLabels(): Record<string, StationData> {
  if (ready && db) {
    const rows = db.getAllSync<{ uic: string; data: string }>('SELECT uic, data FROM labels');
    const out: Record<string, StationData> = {};
    for (const r of rows) out[r.uic] = JSON.parse(r.data);
    return out;
  }
  return fbLabels();
}

/** Sorties (trails) générées pour une gare. */
export function getGeneratedTrails(uic: string): Trail[] {
  if (ready && db) {
    const d = rowData('trails', uic);
    return d ? (JSON.parse(d) as Trail[]) : [];
  }
  return fbTrails()[uic] ?? [];
}

/** Campings générés pour une gare. */
export function getGeneratedCampings(uic: string): TaggedPoi[] {
  if (ready && db) {
    const d = rowData('campings', uic);
    return d ? (JSON.parse(d) as TaggedPoi[]) : [];
  }
  return fbCampings()[uic] ?? [];
}
