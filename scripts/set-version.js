#!/usr/bin/env node
/**
 * Met à jour le numéro de version ET/OU de build de l'app PARTOUT, en une seule commande.
 * Évite l'oubli récurrent d'un fichier (cause des « builds qui gardent le même numéro »).
 *
 * Usage :
 *   node scripts/set-version.js <version> <build>   # ex. 2.0.2 3  → version 2.0.2, build 3
 *   node scripts/set-version.js <version>           # change seulement la version (garde le build)
 *   node scripts/set-version.js --build <build>     # change seulement le build (garde la version)
 *
 * Sources mises à jour :
 *   - app.json                         expo.version, expo.ios.buildNumber, expo.android.versionCode
 *   - package.json                     version
 *   - android/app/build.gradle         versionName, versionCode
 *   - ios/onvaou.xcodeproj/project.pbxproj  MARKETING_VERSION (×2), CURRENT_PROJECT_VERSION (×2)
 *   - ios/onvaou/Info.plist            doit référencer $(MARKETING_VERSION)/$(CURRENT_PROJECT_VERSION)
 *                                      (numéro dérivé du pbxproj) — vérifié, jamais codé en dur.
 *
 * Chaque remplacement est COMPTÉ : si un motif attendu est introuvable, le script échoue (drift).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const p = (rel) => path.join(ROOT, rel);

// ── Parsing des arguments ─────────────────────────────────────────────────────
const args = process.argv.slice(2);
let version = null;
let build = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--build') { build = args[++i]; continue; }
  if (args[i] === '--version') { version = args[++i]; continue; }
  if (version === null && /^\d+\.\d+\.\d+$/.test(args[i])) { version = args[i]; continue; }
  if (build === null && /^\d+$/.test(args[i])) { build = args[i]; continue; }
}
if (version === null && build === null) {
  console.error('Usage : node scripts/set-version.js <version> <build>');
  console.error('   ex. node scripts/set-version.js 2.0.2 3');
  process.exit(1);
}
if (version !== null && !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`❌ Version invalide : « ${version} » (attendu X.Y.Z)`);
  process.exit(1);
}
if (build !== null && !/^\d+$/.test(build)) {
  console.error(`❌ Build invalide : « ${build} » (attendu un entier)`);
  process.exit(1);
}

// Lit la valeur courante quand un seul paramètre est fourni.
const appJsonRaw0 = fs.readFileSync(p('app.json'), 'utf8');
if (version === null) version = (appJsonRaw0.match(/"version":\s*"([^"]+)"/) || [])[1];
if (build === null) build = (appJsonRaw0.match(/"buildNumber":\s*"([^"]+)"/) || [])[1];
console.log(`🎯 Cible : version ${version}, build ${build}\n`);

let failed = false;
// Remplace `re` dans le fichier et vérifie le nombre d'occurrences attendu.
function patch(rel, re, replacement, expected) {
  const file = p(rel);
  const before = fs.readFileSync(file, 'utf8');
  let n = 0;
  const after = before.replace(re, (...m) => { n++; return replacement(...m); });
  if (n !== expected) {
    console.error(`❌ ${rel} : ${n} remplacement(s) au lieu de ${expected} attendu(s) — motif obsolète ?`);
    failed = true;
    return;
  }
  fs.writeFileSync(file, after);
  console.log(`✅ ${rel} (${n})`);
}

// ── app.json ──────────────────────────────────────────────────────────────────
patch('app.json', /("version":\s*")[^"]+(")/, (_, a, b) => `${a}${version}${b}`, 1);
patch('app.json', /("buildNumber":\s*")[^"]+(")/, (_, a, b) => `${a}${build}${b}`, 1);
patch('app.json', /("versionCode":\s*)\d+/, (_, a) => `${a}${build}`, 1);

// ── package.json ──────────────────────────────────────────────────────────────
patch('package.json', /("version":\s*")[^"]+(")/, (_, a, b) => `${a}${version}${b}`, 1);

// ── android/app/build.gradle ─────────────────────────────────────────────────
patch('android/app/build.gradle', /(versionName\s+")[^"]+(")/, (_, a, b) => `${a}${version}${b}`, 1);
patch('android/app/build.gradle', /(versionCode\s+)\d+/, (_, a) => `${a}${build}`, 1);

// ── ios/onvaou.xcodeproj/project.pbxproj (Debug + Release → 2 occurrences) ─────
patch('ios/onvaou.xcodeproj/project.pbxproj', /(MARKETING_VERSION = )[^;]+;/g, (_, a) => `${a}${version};`, 2);
patch('ios/onvaou.xcodeproj/project.pbxproj', /(CURRENT_PROJECT_VERSION = )[^;]+;/g, (_, a) => `${a}${build};`, 2);

// ── ios/onvaou/Info.plist : garde-fou (doit dériver du pbxproj, pas de numéro en dur) ──
const plist = fs.readFileSync(p('ios/onvaou/Info.plist'), 'utf8');
const shortOk = /<key>CFBundleShortVersionString<\/key>\s*<string>\$\(MARKETING_VERSION\)<\/string>/.test(plist);
const verOk = /<key>CFBundleVersion<\/key>\s*<string>\$\(CURRENT_PROJECT_VERSION\)<\/string>/.test(plist);
if (shortOk && verOk) {
  console.log('✅ ios/onvaou/Info.plist (dérive du pbxproj via $(MARKETING_VERSION)/$(CURRENT_PROJECT_VERSION))');
} else {
  console.error('❌ ios/onvaou/Info.plist : CFBundleShortVersionString/CFBundleVersion doivent valoir');
  console.error('   $(MARKETING_VERSION) / $(CURRENT_PROJECT_VERSION) (sinon le build garde l\'ancien numéro).');
  failed = true;
}

if (failed) {
  console.error('\n⚠️  Au moins une source n\'a pas été mise à jour — RIEN ne doit être considéré comme fait. Corrige le motif.');
  process.exit(1);
}
console.log(`\n🎉 Version ${version} / build ${build} appliqués partout.`);
