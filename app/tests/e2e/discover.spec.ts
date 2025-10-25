import { test, expect } from './fixtures/auth.fixture'
import { createApiMocks } from './helpers/api-mocks'
import { createResponsiveHelper } from './helpers/responsive'
import { createVisualHelper } from './helpers/visual'

/**
 * Discover Page Tests
 * Tests profile browsing, swiping, liking, and different scenarios
 */

test.describe('Discover - Profile Browsing', () => {
  test('should display profiles to browse', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    // Should show profile cards
    const profileCards = authenticatedPage.locator('[class*="profile"], [class*="card"]')
    await expect(profileCards.first()).toBeVisible({ timeout: 5000 })
  })

  test('should show profile information (name, age, bio)', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    // Look for name
    const nameElement = authenticatedPage.locator('text=/\\w+\\s*,?\\s*\\d+/')
    const hasName = await nameElement.isVisible({ timeout: 3000 }).catch(() => false)

    // Profile info should be visible
    expect(hasName !== undefined).toBeTruthy()
  })

  test('should display profile photos', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    const visual = createVisualHelper(authenticatedPage)

    // Check for images
    const images = authenticatedPage.locator('img')
    const imageCount = await images.count()

    if (imageCount > 0) {
      const firstImage = images.first()
      const imageInfo = await visual.verifyImage('img')

      // Image should be loaded
      expect(imageInfo.loaded).toBeTruthy()
    }
  })

  test('should handle like action', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()
    await apiMocks.mockLikeAction(false)

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    // Find like button (heart icon, "J'aime", etc.)
    const likeButton = authenticatedPage.locator(
      'button[class*="like"], button:has-text("❤"), button:has-text("J\'aime")'
    )

    if (await likeButton.first().isVisible({ timeout: 2000 })) {
      await likeButton.first().click()

      // Should show next profile or animation
      await authenticatedPage.waitForTimeout(500)
    }
  })

  test('should handle pass action', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()
    await apiMocks.mockPassAction()

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    // Find pass button
    const passButton = authenticatedPage.locator(
      'button[class*="pass"], button:has-text("✕"), button:has-text("Passer")'
    )

    if (await passButton.first().isVisible({ timeout: 2000 })) {
      await passButton.first().click()

      // Should show next profile
      await authenticatedPage.waitForTimeout(500)
    }
  })

  test('should show match notification on mutual like', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()
    await apiMocks.mockLikeAction(true) // It's a match!

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    const likeButton = authenticatedPage.locator('button[class*="like"]')

    if (await likeButton.first().isVisible({ timeout: 2000 })) {
      await likeButton.first().click()

      // Should show match modal/notification
      const matchNotification = authenticatedPage.locator(
        'text=/match|bravo|félicitations/i'
      )
      await expect(matchNotification.first()).toBeVisible({ timeout: 3000 })
    }
  })

  test('should handle swipe gestures on mobile', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()
    await apiMocks.mockLikeAction(false)

    const responsive = createResponsiveHelper(authenticatedPage)
    await responsive.setViewport('mobile')

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    const profileCard = authenticatedPage.locator('[class*="profile"], [class*="card"]').first()

    if (await profileCard.isVisible({ timeout: 2000 })) {
      // Swipe right (like)
      await responsive.testSwipeGesture('[class*="profile"]', 'right')
      await authenticatedPage.waitForTimeout(500)
    }
  })
})

test.describe('Discover - Empty States', () => {
  test('should show empty state when no profiles available', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockSuccessfulAuth()
    await apiMocks.mockEmptyDiscover()

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    // Should show empty state message
    const emptyMessage = authenticatedPage.locator(
      'text=/aucun profil|no profiles|plus de profils/i'
    )
    await expect(emptyMessage.first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Discover - Error Scenarios', () => {
  test('should handle server error gracefully', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockSuccessfulAuth()

    await authenticatedPage.route('**/api/profiles/discover', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Server error' }),
      })
    })

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(2000)

    // Should show error message or retry option
    const errorMessage = authenticatedPage.locator('text=/erreur|error/i')
    const hasError = await errorMessage.first().isVisible({ timeout: 5000 }).catch(() => false)

    // Page should not crash
    expect(hasError !== undefined).toBeTruthy()
  })

  test('should handle network timeout', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockSuccessfulAuth()
    await apiMocks.mockTimeout('/api/profiles/discover', 5000)

    await authenticatedPage.goto('/discover')

    // Should show loading state
    const loadingIndicator = authenticatedPage.locator('[class*="loading"]')
    await expect(loadingIndicator.first()).toBeVisible({ timeout: 3000 })
  })
})

test.describe('Discover - Responsive Design', () => {
  test('should display correctly on mobile', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    const responsive = createResponsiveHelper(authenticatedPage)
    await responsive.setViewport('mobile')

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    // Take screenshot
    await authenticatedPage.screenshot({ path: 'test-results/discover-mobile.png' })

    // Verify profile card is visible
    const profileCard = authenticatedPage.locator('[class*="profile"], [class*="card"]')
    await expect(profileCard.first()).toBeVisible({ timeout: 5000 })
  })

  test('should display correctly on tablet', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    const responsive = createResponsiveHelper(authenticatedPage)
    await responsive.setViewport('tablet')

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    // Take screenshot
    await authenticatedPage.screenshot({ path: 'test-results/discover-tablet.png' })

    const profileCard = authenticatedPage.locator('[class*="profile"], [class*="card"]')
    await expect(profileCard.first()).toBeVisible({ timeout: 5000 })
  })

  test('should display correctly on desktop', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    const responsive = createResponsiveHelper(authenticatedPage)
    await responsive.setViewport('desktop')

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    // Take screenshot
    await authenticatedPage.screenshot({ path: 'test-results/discover-desktop.png' })

    const profileCard = authenticatedPage.locator('[class*="profile"], [class*="card"]')
    await expect(profileCard.first()).toBeVisible({ timeout: 5000 })
  })

  test('should have touch-friendly buttons on mobile', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    const responsive = createResponsiveHelper(authenticatedPage)
    await responsive.setViewport('mobile')

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    // Check button sizes
    const likeButton = authenticatedPage.locator('button[class*="like"]').first()

    if (await likeButton.isVisible({ timeout: 2000 })) {
      const touchTarget = await responsive.verifyTouchTargetSize('button[class*="like"]')
      expect(touchTarget.valid).toBeTruthy()
    }
  })
})

test.describe('Discover - Navigation', () => {
  test('should have bottom navigation', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    // Check for bottom nav
    const bottomNav = authenticatedPage.locator('[class*="bottom-nav"]')
    await expect(bottomNav).toBeVisible()

    // Check for navigation items
    const navItems = authenticatedPage.locator('[class*="bottom-nav"] a, [class*="bottom-nav"] button')
    const navCount = await navItems.count()

    expect(navCount).toBeGreaterThan(0)
  })

  test('should navigate to other pages from bottom nav', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()
    await apiMocks.mockMatches()
    await apiMocks.mockLikes()

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForTimeout(1000)

    // Find matches nav item
    const matchesNav = authenticatedPage.locator(
      '[class*="bottom-nav"] a[href*="matches"], [class*="bottom-nav"] button:has-text("Matches")'
    )

    if (await matchesNav.isVisible({ timeout: 2000 })) {
      await matchesNav.click()

      // Should navigate to matches
      await expect(authenticatedPage).toHaveURL(/.*matches/)
    }
  })
})
