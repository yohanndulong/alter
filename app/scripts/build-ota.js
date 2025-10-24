import { readFileSync, writeFileSync, createWriteStream, existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import archiver from 'archiver';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger le .env.android si disponible, sinon .env par défaut
const envPath = join(__dirname, '..', '.env.android');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('📋 Loaded environment from .env.android');
} else {
  dotenv.config();
  console.log('📋 Loaded environment from .env');
}

const projectRoot = join(__dirname, '..');
const distPath = join(projectRoot, 'dist');
const otaPath = join(projectRoot, 'ota');
const distUpdatesPath = join(distPath, 'updates');
const packageJsonPath = join(projectRoot, 'package.json');

// Créer les dossiers s'ils n'existent pas
if (!existsSync(otaPath)) {
  mkdirSync(otaPath, { recursive: true });
}
if (!existsSync(distUpdatesPath)) {
  mkdirSync(distUpdatesPath, { recursive: true });
}

// Obtenir le commit SHA
const getCommitSha = () => {
  // Railway fournit automatiquement cette variable
  if (process.env.RAILWAY_GIT_COMMIT_SHA) {
    return process.env.RAILWAY_GIT_COMMIT_SHA.substring(0, 7);
  }

  // Sinon, utiliser git localement
  try {
    const sha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    return sha.substring(0, 7);
  } catch (error) {
    console.warn('⚠️  Could not get git commit SHA, using timestamp instead');
    return Date.now().toString(36); // Fallback: timestamp en base36
  }
};

// Lire la version du package.json
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const baseVersion = packageJson.version;
const commitSha = getCommitSha();
const version = `${baseVersion}-${commitSha}`;

const zipPath = join(otaPath, `app-${version}.zip`);
const versionJsonPath = join(otaPath, 'version.json');

console.log(`📦 Creating OTA bundle for version ${version} (base: ${baseVersion}, commit: ${commitSha})...`);

// Créer le ZIP
const output = createWriteStream(zipPath);
const archive = archiver('zip', {
  zlib: { level: 9 }
});

output.on('close', () => {
  const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
  console.log(`✅ Bundle created: ${zipPath} (${sizeInMB} MB)`);

  // Créer le fichier version.json
  // Railway fournit RAILWAY_PUBLIC_DOMAIN automatiquement
  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null;
  const baseUrl = process.env.VITE_APP_URL || railwayDomain || 'https://your-domain.com';

  const versionManifest = {
    version: version,
    url: `${baseUrl}/updates/app-${version}.zip`,
    notes: `Version ${version} - OTA Update`,
    timestamp: new Date().toISOString()
  };

  writeFileSync(versionJsonPath, JSON.stringify(versionManifest, null, 2));
  console.log(`✅ Version manifest created: ${versionJsonPath}`);

  // Copier dans dist/updates/ pour Railway/web
  const distZipPath = join(distUpdatesPath, `app-${version}.zip`);
  const distVersionJsonPath = join(distUpdatesPath, 'version.json');

  copyFileSync(zipPath, distZipPath);
  copyFileSync(versionJsonPath, distVersionJsonPath);

  console.log(`✅ Copied to dist/updates/ for web deployment`);
  console.log('');
  console.log('📤 Deployment options:');
  console.log('');
  console.log('🌐 Web (Railway):');
  console.log(`   - Updates will be served at ${baseUrl}/updates/version.json`);
  console.log(`   - No manual upload needed, git push will deploy`);
  console.log(`   - Version: ${version} (commit: ${commitSha})`);
  console.log('');
  console.log('📱 Mobile (Manual upload):');
  console.log(`   1. Upload ${zipPath} to your CDN/S3`);
  console.log(`   2. Upload ${versionJsonPath} to your CDN/S3`);
  console.log(`   3. Update VITE_UPDATE_URL in mobile .env`);
  console.log('');
  console.log(`Version manifest:`);
  console.log(JSON.stringify(versionManifest, null, 2));
});

archive.on('error', (err) => {
  console.error('❌ Error creating bundle:', err);
  process.exit(1);
});

archive.pipe(output);

// Ajouter tous les fichiers du dossier dist
archive.directory(distPath, false);

archive.finalize();
