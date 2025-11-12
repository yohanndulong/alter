import { User, Match, Message, OnboardingAnswer, ChatMessage } from '@/types'
import {
  generateUser,
  generateMatch,
  generateDiscoverUsers,
  generateMatches,
  generateConversation,
  generateAiChatMessage
} from './mockData'

/**
 * In-memory storage for mock API state
 * Simulates a database that persists across API calls during the session
 */

interface MockStorage {
  currentUser: User | null
  discoverUsers: User[]
  matches: Match[]
  messages: { [matchId: string]: Message[] }
  likedUsers: Set<string>
  passedUsers: Set<string>
  interestedUsers: User[]
  onboardingAnswers: OnboardingAnswer[]
  aiChatHistory: ChatMessage[]
}

// Initialize storage
const storage: MockStorage = {
  currentUser: null,
  discoverUsers: [],
  matches: [],
  messages: {},
  likedUsers: new Set(),
  passedUsers: new Set(),
  interestedUsers: [],
  onboardingAnswers: [],
  aiChatHistory: []
}

// Initialize with mock data
export function initializeMockStorage(): void {
  // Create current user (simulating logged-in user)
  storage.currentUser = generateUser({
    id: 'current-user',
    email: 'me@example.com',
    name: 'Current User',
    onboardingComplete: true
  })

  // Generate discover feed
  storage.discoverUsers = generateDiscoverUsers(20)

  // Generate existing matches
  storage.matches = generateMatches(storage.currentUser.id, 8)

  // Generate message history for each match
  storage.matches.forEach(match => {
    storage.messages[match.id] = generateConversation(
      match.id,
      storage.currentUser!.id,
      match.matchedUserId,
      Math.floor(Math.random() * 20) + 5
    )
  })

  // Generate some "interested" users (users who liked current user)
  storage.interestedUsers = generateDiscoverUsers(5)

  // Initialize AI chat with welcome message
  storage.aiChatHistory = [
    generateAiChatMessage(
      'assistant',
      "Hi! I'm Alter AI, your personal dating assistant. I'm here to help you find meaningful connections. Let's start by getting to know you better!",
      ['Tell me about yourself', 'What makes a good match?', 'Give me dating tips'],
      'single'
    )
  ]
}

// Storage accessors and mutators

export function getCurrentUser(): User | null {
  return storage.currentUser
}

export function getDiscoverUsers(): User[] {
  // Filter out users already liked or passed, then sort by compatibility
  return storage.discoverUsers
    .filter(user => !storage.likedUsers.has(user.id) && !storage.passedUsers.has(user.id))
    .sort((a, b) => (b.compatibilityScoreGlobal || 0) - (a.compatibilityScoreGlobal || 0))
}

export function likeUser(userId: string): { match: boolean; matchData?: Match } {
  storage.likedUsers.add(userId)

  // 30% chance of instant match
  const isMatch = Math.random() < 0.3

  if (isMatch) {
    const likedUser = storage.discoverUsers.find(u => u.id === userId)
    if (likedUser && storage.currentUser) {
      const newMatch = generateMatch(storage.currentUser.id, likedUser)
      storage.matches.push(newMatch)

      // Initialize empty message array for this match
      storage.messages[newMatch.id] = []

      return { match: true, matchData: newMatch }
    }
  }

  return { match: false }
}

export function passUser(userId: string): void {
  storage.passedUsers.add(userId)
}

export function getMatches(): Match[] {
  return storage.matches.sort((a, b) => {
    // Sort by last message time, then by match time
    if (a.lastMessageAt && b.lastMessageAt) {
      return b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
    }
    if (a.lastMessageAt) return -1
    if (b.lastMessageAt) return 1
    return b.matchedAt.getTime() - a.matchedAt.getTime()
  })
}

export function getInterestedUsers(): User[] {
  return storage.interestedUsers
}

export function unmatch(matchId: string): void {
  storage.matches = storage.matches.filter(m => m.id !== matchId)
  delete storage.messages[matchId]
}

export function getMessages(matchId: string): Message[] {
  return storage.messages[matchId] || []
}

export function addMessage(
  matchId: string,
  content: string,
  senderId: string
): Message {
  const match = storage.matches.find(m => m.id === matchId)
  if (!match) {
    throw new Error('Match not found')
  }

  const receiverId = match.userId === senderId ? match.matchedUserId : match.userId

  const newMessage: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sequenceId: Date.now(), // Auto-increment mock
    matchId,
    senderId,
    receiverId,
    type: 'text',
    content,
    delivered: false,
    read: false,
    createdAt: new Date()
  }

  if (!storage.messages[matchId]) {
    storage.messages[matchId] = []
  }

  storage.messages[matchId].push(newMessage)

  // Update match's lastMessageAt
  match.lastMessageAt = newMessage.createdAt
  if (senderId !== storage.currentUser?.id) {
    match.unreadCount++
  }

  return newMessage
}

export function markMessagesAsRead(matchId: string): void {
  const messages = storage.messages[matchId]
  if (messages) {
    messages.forEach(msg => {
      if (msg.receiverId === storage.currentUser?.id) {
        msg.read = true
      }
    })

    // Reset unread count
    const match = storage.matches.find(m => m.id === matchId)
    if (match) {
      match.unreadCount = 0
    }
  }
}

export function saveOnboardingAnswers(answers: OnboardingAnswer[]): void {
  storage.onboardingAnswers = answers

  // Update current user based on answers
  if (storage.currentUser) {
    answers.forEach(answer => {
      // Use questionKey (more robust) or fallback to questionId
      const key = answer.questionKey || answer.questionId

      switch (key) {
        case 'first_name':
        case 'q1':
          if (typeof answer.answer === 'string') {
            storage.currentUser!.name = answer.answer
          }
          break
        case 'age':
        case 'q2':
          if (typeof answer.answer === 'number') {
            storage.currentUser!.age = answer.answer
          }
          break
        case 'gender':
        case 'q3':
          if (typeof answer.answer === 'string') {
            storage.currentUser!.gender = answer.answer.toLowerCase() as 'male' | 'female' | 'other'
          }
          break
        case 'bio':
        case 'q4':
          if (typeof answer.answer === 'string') {
            storage.currentUser!.bio = answer.answer
          }
          break
        case 'interests':
        case 'q5':
          if (Array.isArray(answer.answer) && answer.answer.every(item => typeof item === 'string')) {
            storage.currentUser!.interests = answer.answer as string[]
          }
          break
        case 'birthDate':
          if (typeof answer.answer === 'string' || answer.answer instanceof Date) {
            const birthDate = new Date(answer.answer)
            const today = new Date()
            let age = today.getFullYear() - birthDate.getFullYear()
            const monthDiff = today.getMonth() - birthDate.getMonth()
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--
            }
            storage.currentUser!.age = age
          }
          break
        case 'preferenceAge':
          if (Array.isArray(answer.answer) && answer.answer.length === 2) {
            const [min, max] = answer.answer as [number, number]
            storage.currentUser!.preferenceAgeMin = min
            storage.currentUser!.preferenceAgeMax = max
            storage.currentUser!.preferences.ageRange = [min, max]
          }
          break
        case 'preferenceDistance':
          if (typeof answer.answer === 'number') {
            storage.currentUser!.preferenceDistance = answer.answer
            storage.currentUser!.preferences.distance = answer.answer
          }
          break
        case 'preferenceGender':
          if (Array.isArray(answer.answer) && answer.answer.every(item => typeof item === 'string')) {
            const genders = (answer.answer as string[]).map(g => g.toLowerCase() as 'male' | 'female' | 'other')
            storage.currentUser!.preferenceGenders = genders
            storage.currentUser!.preferences.gender = genders
          }
          break
      }
    })
  }
}

export function completeOnboarding(): void {
  if (storage.currentUser) {
    storage.currentUser.onboardingComplete = true
  }
}

export function getAiChatHistory(): ChatMessage[] {
  return storage.aiChatHistory
}

export function addAiMessage(
  content: string,
  role: 'user' | 'assistant',
  options?: string[],
  selectionType?: 'single' | 'multiple' | 'freetext'
): ChatMessage {
  const message = generateAiChatMessage(role, content, options, selectionType)
  storage.aiChatHistory.push(message)
  return message
}

export function generateAiResponse(userMessage: string): ChatMessage {
  // Simple response generator based on keywords
  let response = ''
  let options: string[] | undefined
  let selectionType: 'single' | 'multiple' | 'freetext' = 'single'

  const lowerMessage = userMessage.toLowerCase()

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    response = "Hello! It's great to chat with you. What would you like to know about finding your perfect match?"
    options = ['How does matching work?', 'Tell me about compatibility', 'What should I write in my bio?']
    selectionType = 'single'
  } else if (lowerMessage.includes('match')) {
    response = "Our matching algorithm considers your interests, values, and preferences to find compatible partners. We focus on meaningful connections rather than superficial swipes!"
    options = ['What makes a good profile?', 'How can I improve my matches?', 'Tell me more']
    selectionType = 'single'
  } else if (lowerMessage.includes('bio') || lowerMessage.includes('profile')) {
    response = "A great profile is authentic and specific! Share your genuine interests, what makes you unique, and what you're looking for. Be positive and approachable."
    options = ['Give me examples', 'What photos should I use?', 'How long should it be?']
    selectionType = 'single'
  } else if (lowerMessage.includes('photo')) {
    response = "Choose clear, recent photos that show your face and personality. Include a mix of solo shots and activity photos. Smile and look approachable!"
    options = ['How many photos?', 'Any photo tips?', 'Back to profile advice']
    selectionType = 'single'
  } else if (lowerMessage.includes('tips') || lowerMessage.includes('advice')) {
    response = "Here are some great dating tips! Which topics interest you the most? (You can select multiple)"
    options = ['First date ideas', 'Conversation starters', 'Body language tips', 'How to be authentic', 'Dealing with rejection']
    selectionType = 'multiple'
  } else if (lowerMessage.includes('yourself') || lowerMessage.includes('about you')) {
    response = "I'd love to learn more about you! What's your ideal first date? Tell me in your own words."
    selectionType = 'freetext'
  } else if (lowerMessage.includes('examples')) {
    response = "Great question! What kind of activities do you enjoy in your free time? Feel free to be as detailed as you'd like!"
    selectionType = 'freetext'
  } else {
    response = "That's an interesting question! Remember, the best connections come from being authentic and open. What else would you like to know?"
    options = ['Dating tips', 'Conversation starters', 'How to make a good first impression']
    selectionType = 'single'
  }

  return addAiMessage(response, 'assistant', options, selectionType)
}

// Export storage for debugging (dev only)
export function getStorageSnapshot() {
  return {
    currentUserId: storage.currentUser?.id,
    discoverCount: storage.discoverUsers.length,
    matchesCount: storage.matches.length,
    likedCount: storage.likedUsers.size,
    passedCount: storage.passedUsers.size,
    interestedCount: storage.interestedUsers.length
  }
}