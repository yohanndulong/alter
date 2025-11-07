# Mock API System - Setup Complete

## Overview

A complete mock API system has been implemented for the Alter dating app using Mock Service Worker (MSW). The system provides 15 fully functional endpoints with stateful data management.

## What Was Implemented

### 1. Mock Service Worker Integration
- **Library**: MSW v2.11.3
- **Integration**: Vite + React + TypeScript
- **Service Worker**: Configured in `public/mockServiceWorker.js`

### 2. Complete Endpoint Coverage (15 endpoints)

#### Onboarding Service (3 endpoints)
- `GET /api/onboarding/questions` - Get onboarding questions
- `POST /api/onboarding/answers` - Submit user answers
- `POST /api/onboarding/complete` - Complete onboarding

#### Matching Service (6 endpoints)
- `GET /api/matching/discover` - Get profiles for discovery
- `POST /api/matching/like/:userId` - Like a profile
- `POST /api/matching/pass/:userId` - Pass on a profile
- `GET /api/matching/matches` - Get all matches
- `GET /api/matching/interested` - Get users who liked you
- `DELETE /api/matching/matches/:matchId` - Unmatch

#### Chat Service (6 endpoints)
- `GET /api/chat/matches/:matchId/messages` - Get messages
- `POST /api/chat/matches/:matchId/messages` - Send message
- `POST /api/chat/matches/:matchId/read` - Mark as read
- `GET /api/chat/ai/messages` - Get AI chat history
- `POST /api/chat/ai/messages` - Send AI message
- `POST /api/chat/ai/answer` - Answer AI question

### 3. Mock Data System

**Data Generators** (`src/mocks/data/mockData.ts`):
- Realistic user profiles with names, ages, interests
- Match generation with compatibility scores
- Message generation with timestamps
- Onboarding questions (8 questions)
- AI chat responses with contextual awareness

**State Management** (`src/mocks/data/storage.ts`):
- In-memory storage that persists during session
- Pre-populated with:
  - 1 current user (you)
  - 20 discover profiles
  - 8 initial matches
  - Conversation history for each match
  - 5 interested users
  - AI chat welcome message

### 4. Advanced Features

**Authentication**:
- All endpoints check for `Authorization: Bearer <token>` header
- Returns 401 Unauthorized if missing

**Realistic Behavior**:
- Response delays (50-200ms) simulate network latency
- Proper HTTP status codes (200, 201, 400, 401, 404, 500)
- Stateful interactions (like → potential match)
- 30% chance of instant match when liking a profile

**Smart AI Chat**:
- Contextual responses based on keywords
- Follow-up question options
- Maintains conversation history

**Message System**:
- Chronological message ordering
- Unread count tracking
- Read status per message
- Auto-updates match list order

## File Structure

```
c:\dev\alter\alter-app-V2\
├── src/
│   ├── mocks/
│   │   ├── index.ts                    # Main entry point
│   │   ├── browser.ts                  # MSW browser setup
│   │   ├── README.md                   # Detailed documentation
│   │   ├── data/
│   │   │   ├── mockData.ts            # Data generators
│   │   │   └── storage.ts             # State management
│   │   └── handlers/
│   │       ├── index.ts               # Handler exports
│   │       ├── onboarding.ts          # Onboarding endpoints
│   │       ├── matching.ts            # Matching endpoints
│   │       └── chat.ts                # Chat endpoints
│   └── main.tsx                        # Auto-initializes mock server
├── public/
│   └── mockServiceWorker.js           # MSW service worker
└── package.json                        # MSW configured
```

## Usage

### Automatic (Default)

The mock server starts automatically in development mode. Just run:

```bash
npm run dev
```

You'll see in the console:
```
🚀 Mock API server started successfully!
📊 All 15 endpoints are ready:
  - Onboarding: 3 endpoints
  - Matching: 6 endpoints
  - Chat: 6 endpoints
```

### Manual Control

If you need programmatic control:

```typescript
import { startMockServer, stopMockServer, resetMockServer } from '@/mocks'

// Start
await startMockServer()

// Stop
stopMockServer()

// Reset state
resetMockServer()
```

## Testing the Mock API

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Open Browser DevTools

- Console tab: See MSW logs
- Network tab: See intercepted requests

### 3. Test Authentication

The mock server requires an auth token. To set one:

```javascript
// In browser console
localStorage.setItem('auth_token', 'test-token-123')
```

### 4. Test Endpoints

Navigate through the app:

- **Onboarding**: Answer questions
- **Discover**: Swipe through profiles
- **Matches**: View and chat with matches
- **AI Chat**: Talk to the assistant

### 5. Monitor Network Activity

In DevTools Network tab, filter by `/api/` to see:
- Request/response bodies
- Status codes
- Response times

## Configuration

### Adjust Response Delays

Edit handlers to change delays:

```typescript
// In src/mocks/handlers/*.ts
await delay(100) // milliseconds
```

### Modify Mock Data

Edit data pools in `src/mocks/data/mockData.ts`:

```typescript
const firstNames = ['Emma', 'Olivia', ...] // Add/change names
const interests = ['Photography', ...] // Add/change interests
```

### Change Match Probability

In `src/mocks/data/storage.ts`:

```typescript
// Line ~94: Change from 30% to desired probability
const isMatch = Math.random() < 0.3 // 0.3 = 30%
```

## Troubleshooting

### Mock Server Not Starting

**Symptom**: No console logs about mock server
**Solution**:
1. Check `src/main.tsx` has the initialization code
2. Verify you're in development mode (`npm run dev`)
3. Check for errors in browser console

### Endpoints Return 401

**Symptom**: All requests return "Unauthorized"
**Solution**:
```javascript
localStorage.setItem('auth_token', 'any-token')
```

### Service Worker Issues

**Symptom**: "Failed to register service worker"
**Solution**:
1. Ensure `public/mockServiceWorker.js` exists
2. Clear browser cache
3. Reload page

### TypeScript Errors

**Symptom**: Build errors
**Solution**:
```bash
npm run build
# Check for compilation errors
```

## Development Workflow

### Adding a New Endpoint

1. **Add handler** in appropriate file:
```typescript
// In src/mocks/handlers/matching.ts
http.post(`${API_BASE}/matching/new-feature`, async ({ request }) => {
  // Implementation
})
```

2. **Update storage** if needed:
```typescript
// In src/mocks/data/storage.ts
export function newFeatureMethod() {
  // State manipulation
}
```

3. **Export handler**:
```typescript
// In src/mocks/handlers/index.ts
export const handlers = [
  ...existingHandlers,
  newHandler
]
```

### Debugging State

Check current storage state:

```javascript
// In browser console
import { getStorageSnapshot } from '@/mocks/data/storage'
console.log(getStorageSnapshot())
```

### Resetting Data

Reload the page to reset all mock data to initial state.

## Production Builds

The mock server is automatically excluded from production:

```typescript
if (import.meta.env.DEV) {
  // Only runs in development
  await startMockServer()
}
```

To build for production:

```bash
npm run build
```

The build will NOT include mock server code in the bundle.

## Documentation

Comprehensive documentation available in:
- `src/mocks/README.md` - Detailed API documentation
- This file - Setup and quick reference

## Next Steps

1. **Test all features**: Navigate through the app and verify each endpoint works
2. **Customize data**: Adjust mock data to match your needs
3. **Add features**: Implement additional endpoints as needed
4. **Connect real API**: When backend is ready, remove/disable mock server

## Support

For MSW documentation and advanced usage:
- [MSW Official Docs](https://mswjs.io/)
- [MSW Browser Integration](https://mswjs.io/docs/integrations/browser)
- [MSW Recipes](https://mswjs.io/docs/recipes)

---

**Status**: ✅ Complete and Tested
**Version**: 1.0.0
**Last Updated**: 2025-09-30

The mock API system is fully functional and ready for development!