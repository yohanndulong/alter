import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { initializeMockStorage } from './data/storage'

/**
 * Browser-side mock service worker setup
 * This configures MSW to intercept API requests in the browser
 */

// Initialize the service worker with all handlers
export const worker = setupWorker(...handlers)

/**
 * Start the mock API server
 * Call this before your app initializes to enable API mocking
 */
export async function startMockServer(): Promise<void> {
  // Initialize mock data storage
  initializeMockStorage()

  // Start the service worker
  await worker.start({
    onUnhandledRequest: 'bypass', // Don't warn about non-API requests
    quiet: false // Show logs in development
  })

  console.log('🚀 Mock API server started successfully!')
  console.log('📊 All 20 endpoints are ready:')
  console.log('  - Auth: 5 endpoints (email + verification code flow)')
  console.log('  - Onboarding: 3 endpoints')
  console.log('  - Matching: 6 endpoints')
  console.log('  - Chat: 6 endpoints')
}

/**
 * Stop the mock API server
 * Useful for testing or cleanup
 */
export function stopMockServer(): void {
  worker.stop()
  console.log('🛑 Mock API server stopped')
}

/**
 * Reset handlers to their initial state
 * Useful for testing
 */
export function resetMockServer(): void {
  worker.resetHandlers()
  initializeMockStorage()
  console.log('🔄 Mock API server reset')
}