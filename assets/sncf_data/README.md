# 📁 Données GTFS SNCF

Ce dossier contient les fichiers GTFS (General Transit Feed Specification) de la SNCF.

## 📄 Fichiers requis

Les fichiers suivants doivent être présents pour que l'initialisation automatique fonctionne :

### Obligatoires
- ✅ `stops.txt` - Gares et arrêts
- ✅ `routes.txt` - Lignes de transport
- ✅ `trips.txt` - Trajets individuels
- ✅ `stop_times.txt` - Horaires (fichier le plus volumineux ~50MB)
- ✅ `calendar_dates.txt` - Dates de circulation

### Optionnels
- `agency.txt` - Informations sur l'opérateur
- `feed_info.txt` - Métadonnées du flux
- `transfers.txt` - Correspondances recommandées

## 📥 Source des données

Les données GTFS sont disponibles sur [transport.data.gouv.fr](https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-ferre-sncf)

**Dernière mise à jour** : Octobre 2024

## ⚙️ Utilisation

Ces fichiers sont automatiquement utilisés par l'application au premier lancement pour créer la base de données SQLite optimisée.

**Aucune action manuelle requise** - L'application gère tout automatiquement !

## 🔄 Mise à jour

Pour mettre à jour les données :

1. Télécharger le dernier export GTFS depuis transport.data.gouv.fr
2. Extraire les fichiers dans ce dossier (remplacer les anciens)
3. Supprimer `assets/gtfs.db` si elle existe
4. Relancer l'application - La DB sera recréée automatiquement

## 📊 Taille approximative

- `stop_times.txt` : ~50 MB
- `trips.txt` : ~6 MB
- `calendar_dates.txt` : ~4 MB
- `stops.txt` : ~750 KB
- `routes.txt` : ~75 KB
- Autres : < 1 KB

**Total** : ~60 MB (données compressées dans la DB : ~30 MB)

## ⚠️ Important

- Ne pas supprimer ces fichiers - L'app en a besoin pour l'initialisation
- Ces fichiers sont versionnés dans git
- La base de données générée (`gtfs.db`) n'est PAS versionnée

## 📝 Format GTFS

Le format GTFS est un standard pour les données de transport en commun.

Documentation : [gtfs.org](https://gtfs.org/)

## 🔍 Vérification

Pour vérifier que tous les fichiers nécessaires sont présents :

```bash
ls -lh assets/sncf_data/
```

Vous devriez voir au minimum :
- stops.txt
- routes.txt
- trips.txt
- stop_times.txt
- calendar_dates.txt

---

**✅ Si ces fichiers sont présents, l'application fonctionnera automatiquement !**
