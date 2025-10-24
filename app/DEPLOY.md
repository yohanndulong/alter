# Déploiement Android - ALTER Dating App

## 🚀 Configuration Capacitor

L'application utilise Capacitor pour créer une version native Android.

### Informations de l'application

- **Package ID**: `com.alter.dating`
- **Nom**: Alter - Dating App
- **Version**: 1.0.0

## 📱 Build Android

### Scripts disponibles

```bash
# Synchroniser les assets web avec Android
npm run android:sync

# Ouvrir le projet Android dans Android Studio
npm run android:open

# Construire un APK de release signé (production)
npm run android:build

# Construire un APK de release signé (staging avec mocks)
npm run android:build:staging

# Lancer l'app sur un appareil/émulateur connecté
npm run android:run
```

### Build manuel

```bash
# 1. Construire le projet web
npm run build

# 2. Synchroniser avec Android
npx cap sync android

# 3. Construire l'APK de release
cd android
./gradlew assembleRelease

# L'APK sera dans :
# android/app/build/outputs/apk/release/app-release.apk
```

## 🔐 Signature de l'APK

### Keystore

Le projet utilise un keystore pour signer les builds de release :

- **Fichier**: `android/alter-release-key.keystore`
- **Alias**: `alter`
- **Mots de passe**: Voir `keystore-info.txt` (gitignored)

⚠️ **IMPORTANT** :
- Ne jamais perdre le keystore ! Vous ne pourrez pas mettre à jour l'app sans lui.
- Ne jamais commiter le keystore ou les mots de passe sur git.
- Sauvegarder le keystore dans un endroit sécurisé (coffre-fort numérique, gestionnaire de secrets, etc.)

### Vérifier la signature

```bash
# Vérifier que l'APK est signé
jarsigner -verify -verbose -certs android/app/build/outputs/apk/release/app-release.apk

# Afficher les détails du keystore
keytool -list -v -keystore android/alter-release-key.keystore -alias alter
```

## 🎨 Icônes et Assets

Les icônes sont générées automatiquement avec `@capacitor/assets` :

```bash
# Modifier l'icône source : resources/icon.svg
# Régénérer toutes les tailles :
npx capacitor-assets generate --android
```

74 assets sont générés (icônes adaptatives, splash screens, mode sombre).

## 📦 Déploiement sur Google Play Store

### Prérequis

1. **Compte Google Play Developer** (~25$ frais unique)
2. **Build de release signé** (voir ci-dessus)
3. **Assets pour le store** :
   - Icône 512x512 (déjà dans `resources/icon.svg`)
   - Screenshots (au moins 2) :
     - Téléphone : 16:9 ou 9:16, min 320px
     - Tablette 7" : recommandé
     - Tablette 10" : recommandé
   - Image de présentation 1024x500 (optionnel)
   - Vidéo promo (optionnel)

### Étapes de déploiement

#### 1. Créer l'application sur la console

1. Aller sur [Google Play Console](https://play.google.com/console)
2. Créer une nouvelle application
3. Remplir les informations de base :
   - Nom : Alter - Dating App
   - Langue par défaut : Français
   - Type : Application
   - Gratuit/Payant : Gratuit

#### 2. Remplir la fiche du store

**Fiche du store** :
- Titre court : ALTER
- Description courte (80 caractères max)
- Description complète (4000 caractères max)
- Icône de l'application : 512x512
- Graphique de présentation : 1024x500
- Screenshots

**Catégorisation** :
- Catégorie principale : Social
- Catégorie secondaire : Lifestyle
- Tags : dating, rencontres, AI, matchmaking

**Coordonnées** :
- Email de contact
- Politique de confidentialité (URL)
- Site web (optionnel)

#### 3. Configuration du contenu

**Classification du contenu** :
- Questionnaire sur le contenu
- Évaluation d'âge
- Pour une app de rencontres, probablement 18+

**Données de sécurité** :
- Déclarer les données collectées
- Pratiques de confidentialité
- Permissions utilisées

#### 4. Upload de l'APK/AAB

**Production > Versions** :

```bash
# Construire un AAB (Android App Bundle) - recommandé par Google
cd android
./gradlew bundleRelease

# L'AAB sera dans :
# android/app/build/outputs/bundle/release/app-release.aab
```

1. Créer une nouvelle version
2. Upload le fichier AAB
3. Nom de version : 1.0.0
4. Code de version : 1
5. Notes de version (What's new)

#### 5. Tests internes/fermés (recommandé)

Avant la production :
1. Créer une piste de test interne
2. Ajouter des testeurs
3. Déployer sur cette piste
4. Tester l'app
5. Corriger les bugs

#### 6. Publication

1. Soumettre pour examen
2. Attendre validation Google (1-7 jours généralement)
3. Publication automatique ou manuelle

## 🔄 Mises à jour

Pour chaque nouvelle version :

```bash
# 1. Mettre à jour la version dans package.json
{
  "version": "1.1.0"
}

# 2. Mettre à jour versionCode et versionName dans android/app/build.gradle
android {
    defaultConfig {
        versionCode 2       // +1 à chaque mise à jour
        versionName "1.1.0" // version marketing
    }
}

# 3. Construire le nouveau build
npm run android:build

# 4. Upload sur Play Console
# 5. Ajouter les notes de version
# 6. Publier
```

## 🐛 Dépannage

### Erreur de signature

Si l'APK n'est pas signé :
```bash
# Vérifier que keystore.properties existe et contient les bonnes infos
cat android/keystore.properties
```

### Erreur de build

```bash
# Nettoyer le projet
cd android
./gradlew clean

# Rebuild
./gradlew assembleRelease
```

### Logs de l'app

```bash
# Voir les logs en temps réel
npx cap run android

# Ou via adb
adb logcat | grep -i alter
```

## 📊 Suivi après publication

- **Crashlytics** : Recommandé pour suivre les crashes
- **Analytics** : Google Analytics ou Firebase Analytics
- **Avis utilisateurs** : Répondre aux avis sur le Play Store
- **Mises à jour** : Publier régulièrement (corrections bugs, nouvelles features)

## 🔗 Liens utiles

- [Google Play Console](https://play.google.com/console)
- [Documentation Capacitor](https://capacitorjs.com/docs)
- [Guide de publication Android](https://developer.android.com/studio/publish)
- [Politiques du Play Store](https://play.google.com/about/developer-content-policy/)

---

**Note** : Cette documentation suppose que vous avez déjà configuré Android Studio et le SDK Android sur votre machine.
