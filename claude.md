# ALTER - Projet de Dating App avec IA

## Vue d'ensemble du projet

ALTER est une application de rencontre innovante propulsée par un agent matrimonial IA qui aide les utilisateurs à trouver leur partenaire idéal grâce à une compréhension approfondie de leurs préférences et de leur personnalité.

### Architecture

Le projet est divisé en deux parties principales :

- **`/app`** : Application mobile React/TypeScript avec Capacitor (frontend)
- **`/api`** : API backend NestJS avec PostgreSQL (backend)

## Stack Technique

### Frontend (`/app`)

- **Framework** : React 18 + TypeScript
- **Build Tool** : Vite
- **Mobile** : Capacitor 7 (Android & iOS)
- **Routing** : React Router v6
- **Styling** : CSS vanilla avec design system
- **i18n** : i18next + react-i18next (FR/EN)
- **Animation** : Framer Motion
- **State Management** : React Context API + TanStack Query
- **WebSocket** : Socket.io-client
- **API Mocking** : MSW (Mock Service Worker)
- **Code Quality** : ESLint + Prettier

### Backend (`/api`)

- **Framework** : NestJS 11
- **Database** : PostgreSQL 14+ avec pgvector
- **ORM** : TypeORM
- **Authentification** : JWT avec Passport
- **Email** : Resend
- **LLM** : OpenRouter (GPT-4, etc.)
- **Embeddings** : OpenAI API
- **WebSocket** : Socket.io
- **Image Processing** : TensorFlow.js + NSFWJS
- **Validation** : class-validator + class-transformer

## Structure du projet

```
alter/
├── app/                          # Application frontend
│   ├── src/
│   │   ├── components/          # Composants réutilisables
│   │   ├── contexts/            # React Contexts (Auth, Theme, etc.)
│   │   ├── hooks/               # Custom hooks
│   │   ├── i18n/                # Traductions (FR/EN)
│   │   ├── pages/               # Pages de l'application
│   │   ├── services/            # Services API
│   │   ├── mocks/               # MSW mocks pour développement
│   │   ├── styles/              # Styles globaux et design system
│   │   └── types/               # Types TypeScript
│   ├── android/                 # Projet Android natif
│   ├── ios/                     # Projet iOS natif
│   ├── public/                  # Assets statiques
│   ├── scripts/                 # Scripts de build et déploiement
│   └── package.json
│
├── api/                         # Backend API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           # Authentification par email + code
│   │   │   ├── users/          # Gestion des profils
│   │   │   ├── onboarding/     # Questions dynamiques
│   │   │   ├── matching/       # Découverte, likes, matches
│   │   │   ├── chat/           # Messagerie temps réel
│   │   │   ├── alter-chat/     # Chat avec l'IA Alter
│   │   │   ├── upload/         # Upload de photos
│   │   │   ├── llm/            # Intégration OpenRouter
│   │   │   ├── embeddings/     # Embeddings pour matching
│   │   │   ├── notifications/  # Push notifications (APNs + FCM)
│   │   │   ├── parameters/     # Paramètres versionnés
│   │   │   └── admin/          # Administration
│   │   ├── config/             # Configuration TypeORM, etc.
│   │   └── scripts/            # Scripts d'initialisation
│   └── package.json
│
├── web/                         # Site vitrine alterdating.com
│   ├── css/                     # Styles du site vitrine
│   │   └── style.css           # Design system matching l'app
│   ├── images/                  # Assets du site
│   └── *.html                   # Pages (index, CGU, CGV, etc.)
│
├── docker-compose.yml           # PostgreSQL + pgAdmin
└── claude.md                    # Ce fichier
```

## Fonctionnalités principales

### 1. Authentification
- Inscription et connexion par email avec code de vérification
- Système JWT pour la gestion des sessions
- Pas de mot de passe : authentification passwordless

### 2. Onboarding dynamique
- Questionnaire personnalisé fourni par l'API
- Types de questions : texte, choix unique/multiple, date, nombre, slider
- Sauvegarde automatique des réponses

### 3. Agent IA "Alter"
- Conversation avec un agent IA pour comprendre l'utilisateur
- Questions adaptatives basées sur les réponses
- Options de réponse rapides suggérées
- Construction progressive du profil

### 4. Matching intelligent
- Calcul de compatibilité basé sur LLM (GPT-4)
- Scores sur 4 critères personnalisés
- Swipe pour liker ou passer
- Système de matchs bilatéraux

### 5. Chat en temps réel
- Messagerie instantanée via WebSocket
- Indicateurs de statut (en ligne, vu)
- Historique des conversations
- Notifications de nouveaux messages

### 6. Modération de contenu
- Détection automatique de contenu NSFW dans les images
- Analyse de la qualité des conversations
- Protection contre le spam et les comportements inappropriés

### 7. Notifications push
- **Système dual** : APNs natif pour iOS, Firebase Cloud Messaging pour Android
- **Auto-détection** : Le backend détecte le format du token pour router vers le bon service
- **Couverture complète** : Notifications pour messages texte, vocaux et photos
- **Orientation** : Application verrouillée en mode portrait uniquement

## Développement

### Configuration initiale

#### 1. Base de données

```bash
# Lancer PostgreSQL avec Docker
docker-compose up -d

# La base de données sera accessible sur :
# - PostgreSQL : localhost:5432
# - pgAdmin : http://localhost:5050 (admin@alter.com / admin123)
```

#### 2. Backend API

```bash
cd api

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env

# Configurer les variables d'environnement
# Voir api/.env.example pour la liste complète

# Lancer l'API en mode développement
npm run start:dev

# L'API sera accessible sur http://localhost:3000/api
```

#### 3. Frontend App

```bash
cd app

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env

# Lancer le serveur de développement
npm run dev

# L'app sera accessible sur http://localhost:5173
```

### Commandes utiles

#### Backend (`/api`)

```bash
# Développement
npm run start:dev              # Mode développement avec hot-reload
npm run start:debug            # Mode debug

# Build
npm run build                  # Build pour production
npm run start:prod             # Lancer en production

# Database migrations
npm run migration:generate -- -n NomDeLaMigration
npm run migration:run
npm run migration:revert

# Code quality
npm run format                 # Formater le code
```

#### Frontend (`/app`)

```bash
# Développement
npm run dev                    # Serveur de développement

# Build
npm run build:web              # Build web (dev)
npm run build:web:staging      # Build web (staging avec mocks)
npm run build:web:main         # Build web (production)

# Android
npm run android:sync           # Synchroniser avec Android
npm run android:open           # Ouvrir dans Android Studio
npm run android:run            # Lancer sur appareil/émulateur
npm run android:build:dev      # Build APK dev
npm run android:build:staging  # Build APK staging (avec mocks)
npm run android:build:main     # Build APK production
npm run android:bundle:main    # Build AAB pour Play Store

# iOS
npm run ios:sync              # Synchroniser avec iOS
npm run ios:open              # Ouvrir dans Xcode
npm run build:ios:dev         # Build iOS dev
npm run build:ios:main        # Build iOS production

# Code quality
npm run lint                  # Linter
npm run format                # Formater le code
```

## Conventions de code

### TypeScript

- **Types explicites** : Toujours typer les paramètres et retours de fonctions
- **Interfaces** : Utiliser des interfaces pour les objets complexes
- **Enums** : Pour les valeurs constantes avec un nombre limité d'options
- **Éviter `any`** : Utiliser `unknown` si nécessaire

### React

- **Composants fonctionnels** : Toujours utiliser des fonctions (pas de classes)
- **Hooks** : Respecter les règles des hooks
- **Props destructuring** : Déstructurer les props dans les paramètres
- **TypeScript** : Typer toutes les props avec des interfaces

Exemple :
```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ label, onClick, variant = 'primary' }) => {
  return <button className={`btn btn-${variant}`} onClick={onClick}>{label}</button>;
};
```

### Internationalisation (i18n)

**IMPORTANT** : Toujours utiliser le système i18n pour tous les textes visibles par l'utilisateur.

- **JAMAIS de texte en dur** : Ne jamais écrire de texte directement dans les composants
- **Utiliser `t()`** : Toujours utiliser la fonction `t()` de `react-i18next`
- **Fichiers de traduction** : Ajouter les clés dans `app/src/i18n/locales/fr.json` ET `en.json`
- **Nommage des clés** : Utiliser la structure `section.key` (ex: `chat.alchemyTitle`)

Exemple :
```typescript
import { useTranslation } from 'react-i18next'

export const MyComponent = () => {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t('chat.title')}</h1>
      <button title={t('chat.send')}>{t('common.send')}</button>
    </div>
  )
}
```

Fichiers de traduction (`fr.json` et `en.json`) :
```json
{
  "chat": {
    "title": "Messages",
    "send": "Envoyer"
  }
}
```

### NestJS

- **Modules** : Un module par fonctionnalité
- **Services** : Logique métier dans les services
- **Controllers** : Gestion des routes uniquement
- **DTOs** : Utiliser des DTOs pour la validation
- **Decorators** : Utiliser les decorators NestJS appropriés

Exemple :
```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }
}
```

### Nommage

- **Variables/Functions** : camelCase (`getUserById`)
- **Classes/Interfaces** : PascalCase (`UserProfile`)
- **Constants** : UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Fichiers** : kebab-case ou PascalCase selon le type
  - Composants React : `UserProfile.tsx`
  - Services : `user.service.ts`
  - Utilitaires : `format-date.ts`

### CSS

- **BEM-like** : Utiliser une approche BEM simplifiée
- **Variables CSS** : Utiliser les variables du design system
- **Mobile-first** : Commencer par le mobile, puis ajouter les breakpoints

Exemple :
```css
.profile-card {
  padding: var(--spacing-4);
}

.profile-card__avatar {
  width: 80px;
  height: 80px;
}

.profile-card__name {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
}
```

## Variables d'environnement

### Frontend (`/app`)

```env
VITE_API_URL=http://localhost:3000/api
VITE_ENABLE_MOCKS=true           # true pour activer MSW
VITE_SOCKET_URL=http://localhost:3000
```

### Backend (`/api`)

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/alter_db

# JWT
JWT_SECRET=votre-secret-jwt
JWT_EXPIRES_IN=7d

# Email
RESEND_API_KEY=re_xxxxx
EMAIL_FROM_NAME=Alter
EMAIL_FROM_ADDRESS=noreply@alter.app

# LLM
OPENROUTER_API_KEY=sk-or-v1-xxxxx
OPENAI_API_KEY=sk-xxxxx          # Pour embeddings uniquement

# Push Notifications
## iOS (APNs)
APNS_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
APNS_KEY_ID=ABC123XYZ
APNS_TEAM_ID=XXXXXXXXXX
APNS_BUNDLE_ID=com.alterdating.alter
APNS_PRODUCTION=false           # true pour production

## Android (Firebase)
FIREBASE_PROJECT_ID=alter-xxxxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@alter-xxxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----

# WebSocket
WEBSOCKET_CORS_ORIGIN=capacitor://localhost,https://staging.alterdating.com
```

## Système de mocks (MSW)

Le frontend utilise MSW pour mocker l'API en développement et staging.

### Activation
Les mocks s'activent via `VITE_ENABLE_MOCKS=true` dans `.env`

### Structure
```
app/src/mocks/
├── handlers/          # Handlers MSW par module
│   ├── auth.ts
│   ├── matching.ts
│   └── chat.ts
├── data/             # Données mockées
│   └── users.ts
└── index.ts          # Configuration MSW
```

### Utilisation
Les mocks sont automatiquement actifs si `VITE_ENABLE_MOCKS=true`.
Pour tester avec l'API réelle, mettre à `false`.

## Déploiement

### Frontend

- **Web** : Build avec `npm run build:web:main` puis déployer sur un CDN
- **Android** : Build AAB avec `npm run android:bundle:main` puis upload sur Play Store
- **iOS** : Build avec Xcode puis upload sur App Store Connect
- **OTA Updates** : Système d'updates automatiques via Capgo

Voir `app/DEPLOY.md` pour les guides détaillés.

### Backend

- Déploiement recommandé : Railway, Render, ou serveur VPS
- S'assurer que PostgreSQL est accessible
- Configurer toutes les variables d'environnement
- Exécuter les migrations : `npm run migration:run`

## Intégration LLM

L'application utilise OpenRouter pour 3 cas d'usage principaux :

### 1. Chat Alter
- Conversation empathique avec l'utilisateur
- Collecte d'informations pour créer un profil authentique
- Questions adaptatives basées sur les réponses

### 2. Calcul de compatibilité
- Analyse des profils utilisateurs
- Calcul de scores sur 4 critères personnalisés
- Explications des compatibilités

### 3. Analyse de qualité de conversation
- Évaluation de la qualité des échanges entre matchs
- Détection de conversations problématiques
- Suggestions pour améliorer les conversations

### Configuration des prompts

Les prompts sont stockés dans la base de données via le système de paramètres versionnés.
Voir `api/src/modules/llm/PROMPTS.md` pour la documentation des prompts.

## Tests

### Frontend

```bash
cd app
npm run test              # Lancer les tests (à implémenter)
```

### Backend

```bash
cd api
npm run test              # Lancer les tests (à implémenter)
```

## Documentation supplémentaire

### Frontend (`/app`)
- `DEPLOY.md` - Guide de déploiement
- `QUICK_START.md` - Guide de démarrage rapide
- `GUIDE_PLAY_STORE.md` - Publication sur Play Store
- `IOS_DEPLOYMENT.md` - Déploiement iOS
- `MOCK_API_SETUP.md` - Configuration des mocks
- `OTA_UPDATES.md` - Mises à jour OTA
- `IMAGE_CACHE.md` - Gestion du cache d'images

### Backend (`/api`)
- `README.md` - Documentation de l'API
- `DATABASE_CONFIG.md` - Configuration de la base de données
- `FIREBASE_SETUP.md` - Configuration Firebase
- `MEDIA_MODERATION.md` - Modération de contenu
- `src/modules/*/README.md` - Documentation par module

## Troubleshooting

### Problèmes courants

#### "Cannot find module" en développement
```bash
# Frontend
cd app && rm -rf node_modules && npm install

# Backend
cd api && rm -rf node_modules && npm install
```

#### Erreurs de migration TypeORM
```bash
cd api
npm run migration:revert  # Annuler la dernière migration
# Corriger la migration
npm run migration:run     # Réappliquer
```

#### WebSocket ne se connecte pas
- Vérifier que `WEBSOCKET_CORS_ORIGIN` inclut l'origine du frontend
- Vérifier que le backend est bien lancé
- Vérifier les logs du serveur

#### Les mocks MSW ne fonctionnent pas
- Vérifier que `VITE_ENABLE_MOCKS=true` dans `.env`
- Vérifier les logs du navigateur pour les erreurs MSW
- Nettoyer le cache du navigateur

## Changelog récent

### Janvier 2025

#### Optimisations de performance critiques

**1. Optimisation du système de matching (46s → 2-4s)**
- **Parallélisation des appels LLM** : `compatibility.service.ts` - Utilise `Promise.all()` au lieu de boucle séquentielle (-42s)
- **Suppression du logging massif** : `matching.service.ts` - Ne charge plus tous les users pour le debug (-1-2s)
- **Optimisation du calcul de hash** : Pré-calcul dans une Map au lieu de O(n²) (-100ms)
- **Cache avec TTL progressif** : `profile-hash.util.ts` - Hash basé uniquement sur champs critiques (alterProfileAI, age, gender) + TTL 30 jours
- **Résultat** : 92% plus rapide, cache hit rate +20-30%
- **Modèle LLM** : `openai/gpt-4o-mini` (économique, suffisant pour MVP)

**2. Fix critique du chargement des photos (95 MB → 300 KB, 25s → 0.5s)**
- **Problème** : Les photos sont en BYTEA dans PostgreSQL. `relations: ['photos']` chargeait tous les blobs (plusieurs MB) en RAM
- **Solution** : Utiliser `createQueryBuilder().select()` pour exclure le champ `data` (BYTEA)
- **Fichiers modifiés** :
  - `matching.service.ts` : `getMatches()`, `getInterestedProfiles()`, `getDiscoverProfiles*()`
  - `users.service.ts` : `findById()` (fonction de base utilisée partout)
- **Pattern à respecter** : ❌ JAMAIS `relations: ['photos']` | ✅ TOUJOURS `QueryBuilder + .select()` sans `data`
- **Résultat** : 96% plus rapide, 99.7% moins de données, 0% timeouts

#### Corrections de bugs critiques

**1. Fix des erreurs TypeScript dans le matching service**
- Ajout du type `UserWithDistance` pour les profils avec distance calculée
- Correction des erreurs TS2339 dans `api/src/modules/matching/matching.service.ts`
- Le champ `distance` est maintenant correctement typé sur les objets User

**2. Résolution de la boucle infinie d'appels API Nominatim**
- **Problème** : L'autocomplete de ville appelait l'API en boucle lors de l'édition du profil
- **Cause** :
  - Le tableau `countryCodes` par défaut créait une nouvelle instance à chaque render
  - Le `useEffect` se redéclenchait constamment à cause des dépendances
  - `updateUser()` dans `autoSave` modifiait le contexte, redéclenchant le cycle
- **Solution** :
  - Création de `DEFAULT_COUNTRY_CODES` comme constante externe
  - Suppression de `updateUser()` dans la fonction `autoSave`
  - Utilisation de `isInitializedRef` pour ne charger les données qu'une fois
  - Séparation des `useEffect` pour éviter les re-renders en cascade

**3. Fix du statut réseau bloqué en "offline"**
- **Problème** : L'indicateur "Pas de connexion internet" restait affiché même en ligne
- **Solution** :
  - Effacement automatique des erreurs offline quand le navigateur détecte le retour en ligne
  - Ajout de logs de debug pour tracer les changements d'état
  - Vérification de l'état initial au montage du composant
  - Amélioration de la synchronisation entre `status` et `lastError`

**4. Correction de la modale de filtres qui se fermait immédiatement**
- **Problème** : La modale de filtres sur la page Discover se fermait dès qu'on cliquait sur les sliders
- **Causes** :
  - Boucle de re-render causée par `onClose` comme fonction inline changeant à chaque render
  - Événements de clic/touch se propageant jusqu'au backdrop
  - Gestion de l'historique du navigateur déclenchant des fermetures intempestives
- **Solutions** :
  - Utilisation de `onCloseRef` pour éviter les re-renders inutiles
  - Ajout de `closeOnBackdropClick={false}` et `enableSwipeToClose={false}`
  - `stopPropagation()` sur tous les inputs range et conteneurs
  - Amélioration de la gestion de l'historique avec vérification du `modalId`

#### Améliorations UX

**1. Clavier numérique pour le code de vérification**
- `app/src/pages/VerifyCode.tsx` - Ajout de `inputMode="numeric"` pour afficher le clavier numérique sur mobile
- Améliore l'expérience de saisie du code à 6 chiffres

**2. Code de vérification en premier dans le sujet de l'email**
- `api/src/modules/email/email.service.ts` - Sujet modifié de `"Votre code - 123456"` à `"123456 - Votre code"`
- Le code est visible immédiatement dans la liste des emails sans ouvrir le message

#### Nouvelles fonctionnalités

**1. Type d'onboarding `city_location`**
- Ajout du type `city_location` à l'enum PostgreSQL et TypeORM
- Support de l'autocomplete de ville dans l'onboarding
- Migration SQL : `api/src/migrations/005-add-city-location-onboarding-question.sql`
- Le composant `CityLocationInput` permet :
  - Géolocalisation GPS automatique
  - Recherche manuelle avec autocomplete Nominatim

**2. Composant CityAutocomplete amélioré**
- Autocomplete pour la sélection de ville avec l'API Nominatim
- Debounce de 400ms pour optimiser les appels API
- Support multi-pays (FR, BE, CH, CA par défaut)
- Gestion du clavier (flèches, Enter, Escape)
- Filtrage intelligent (villes, villages, communes)
- Utilisé dans EditProfile et Onboarding

#### Fichiers modifiés

**API (`/api`)**
- `src/modules/matching/matching.service.ts` - Ajout du type UserWithDistance
- `src/modules/onboarding/entities/onboarding-question.entity.ts` - Type CITY_LOCATION
- `src/migrations/005-add-city-location-onboarding-question.sql` - Migration city_location

**Frontend (`/app`)**
- `src/pages/EditProfile.tsx` - Fix boucle infinie + useEffect optimisés
- `src/pages/Discover.tsx` - Fix modale de filtres + stopPropagation
- `src/components/Modal.tsx` - Gestion historique améliorée + onCloseRef
- `src/components/NetworkStatus.tsx` - Fix détection réseau
- `src/components/CityAutocomplete.tsx` - Constante DEFAULT_COUNTRY_CODES
- `src/contexts/NetworkContext.tsx` - Effacement auto erreurs offline
- `src/types/index.ts` - Type city_location déjà présent

#### Notifications push et sécurité

**1. Migration de Firebase vers APNs pour iOS**
- **Problème** : Crash iOS au lancement causé par `FirebaseApp.configure()` avec tokens APNs
- **Solution** : Suppression complète de Firebase sur iOS, utilisation native d'APNs
- **Fichiers modifiés** :
  - `api/src/modules/notifications/notifications.service.ts` - Système dual APNs (iOS) + FCM (Android)
  - `ios/App/App/AppDelegate.swift` - Suppression Firebase, gardé uniquement UNUserNotificationCenter
  - `ios/App/Podfile` - Suppression de tous les pods Firebase
  - `app/src/services/notifications.ts` - Ajout détection platform avec `Capacitor.getPlatform()`
- **Configuration requise** : Variables d'environnement APNs (APNS_KEY, APNS_KEY_ID, APNS_TEAM_ID, etc.)
- **Auto-détection** : Le backend détecte automatiquement le format du token (hex 64 chars = APNs)

**2. Fix critique de sécurité : Injection de receiverId dans les messages**
- **Vulnérabilité** : Le receiverId était envoyé par le frontend, permettant l'injection de messages
- **Solution** : Calcul serveur du receiverId basé sur le match et le JWT
- **Fichiers modifiés** :
  - `api/src/modules/chat/chat.gateway.ts` - Suppression receiverId du payload WebSocket, calcul automatique
  - `app/src/services/chat.ts` - Suppression paramètre receiverId de `sendMessageWS()`
  - `app/src/pages/Chat.tsx` - Fix calcul receiverId pour messages optimistes
- **Principe** : À partir du matchId et du userId (JWT), on détermine l'autre utilisateur (userId ou matchedUserId)

**3. Notifications pour messages photos et vocaux**
- **Problème** : Seuls les messages texte généraient des notifications push
- **Solution** : Ajout notifications dans `chat.controller.ts` pour endpoints voice et photo
- **Messages** : "🎤 Message vocal" et "📸 Photo"
- **Fichiers modifiés** :
  - `api/src/modules/chat/chat.controller.ts:222-237` - Notification message vocal
  - `api/src/modules/chat/chat.controller.ts:319-334` - Notification photo

**4. Verrouillage en mode portrait**
- **Android** : `android/app/src/main/AndroidManifest.xml` - `android:screenOrientation="portrait"`
- **iOS** : `ios/App/App/Info.plist` - Suppression orientations paysage, gardé uniquement portrait

**5. Fix freeze de l'introduction sur iOS**
- **Problème** : L'animation NetworkAnimation avec Canvas causait des freezes (780 calculs/frame)
- **Solution** : Désactivation sur plateformes natives avec `!Capacitor.isNativePlatform()`
- **Fichier** : `app/src/pages/Introduction.tsx`

#### Site vitrine alterdating.com

**1. Création du site vitrine responsive**
- **Objectif** : Site pour compléter les URLs requises par App Store et Play Store (CGU, CGV, confidentialité)
- **Structure** :
  - `web/css/style.css` - Design system reprenant les couleurs et styles de l'app
  - `web/images/` - Assets du site
  - `web/*.html` - Pages (accueil, CGU, CGV, confidentialité, contact)
  - `web/server.js` - Serveur Express minimal pour déploiement Railway
  - `web/package.json` - Configuration Node.js pour Railway
  - `web/railway.toml` - Configuration Railway
- **Design** :
  - Variables CSS identiques à l'app (--color-primary: #ef4444, --color-secondary: #d946ef)
  - Typographie : Sora (titres) + Inter (texte)
  - Responsive mobile-first avec breakpoints
  - Dégradés de couleurs matching l'app
  - Composants réutilisables (boutons, cards, formulaires)
- **Déploiement** :
  - Service séparé sur Railway avec Root Directory: `web`
  - Domaine personnalisé: `alterdating.com`
  - Voir `web/RAILWAY_DEPLOY.md` pour le guide complet

## Support et contact

Pour toute question ou problème :
- Consulter la documentation dans les dossiers `/app` et `/api`
- Vérifier les README spécifiques à chaque module
- Créer une issue sur le repository Git

---

**Dernière mise à jour** : Janvier 2025
**Version** : 1.0.1

- ne fais pas de git
- ne fais plus de git add, commit et push
- mets toutes les docs dans un répertoire /docs
- evite de créer des docs à tout va
- mets les docs existant et futur dans le répertoires docs
- Toujours mettre en place le i18n
- Ne créé pas une doc à chaque changement. Met seulement dans le claude.md les informations qui te permettront de retrouver le contexte de l'app plus rapidement