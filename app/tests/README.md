# 🧪 Suite de Tests E2E Playwright - Alter App

Cette suite de tests complète couvre tous les aspects de l'application Alter avec Playwright.

## 📋 Table des Matières

- [Installation](#installation)
- [Exécution des Tests](#exécution-des-tests)
- [Structure des Tests](#structure-des-tests)
- [Types de Tests](#types-de-tests)
- [Mocks d'API](#mocks-dapi)
- [Tests Responsive](#tests-responsive)
- [Tests de Design](#tests-de-design)
- [CI/CD](#cicd)

## 🚀 Installation

### Prérequis

- Node.js 18+
- npm ou yarn

### Installation des dépendances

```bash
# Installer les dépendances du projet
npm install

# Installer les navigateurs Playwright
npm run test:install
# ou
npx playwright install
```

## ▶️ Exécution des Tests

### Commandes de base

```bash
# Exécuter tous les tests
npm test

# Exécuter avec l'interface UI (recommandé pour le développement)
npm run test:ui

# Exécuter en mode debug
npm run test:debug

# Exécuter avec les navigateurs visibles
npm run test:headed

# Afficher le rapport de tests
npm run test:report
```

### Tests par catégorie

```bash
# Tests d'authentification
npm run test:auth

# Tests du chat ALTER
npm run test:alter-chat

# Tests de la page Discover
npm run test:discover

# Tests responsive (tous les viewports)
npm run test:responsive

# Tests de design et accessibilité
npm run test:design
```

### Tests par device

```bash
# Desktop uniquement
npm run test:chromium

# Mobile uniquement
npm run test:mobile

# Tablet uniquement
npm run test:tablet
```

## 📁 Structure des Tests

```
tests/
├── e2e/
│   ├── fixtures/
│   │   ├── auth.fixture.ts      # Fixtures d'authentification
│   │   └── mock-data.ts          # Données de mock centralisées
│   │
│   ├── helpers/
│   │   ├── api-mocks.ts          # Helpers pour mocker l'API
│   │   ├── responsive.ts         # Helpers pour tests responsive
│   │   └── visual.ts             # Helpers pour tests visuels
│   │
│   ├── auth.spec.ts              # Tests d'authentification
│   ├── alter-chat.spec.ts        # Tests du chat ALTER
│   ├── discover.spec.ts          # Tests de découverte de profils
│   ├── responsive.spec.ts        # Tests responsive multi-viewports
│   └── design.spec.ts            # Tests de design et accessibilité
│
└── README.md
```

## 🎯 Types de Tests

### 1. Tests Fonctionnels

**Fichier:** `auth.spec.ts`, `alter-chat.spec.ts`, `discover.spec.ts`

- ✅ Login / Authentification
- ✅ Envoi et vérification de code
- ✅ Navigation entre pages
- ✅ Interactions utilisateur (like, pass, swipe)
- ✅ Chat avec ALTER AI
- ✅ Envoi de messages
- ✅ Sélection d'options

### 2. Tests d'Erreurs et Cas Limites

**Fichiers:** Tous les fichiers `*.spec.ts`

- ❌ Erreurs serveur (500)
- ❌ Erreurs réseau (offline)
- ⏱️ Timeouts
- 🐌 Réseau lent
- 📭 États vides (no profiles, no messages)
- 🔐 Code invalide/expiré

### 3. Tests Responsive

**Fichier:** `responsive.spec.ts`

Viewports testés :
- 📱 Mobile (iPhone SE, iPhone 14 Pro, Pixel 7, Galaxy S23)
- 📱 Mobile Large (iPhone 11 Pro Max)
- 📊 Tablet (iPad, iPad Mini, iPad Pro)
- 💻 Desktop (1920x1080, 1366x768)

Tests effectués :
- ✅ Affichage correct sur tous les viewports
- ✅ Navigation mobile vs desktop
- ✅ Touch targets (minimum 44x44px)
- ✅ Orientation (portrait/landscape)
- ✅ Gestes de swipe
- ✅ Pas de scroll horizontal

### 4. Tests de Design et Accessibilité

**Fichier:** `design.spec.ts`

- 🎨 **Contraste des couleurs** (WCAG AA - 4.5:1)
- 📝 **Typographie** (tailles de police, line-height)
- 📏 **Espacement** (padding, margin)
- 🖼️ **Images** (chargement, alt text)
- ✨ **Animations** (transitions, loading states)
- 🔘 **États des boutons** (hover, focus, disabled)
- 📋 **Formulaires** (input states, validation)
- 🎯 **Z-index** (modals, overlays)

## 🎭 Mocks d'API

### Utilisation des mocks

```typescript
import { createApiMocks } from './helpers/api-mocks'

test('mon test', async ({ authenticatedPage }) => {
  const apiMocks = createApiMocks(authenticatedPage)

  // Mock de session standard (auth + discover + matches)
  await apiMocks.mockStandardSession()

  // Mock de scénarios spécifiques
  await apiMocks.mockAlterChat()
  await apiMocks.mockLikeAction(true) // it's a match!
  await apiMocks.mockEmptyDiscover()

  // Mock d'erreurs
  await apiMocks.mockAuthError('invalid_code')
  await apiMocks.mockTimeout('/api/chat', 5000)
  await apiMocks.mockNetworkError('/api/profiles')
  await apiMocks.mockSlowNetwork('/api/discover', 3000)
})
```

### Scénarios disponibles

#### Authentification
- ✅ `mockSuccessfulAuth()` - Login réussi
- ❌ `mockAuthError()` - Code invalide, expiré, erreur serveur

#### Discover
- ✅ `mockDiscoverProfiles()` - Profils à swiper
- 📭 `mockEmptyDiscover()` - Aucun profil disponible
- ❤️ `mockLikeAction(isMatch)` - Like avec/sans match

#### Chat ALTER
- 💬 `mockAlterChat()` - Messages ALTER
- 📊 `mockAlterChatStreaming()` - Streaming en temps réel

#### Matches & Chat
- 💑 `mockMatches()` - Liste des matchs
- 💬 `mockChatMessages()` - Messages d'un chat

#### Réseau
- 🐌 `mockSlowNetwork()` - Réseau lent (latence)
- ❌ `mockNetworkError()` - Hors ligne
- ⏱️ `mockTimeout()` - Timeout de requête

## 📱 Tests Responsive

### Helpers disponibles

```typescript
import { createResponsiveHelper } from './helpers/responsive'

test('test responsive', async ({ page }) => {
  const responsive = createResponsiveHelper(page)

  // Changer de viewport
  await responsive.setViewport('mobile')

  // Tester la visibilité sur différents viewports
  const visibility = await responsive.testElementVisibilityAcrossViewports(
    '.my-element',
    ['mobile', 'tablet', 'desktop']
  )

  // Capturer des screenshots sur plusieurs viewports
  await responsive.screenshotAcrossViewports('my-page')

  // Tester les gestes de swipe
  await responsive.testSwipeGesture('.card', 'right')

  // Vérifier la taille des touch targets
  const touchTarget = await responsive.verifyTouchTargetSize('button')
  expect(touchTarget.valid).toBeTruthy()

  // Tester l'orientation
  await responsive.testOrientation()
})
```

## 🎨 Tests de Design

### Helpers visuels

```typescript
import { createVisualHelper } from './helpers/visual'

test('test design', async ({ page }) => {
  const visual = createVisualHelper(page)

  // Vérifier le contraste WCAG
  const contrast = await visual.verifyColorContrast('button', 4.5)
  expect(contrast.passes).toBeTruthy()

  // Vérifier la taille de police
  const fontSize = await visual.verifyFontSize('p', 16)
  expect(fontSize.passes).toBeTruthy()

  // Vérifier le chargement d'image
  const image = await visual.verifyImage('img')
  expect(image.loaded).toBeTruthy()
  expect(image.hasAlt).toBeTruthy()

  // Vérifier les animations
  const animations = await visual.verifyAnimations('.loading')
  expect(animations.hasAnimation).toBeTruthy()

  // Vérifier les états des boutons
  const buttonStates = await visual.verifyButtonStates('button')
  expect(buttonStates.hover).toBeDefined()
  expect(buttonStates.focus).toBeDefined()
})
```

## 🔧 Configuration Avancée

### Variables d'environnement

```bash
# Base URL de l'application (par défaut: http://localhost:5173)
PLAYWRIGHT_BASE_URL=http://localhost:3000

# Mode CI (retries activés)
CI=true
```

### Personnaliser la configuration

Modifiez `playwright.config.ts` pour :
- Ajouter des navigateurs
- Changer les timeouts
- Configurer les reporters
- Ajouter des viewports personnalisés

## 🚀 CI/CD

### GitHub Actions

```yaml
name: Playwright Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
      - name: Run tests
        run: npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 📊 Rapports de Tests

### HTML Report

Après l'exécution des tests :

```bash
npm run test:report
```

Le rapport HTML inclut :
- ✅ Résultats par test
- 📸 Screenshots d'échecs
- 🎥 Vidéos de tests échoués
- 📊 Statistiques globales
- 🕒 Traces d'exécution

### JSON Report

Les résultats sont aussi disponibles en JSON :
```
test-results.json
```

## 🐛 Debugging

### Mode Debug

```bash
# Debug un test spécifique
npm run test:debug -- tests/e2e/auth.spec.ts

# Debug avec le Playwright Inspector
npx playwright test --debug
```

### Screenshots et Vidéos

- **Screenshots** : Capturés automatiquement en cas d'échec
- **Vidéos** : Enregistrées pour les tests échoués
- **Traces** : Disponibles via `playwright show-trace`

### Logs

```bash
# Activer les logs détaillés
DEBUG=pw:api npm test
```

## 📝 Bonnes Pratiques

1. **Toujours mocker l'API** pour des tests rapides et déterministes
2. **Tester sur plusieurs viewports** pour le responsive
3. **Vérifier l'accessibilité** (contraste, alt text, focus states)
4. **Utiliser les fixtures** pour l'authentification
5. **Capturer des screenshots** pour la régression visuelle
6. **Tester les cas d'erreur** autant que les cas de succès
7. **Attendre les éléments** avec `waitForTimeout` ou `waitForSelector`
8. **Nettoyer les mocks** entre les tests

## 🆘 Troubleshooting

### Les tests échouent en CI

- Vérifier que les navigateurs sont installés : `npx playwright install --with-deps`
- Augmenter les timeouts dans `playwright.config.ts`
- Vérifier les variables d'environnement

### Problèmes de timing

- Augmenter `waitForTimeout`
- Utiliser `waitForLoadState('networkidle')`
- Vérifier les animations avec `{ animations: 'disabled' }`

### Screenshots vides

- Attendre que le contenu soit chargé avant le screenshot
- Utiliser `{ fullPage: true }` pour la page complète

## 📚 Ressources

- [Documentation Playwright](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)

---

**Créé avec ❤️ pour Alter App**
