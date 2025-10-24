# Mises à jour OTA (Over-The-Air) - Self-Hosted

Ce guide explique comment déployer des mises à jour OTA self-hosted pour votre application Alter.

## 📋 Vue d'ensemble

Le système OTA permet de mettre à jour le code web de l'application **sans passer par le Play Store**. C'est idéal pour :
- ✅ Corrections de bugs urgentes
- ✅ Mises à jour de contenu
- ✅ Nouvelles fonctionnalités (qui ne nécessitent pas de changement natif)
- ✅ Déploiement instantané

**Important** : Les mises à jour OTA ne peuvent PAS modifier :
- ❌ Le code natif (Java/Kotlin)
- ❌ Les plugins Capacitor
- ❌ Les permissions Android
- ❌ Les configurations natives

Pour ces changements, vous devez publier une nouvelle version sur le Play Store.

## 🛠️ Configuration

### 1. Variables d'environnement

Créez un fichier `.env.production` :

\`\`\`bash
# URL vers votre fichier version.json
VITE_UPDATE_URL=https://your-domain.com/updates/version.json
\`\`\`

Pour staging, créez `.env.staging` :

\`\`\`bash
VITE_UPDATE_URL=https://staging.your-domain.com/updates/version.json
\`\`\`

### 2. Hébergement des mises à jour

Vous avez besoin d'un serveur web pour héberger :
- `version.json` - Le manifest décrivant la dernière version
- `app-X.Y.Z.zip` - Les bundles de mise à jour

**Options d'hébergement** :
- **AWS S3** + CloudFront (recommandé)
- **Firebase Hosting**
- **GitHub Pages** (pour les tests)
- **Votre propre serveur** (nginx, Apache, etc.)

## 📦 Créer une mise à jour OTA

### 1. Construire le bundle OTA

\`\`\`bash
# Production
npm run ota:build

# Staging
npm run ota:build:staging
\`\`\`

Cela va :
1. ✅ Construire le code TypeScript et Vite
2. ✅ Créer un ZIP du dossier \`dist/\`
3. ✅ Générer un fichier \`version.json\`

Les fichiers sont créés dans le dossier \`ota/\` :
- \`ota/app-1.0.0.zip\` - Le bundle de mise à jour
- \`ota/version.json\` - Le manifest de version

### 2. Uploader sur votre serveur

#### Option A : AWS S3

\`\`\`bash
# Installer AWS CLI
# https://aws.amazon.com/cli/

# Configurer vos credentials
aws configure

# Upload des fichiers
aws s3 cp ota/app-1.0.0.zip s3://your-bucket/updates/
aws s3 cp ota/version.json s3://your-bucket/updates/

# Rendre les fichiers publics
aws s3api put-object-acl --bucket your-bucket --key updates/app-1.0.0.zip --acl public-read
aws s3api put-object-acl --bucket your-bucket --key updates/version.json --acl public-read
\`\`\`

#### Option B : Firebase Hosting

\`\`\`bash
# Installer Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialiser (si pas déjà fait)
firebase init hosting

# Créer un dossier public/updates/
mkdir -p public/updates

# Copier les fichiers
cp ota/app-1.0.0.zip public/updates/
cp ota/version.json public/updates/

# Déployer
firebase deploy --only hosting
\`\`\`

#### Option C : Serveur manuel (nginx)

\`\`\`bash
# Via SCP ou FTP, uploader vers /var/www/html/updates/
scp ota/app-1.0.0.zip user@your-server:/var/www/html/updates/
scp ota/version.json user@your-server:/var/www/html/updates/
\`\`\`

Configuration nginx :

\`\`\`nginx
server {
    listen 80;
    server_name your-domain.com;

    location /updates/ {
        root /var/www/html;

        # CORS headers pour permettre l'accès depuis l'app
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, OPTIONS';

        # Cache control
        expires 1h;
    }
}
\`\`\`

### 3. Vérifier le déploiement

Testez que les fichiers sont accessibles :

\`\`\`bash
# Tester le manifest
curl https://your-domain.com/updates/version.json

# Devrait retourner :
# {
#   "version": "1.0.0",
#   "url": "https://your-domain.com/updates/app-1.0.0.zip",
#   "notes": "Version 1.0.0 - OTA Update",
#   "timestamp": "2025-01-XX..."
# }
\`\`\`

## 🚀 Workflow de déploiement

### Scénario 1 : Déploiement simple

\`\`\`bash
# 1. Mettre à jour la version dans package.json
npm version patch  # 1.0.0 → 1.0.1

# 2. Construire le bundle OTA
npm run ota:build

# 3. Uploader sur le serveur
# (voir options ci-dessus)

# 4. L'app vérifiera automatiquement toutes les heures
#    et téléchargera la mise à jour
\`\`\`

### Scénario 2 : Déploiement avec Play Store

Si vous avez aussi des changements natifs :

\`\`\`bash
# 1. Mettre à jour la version
npm version minor  # 1.0.0 → 1.1.0

# 2. Build OTA ET Play Store
npm run ota:build
npm run android:bundle

# 3. Upload OTA sur serveur
# (voir options ci-dessus)

# 4. Upload AAB sur Play Store
# (manuel via Play Console)
\`\`\`

Les utilisateurs recevront :
- La mise à jour OTA immédiatement (code web)
- La mise à jour Play Store quelques heures plus tard (après validation)

## 🔄 Fonctionnement

### Vérification des mises à jour

L'app vérifie les mises à jour :
- ✅ Au démarrage de l'application
- ✅ Toutes les heures en arrière-plan
- ✅ Uniquement sur les plateformes natives (pas en dev web)

### Processus de mise à jour

1. L'app télécharge \`version.json\`
2. Compare la version avec celle installée
3. Si nouvelle version disponible :
   - Télécharge le ZIP en arrière-plan
   - Extrait et valide le bundle
   - Configure comme version suivante
   - Applique au prochain redémarrage de l'app

### Rollback automatique

Si une mise à jour échoue :
- ✅ L'app revient automatiquement à la version précédente
- ✅ Aucune action manuelle requise
- ✅ L'utilisateur ne voit rien

## 🧪 Tests

### Tester en local

1. Construisez le bundle :
\`\`\`bash
npm run ota:build
\`\`\`

2. Servez les fichiers localement :
\`\`\`bash
# Installer http-server
npm install -g http-server

# Servir le dossier ota/
cd ota
http-server --cors -p 8080
\`\`\`

3. Configurez \`.env\` :
\`\`\`bash
VITE_UPDATE_URL=http://YOUR_LOCAL_IP:8080/version.json
\`\`\`

4. Rebuilder et tester sur device :
\`\`\`bash
npm run android:build
\`\`\`

### Tester le comportement

Vous pouvez modifier le fichier \`version.json\` pour simuler des mises à jour :

\`\`\`json
{
  "version": "1.0.1",  // Changez cette version
  "url": "http://YOUR_LOCAL_IP:8080/app-1.0.0.zip",
  "notes": "Test update",
  "timestamp": "2025-01-15T10:00:00Z"
}
\`\`\`

## 📊 Monitoring

### Logs

L'app log toutes les activités OTA dans la console :

\`\`\`
✅ App is up to date
📥 New version available: 1.0.1 (current: 1.0.0)
📦 Update downloaded: 1.0.1
🔄 Update will be applied on next restart
\`\`\`

### Analytics

Pour suivre les mises à jour, vous pouvez ajouter du tracking dans \`useAppUpdater.ts\` :

\`\`\`typescript
// Après téléchargement réussi
await CapacitorUpdater.set({ version: downloadedVersion })

// Tracker l'événement
analytics.track('ota_update_downloaded', {
  from_version: currentVersion,
  to_version: downloadedVersion,
})
\`\`\`

## 🔒 Sécurité

### HTTPS obligatoire

⚠️ **Important** : Utilisez TOUJOURS HTTPS pour héberger vos mises à jour.

### Signature des bundles (optionnel)

Pour plus de sécurité, vous pouvez signer vos bundles :

1. Générer une paire de clés
2. Signer le ZIP avec votre clé privée
3. Vérifier la signature dans l'app avant d'appliquer

Référence : [Capgo Documentation](https://capgo.app/docs/plugin/self-hosted)

## 🚨 Troubleshooting

### L'app ne vérifie pas les mises à jour

- Vérifiez que \`VITE_UPDATE_URL\` est défini
- Vérifiez que l'app tourne sur un device (pas en web)
- Vérifiez les logs de la console

### Le téléchargement échoue

- Vérifiez que le ZIP est accessible publiquement
- Vérifiez les headers CORS sur votre serveur
- Vérifiez la taille du fichier (max 50MB recommandé)

### L'app ne s'update pas

- L'update sera appliquée au **prochain redémarrage**
- Forcez un redémarrage de l'app pour tester
- Vérifiez que la version dans package.json est différente

## 📝 Checklist de déploiement

Avant chaque déploiement OTA :

- [ ] Tester localement les changements
- [ ] Mettre à jour la version dans \`package.json\`
- [ ] Construire le bundle OTA : \`npm run ota:build\`
- [ ] Vérifier le contenu du ZIP généré
- [ ] Uploader sur le serveur
- [ ] Vérifier que \`version.json\` est accessible
- [ ] Tester le téléchargement sur un device
- [ ] Monitorer les logs après déploiement

## 🔗 Ressources

- [Capgo Documentation](https://capgo.app/docs/)
- [Capacitor Updater Plugin](https://github.com/Cap-go/capacitor-updater)
- [Self-Hosted Guide](https://capgo.app/docs/plugin/self-hosted)
