# Mock API System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Application                        │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Onboarding  │  │   Matching   │  │     Chat     │         │
│  │   Service    │  │   Service    │  │   Service    │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                 │
│                            │                                     │
│                      ┌─────▼─────┐                              │
│                      │  api.ts   │                              │
│                      │ (Fetch)   │                              │
│                      └─────┬─────┘                              │
└────────────────────────────┼──────────────────────────────────┘
                             │
                             │ HTTP Requests
                             │
                    ┌────────▼────────┐
                    │  Service Worker │  ◄── MSW Intercepts
                    │ (mockServiceWorker)│
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                              │
              ▼                              ▼
    ┌─────────────────┐          ┌─────────────────┐
    │  MSW Handlers   │          │   Mock Data     │
    │                 │          │   & Storage     │
    │ • onboarding.ts │◄────────►│                 │
    │ • matching.ts   │          │ • mockData.ts   │
    │ • chat.ts       │          │ • storage.ts    │
    └─────────────────┘          └─────────────────┘
```

## Data Flow

### Request Flow (Example: Like a Profile)

```
1. User Action
   └─► ProfileCard.onClick()
       │
2. Service Call
   └─► matchingService.likeProfile(userId)
       │
3. API Layer
   └─► api.post('/matching/like/' + userId)
       │
4. Service Worker Intercepts
   └─► MSW intercepts fetch request
       │
5. Handler Processing
   └─► matchingHandlers[1] processes request
       │
       ├─► Check Authorization header
       ├─► Extract userId from params
       └─► Call storage.likeUser(userId)
           │
6. State Management
   └─► storage.likeUser()
       │
       ├─► Add userId to likedUsers Set
       ├─► 30% chance: Create Match
       │   └─► Add to matches array
       │   └─► Initialize message array
       └─► Return { match: boolean, matchData?: Match }
           │
7. Response
   └─► Handler returns HttpResponse.json()
       │
8. Service Receives
   └─► matchingService returns result
       │
9. Component Updates
   └─► UI shows "It's a Match!" or next profile
```

### Storage State Changes

```
Initial State:
├─ discoverUsers: [user1, user2, user3, ...]
├─ likedUsers: Set()
├─ passedUsers: Set()
└─ matches: []

After Like Action:
├─ discoverUsers: [user1, user2, user3, ...]  (unchanged)
├─ likedUsers: Set(user2)                      (added)
├─ passedUsers: Set()
└─ matches: [match(current, user2)]            (30% chance)

Next Discover Call:
└─ getDiscoverUsers() filters out user2
   Returns: [user1, user3, ...]
```

## Component Architecture

### Directory Structure

```
src/mocks/
│
├── index.ts                     # Public API
│   └─ Exports: startMockServer, stopMockServer, resetMockServer
│
├── browser.ts                   # MSW Setup
│   ├─ setupWorker()
│   ├─ initializeMockStorage()
│   └─ Configuration
│
├── data/
│   ├── mockData.ts             # Generators
│   │   ├─ generateUser()
│   │   ├─ generateMatch()
│   │   ├─ generateMessage()
│   │   ├─ generateOnboardingQuestions()
│   │   ├─ generateAiChatMessage()
│   │   └─ Utility functions
│   │
│   └── storage.ts              # State Management
│       ├─ MockStorage interface
│       ├─ Accessor functions (get*)
│       ├─ Mutator functions (add*, remove*, update*)
│       └─ Business logic
│
└── handlers/
    ├── index.ts                # Aggregator
    │   └─ Exports all handlers
    │
    ├── onboarding.ts           # 3 Endpoints
    │   ├─ GET /questions
    │   ├─ POST /answers
    │   └─ POST /complete
    │
    ├── matching.ts             # 6 Endpoints
    │   ├─ GET /discover
    │   ├─ POST /like/:userId
    │   ├─ POST /pass/:userId
    │   ├─ GET /matches
    │   ├─ GET /interested
    │   └─ DELETE /matches/:matchId
    │
    └── chat.ts                 # 6 Endpoints
        ├─ GET /matches/:matchId/messages
        ├─ POST /matches/:matchId/messages
        ├─ POST /matches/:matchId/read
        ├─ GET /ai/messages
        ├─ POST /ai/messages
        └─ POST /ai/answer
```

## Initialization Sequence

```
1. App Starts
   main.tsx loads
   │
2. Check Environment
   if (import.meta.env.DEV)
   │
3. Dynamic Import
   const { startMockServer } = await import('./mocks')
   │
4. Initialize Storage
   initializeMockStorage()
   ├─ Create currentUser
   ├─ Generate 20 discoverUsers
   ├─ Generate 8 matches
   ├─ Generate conversation history
   ├─ Generate 5 interestedUsers
   └─ Initialize AI chat
   │
5. Start Service Worker
   await worker.start()
   ├─ Register service worker
   ├─ Load mockServiceWorker.js
   └─ Activate handlers
   │
6. Console Output
   "🚀 Mock API server started successfully!"
   │
7. Render App
   ReactDOM.createRoot(...).render(<App />)
```

## Handler Pattern

### Standard Handler Structure

```typescript
http.method(`${API_BASE}/path/:param`, async ({ request, params }) => {
  // 1. Add realistic delay
  await delay(100-200)

  // 2. Check authentication
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  // 3. Validate parameters
  const { param } = params
  if (!param || typeof param !== 'string') {
    return HttpResponse.json({ message: 'Invalid param' }, { status: 400 })
  }

  // 4. Parse body (for POST/PUT/PATCH)
  const body = await request.json()
  if (!body.required) {
    return HttpResponse.json({ message: 'Missing required field' }, { status: 400 })
  }

  // 5. Process request (call storage functions)
  try {
    const result = storageFunction(param, body)

    // 6. Return response
    return HttpResponse.json(result, { status: 200 })
  } catch (error) {
    return HttpResponse.json({ message: 'Error message' }, { status: 500 })
  }
})
```

## Storage Patterns

### Accessor Pattern (Read)

```typescript
export function getMatches(): Match[] {
  return storage.matches.sort((a, b) => {
    // Sort by last message time
    if (a.lastMessageAt && b.lastMessageAt) {
      return b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
    }
    if (a.lastMessageAt) return -1
    if (b.lastMessageAt) return 1
    return b.matchedAt.getTime() - a.matchedAt.getTime()
  })
}
```

### Mutator Pattern (Write)

```typescript
export function addMessage(
  matchId: string,
  content: string,
  senderId: string
): Message {
  // 1. Validate
  const match = storage.matches.find(m => m.id === matchId)
  if (!match) throw new Error('Match not found')

  // 2. Create resource
  const newMessage: Message = {
    id: generateId(),
    matchId,
    senderId,
    receiverId: determineReceiver(match, senderId),
    content,
    createdAt: new Date(),
    read: false
  }

  // 3. Update storage
  if (!storage.messages[matchId]) {
    storage.messages[matchId] = []
  }
  storage.messages[matchId].push(newMessage)

  // 4. Side effects
  match.lastMessageAt = newMessage.createdAt
  if (senderId !== storage.currentUser?.id) {
    match.unreadCount++
  }

  // 5. Return created resource
  return newMessage
}
```

## Type Safety Flow

```typescript
// Type definitions in @/types
interface User { id: string; name: string; ... }
interface Match { id: string; user: User; ... }

// Mock data generator (typed)
export function generateUser(overrides?: Partial<User>): User {
  return { id: '...', name: '...', ...overrides }
}

// Storage (typed)
const storage: MockStorage = {
  matches: Match[]  // Type enforced
}

// Handler (typed)
http.get<Match[]>('/matching/matches', async () => {
  const matches = getMatches()  // Returns Match[]
  return HttpResponse.json(matches)  // Type-safe
})

// Service (typed)
async getMatches(): Promise<Match[]> {
  return api.get<Match[]>('/matching/matches')
}

// Component (typed)
const matches = await matchingService.getMatches()  // Match[]
matches.forEach(match => {
  console.log(match.user.name)  // Autocomplete works!
})
```

## Error Handling Flow

```
Request Error Scenarios:

1. Missing Auth Token
   → Check in handler
   → Return 401 Unauthorized

2. Invalid Parameters
   → Validate in handler
   → Return 400 Bad Request

3. Resource Not Found
   → Check storage
   → Return 404 Not Found

4. Invalid Body
   → Parse & validate
   → Return 400 Bad Request

5. Storage Error
   → Try/catch block
   → Return 500 Internal Server Error

6. Type Error
   → TypeScript prevents at compile time
   → Never reaches runtime
```

## Performance Optimization

### Lazy Loading

```typescript
// main.tsx
if (import.meta.env.DEV) {
  // Dynamic import - only loads in dev
  const { startMockServer } = await import('./mocks')
  await startMockServer()
}
```

### Efficient Storage

```typescript
// Use Sets for O(1) lookups
storage.likedUsers = new Set<string>()

// Check if user was liked
storage.likedUsers.has(userId)  // O(1)

// Use object for O(1) message access
storage.messages = { [matchId: string]: Message[] }

// Get messages for match
storage.messages[matchId]  // O(1)
```

### Request Filtering

```typescript
// Service worker config
worker.start({
  onUnhandledRequest: 'bypass'  // Don't intercept non-API requests
})

// Only intercept /api/* routes
http.get(`${API_BASE}/...`)  // API_BASE = '/api'
```

## Testing Integration

```
Development Testing Flow:

1. Developer runs `npm run dev`
   │
2. Mock server starts automatically
   │
3. Developer interacts with UI
   │
4. Network tab shows intercepted requests
   ├─ Request URL: http://localhost:5174/api/matching/discover
   ├─ Status: 200 OK
   ├─ Type: xhr (intercepted)
   └─ Response: [{ id: '...', name: '...' }]
   │
5. Console shows MSW logs
   └─ [MSW] GET /api/matching/discover (200 OK)

Debugging:
├─ Inspect storage state
├─ Check handler logic
├─ Verify type safety
└─ Test error scenarios
```

## Production Exclusion

```
Build Process:

1. `npm run build`
   │
2. Vite bundles app
   │
3. Tree-shaking removes mock code
   ├─ import.meta.env.DEV = false
   ├─ if (false) { ... }  // Removed
   └─ Mock imports not included
   │
4. Production bundle
   └─ 0 bytes from mock system

Service Worker File:
├─ public/mockServiceWorker.js exists
├─ Not loaded in production
└─ Safe to deploy
```

## Extension Points

### Adding New Endpoint

```
1. Create handler in handlers/[service].ts
   └─ Follow handler pattern

2. Add to handlers/index.ts
   └─ Include in handlers array

3. Update storage.ts (if needed)
   └─ Add data structure & functions

4. Update mockData.ts (if needed)
   └─ Add generator functions

5. Test in browser
   └─ Make API call from app

6. Document in README.md
   └─ Add to endpoint table
```

### Adding New Service

```
1. Create handlers/newService.ts
   └─ Implement endpoints

2. Update storage.ts
   └─ Add service-specific state

3. Update mockData.ts
   └─ Add data generators

4. Export from handlers/index.ts
   └─ Add to handlers array

5. Update documentation
   └─ README.md + ARCHITECTURE.md
```

---

This architecture provides:
- ✅ Modularity
- ✅ Type safety
- ✅ Scalability
- ✅ Maintainability
- ✅ Performance
- ✅ Developer experience