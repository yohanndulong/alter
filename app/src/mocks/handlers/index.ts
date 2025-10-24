import { authHandlers } from './auth'
import { onboardingHandlers } from './onboarding'
import { matchingHandlers } from './matching'
import { chatHandlers } from './chat'
import { compatibilityHandlers } from './compatibility'

/**
 * Export all API handlers
 * Total: 28 endpoints (5 auth + 3 onboarding + 6 matching + 6 chat + 8 compatibility)
 */

export const handlers = [
  ...authHandlers,
  ...onboardingHandlers,
  ...matchingHandlers,
  ...chatHandlers,
  ...compatibilityHandlers
]