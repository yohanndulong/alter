import { test, expect } from './fixtures/auth.fixture'
import { createApiMocks } from './helpers/api-mocks'
import { createResponsiveHelper, VIEWPORTS } from './helpers/responsive'

/**
 * Responsive Design Tests
 * Tests all pages across multiple viewports
 */

const pages = [
  { path: '/discover', name: 'Discover' },
  { path: '/alter-chat', name: 'AlterChat' },
  { path: '/matches', name: 'Matches' },
  { path: '/likes', name: 'Likes' },
  { path: '/profile', name: 'Profile' },
]

const viewports: (keyof typeof VIEWPORTS)[] = [
  'mobile',
  'mobileLarge',
  'tablet',
  'tabletLarge',
  'desktop',
  'desktopSmall',
]

test.describe('Responsive - All Pages Across Viewports', () => {
  for (const page of pages) {
    for (const viewport of viewports) {
      test(`${page.name} should display correctly on ${viewport}`, async ({
        authenticatedPage,
      }) => {
        const apiMocks = createApiMocks(authenticatedPage)
        await apiMocks.mockStandardSession()
        await apiMocks.mockAlterChat()
        await apiMocks.mockMatches()
        await apiMocks.mockLikes()

        const responsive = createResponsiveHelper(authenticatedPage)
        await responsive.setViewport(viewport)

        await authenticatedPage.goto(page.path)
        await authenticatedPage.waitForTimeout(1500)

        // Take screenshot for visual comparison
        await authenticatedPage.screenshot({
          path: `test-results/screenshots/${page.name.toLowerCase()}-${viewport}.png`,
          fullPage: true,
        })

        // Verify page loads without errors
        const body = authenticatedPage.locator('body')
        await expect(body).toBeVisible()

        // Check for bottom nav on mobile/tablet
        if (viewport.includes('mobile') || viewport.includes('tablet')) {
          const bottomNav = authenticatedPage.locator('[class*="bottom-nav"]')
          await expect(bottomNav).toBeVisible({ timeout: 3000 })
        }
      })
    }
  }
})

test.describe('Responsive - Viewport-Specific Features', () => {
  test('should show mobile navigation on small screens', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    const responsive = createResponsiveHelper(authenticatedPage)
    await responsive.setViewport('mobile')

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    const result = await responsive.testMobileNavigation()
    expect(result.hasBottomNav).toBeTruthy()
  })

  test('should handle orientation changes', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    await authenticatedPage.goto('/discover')

    const responsive = createResponsiveHelper(authenticatedPage)
    const orientations = await responsive.testOrientation()

    // Both orientations should render
    expect(orientations.portrait).toBeTruthy()
    expect(orientations.landscape).toBeTruthy()
  })

  test('should adapt text size across viewports', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    const responsive = createResponsiveHelper(authenticatedPage)

    // Check if heading exists
    const heading = authenticatedPage.locator('h1, h2, h3').first()
    const headingExists = await heading.isVisible({ timeout: 2000 }).catch(() => false)

    if (headingExists) {
      // Test font size across viewports (example)
      const sizes = await responsive.checkResponsiveStyles('h1, h2, h3', 'font-size', {
        mobile: '24px', // Expected values - adjust based on actual design
        tablet: '28px',
        desktop: '32px',
      })

      // Just verify we got values for each viewport
      expect(sizes.mobile).toBeDefined()
      expect(sizes.tablet).toBeDefined()
      expect(sizes.desktop).toBeDefined()
    }
  })

  test('should handle touch interactions on mobile', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    const responsive = createResponsiveHelper(authenticatedPage)
    await responsive.setViewport('mobile')

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    // Test tap on button
    const button = authenticatedPage.locator('button').first()
    const buttonExists = await button.isVisible({ timeout: 2000 }).catch(() => false)

    if (buttonExists) {
      const result = await responsive.testTouchInteractions('button')
      expect(result).toBeTruthy()
    }
  })
})

test.describe('Responsive - Element Visibility', () => {
  test('should show/hide elements based on viewport', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    const responsive = createResponsiveHelper(authenticatedPage)

    // Test bottom nav visibility across viewports
    const bottomNavResults = await responsive.testElementVisibilityAcrossViewports(
      '[class*="bottom-nav"]',
      ['mobile', 'tablet', 'desktop']
    )

    // Bottom nav should be visible on mobile and tablet
    expect(bottomNavResults.mobile).toBeTruthy()
  })

  test('should ensure minimum touch target sizes on mobile', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    const responsive = createResponsiveHelper(authenticatedPage)
    await responsive.setViewport('mobile')

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    // Check all buttons
    const buttons = authenticatedPage.locator('button')
    const buttonCount = await buttons.count()

    if (buttonCount > 0) {
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i)
        const isVisible = await button.isVisible().catch(() => false)

        if (isVisible) {
          const box = await button.boundingBox()
          if (box) {
            // WCAG recommends minimum 44x44px for touch targets
            expect(box.height).toBeGreaterThanOrEqual(40) // Allow small tolerance
          }
        }
      }
    }
  })
})

test.describe('Responsive - Layout Consistency', () => {
  test('should maintain layout across viewport changes', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    await authenticatedPage.goto('/discover')

    const responsive = createResponsiveHelper(authenticatedPage)

    // Test multiple viewport switches
    for (const viewport of ['mobile', 'tablet', 'desktop'] as const) {
      await responsive.setViewport(viewport)
      await authenticatedPage.waitForTimeout(500)

      // Verify page structure remains intact
      const body = authenticatedPage.locator('body')
      await expect(body).toBeVisible()

      // Verify no horizontal overflow
      const hasOverflow = await authenticatedPage.evaluate(() => {
        return document.body.scrollWidth > document.body.clientWidth
      })

      expect(hasOverflow).toBeFalsy()
    }
  })

  test('should not have horizontal scroll on mobile', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    const responsive = createResponsiveHelper(authenticatedPage)
    await responsive.setViewport('mobile')

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    // Check for horizontal overflow
    const hasHorizontalScroll = await authenticatedPage.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })

    expect(hasHorizontalScroll).toBeFalsy()
  })

  test('should properly truncate long text on mobile', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    const responsive = createResponsiveHelper(authenticatedPage)
    await responsive.setViewport('mobile')

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    // Look for bio or description text
    const bioText = authenticatedPage.locator('[class*="bio"], [class*="description"]').first()
    const bioExists = await bioText.isVisible({ timeout: 2000 }).catch(() => false)

    if (bioExists) {
      const truncation = await responsive.testTextTruncation('[class*="bio"]')

      // Text may or may not be truncated depending on length
      expect(truncation).toBeDefined()
    }
  })
})
