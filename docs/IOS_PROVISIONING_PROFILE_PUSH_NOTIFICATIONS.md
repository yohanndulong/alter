# Régénérer le Provisioning Profile avec Push Notifications

## Problème

Lors du build iOS, vous obtenez l'erreur :

```
❌ Provisioning profile doesn't support the Push Notifications capability.
error: Provisioning profile doesn't include the aps-environment entitlement.
```

Cela signifie que votre provisioning profile actuel ne contient pas la capability **Push Notifications**.

## Solution : Régénérer le Provisioning Profile

### Étape 1 : Aller sur Apple Developer Portal

1. Allez sur [Apple Developer Portal](https://developer.apple.com/account/)
2. Connectez-vous avec votre compte Apple Developer
3. Naviguez vers **Certificates, Identifiers & Profiles**

### Étape 2 : Vérifier l'App ID

1. Allez dans **Identifiers**
2. Cherchez votre App ID : `com.alterdating.alter`
3. Cliquez dessus
4. Vérifiez que **Push Notifications** est coché ✅
5. Si ce n'est pas le cas :
   - Cochez **Push Notifications**
   - Cliquez sur **Configure** à côté de Push Notifications
   - Vérifiez que votre certificat APNs est bien associé
   - Cliquez sur **Save**

### Étape 3 : Supprimer l'ancien Provisioning Profile

1. Allez dans **Profiles** dans le menu de gauche
2. Cherchez le profil : `*[expo] com.alterdating.alter AppStore`
3. Sélectionnez-le et cliquez sur **Delete** (ou laissez-le, il sera régénéré)

### Étape 4 : Créer un nouveau Provisioning Profile

#### Option A : Via Xcode (si vous avez un Mac)

1. Ouvrez Xcode
2. Allez dans **Preferences** → **Accounts**
3. Sélectionnez votre compte Apple Developer
4. Cliquez sur **Download Manual Profiles**
5. Xcode va automatiquement télécharger les nouveaux profils avec les capabilities mises à jour

#### Option B : Manuellement sur Apple Developer Portal

1. Dans **Profiles**, cliquez sur le bouton **+** pour créer un nouveau profil
2. Sélectionnez le type :
   - **App Store** pour production
   - **Ad Hoc** pour distribution de test
   - **Development** pour développement
3. Cliquez sur **Continue**
4. Sélectionnez votre App ID : `com.alterdating.alter`
5. Sélectionnez votre certificat de distribution (ou development)
6. (Si Ad Hoc ou Development) Sélectionnez les appareils
7. Donnez un nom au profil : `Alter AppStore` (ou `Alter Development`)
8. Cliquez sur **Generate**
9. **Téléchargez** le nouveau profil `.mobileprovision`

### Étape 5 : Utiliser le nouveau profil

#### Si vous utilisez un CI/CD (Codemagic, etc.)

1. Allez dans les paramètres de votre projet CI/CD
2. Section **Code signing**
3. Uploadez le nouveau provisioning profile téléchargé
4. Assurez-vous qu'il est bien sélectionné pour le build

#### Si vous buildez localement avec Xcode

1. Double-cliquez sur le fichier `.mobileprovision` téléchargé
2. Il sera automatiquement installé dans Xcode
3. Dans Xcode, allez dans **Signing & Capabilities**
4. Sélectionnez le nouveau profil dans **Provisioning Profile**

#### Si vous utilisez Fastlane

Dans votre `Fastfile` ou configuration CI/CD, assurez-vous que le profil est bien spécifié :

```ruby
build_app(
  scheme: "App",
  export_method: "app-store",
  export_options: {
    provisioningProfiles: {
      "com.alterdating.alter" => "Alter AppStore"
    }
  }
)
```

### Étape 6 : Relancer le build

Une fois le nouveau provisioning profile installé, relancez votre build iOS. L'erreur devrait être résolue.

## Vérification

Pour vérifier que votre provisioning profile contient bien les push notifications :

### Sur Mac avec terminal :

```bash
security cms -D -i ~/Library/MobileDevice/Provisioning\ Profiles/[UUID].mobileprovision
```

Cherchez dans la sortie :
```xml
<key>aps-environment</key>
<string>production</string>
```

Si vous voyez cette ligne, le profil supporte les push notifications ! ✅

### Via un outil en ligne :

1. Allez sur un site comme [ProvisionQL](https://github.com/ealeksandrov/ProvisionQL)
2. Uploadez votre fichier `.mobileprovision`
3. Vérifiez que **aps-environment** est présent dans les entitlements

## Notes importantes

### ⚠️ Pour les builds de production (App Store)

- Utilisez `aps-environment = production`
- Le provisioning profile doit être de type **App Store**
- Le certificat de distribution doit être valide

### 🔧 Pour les builds de développement

- Utilisez `aps-environment = development`
- Le provisioning profile doit être de type **Development**
- Le certificat de développement doit être valide
- L'appareil de test doit être inclus dans le profil

### 📱 Pour les builds Ad Hoc (TestFlight)

- Utilisez `aps-environment = production` (même pour TestFlight)
- Le provisioning profile doit être de type **Ad Hoc**
- Incluez tous les appareils de test

## Erreur persistante après régénération ?

Si l'erreur persiste malgré un nouveau provisioning profile :

### 1. Vérifiez que l'App ID a bien Push Notifications activé

Dans Apple Developer Portal → Identifiers → Votre App ID :
- Push Notifications doit être coché ✅
- Un certificat APNs doit être configuré

### 2. Nettoyez le cache Xcode (si applicable)

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/*
```

### 3. Vérifiez le fichier entitlements

Assurez-vous que `app/ios/App/App/App.entitlements` contient :

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

Pour production, changez `development` en `production`.

### 4. Vérifiez la configuration du projet

Dans `project.pbxproj`, assurez-vous que :

```
CODE_SIGN_ENTITLEMENTS = App/App.entitlements;
```

est présent dans les deux configurations (Debug et Release).

### 5. Contactez le support CI/CD

Si vous utilisez un service comme Codemagic ou Bitrise, contactez leur support pour vérifier que le provisioning profile est bien utilisé.

## Résumé de la checklist

- [ ] ✅ App ID a Push Notifications activé
- [ ] ✅ Certificat APNs configuré (Key .p8 ou Certificate)
- [ ] ✅ Nouveau provisioning profile généré avec Push Notifications
- [ ] ✅ Provisioning profile uploadé dans le CI/CD (ou installé localement)
- [ ] ✅ Fichier `App.entitlements` présent et correct
- [ ] ✅ `CODE_SIGN_ENTITLEMENTS` configuré dans project.pbxproj
- [ ] ✅ Cache nettoyé (si applicable)
- [ ] ✅ Build relancé

Une fois toutes ces étapes complétées, votre build iOS devrait fonctionner avec les push notifications ! 🎉

## Pour aller plus loin

- [Documentation Apple sur Push Notifications](https://developer.apple.com/documentation/usernotifications)
- [Guide Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Troubleshooting Fastlane Code Signing](https://docs.fastlane.tools/codesigning/getting-started/)

---

**Dernière mise à jour** : Janvier 2025
