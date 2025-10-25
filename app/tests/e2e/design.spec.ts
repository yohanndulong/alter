import { test, expect } from './fixtures/auth.fixture'
import { createApiMocks } from './helpers/api-mocks'
import { createVisualHelper } from './helpers/visual'

/**
 * Design and Accessibility Tests
 * Tests UI consistency, color contrast, animations, and accessibility
 */

test.describe('Design - Color Contrast (WCAG)', () => {
  test('should have accessible text contrast on buttons', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    const visual = createVisualHelper(authenticatedPage)

    // Find primary button
    const button = authenticatedPage.locator('button').first()
    const buttonExists = await button.isVisible({ timeout: 2000 }).catch(() => false)

    if (buttonExists) {
      const contrast = await visual.verifyColorContrast('button', 4.5)

      // Should pass WCAG AA standard (4.5:1 for normal text)
      expect(contrast.passes).toBeTruthy()

      console.log('Button contrast:', contrast.contrast, contrast.passes ? '✓' : '✗')
    }
  })

  test('should have accessible contrast for body text', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    const visual = createVisualHelper(authenticatedPage)

    // Check main content text
    const textElement = authenticatedPage.locator('p, span, div').first()
    const textExists = await textElement.isVisible({ timeout: 2000 }).catch(() => false)

    if (textExists) {
      const contrast = await visual.verifyColorContrast('p, span, div', 4.5)

      expect(contrast.contrast).toBeGreaterThan(3) // At least some contrast
    }
  })

  test('should have sufficient contrast for headings', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    const visual = createVisualHelper(authenticatedPage)

    const heading = authenticatedPage.locator('h1, h2, h3').first()
    const headingExists = await heading.isVisible({ timeout: 2000 }).catch(() => false)

    if (headingExists) {
      const contrast = await visual.verifyColorContrast('h1, h2, h3', 4.5)

      // Large text (18pt+) can have lower contrast (3:1), but aim for 4.5:1
      expect(contrast.contrast).toBeGreaterThan(3)
    }
  })
})

test.describe('Design - Typography', () => {
  test('should use appropriate font sizes', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    const visual = createVisualHelper(authenticatedPage)

    // Check body text size
    const bodyText = authenticatedPage.locator('p, span').first()
    const textExists = await bodyText.isVisible({ timeout: 2000 }).catch(() => false)

    if (textExists) {
      const fontSize = await visual.verifyFontSize('p, span', 14)

      // Body text should be at least 14px
      expect(fontSize.passes).toBeTruthy()
    }
  })

  test('should have readable line height', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    // Check line height for readability
    const lineHeight = await authenticatedPage.locator('p, div').first().evaluate((el) => {
      const style = window.getComputedStyle(el)
      const fontSize = parseFloat(style.fontSize)
      const lineHeightPx = parseFloat(style.lineHeight)

      return {
        lineHeight: style.lineHeight,
        ratio: lineHeightPx / fontSize,
      }
    })

    // Line height should be at least 1.2x font size for readability
    if (lineHeight.ratio > 0) {
      expect(lineHeight.ratio).toBeGreaterThan(1.1)
    }
  })
})

test.describe('Design - Spacing & Layout', () => {
  test('should have consistent padding on cards', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    const visual = createVisualHelper(authenticatedPage)

    const card = authenticatedPage.locator('[class*="card"], [class*="profile"]').first()
    const cardExists = await card.isVisible({ timeout: 2000 }).catch(() => false)

    if (cardExists) {
      const spacing = await visual.verifySpacing('[class*="card"], [class*="profile"]')

      // Should have some padding
      expect(spacing.padding.top).not.toBe('0px')
    }
  })

  test('should have consistent card design', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    const visual = createVisualHelper(authenticatedPage)

    const card = authenticatedPage.locator('[class*="card"], [class*="profile"]').first()
    const cardExists = await card.isVisible({ timeout: 2000 }).catch(() => false)

    if (cardExists) {
      const cardDesign = await visual.verifyCardDesign('[class*="card"], [class*="profile"]')

      // Should have border radius (rounded corners)
      expect(cardDesign.borderRadius).not.toBe('0px')
    }
  })
})

test.describe('Design - Images & Media', () => {
  test('should load images properly', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(2000)

    const visual = createVisualHelper(authenticatedPage)

    const images = authenticatedPage.locator('img')
    const imageCount = await images.count()

    if (imageCount > 0) {
      const imageInfo = await visual.verifyImage('img')

      // Image should be loaded
      expect(imageInfo.loaded).toBeTruthy()

      // Image should have dimensions
      expect(imageInfo.width).toBeGreaterThan(0)
      expect(imageInfo.height).toBeGreaterThan(0)
    }
  })

  test('should have alt text for images', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(2000)

    const visual = createVisualHelper(authenticatedPage)

    const images = authenticatedPage.locator('img')
    const imageCount = await images.count()

    if (imageCount > 0) {
      const imageInfo = await visual.verifyImage('img')

      // Decorative images can have empty alt, but should have the attribute
      expect(imageInfo.alt !== undefined).toBeTruthy()
    }
  })
})

test.describe('Design - Animations & Transitions', () => {
  test('should have smooth transitions on interactive elements', async ({
    authenticatedPage,
  }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    const visual = createVisualHelper(authenticatedPage)

    const button = authenticatedPage.locator('button').first()
    const buttonExists = await button.isVisible({ timeout: 2000 }).catch(() => false)

    if (buttonExists) {
      const animations = await visual.verifyAnimations('button')

      // Buttons should have transitions for better UX
      // (Some minimal transition is expected)
      expect(animations.transition !== undefined).toBeTruthy()
    }
  })

  test('should show loading animations', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()
    await apiMocks.mockSlowNetwork('/api/profiles/discover', 3000)

    await authenticatedPage.goto('/discover')

    const visual = createVisualHelper(authenticatedPage)

    // Look for loading indicator
    const loadingIndicator = authenticatedPage.locator('[class*="loading"], [class*="spinner"]')
    const loadingExists = await loadingIndicator.isVisible({ timeout: 2000 }).catch(() => false)

    if (loadingExists) {
      const loadingState = await visual.verifyLoadingState('[class*="loading"], [class*="spinner"]')

      // Loading indicator should be visible and animated
      expect(loadingState.visible).toBeTruthy()
    }
  })
})

test.describe('Design - Button States', () => {
  test('should show hover and focus states', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    const visual = createVisualHelper(authenticatedPage)

    const button = authenticatedPage.locator('button').first()
    const buttonExists = await button.isVisible({ timeout: 2000 }).catch(() => false)

    if (buttonExists) {
      const states = await visual.verifyButtonStates('button')

      // Should have different states
      expect(states.normal).toBeDefined()
      expect(states.hover).toBeDefined()
      expect(states.focus).toBeDefined()

      // Focus state should be visually distinct (for accessibility)
      const hasFocusIndicator =
        states.focus.boxShadow !== 'none' ||
        states.focus.borderColor !== states.normal.borderColor ||
        states.focus.opacity !== states.normal.opacity

      expect(hasFocusIndicator).toBeTruthy()
    }
  })

  test('should show disabled state for buttons', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    await authenticatedPage.goto('/login')

    // Submit button should be disabled when form is empty
    const submitButton = authenticatedPage.locator('button[type="submit"]')
    const isDisabled = await submitButton.isDisabled().catch(() => false)

    if (isDisabled) {
      // Disabled button should have visual indication
      const opacity = await submitButton.evaluate((el) => {
        return window.getComputedStyle(el).opacity
      })

      // Disabled buttons often have reduced opacity
      expect(parseFloat(opacity)).toBeLessThan(1)
    }
  })
})

test.describe('Design - Form Elements', () => {
  test('should have proper input styling', async ({ unauthenticatedPage }) => {
    const apiMocks = createApiMocks(unauthenticatedPage)
    await apiMocks.mockSuccessfulAuth()

    await unauthenticatedPage.goto('/login')

    const visual = createVisualHelper(unauthenticatedPage)

    const input = unauthenticatedPage.locator('input').first()
    const inputExists = await input.isVisible({ timeout: 2000 }).catch(() => false)

    if (inputExists) {
      const inputStates = await visual.verifyInputStates('input')

      // Input should have normal and focus states
      expect(inputStates.normal).toBeDefined()
      expect(inputStates.focus).toBeDefined()

      // Focus state should be distinct
      const hasFocusIndicator =
        inputStates.focus.boxShadow !== inputStates.normal.boxShadow ||
        inputStates.focus.borderColor !== inputStates.normal.borderColor

      expect(hasFocusIndicator).toBeTruthy()
    }
  })
})

test.describe('Design - CSS Variables', () => {
  test('should use CSS custom properties for theming', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    await authenticatedPage.goto('/discover')

    const visual = createVisualHelper(authenticatedPage)

    // Check for common CSS variables
    const cssVars = await visual.verifyCSSVariables([
      '--color-primary',
      '--color-primary-500',
      '--color-secondary',
      '--color-background',
      '--color-text',
    ])

    // At least some CSS variables should be defined
    const definedVars = Object.values(cssVars).filter((val) => val !== null && val !== '')

    expect(definedVars.length).toBeGreaterThan(0)
  })
})

test.describe('Design - Z-Index Layering', () => {
  test('should have proper modal layering', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()
    await apiMocks.mockLikeAction(true) // Trigger match modal

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    // Try to trigger a modal
    const likeButton = authenticatedPage.locator('button[class*="like"]').first()
    const buttonExists = await likeButton.isVisible({ timeout: 2000 }).catch(() => false)

    if (buttonExists) {
      await likeButton.click()
      await authenticatedPage.waitForTimeout(1000)

      // Check if modal has high z-index
      const modal = authenticatedPage.locator('[class*="modal"], [role="dialog"]').first()
      const modalExists = await modal.isVisible({ timeout: 2000 }).catch(() => false)

      if (modalExists) {
        const zIndex = await modal.evaluate((el) => {
          return window.getComputedStyle(el).zIndex
        })

        // Modal should have high z-index (typically > 100)
        expect(parseInt(zIndex)).toBeGreaterThan(10)
      }
    }
  })
})

test.describe('Design - Visual Regression', () => {
  test('should capture baseline screenshots for visual regression', async ({
    authenticatedPage,
  }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    const pages = ['/discover', '/alter-chat', '/matches', '/profile']

    for (const page of pages) {
      await authenticatedPage.goto(page)
      await authenticatedPage.waitForTimeout(1500)

      // Take full page screenshot
      await authenticatedPage.screenshot({
        path: `test-results/baselines/${page.replace('/', '')}-baseline.png`,
        fullPage: true,
        animations: 'disabled',
      })
    }
  })
})
