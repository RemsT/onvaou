#!/usr/bin/env node
/**
 * Prépare un build : calcule AUTOMATIQUEMENT le prochain numéro de build (versionCode iOS/Android)
 * = (plus haut déjà présent sur EAS) + 1, puis l'applique via set-version (garde la versionName).
 *
 * But : ne plus JAMAIS uploader un build refusé par le store (le versionCode/buildNumber DOIT être
 * STRICTEMENT supérieur au plus haut déjà accepté). On se base sur l'historique EAS (`eas build:list`),
 * qui couvre tous les builds soumis au store de ce projet.
 *
 *   node scripts/prepare-build.js [android|ios|both] [--dry]
 *   npm run prepare-build            # both, applique
 *   npm run prepare-build -- --dry   # affiche seulement
 *
 * Ensuite : COMMITTER le bump, PUIS `eas build -p <plateforme> --profile production`.
 */
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const platArg = process.argv.find((a) => ['android', 'ios', 'both'].includes(a)) || 'both';
const dry = process.argv.includes('--dry');

const version = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8')).expo.version;

let builds;
try {
  const out = execSync('eas build:list --json --non-interactive --limit 50', { cwd: ROOT, encoding: 'utf8' });
  builds = JSON.parse(out);
} catch {
  console.error('❌ `eas build:list` a échoué — eas-cli installé et `eas login` fait ?');
  process.exit(1);
}

const platforms = platArg === 'both' ? ['ANDROID', 'IOS'] : [platArg.toUpperCase()];
let maxBuild = 0;
for (const b of builds) {
  if (!platforms.includes(b.platform)) continue;
  const n = parseInt(b.appBuildVersion, 10);
  if (!isNaN(n) && n > maxBuild) maxBuild = n;
}
const next = maxBuild + 1;
console.log(`📦 Plus haut build EAS (${platArg}) : ${maxBuild} → prochain : ${next} · versionName ${version}`);

if (dry) { console.log('(--dry : rien appliqué)'); process.exit(0); }

execSync(`node scripts/set-version.js ${version} ${next}`, { cwd: ROOT, stdio: 'inherit' });
console.log('\n➡️  COMMITTER le bump, PUIS : eas build -p <android|ios> --profile production');
