# Configuration du déploiement automatique sur Google Play Store

Ce guide explique comment configurer le déploiement automatique sur le test interne du Google Play Store.

## Prérequis

1. **Compte Google Play Console** avec accès développeur
2. **Application créée** dans la Play Console
3. **Premier upload manuel** effectué (AAB initial)

## Configuration du Service Account

### 1. Créer un Service Account Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez ou créez un projet lié à votre app
3. Dans le menu, allez dans **IAM & Admin** > **Service Accounts**
4. Cliquez sur **Create Service Account**
5. Remplissez les informations :
   - **Name**: `Play Store Deployer`
   - **ID**: `play-store-deployer`
   - **Description**: `Service account for automated Play Store deployments`
6. Cliquez sur **Create and Continue**
7. Cliquez sur **Continue** (pas besoin de rôle pour l'instant)
8. Cliquez sur **Done**

### 2. Créer une clé JSON

1. Dans la liste des service accounts, cliquez sur celui que vous venez de créer
2. Allez dans l'onglet **Keys**
3. Cliquez sur **Add Key** > **Create new key**
4. Sélectionnez **JSON**
5. Cliquez sur **Create**
6. Le fichier JSON est téléchargé automatiquement
7. **Renommez** ce fichier en `play-store-credentials.json`
8. **Déplacez** le fichier dans `android/play-store-credentials.json`

### 3. Lier le Service Account à la Play Console

1. Allez sur [Google Play Console](https://play.google.com/console/)
2. Dans le menu, allez dans **Setup** > **API access**
3. Cliquez sur **Link** (ou **Choose a project to link**)
4. Sélectionnez votre projet Google Cloud
5. Cliquez sur **Link project**
6. Dans la section **Service accounts**, trouvez votre service account
7. Cliquez sur **Grant access**
8. Configurez les permissions :
   - **Account permissions** > Cochez **Admin (all permissions)**
   - Ou au minimum :
     - **Releases** > **Create and edit draft releases**
     - **Releases** > **Manage production releases**
     - **Releases** > **Manage testing track releases**
9. Cliquez sur **Invite user** puis **Send invite**

### 4. Sécuriser les credentials

Ajoutez le fichier credentials au `.gitignore` :

```bash
# Already in .gitignore
android/play-store-credentials.json
```

⚠️ **IMPORTANT** : Ne commitez JAMAIS ce fichier JSON ! Il contient des credentials sensibles.

## Premier déploiement manuel (obligatoire)

Avant d'utiliser le déploiement automatique, vous devez effectuer un premier upload manuel :

1. Construisez l'AAB :
   ```bash
   npm run android:bundle
   ```

2. Allez sur [Google Play Console](https://play.google.com/console/)
3. Sélectionnez votre application
4. Allez dans **Testing** > **Internal testing**
5. Cliquez sur **Create new release**
6. Uploadez l'AAB : `android/app/build/outputs/bundle/release/app-release.aab`
7. Remplissez les informations de version
8. Cliquez sur **Review release** puis **Start rollout to Internal testing**

Une fois ce premier déploiement effectué, vous pourrez utiliser le déploiement automatique.

## Utilisation du déploiement automatique

### Déployer sur le test interne

```bash
# Construction et déploiement automatique
npm run deploy:internal

# Ou pour la version staging (avec mocks)
npm run deploy:internal:staging
```

Cette commande va :
1. ✅ Construire le code TypeScript
2. ✅ Construire le bundle Vite
3. ✅ Synchroniser avec Capacitor
4. ✅ Construire l'AAB signé
5. ✅ Uploader sur le test interne du Play Store

### Vérifier le déploiement

1. Allez sur [Google Play Console](https://play.google.com/console/)
2. Sélectionnez votre application
3. Allez dans **Testing** > **Internal testing**
4. Vérifiez que la nouvelle version apparaît

## Incrémenter la version

Avant chaque déploiement, vous devez incrémenter le `versionCode` dans `android/app/build.gradle` :

```gradle
defaultConfig {
    applicationId "com.alter.dating"
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 2  // Incrémenter ce nombre à chaque déploiement
    versionName "1.0.1"  // Version affichée aux utilisateurs
    // ...
}
```

**Important** : Le `versionCode` doit TOUJOURS être supérieur à la version précédente uploadée sur le Play Store.

## Déployer sur d'autres tracks

Pour déployer sur d'autres canaux, modifiez le fichier `android/app/build.gradle` :

```gradle
play {
    serviceAccountCredentials.set(file("../play-store-credentials.json"))
    track.set("internal")  // Changez ici: "internal", "alpha", "beta", "production"
    defaultToAppBundles.set(true)
}
```

Puis relancez `npm run deploy:internal`

## Dépannage

### Erreur "The Android App Bundle was not signed"

Vérifiez que `android/keystore.properties` existe et contient les bonnes informations.

### Erreur "Insufficient permissions"

Vérifiez que le service account a bien les permissions dans la Play Console (étape 3.8).

### Erreur "Version code X has already been used"

Incrémentez le `versionCode` dans `android/app/build.gradle`.

### Erreur "Package not found"

Assurez-vous d'avoir fait un premier upload manuel via la Play Console.

## Commandes disponibles

| Commande | Description |
|----------|-------------|
| `npm run deploy:internal` | Déployer sur le test interne (production) |
| `npm run deploy:internal:staging` | Déployer sur le test interne (staging avec mocks) |
| `npm run android:bundle` | Construire l'AAB seulement |
| `npm run android:build` | Construire l'APK seulement |

## Sécurité

- ✅ Le fichier `play-store-credentials.json` est dans `.gitignore`
- ✅ Ne partagez jamais ce fichier
- ✅ Sauvegardez-le dans un endroit sécurisé (gestionnaire de mots de passe, coffre-fort d'équipe)
- ✅ Renouvelez les credentials si vous pensez qu'ils ont été compromis
