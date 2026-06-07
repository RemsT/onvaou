# ONvaOU — CLAUDE.md

Application React Native / Expo permettant de trouver des destinations accessibles en train depuis une gare de départ, avec horaires GTFS SNCF, prix estimés et filtres d'activités.

## Stack technique

- **Expo SDK 54**, React Native 0.81.5, React 19
- **expo-sqlite** : base de données GTFS locale (stops, trips, stop_times…)
- **react-native-maps** : carte des destinations
- **@react-navigation/stack + bottom-tabs** : navigation
- **AsyncStorage** : historique, favoris, onboarding
- **expo-haptics** : retours haptiques (ne pas supprimer, voulu)
- **expo-linear-gradient** : installé MAIS ne fonctionne pas dans Expo Go (dev build requis). Ne pas l'utiliser dans des composants affichés en Expo Go — utiliser des animations opacity/Animated.View à la place.

## Architecture

```
App.tsx                         ← initialisation GTFS + SearchProvider
src/
  navigation/AppNavigatorSimple.tsx  ← Stack (Onboarding > Main > MapView > ResultsList > DestinationDetail)
  context/SearchContext.tsx          ← pendingRelaunch pour relancer depuis l'historique
  screens/
    HomeScreenSimple.tsx        ← écran principal de recherche (onglet "Rechercher")
    MapScreenSimple.tsx         ← carte des destinations (stack)
    ResultsListScreen.tsx       ← liste triable des destinations (stack)
    DestinationDetailScreenSimple.tsx ← détail + lien SNCF Connect (stack)
    HistoriqueScreen.tsx        ← historique + favoris étoilés (onglet "Historique")
    FavoritesScreenSimple.tsx   ← favoris uniquement (onglet "Favoris")
    OnboardingScreen.tsx        ← slides intro, clé AsyncStorage ONBOARDING_KEY
  services/
    hybridSearchService.ts      ← point d'entrée principal de la recherche
    localSearchService.ts       ← requêtes SQL sur la DB GTFS
    localStationService.ts      ← recherche de gares
    recentSearchService.ts      ← historique + favoris (clé @onvaou_searches_v2)
    priceEstimationService.ts   ← estimation tarifaire
    gtfsDatabaseService.ts      ← init DB GTFS depuis assets
  hooks/useGTFSInitialization.ts ← hook partagé, appelé dans App.tsx ET HomeScreen (double appel normal)
  components/
    SearchLoadingOverlay.tsx    ← overlay affiché pendant la recherche (remplace le HomeScreen entier)
    SkeletonCard.tsx            ← cartes squelettes (animation opacity, PAS LinearGradient)
    DatabaseInitializationScreen.tsx
    DateTimePicker.tsx, LabelSelectionModal.tsx, TimePickerModal.tsx, BudgetPickerModal.tsx
  data/
    frenchStations.ts           ← liste statique des gares françaises
    stationLabels.ts            ← tags manuels par gare (activités, POIs, descriptions)
  types/index.ts (ou types.ts)  ← Station, SearchResult, CityLabel, CITY_LABELS, TagEvidence…
```

## Flux de recherche

1. `HomeScreen.handleSearch()` valide les champs (gare + date obligatoires)
2. `executeSearch()` → `setLoading(true)` → le HomeScreen affiche `SearchLoadingOverlay`
3. `HybridSearchService.searchDestinations(fromStation, mode, maxTime, maxBudget, date, labels, timeRangeStart, timeRangeEnd, maxTransfers, labelFilterMode)`
4. Résultats → `navigation.navigate('MapView', {...})` puis `setLoading(false)`
5. MapView affiche les marqueurs ; depuis là on peut aller sur `ResultsList` ou `DestinationDetail`

## SearchContext (relance depuis l'historique)

- `HistoriqueScreen` / `FavoritesScreen` appellent `setPendingRelaunch(search)` + `navigation.navigate('Rechercher')`
- `HomeScreen` écoute via `useFocusEffect` → `handleRelaunch(pendingRelaunch)` re-remplit les champs

### Bug connu dans handleRelaunch (à corriger)
```ts
// FAUX — directOnly et includeTransfers sont inverses :
setDirectOnly(recent.includeTransfers ?? false);
// CORRECT :
setDirectOnly(!recent.includeTransfers);
```
Idem à la sauvegarde : `includeTransfers: p.directOnly` est sémantiquement inversé.

## RecentSearch — champ includeTransfers

`includeTransfers: true` = correspondances autorisées (directOnly=false).
`includeTransfers: false` = trajet direct uniquement (directOnly=true).
**Ces deux champs sont des inverses l'un de l'autre.**

## GTFS — données et fraîcheur

- Les données GTFS SNCF sont embarquées dans les assets de l'app.
- Elles ont une couverture de dates. Si les dates ont expiré → "peu/aucun résultat" sur toutes les recherches.
- `isGTFSStale` dans `useGTFSInitialization` détecte ce cas et affiche une bannière dans HomeScreen.
- L'utilisateur peut forcer une mise à jour via `initializeDatabase(false, true)`.

## Navigation — règles importantes

- `MapView`, `ResultsList`, `DestinationDetail` sont dans le **Stack** (pas les tabs).
- Les tabs sont : `Rechercher` (HomeScreen), `Historique`, `Favoris`.
- Pour naviguer depuis un tab vers un autre tab : `navigation.navigate('Rechercher')` — fonctionne car `navigation` dans un tab screen a les méthodes tab.
- Pour naviguer vers le Stack depuis n'importe où : `navigation.navigate('MapView', {...})`.

## react-native-maps — marqueurs personnalisés sur Android (PIÈGE)

Sur **Android**, un `<Marker>` avec une **vue enfant custom** (`<View>` colorée) ne s'affiche QUE si
`tracksViewChanges` est vrai au moment de la capture de la vue. Pattern qui FONCTIONNE
(utilisé dans `MapScreenSimple.tsx` et `DestinationDetailScreenSimple.tsx`) :

```ts
const [androidTrackMarkers, setAndroidTrackMarkers] = useState(Platform.OS === 'android');
useEffect(() => {
  if (Platform.OS !== 'android') return;
  setAndroidTrackMarkers(true);           // vrai DÈS le montage (pas après onMapReady)
  const t = setTimeout(() => setAndroidTrackMarkers(false), 2000); // coupé ensuite (perf)
  return () => clearTimeout(t);
}, []);
// sur chaque <Marker> :  tracksViewChanges={Platform.OS === 'android' ? androidTrackMarkers : false}
```

Règles vérifiées à la dure (ne PAS refaire ces erreurs) :
- **Rendre les markers directement**, PAS derrière un gate `{mapReady && ...}`. Le gate les monte trop
  tard (après la fenêtre de capture) → invisibles sur Android.
- `androidTrackMarkers` doit démarrer `true` au montage, **pas** être attaché à `mapReady`/`onMapReady`.
- Ne PAS remplacer les vues custom par `pinColor="#hex"` : sur Android (Google Maps) un hex se convertit
  mal en hue → pin invisible/incorrect.
- Vaut aussi pour les cartes dans un **ScrollView** (cas de la fiche détail).

## Patterns à respecter

- Les nouvelles dépendances qui nécessitent un **module natif** (LinearGradient, Camera, etc.) ne fonctionnent **pas dans Expo Go** — utiliser uniquement des APIs Expo compatibles Expo Go, ou documenter qu'un dev build est requis.
- `useGTFSInitialization` est intentionnellement appelé deux fois (App.tsx + HomeScreen) — ne pas "optimiser" en le déplaçant.
- Les filtres temps/budget sont optionnels : sans filtre actif, `searchMode = 'time'` et tout est affiché.
- `maxTransfers` : 0 = direct, 1 = 1 correspondance max.

## Commandes utiles

```bash
npx expo start          # démarrer le serveur de dev
npx tsc --noEmit        # vérifier les types
```
