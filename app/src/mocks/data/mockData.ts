import { User, Match, Message, OnboardingQuestion, ChatMessage, CompatibilityEvolution } from '@/types'

/**
 * Mock data generators for the Alter app
 * Generates realistic, type-safe mock data for all API endpoints
 */

// Sample data pools
const firstNames = [
  'Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Mia', 'Charlotte', 'Amelia',
  'Liam', 'Noah', 'Oliver', 'Elijah', 'James', 'William', 'Benjamin', 'Lucas',
  'Sophie', 'Chloe', 'Zoe', 'Luna', 'Maya', 'Aria', 'Grace', 'Lily',
  'Ethan', 'Alexander', 'Michael', 'Daniel', 'Henry', 'Jackson', 'Sebastian', 'Aiden'
]

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore'
]

const interests = [
  'Photography', 'Travel', 'Cooking', 'Fitness', 'Reading', 'Music', 'Art', 'Gaming',
  'Yoga', 'Hiking', 'Movies', 'Dancing', 'Swimming', 'Running', 'Cycling', 'Painting',
  'Writing', 'Meditation', 'Gardening', 'Fashion', 'Technology', 'Coffee', 'Wine', 'Food'
]

const bioTemplates = [
  "Passionné par les voyages et les nouvelles cultures, j'aime découvrir des endroits insolites et rencontrer des gens authentiques. Le weekend, tu me trouveras soit en randonnée soit en train d'essayer un nouveau restaurant. Je cherche quelqu'un avec qui partager ces aventures et créer de beaux souvenirs.",
  "Développeur le jour, musicien la nuit. J'adore créer, que ce soit du code ou de la musique. Fan de concerts live et de bonne bouffe. Je recherche une personne curieuse, ouverte d'esprit et qui sait apprécier les petits plaisirs de la vie. Un bon film, une bonne conversation, et je suis comblé.",
  "Amoureuse de la nature et du grand air. Le yoga et la méditation font partie de mon quotidien. J'aime les discussions profondes autour d'un thé, les couchers de soleil en bord de mer et les personnes authentiques. Si tu aimes prendre le temps de vivre et que tu as un bon sens de l'humour, on devrait bien s'entendre.",
  "Architecte passionné par le design et l'art sous toutes ses formes. J'adore flâner dans les musées, découvrir de nouveaux quartiers et photographier la ville. Je cherche une âme créative avec qui partager ma passion pour l'esthétique et l'exploration urbaine.",
  "Sportif dans l'âme, je passe mon temps libre entre la salle de sport, le vélo et les trails en montagne. J'aime me dépasser et vivre pleinement. Mais je sais aussi apprécier une bonne soirée Netflix et un brunch le dimanche. Recherche quelqu'un d'actif qui aime autant bouger que se poser.",
  "Professeure et éternelle étudiante de la vie. Passionnée de littérature, d'histoire et de voyages culturels. J'aime les longues discussions, les librairies indépendantes et les cafés cosy. Si tu aimes apprendre, découvrir et partager, on a déjà plein de choses à se raconter.",
  "Chef cuisinier amateur, je passe mes weekends à tester de nouvelles recettes et inviter des amis. J'adore les marchés locaux, les vins naturels et la bonne compagnie. Je recherche quelqu'un qui apprécie la gastronomie et avec qui explorer les meilleures tables de la ville.",
  "Entrepreneur passionné par l'innovation et les nouvelles technologies. J'aime les défis, les startups et les personnes qui voient grand. Mais je sais aussi déconnecter : surf, voyages et soirées entre amis. Recherche une personne ambitieuse, positive et qui sait profiter du moment présent."
]

const insightTemplates = [
  "Vos valeurs familiales et votre vision de l'avenir sont très alignées 💫",
  "Vous partagez une passion commune pour les voyages et la découverte de nouvelles cultures 🌍",
  "Votre sens de l'humour et votre approche de la vie semblent très compatibles 😄",
  "Vous avez des objectifs de vie similaires et des priorités communes 🎯",
  "Votre style de communication et votre niveau d'engagement dans les relations sont alignés 💬",
  "Vous partagez un intérêt profond pour le développement personnel et la croissance 🌱",
  "Vos modes de vie actifs et votre passion pour le sport créent une belle synergie 🏃",
  "Votre créativité et votre ouverture d'esprit vous rapprochent naturellement 🎨",
  "Vous avez des visions similaires sur l'équilibre vie professionnelle/personnelle ⚖️",
  "Votre approche de l'intimité et de la connexion émotionnelle sont harmonieuses 💕"
]

const profileImages = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
]

// Helper functions
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function randomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Helper to generate compatibility evolution
function generateCompatibilityEvolution(_score: number): CompatibilityEvolution {
  const weeklyChange = randomInt(-5, 12)
  let trend: 'up' | 'down' | 'stable'

  if (weeklyChange > 3) trend = 'up'
  else if (weeklyChange < -2) trend = 'down'
  else trend = 'stable'

  return {
    trend,
    weeklyChange,
    lastUpdated: new Date(Date.now() - randomInt(0, 7) * 24 * 60 * 60 * 1000)
  }
}

// Mock data generators
export function generateUser(overrides?: Partial<User>): User {
  const id = overrides?.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const firstName = randomItem(firstNames)
  const lastName = randomItem(lastNames)
  const gender = overrides?.gender || randomItem(['male', 'female', 'other'] as const)
  const globalScore = randomInt(60, 98)

  const images = randomItems(profileImages, randomInt(2, 4))
  const photos = images.map((url, index) => ({
    id: `photo-${id}-${index}`,
    url,
    isPrimary: index === 0,
    order: index
  }))

  return {
    id,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    name: `${firstName} ${lastName}`,
    age: randomInt(22, 45),
    gender,
    bio: randomItem(bioTemplates),
    interests: randomItems(interests, randomInt(3, 7)),
    images,
    photos,
    location: {
      latitude: 40.7128 + (Math.random() - 0.5) * 0.5,
      longitude: -74.0060 + (Math.random() - 0.5) * 0.5
    },
    onboardingComplete: true,
    preferences: {
      ageRange: [25, 40],
      distance: 50,
      gender: ['male', 'female', 'other']
    },
    compatibilityScoreGlobal: globalScore,
    compatibilityScoreLove: randomInt(55, 98),
    compatibilityScoreFriendship: randomInt(60, 98),
    compatibilityScoreCarnal: randomInt(50, 98),
    compatibilityEvolution: globalScore > 75 ? generateCompatibilityEvolution(globalScore) : undefined,
    compatibilityInsight: globalScore > 75 ? randomItem(insightTemplates) : undefined,
    ...overrides
  }
}

export function generateMatch(userId: string, matchedUser: User): Match {
  const hasLastMessage = Math.random() > 0.3
  const lastMessages = [
    "Hey! How's your day going?",
    "I saw you like hiking too! Have any favorite trails?",
    "That's amazing! Would love to hear more about it.",
    "Haha, that's so funny!",
    "What are you up to this weekend?",
    "I totally agree with you on that!",
    "Thanks for sharing! That sounds really interesting.",
    "We should definitely grab coffee sometime!",
    "That place looks incredible! I'd love to go there.",
    "You seem really interesting! Tell me more about yourself.",
    "Looking forward to chatting more!",
    "That sounds like a plan!",
    "Can't wait to meet you!"
  ]

  return {
    id: `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    matchedUserId: matchedUser.id,
    matchedUser: matchedUser,
    compatibilityScore: randomInt(70, 98),
    compatibilityScoreGlobal: randomInt(60, 98),
    compatibilityScoreLove: randomInt(55, 98),
    compatibilityScoreFriendship: randomInt(60, 98),
    compatibilityScoreCarnal: randomInt(50, 98),
    matchedAt: new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000),
    lastMessageAt: hasLastMessage
      ? new Date(Date.now() - randomInt(0, 24) * 60 * 60 * 1000)
      : undefined,
    lastMessage: hasLastMessage ? randomItem(lastMessages) : undefined,
    unreadCount: Math.random() > 0.5 ? randomInt(0, 5) : 0,
    conversationQualityScore: randomInt(45, 98)
  }
}

export function generateMessage(
  matchId: string,
  senderId: string,
  receiverId: string,
  overrides?: Partial<Message>
): Message {
  const messages = [
    "Hey! How's your day going?",
    "I saw you like hiking too! Have any favorite trails?",
    "That's amazing! Would love to hear more about it.",
    "Haha, that's so funny!",
    "What are you up to this weekend?",
    "I totally agree with you on that!",
    "Thanks for sharing! That sounds really interesting.",
    "We should definitely grab coffee sometime!",
    "That place looks incredible! I'd love to go there.",
    "You seem really interesting! Tell me more about yourself."
  ]

  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    matchId,
    senderId,
    receiverId,
    type: 'text' as const,
    content: randomItem(messages),
    delivered: Math.random() > 0.2,
    deliveredAt: new Date(Date.now() - randomInt(0, 24) * 60 * 60 * 1000),
    read: Math.random() > 0.3,
    readAt: Math.random() > 0.3 ? new Date(Date.now() - randomInt(0, 12) * 60 * 60 * 1000) : undefined,
    createdAt: new Date(Date.now() - randomInt(0, 48) * 60 * 60 * 1000),
    ...overrides
  }
}

export function generateOnboardingQuestions(): OnboardingQuestion[] {
  return [
    {
      id: 'q1',
      key: 'first_name',
      type: 'text',
      question: 'What is your first name?',
      placeholder: 'Enter your name',
      required: true
    },
    {
      id: 'q2',
      key: 'age',
      type: 'number',
      question: 'How old are you?',
      placeholder: '25',
      required: true,
      min: 18,
      max: 100
    },
    {
      id: 'q3',
      key: 'gender',
      type: 'single_choice',
      question: 'What is your gender?',
      options: ['Male', 'Female', 'Other'],
      required: true
    },
    {
      id: 'q4',
      key: 'bio',
      type: 'text',
      question: 'Tell us about yourself',
      placeholder: 'Share a bit about who you are...',
      required: true
    },
    {
      id: 'q5',
      key: 'interests',
      type: 'multiple_choice',
      question: 'What are your interests?',
      options: interests,
      required: true
    },
    {
      id: 'q6',
      key: 'age_range',
      type: 'slider',
      question: 'What is your preferred age range?',
      required: true,
      min: 18,
      max: 100
    },
    {
      id: 'q7',
      key: 'max_distance',
      type: 'slider',
      question: 'Maximum distance (in miles)?',
      required: true,
      min: 5,
      max: 100
    },
    {
      id: 'q8',
      key: 'gender_interest',
      type: 'multiple_choice',
      question: 'What gender(s) are you interested in?',
      options: ['Male', 'Female', 'Other'],
      required: true
    }
  ]
}

export function generateAiChatMessage(
  role: 'user' | 'assistant',
  content: string,
  options?: string[],
  selectionType?: 'single' | 'multiple' | 'freetext'
): ChatMessage {
  return {
    id: `ai-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role,
    content,
    timestamp: new Date(),
    options,
    selectionType: options ? (selectionType || 'single') : (selectionType === 'freetext' ? 'freetext' : undefined)
  }
}

// Utility for adding realistic delays
export { delay }

// Pre-generated mock users for discover feed
export function generateDiscoverUsers(count: number = 10): User[] {
  return Array.from({ length: count }, (_, i) => generateUser({ id: `discover-${i}` }))
}

// Pre-generated matches for current user
export function generateMatches(currentUserId: string, count: number = 5): Match[] {
  return Array.from({ length: count }, () => {
    const matchedUser = generateUser()
    return generateMatch(currentUserId, matchedUser)
  })
}

// Generate conversation history
export function generateConversation(
  matchId: string,
  senderId: string,
  receiverId: string,
  messageCount: number = 15
): Message[] {
  const messages: Message[] = []

  for (let i = 0; i < messageCount; i++) {
    // Alternate between sender and receiver
    const isFromSender = i % 2 === 0
    messages.push(
      generateMessage(
        matchId,
        isFromSender ? senderId : receiverId,
        isFromSender ? receiverId : senderId,
        {
          createdAt: new Date(Date.now() - (messageCount - i) * 60 * 60 * 1000),
          read: i < messageCount - 3 // Last few messages are unread
        }
      )
    )
  }

  return messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
}