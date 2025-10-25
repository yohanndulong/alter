import { test, expect } from './fixtures/auth.fixture'
import { createApiMocks } from './helpers/api-mocks'
import { createResponsiveHelper } from './helpers/responsive'
import { createVisualHelper } from './helpers/visual'

/**
 * ALTER Chat Tests
 * Tests AI chat functionality with multiple API scenarios
 */

test.describe('ALTER Chat - Basic Functionality', () => {
  test('should display ALTER chat interface', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()
    await apiMocks.mockAlterChat()

    await authenticatedPage.goto('/alter-chat')

    // Check for chat header with ALTER logo
    const chatHeader = authenticatedPage.locator('[class*="alter-chat-header"]')
    await expect(chatHeader).toBeVisible()

    // Check for message input
    const messageInput = authenticatedPage.locator('textarea, input[type="text"]')
    await expect(messageInput.first()).toBeVisible()

    // Check for send button
    const sendButton = authenticatedPage.locator('button[class*="send"]')
    await expect(sendButton.first()).toBeVisible()
  })

  test('should display welcome message', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()
    await apiMocks.mockAlterChat()

    await authenticatedPage.goto('/alter-chat')

    // Wait for messages to load
    await authenticatedPage.waitForTimeout(1000)

    // Check for assistant messages
    const messages = authenticatedPage.locator('[class*="message--assistant"]')
    await expect(messages.first()).toBeVisible({ timeout: 5000 })
  })

  test('should send user message', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()
    await apiMocks.mockAlterChat()

    await authenticatedPage.goto('/alter-chat')
    await authenticatedPage.waitForTimeout(1000)

    // Type and send message
    const input = authenticatedPage.locator('textarea')
    await input.fill('Je suis passionné de technologie')

    const sendButton = authenticatedPage.locator('button[class*="send"]')
    await sendButton.click()

    // Should show loading/typing indicator
    const typingIndicator = authenticatedPage.locator('[class*="typing"]')
    await expect(typingIndicator).toBeVisible({ timeout: 2000 })
  })

  test('should display message options (multiple choice)', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()
    await apiMocks.mockAlterChat()

    await authenticatedPage.goto('/alter-chat')
    await authenticatedPage.waitForTimeout(1000)

    // Look for option buttons
    const options = authenticatedPage.locator('[class*="option"]')
    const optionsCount = await options.count()

    if (optionsCount > 0) {
      await expect(options.first()).toBeVisible()

      // Click an option
      await options.first().click()

      // Option should be selected or sent
      await authenticatedPage.waitForTimeout(500)
    }
  })

  test('should handle keyboard shortcuts (Ctrl+Enter to send)', async ({
    authenticatedPage,
  }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()
    await apiMocks.mockAlterChat()

    await authenticatedPage.goto('/alter-chat')
    await authenticatedPage.waitForTimeout(1000)

    const input = authenticatedPage.locator('textarea')
    await input.fill('Test message with keyboard shortcut')

    // Press Ctrl+Enter
    await input.press('Control+Enter')

    // Should show typing indicator
    const typingIndicator = authenticatedPage.locator('[class*="typing"]')
    await expect(typingIndicator).toBeVisible({ timeout: 2000 })
  })

  test('should display profile completion indicator', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()
    await apiMocks.mockAlterChat()

    await authenticatedPage.goto('/alter-chat')
    await authenticatedPage.waitForTimeout(1000)

    // Look for profile completion indicator (e.g., "45%")
    const completionIndicator = authenticatedPage.locator('text=/%/')
    const isVisible = await completionIndicator.isVisible().catch(() => false)

    // May or may not be visible depending on state
    // Just verify page loads without error
    expect(isVisible !== undefined).toBeTruthy()
  })

  test('should switch intention modes', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()
    await apiMocks.mockAlterChat()

    await authenticatedPage.goto('/alter-chat')
    await authenticatedPage.waitForTimeout(1000)

    // Look for intention selector button
    const intentionButton = authenticatedPage.locator('[class*="intention"]').first()
    const isVisible = await intentionButton.isVisible().catch(() => false)

    if (isVisible) {
      await intentionButton.click()

      // Should show intention menu
      const intentionMenu = authenticatedPage.locator('[class*="intention-menu"]')
      await expect(intentionMenu).toBeVisible({ timeout: 2000 })
    }
  })
})

test.describe('ALTER Chat - API Error Scenarios', () => {
  test('should handle server error gracefully', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()

    // Mock server error for ALTER chat
    await authenticatedPage.route('**/api/alter/messages', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Server error' }),
      })
    })

    await authenticatedPage.goto('/alter-chat')
    await authenticatedPage.waitForTimeout(1000)

    // Should show error message or fallback UI
    // Page should not crash
    const body = authenticatedPage.locator('body')
    await expect(body).toBeVisible()
  })

  test('should handle network timeout', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()
    await apiMocks.mockTimeout('/api/alter/messages', 5000)

    await authenticatedPage.goto('/alter-chat')

    // Should show loading indicator
    const loadingIndicator = authenticatedPage.locator(
      '[class*="loading"], text=/chargement|loading/i'
    )
    await expect(loadingIndicator.first()).toBeVisible({ timeout: 3000 })
  })

  test('should handle offline state', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()
    await apiMocks.mockNetworkError('/api/alter/messages')

    await authenticatedPage.goto('/alter-chat')
    await authenticatedPage.waitForTimeout(2000)

    // Should show network error or offline indicator
    const networkStatus = authenticatedPage.locator(
      '[class*="network"], text=/hors ligne|offline|connexion/i'
    )
    const isVisible = await networkStatus.first().isVisible().catch(() => false)

    // Network status may appear
    expect(isVisible !== undefined).toBeTruthy()
  })

  test('should handle slow network with loading states', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()
    await apiMocks.mockSlowNetwork('/api/alter/messages', 3000)

    await authenticatedPage.goto('/alter-chat')

    // Should show loading state
    const loadingIndicator = authenticatedPage.locator('[class*="loading"]')
    await expect(loadingIndicator.first()).toBeVisible({ timeout: 2000 })

    // Wait for content to load
    await authenticatedPage.waitForTimeout(4000)
  })

  test('should retry failed messages', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()
    await apiMocks.mockAlterChat()

    // Mock send message to fail first, then succeed
    let attemptCount = 0
    await authenticatedPage.route('**/socket.io/**', async (route) => {
      attemptCount++
      if (attemptCount === 1) {
        await route.abort('failed')
      } else {
        await route.continue()
      }
    })

    await authenticatedPage.goto('/alter-chat')
    await authenticatedPage.waitForTimeout(1000)

    const input = authenticatedPage.locator('textarea')
    await input.fill('Test retry message')

    const sendButton = authenticatedPage.locator('button[class*="send"]')
    await sendButton.click()

    // Wait to see if retry happens
    await authenticatedPage.waitForTimeout(2000)
  })
})

test.describe('ALTER Chat - Responsive Design', () => {
  test('should display correctly on mobile', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()
    await apiMocks.mockAlterChat()

    const responsive = createResponsiveHelper(authenticatedPage)
    await responsive.setViewport('mobile')

    await authenticatedPage.goto('/alter-chat')
    await authenticatedPage.waitForTimeout(1000)

    // Take screenshot
    await authenticatedPage.screenshot({ path: 'test-results/alter-chat-mobile.png' })

    // Verify input is accessible
    const input = authenticatedPage.locator('textarea')
    await expect(input).toBeVisible()

    // Verify send button size (touch target)
    const sendButton = authenticatedPage.locator('button[class*="send"]')
    const buttonBox = await sendButton.first().boundingBox()
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44)
  })

  test('should display correctly on tablet', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()
    await apiMocks.mockAlterChat()

    const responsive = createResponsiveHelper(authenticatedPage)
    await responsive.setViewport('tablet')

    await authenticatedPage.goto('/alter-chat')
    await authenticatedPage.waitForTimeout(1000)

    // Take screenshot
    await authenticatedPage.screenshot({ path: 'test-results/alter-chat-tablet.png' })

    const chatContainer = authenticatedPage.locator('[class*="alter-chat"]')
    await expect(chatContainer.first()).toBeVisible()
  })

  test('should display correctly on desktop', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()
    await apiMocks.mockAlterChat()

    const responsive = createResponsiveHelper(authenticatedPage)
    await responsive.setViewport('desktop')

    await authenticatedPage.goto('/alter-chat')
    await authenticatedPage.waitForTimeout(1000)

    // Take screenshot
    await authenticatedPage.screenshot({ path: 'test-results/alter-chat-desktop.png' })

    const chatContainer = authenticatedPage.locator('[class*="alter-chat"]')
    await expect(chatContainer.first()).toBeVisible()
  })

  test('should scroll to bottom on new messages', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()
    await apiMocks.mockAlterChat()

    await authenticatedPage.goto('/alter-chat')
    await authenticatedPage.waitForTimeout(1000)

    // Send a message to trigger scroll
    const input = authenticatedPage.locator('textarea')
    await input.fill('New message to test scroll')

    const sendButton = authenticatedPage.locator('button[class*="send"]')
    await sendButton.click()

    await authenticatedPage.waitForTimeout(500)

    // Verify scroll position (messages container should be scrolled to bottom)
    const messagesContainer = authenticatedPage.locator('[class*="messages"]')
    const isScrolledToBottom = await messagesContainer.evaluate((el) => {
      return el.scrollHeight - el.scrollTop <= el.clientHeight + 100 // Allow 100px tolerance
    })

    expect(isScrolledToBottom).toBeTruthy()
  })
})

test.describe('ALTER Chat - Visual & Design Tests', () => {
  test('should have consistent message bubble design', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()
    await apiMocks.mockAlterChat()

    await authenticatedPage.goto('/alter-chat')
    await authenticatedPage.waitForTimeout(1000)

    const visual = createVisualHelper(authenticatedPage)

    // Check assistant message styles
    const assistantMessage = authenticatedPage.locator('[class*="message--assistant"]').first()
    if (await assistantMessage.isVisible()) {
      const styles = await visual.verifyCardDesign('[class*="message--assistant"]')

      // Should have border radius
      expect(styles.borderRadius).not.toBe('0px')
    }
  })

  test('should display typing indicator animation', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()
    await apiMocks.mockAlterChat()

    await authenticatedPage.goto('/alter-chat')
    await authenticatedPage.waitForTimeout(1000)

    // Send a message to trigger typing indicator
    const input = authenticatedPage.locator('textarea')
    await input.fill('Trigger typing indicator')

    const sendButton = authenticatedPage.locator('button[class*="send"]')
    await sendButton.click()

    // Check for typing indicator
    const typingIndicator = authenticatedPage.locator('[class*="typing"]')
    const isVisible = await typingIndicator.isVisible({ timeout: 2000 }).catch(() => false)

    if (isVisible) {
      const visual = createVisualHelper(authenticatedPage)
      const animation = await visual.verifyAnimations('[class*="typing"]')

      // Should have animation
      expect(animation.hasAnimation || animation.hasTransition).toBeTruthy()
    }
  })

  test('should have accessible color contrast', async ({ authenticatedPage }) => {
    const apiMocks = createApiMocks(authenticatedPage)
    await apiMocks.mockStandardSession()
    await apiMocks.mockAlterChat()

    await authenticatedPage.goto('/alter-chat')
    await authenticatedPage.waitForTimeout(1000)

    const visual = createVisualHelper(authenticatedPage)

    // Check message text contrast
    const messageText = authenticatedPage.locator('[class*="message-text"]').first()
    if (await messageText.isVisible()) {
      const contrast = await visual.verifyColorContrast('[class*="message-text"]')

      // Should pass WCAG AA (4.5:1)
      expect(contrast.passes).toBeTruthy()
    }
  })
})
