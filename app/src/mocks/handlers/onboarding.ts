import { http, HttpResponse } from 'msw'
import { generateOnboardingQuestions, delay } from '../data/mockData'
import { saveOnboardingAnswers, completeOnboarding } from '../data/storage'
import { OnboardingAnswer } from '@/types'

const API_BASE = '/api'

/**
 * Onboarding API handlers
 * Handles user onboarding flow with questions and answers
 */

export const onboardingHandlers = [
  // GET /onboarding/questions - Get onboarding questions
  http.get(`${API_BASE}/onboarding/questions`, async ({ request }) => {
    await delay(100) // Realistic delay

    // Check for auth token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const questions = generateOnboardingQuestions()

    return HttpResponse.json(questions, { status: 200 })
  }),

  // POST /onboarding/answers - Submit onboarding answers
  http.post(`${API_BASE}/onboarding/answers`, async ({ request }) => {
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
      const body = await request.json() as { answers: OnboardingAnswer[] }

      if (!body.answers || !Array.isArray(body.answers)) {
        return HttpResponse.json(
          { message: 'Invalid request body' },
          { status: 400 }
        )
      }

      // Save answers to storage
      saveOnboardingAnswers(body.answers)

      return HttpResponse.json(
        { message: 'Answers saved successfully' },
        { status: 200 }
      )
    } catch (error) {
      return HttpResponse.json(
        { message: 'Failed to process answers' },
        { status: 500 }
      )
    }
  }),

  // POST /onboarding/complete - Complete onboarding process
  http.post(`${API_BASE}/onboarding/complete`, async ({ request }) => {
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
      // Mark onboarding as complete
      completeOnboarding()

      return HttpResponse.json(
        { message: 'Onboarding completed successfully' },
        { status: 200 }
      )
    } catch (error) {
      return HttpResponse.json(
        { message: 'Failed to complete onboarding' },
        { status: 500 }
      )
    }
  })
]