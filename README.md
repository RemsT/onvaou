# 🚂 Onvaou

Application mobile React Native pour rechercher et planifier des trajets en train en France.

## 📱 Description

Onvaou est une application de recherche de trajets ferroviaires utilisant les données GTFS de la SNCF. L'application permet de :

- 🔍 Rechercher des gares
- 🗺️ Trouver des trajets directs et avec correspondances
- 📍 Localiser les gares proches
- ⭐ Sauvegarder des favoris
- 💰 Estimer les prix des trajets

## 🏗️ Architecture

### Base de données

L'application utilise une **base de données SQLite** pour stocker et interroger les données GTFS :

- **Fichiers sources** : `assets/sncf_data/` (fichiers GTFS bruts)
- **Base de données** : `assets/gtfs.db` (générée, non versionée)
- **Performance** : Requêtes optimisées avec index SQL

### Services principaux

- `gtfsDatabaseServiceEnhanced.ts` : Service de recherche de trajets avec correspondances
- `localStationService.ts` : Gestion des gares
- `locationService.ts` : Géolocalisation
- `priceEstimationService.ts` : Estimation des prix

## 🚀 Installation

### 1. Prérequis

```bash
node >= 18
npm >= 9
```

### 2. Installation des dépendances

```bash
npm install
```

### 3. Lancer l'application

```bash
# Démarrer Expo
npm start

# iOS
npm run ios

# Android
npm run android
```

**🎉 C'est tout !** La base de données GTFS se crée **automatiquement** au premier lancement.

### ⚙️ Initialisation automatique

Au premier lancement, l'application :
- ✅ Détecte l'absence de base de données
- 🔄 Crée automatiquement `gtfs.db` depuis les fichiers GTFS
- 📊 Affiche un écran de progression (2-5 minutes)
- 🚀 Lance l'application une fois prête

**Lancements suivants** : Instantanés (< 1 seconde)

Voir [AUTO_INIT_GUIDE.md](./AUTO_INIT_GUIDE.md) pour plus de détails.

### 🛠️ Génération manuelle (optionnel)

Si vous souhaitez générer la DB manuellement (pour développement) :

```bash
# Installer better-sqlite3 pour Node.js
npm install --save-dev better-sqlite3

# Générer la base de données
node scripts/createGTFSDatabase.js
```

## 📚 Documentation

- **[AUTO_INIT_GUIDE.md](./AUTO_INIT_GUIDE.md)** ⭐ : Guide de l'initialisation automatique
- **[GTFS_DATABASE_GUIDE.md](./GTFS_DATABASE_GUIDE.md)** : Guide complet d'utilisation de la base de données
- **[CORRESPONDANCES_GUIDE.md](./CORRESPONDANCES_GUIDE.md)** : Guide de gestion des correspondances

## 🔧 Scripts disponibles

### Génération de données

```bash
# Créer/recréer la base de données GTFS
node scripts/createGTFSDatabase.js
```

### Développement

```bash
# Lancer l'app
npm start

# Lancer sur iOS
npm run ios

# Lancer sur Android
npm run android
```

## 📁 Structure du projet

```
onvaou/
├── assets/
│   ├── sncf_data/              # Données GTFS sources (versionnées)
│   │   ├── stops.txt
│   │   ├── routes.txt
│   │   ├── trips.txt
│   │   ├── stop_times.txt
│   │   └── calendar_dates.txt
│   └── gtfs.db                 # Base SQLite (générée, ignorée par git)
│
├── scripts/
│   ├── createGTFSDatabase.js   # Script de génération de la DB
│   └── export-opendata-sncf-gtfs.zip
│
├── src/
│   ├── components/             # Composants React Native
│   ├── screens/                # Écrans de l'application
│   ├── services/               # Services métier
│   │   ├── gtfsDatabaseServiceEnhanced.ts  # ⭐ Service principal GTFS
│   │   ├── localStationService.ts
│   │   └── ...
│   └── data/                   # Données statiques (stations, labels)
│
├── GTFS_DATABASE_GUIDE.md      # Guide d'utilisation de la DB
├── CORRESPONDANCES_GUIDE.md    # Guide des correspondances
└── README.md                   # Ce fichier
```

## 🗄️ Base de données SQLite

### Tables

- **stops** : Gares (3000+)
- **routes** : Lignes SNCF
- **trips** : Trajets individuels
- **stop_times** : Horaires (plusieurs millions d'entrées)
- **calendar_dates** : Jours de circulation

### Vues optimisées

- **direct_connections** : Connexions directes entre gares
- **transfer_opportunities** : Correspondances possibles (5 min ≤ attente ≤ 2h)

### Index

La base de données contient plus de 10 index pour optimiser les requêtes :
- Recherche par gare
- Recherche par horaire
- Recherche spatiale (GPS)
- Recherche de correspondances

## 🔍 Utilisation de l'API GTFS

### Exemple : Recherche de trajets

```typescript
import { gtfsDbEnhanced } from './src/services/gtfsDatabaseServiceEnhanced';

// Initialiser
await gtfsDbEnhanced.initialize();

// Rechercher des trajets (direct + correspondances)
const journeys = await gtfsDbEnhanced.findAllJourneys(
  'StopID:DUA8711300:LOC',  // Paris Gare de Lyon
  'StopID:DUA8727100:LOC',  // Lyon Part Dieu
  '08:00:00',               // Heure de départ
  2                          // Max 2 correspondances
);

// Afficher les résultats
journeys.forEach(journey => {
  console.log(`Durée: ${journey.totalDuration} min`);
  console.log(`Correspondances: ${journey.legs.length - 1}`);

  journey.legs.forEach(leg => {
    console.log(`${leg.from_stop_name} → ${leg.to_stop_name}`);
    console.log(`${leg.departure_time} → ${leg.arrival_time}`);
  });
});
```

Voir [GTFS_DATABASE_GUIDE.md](./GTFS_DATABASE_GUIDE.md) pour plus d'exemples.

## 📊 Performances

| Type de requête | Temps moyen |
|----------------|-------------|
| Recherche de gare | < 10ms |
| Gares proches (GPS) | < 20ms |
| Trajets directs | < 50ms |
| Avec 1 correspondance | < 200ms |
| Avec 2 correspondances | < 500ms |

## 🔄 Mise à jour des données GTFS

Pour mettre à jour les données avec une nouvelle export GTFS :

1. Télécharger les nouvelles données GTFS depuis [transport.data.gouv.fr](https://transport.data.gouv.fr/)
2. Extraire les fichiers dans `assets/sncf_data/`
3. Regénérer la base de données :
   ```bash
   node scripts/createGTFSDatabase.js
   ```
4. La nouvelle base sera créée dans `assets/gtfs.db`

## 📝 Variables d'environnement

Créer un fichier `.env` à la racine :

```bash
# Navitia API (optionnel - pour horaires temps réel)
EXPO_PUBLIC_NAVITIA_API_KEY=your_navitia_api_key_here

# Mapbox (optionnel - pour la carte)
EXPO_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

Voir `.env.example` pour un modèle.

## 🧪 Tests

```bash
# TODO: Ajouter les tests
npm test
```

## 🐛 Problèmes connus

- Les horaires GTFS peuvent dépasser 24h (ex: 25:30:00 = 1h30 le lendemain)
- La recherche de trajets avec 2+ correspondances peut être lente sur certains appareils
- L'initialisation automatique prend 2-5 minutes au premier lancement

## 📄 Licence

Propriétaire - Tous droits réservés

## 👥 Contributeurs

- Rems - Développeur principal

## 🙏 Remerciements

- Données GTFS fournies par la SNCF via [transport.data.gouv.fr](https://transport.data.gouv.fr/)
- Spécification GTFS : [gtfs.org](https://gtfs.org/)

---

**Note** : Cette application est en cours de développement. Les fonctionnalités peuvent évoluer.
