import { http, HttpResponse } from 'msw'
import { delay } from '../data/mockData'
import {
  getMessages,
  addMessage,
  markMessagesAsRead,
  getCurrentUser,
  getAiChatHistory,
  addAiMessage,
  generateAiResponse
} from '../data/storage'

const API_BASE = '/api'

/**
 * Chat API handlers
 * Handles messaging between matches and AI chat assistant
 */

export const chatHandlers = [
  // GET /chat/matches/:matchId/messages - Get messages for a match
  http.get(`${API_BASE}/chat/matches/:matchId/messages`, async ({ request, params }) => {
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

      const messages = getMessages(matchId)

      return HttpResponse.json(messages, { status: 200 })
    } catch (error) {
      return HttpResponse.json(
        { message: 'Failed to fetch messages' },
        { status: 500 }
      )
    }
  }),

  // POST /chat/matches/:matchId/messages - Send a message
  http.post(`${API_BASE}/chat/matches/:matchId/messages`, async ({ request, params }) => {
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
      const { matchId } = params

      if (typeof matchId !== 'string') {
        return HttpResponse.json(
          { message: 'Invalid match ID' },
          { status: 400 }
        )
      }

      const body = await request.json() as { content: string }

      if (!body.content || typeof body.content !== 'string') {
        return HttpResponse.json(
          { message: 'Message content is required' },
          { status: 400 }
        )
      }

      const currentUser = getCurrentUser()
      if (!currentUser) {
        return HttpResponse.json(
          { message: 'User not found' },
          { status: 404 }
        )
      }

      const message = addMessage(matchId, body.content, currentUser.id)

      return HttpResponse.json(message, { status: 201 })
    } catch (error) {
      return HttpResponse.json(
        { message: 'Failed to send message' },
        { status: 500 }
      )
    }
  }),

  // POST /chat/matches/:matchId/read - Mark messages as read
  http.post(`${API_BASE}/chat/matches/:matchId/read`, async ({ request, params }) => {
    await delay(50) // Quick operation

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

      markMessagesAsRead(matchId)

      return HttpResponse.json(
        { message: 'Messages marked as read' },
        { status: 200 }
      )
    } catch (error) {
      return HttpResponse.json(
        { message: 'Failed to mark messages as read' },
        { status: 500 }
      )
    }
  }),

  // GET /chat/ai/messages - Get AI chat history
  http.get(`${API_BASE}/chat/ai/messages`, async ({ request }) => {
    await delay(80) // Realistic delay

    // Check for auth token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    try {
      const chatHistory = getAiChatHistory()

      return HttpResponse.json(chatHistory, { status: 200 })
    } catch (error) {
      return HttpResponse.json(
        { message: 'Failed to fetch AI chat history' },
        { status: 500 }
      )
    }
  }),

  // POST /chat/ai/messages - Send message to AI
  http.post(`${API_BASE}/chat/ai/messages`, async ({ request }) => {
    await delay(200) // Simulate AI processing time

    // Check for auth token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    try {
      const body = await request.json() as { content: string }

      if (!body.content || typeof body.content !== 'string') {
        return HttpResponse.json(
          { message: 'Message content is required' },
          { status: 400 }
        )
      }

      // Add user message
      addAiMessage(body.content, 'user')

      // Generate and add AI response
      const aiResponse = generateAiResponse(body.content)

      return HttpResponse.json(aiResponse, { status: 201 })
    } catch (error) {
      return HttpResponse.json(
        { message: 'Failed to send message to AI' },
        { status: 500 }
      )
    }
  }),

  // POST /chat/ai/answer - Answer AI question with predefined option
  http.post(`${API_BASE}/chat/ai/answer`, async ({ request }) => {
    await delay(180) // Simulate AI processing time

    // Check for auth token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    try {
      const body = await request.json() as {
        questionId: string
        answer: string | string[]
      }

      if (!body.answer) {
        return HttpResponse.json(
          { message: 'Answer is required' },
          { status: 400 }
        )
      }

      // Add user's answer
      const answerText = Array.isArray(body.answer)
        ? body.answer.join(', ')
        : body.answer

      addAiMessage(answerText, 'user')

      // Generate contextual response based on answer
      const aiResponse = generateAiResponse(answerText)

      return HttpResponse.json(aiResponse, { status: 201 })
    } catch (error) {
      return HttpResponse.json(
        { message: 'Failed to process answer' },
        { status: 500 }
      )
    }
  })
]