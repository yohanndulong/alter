import { Page, Route } from '@playwright/test'
import {
  mockUser,
  mockAdminUser,
  mockProfiles,
  mockMatches,
  mockChatMessages,
  mockAlterMessages,
  mockCompatibilityAnalysis,
  mockOnboardingSteps,
  mockLikes,
} from '../fixtures/mock-data'

/**
 * API Mock helpers for Playwright tests
 * Provides different API response scenarios (success, error, timeout, etc.)
 */

export class ApiMockHelper {
  constructor(private page: Page) {}

  /**
   * Mock successful authentication flow
   */
  async mockSuccessfulAuth() {
    await this.page.route('**/api/auth/send-code', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Code sent successfully' }),
      })
    })

    await this.page.route('**/api/auth/verify-code', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-jwt-token',
          user: mockUser,
        }),
      })
    })

    await this.page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser),
      })
    })
  }

  /**
   * Mock authentication errors
   */
  async mockAuthError(errorType: 'invalid_code' | 'expired_code' | 'server_error') {
    const errorResponses = {
      invalid_code: {
        status: 400,
        body: { message: 'Code de vérification invalide' },
      },
      expired_code: {
        status: 400,
        body: { message: 'Code de vérification expiré' },
      },
      server_error: {
        status: 500,
        body: { message: 'Erreur serveur, veuillez réessayer' },
      },
    }

    const response = errorResponses[errorType]

    await this.page.route('**/api/auth/verify-code', async (route) => {
      await route.fulfill({
        status: response.status,
        contentType: 'application/json',
        body: JSON.stringify(response.body),
      })
    })
  }

  /**
   * Mock network timeout
   */
  async mockTimeout(endpoint: string, delayMs = 31000) {
    await this.page.route(`**${endpoint}`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
      await route.abort('timedout')
    })
  }

  /**
   * Mock network error (offline)
   */
  async mockNetworkError(endpoint: string) {
    await this.page.route(`**${endpoint}`, async (route) => {
      await route.abort('failed')
    })
  }

  /**
   * Mock slow network (high latency)
   */
  async mockSlowNetwork(endpoint: string, delayMs = 5000) {
    await this.page.route(`**${endpoint}`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
      await route.continue()
    })
  }

  /**
   * Mock Discover page with profiles
   */
  async mockDiscoverProfiles(profiles = mockProfiles) {
    await this.page.route('**/api/profiles/discover', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ profiles }),
      })
    })
  }

  /**
   * Mock empty discover (no profiles)
   */
  async mockEmptyDiscover() {
    await this.page.route('**/api/profiles/discover', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ profiles: [] }),
      })
    })
  }

  /**
   * Mock matches
   */
  async mockMatches(matches = mockMatches) {
    await this.page.route('**/api/matches', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ matches }),
      })
    })
  }

  /**
   * Mock likes
   */
  async mockLikes(likes = mockLikes) {
    await this.page.route('**/api/likes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ likes }),
      })
    })
  }

  /**
   * Mock chat messages
   */
  async mockChatMessages(matchId: string, messages = mockChatMessages) {
    await this.page.route(`**/api/matches/${matchId}/messages`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ messages }),
      })
    })
  }

  /**
   * Mock ALTER chat messages
   */
  async mockAlterChat(messages = mockAlterMessages) {
    await this.page.route('**/api/alter/messages', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ messages }),
      })
    })
  }

  /**
   * Mock ALTER chat streaming response
   */
  async mockAlterChatStreaming() {
    // Mock WebSocket connection for real-time chat
    await this.page.addInitScript(() => {
      // Override Socket.IO client if needed
      // This is a simplified mock - you may need to adjust based on actual implementation
    })
  }

  /**
   * Mock profile update
   */
  async mockProfileUpdate(updatedUser = mockUser) {
    await this.page.route('**/api/profile', async (route) => {
      if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: updatedUser }),
        })
      } else {
        await route.continue()
      }
    })
  }

  /**
   * Mock photo upload
   */
  async mockPhotoUpload() {
    await this.page.route('**/api/photos/upload', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          photo: {
            id: 'new-photo-' + Date.now(),
            url: 'https://via.placeholder.com/400x600/FF6B6B/FFFFFF?text=New+Photo',
            order: 0,
          },
        }),
      })
    })
  }

  /**
   * Mock like/pass actions
   */
  async mockLikeAction(isMatch = false) {
    await this.page.route('**/api/profiles/*/like', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          isMatch,
          ...(isMatch && { match: mockMatches[0] }),
        }),
      })
    })
  }

  async mockPassAction() {
    await this.page.route('**/api/profiles/*/pass', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })
  }

  /**
   * Mock compatibility analysis
   */
  async mockCompatibilityAnalysis(profileId: string, analysis = mockCompatibilityAnalysis) {
    await this.page.route(`**/api/compatibility/${profileId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(analysis),
      })
    })
  }

  /**
   * Mock onboarding
   */
  async mockOnboarding(steps = mockOnboardingSteps) {
    await this.page.route('**/api/onboarding', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ steps }),
      })
    })
  }

  /**
   * Mock admin user
   */
  async mockAdminAuth() {
    await this.page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockAdminUser),
      })
    })
  }

  /**
   * Mock all common API endpoints for a standard user session
   */
  async mockStandardSession() {
    await this.mockSuccessfulAuth()
    await this.mockDiscoverProfiles()
    await this.mockMatches()
    await this.mockLikes()
  }

  /**
   * Clear all route mocks
   */
  async clearMocks() {
    await this.page.unrouteAll({ behavior: 'ignoreErrors' })
  }
}

/**
 * Helper to create API mock helper instance
 */
export function createApiMocks(page: Page): ApiMockHelper {
  return new ApiMockHelper(page)
}
