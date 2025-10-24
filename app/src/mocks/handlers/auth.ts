import { http, HttpResponse } from 'msw'
import { delay } from '../data/mockData'
import { getCurrentUser } from '../data/storage'

// Authentication handlers
export const authHandlers = [
  // POST /api/auth/send-code - Send verification code to email
  http.post('/api/auth/send-code', async ({ request }) => {
    await delay(150)

    try {
      const body = await request.json() as { email: string }

      if (!body.email) {
        return HttpResponse.json(
          { error: 'Email est requis' },
          { status: 400 }
        )
      }

      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email)) {
        return HttpResponse.json(
          { error: 'Format d\'email invalide' },
          { status: 400 }
        )
      }

      // Mock: simulate sending email with code
      // In production, this would send an actual email
      console.log(`📧 Code de vérification envoyé à ${body.email}: 123456`)

      return HttpResponse.json(
        { message: 'Code de vérification envoyé par email' },
        { status: 200 }
      )
    } catch (error) {
      return HttpResponse.json(
        { error: 'Corps de requête invalide' },
        { status: 400 }
      )
    }
  }),

  // GET /api/auth/me - Get current authenticated user
  http.get('/api/auth/me', async ({ request }) => {
    await delay(100)

    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const currentUser = getCurrentUser()

    if (!currentUser) {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json(currentUser, { status: 200 })
  }),

  // POST /api/auth/login - Login with verification code
  http.post('/api/auth/login', async ({ request }) => {
    await delay(150)

    try {
      const body = await request.json() as { email: string; code: string }

      if (!body.email || !body.code) {
        return HttpResponse.json(
          { error: 'Email et code sont requis' },
          { status: 400 }
        )
      }

      // Validate code (mock: any 6-digit code works, or 123456 for simplicity)
      if (body.code.length !== 6 || !/^\d+$/.test(body.code)) {
        return HttpResponse.json(
          { error: 'Code invalide' },
          { status: 400 }
        )
      }

      // Mock: Accept any 6-digit code (in production, verify against sent code)
      const currentUser = getCurrentUser()

      return HttpResponse.json(
        {
          token: `mock-jwt-token-${Date.now()}`,
          user: currentUser,
        },
        { status: 200 }
      )
    } catch (error) {
      return HttpResponse.json(
        { error: 'Corps de requête invalide' },
        { status: 400 }
      )
    }
  }),

  // POST /api/auth/register - Register new user
  http.post('/api/auth/register', async ({ request }) => {
    await delay(200)

    try {
      const body = await request.json() as { email: string }

      if (!body.email) {
        return HttpResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        )
      }

      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email)) {
        return HttpResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }

      // Create new user account
      const currentUser = getCurrentUser()
      const newUser = {
        ...currentUser,
        email: body.email,
        onboardingComplete: false, // New users haven't completed onboarding
      }

      return HttpResponse.json(
        {
          token: `mock-jwt-token-${Date.now()}`,
          user: newUser,
        },
        { status: 201 }
      )
    } catch (error) {
      return HttpResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
  }),

  // POST /api/auth/verify-email - Verify email with code
  http.post('/api/auth/verify-email', async ({ request }) => {
    await delay(150)

    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    try {
      const body = await request.json() as { code: string }

      if (!body.code) {
        return HttpResponse.json(
          { error: 'Verification code is required' },
          { status: 400 }
        )
      }

      // Mock verification - any 6-digit code works
      if (body.code.length !== 6) {
        return HttpResponse.json(
          { error: 'Invalid verification code' },
          { status: 400 }
        )
      }

      return HttpResponse.json(
        { message: 'Email verified successfully' },
        { status: 200 }
      )
    } catch (error) {
      return HttpResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
  }),

]