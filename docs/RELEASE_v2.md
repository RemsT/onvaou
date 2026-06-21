# ONvaOU v2.0.0 — Dossier de release (App Store / TestFlight)

Version **2.0.0** · build **7** (iOS buildNumber 7 / Android versionCode 7)

---

## 1. Nouveautés (App Store / Google Play — « What's New »)

> À coller dans App Store Connect (« Nouveautés de cette version ») et Google Play (« Notes de version »).

```
ONvaOU v2 — vos sorties à la journée en train, sans voiture !

• Sorties à pied et à vélo : randonnées et tours vélo accessibles depuis chaque gare, avec le tracé complet sur la carte et l'itinéraire d'accès.
• Profil personnalisable : choisissez vos distances (rando / vélo), le type de parcours (boucle ou linéaire), la durée max et votre temps de marche.
• Mode « à pied » ou « à vélo » : la recherche s'adapte à votre façon de vous déplacer sur place.
• Favoris : gardez vos destinations préférées et retrouvez-les en un toucher, avec horaires à jour.
• Carte d'itinéraire repensée : tracé, accès depuis la gare, navigation, et liens vers plus d'infos.
• Activités mieux rangées et fiables, liens cliquables vers chaque site.

Bon voyage 🚆
```

Notes courtes (si limite de caractères) :
```
• Randonnées & tours vélo depuis chaque gare, tracé sur la carte
• Profil : distances, durée, temps de marche personnalisables
• Mode à pied / à vélo
• Favoris destinations + horaires à jour
• Carte d'itinéraire et activités améliorées
```

---

## 2. TestFlight — « À tester » (What to Test)

> À coller dans App Store Connect ▸ TestFlight ▸ Informations de test.

```
Merci de tester la refonte v2 (sorties à la journée). Points clés :

1) Onglet Profil : réglez les distances rando/vélo, le type, la durée et le temps de marche max. Vérifiez que vos réglages sont conservés au redémarrage.
2) Recherche en mode « à pied » : le tag Vélo doit disparaître, et seules les activités proches (≤ votre temps de marche) doivent rester.
3) Lancez une recherche avec un tag (ex. Baignade, Randonnée) : les destinations renvoyées doivent bien afficher ce tag sur leur fiche.
4) Sur une fiche : dépliez un tag, touchez « Voir le trajet » d'une rando/vélo → le tracé + l'accès doivent s'afficher ; testez « Lancer la navigation ».
5) Favoris : sauvegardez une destination, rouvrez-la depuis l'onglet Favoris, changez la date via le calendrier → les horaires doivent s'adapter.

Signalez tout site/itinéraire incohérent (nom, distance, tracé manquant).
```

---

## 3. Checklist de test QA (avant soumission)

### Profil
- [ ] Les 4 réglages se modifient : sliders rando/vélo (et saisie min/max), type (3 boutons), durée max (curseur Aucune→6h), temps de marche max.
- [ ] Réglages **persistés** après redémarrage de l'app.
- [ ] « Réinitialiser » remet les valeurs par défaut.

### Mode de déplacement (recherche)
- [ ] Toggle « 🚶 À pied / 🚲 À vélo » présent sur l'écran de recherche.
- [ ] Passage en **à pied** → le tag **Vélo disparaît** du sélecteur ; s'il était sélectionné, il est retiré.
- [ ] En **à pied**, les activités d'une destination sont **bornées au temps de marche** du profil.
- [ ] En **à vélo**, aucune restriction de marche ; le tag Vélo réapparaît.

### Recherche & cohérence des tags
- [ ] Recherche avec un tag (Baignade, Culture, Randonnée…) → les destinations **affichent bien ce tag** sur leur fiche (petites gares incluses).
- [ ] Filtre Vélo/Rando : seules des destinations avec un tour **dans la plage du Profil** apparaissent.
- [ ] Modifier le Profil puis relancer la même recherche → le résultat reflète les nouveaux critères (pas de cache périmé).

### Fiche destination
- [ ] Chaque activité a un nom **cliquable** (site ou recherche web) + « Voir le trajet ».
- [ ] Sous Randonnée/Vélo : seules de vraies sorties (longueur connue) ou descriptions curées — **pas de visites audioguidées**.
- [ ] Sélecteur date/heure (depuis Favoris) recalcule départs/retours.
- [ ] Retours possibles = après l'arrivée du départ sélectionné.

### Carte d'itinéraire (rando/vélo)
- [ ] Tracé du tour (vert) + accès depuis la gare (bleu pointillé fin) visibles.
- [ ] Autres parcours du même mode en traits fins, **cliquables** (deviennent le tracé principal).
- [ ] Le sentier reste **dans le champ** (cadrage auto) ; « Lancer la navigation » ouvre Plans (iOS) / Google Maps (Android).
- [ ] Activité sans tracé (POI point) → légende « Tracé non disponible ».

### Favoris & historique
- [ ] Sauvegarder une destination → onglet Favoris ▸ Destinations ; réouverture identique.
- [ ] Onglet Favoris : sélecteur Recherches / Destinations.
- [ ] Relancer un favori/historique → arrive **toujours** sur la page de recherche.
- [ ] Pas de doublon dans l'historique (même gare + mêmes filtres).

### Multi-plateforme / affichage
- [ ] Bandeau de statut (encoche/poinçon) correct sur iOS et Android.
- [ ] Curseurs (Profil) fonctionnent au toucher sur iOS et Android.
- [ ] 4 onglets : Rechercher / Favoris / Historique / Profil.

---

## 4. Build & soumission

```bash
# iOS
eas build --platform ios --profile production
eas submit --platform ios

# Android (versionCode 7 > 6 requis — OK)
eas build --platform android --profile production
eas submit --platform android
```

Rappels :
- Vérifier `app.json` : version 2.0.0, iOS buildNumber 7, Android versionCode 7. ✅
- Captures d'écran à mettre à jour si l'UI a changé (onglet Profil, mode à pied/vélo, carte itinéraire).
- Attribution **ODbL « © contributeurs OpenStreetMap »** présente dans l'app (tracés rando/vélo).
