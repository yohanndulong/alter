# Mock API Quick Start Guide

## 🚀 Get Started in 30 Seconds

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Open Your Browser

Navigate to: `http://localhost:5174` (or the port shown in terminal)

### 3. Check Console

You should see:
```
🚀 Mock API server started successfully!
📊 All 15 endpoints are ready:
  - Onboarding: 3 endpoints
  - Matching: 6 endpoints
  - Chat: 6 endpoints
```

### 4. Set Auth Token

Open browser console (F12) and run:
```javascript
localStorage.setItem('auth_token', 'test-token-123')
```

### 5. Use the App!

Everything works automatically. The mock API handles all requests.

---

## 🔍 Verify It's Working

### Check Network Tab (DevTools)

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by: `/api/`
4. Use the app
5. See intercepted requests with mock responses

### Check Console

Look for MSW logs:
```
[MSW] GET /api/matching/discover (200 OK)
[MSW] POST /api/matching/like/user-123 (200 OK)
```

---

## 📖 What's Available

### All Endpoints Mocked (15 total)

**Onboarding**
- Get questions
- Submit answers
- Complete onboarding

**Matching**
- Discover profiles (10 at a time)
- Like profiles (30% match chance!)
- Pass profiles
- View matches
- See who liked you
- Unmatch

**Chat**
- Get message history
- Send messages
- Mark as read
- AI chat assistant
- Send AI messages
- Answer AI questions

### Pre-Generated Data

On startup, you get:
- 20 profiles to discover
- 8 existing matches
- Full conversation histories
- 5 users interested in you
- AI chat ready to help

---

## 🎯 Common Tasks

### Test Matching Flow

1. Go to Discover page
2. Like a profile
3. 30% chance → "It's a Match!" modal
4. Check Matches page
5. See new match appear

### Test Chat

1. Go to Matches page
2. Click on a match
3. View conversation history
4. Send a message
5. See message appear instantly

### Test AI Chat

1. Go to Alter AI page
2. Type a message
3. Get contextual response
4. Click suggested options

### Reset Everything

Simply refresh the page! All data resets to initial state.

---

## 🛠️ Troubleshooting

### Problem: No console logs

**Solution**: Check you're in development mode
```bash
npm run dev  # Not npm run build
```

### Problem: 401 Unauthorized errors

**Solution**: Set auth token
```javascript
localStorage.setItem('auth_token', 'any-value-works')
```

### Problem: Service worker error

**Solution**:
1. Check `public/mockServiceWorker.js` exists
2. Clear browser cache (Ctrl+Shift+Del)
3. Reload page

---

## 📚 Documentation

Need more details? Check these docs:

1. **`src/mocks/README.md`**
   - Complete API reference
   - All endpoints documented
   - Advanced usage

2. **`MOCK_API_SETUP.md`**
   - Setup instructions
   - Configuration guide
   - Customization tips

3. **`IMPLEMENTATION_SUMMARY.md`**
   - Technical details
   - Architecture overview
   - Implementation status

4. **`src/mocks/ARCHITECTURE.md`**
   - System architecture
   - Data flow diagrams
   - Extension guide

---

## 💡 Tips

### View Mock Data State

```javascript
import { getStorageSnapshot } from './src/mocks/data/storage'
console.log(getStorageSnapshot())
```

### Customize Response Delays

Edit handler files:
```typescript
await delay(100)  // Make it faster/slower
```

### Add New Endpoints

Follow the pattern in existing handlers:
1. Create handler function
2. Add to handlers array
3. Test in browser

---

## ✅ That's It!

You now have a fully functional mock API. Start building your UI without waiting for the backend!

**Questions?** Check the detailed documentation files listed above.

---

**Status**: ✅ Ready to use
**Version**: 1.0.0
**Last Updated**: 2025-09-30