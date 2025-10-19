const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ajouter les extensions .txt pour qu'elles puissent être importées
config.resolver.assetExts.push('txt');

module.exports = config;
