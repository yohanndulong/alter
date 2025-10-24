# ALTER - AI-Powered Dating App

ALTER est une application de rencontre innovante propulsée par un agent matrimonial IA qui aide les utilisateurs à trouver leur partenaire idéal grâce à une compréhension approfondie de leurs préférences et de leur personnalité.

## 🎨 Fonctionnalités

### Authentification & Sécurité
- Inscription et connexion sécurisées
- Vérification par email
- Réinitialisation de mot de passe
- Gestion des sessions avec JWT

### Onboarding Dynamique
- Questionnaire dynamique fourni par l'API
- Types de questions variés : texte, choix unique/multiple, date, nombre, slider
- Progression visuelle
- Validation des réponses

### Agent IA "Alter"
- Chat interactif pour apprendre à connaître l'utilisateur
- Questions personnalisées basées sur les réponses
- Options de réponse rapides
- Interface conversationnelle fluide

### Matching & Découverte
- Profils détaillés avec photos, bio et centres d'intérêt
- Score de compatibilité basé sur 4 critères
- Swipe pour liker ou passer
- Notification de match avec animation
- Liste des personnes intéressées

### Messagerie
- Chat en temps réel avec les matchs
- Indicateurs de statut (en ligne, vu)
- Historique des conversations
- Compteur de messages non lus

### Profil Utilisateur
- Modification des informations
- Gestion des photos
- Paramètres (langue, thème, notifications)
- Préférences de recherche

## 🛠️ Stack Technique

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: CSS vanilla avec design system
- **i18n**: i18next + react-i18next
- **Animation**: Framer Motion
- **State Management**: React Context API
- **API Mocking**: MSW (Mock Service Worker)
- **Code Quality**: ESLint + Prettier

## 📦 Structure du Projet

```
src/
├── components/          # Composants réutilisables
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── ProfileCard.tsx
│   ├── Modal.tsx
│   ├── Toast.tsx
│   └── index.ts
├── contexts/            # Contexts React
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── hooks/               # Hooks personnalisés
│   ├── useToast.ts
│   ├── useLocalStorage.ts
│   └── index.ts
├── i18n/                # Internationalisation
│   ├── index.ts
│   └── locales/
│       ├── en.json
│       └── fr.json
├── pages/               # Pages de l'application
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Onboarding.tsx
│   ├── AlterChat.tsx
│   ├── Discover.tsx
│   ├── Matches.tsx
│   ├── Chat.tsx
│   └── Profile.tsx
├── services/            # Services API
│   ├── api.ts
│   ├── onboarding.ts
│   ├── matching.ts
│   └── chat.ts
├── mocks/               # API Mocks (MSW)
│   ├── handlers/
│   ├── data/
│   └── index.ts
├── styles/              # Styles globaux
│   └── design-system.css
├── types/               # Types TypeScript
│   └── index.ts
├── App.tsx              # Composant principal
└── main.tsx             # Point d'entrée
```

## 🚀 Démarrage

### Prérequis

- Node.js 18+
- npm ou yarn

### Installation

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Configurer les variables d'environnement dans .env
VITE_API_URL=http://localhost:3000/api
VITE_ENABLE_MOCKS=true
```

### Développement

```bash
# Lancer le serveur de développement
npm run dev

# Le site sera accessible sur http://localhost:5173
```

### Build

```bash
# Construire pour la production
npm run build

# Construire pour staging (avec mocks activés)
npm run build:staging

# Preview du build
npm run preview
```

### API Mocks

L'application utilise [MSW](https://mswjs.io/) pour mocker l'API en développement et sur staging.

**Activation des mocks** :

Les mocks sont activés via la variable d'environnement `VITE_ENABLE_MOCKS` :

- **Développement** : Les mocks sont activés par défaut (`.env`)
- **Staging** : Utiliser `npm run build:staging` pour activer les mocks
- **Production** : Les mocks sont désactivés par défaut

**Configuration** :

```bash
# .env (développement)
VITE_ENABLE_MOCKS=true

# .env.staging (staging)
VITE_ENABLE_MOCKS=true
```

**Routes mockées** :
- `/api/auth/*` - Authentification
- `/api/onboarding/*` - Onboarding
- `/api/chat/*` - Chat et messages
- `/api/matching/*` - Découverte et matching

### Linting & Formatting

```bash
# Linter le code
npm run lint

# Formater le code
npm run format
```

## 📱 Android / Capacitor

L'application utilise [Capacitor](https://capacitorjs.com/) pour créer une version native Android.

### Configuration

- **Package ID**: `com.alter.dating`
- **Nom**: Alter - Dating App

### Build Android

```bash
# Synchroniser les assets web avec Android
npm run android:sync

# Ouvrir le projet dans Android Studio
npm run android:open

# Construire un APK de release signé (production)
npm run android:build

# Construire un APK de release signé (staging avec mocks)
npm run android:build:staging

# Construire un AAB pour le Play Store (production) - RECOMMANDÉ
npm run android:bundle

# Construire un AAB pour le Play Store (staging avec mocks)
npm run android:bundle:staging

# Lancer l'app sur un appareil/émulateur
npm run android:run
```

**Fichiers générés** :
- APK : `android/app/build/outputs/apk/release/app-release.apk`
- AAB : `android/app/build/outputs/bundle/release/app-release.aab` (recommandé pour le Play Store)

### Déploiement sur Play Store

Pour déployer l'application sur le Google Play Store, consultez le guide détaillé dans [DEPLOY.md](./DEPLOY.md).

**Informations importantes** :
- Le keystore de signature est dans `android/alter-release-key.keystore`
- Les credentials sont documentés dans `keystore-info.txt` (gitignored)
- ⚠️ Ne jamais perdre le keystore ! Sauvegardez-le dans un endroit sécurisé.

## 🎨 Design System

### Couleurs

- **Primary**: Rouge-rose (utilisé pour les CTAs principaux)
- **Secondary**: Violet-magenta (utilisé pour les accents)
- **Accent**: Orange (utilisé pour les highlights)
- **Neutral**: Échelle de gris pour le texte et les backgrounds

### Mode Sombre

L'application supporte un mode sombre qui s'adapte automatiquement en fonction des préférences système et peut être basculé manuellement.

### Typographie

- **Font Family**: Système (San Francisco, Segoe UI, Roboto, etc.)
- **Échelle**: De xs (12px) à 5xl (48px)
- **Weights**: Normal (400), Medium (500), Semibold (600), Bold (700)

### Spacing

Système de spacing basé sur des multiples de 4px (de 0 à 96px).

### Animations

- **Transitions**: Fast (150ms), Base (200ms), Slow (300ms)
- **Micro-interactions**: Sur les boutons, cartes, modals
- **Animations de page**: Slide-in, fade-in

## 🌍 Internationalisation

L'application supporte actuellement :
- 🇫🇷 Français
- 🇬🇧 Anglais

Pour ajouter une langue :
1. Créer un fichier dans `src/i18n/locales/`
2. Ajouter la langue dans `src/i18n/index.ts`

## 🔐 Sécurité

- Authentification JWT
- Protection des routes
- Validation des entrées utilisateur
- Headers de sécurité

## 📱 Responsive Design

L'application est entièrement responsive et optimisée pour :
- Mobile (< 640px)
- Tablette (640px - 1024px)
- Desktop (> 1024px)

## 🧪 Tests

```bash
# Lancer les tests (à implémenter)
npm run test
```

## 📄 Licence

Propriétaire - Tous droits réservés

## 👥 Contribution

Ce projet est actuellement privé. Pour toute question, contactez l'équipe de développement.

---

Développé avec ❤️ par l'équipe ALTER