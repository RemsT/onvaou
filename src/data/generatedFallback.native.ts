// Variante DEVICE (iOS/Android) : repli VIDE → les .ts générés (~19 Mo) ne sont pas embarqués dans
// le bundle. Au runtime, c'est assets/content.db (SQLite) qui fournit labels/trails/campings.
import { StationData, Trail, TaggedPoi } from '../types';

export const generatedLabels: Record<string, StationData> = {};
export const generatedTrails: Record<string, Trail[]> = {};
export const generatedCampings: Record<string, TaggedPoi[]> = {};
