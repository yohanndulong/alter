# Configuration des Notifications Push sur iOS

Ce guide explique comment configurer les notifications push pour l'application Alter sur iOS.

## Prérequis

- ✅ Compte Apple Developer actif
- ✅ Compte Firebase avec un projet configuré
- ✅ Mac avec Xcode installé
- ✅ Certificat de signature d'app iOS configuré

## Étape 1 : Configuration dans Xcode

### 1.1 Ouvrir le projet iOS

```bash
cd app
npm run ios:open
```

### 1.2 Ajouter les Capabilities

1. Dans Xcode, sélectionnez le projet **App** dans le navigateur de fichiers
2. Allez dans l'onglet **Signing & Capabilities**
3. Cliquez sur **+ Capability** en haut à gauche
4. Ajoutez les capabilities suivantes :

#### a) Push Notifications
- Recherchez et ajoutez **Push Notifications**

#### b) Background Modes
- Recherchez et ajoutez **Background Modes**
- Cochez les options suivantes :
  - ✅ Remote notifications
  - ✅ Background fetch

### 1.3 Vérifier le Bundle Identifier

Assurez-vous que le **Bundle Identifier** est bien `com.alterdating.alter`

## Étape 2 : Créer un certificat APNs (Apple Push Notification Service)

### Option A : APNs Authentication Key (Recommandé)

Cette méthode est plus simple et ne nécessite pas de renouvellement annuel.

1. Allez sur [Apple Developer Portal](https://developer.apple.com/account/)
2. Naviguez vers **Certificates, Identifiers & Profiles** → **Keys**
3. Cliquez sur le bouton **+** pour créer une nouvelle clé
4. Configurez la clé :
   - **Key Name** : `Alter APNs Key`
   - Cochez **Apple Push Notifications service (APNs)**
5. Cliquez sur **Continue** puis **Register**
6. Téléchargez le fichier `.p8` (⚠️ Important : vous ne pourrez le télécharger qu'une seule fois)
7. Notez les informations suivantes :
   - **Key ID** : affiché après la création
   - **Team ID** : disponible dans l'onglet Membership de votre compte développeur

### Option B : APNs Certificate (Alternative)

1. Allez sur [Apple Developer Portal](https://developer.apple.com/account/)
2. Naviguez vers **Certificates, Identifiers & Profiles** → **Certificates**
3. Créez un nouveau certificat **Apple Push Notification service SSL**
4. Sélectionnez votre App ID `com.alterdating.alter`
5. Générez un CSR (Certificate Signing Request) :
   - Ouvrez **Keychain Access** sur votre Mac
   - Menu **Keychain Access** → **Certificate Assistant** → **Request a Certificate From a Certificate Authority**
   - Remplissez avec votre email et nom
   - Sélectionnez **Saved to disk**
6. Uploadez le CSR sur le portail Apple
7. Téléchargez le certificat `.cer`
8. Double-cliquez sur le certificat pour l'installer dans Keychain Access

## Étape 3 : Configuration Firebase

### 3.1 Ajouter l'application iOS dans Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Cliquez sur l'icône ⚙️ **Project Settings**
4. Dans l'onglet **General**, descendez jusqu'à "Your apps"
5. Si l'app iOS n'existe pas, cliquez sur **Add app** → iOS (icône Apple)
6. Configurez :
   - **iOS bundle ID** : `com.alterdating.alter`
   - **App nickname** : `Alter iOS`
   - **App Store ID** : (optionnel, à ajouter après publication)
7. Cliquez sur **Register app**

### 3.2 Télécharger GoogleService-Info.plist

1. Après l'enregistrement de l'app, téléchargez le fichier **GoogleService-Info.plist**
2. Ouvrez Xcode (`npm run ios:open`)
3. Glissez-déposez `GoogleService-Info.plist` dans le dossier **App/App** dans le navigateur Xcode
4. Dans la popup, assurez-vous de :
   - ✅ Cocher **"Copy items if needed"**
   - ✅ Sélectionner **"Add to targets: App"**

### 3.3 Configurer APNs dans Firebase

1. Dans Firebase Console, allez dans **Project Settings** ⚙️
2. Sélectionnez l'onglet **Cloud Messaging**
3. Descendez jusqu'à **iOS app configuration**

#### Si vous utilisez une APNs Authentication Key (.p8) :

1. Cliquez sur **Upload** sous "APNs Authentication Key"
2. Uploadez votre fichier `.p8`
3. Entrez votre **Key ID**
4. Entrez votre **Team ID**
5. Cliquez sur **Upload**

#### Si vous utilisez un APNs Certificate (.cer) :

1. Exportez le certificat depuis Keychain Access :
   - Ouvrez Keychain Access
   - Trouvez votre certificat "Apple Push Services"
   - Clic droit → **Export**
   - Sauvegardez au format `.p12`
   - Définissez un mot de passe
2. Dans Firebase Console, uploadez le fichier `.p12`
3. Entrez le mot de passe
4. Choisissez **Development** ou **Production** selon votre environnement

## Étape 4 : Installation des dépendances

### 4.1 Installer les pods CocoaPods

Les fichiers sont déjà configurés. Il suffit d'installer les dépendances :

```bash
cd app/ios/App
pod install
```

### 4.2 Synchroniser le projet

```bash
cd app
npm run ios:sync
```

## Étape 5 : Fichiers déjà configurés ✅

Les fichiers suivants ont été mis à jour automatiquement :

### ✅ `app/ios/App/Podfile`
- Firebase/Messaging ajouté

### ✅ `app/ios/App/App/AppDelegate.swift`
- Import Firebase et FirebaseMessaging
- Configuration Firebase dans `didFinishLaunchingWithOptions`
- Delegates pour gérer les notifications
- Enregistrement APNs

### ✅ `app/capacitor.config.ts`
- Configuration des notifications push

### ✅ `app/src/services/notifications.ts`
- Service de gestion des notifications déjà implémenté
- Enregistrement automatique du token FCM
- Navigation automatique vers les bonnes pages

## Étape 6 : Tester les notifications

### 6.1 Build et lancer l'app

```bash
cd app
npm run ios:sync
npm run ios:open
```

Dans Xcode :
1. Sélectionnez un simulateur ou un appareil physique ⚠️ **Les notifications push ne fonctionnent que sur un appareil réel, pas sur simulateur**
2. Cliquez sur le bouton **Play** ▶️

### 6.2 Vérifier les logs

Dans la console Xcode, vous devriez voir :

```
✅ Notification permission granted
📱 APNs device token registered
📲 Firebase FCM token: [votre-token-fcm]
✅ Service de notifications initialisé
✅ Token FCM envoyé au backend
```

### 6.3 Envoyer une notification de test

Depuis Firebase Console :
1. Allez dans **Cloud Messaging**
2. Cliquez sur **Send your first message**
3. Entrez un titre et un message
4. Cliquez sur **Send test message**
5. Entrez le FCM token affiché dans les logs
6. Cliquez sur **Test**

## Étape 7 : Variables d'environnement backend

Assurez-vous que le backend a la variable d'environnement Firebase configurée :

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
```

Le contenu complet de cette variable se trouve dans le fichier de service account téléchargé depuis Firebase Console → **Project Settings** → **Service Accounts** → **Generate new private key**

## Problèmes courants

### ❌ "Failed to register for remote notifications"

**Solutions** :
- Vérifiez que vous testez sur un appareil physique (pas simulateur)
- Vérifiez que les capabilities Push Notifications sont activées dans Xcode
- Vérifiez que votre profil de provisioning inclut les push notifications

### ❌ "Firebase token not generated"

**Solutions** :
- Vérifiez que `GoogleService-Info.plist` est bien ajouté au projet
- Vérifiez que le certificat APNs est correctement configuré dans Firebase
- Vérifiez les logs Xcode pour des erreurs Firebase

### ❌ Notifications non reçues

**Solutions** :
- Vérifiez que le token FCM est bien envoyé au backend
- Vérifiez les logs du backend pour voir si la notification est envoyée
- Vérifiez que l'utilisateur a bien accepté les permissions de notification
- Vérifiez que l'app n'est pas en mode "Ne pas déranger"

### ❌ "No APNs token specified"

**Solutions** :
- Vérifiez que le certificat APNs est uploadé dans Firebase Console
- Vérifiez que l'app s'enregistre correctement aux notifications (`application.registerForRemoteNotifications()`)

## Types de notifications envoyées

L'application envoie 3 types de notifications :

### 1. Nouveau Like
- **Type** : `new_like`
- **Titre** : "Quelqu'un vous aime ! 💖"
- **Body** : "[Nom] vous a liké !"
- **Navigation** : Page Interested

### 2. Nouveau Match
- **Type** : `new_match`
- **Titre** : "Nouveau match ! 💕"
- **Body** : "Vous avez matché avec [Nom] !"
- **Data** : `matchId`
- **Navigation** : Page Matches

### 3. Nouveau Message
- **Type** : `new_message`
- **Titre** : "Nouveau message de [Nom]"
- **Body** : [Contenu du message (100 caractères max)]
- **Data** : `matchId`
- **Navigation** : Page Chat avec le match

## Code de navigation automatique

Le service de notifications gère automatiquement la navigation vers la bonne page lorsqu'une notification est tapée :

```typescript
// Dans app/src/services/notifications.ts
if (data.type === 'new_message' && data.matchId) {
  window.location.href = `/chat/${data.matchId}`
} else if (data.type === 'new_match' && data.matchId) {
  window.location.href = '/matches'
} else if (data.type === 'new_like') {
  window.location.href = '/interested'
}
```

## Ressources utiles

- [Documentation Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Documentation Firebase Cloud Messaging iOS](https://firebase.google.com/docs/cloud-messaging/ios/client)
- [Apple Push Notification Guide](https://developer.apple.com/documentation/usernotifications)
- [Firebase Console](https://console.firebase.google.com/)
- [Apple Developer Portal](https://developer.apple.com/account/)

---

**Dernière mise à jour** : Janvier 2025
