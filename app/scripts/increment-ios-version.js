import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectPath = join(__dirname, '..', 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');

try {
  // Lire le fichier project.pbxproj
  let content = readFileSync(projectPath, 'utf8');

  // Trouver et incrémenter CURRENT_PROJECT_VERSION (build number)
  const buildNumberRegex = /CURRENT_PROJECT_VERSION = (\d+);/g;
  const matches = [...content.matchAll(buildNumberRegex)];

  if (matches.length === 0) {
    console.error('❌ CURRENT_PROJECT_VERSION not found in project.pbxproj');
    process.exit(1);
  }

  // Récupérer le build number actuel
  const currentBuildNumber = parseInt(matches[0][1]);
  const newBuildNumber = currentBuildNumber + 1;

  // Remplacer tous les CURRENT_PROJECT_VERSION
  content = content.replace(buildNumberRegex, `CURRENT_PROJECT_VERSION = ${newBuildNumber};`);

  // Optionnel: incrémenter aussi MARKETING_VERSION (version affichée)
  // Format: MAJOR.MINOR ou MAJOR.MINOR.PATCH
  const marketingVersionRegex = /MARKETING_VERSION = ([\d.]+);/g;
  const versionMatches = [...content.matchAll(marketingVersionRegex)];

  if (versionMatches.length > 0) {
    const currentVersion = versionMatches[0][1];
    const versionParts = currentVersion.split('.');

    // Incrémenter le dernier chiffre (patch)
    if (versionParts.length === 2) {
      // Format MAJOR.MINOR -> incrémenter MINOR
      const major = versionParts[0];
      const minor = parseInt(versionParts[1]);
      const newVersion = `${major}.${minor + 1}`;
      content = content.replace(marketingVersionRegex, `MARKETING_VERSION = ${newVersion};`);
      console.log(`✅ MARKETING_VERSION: ${currentVersion} → ${newVersion}`);
    } else if (versionParts.length === 3) {
      // Format MAJOR.MINOR.PATCH -> incrémenter PATCH
      const major = versionParts[0];
      const minor = versionParts[1];
      const patch = parseInt(versionParts[2]);
      const newVersion = `${major}.${minor}.${patch + 1}`;
      content = content.replace(marketingVersionRegex, `MARKETING_VERSION = ${newVersion};`);
      console.log(`✅ MARKETING_VERSION: ${currentVersion} → ${newVersion}`);
    }
  }

  // Écrire le fichier
  writeFileSync(projectPath, content, 'utf8');

  console.log(`✅ CURRENT_PROJECT_VERSION (Build Number): ${currentBuildNumber} → ${newBuildNumber}`);
  console.log('✅ iOS version incremented successfully');
  process.exit(0);
} catch (error) {
  console.error('❌ Error incrementing iOS version:', error.message);
  process.exit(1);
}
