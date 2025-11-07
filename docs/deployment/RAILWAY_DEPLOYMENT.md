# Déploiement sur Railway avec OTA

Ce guide explique comment configurer le déploiement automatique sur Railway avec les mises à jour OTA intégrées.

## 🚂 Configuration Railway

### 1. Variables d'environnement

Dans Railway, configure ces variables :

```bash
# URL de base de l'app (fournie par Railway)
VITE_APP_URL=https://your-app.railway.app

# URL de l'API backend
VITE_API_URL=https://api.your-domain.com

# Activer/désactiver les mocks
VITE_ENABLE_MOCKS=false

# URL des mises à jour OTA (sera automatiquement VITE_APP_URL/updates/version.json)
VITE_UPDATE_URL=${{RAILWAY_PUBLIC_DOMAIN}}/updates/version.json
```

### 2. Configuration du build

Railway détecte automatiquement les commandes :

**Build Command** (automatique via package.json) :
```bash
npm run build
```

Cette commande fait :
1. ✅ Compile TypeScript
2. ✅ Build Vite (dist/)
3. ✅ **Génère automatiquement le bundle OTA dans dist/updates/**

**Start Command** :
```bash
npm run preview
```

### 3. Déploiement

Railway se déploie automatiquement à chaque push sur la branche configurée :

```bash
git add .
git commit -m "New version"
git push
```

Railway va :
1. Détecter le push
2. Lancer `npm install`
3. Lancer `npm run build` (qui génère dist/ + dist/updates/)
4. Servir le tout

## 📦 Structure après build

Après `npm run build`, voici ce qui est généré :

```
dist/
├── index.html
├── assets/
│   ├── index-XXX.js
│   └── index-XXX.css
└── updates/              # ← OTA bundles pour l'app mobile
    ├── app-1.0.0.zip
    └── version.json
```

Railway servira automatiquement :
- `https://your-app.railway.app/` → L'application web
- `https://your-app.railway.app/updates/version.json` → Manifest OTA
- `https://your-app.railway.app/updates/app-1.0.0.zip` → Bundle OTA

## 📱 Configuration mobile

Dans l'app mobile (fichier `.env` ou `.env.production`) :

```bash
VITE_UPDATE_URL=https://your-app.railway.app/updates/version.json
```

L'app mobile téléchargera automatiquement les mises à jour depuis Railway !

## 🔄 Workflow de mise à jour

### Scénario 1 : Mise à jour web + mobile OTA

```bash
# 1. Faire tes changements
# 2. Commit et push
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push

# Railway déploie automatiquement :
# ✅ Web mis à jour immédiatement
# ✅ OTA bundle généré et disponible
# ✅ Les apps mobiles se mettront à jour au prochain check
```

### Scénario 2 : Mise à jour web + mobile + Play Store

```bash
# 1. Incrémenter la version
npm version patch  # 1.0.0 → 1.0.1

# 2. Build pour Android
npm run release

# 3. Commit et push (déploie web + OTA)
git add .
git commit -m "chore: version 1.0.1"
git push

# 4. Upload AAB sur Play Console (manuel)
# android/app/build/outputs/bundle/release/app-release.aab
```

Les utilisateurs recevront :
- ✅ Web : Mise à jour immédiate
- ✅ Mobile OTA : Mise à jour en quelques minutes/heures
- ✅ Play Store : Mise à jour après validation (quelques heures)

## 🎯 Avantages de cette approche

### Pour le web (Railway)
- ✅ **Déploiement automatique** à chaque push
- ✅ **Pas de configuration manuelle** des bundles OTA
- ✅ **Un seul build** génère tout

### Pour le mobile
- ✅ **Mises à jour OTA gratuites** hébergées sur Railway
- ✅ **Pas besoin de CDN séparé** pour les petites apps
- ✅ **URL cohérente** avec l'app web

### En général
- ✅ **Un seul repository** pour web + mobile
- ✅ **Un seul déploiement** met à jour tout
- ✅ **Version synchronisée** entre web et mobile

## 🔒 Sécurité et performance

### HTTPS
Railway utilise automatiquement HTTPS, donc les mises à jour OTA sont sécurisées ✅

### Taille des bundles
Les bundles OTA sont typiquement **2-5 MB**. Railway gère bien cette charge pour les petites/moyennes apps.

Si ton app grossit, considère :
- Utiliser un CDN (Cloudflare, AWS CloudFront)
- Héberger les bundles sur S3/Firebase Storage
- Garder juste `version.json` sur Railway

### Cache
Railway met automatiquement en cache les assets statiques. Les clients ne téléchargeront que si `version.json` change.

## 🧪 Tester localement

### Simuler le déploiement Railway

```bash
# 1. Build comme Railway
npm run build

# 2. Preview comme Railway
npm run preview

# 3. Tester l'accès aux updates
# Ouvre http://localhost:4173/updates/version.json
```

### Tester l'OTA mobile en local

```bash
# 1. Get ton IP local
ipconfig  # Windows
ifconfig  # Mac/Linux

# 2. Mettre à jour .env de l'app mobile
VITE_UPDATE_URL=http://192.168.X.X:4173/updates/version.json

# 3. Rebuild l'app mobile
npm run android:build

# 4. Tester sur un vrai device (même WiFi)
```

## 📊 Monitoring

### Vérifier qu'une mise à jour est disponible

```bash
curl https://your-app.railway.app/updates/version.json
```

Devrait retourner :
```json
{
  "version": "1.0.0",
  "url": "https://your-app.railway.app/updates/app-1.0.0.zip",
  "notes": "Version 1.0.0 - OTA Update",
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

### Logs Railway

Railway affiche les logs du build :
- Cherche "✅ Bundle created"
- Cherche "✅ Copied to dist/updates/"

## 🚨 Troubleshooting

### Le dossier updates/ n'existe pas après déploiement

**Cause** : Le build a échoué ou le script OTA n'a pas tourné

**Solution** :
1. Vérifier les logs Railway
2. S'assurer que `package.json` contient `"build": "tsc && vite build && node scripts/build-ota.js"`

### L'app mobile ne trouve pas version.json

**Cause** : URL incorrecte ou CORS

**Solution** :
1. Vérifier `VITE_UPDATE_URL` dans l'app mobile
2. Tester l'URL dans un navigateur
3. Railway autorise CORS par défaut pour les assets statiques

### Les updates ne se téléchargent pas

**Cause** : Version identique ou erreur réseau

**Solution** :
1. Vérifier que la version dans `version.json` est > version installée
2. Vérifier les logs de l'app mobile (console)
3. Forcer un redémarrage de l'app

## 📝 Checklist de déploiement

Avant chaque déploiement Railway :

- [ ] Version incrémentée dans `package.json` (si nouvelle version mobile)
- [ ] Tests passent localement
- [ ] Build local réussi : `npm run build`
- [ ] `dist/updates/version.json` existe
- [ ] Commit et push sur la branche principale
- [ ] Vérifier le déploiement Railway (dashboard)
- [ ] Tester `/updates/version.json` sur Railway
- [ ] Monitorer les logs pour erreurs

## 🔗 Ressources

- [Railway Docs](https://docs.railway.app/)
- [Vite Static Deploy](https://vitejs.dev/guide/static-deploy.html)
- [OTA Updates Guide](./OTA_UPDATES.md)
