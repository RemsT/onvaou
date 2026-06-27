const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ajouter les extensions .txt (données GTFS) et .db (base contenu SQLite) comme assets bundlés
config.resolver.assetExts.push('txt');
config.resolver.assetExts.push('db');

module.exports = config;
