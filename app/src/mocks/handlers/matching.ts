import { http, HttpResponse } from 'msw'
import { delay } from '../data/mockData'
import {
  getDiscoverUsers,
  likeUser,
  passUser,
  getMatches,
  getInterestedUsers,
  unmatch
} from '../data/storage'

const API_BASE = '/api'

/**
 * Matching API handlers
 * Handles discovery, likes, passes, matches, and interested users
 */

export const matchingHandlers = [
  // GET /matching/discover - Get profiles for discovery feed
  http.get(`${API_BASE}/matching/discover`, async ({ request }) => {
    await delay(120) // Realistic delay

    // Check for auth token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    try {
      const users = getDiscoverUsers()

      // Return first 10 users for the feed
      return HttpResponse.json(users.slice(0, 10), { status: 200 })
    } catch (error) {
      return HttpResponse.json(
        { message: 'Failed to fetch discover profiles' },
        { status: 500 }
      )
    }
  }),

  // POST /matching/like/:userId - Like a user profile
  http.post(`${API_BASE}/matching/like/:userId`, async ({ request, params }) => {
    await delay(150) // Realistic delay

    // Check for auth token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    try {
      const { userId } = params

      if (typeof userId !== 'string') {
        return HttpResponse.json(
          { message: 'Invalid user ID' },
          { status: 400 }
        )
      }

      const result = likeUser(userId)

      if (result.match && result.matchData) {
        // It's a match!
        return HttpResponse.json(
          {
            match: true,
            matchData: result.matchData
          },
          { status: 200 }
        )
      }

      // Like registered but no match yet
      return HttpResponse.json(
        { match: false },
        { status: 200 }
      )
    } catch (error) {
      return HttpResponse.json(
        { message: 'Failed to like profile' },
        { status: 500 }
      )
    }
  }),

  // POST /matching/pass/:userId - Pass on a user profile
  http.post(`${API_BASE}/matching/pass/:userId`, async ({ request, params }) => {
    await delay(100) // Realistic delay

    // Check for auth token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    try {
      const { userId } = params

      if (typeof userId !== 'string') {
        return HttpResponse.json(
          { message: 'Invalid user ID' },
          { status: 400 }
        )
      }

      passUser(userId)

      return HttpResponse.json(
        { message: 'Profile passed' },
        { status: 200 }
      )
    } catch (error) {
      return HttpResponse.json(
        { message: 'Failed to pass profile' },
        { status: 500 }
      )
    }
  }),

  // GET /matching/matches - Get all matches
  http.get(`${API_BASE}/matching/matches`, async ({ request }) => {
    await delay(100) // Realistic delay

    // Check for auth token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    try {
      const matches = getMatches()

      return HttpResponse.json(matches, { status: 200 })
    } catch (error) {
      return HttpResponse.json(
        { message: 'Failed to fetch matches' },
        { status: 500 }
      )
    }
  }),

  // GET /matching/interested - Get users who liked you
  http.get(`${API_BASE}/matching/interested`, async ({ request }) => {
    await delay(100) // Realistic delay

    // Check for auth token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    try {
      const interestedUsers = getInterestedUsers()

      return HttpResponse.json(interestedUsers, { status: 200 })
    } catch (error) {
      return HttpResponse.json(
        { message: 'Failed to fetch interested users' },
        { status: 500 }
      )
    }
  }),

  // DELETE /matching/matches/:matchId - Unmatch with a user
  http.delete(`${API_BASE}/matching/matches/:matchId`, async ({ request, params }) => {
    await delay(100) // Realistic delay

    // Check for auth token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    try {
      const { matchId } = params

      if (typeof matchId !== 'string') {
        return HttpResponse.json(
          { message: 'Invalid match ID' },
          { status: 400 }
        )
      }

      unmatch(matchId)

      return HttpResponse.json(
        { message: 'Match removed successfully' },
        { status: 200 }
      )
    } catch (error) {
      return HttpResponse.json(
        { message: 'Failed to unmatch' },
        { status: 500 }
      )
    }
  })
]