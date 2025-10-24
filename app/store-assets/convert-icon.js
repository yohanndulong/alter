/**
 * Script pour convertir l'icône SVG en PNG 512x512
 *
 * Installation des dépendances :
 * npm install sharp
 *
 * Utilisation :
 * node store-assets/convert-icon.js
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 Conversion de l\'icône SVG en PNG 512x512...\n');

// Vérification de la présence du module sharp
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('❌ Le module "sharp" n\'est pas installé.\n');
  console.log('📦 Installez-le avec la commande :');
  console.log('   npm install sharp\n');
  console.log('Ou utilisez une méthode en ligne :');
  console.log('   https://cloudconvert.com/svg-to-png\n');
  process.exit(1);
}

// Chemins des fichiers
const inputPath = path.join(__dirname, '../resources/icon.svg');
const outputPath = path.join(__dirname, 'icon-512.png');

// Vérification du fichier source
if (!fs.existsSync(inputPath)) {
  console.error(`❌ Fichier source introuvable : ${inputPath}\n`);
  process.exit(1);
}

// Conversion
sharp(inputPath)
  .resize(512, 512)
  .png()
  .toFile(outputPath)
  .then(info => {
    console.log('✅ Conversion réussie !\n');
    console.log(`📁 Fichier créé : ${outputPath}`);
    console.log(`📐 Dimensions : ${info.width} x ${info.height} pixels`);
    console.log(`💾 Taille : ${(info.size / 1024).toFixed(2)} KB\n`);
    console.log('🎉 Prêt pour Google Play Store !');
  })
  .catch(err => {
    console.error('❌ Erreur lors de la conversion :\n', err.message);
    console.log('\n💡 Utilisez une méthode alternative :');
    console.log('   https://cloudconvert.com/svg-to-png');
    process.exit(1);
  });
