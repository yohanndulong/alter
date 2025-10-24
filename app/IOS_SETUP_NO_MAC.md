# Déploiement iOS SANS Mac 🚀

Guide complet pour déployer Alter sur TestFlight en utilisant uniquement GitHub Actions (pas besoin de Mac !).

## ✅ Prérequis

- Compte Apple Developer ($99/an)
- Compte GitHub avec ce repo
- 30 minutes de configuration

## 📝 Étape 1 : Configuration Apple Developer (Web)

### 1.1 Créer les App IDs

1. Va sur [Apple Developer - Identifiers](https://developer.apple.com/account/resources/identifiers/list)
2. Clique sur le **"+"**
3. Sélectionne **"App IDs"** → Continue
4. Sélectionne **"App"** → Continue

**Pour Staging :**
- **Description** : Alter Dating App Staging
- **Bundle ID** : `com.alterdating.staging`
- **Capabilities** :
  - ✅ Push Notifications
  - ✅ Sign in with Apple
- Clique sur **Register**

**Pour Production :**
- Répète avec :
  - **Description** : Alter Dating App
  - **Bundle ID** : `com.alterdating.alter`
  - Mêmes capabilities

### 1.2 Créer les Apps dans App Store Connect

1. Va sur [App Store Connect](https://appstoreconnect.apple.com/)
2. Clique sur **"My Apps"** → **"+"** → **"New App"**

**Pour Staging :**
- **Platform** : iOS
- **Name** : Alter Staging
- **Primary Language** : French
- **Bundle ID** : Sélectionne `com.alterdating.staging`
- **SKU** : ALTER-STAGING-001
- **User Access** : Full Access

**Pour Production :**
- Répète avec :
  - **Name** : Alter
  - **Bundle ID** : `com.alterdating.alter`
  - **SKU** : ALTER-001

## 🔑 Étape 2 : Récupérer les Identifiants

### 2.1 Team IDs

**Developer Portal Team ID :**
1. Va sur [Apple Developer - Membership](https://developer.apple.com/account/membership/)
2. Note le **Team ID** (format: XXXXXXXXXX)

**App Store Connect Team ID :**
1. Va sur [App Store Connect - Users and Access](https://appstoreconnect.apple.com/access/users)
2. Clique sur **"Keys"** (en haut)
3. Note le **Issuer ID** (c'est le ITC_TEAM_ID)

### 2.2 App IDs numériques

Pour chaque app :
1. Va sur App Store Connect → My Apps → Sélectionne l'app
2. Dans l'URL, note le numéro : `appstoreconnect.apple.com/apps/1234567890/...`
3. Le `1234567890` est l'APPLE_ID

### 2.3 Mot de passe spécifique à l'app

1. Va sur [appleid.apple.com](https://appleid.apple.com/)
2. Connexion → **Security** → **App-Specific Passwords**
3. Clique sur **"+"**
4. Nom : "GitHub Actions Fastlane"
5. Note le mot de passe généré (format: `xxxx-xxxx-xxxx-xxxx`)

## 🔐 Étape 3 : Créer le Repo pour Certificats

### 3.1 Créer un repo privé

1. Va sur GitHub → Nouveau repo
2. **Nom** : `alter-ios-certificates`
3. **Visibilité** : ⚠️ **PRIVÉ** (très important !)
4. **Initialize** : avec un README
5. Crée le repo

### 3.2 Créer un Personal Access Token

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. **Generate new token (classic)**
3. **Note** : "Fastlane Match"
4. **Expiration** : No expiration (ou 1 an)
5. **Scopes** :
   - ✅ `repo` (tous les sous-items)
6. **Generate token**
7. **Copie immédiatement** le token (tu ne le reverras plus !)

### 3.3 Encoder le token en base64

**Sur Windows (PowerShell) :**
```powershell
$token = "ghp_tonTokenIci"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($token)
[Convert]::ToBase64String($bytes)
# Copie le résultat
```

**Ou en ligne :**
- Va sur [base64encode.org](https://www.base64encode.org/)
- Colle ton token
- Encode
- Copie le résultat

## 🔒 Étape 4 : Configurer les Secrets GitHub

Va sur ton repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Ajoute ces secrets un par un :

| Nom du Secret | Valeur | Exemple |
|---------------|--------|---------|
| `FASTLANE_USER` | Ton Apple ID (email) | `me@alterdating.com` |
| `FASTLANE_PASSWORD` | Mot de passe Apple ID | `MonMotDePasse123` |
| `FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD` | Mot de passe spécifique (étape 2.3) | `xxxx-xxxx-xxxx-xxxx` |
| `TEAM_ID` | Developer Portal Team ID | `ABC1234567` |
| `ITC_TEAM_ID` | App Store Connect Issuer ID | `12345678-1234-1234-1234-123456789012` |
| `APPLE_ID_STAGING` | App ID numérique Staging | `1234567890` |
| `APPLE_ID_PRODUCTION` | App ID numérique Production | `0987654321` |
| `MATCH_PASSWORD` | Mot de passe fort que TU choisis | `MonSuperMotDePasse!2024` |
| `MATCH_GIT_URL` | URL du repo certificats | `https://github.com/ton-org/alter-ios-certificates` |
| `MATCH_GIT_BASIC_AUTHORIZATION` | Token encodé en base64 (étape 3.3) | `Z2hwX3RvblRva2VuSWNp...` |

⚠️ **MATCH_PASSWORD** : Choisis un mot de passe fort et **ne le perds JAMAIS** ! Il chiffre tes certificats.

## 🚀 Étape 5 : Générer les Certificats (GitHub Actions)

1. Va sur ton repo GitHub → **Actions**
2. Sélectionne le workflow **"Setup iOS Certificates"**
3. Clique sur **"Run workflow"** → **"Run workflow"**
4. Attends 5-10 minutes
5. ✅ Si vert : certificats créés et stockés !
6. ❌ Si rouge : vérifie les logs et les secrets

## 🎉 Étape 6 : Déployer !

### Déploiement Automatique

**Staging (TestFlight) :**
```bash
git checkout develop
# Fait tes modifications
git commit -m "feat: nouvelle feature"
git push origin develop
# → Build automatique et upload vers TestFlight Staging
```

**Production (TestFlight) :**
```bash
git checkout main
git merge develop
git push origin main
# → Build automatique et upload vers TestFlight Production
```

### Déploiement Manuel

1. Va sur GitHub → **Actions**
2. Sélectionne **"iOS TestFlight Deployment"**
3. **Run workflow** → Choisis l'environnement
4. Clique sur **"Run workflow"**

## 📱 Tester l'App

### Ajouter des Testeurs

1. App Store Connect → TestFlight
2. Sélectionne ton app (Staging ou Production)
3. **Internal Testing** → **Add Testers**
4. Ajoute des emails (jusqu'à 100 testeurs internes)

### Distribuer le Build

1. Attends que le build soit traité (~10-30 minutes)
2. Status passe de "Processing" à "Ready to Submit"
3. Sélectionne le build → **Groups** → Ajoute le groupe de testeurs
4. Les testeurs reçoivent un email avec le lien TestFlight

### Télécharger TestFlight

Les testeurs doivent :
1. Télécharger **TestFlight** sur l'App Store
2. Ouvrir le lien reçu par email
3. Accepter l'invitation
4. Installer l'app

## 🔄 Flux de Travail

```
develop (staging)          main (production)
     │                           │
     ├─ Feature                  │
     ├─ Fix                      │
     └─ Push ───> TestFlight     │
           (Staging)              │
                                  │
     ┌─────────────── Merge ─────┤
     │                            │
     └─────────────> Push ───> TestFlight
                          (Production)
```

## 🐛 Dépannage

### Erreur "No profiles match"
- Relance le workflow "Setup iOS Certificates"
- Vérifie que les Bundle IDs sont corrects dans App Store Connect

### Erreur "Invalid credentials"
- Vérifie FASTLANE_USER et FASTLANE_PASSWORD
- Essaie de te connecter sur [appleid.apple.com](https://appleid.apple.com/)
- Vérifie le mot de passe spécifique à l'app

### Erreur "Could not decrypt"
- Vérifie MATCH_PASSWORD
- Si perdu, relance "Setup iOS Certificates" avec un nouveau mot de passe

### Build ne remonte pas sur TestFlight
- Vérifie les logs GitHub Actions
- Attends 30 min (parfois Apple est lent)
- Vérifie que l'app existe bien dans App Store Connect

## 📚 Ressources

- [Fastlane Docs](https://docs.fastlane.tools/)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Apple Developer](https://developer.apple.com/)

## ✅ Checklist Finale

Avant de pousser ton premier déploiement :

- [ ] Les 2 App IDs sont créés sur Apple Developer
- [ ] Les 2 apps sont créées dans App Store Connect
- [ ] Tous les secrets GitHub sont configurés
- [ ] Le workflow "Setup iOS Certificates" a réussi (vert)
- [ ] Tu as testé avec un `git push origin develop`
- [ ] Le build apparaît dans TestFlight après ~30 min

🎉 **Félicitations ! Tu peux maintenant déployer sur iOS sans Mac !** 🎉
