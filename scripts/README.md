# Scripts de génération des tags (v2)

## Vue d'ensemble

Les tags d'activité par gare (Baignade, Montagne, Culture…) sont **pré-calculés hors-ligne**
puis figés dans `src/data/stationLabelsGenerated.ts`. L'app ne fait **aucun** appel réseau
pour les tags.

Depuis la v2, un tag n'est attribué à une gare **que si au moins un point d'intérêt (POI)
est à ≤ 5 km à vol d'oiseau** (plausible à pied/vélo). On stocke par POI : `name`, `url`,
`lat`, `lon`, `km` (distance à vol d'oiseau). **Aucun routing** n'est calculé ici : l'app
affiche la distance approximative et un bouton « Voir le trajet » qui ouvre **Maps** (lequel
calcule le vrai itinéraire pied/vélo à la demande).

## Registre unique des tags

`src/config/tags.json` est la **source de vérité** (consommée par l'app ET par le script) :

```json
{
  "key": "kid-games",
  "name": "Jeux pour enfants",
  "icon": "🎠",
  "color": "#FF6B6B",
  "datatourismeClasses": ["ThemePark", "Playground"],
  "radiusKm": 8,
  "noun": "parcs de jeux"
}
```

**Ajouter un tag = ajouter une entrée ici.** Aucun code à modifier (ni écran, ni type, ni script).

## Réactualisation (mensuelle / semestrielle)

```bash
# 1) Télécharger la ressource "datatourisme-place.csv" (~280 Mo) du dataset
#    https://www.data.gouv.fr/datasets/datatourisme-la-base-nationale-des-donnees-publiques-dinformation-touristique-en-open-data
#    → l'enregistrer en /tmp/dt_place.csv

# 2) Générer (hors-ligne, AUCUNE clé requise)
node scripts/generate-tags.js          # ~quelques minutes

# 3) Vérifier
npx tsc --noEmit
npm test
```

- Test rapide sur un échantillon : `node scripts/generate-tags.js --limit 20`
- Rapide et reproductible : pas d'API, pas de clé, pas de quota.

## Réglage (constantes en tête de `generate-tags.js`)

| Constante | Valeur | Rôle |
|---|---|---|
| `BIKE_MAX_MIN` | 20 | cap d'accessibilité vélo (cohérent avec `MAX_BIKE_MIN` côté app) |
| `KEEP_MAX_KM` | ≈3,1 | distance max (vol d'oiseau) pour garder un POI, **dérivée** du cap 20 min |
| `TOP_POIS` | 3 | nombre de POI gardés (les plus proches) par tag |

`KEEP_MAX_KM` n'est plus une valeur fixe : il est **calculé** depuis `BIKE_MAX_MIN` (20 min),
`BIKE_SPEED_KMH` (13) et `DETOUR_FACTOR` (1,4) — c'est le pré-filtre vol d'oiseau du cap « ≤ 20 min
de vélo ». Le filtre fin (minutes réelles via Valhalla) s'applique ensuite au runtime
(`MAX_BIKE_MIN` / `isBeyondBikeCap` dans `src/utils/directions.ts`).

Côté app, le seuil marche/vélo suggéré est aussi dans `src/utils/directions.ts`
(`WALK_SUGGEST_KM = 2`).

## Campings (`generate-campings.js`)

Rattache les **campings** aux gares, **100 % hors-ligne, zéro API runtime**. Même source et même
CSV que `generate-tags.js` (`/tmp/dt_place.csv`), même grille spatiale 0,1° + `haversine`.

```bash
# Mêmes prérequis que ci-dessus (CSV DATAtourisme en /tmp/dt_place.csv)
node scripts/generate-campings.js        # → src/data/campingsGenerated.ts (REMPLACE le fichier)
npx tsc --noEmit && npm test
```

- Ne garde que les POI de classe **`CampingAndCaravanning`** (col Categories).
- **Étoiles** extraites de `Classements_du_POI` (col 11) via `parseStars` (regex `/(\d+)\s*étoiles?/i`,
  miroir du helper testé `src/services/profilePreferencesService.ts`) ; **commune** = col 5.
- Rattache un camping à une gare si distance vol d'oiseau ≤ `RADIUS_KM` (10 km) ; cap `TOP` (6) par
  gare, triés **étoiles décroissantes puis distance**.
- Le filtre **★ minimum / inclure non classés** (Profil) et le plafond **mode à pied** (temps de
  marche max) sont appliqués au **runtime** (`stationLabels.ts` + `campingMatches`), pas ici.
- Test rapide : `node scripts/generate-campings.js --limit 20`.

| Constante | Valeur | Rôle |
|---|---|---|
| `RADIUS_KM` | 10 | rayon de rattachement (vol d'oiseau), cohérent avec `tags.json` `camping.radiusKm` |
| `TOP` | 6 | nombre de campings gardés par gare (étoiles ↓ puis distance ↑) |

## Élévation / D+ (`enrich-trails-elevation.js`) — Phase 2

Enrichit `src/data/trailsGenerated.ts` avec l'altitude depuis **SRTM 30 m** (tuiles publiques AWS
« skadi », **sans clé**, hors-ligne au build — aucun appel runtime).

```bash
node scripts/enrich-trails-elevation.js   # (alias : npm run enrich-elevation)
npm run build-content                      # IMPORTANT ensuite
```

- Pour chaque tracé : décode la geom → **densifie ~100 m** → échantillonne l'altitude → **D+/D-** avec
  **filtre anti-bruit** (seuil 10 m, sinon SRTM surestime) → profil downsamplé (24 pts) → **durée
  Naismith** recalculée → **niveau d'effort** (Facile→Difficile) à défaut de `sac_scale`.
- Tuiles mises en cache dans `/tmp/srtm` (≈ tuiles France touchées par les tracés).
- Libs pures testables : `scripts/lib/elevation.js` (maths) + `scripts/lib/srtm.js` (sampler).
  Affichage : `src/components/ElevationProfile.tsx` (mini-graphe barres, sans dépendance native).

## Base contenu SQLite (`build-content-db.js`) — F1, allègement

Sort les données générées (`stationLabelsGenerated` / `trailsGenerated` / `campingsGenerated`, ~9 Mo)
du **bundle JS** (où elles sont parsées à CHAQUE lancement → RAM + démarrage) vers un fichier SQLite
**interrogé à la demande par UIC**.

```bash
npm run build-content        # → assets/content.db + src/data/contentDbVersion.ts
```

- 3 tables (`labels`/`trails`/`campings`), 1 ligne par UIC, valeur = JSON. `meta.version` = empreinte.
- **À relancer après chaque régénération** des données (`generate-tags`, `generate-trails`,
  `generate-campings`).
- Runtime : `src/services/contentDatabaseService.ts` copie l'asset sous `SQLite/content-<version>.db`
  (nom versionné → recopie auto après mise à jour) puis l'ouvre en **sync** (`getFirstSync`). Repli
  paresseux sur les `.ts` en environnement Node/test. Init awaitée dans `useGTFSInitialization`.
- État : **labels + trails + campings** tous servis par la base (aucun import statique des `.ts` dans
  l'app — fusion labels faite **par UIC** dans `stationLabels.ts`). `getStationData` reste synchrone.
- Nécessite `better-sqlite3` (devDep, build-time uniquement). `metro.config.js` traite `.db` en asset.

## Sorties à la journée — randonnée & vélo (`generate-trails.js`)

Module « sorties à la journée » (rando à pied / tour à vélo depuis une gare), **100 % hors-ligne,
aucun appel API au runtime** : les tracés, longueurs, durées et associations gares sont
pré-calculés et embarqués (`src/data/trailsGenerated.ts`).

**Source des tracés (Phase 1 — données riches)** : flux WFS **magOSM** (relations OSM, ODbL), qui
porte les tags utiles (`ref`, `network`, `sac_scale`, `osm_id`, `wikidata`, `website`…). Télécharger
les GeoJSON (EPSG:4326) puis générer :

```bash
# Rando (foot routes) → /tmp/rando.geojson  ·  Vélo/VTT → /tmp/velo.geojson
curl -sL "https://magosm.magellium.com/geoserver/wfs?request=GetFeature&version=2.0.0&count=500000&outputFormat=application/json&typeName=magosm:hiking_foot_routes_line&srsName=EPSG:4326" -o /tmp/rando.geojson
curl -sL "https://magosm.magellium.com/geoserver/wfs?request=GetFeature&version=2.0.0&count=500000&outputFormat=application/json&typeName=magosm:bicycle_mtb_routes_line&srsName=EPSG:4326" -o /tmp/velo.geojson
node --max-old-space-size=4096 scripts/generate-trails.js --mode walk --in /tmp/rando.geojson
node --max-old-space-size=4096 scripts/generate-trails.js --mode bike --in /tmp/velo.geojson
npm run build-content   # IMPORTANT : régénère assets/content.db
```

**Champs enrichis** portés sur chaque `Trail` (optionnels) : `ref` (ex. « GR 65 », « EV6 »),
`network` (portée iwn/nwn/rwn/lwn ou icn/ncn/rcn/lcn), `activity`, `difficulty` (T1–T6 depuis
`sac_scale`, rare dans OSM → surtout via le D+ en Phase 2), `popularity` (proxy de tri : portée du
réseau + ref + balisage + Wikidata/site). **Dédup par `osm_id`** (sinon par nom). Affichage :
badges ref/réseau/difficulté + tri « populaire d'abord » (`src/utils/trailMeta.ts`).

**Sources (ouvertes, France, licence ODbL — attribution « © contributeurs OpenStreetMap »
obligatoire dans l'app) :**
- Rando → data.gouv « Itinéraires de randonnée dans OpenStreetMap » (GeoJSON, `route=hiking/foot`).
- Vélo → ON3V « Véloroutes » (data.gouv) + relations OSM `route=bicycle/mtb` (boucles VTT).

**Pipeline (manuel, gros fichiers) :**
```bash
# Rando
node scripts/generate-trails.js --mode walk --in /tmp/rando.geojson
# Vélo
node scripts/generate-trails.js --mode bike --in /tmp/veloroutes.geojson
```

**Association gare ↔ tracé** (même grille spatiale 0,1° + `haversine` que `generate-tags.js`) :
- *Boucle* (extrémités ≤ `LOOP_CLOSE_KM`) → rattachée à la gare la plus proche d'un point du tracé,
  si accès ≤ `ACCESS_MAX_KM[mode]` (2 km marche / 4 km vélo).
- *Linéaire* :
  - **marche** → priorité **gare → gare** (deux extrémités proches de DEUX gares).
  - **vélo** (`LINEAR_VIA_NEAREST.bike`) → rattaché au **point le plus proche** d'une gare (les longues
    véloroutes ne longent souvent qu'UNE gare → on propose une section roulable).
- **Longueurs** : `MIN_KM`/`MAX_KM` par mode (marche 1–30 km, **vélo 3–100 km**). Un tracé plus long
  que `MAX_KM` est **découpé** (`clipSection`) en une section ≤ `MAX_KM` depuis le point de jonction.
Géométries **simplifiées** (Douglas-Peucker, `SIMPLIFY_TOL_M`) puis **encodées** (polyligne précision 6,
décodable par `decodePolyline6` de `routingService.ts`) pour limiter la taille. Plafond `TOP_TRAILS`/gare.

**Maîtrise de la taille** : seuls les tracés rattachés à une gare sont conservés ; cible +10-20 Mo
(cf. plan). Si trop volumineux, basculer `trailsGenerated.ts` vers un asset SQLite (comme le GTFS).

**Reste à faire (phase app, après 1re génération)** : ajouter les tags `randonnee` (enrichi) et
`velo` (nouveau) à `src/config/tags.json`, et l'écran « Sorties à la journée » réutilisant
`RouteMapScreen`/`Polyline`. **Ne pas ajouter le tag `velo` à `tags.json` tant que les données ne
sont pas générées** (sinon filtre vide dans l'UI).

## Évolution possible (sans changer l'UI)

Pour passer de « à ~X km » à « X min à pied » (durée/mode exacts), on pourrait remplir
`mode`/`minutes`/`route` via un **moteur de routing local** (Valhalla/OSRM sur un extrait OSM
France) — les champs existent déjà (optionnels) dans `TaggedPoi`. L'affichage s'adapterait
automatiquement.

L'ancien `scripts/generate-from-datatourisme.js` (rayon large, sans accessibilité) est conservé
pour référence mais **remplacé** par `generate-tags.js`.
