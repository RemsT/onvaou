// Repli de données pour Node/tests UNIQUEMENT. Sur device, Metro résout la variante
// generatedFallback.native.ts (vide) → les ~19 Mo de .ts NE SONT PAS embarqués (la base SQLite
// content.db est la source au runtime). En jest, un moduleNameMapper force CE fichier (vraies données).
export { generatedLabels } from './stationLabelsGenerated';
export { generatedTrails } from './trailsGenerated';
export { generatedCampings } from './campingsGenerated';
