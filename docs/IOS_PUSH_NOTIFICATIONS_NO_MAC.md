# Configuration des Notifications Push sur iOS SANS MAC ✅

Ce guide explique comment les notifications push ont été configurées pour iOS **sans avoir besoin de Mac ou Xcode**.

## ✅ Configuration automatique déjà effectuée

Tous les fichiers nécessaires ont été modifiés automatiquement. Vous n'avez **rien à faire côté code** !

### Fichiers modifiés automatiquement :

#### 1. **`app/ios/App/App/Info.plist`** ✅
Ajout des Background Modes pour les notifications :
```xml
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
    <string>fetch</string>
</array>
```

#### 2. **`app/ios/App/App/App.entitlements`** ✅ (créé)
Fichier de capabilities pour activer les push notifications :
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>aps-environment</key>
    <string>development</string>
</dict>
</plist>
```

#### 3. **`app/ios/App/App.xcodeproj/project.pbxproj`** ✅
Modifications apportées :
- Ajout de la référence au fichier `App.entitlements`
- Configuration de `CODE_SIGN_ENTITLEMENTS` dans Debug et Release
- Ajout du fichier dans les ressources du build

#### 4. **`app/ios/App/Podfile`** ✅
Ajout de Firebase Messaging :
```ruby
pod 'Firebase/Messaging'
```

#### 5. **`app/ios/App/App/AppDelegate.swift`** ✅
Implémentation complète :
- Configuration Firebase
- Enregistrement APNs
- Delegates pour gérer les notifications
- Gestion des tokens FCM

#### 6. **`app/capacitor.config.ts`** ✅
Configuration Capacitor pour les notifications

## 🎯 Ce qu'il vous reste à faire (SANS MAC)

### Étape 1 : Créer un certificat APNs sur Apple Developer

Vous pouvez faire tout ça depuis n'importe quel ordinateur (Windows, Linux, Mac) via le navigateur web.

#### Option A : APNs Authentication Key (Recommandé) 🌟

C'est la méthode la plus simple et ne nécessite **aucun Mac**.

1. Allez sur [Apple Developer Portal](https://developer.apple.com/account/)
2. Connectez-vous avec votre compte Apple Developer
3. Naviguez vers **Certificates, Identifiers & Profiles** → **Keys**
4. Cliquez sur le bouton **+** pour créer une nouvelle clé
5. Configurez :
   - **Key Name** : `Alter APNs Key`
   - Cochez **✅ Apple Push Notifications service (APNs)**
6. Cliquez sur **Continue** puis **Register**
7. **⚠️ IMPORTANT** : Téléchargez le fichier `.p8` (vous ne pourrez le faire qu'une seule fois !)
8. Notez bien :
   - **Key ID** : affiché sur la page (ex: `ABC123DEF4`)
   - **Team ID** : dans le menu "Membership" de votre compte (ex: `XYZ9876543`)

### Étape 2 : Configuration Firebase (SANS MAC)

#### 2.1 Créer/Configurer l'app iOS dans Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Cliquez sur l'icône ⚙️ **Project Settings**
4. Dans l'onglet **General**, descendez jusqu'à "Your apps"
5. Si l'app iOS n'existe pas encore :
   - Cliquez sur **Add app** → iOS (icône Apple 🍎)
   - **iOS bundle ID** : `com.alterdating.alter`
   - **App nickname** : `Alter iOS`
   - Cliquez sur **Register app**
6. Téléchargez **GoogleService-Info.plist**

#### 2.2 Ajouter GoogleService-Info.plist au projet

**Sur Windows/Linux (SANS XCODE)** :

1. Téléchargez `GoogleService-Info.plist` depuis Firebase Console
2. Copiez le fichier dans le dossier :
   ```
   app/ios/App/App/GoogleService-Info.plist
   ```
3. C'est tout ! Le fichier sera automatiquement inclus lors du build

#### 2.3 Uploader le certificat APNs dans Firebase

1. Dans Firebase Console → **Project Settings** ⚙️
2. Onglet **Cloud Messaging**
3. Section **iOS app configuration**
4. Cliquez sur **Upload** sous "APNs Authentication Key"
5. Sélectionnez votre fichier `.p8` téléchargé à l'étape 1
6. Entrez :
   - **Key ID** : (noté à l'étape 1)
   - **Team ID** : (noté à l'étape 1)
7. Cliquez sur **Upload**

### Étape 3 : Installer les dépendances iOS (PEUT SE FAIRE SANS MAC)

Si vous avez accès à un Mac (ou utilisez un service cloud) :

```bash
cd app/ios/App
pod install
```

**Alternative sans Mac** : Ces commandes seront exécutées automatiquement lors du build sur un service CI/CD comme :
- GitHub Actions
- GitLab CI
- Bitrise
- Codemagic (recommandé pour iOS)

### Étape 4 : Build de l'application (SANS MAC AVEC CI/CD)

#### Option A : Codemagic (Recommandé pour iOS sans Mac)

1. Créez un compte sur [Codemagic](https://codemagic.io/)
2. Connectez votre repository Git
3. Configurez le workflow :
   - Platform : iOS
   - Build type : Release
   - Certificats : Uploadez vos certificats de signature iOS
4. Lancez le build
5. Codemagic va :
   - Installer les dépendances (`pod install`)
   - Builder l'app
   - Générer l'IPA
   - (Optionnel) Publier sur TestFlight

#### Option B : GitHub Actions / GitLab CI

Exemple de workflow GitHub Actions (`.github/workflows/ios-build.yml`) :

```yaml
name: iOS Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: macos-latest

    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: |
          cd app
          npm install
          cd ios/App
          pod install

      - name: Build iOS
        run: |
          cd app
          npx cap sync ios
          xcodebuild -workspace ios/App/App.xcworkspace \
                     -scheme App \
                     -configuration Release \
                     archive
```

### Étape 5 : Tester les notifications

#### Sur un appareil physique (obligatoire pour les notifications push)

1. Installez l'app sur un iPhone/iPad physique
2. Connectez l'appareil à votre ordinateur
3. Dans les logs de l'appareil, cherchez :
   ```
   ✅ Notification permission granted
   📱 APNs device token registered
   📲 Firebase FCM token: [votre-token]
   ```

#### Envoyer une notification de test depuis Firebase

1. Firebase Console → **Cloud Messaging**
2. Cliquez sur **Send your first message**
3. Entrez un titre et message
4. Cliquez sur **Send test message**
5. Collez le FCM token des logs
6. Cliquez sur **Test**

Si tout fonctionne, vous devriez recevoir la notification sur l'appareil ! 🎉

## 🔧 Configuration backend (déjà faite)

Le backend est déjà configuré pour envoyer 3 types de notifications :

### 1. Nouveau Like 💖
```json
{
  "title": "Quelqu'un vous aime ! 💖",
  "body": "[Nom] vous a liké !",
  "data": {
    "type": "new_like"
  }
}
```

### 2. Nouveau Match 💕
```json
{
  "title": "Nouveau match ! 💕",
  "body": "Vous avez matché avec [Nom] !",
  "data": {
    "type": "new_match",
    "matchId": "xxx"
  }
}
```

### 3. Nouveau Message 💬
```json
{
  "title": "Nouveau message de [Nom]",
  "body": "[Contenu du message]",
  "data": {
    "type": "new_message",
    "matchId": "xxx"
  }
}
```

## ⚠️ Important : Variable d'environnement backend

Assurez-vous que le backend a la variable Firebase configurée :

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
```

Le contenu complet se trouve dans :
Firebase Console → **Project Settings** → **Service Accounts** → **Generate new private key**

## 📋 Checklist finale

- [x] ✅ `Info.plist` modifié (Background Modes)
- [x] ✅ `App.entitlements` créé (Push Notifications capability)
- [x] ✅ `project.pbxproj` modifié (Référence aux entitlements)
- [x] ✅ `Podfile` modifié (Firebase/Messaging)
- [x] ✅ `AppDelegate.swift` modifié (Configuration Firebase)
- [x] ✅ `capacitor.config.ts` modifié (Configuration notifications)
- [ ] ⏳ Créer APNs Key sur Apple Developer Portal
- [ ] ⏳ Télécharger `GoogleService-Info.plist` et le placer dans `app/ios/App/App/`
- [ ] ⏳ Uploader APNs Key dans Firebase Console
- [ ] ⏳ Configurer CI/CD pour build iOS (si pas de Mac)
- [ ] ⏳ Tester sur appareil physique

## 🎓 Ressources utiles

- [Apple Developer Portal](https://developer.apple.com/account/)
- [Firebase Console](https://console.firebase.google.com/)
- [Codemagic Documentation](https://docs.codemagic.io/yaml-quick-start/building-a-react-native-app/)
- [GitHub Actions macOS runners](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners)
- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)

## 🚀 Alternatives de build sans Mac

### Services Cloud recommandés :

1. **Codemagic** ⭐ (Recommandé)
   - Gratuit pour projets open source
   - Support natif Capacitor/Ionic
   - Configuration simple via interface web

2. **GitHub Actions**
   - Runners macOS gratuits (avec limits)
   - Bon pour CI/CD automatique

3. **Bitrise**
   - Interface intuitive
   - Templates pour React Native/Capacitor

4. **AppCenter** (Microsoft)
   - Build iOS dans le cloud
   - Distribution TestFlight intégrée

---

**Conclusion** : Vous pouvez configurer et builder une app iOS avec notifications push **SANS avoir de Mac**, grâce aux services cloud CI/CD ! 🎉

**Dernière mise à jour** : Janvier 2025
