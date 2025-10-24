# Guide de Déploiement iOS avec GitHub Actions

Ce guide explique comment déployer Alter sur TestFlight avec des environnements staging et production séparés.

## 📋 Prérequis

1. **Compte Apple Developer** ($99/an)
2. **Accès à un Mac** (pour la configuration initiale uniquement)
3. **Compte GitHub** avec accès au repo

## 🎯 Architecture des Environnements

### Staging (TestFlight)
- **Bundle ID**: `com.alter.dating.staging`
- **API URL**: Configurée dans `.env.staging`
- **Branche**: `develop`
- **Distribution**: TestFlight (testeurs internes)

### Production (App Store)
- **Bundle ID**: `com.alter.dating`
- **API URL**: API de production
- **Branche**: `main`
- **Distribution**: TestFlight → App Store

## 🔧 Configuration Initiale (À faire une seule fois)

### Étape 1 : Configuration Apple Developer

1. **Créer les App IDs**:
   - Va sur [Apple Developer](https://developer.apple.com/account/resources/identifiers/list)
   - Crée 2 App IDs :
     - `com.alter.dating` (Production)
     - `com.alter.dating.staging` (Staging)

2. **Activer les capabilities**:
   - ✅ Push Notifications
   - ✅ Sign in with Apple

3. **Créer les apps dans App Store Connect**:
   - Va sur [App Store Connect](https://appstoreconnect.apple.com/)
   - Crée 2 apps avec les Bundle IDs correspondants

### Étape 2 : Configuration Xcode (Sur Mac)

1. **Ouvrir le projet**:
   ```bash
   cd ios/App
   open App.xcworkspace
   ```

2. **Créer le Scheme Staging**:
   - Dans Xcode : Product → Scheme → Manage Schemes
   - Dupliquer le scheme "App" → Renommer en "Staging"
   - Dans Build Settings du target :
     - Dupliquer le target "App" → "Staging"
     - Changer le Bundle Identifier en `com.alter.dating.staging`
     - Changer le Product Name en "Alter Staging"

3. **Configurer les Build Configurations**:
   - Créer 2 configurations : Debug-Staging, Release-Staging
   - Associer les schemes aux bonnes configurations

### Étape 3 : Configuration Fastlane Match

Fastlane Match gère les certificats de signature de manière sécurisée.

1. **Créer un repo privé pour les certificats**:
   ```bash
   # Sur GitHub, créer un repo privé "alter-ios-certificates"
   ```

2. **Initialiser Fastlane Match**:
   ```bash
   cd ios/App
   fastlane match init
   # Choisir "git" comme storage
   # Entrer l'URL du repo de certificats
   ```

3. **Générer les certificats**:
   ```bash
   # Pour staging
   fastlane match appstore --app_identifier com.alter.dating.staging

   # Pour production
   fastlane match appstore --app_identifier com.alter.dating
   ```

### Étape 4 : Configuration des Secrets GitHub

Va dans Settings → Secrets and Variables → Actions et ajoute :

```bash
# Apple Developer Account
FASTLANE_USER=ton-email@apple.com
FASTLANE_PASSWORD=ton-mot-de-passe-apple
FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD=mot-de-passe-specifique

# Team IDs
TEAM_ID=XXXXXXXXXX  # Developer Portal Team ID
ITC_TEAM_ID=XXXXXXXXXX  # App Store Connect Team ID
APPLE_ID=1234567890  # App ID (numérique)

# Fastlane Match
MATCH_PASSWORD=mot-de-passe-fort-pour-chiffrer-certificats
MATCH_GIT_URL=https://github.com/ton-org/alter-ios-certificates.git

# GitHub Personal Access Token (pour accéder au repo des certificats)
MATCH_GIT_BASIC_AUTHORIZATION=base64-encoded-token
```

**Pour générer FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD** :
1. Va sur [appleid.apple.com](https://appleid.apple.com/)
2. Sécurité → Mots de passe spécifiques aux apps
3. Génère un nouveau mot de passe

**Pour trouver les Team IDs** :
- TEAM_ID : [Developer Portal](https://developer.apple.com/account) → Membership
- ITC_TEAM_ID : App Store Connect → Users and Access → Keys (en haut à droite)

## 🚀 Utilisation

### Déploiement Automatique

**Staging** (sur push vers `develop`) :
```bash
git push origin develop
# → Build automatique et upload vers TestFlight (Staging)
```

**Production** (sur push vers `main`) :
```bash
git push origin main
# → Build automatique et upload vers TestFlight (Production)
```

### Déploiement Manuel

Via GitHub Actions → Actions → iOS TestFlight Deployment → Run workflow

Choisis l'environnement :
- `staging` : Pour tester
- `production` : Pour release

### Déploiement Local (depuis un Mac)

**Staging** :
```bash
npm run build:ios:staging
cd ios/App
fastlane beta scheme:Staging
```

**Production** :
```bash
npm run build:ios
cd ios/App
fastlane release
```

## 📱 Tester sur TestFlight

1. Va sur [App Store Connect](https://appstoreconnect.apple.com/)
2. Sélectionne ton app (Staging ou Production)
3. TestFlight → Ajoute des testeurs internes
4. Une fois le build traité (~10-15 min), distribue-le aux testeurs

## 🔄 Différences entre Staging et Production

| Aspect | Staging | Production |
|--------|---------|------------|
| Bundle ID | `com.alter.dating.staging` | `com.alter.dating` |
| Nom d'app | "Alter Staging" | "Alter" |
| API URL | Staging API | Production API |
| Icône | Badge "STAGING" | Icône normale |
| Branche | `develop` | `main` |

## 🐛 Troubleshooting

### Erreur de certificat
```bash
cd ios/App
fastlane match nuke distribution  # ⚠️ Supprime tous les certificats
fastlane match appstore  # Régénère
```

### Build number déjà utilisé
Le workflow incrémente automatiquement. Si erreur :
```bash
cd ios/App
fastlane increment_build_number
```

### Échec d'upload vers TestFlight
- Vérifie que l'app existe dans App Store Connect
- Vérifie les secrets GitHub
- Regarde les logs détaillés dans Actions

## 📚 Ressources

- [Fastlane Documentation](https://docs.fastlane.tools/)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Apple Developer Portal](https://developer.apple.com/account/)
- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)

## 🔐 Sécurité

- ⚠️ Ne commit JAMAIS les certificats `.p12` ou `.mobileprovision`
- ⚠️ Ne commit JAMAIS les mots de passe
- ✅ Utilise Fastlane Match pour gérer les certificats
- ✅ Utilise GitHub Secrets pour les credentials
