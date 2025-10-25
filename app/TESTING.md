# 🧪 Guide de Tests Playwright - Quick Start

## 🚀 Démarrage Rapide (5 minutes)

### 1. Installation

```bash
cd app

# Installer Playwright (déjà installé dans package.json)
npm install

# Installer les navigateurs Chromium
npm run test:install
```

### 2. Premier test

```bash
# Lancer tous les tests
npm test

# Ou lancer avec l'UI interactive (recommandé)
npm run test:ui
```

C'est tout ! 🎉

---

## 📖 Commandes Essentielles

### Tests basiques

```bash
npm test                    # Tous les tests
npm run test:ui             # Interface interactive (⭐ recommandé)
npm run test:headed         # Voir les navigateurs
npm run test:debug          # Mode debug
npm run test:report         # Voir le rapport
```

### Tests par fonctionnalité

```bash
npm run test:auth           # Authentification
npm run test:alter-chat     # Chat ALTER
npm run test:discover       # Page découverte
npm run test:responsive     # Tests responsive
npm run test:design         # Design & accessibilité
```

### Tests par device

```bash
npm run test:chromium       # Desktop
npm run test:mobile         # Mobile (iPhone)
npm run test:tablet         # Tablet (iPad)
```

---

## 🎯 Ce qui est testé

### ✅ Fonctionnalités

- [x] Login / Authentification (SMS)
- [x] Chat avec ALTER AI
- [x] Découverte de profils
- [x] Like / Pass / Swipe
- [x] Matches & Messages
- [x] Navigation

### 📱 Responsive

- [x] Mobile (iPhone SE, 14 Pro, Pixel 7, Galaxy S23)
- [x] Tablet (iPad, iPad Pro)
- [x] Desktop (1920x1080, 1366x768)
- [x] Orientation (portrait/landscape)

### 🎨 Design & Accessibilité

- [x] Contraste des couleurs (WCAG AA)
- [x] Taille des polices
- [x] Touch targets (44x44px min)
- [x] Alt text sur images
- [x] Focus states
- [x] Animations

### 🔥 Cas d'erreur

- [x] Erreurs serveur (500)
- [x] Réseau lent
- [x] Hors ligne
- [x] Timeouts
- [x] États vides
- [x] Code invalide/expiré

---

## 🎭 Mocks d'API

Tous les tests utilisent des mocks pour être **rapides** et **déterministes**.

### Scénarios disponibles :

```typescript
// ✅ Succès
mockSuccessfulAuth()        // Login OK
mockDiscoverProfiles()      // Profils à swiper
mockAlterChat()             // Messages ALTER
mockLikeAction(true)        // Match! 💑

// 📭 États vides
mockEmptyDiscover()         // Pas de profils

// ❌ Erreurs
mockAuthError('invalid_code')
mockNetworkError('/api/...')
mockTimeout('/api/...', 5000)
mockSlowNetwork('/api/...', 3000)
```

---

## 📸 Screenshots & Vidéos

Les tests capturent automatiquement :

- **Screenshots** lors des échecs
- **Vidéos** des tests échoués
- **Traces** pour le debugging

Voir les résultats dans :
```
test-results/          # Screenshots & vidéos
playwright-report/     # Rapport HTML
```

---

## 🐛 Debugging

### Mode interactif (recommandé)

```bash
npm run test:ui
```

Permet de :
- 👀 Voir les tests en direct
- ⏯️ Mettre en pause / relancer
- 🔍 Inspecter les éléments
- 📸 Voir les screenshots
- 🎥 Rejouer les vidéos

### Mode debug

```bash
npm run test:debug

# Ou un test spécifique
npx playwright test tests/e2e/auth.spec.ts --debug
```

---

## 💡 Exemples de Tests

### Tester une nouvelle page

```typescript
import { test, expect } from './fixtures/auth.fixture'
import { createApiMocks } from './helpers/api-mocks'

test('ma nouvelle page', async ({ authenticatedPage }) => {
  // Setup des mocks
  const apiMocks = createApiMocks(authenticatedPage)
  await apiMocks.mockStandardSession()

  // Navigation
  await authenticatedPage.goto('/ma-page')

  // Assertions
  await expect(authenticatedPage.locator('h1')).toBeVisible()

  // Screenshot
  await authenticatedPage.screenshot({ path: 'test-results/ma-page.png' })
})
```

### Tester le responsive

```typescript
import { createResponsiveHelper } from './helpers/responsive'

test('responsive', async ({ page }) => {
  const responsive = createResponsiveHelper(page)

  // Mobile
  await responsive.setViewport('mobile')
  await page.goto('/discover')
  // ... vérifications

  // Tablet
  await responsive.setViewport('tablet')
  // ... vérifications

  // Desktop
  await responsive.setViewport('desktop')
  // ... vérifications
})
```

### Tester le design

```typescript
import { createVisualHelper } from './helpers/visual'

test('design', async ({ page }) => {
  const visual = createVisualHelper(page)

  await page.goto('/discover')

  // Vérifier le contraste
  const contrast = await visual.verifyColorContrast('button', 4.5)
  expect(contrast.passes).toBeTruthy()

  // Vérifier la taille de police
  const fontSize = await visual.verifyFontSize('p', 16)
  expect(fontSize.passes).toBeTruthy()
})
```

---

## 🚀 CI/CD

Les tests s'exécutent automatiquement sur GitHub Actions pour chaque push/PR.

Voir : `.github/workflows/playwright.yml`

---

## 📚 Documentation Complète

Pour plus de détails, voir : `tests/README.md`

---

## ❓ FAQ

### Les tests sont lents ?

```bash
# Utiliser un seul navigateur
npm run test:chromium

# Tester une seule fonctionnalité
npm run test:auth
```

### Erreur "Browser not found" ?

```bash
npm run test:install
```

### Les tests échouent en local mais pas en CI ?

Vérifier :
- Les mocks d'API sont bien utilisés
- Les timeouts sont suffisants
- Pas de dépendance à des données externes

### Comment ajouter un nouveau test ?

1. Créer un fichier `*.spec.ts` dans `tests/e2e/`
2. Importer les fixtures et helpers
3. Écrire les tests
4. Lancer `npm test`

---

## 🎓 Ressources

- [Documentation Playwright](https://playwright.dev)
- [Tests README complet](tests/README.md)
- [Best Practices](https://playwright.dev/docs/best-practices)

---

**Happy Testing! 🧪✨**
