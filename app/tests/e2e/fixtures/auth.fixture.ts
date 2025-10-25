import { test as base, Page } from '@playwright/test'

/**
 * Authentication fixture
 * Provides authenticated and unauthenticated page contexts
 */

export type AuthFixtures = {
  authenticatedPage: Page
  unauthenticatedPage: Page
}

export const test = base.extend<AuthFixtures>({
  /**
   * Authenticated page with valid token
   */
  authenticatedPage: async ({ page }, use) => {
    // Mock auth token in localStorage
    await page.addInitScript(() => {
      const mockToken = 'mock-jwt-token-authenticated-user'
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        age: 25,
        gender: 'male',
        onboardingComplete: true,
        isAdmin: false,
      }

      localStorage.setItem('auth_token', mockToken)
      localStorage.setItem('user', JSON.stringify(mockUser))
    })

    await use(page)
  },

  /**
   * Unauthenticated page (clean state)
   */
  unauthenticatedPage: async ({ page }, use) => {
    await page.addInitScript(() => {
      localStorage.clear()
    })

    await use(page)
  },
})

export { expect } from '@playwright/test'
