# Guide d'utilisation de la base de données GTFS

## 📋 Vue d'ensemble

Ce guide explique comment créer et utiliser une base de données SQLite optimisée à partir des données GTFS pour des recherches locales ultra-rapides.

### Avantages par rapport aux fichiers JSON

✅ **Performance** : Requêtes instantanées grâce aux index SQL
✅ **Mémoire** : Pas besoin de charger toutes les données en RAM
✅ **Flexibilité** : Requêtes SQL complexes possibles
✅ **Taille** : Base de données compressée et optimisée
✅ **Recherche spatiale** : Recherche par coordonnées GPS intégrée

---

## 🚀 Installation

### 1. Installer la dépendance pour Node.js (génération de la DB)

```bash
npm install --save-dev better-sqlite3
```

### 2. Vérifier que expo-sqlite est installé (déjà dans package.json)

```bash
npm install expo-sqlite
```

---

## 🔨 Création de la base de données

### 1. Placer les fichiers GTFS

Assurez-vous que vos fichiers GTFS sont dans le dossier :
```
assets/sncf_data/
├── stops.txt
├── routes.txt
├── trips.txt
├── stop_times.txt
├── calendar.txt
└── calendar_dates.txt
```

### 2. Exécuter le script de création

```bash
node scripts/createGTFSDatabase.js
```

Le script va :
- ✅ Créer la base de données SQLite
- ✅ Importer toutes les données GTFS
- ✅ Créer des index optimisés
- ✅ Créer des vues SQL pour faciliter les requêtes
- ✅ Générer le fichier `assets/gtfs.db`

**Durée estimée** : 2-5 minutes selon la taille des données

### 3. Vérifier la création

Le fichier `assets/gtfs.db` doit être créé avec les statistiques affichées :
```
📊 Statistiques de la base de données:
   Gares:                 X,XXX
   Lignes:                XXX
   Trajets:               XX,XXX
   Horaires:              XXX,XXX
   ...
```

---

## 💻 Utilisation dans React Native

### 1. Initialiser le service

```typescript
import { gtfsDb } from './src/services/gtfsDatabaseService';

// Dans votre composant principal (App.tsx)
useEffect(() => {
  const initDb = async () => {
    try {
      await gtfsDb.initialize();
      console.log('Base de données GTFS prête !');
    } catch (error) {
      console.error('Erreur initialisation GTFS:', error);
    }
  };

  initDb();
}, []);
```

### 2. Rechercher des gares (autocomplétion)

```typescript
const searchStations = async (query: string) => {
  const results = await gtfsDb.searchStops(query, 20);

  // results = [
  //   { stop_id: '...', stop_name: 'Paris Gare de Lyon', ... }
  // ]

  return results;
};

// Exemple d'utilisation
const stations = await searchStations('Paris');
```

### 3. Trouver les gares proches

```typescript
const findNearby = async (latitude: number, longitude: number) => {
  const nearbyStops = await gtfsDb.findNearbyStops(latitude, longitude, 10);

  nearbyStops.forEach(stop => {
    console.log(`${stop.stop_name} - ${stop.distance.toFixed(1)} km`);
  });

  return nearbyStops;
};

// Exemple : trouver les gares près de ma position
const location = await Location.getCurrentPositionAsync();
const nearby = await findNearby(
  location.coords.latitude,
  location.coords.longitude
);
```

### 4. Rechercher des connexions directes

```typescript
const findTrains = async (
  fromStopId: string,
  toStopId: string,
  departureTime: string
) => {
  const connections = await gtfsDb.findDirectConnections(
    fromStopId,
    toStopId,
    departureTime,    // '08:00:00'
    '23:59:59',       // Heure max
    50                // Limite de résultats
  );

  return connections;
};

// Exemple
const trains = await findTrains(
  'StopID:DUA8711300:LOC',  // Paris Gare de Lyon
  'StopID:DUA8727100:LOC',  // Lyon Part Dieu
  '08:00:00'
);
```

### 5. Rechercher un trajet complet (avec correspondances)

```typescript
const planJourney = async (
  fromStopId: string,
  toStopId: string,
  departureTime: string,
  date: Date
) => {
  const journeys = await gtfsDb.findJourney(
    fromStopId,
    toStopId,
    departureTime,
    date,
    2  // Max 2 correspondances
  );

  // journeys = [
  //   [connection1, connection2],  // Trajet avec 1 correspondance
  //   [connection3],                // Trajet direct
  // ]

  return journeys;
};

// Exemple
const journeys = await planJourney(
  'StopID:...',
  'StopID:...',
  '08:00:00',
  new Date()
);
```

### 6. Obtenir toutes les destinations depuis une gare

```typescript
const getDestinations = async (fromStopId: string) => {
  const destinations = await gtfsDb.findDestinationsFrom(
    fromStopId,
    '06:00:00',  // Heure min (optionnel)
    '23:00:00'   // Heure max (optionnel)
  );

  destinations.forEach(dest => {
    console.log(`${dest.stop_name} - ${dest.nb_connections} trains`);
  });

  return destinations;
};
```

---

## 🎯 Exemples d'utilisation pratiques

### Exemple 1 : Écran de recherche avec autocomplétion

```typescript
const SearchScreen = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Stop[]>([]);

  useEffect(() => {
    const search = async () => {
      if (query.length >= 2) {
        const stops = await gtfsDb.searchStops(query, 10);
        setResults(stops);
      } else {
        setResults([]);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Rechercher une gare..."
      />
      <FlatList
        data={results}
        keyExtractor={(item) => item.stop_id}
        renderItem={({ item }) => (
          <Text>{item.stop_name}</Text>
        )}
      />
    </View>
  );
};
```

### Exemple 2 : Liste des prochains départs

```typescript
const NextDepartures = ({ stopId }: { stopId: string }) => {
  const [departures, setDepartures] = useState<Connection[]>([]);

  useEffect(() => {
    const loadDepartures = async () => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 8); // 'HH:MM:SS'

      const dests = await gtfsDb.findDestinationsFrom(
        stopId,
        currentTime
      );

      setDepartures(dests);
    };

    loadDepartures();
  }, [stopId]);

  return (
    <FlatList
      data={departures}
      keyExtractor={(item, index) => `${item.stop_id}-${index}`}
      renderItem={({ item }) => (
        <View>
          <Text>{item.stop_name}</Text>
          <Text>{item.nb_connections} trains disponibles</Text>
        </View>
      )}
    />
  );
};
```

### Exemple 3 : Carte avec gares proches

```typescript
const MapWithNearbyStations = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [nearbyStops, setNearbyStops] = useState<Stop[]>([]);

  useEffect(() => {
    const getLocation = async () => {
      const loc = await Location.getCurrentPositionAsync();
      setLocation(loc);

      const stops = await gtfsDb.findNearbyStops(
        loc.coords.latitude,
        loc.coords.longitude,
        20
      );

      setNearbyStops(stops);
    };

    getLocation();
  }, []);

  return (
    <MapView
      region={{
        latitude: location?.coords.latitude || 48.8566,
        longitude: location?.coords.longitude || 2.3522,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }}
    >
      {nearbyStops.map((stop) => (
        <Marker
          key={stop.stop_id}
          coordinate={{
            latitude: stop.stop_lat,
            longitude: stop.stop_lon,
          }}
          title={stop.stop_name}
        />
      ))}
    </MapView>
  );
};
```

---

## 🔍 Requêtes SQL avancées

Pour des besoins spécifiques, vous pouvez exécuter des requêtes SQL directement :

```typescript
import * as SQLite from 'expo-sqlite';

const db = await SQLite.openDatabaseAsync('gtfs.db');

// Requête personnalisée
const results = await db.getAllAsync<YourType>(
  `SELECT * FROM direct_connections
   WHERE from_stop_name LIKE ?
     AND departure_time >= ?
   ORDER BY departure_time
   LIMIT ?`,
  ['%Paris%', '08:00:00', 10]
);
```

### Exemples de requêtes utiles

#### 1. Compter les trains par ligne
```sql
SELECT route_short_name, COUNT(DISTINCT trip_id) as nb_trains
FROM direct_connections
GROUP BY route_short_name
ORDER BY nb_trains DESC;
```

#### 2. Trouver les gares les plus desservies
```sql
SELECT to_stop_name, COUNT(*) as nb_arrivees
FROM direct_connections
GROUP BY to_stop_name
ORDER BY nb_arrivees DESC
LIMIT 20;
```

#### 3. Durée moyenne des trajets entre deux villes
```sql
SELECT
  from_stop_name,
  to_stop_name,
  AVG(
    (CAST(substr(arrival_time, 1, 2) AS INTEGER) * 60 +
     CAST(substr(arrival_time, 4, 2) AS INTEGER)) -
    (CAST(substr(departure_time, 1, 2) AS INTEGER) * 60 +
     CAST(substr(departure_time, 4, 2) AS INTEGER))
  ) as avg_duration_minutes
FROM direct_connections
WHERE from_stop_name LIKE '%Paris%'
  AND to_stop_name LIKE '%Lyon%'
GROUP BY from_stop_name, to_stop_name;
```

---

## ⚡ Optimisations

### 1. Mise en cache des résultats fréquents

```typescript
const cache = new Map<string, any>();

const getCachedStops = async (query: string) => {
  const cacheKey = `stops:${query}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const results = await gtfsDb.searchStops(query);
  cache.set(cacheKey, results);

  return results;
};
```

### 2. Précharger les gares principales

```typescript
const MAJOR_STATIONS = [
  'Paris Gare de Lyon',
  'Paris Montparnasse',
  'Lyon Part Dieu',
  'Marseille St-Charles',
  // ...
];

const preloadMajorStations = async () => {
  for (const station of MAJOR_STATIONS) {
    await gtfsDb.searchStops(station, 1);
  }
};
```

### 3. Recherche asynchrone avec debounce

```typescript
import { debounce } from 'lodash';

const debouncedSearch = debounce(async (query: string) => {
  return await gtfsDb.searchStops(query);
}, 300);
```

---

## 🐛 Résolution de problèmes

### La base de données ne se charge pas

1. Vérifier que `assets/gtfs.db` existe
2. Vérifier les permissions de fichier
3. Essayer de supprimer et recréer la DB

### Les résultats sont vides

1. Vérifier que les données GTFS ont été importées
2. Exécuter `gtfsDb.getStats()` pour voir le contenu
3. Vérifier les IDs de gares (format GTFS spécifique)

### Performance lente

1. Vérifier que les index sont créés (script de création)
2. Limiter le nombre de résultats avec LIMIT
3. Utiliser la mise en cache pour les requêtes fréquentes

---

## 📊 Structure de la base de données

### Tables principales

- **stops** : Gares et arrêts
- **routes** : Lignes de transport
- **trips** : Trajets individuels
- **stop_times** : Horaires pour chaque arrêt
- **calendar** : Services réguliers
- **calendar_dates** : Exceptions (jours fériés, etc.)

### Vue utile

- **direct_connections** : Pré-jointure pour recherches rapides

---

## 📝 Notes importantes

- Les horaires GTFS peuvent dépasser 24h (ex: 25:30:00 = 1h30 le lendemain)
- Pensez à vérifier le calendrier de service (jours de circulation)
- La recherche de trajets avec correspondances est basique (amélioration possible avec Dijkstra)
- La distance GPS est approximative (pour plus de précision, utiliser la formule de Haversine)

---

## 🔄 Mise à jour des données

Pour mettre à jour les données GTFS :

1. Télécharger les nouvelles données GTFS
2. Remplacer les fichiers dans `assets/sncf_data/`
3. Re-exécuter `node scripts/createGTFSDatabase.js`
4. Remplacer `assets/gtfs.db` dans l'application

---

## 📚 Ressources

- [Spécification GTFS](https://gtfs.org/schedule/)
- [Expo SQLite Documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Better SQLite3 Documentation](https://github.com/WiseLibs/better-sqlite3)

---

## 🎉 Conclusion

Vous avez maintenant une base de données GTFS ultra-performante pour votre application de recherche de trajets !

Pour toute question, consultez le code dans :
- [scripts/createGTFSDatabase.js](./scripts/createGTFSDatabase.js)
- [src/services/gtfsDatabaseService.ts](./src/services/gtfsDatabaseService.ts)
