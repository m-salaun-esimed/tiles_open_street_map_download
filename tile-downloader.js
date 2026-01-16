const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * Téléchargeur de tuiles OpenStreetMap
 * Usage: node tile-downloader.js <zoom> <minLat> <maxLat> <minLon> <maxLon>
 * Exemple: node tile-downloader.js 10 42 44 5 7
 */


const TILE_SERVER = 'https://tile.openstreetmap.org';
const OUTPUT_DIR = path.join(__dirname, 'rw-front/public/map');
const USER_AGENT = 'Tile Downloader/1.0';

const DELAY_MS = 500;

function latLonToTile(lat, lon, zoom) {
    const n = Math.pow(2, zoom);
    const xtile = Math.floor((lon + 180) / 360 * n);
    const ytile = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
    return { x: xtile, y: ytile };
}

function downloadTile(zoom, x, y) {
    return new Promise((resolve, reject) => {
        const url = `${TILE_SERVER}/${zoom}/${x}/${y}.png`;
        const outputPath = path.join(OUTPUT_DIR, String(zoom), String(x), `${y}png.tile`);

        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        if (fs.existsSync(outputPath)) {
            console.log(`✓ Tuile déjà présente: ${zoom}/${x}/${y}`);
            resolve();
            return;
        }

        const options = {
            headers: {
                'User-Agent': USER_AGENT
            }
        };

        console.log(`📥 Téléchargement: ${zoom}/${x}/${y}`);

        https.get(url, options, (response) => {
            if (response.statusCode !== 200) {
                console.error(`❌ Erreur HTTP ${response.statusCode} pour ${zoom}/${x}/${y}`);
                resolve();
                return;
            }

            const fileStream = fs.createWriteStream(outputPath);
            response.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                console.log(`✅ Téléchargé: ${zoom}/${x}/${y}`);
                resolve();
            });

            fileStream.on('error', (err) => {
                fs.unlink(outputPath, () => {});
                console.error(`❌ Erreur écriture: ${err.message}`);
                resolve();
            });
        }).on('error', (err) => {
            console.error(`❌ Erreur réseau: ${err.message}`);
            resolve();
        });
    });
}

// Fonction principale
async function downloadTiles(zoom, minLat, maxLat, minLon, maxLon) {
    console.log(`\n🗺️  Téléchargement de tuiles OSM`);
    console.log(`Zoom: ${zoom}`);
    console.log(`Zone: Lat ${minLat}°-${maxLat}°, Lon ${minLon}°-${maxLon}°\n`);

    const topLeft = latLonToTile(maxLat, minLon, zoom);
    const bottomRight = latLonToTile(minLat, maxLon, zoom);

    const minX = Math.min(topLeft.x, bottomRight.x);
    const maxX = Math.max(topLeft.x, bottomRight.x);
    const minY = Math.min(topLeft.y, bottomRight.y);
    const maxY = Math.max(topLeft.y, bottomRight.y);

    const totalTiles = (maxX - minX + 1) * (maxY - minY + 1);
    console.log(`📊 Tuiles à télécharger: ${totalTiles} (X: ${minX}-${maxX}, Y: ${minY}-${maxY})\n`);

    if (totalTiles > 500) {
        console.warn(`⚠️  ATTENTION: ${totalTiles} tuiles à télécharger!`);
        console.warn(`⚠️  Cela peut prendre beaucoup de temps et de bande passante.`);
        console.warn(`⚠️  Considérez réduire la zone ou le niveau de zoom.\n`);
    }

    let downloaded = 0;

    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            await downloadTile(zoom, x, y);
            downloaded++;

            if (downloaded % 10 === 0) {
                console.log(`\n📈 Progression: ${downloaded}/${totalTiles} (${Math.round(downloaded / totalTiles * 100)}%)\n`);
            }

            await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }
    }

    console.log(`\n✅ Téléchargement terminé! ${downloaded} tuiles traitées.`);
}

const ZONES = {
    mediterranee: {
        name: 'Méditerranée (France)',
        minLat: 42.0,
        maxLat: 44.0,
        minLon: 3.0,
        maxLon: 7.0
    },
    toulon: {
        name: 'Toulon',
        minLat: 43.0,
        maxLat: 43.2,
        minLon: 5.8,
        maxLon: 6.1
    },
    marseille: {
        name: 'Marseille',
        minLat: 43.2,
        maxLat: 43.4,
        minLon: 5.3,
        maxLon: 5.5
    }
};

// Parsing des arguments
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log(`
Usage:
  1. Zone personnalisée:
     node tile-downloader.js <zoom> <minLat> <maxLat> <minLon> <maxLon>
     Exemple: node tile-downloader.js 10 42 44 5 7

  2. Zone prédéfinie:
     node tile-downloader.js <zone> <zoom>
     Exemple: node tile-downloader.js toulon 12

Zones prédéfinies:
${Object.entries(ZONES).map(([key, zone]) =>
    `  - ${key}: ${zone.name} (${zone.minLat}°-${zone.maxLat}°N, ${zone.minLon}°-${zone.maxLon}°E)`
).join('\n')}

Notes:
  - Les tuiles sont téléchargées depuis OpenStreetMap
  - Un délai de ${DELAY_MS}ms est appliqué entre chaque requête
  - Les tuiles existantes sont ignorées
  - Zoom recommandé: 8-12 (plus = plus détaillé mais plus de tuiles)
    `);
    process.exit(0);
}

// Déterminer les paramètres
let zoom, minLat, maxLat, minLon, maxLon;

if (ZONES[args[0]]) {
    // Zone prédéfinie
    const zone = ZONES[args[0]];
    zoom = parseInt(args[1]) || 10;
    minLat = zone.minLat;
    maxLat = zone.maxLat;
    minLon = zone.minLon;
    maxLon = zone.maxLon;
    console.log(`Zone sélectionnée: ${zone.name}`);
} else if (args.length === 5) {
    // Zone personnalisée
    zoom = parseInt(args[0]);
    minLat = parseFloat(args[1]);
    maxLat = parseFloat(args[2]);
    minLon = parseFloat(args[3]);
    maxLon = parseFloat(args[4]);
} else {
    console.error('❌ Arguments invalides. Utilisez --help pour voir les options.');
    process.exit(1);
}

// Validation
if (isNaN(zoom) || zoom < 0 || zoom > 18) {
    console.error('❌ Zoom invalide (doit être entre 0 et 18)');
    process.exit(1);
}

if (isNaN(minLat) || isNaN(maxLat) || isNaN(minLon) || isNaN(maxLon)) {
    console.error('❌ Coordonnées invalides');
    process.exit(1);
}

// Lancer le téléchargement
downloadTiles(zoom, minLat, maxLat, minLon, maxLon)
    .catch(err => {
        console.error('❌ Erreur fatale:', err);
        process.exit(1);
    });
