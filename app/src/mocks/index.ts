/**
 * Mock API System Entry Point
 *
 * This module provides a complete mock API implementation for the Alter dating app.
 * It uses Mock Service Worker (MSW) to intercept and handle API requests.
 *
 * Features:
 * - 15 fully implemented API endpoints
 * - Stateful mock data that persists during the session
 * - Realistic response times (50-200ms delays)
 * - Proper HTTP status codes
 * - Token-aware authentication checking
 * - TypeScript-safe mock data
 *
 * Endpoints:
 *
 * Onboarding (3):
 * - GET /api/onboarding/questions
 * - POST /api/onboarding/answers
 * - POST /api/onboarding/complete
 *
 * Matching (6):
 * - GET /api/matching/discover
 * - POST /api/matching/like/:userId
 * - POST /api/matching/pass/:userId
 * - GET /api/matching/matches
 * - GET /api/matching/interested
 * - DELETE /api/matching/matches/:matchId
 *
 * Chat (6):
 * - GET /api/chat/matches/:matchId/messages
 * - POST /api/chat/matches/:matchId/messages
 * - POST /api/chat/matches/:matchId/read
 * - GET /api/chat/ai/messages
 * - POST /api/chat/ai/messages
 * - POST /api/chat/ai/answer
 *
 * Usage:
 * Import and call startMockServer() before your app renders:
 *
 * ```typescript
 * import { startMockServer } from './mocks'
 *
 * if (import.meta.env.DEV) {
 *   await startMockServer()
 * }
 * ```
 */

export { startMockServer, stopMockServer, resetMockServer } from './browser'
export { handlers } from './handlers'