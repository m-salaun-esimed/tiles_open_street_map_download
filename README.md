# Téléchargeur de Tuiles OpenStreetMap

Outil Node.js pour télécharger des tuiles de cartes OpenStreetMap pour une utilisation hors-ligne.

## Fonctionnalités

- Téléchargement de tuiles OSM pour une zone géographique définie
- Zones prédéfinies (Méditerranée, Toulon, Marseille) ou coordonnées personnalisées
- Support de multiples niveaux de zoom
- Reprise automatique (ignore les tuiles déjà téléchargées)
- Délai entre requêtes pour respecter les serveurs OSM

## Prérequis

- Node.js (version 12 ou supérieure)
- Connexion internet

## Installation

Aucune dépendance externe n'est requise, le projet utilise uniquement des modules Node.js natifs.

```bash
git clone <votre-repo>
cd tiles_open_street_map_download
```

## ⚠️ Configuration importante : Chemin de destination

**AVANT DE LANCER LE TÉLÉCHARGEMENT**, vous devez modifier le chemin de destination des tuiles dans le fichier [tile-downloader.js](tile-downloader.js#L13).

Par défaut, les tuiles sont sauvegardées dans :
```javascript
const OUTPUT_DIR = path.join(__dirname, 'rw-front/public/map');
```

**Modifiez cette ligne** selon vos besoins :

```javascript
// Exemple 1 : Dossier local
const OUTPUT_DIR = path.join(__dirname, 'tiles');

// Exemple 2 : Chemin absolu
const OUTPUT_DIR = '/var/www/html/map-tiles';

// Exemple 3 : Dossier dans le projet
const OUTPUT_DIR = path.join(__dirname, 'public/osm-tiles');
```

Les tuiles seront organisées dans ce dossier selon la structure :
```
OUTPUT_DIR/
  ├── {zoom}/
  │   ├── {x}/
  │   │   ├── {y}png.tile
  │   │   └── ...
```

## Utilisation

### 1. Téléchargement simple avec zone prédéfinie

```bash
node tile-downloader.js <zone> <zoom>
```

**Exemples :**
```bash
# Toulon au zoom 12
node tile-downloader.js toulon 12

# Marseille au zoom 10
node tile-downloader.js marseille 10

# Méditerranée au zoom 8
node tile-downloader.js mediterranee 8
```

### 2. Téléchargement avec coordonnées personnalisées

```bash
node tile-downloader.js <zoom> <minLat> <maxLat> <minLon> <maxLon>
```

**Exemple :**
```bash
# Nice au zoom 11
node tile-downloader.js 11 43.6 43.8 7.2 7.3
```

### 3. Téléchargement multi-zoom

Pour télécharger plusieurs niveaux de zoom d'un coup :

```bash
node download-multi-zoom.js <zone> <minZoom> <maxZoom>
```

**Exemples :**
```bash
# Toulon, zoom 8 à 14
node download-multi-zoom.js toulon 8 14

# Méditerranée, zoom 6 à 12
node download-multi-zoom.js mediterranee 6 12
```

## Zones prédéfinies

| Zone | Nom | Coordonnées |
|------|-----|-------------|
| `mediterranee` | Méditerranée (France) | 42°-44°N, 3°-7°E |
| `toulon` | Toulon | 43°-43.2°N, 5.8°-6.1°E |
| `marseille` | Marseille | 43.2°-43.4°N, 5.3°-5.5°E |

Vous pouvez ajouter vos propres zones dans l'objet `ZONES` du fichier [tile-downloader.js](tile-downloader.js#L118).

## Niveaux de zoom

| Zoom | Description | Nombre de tuiles | Usage |
|------|-------------|------------------|-------|
| 0-5 | Vue mondiale/continentale | Très peu | Navigation globale |
| 6-8 | Vue régionale | Peu (~100-500) | Vue d'ensemble |
| 9-11 | Vue départementale | Moyen (~500-2000) | Navigation régionale |
| 12-14 | Vue locale/ville | Beaucoup (~2000-10000) | Navigation urbaine |
| 15-18 | Vue très détaillée | Énorme (>10000) | Navigation précise |

**Attention :** Plus le niveau de zoom est élevé, plus le nombre de tuiles augmente exponentiellement !

## Paramètres de configuration

Dans [tile-downloader.js](tile-downloader.js#L12), vous pouvez modifier :

```javascript
// Serveur de tuiles
const TILE_SERVER = 'https://tile.openstreetmap.org';

// Dossier de destination ⚠️ À MODIFIER
const OUTPUT_DIR = path.join(__dirname, 'rw-front/public/map');

// User-Agent (identifiez votre application)
const USER_AGENT = 'Tile Downloader/1.0';

// Délai entre chaque téléchargement (en ms)
const DELAY_MS = 500;
```

## Bonnes pratiques

1. **Respectez la politique d'utilisation d'OSM** :
   - Ne téléchargez que ce dont vous avez besoin
   - Respectez le délai entre requêtes (500ms minimum)
   - Utilisez un User-Agent approprié

2. **Estimez le nombre de tuiles avant de lancer** :
   - Le script affiche une estimation avant de commencer
   - Pour >500 tuiles, un avertissement s'affiche

3. **Testez avec des petites zones d'abord** :
   - Commencez avec un zoom faible (8-10)
   - Vérifiez que le chemin de destination est correct

4. **Les tuiles existantes sont ignorées** :
   - Vous pouvez relancer le script sans problème
   - Utile pour reprendre après une interruption

## Structure des fichiers téléchargés

Les tuiles sont nommées `{y}png.tile` et organisées par zoom et coordonnée X :

```
OUTPUT_DIR/
  ├── 10/              # Niveau de zoom
  │   ├── 512/         # Coordonnée X
  │   │   ├── 345png.tile
  │   │   ├── 346png.tile
  │   │   └── ...
  │   ├── 513/
  │   │   └── ...
```

## Dépannage

**Erreur "Cannot create directory"** :
- Vérifiez que le chemin `OUTPUT_DIR` existe et que vous avez les permissions d'écriture

**Erreur HTTP 403/429** :
- Vous faites trop de requêtes, augmentez `DELAY_MS`
- Vérifiez votre User-Agent

**Tuiles vides ou invalides** :
- Vérifiez votre connexion internet
- Les coordonnées peuvent être hors des limites OSM

## Licence

Ce projet est un outil d'utilisation des données OpenStreetMap.
Les données OSM sont sous licence [ODbL](https://www.openstreetmap.org/copyright).

## Avertissement

Respectez les [conditions d'utilisation](https://operations.osmfoundation.org/policies/tiles/) du service de tuiles OpenStreetMap. Pour une utilisation intensive, envisagez d'héberger votre propre serveur de tuiles.
