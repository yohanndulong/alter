import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const buildGradlePath = join(__dirname, '..', 'android', 'app', 'build.gradle');

try {
  // Lire le fichier build.gradle
  let content = readFileSync(buildGradlePath, 'utf8');

  // Trouver et incrémenter versionCode
  const versionCodeRegex = /versionCode\s+(\d+)/;
  const codeMatch = content.match(versionCodeRegex);

  if (!codeMatch) {
    console.error('❌ versionCode not found in build.gradle');
    process.exit(1);
  }

  const currentCode = parseInt(codeMatch[1]);
  const newCode = currentCode + 1;

  // Remplacer versionCode
  content = content.replace(versionCodeRegex, `versionCode ${newCode}`);

  // Trouver et incrémenter versionName (format: MAJOR.MINOR.PATCH)
  const versionNameRegex = /versionName\s+"(\d+)\.(\d+)\.(\d+)"/;
  const nameMatch = content.match(versionNameRegex);

  if (!nameMatch) {
    console.error('❌ versionName not found in build.gradle (expected format: "X.Y.Z")');
    process.exit(1);
  }

  const major = nameMatch[1];
  const minor = nameMatch[2];
  const currentPatch = parseInt(nameMatch[3]);
  const newPatch = currentPatch + 1;

  const currentName = `${major}.${minor}.${currentPatch}`;
  const newName = `${major}.${minor}.${newPatch}`;

  // Remplacer versionName
  content = content.replace(versionNameRegex, `versionName "${newName}"`);

  // Écrire le fichier
  writeFileSync(buildGradlePath, content, 'utf8');

  console.log(`✅ versionCode: ${currentCode} → ${newCode}`);
  console.log(`✅ versionName: ${currentName} → ${newName}`);
  process.exit(0);
} catch (error) {
  console.error('❌ Error incrementing version:', error.message);
  process.exit(1);
}
