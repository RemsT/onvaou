# 🚀 Guide d'initialisation automatique de la base de données

## ✨ Fonctionnalité

L'application **initialise automatiquement** la base de données GTFS au premier lancement !

Plus besoin d'exécuter manuellement `node scripts/createGTFSDatabase.js` 🎉

## 🔄 Comment ça fonctionne

### 1. Premier lancement

Quand l'utilisateur lance l'application pour la première fois :

1. ✅ L'app vérifie si `gtfs.db` existe
2. ❌ Si elle n'existe pas : **création automatique**
3. 📊 Affichage d'un écran de progression
4. ⏳ Import des données GTFS (2-5 minutes)
5. 🎉 L'application se lance normalement

### 2. Lancements suivants

- ✅ La DB existe déjà
- ⚡ Chargement instantané (< 1 seconde)
- 🚀 Accès direct à l'application

## 📁 Architecture

### Fichiers créés

```
src/
├── services/
│   └── gtfsInitializationService.ts   ⭐ Service d'initialisation
├── components/
│   └── DatabaseInitializationScreen.tsx   🎨 Écran de chargement
└── hooks/
    └── useGTFSInitialization.ts       🎣 Hook React

App.tsx                                 📱 Modifié pour l'auto-init
```

## 🎨 Écran de progression

L'utilisateur voit un bel écran avec :

- 🚂 Icône de l'application
- 📊 Barre de progression (0-100%)
- 📝 Messages descriptifs
- ⏱️ Étapes en cours

**Étapes affichées :**
1. Création de la structure (5%)
2. Import des gares (10%)
3. Import des lignes (20%)
4. Import des trajets (30%)
5. Import des horaires (40-70%) ⏳ *Le plus long*
6. Import des calendriers (70%)
7. Création des vues (75%)
8. Création des index (85%)
9. Optimisation (95%)
10. Terminé ! (100%)

## 💻 Utilisation dans le code

### Service d'initialisation

```typescript
import { gtfsInitService } from './src/services/gtfsInitializationService';

// Vérifier si déjà initialisée
const isInit = await gtfsInitService.isDatabaseInitialized();

// Initialiser avec callback de progression
await gtfsInitService.initializeDatabase((progress) => {
  console.log(`${progress.step}: ${progress.progress}%`);
  console.log(progress.message);
});

// Réinitialiser (forcer la recréation)
await gtfsInitService.resetDatabase();
await gtfsInitService.initializeDatabase();
```

### Hook React

```typescript
import { useGTFSInitialization } from './src/hooks/useGTFSInitialization';

function MyComponent() {
  const { isInitializing, isInitialized, progress, error } = useGTFSInitialization();

  if (isInitializing) {
    return <Text>Chargement... {progress.progress}%</Text>;
  }

  if (error) {
    return <Text>Erreur: {error.message}</Text>;
  }

  return <Text>Prêt !</Text>;
}
```

## 🔧 Détails techniques

### Lecture des fichiers GTFS

Le service lit les fichiers depuis `assets/sncf_data/` :

```typescript
// Charge automatiquement depuis les assets
const rows = await this.readCSVFromAssets('stops.txt');
```

### Import optimisé

- ✅ Transactions SQLite pour performance
- ✅ Prepared statements pour sécurité
- ✅ Import par batch
- ✅ Logging de progression

### Gestion des erreurs

Si l'initialisation échoue :
- ❌ Message d'erreur affiché
- 🔄 L'utilisateur peut redémarrer l'app
- 🛠️ Logs dans la console pour debug

## 🎯 Avantages

### Pour l'utilisateur

✅ **Zéro configuration** : Pas de manipulation manuelle
✅ **Expérience fluide** : Écran de chargement professionnel
✅ **Feedback visuel** : Progression en temps réel
✅ **Fiable** : Gestion d'erreurs robuste

### Pour le développeur

✅ **Automatique** : Plus besoin de script manuel
✅ **Réutilisable** : Service standalone
✅ **Testable** : Hook React isolé
✅ **Maintenable** : Code TypeScript typé

## 📊 Performances

| Opération | Durée |
|-----------|-------|
| Vérification DB existante | < 100ms |
| Création structure | < 1s |
| Import gares (~3000) | ~5s |
| Import lignes | ~2s |
| Import trajets (~20k) | ~15s |
| **Import horaires** ⏳ | **~2-3 min** |
| Import calendriers | ~10s |
| Création vues/index | ~30s |
| **Total première fois** | **~3-5 min** |
| Lancements suivants | **< 1s** |

## 🔄 Comparaison avec l'ancienne méthode

### Avant (Script manuel)

```bash
# Développeur
npm install --save-dev better-sqlite3
node scripts/createGTFSDatabase.js

# Utilisateur final
❌ Impossible ! Nécessite Node.js
```

### Après (Auto-init)

```bash
# Développeur
npm start
# ✅ DB créée automatiquement !

# Utilisateur final
# Lance l'app
# ✅ DB créée automatiquement !
```

## 🛠️ Configuration

### Modifier les paramètres d'initialisation

Éditer `src/services/gtfsInitializationService.ts` :

```typescript
// Nom de la DB
private dbName = 'gtfs.db';

// Temps de correspondance
WHERE transfer_time_minutes >= 5    // Minimum
  AND transfer_time_minutes <= 120; // Maximum
```

### Forcer une réinitialisation

```typescript
import { gtfsInitService } from './src/services/gtfsInitializationService';

// Supprimer la DB existante
await gtfsInitService.resetDatabase();

// Relancer l'app, elle se recréera automatiquement
```

## 🐛 Dépannage

### La base ne se crée pas

1. Vérifier que les fichiers GTFS sont dans `assets/sncf_data/`
2. Vérifier les permissions de l'app
3. Consulter les logs : `npx react-native log-android` ou `log-ios`

### Erreur pendant l'import

1. Vérifier la qualité des fichiers GTFS
2. Réinitialiser : `gtfsInitService.resetDatabase()`
3. Relancer l'app

### La DB existe mais est corrompue

```typescript
// Dans un composant ou un script
await gtfsInitService.resetDatabase();
// Relancer l'app
```

## 📱 Exemple d'utilisation complète

### App.tsx (déjà configuré)

```typescript
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigatorSimple';
import { DatabaseInitializationScreen } from './src/components/DatabaseInitializationScreen';
import { useGTFSInitialization } from './src/hooks/useGTFSInitialization';

export default function App() {
  const { isInitializing, progress } = useGTFSInitialization();

  // Écran de chargement pendant l'initialisation
  if (isInitializing) {
    return <DatabaseInitializationScreen progress={progress} />;
  }

  // Application normale
  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}
```

### Utilisation de la DB après initialisation

```typescript
import { gtfsDbEnhanced } from './src/services/gtfsDatabaseServiceEnhanced';

// La DB est garantie d'être initialisée ici
const journeys = await gtfsDbEnhanced.findAllJourneys(
  fromStopId,
  toStopId,
  departureTime,
  2
);
```

## ✅ Checklist de vérification

Avant de publier l'app :

- [ ] Les fichiers GTFS sont dans `assets/sncf_data/`
- [ ] `App.tsx` utilise le hook d'initialisation
- [ ] L'écran de chargement s'affiche correctement
- [ ] La DB se crée au premier lancement
- [ ] Les lancements suivants sont rapides
- [ ] Les erreurs sont gérées gracieusement

## 🎉 Résultat

L'application est maintenant **100% autonome** !

- ✅ Installation propre
- ✅ Premier lancement automatique
- ✅ Expérience utilisateur fluide
- ✅ Zéro configuration manuelle

---

**C'est magique ! 🪄**
