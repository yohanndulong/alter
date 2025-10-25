import { test, expect } from './fixtures/auth.fixture'
import { createApiMocks } from './helpers/api-mocks'
import { createResponsiveHelper } from './helpers/responsive'

/**
 * Authentication Flow Tests
 * Tests login, verification, errors, and different device sizes
 */

test.describe('Authentication - Login Flow', () => {
  test('should display login page with email input', async ({ unauthenticatedPage }) => {
    const apiMocks = createApiMocks(unauthenticatedPage)
    await apiMocks.mockSuccessfulAuth()

    await unauthenticatedPage.goto('/')

    // Should redirect to login
    await expect(unauthenticatedPage).toHaveURL(/.*login/, { timeout: 10000 })

    // Check for email input
    const emailInput = unauthenticatedPage.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()

    // Check for submit button
    const submitButton = unauthenticatedPage.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
  })

  test('should send verification code successfully', async ({ unauthenticatedPage }) => {
    const apiMocks = createApiMocks(unauthenticatedPage)
    await apiMocks.mockSuccessfulAuth()

    await unauthenticatedPage.goto('/login')

    // Wait for page to be ready
    await unauthenticatedPage.waitForLoadState('networkidle')

    // Enter email
    const emailInput = unauthenticatedPage.locator('input[type="email"]')
    await emailInput.waitFor({ state: 'visible', timeout: 10000 })
    await emailInput.fill('test@example.com')

    // Submit
    const submitButton = unauthenticatedPage.locator('button[type="submit"]')
    await submitButton.click()

    // Should redirect to verification page
    await expect(unauthenticatedPage).toHaveURL(/.*verify-code/, { timeout: 10000 })
  })

  test('should verify code and login successfully', async ({ unauthenticatedPage }) => {
    const apiMocks = createApiMocks(unauthenticatedPage)
    await apiMocks.mockSuccessfulAuth()

    // Store email in localStorage before going to verify-code
    await unauthenticatedPage.addInitScript(() => {
      localStorage.setItem('verifyEmail', 'test@example.com')
    })

    await unauthenticatedPage.goto('/verify-code')
    await unauthenticatedPage.waitForLoadState('networkidle')

    // Enter verification code
    const codeInput = unauthenticatedPage.locator('input[type="text"]')
    await codeInput.waitFor({ state: 'visible', timeout: 10000 })
    await codeInput.fill('123456')

    // Click submit button
    const submitButton = unauthenticatedPage.locator('button[type="submit"]')
    await submitButton.click()

    // Should redirect to discover or onboarding
    await expect(unauthenticatedPage).toHaveURL(/\/(discover|onboarding)/, { timeout: 10000 })
  })

  test('should show error for invalid verification code', async ({ unauthenticatedPage }) => {
    const apiMocks = createApiMocks(unauthenticatedPage)
    await apiMocks.mockSuccessfulAuth() // For send code
    await apiMocks.mockAuthError('invalid_code') // For verify

    // Store email in localStorage
    await unauthenticatedPage.addInitScript(() => {
      localStorage.setItem('verifyEmail', 'test@example.com')
    })

    await unauthenticatedPage.goto('/verify-code')
    await unauthenticatedPage.waitForLoadState('networkidle')

    // Enter invalid code
    const codeInput = unauthenticatedPage.locator('input[type="text"]')
    await codeInput.waitFor({ state: 'visible', timeout: 10000 })
    await codeInput.fill('000000')

    // Click submit
    const submitButton = unauthenticatedPage.locator('button[type="submit"]')
    await submitButton.click()

    await unauthenticatedPage.waitForTimeout(500)

    // Should show error message
    const errorMessage = unauthenticatedPage.locator('text=/invalide|incorrect|wrong/i')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
  })

  test('should show error for expired code', async ({ unauthenticatedPage }) => {
    const apiMocks = createApiMocks(unauthenticatedPage)
    await apiMocks.mockAuthError('expired_code')

    // Store email in localStorage
    await unauthenticatedPage.addInitScript(() => {
      localStorage.setItem('verifyEmail', 'test@example.com')
    })

    await unauthenticatedPage.goto('/verify-code')
    await unauthenticatedPage.waitForLoadState('networkidle')

    const codeInput = unauthenticatedPage.locator('input[type="text"]')
    await codeInput.waitFor({ state: 'visible', timeout: 10000 })
    await codeInput.fill('123456')

    const submitButton = unauthenticatedPage.locator('button[type="submit"]')
    await submitButton.click()

    await unauthenticatedPage.waitForTimeout(500)

    // Should show expired error
    const errorMessage = unauthenticatedPage.locator('text=/expir|expiré/i')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
  })

  test('should handle server error gracefully', async ({ unauthenticatedPage }) => {
    const apiMocks = createApiMocks(unauthenticatedPage)
    await apiMocks.mockAuthError('server_error')

    // Store email in localStorage
    await unauthenticatedPage.addInitScript(() => {
      localStorage.setItem('verifyEmail', 'test@example.com')
    })

    await unauthenticatedPage.goto('/verify-code')
    await unauthenticatedPage.waitForLoadState('networkidle')

    const codeInput = unauthenticatedPage.locator('input[type="text"]')
    await codeInput.waitFor({ state: 'visible', timeout: 10000 })
    await codeInput.fill('123456')

    const submitButton = unauthenticatedPage.locator('button[type="submit"]')
    await submitButton.click()

    await unauthenticatedPage.waitForTimeout(500)

    // Should show server error message
    const errorMessage = unauthenticatedPage.locator('text=/erreur|error|serveur/i')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
  })

  test('should handle network timeout', async ({ unauthenticatedPage }) => {
    const apiMocks = createApiMocks(unauthenticatedPage)
    await apiMocks.mockTimeout('/api/auth/send-code', 5000)

    await unauthenticatedPage.goto('/login')
    await unauthenticatedPage.waitForLoadState('networkidle')

    const emailInput = unauthenticatedPage.locator('input[type="email"]')
    await emailInput.waitFor({ state: 'visible', timeout: 10000 })
    await emailInput.fill('test@example.com')

    const submitButton = unauthenticatedPage.locator('button[type="submit"]')
    await submitButton.click()

    // Should show loading indicator
    const loadingIndicator = unauthenticatedPage.locator('button[loading], [class*="loading"]')
    await expect(loadingIndicator).toBeVisible({ timeout: 2000 })
  })

  test('should handle offline state', async ({ unauthenticatedPage }) => {
    const apiMocks = createApiMocks(unauthenticatedPage)
    await apiMocks.mockNetworkError('/api/auth/send-code')

    await unauthenticatedPage.goto('/login')
    await unauthenticatedPage.waitForLoadState('networkidle')

    const emailInput = unauthenticatedPage.locator('input[type="email"]')
    await emailInput.waitFor({ state: 'visible', timeout: 10000 })
    await emailInput.fill('test@example.com')

    const submitButton = unauthenticatedPage.locator('button[type="submit"]')
    await submitButton.click()

    // Should show network error
    await unauthenticatedPage.waitForTimeout(1000)

    // Network status indicator or error message (may be in toast)
    const errorElement = unauthenticatedPage.locator(
      'text=/connexion|network|offline|hors ligne|erreur/i'
    )
    // Use first() to get any matching element
    await expect(errorElement.first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Authentication - Responsive Design', () => {
  test('should display correctly on mobile', async ({ unauthenticatedPage }) => {
    const apiMocks = createApiMocks(unauthenticatedPage)
    await apiMocks.mockSuccessfulAuth()

    const responsive = createResponsiveHelper(unauthenticatedPage)
    await responsive.setViewport('mobile')

    await unauthenticatedPage.goto('/login')
    await unauthenticatedPage.waitForLoadState('networkidle')

    // Take screenshot
    await unauthenticatedPage.screenshot({ path: 'test-results/login-mobile.png' })

    // Verify email input is visible and properly sized
    const emailInput = unauthenticatedPage.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()

    // Verify touch target size
    const inputBox = await emailInput.boundingBox()
    expect(inputBox?.height).toBeGreaterThanOrEqual(40) // Minimum touch target (allow some flexibility)
  })

  test('should display correctly on tablet', async ({ unauthenticatedPage }) => {
    const apiMocks = createApiMocks(unauthenticatedPage)
    await apiMocks.mockSuccessfulAuth()

    const responsive = createResponsiveHelper(unauthenticatedPage)
    await responsive.setViewport('tablet')

    await unauthenticatedPage.goto('/login')
    await unauthenticatedPage.waitForLoadState('networkidle')

    // Take screenshot
    await unauthenticatedPage.screenshot({ path: 'test-results/login-tablet.png' })

    const emailInput = unauthenticatedPage.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
  })

  test('should display correctly on desktop', async ({ unauthenticatedPage }) => {
    const apiMocks = createApiMocks(unauthenticatedPage)
    await apiMocks.mockSuccessfulAuth()

    const responsive = createResponsiveHelper(unauthenticatedPage)
    await responsive.setViewport('desktop')

    await unauthenticatedPage.goto('/login')
    await unauthenticatedPage.waitForLoadState('networkidle')

    // Take screenshot
    await unauthenticatedPage.screenshot({ path: 'test-results/login-desktop.png' })

    const emailInput = unauthenticatedPage.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
  })
})

test.describe('Authentication - Protected Routes', () => {
  test('should redirect unauthenticated users to login', async ({ unauthenticatedPage }) => {
    await unauthenticatedPage.goto('/discover')

    // Should redirect to login
    await expect(unauthenticatedPage).toHaveURL(/.*login/, { timeout: 10000 })
  })

  test('should allow authenticated users to access protected routes', async ({
    authenticatedPage,
  }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForLoadState('networkidle')

    // Should stay on discover page
    await expect(authenticatedPage).toHaveURL(/.*discover/, { timeout: 10000 })
  })

  test('should redirect to onboarding if not completed', async ({ page }) => {
    // Mock user with incomplete onboarding
    await page.addInitScript(() => {
      const mockToken = 'mock-jwt-token'
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        onboardingComplete: false,
      }

      localStorage.setItem('auth_token', mockToken)
      localStorage.setItem('user', JSON.stringify(mockUser))
    })

    const apiMocks = createApiMocks(page)
    await apiMocks.mockStandardSession()

    await page.goto('/discover')
    await page.waitForLoadState('networkidle')

    // Should redirect to onboarding
    await expect(page).toHaveURL(/.*onboarding/, { timeout: 10000 })
  })
})
