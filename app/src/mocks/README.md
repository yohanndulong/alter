# Mock API System

Complete mock API implementation for the Alter dating app using Mock Service Worker (MSW).

## Overview

This mock API system provides a fully functional backend simulation that allows frontend development without a real API server. It includes 15 endpoints across 3 service areas, with stateful data management and realistic behavior.

## Features

- **Complete Coverage**: All 15 API endpoints implemented
- **Stateful Storage**: In-memory database that persists during the session
- **Realistic Delays**: 50-200ms response times to simulate network latency
- **Type-Safe**: Full TypeScript support with proper typing
- **Authentication**: Token-aware endpoints that check Authorization headers
- **Intelligent Responses**: Contextual AI chat responses and matching logic
- **Hot Module Replacement**: Works seamlessly with Vite HMR

## Architecture

```
src/mocks/
├── index.ts                    # Main entry point
├── browser.ts                  # MSW browser setup
├── data/
│   ├── mockData.ts            # Data generators
│   └── storage.ts             # In-memory storage & state management
└── handlers/
    ├── index.ts               # Combines all handlers
    ├── onboarding.ts          # Onboarding endpoints (3)
    ├── matching.ts            # Matching endpoints (6)
    └── chat.ts                # Chat endpoints (6)
```

## Implemented Endpoints

### Onboarding Service (3 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/onboarding/questions` | Get onboarding questions |
| POST | `/api/onboarding/answers` | Submit user answers |
| POST | `/api/onboarding/complete` | Complete onboarding flow |

### Matching Service (6 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/matching/discover` | Get profiles for discovery feed |
| POST | `/api/matching/like/:userId` | Like a profile (may return match) |
| POST | `/api/matching/pass/:userId` | Pass on a profile |
| GET | `/api/matching/matches` | Get all matches |
| GET | `/api/matching/interested` | Get users who liked you |
| DELETE | `/api/matching/matches/:matchId` | Unmatch with a user |

### Chat Service (6 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/matches/:matchId/messages` | Get messages for a match |
| POST | `/api/chat/matches/:matchId/messages` | Send a message |
| POST | `/api/chat/matches/:matchId/read` | Mark messages as read |
| GET | `/api/chat/ai/messages` | Get AI chat history |
| POST | `/api/chat/ai/messages` | Send message to AI assistant |
| POST | `/api/chat/ai/answer` | Answer AI question with option |

## Usage

The mock server is automatically initialized in development mode. No additional configuration needed!

### Automatic Initialization

The app is configured to start the mock server automatically in `src/main.tsx`:

```typescript
// Automatically runs in development
if (import.meta.env.DEV) {
  const { startMockServer } = await import('./mocks')
  await startMockServer()
}
```

### Manual Control

If you need to control the mock server manually:

```typescript
import { startMockServer, stopMockServer, resetMockServer } from '@/mocks'

// Start the server
await startMockServer()

// Stop the server
stopMockServer()

// Reset to initial state
resetMockServer()
```

## Authentication

All endpoints check for an `Authorization` header with a Bearer token:

```typescript
Authorization: Bearer <token>
```

For development, any token will work. The mock server stores it in `localStorage` as `auth_token`.

To simulate authentication in your browser console:

```javascript
localStorage.setItem('auth_token', 'mock-token-123')
```

## Mock Data

### Pre-generated Data

On initialization, the mock server generates:

- **Current User**: Simulates the logged-in user
- **20 Discover Users**: For the discovery feed
- **8 Initial Matches**: With conversation history
- **5 Interested Users**: Users who liked you
- **AI Chat**: Welcome message with options

### Dynamic Data

The system maintains state across requests:

- **Likes/Passes**: Tracked to filter discover feed
- **Matches**: Created when users like each other (30% chance)
- **Messages**: Persisted per match
- **Unread Counts**: Updated when messages sent/read
- **Onboarding Answers**: Stored and applied to user profile

## Development Features

### Console Logging

The mock server logs all activity to the console in development:

```
🚀 Mock API server started successfully!
📊 All 15 endpoints are ready:
  - Onboarding: 3 endpoints
  - Matching: 6 endpoints
  - Chat: 6 endpoints

[MSW] GET /api/matching/discover (200 OK)
```

### Storage Inspection

Debug the current storage state in browser console:

```javascript
import { getStorageSnapshot } from '@/mocks/data/storage'
console.log(getStorageSnapshot())
```

## Realistic Behavior

### Response Times

Realistic delays simulate actual API latency:

- Quick reads: 50-100ms
- Standard operations: 100-150ms
- Complex operations: 150-200ms
- AI responses: 180-200ms

### Matching Logic

- **Like Action**: 30% chance of instant match
- **Match Creation**: Generates new match with compatibility score
- **Discover Filtering**: Automatically removes liked/passed profiles

### AI Chat

The AI assistant provides contextual responses:

- Recognizes keywords (match, bio, photo, etc.)
- Offers relevant follow-up options
- Maintains conversation history

### Message System

- Messages sorted chronologically
- Unread counts updated automatically
- Read status tracked per message
- Last message time updates match list order

## Error Handling

All endpoints return proper HTTP status codes:

- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing/invalid token
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error responses include descriptive messages:

```json
{
  "message": "Unauthorized"
}
```

## TypeScript Support

All mock data is fully typed using the types defined in `@/types`:

- `User`
- `Match`
- `Message`
- `OnboardingQuestion`
- `OnboardingAnswer`
- `ChatMessage`

## Testing

### Manual Testing

1. Start the dev server: `npm run dev`
2. Open browser DevTools
3. Check console for MSW logs
4. Use the app normally - all API calls are mocked

### Debugging

View MSW network activity in DevTools:

1. Open DevTools > Network tab
2. Look for requests to `/api/*`
3. Check the "Preview" tab to see mock responses

### Reset State

If you need to reset to initial state:

```javascript
// In browser console
location.reload()  // Simple page reload
```

Or programmatically:

```typescript
import { resetMockServer } from '@/mocks'
resetMockServer()
```

## Production Build

The mock server is automatically excluded from production builds:

```typescript
if (import.meta.env.DEV) {
  // Only runs in development
  await startMockServer()
}
```

The MSW service worker file (`public/mockServiceWorker.js`) is safe to include in production as it won't be loaded unless explicitly initialized.

## Customization

### Adding New Endpoints

1. Add handler in appropriate file (`handlers/onboarding.ts`, etc.)
2. Export from `handlers/index.ts`
3. Update this README

### Modifying Mock Data

Edit `data/mockData.ts`:

```typescript
// Change data pools
const firstNames = ['Custom', 'Names', ...]

// Adjust generators
export function generateUser(overrides?: Partial<User>): User {
  // Custom logic
}
```

### Adjusting Response Times

Modify delay values in handlers:

```typescript
await delay(100) // Adjust milliseconds
```

## Troubleshooting

### Server Not Starting

- Check console for errors
- Verify MSW is installed: `npm list msw`
- Ensure service worker file exists: `public/mockServiceWorker.js`

### Endpoints Not Working

- Check Authorization header is present
- Verify endpoint path matches exactly
- Look for MSW logs in console

### State Issues

- Reload page to reset state
- Check storage methods in `data/storage.ts`
- Use `getStorageSnapshot()` to inspect state

## Resources

- [MSW Documentation](https://mswjs.io/)
- [MSW Browser Integration](https://mswjs.io/docs/integrations/browser)
- [Vite Configuration](https://vitejs.dev/)

---

**Last Updated**: 2025-09-30
**Version**: 1.0.0
**Status**: ✅ Complete - All 15 endpoints implemented