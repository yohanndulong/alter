import { test, expect } from './fixtures/auth.fixture'
import { createApiMocks } from './helpers/api-mocks'
import { createResponsiveHelper } from './helpers/responsive'

/**
 * Authentication Flow Tests
 * Tests login, verification, errors, and different device sizes
 */

test.describe('Authentication - Login Flow', () => {
  test('should display login page with phone input', async ({ unauthenticatedPage }) => {
    const apiMocks = createApiMocks(unauthenticatedPage)
    await apiMocks.mockSuccessfulAuth()

    await unauthenticatedPage.goto('/')

    // Should redirect to login
    await expect(unauthenticatedPage).toHaveURL(/.*login/)

    // Check for phone input
    const phoneInput = unauthenticatedPage.locator('input[type="tel"], input[name="phoneNumber"]')
    await expect(phoneInput).toBeVisible()

    // Check for submit button
    const submitButton = unauthenticatedPage.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
  })

  test('should send verification code successfully', async ({ unauthenticatedPage }) => {
    const apiMocks = createApiMocks(unauthenticatedPage)
    await apiMocks.mockSuccessfulAuth()

    await unauthenticatedPage.goto('/login')

    // Enter phone number
    const phoneInput = unauthenticatedPage.locator('input[type="tel"], input[name="phoneNumber"]')
    await phoneInput.fill('+33612345678')

    // Submit
    const submitButton = unauthenticatedPage.locator('button[type="submit"]')
    await submitButton.click()

    // Should redirect to verification page
    await expect(unauthenticatedPage).toHaveURL(/.*verify-code/)
  })

  test('should verify code and login successfully', async ({ unauthenticatedPage }) => {
    const apiMocks = createApiMocks(unauthenticatedPage)
    await apiMocks.mockSuccessfulAuth()

    await unauthenticatedPage.goto('/verify-code')

    // Enter verification code
    const codeInputs = unauthenticatedPage.locator('input[type="text"], input[name*="code"]')
    const firstInput = codeInputs.first()
    await firstInput.fill('123456')

    // Wait for auto-submit or click verify button
    await unauthenticatedPage.waitForTimeout(500)

    // Should redirect to discover or onboarding
    await expect(unauthenticatedPage).toHaveURL(/\/(discover|onboarding)/)
  })

  test('should show error for invalid verification code', async ({ unauthenticatedPage }) => {
    const apiMocks = createApiMocks(unauthenticatedPage)
    await apiMocks.mockSuccessfulAuth() // For send code
    await apiMocks.mockAuthError('invalid_code') // For verify

    await unauthenticatedPage.goto('/verify-code')

    // Enter invalid code
    const codeInputs = unauthenticatedPage.locator('input[type="text"], input[name*="code"]')
    const firstInput = codeInputs.first()
    await firstInput.fill('000000')

    await unauthenticatedPage.waitForTimeout(500)

    // Should show error message
    const errorMessage = unauthenticatedPage.locator('text=/invalide|incorrect|wrong/i')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
  })

  test('should show error for expired code', async ({ unauthenticatedPage }) => {
    const apiMocks = createApiMocks(unauthenticatedPage)
    await apiMocks.mockAuthError('expired_code')

    await unauthenticatedPage.goto('/verify-code')

    const codeInputs = unauthenticatedPage.locator('input[type="text"], input[name*="code"]')
    const firstInput = codeInputs.first()
    await firstInput.fill('123456')

    await unauthenticatedPage.waitForTimeout(500)

    // Should show expired error
    const errorMessage = unauthenticatedPage.locator('text=/expir|expiré/i')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
  })

  test('should handle server error gracefully', async ({ unauthenticatedPage }) => {
    const apiMocks = createApiMocks(unauthenticatedPage)
    await apiMocks.mockAuthError('server_error')

    await unauthenticatedPage.goto('/verify-code')

    const codeInputs = unauthenticatedPage.locator('input[type="text"], input[name*="code"]')
    const firstInput = codeInputs.first()
    await firstInput.fill('123456')

    await unauthenticatedPage.waitForTimeout(500)

    // Should show server error message
    const errorMessage = unauthenticatedPage.locator('text=/erreur|error|serveur/i')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
  })

  test('should handle network timeout', async ({ unauthenticatedPage }) => {
    const apiMocks = createApiMocks(unauthenticatedPage)
    await apiMocks.mockTimeout('/api/auth/send-code', 5000)

    await unauthenticatedPage.goto('/login')

    const phoneInput = unauthenticatedPage.locator('input[type="tel"], input[name="phoneNumber"]')
    await phoneInput.fill('+33612345678')

    const submitButton = unauthenticatedPage.locator('button[type="submit"]')
    await submitButton.click()

    // Should show loading indicator
    const loadingIndicator = unauthenticatedPage.locator('[class*="loading"], [class*="spinner"]')
    await expect(loadingIndicator).toBeVisible({ timeout: 2000 })
  })

  test('should handle offline state', async ({ unauthenticatedPage }) => {
    const apiMocks = createApiMocks(unauthenticatedPage)
    await apiMocks.mockNetworkError('/api/auth/send-code')

    await unauthenticatedPage.goto('/login')

    const phoneInput = unauthenticatedPage.locator('input[type="tel"], input[name="phoneNumber"]')
    await phoneInput.fill('+33612345678')

    const submitButton = unauthenticatedPage.locator('button[type="submit"]')
    await submitButton.click()

    // Should show network error
    await unauthenticatedPage.waitForTimeout(1000)

    // Network status indicator or error message
    const networkError = unauthenticatedPage.locator(
      'text=/connexion|network|offline|hors ligne/i'
    )
    await expect(networkError.first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Authentication - Responsive Design', () => {
  test('should display correctly on mobile', async ({ unauthenticatedPage }) => {
    const apiMocks = createApiMocks(unauthenticatedPage)
    await apiMocks.mockSuccessfulAuth()

    const responsive = createResponsiveHelper(unauthenticatedPage)
    await responsive.setViewport('mobile')

    await unauthenticatedPage.goto('/login')

    // Take screenshot
    await unauthenticatedPage.screenshot({ path: 'test-results/login-mobile.png' })

    // Verify phone input is visible and properly sized
    const phoneInput = unauthenticatedPage.locator('input[type="tel"], input[name="phoneNumber"]')
    await expect(phoneInput).toBeVisible()

    // Verify touch target size
    const inputBox = await phoneInput.boundingBox()
    expect(inputBox?.height).toBeGreaterThanOrEqual(44) // Minimum touch target
  })

  test('should display correctly on tablet', async ({ unauthenticatedPage }) => {
    const apiMocks = createApiMocks(unauthenticatedPage)
    await apiMocks.mockSuccessfulAuth()

    const responsive = createResponsiveHelper(unauthenticatedPage)
    await responsive.setViewport('tablet')

    await unauthenticatedPage.goto('/login')

    // Take screenshot
    await unauthenticatedPage.screenshot({ path: 'test-results/login-tablet.png' })

    const phoneInput = unauthenticatedPage.locator('input[type="tel"], input[name="phoneNumber"]')
    await expect(phoneInput).toBeVisible()
  })

  test('should display correctly on desktop', async ({ unauthenticatedPage }) => {
    const apiMocks = createApiMocks(unauthenticatedPage)
    await apiMocks.mockSuccessfulAuth()

    const responsive = createResponsiveHelper(unauthenticatedPage)
    await responsive.setViewport('desktop')

    await unauthenticatedPage.goto('/login')

    // Take screenshot
    await unauthenticatedPage.screenshot({ path: 'test-results/login-desktop.png' })

    const phoneInput = unauthenticatedPage.locator('input[type="tel"], input[name="phoneNumber"]')
    await expect(phoneInput).toBeVisible()
  })
})

test.describe('Authentication - Protected Routes', () => {
  test('should redirect unauthenticated users to login', async ({ unauthenticatedPage }) => {
    await unauthenticatedPage.goto('/discover')

    // Should redirect to login
    await expect(unauthenticatedPage).toHaveURL(/.*login/)
  })

  test('should allow authenticated users to access protected routes', async ({
    authenticatedPage,
  }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    await authenticatedPage.goto('/discover')

    // Should stay on discover page
    await expect(authenticatedPage).toHaveURL(/.*discover/)
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

    // Should redirect to onboarding
    await expect(page).toHaveURL(/.*onboarding/)
  })
})
