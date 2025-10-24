/**
 * Script pour générer la variable d'environnement FIREBASE_SERVICE_ACCOUNT
 * à partir du fichier google-services.json téléchargé depuis Firebase Console
 *
 * Usage:
 *   node scripts/generate-firebase-env.js <chemin-vers-google-services.json>
 *
 * Exemple:
 *   node scripts/generate-firebase-env.js C:\Users\Yohann\Downloads\google-services.json
 */

const fs = require('fs');
const path = require('path');

// Récupérer le chemin du fichier depuis les arguments
const args = process.argv.slice(2);
const jsonPath = args[0];

if (!jsonPath) {
  console.error('❌ Erreur: Veuillez fournir le chemin vers le fichier JSON Firebase');
  console.log('\nUsage:');
  console.log('  node scripts/generate-firebase-env.js <chemin-vers-google-services.json>');
  console.log('\nExemple:');
  console.log('  node scripts/generate-firebase-env.js C:\\Users\\Yohann\\Downloads\\google-services.json');
  process.exit(1);
}

// Vérifier si le fichier existe
if (!fs.existsSync(jsonPath)) {
  console.error(`❌ Erreur: Le fichier n'existe pas: ${jsonPath}`);
  process.exit(1);
}

try {
  // Lire et parser le JSON
  console.log(`📖 Lecture du fichier: ${jsonPath}`);
  const jsonContent = fs.readFileSync(jsonPath, 'utf8');
  const parsedJson = JSON.parse(jsonContent);

  // Vérifier que c'est bien un service account Firebase
  if (parsedJson.type !== 'service_account') {
    console.error('❌ Erreur: Ce fichier ne semble pas être un fichier de service account Firebase');
    console.error('   Assurez-vous de télécharger le bon fichier depuis Firebase Console > Project Settings > Service Accounts');
    process.exit(1);
  }

  // Minifier le JSON (sur une seule ligne)
  const minified = JSON.stringify(parsedJson);

  console.log('\n✅ Fichier JSON validé avec succès!');
  console.log(`   Project ID: ${parsedJson.project_id}`);
  console.log(`   Client Email: ${parsedJson.client_email}`);

  console.log('\n📋 Ajoutez cette ligne dans votre fichier .env :\n');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`FIREBASE_SERVICE_ACCOUNT=${minified}`);
  console.log('─────────────────────────────────────────────────────────────');

  console.log('\n💡 Conseil: Copiez la ligne ci-dessus et collez-la dans votre fichier .env');
  console.log('⚠️  Important: Ne committez JAMAIS ce fichier .env dans git!\n');

} catch (error) {
  console.error('❌ Erreur lors du traitement du fichier:', error.message);
  process.exit(1);
}
