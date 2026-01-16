const { execSync } = require('child_process');

/**
 * Télécharger plusieurs niveaux de zoom pour une zone
 * Usage: node download-multi-zoom.js <zone> <minZoom> <maxZoom>
 * Exemple: node download-multi-zoom.js toulon 8 14
 */

const args = process.argv.slice(2);

if (args.length !== 3) {
    console.log(`
Usage: node download-multi-zoom.js <zone> <minZoom> <maxZoom>

Exemples:
  node download-multi-zoom.js toulon 8 14
  node download-multi-zoom.js mediterranee 6 12

Zones disponibles: mediterranee, toulon, marseille

Note: Plus le zoom est élevé, plus il y a de tuiles à télécharger!
  Zoom 8-10: Vue régionale (rapide)
  Zoom 11-13: Vue locale (moyen)
  Zoom 14-16: Vue détaillée (lent, beaucoup de tuiles!)
    `);
    process.exit(0);
}

const [zone, minZoom, maxZoom] = args;
const min = parseInt(minZoom);
const max = parseInt(maxZoom);

if (isNaN(min) || isNaN(max) || min > max || min < 0 || max > 25) {
    console.error('❌ Niveaux de zoom invalides (0-25)');
    process.exit(1);
}

console.log(`\n🗺️  Téléchargement multi-zoom`);
console.log(`Zone: ${zone}`);
console.log(`Niveaux de zoom: ${min} à ${max}\n`);

for (let zoom = min; zoom <= max; zoom++) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 ZOOM LEVEL ${zoom}/${max}`);
    console.log('='.repeat(60) + '\n');

    try {
        execSync(`node tile-downloader.js ${zone} ${zoom}`, {
            stdio: 'inherit',
            cwd: __dirname
        });
    } catch (error) {
        console.error(`❌ Erreur au niveau ${zoom}:`, error.message);
    }
}

console.log(`\n✅ Tous les niveaux de zoom téléchargés (${min}-${max})!`);
