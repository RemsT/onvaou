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

## Sorties à la journée — randonnée & vélo (`generate-trails.js`)

Module « sorties à la journée » (rando à pied / tour à vélo depuis une gare), **100 % hors-ligne,
aucun appel API au runtime** : les tracés, longueurs, durées et associations gares sont
pré-calculés et embarqués (`src/data/trailsGenerated.ts`).

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
