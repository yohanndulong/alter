# Configuration des notifications push pour iOS

## État actuel

✅ **Ce qui est déjà fait :**
- Le code frontend (`src/services/notifications.ts`) est **cross-platform** et fonctionne sur iOS et Android
- Le backend Firebase Cloud Messaging supporte iOS et Android
- Les permissions sont automatiquement demandées par Capacitor sur iOS

❌ **Ce qui manque pour iOS :**
- Configuration Firebase pour iOS
- Certificats APNs (Apple Push Notification service)
- Fichier `GoogleService-Info.plist`

---

## Étapes de configuration pour iOS

### 1. Configurer Firebase pour iOS

#### A. Ajouter iOS dans Firebase Console

1. Allez sur https://console.firebase.google.com/
2. Sélectionnez votre projet
3. Cliquez sur l'icône iOS (⚙️ Settings > Add app > iOS)
4. Renseignez :
   - **iOS bundle ID** : `com.alterdating.alter` (doit correspondre à votre `appId` dans `capacitor.config.ts`)
   - **App nickname** : `Alter Dating`
   - **App Store ID** : (optionnel pour l'instant)

5. Téléchargez le fichier **`GoogleService-Info.plist`**

#### B. Installer le fichier GoogleService-Info.plist

```bash
# Placez le fichier téléchargé dans le dossier iOS
cp ~/Downloads/GoogleService-Info.plist c:/dev/alter/alter-app-V2/ios/App/App/
```

### 2. Configurer les certificats APNs (Apple Push Notification service)

#### A. Créer une clé APNs dans Apple Developer

1. Allez sur https://developer.apple.com/account/resources/authkeys/list
2. Cliquez sur **"+"** pour créer une nouvelle clé
3. Nommez la clé (ex: "Alter APNs Key")
4. Cochez **"Apple Push Notifications service (APNs)"**
5. Cliquez sur **Continue** puis **Register**
6. **Téléchargez le fichier .p8** (vous ne pourrez pas le re-télécharger !)
7. Notez :
   - **Key ID** (ex: ABC123DEF4)
   - **Team ID** (visible en haut de la page, ex: X1Y2Z3A4B5)

#### B. Uploader la clé APNs dans Firebase

1. Dans Firebase Console > Project Settings > Cloud Messaging
2. Sous **"Apple app configuration"** > **"APNs Authentication Key"**
3. Cliquez sur **"Upload"**
4. Sélectionnez votre fichier `.p8`
5. Entrez :
   - **Key ID**
   - **Team ID**
6. Cliquez sur **"Upload"**

### 3. Synchroniser Capacitor

```bash
cd c:/dev/alter/alter-app-V2
npx cap sync ios
```

### 4. Ouvrir et configurer le projet Xcode

```bash
npx cap open ios
```

Dans Xcode :

1. **Activer les Push Notifications** :
   - Sélectionnez le projet "App" dans le navigateur
   - Onglet **"Signing & Capabilities"**
   - Cliquez sur **"+ Capability"**
   - Ajoutez **"Push Notifications"**

2. **Activer Background Modes** :
   - Dans le même onglet, cliquez à nouveau sur **"+ Capability"**
   - Ajoutez **"Background Modes"**
   - Cochez **"Remote notifications"**

3. **Vérifier le Bundle Identifier** :
   - Vérifiez que le **Bundle Identifier** est bien `com.alterdating.alter`

### 5. Tester sur un appareil iOS réel

⚠️ **Important** : Les notifications push ne fonctionnent PAS sur le simulateur iOS. Vous devez tester sur un appareil physique.

1. Connectez votre iPhone
2. Sélectionnez votre appareil dans Xcode
3. Cliquez sur **Run** (▶️)
4. L'app va se lancer et demander la permission pour les notifications
5. Acceptez la permission
6. Envoyez un message depuis un autre compte pour tester

---

## Vérification de la configuration

### Backend - Vérifier que Firebase est initialisé

Dans les logs du backend, vous devriez voir :
```
✅ Firebase Admin SDK initialisé
```

Si vous voyez cette erreur :
```
⚠️ FIREBASE_SERVICE_ACCOUNT non défini
```

Ajoutez la variable d'environnement dans votre `.env` backend (voir `FIREBASE_SETUP.md`)

### Frontend - Vérifier que le token est enregistré

Dans les logs de l'app iOS (via Xcode Console), vous devriez voir :
```
📱 Push notification token: <token-value>
✅ Token FCM envoyé au backend
✅ Service de notifications initialisé
```

---

## Différences iOS vs Android

| Fonctionnalité | Android | iOS |
|---------------|---------|-----|
| Demande de permission | Automatique depuis Android 13 | Popup au lancement |
| Simulateur | ✅ Fonctionne | ❌ Ne fonctionne pas |
| Notifications en foreground | ✅ Customisable | ✅ Customisable |
| Badge count | ✅ Supporté | ✅ Supporté |
| Son personnalisé | ✅ Supporté | ✅ Supporté |

---

## Dépannage

### Problème : "No APNs token for the app"
**Solution** : Vérifiez que vous avez bien uploadé la clé APNs (.p8) dans Firebase Console

### Problème : "Registration error"
**Solution** : Vérifiez que le Bundle ID correspond exactement dans :
- `capacitor.config.ts` (`appId`)
- Firebase Console (iOS app)
- Xcode (Bundle Identifier)

### Problème : Les notifications n'arrivent pas
**Solutions** :
1. Vérifiez que vous testez sur un **appareil réel** (pas le simulateur)
2. Vérifiez que l'utilisateur a **accepté** les permissions de notifications
3. Vérifiez les logs backend pour confirmer que la notification a été envoyée
4. Testez avec l'outil de Firebase : Console > Cloud Messaging > Send test message

---

## Fichiers de certificat actuels

Je vois que vous avez déjà ces fichiers :
```
ios_distribution.cer
ios_notif_aps.cer
```

Ces fichiers sont des **certificats** (ancienne méthode). Firebase recommande maintenant d'utiliser les **clés APNs (.p8)** qui sont plus simples et ne nécessitent pas de renouvellement annuel.

Si vous préférez utiliser vos certificats existants au lieu d'une clé .p8, vous pouvez les uploader dans Firebase Console > Cloud Messaging > Upload Certificate.

---

## Résumé des fichiers nécessaires

✅ **Android** :
- `google-services.json` → Téléchargé depuis Firebase
- Variable d'env `FIREBASE_SERVICE_ACCOUNT` → Contenu JSON du service account

❌ **iOS** (à faire) :
- `GoogleService-Info.plist` → À télécharger depuis Firebase et placer dans `ios/App/App/`
- Clé APNs `.p8` → À créer sur Apple Developer et uploader dans Firebase
- Configuration Xcode → Push Notifications + Background Modes

---

## Code déjà prêt pour iOS

Le code est **déjà cross-platform** ! Aucune modification n'est nécessaire :

✅ **Frontend** : `src/services/notifications.ts` fonctionne sur iOS et Android
✅ **Backend** : Firebase Cloud Messaging envoie aux deux plateformes
✅ **Permissions** : Gérées automatiquement par Capacitor sur iOS

Une fois la configuration Firebase et APNs terminée, les notifications fonctionneront immédiatement sur iOS ! 🚀
