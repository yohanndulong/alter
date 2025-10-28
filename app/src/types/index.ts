export interface Photo {
  id: string
  url: string
  isPrimary: boolean
  order: number
}

export interface User {
  id: string
  email: string
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  bio?: string
  interests: string[]
  images: string[] // Backward compatibility - array of photo URLs
  photos: Photo[] // Detailed photo objects with metadata
  location?: {
    latitude: number
    longitude: number
  }
  city?: string
  distance?: number // Distance en km par rapport à l'utilisateur actuel
  sexualOrientation?: string
  onboardingComplete: boolean
  isAdmin?: boolean
  preferences: UserPreferences
  // Direct access to preference fields for compatibility
  preferenceAgeMin?: number
  preferenceAgeMax?: number
  preferenceDistance?: number
  preferenceMinCompatibility?: number
  preferenceGenders?: ('male' | 'female' | 'other')[]
  compatibilityScoreGlobal?: number
  compatibilityScoreLove?: number
  compatibilityScoreFriendship?: number
  compatibilityScoreCarnal?: number
  compatibilityEvolution?: CompatibilityEvolution
  compatibilityInsight?: string
  isLiked?: boolean // Indicates if current user already liked this profile
}

export interface UserPreferences {
  ageRange: [number, number]
  distance: number
  gender: ('male' | 'female' | 'other')[]
}

export interface Match {
  id: string
  userId: string
  matchedUserId: string
  matchedUser: User
  compatibilityScore: number
  compatibilityScoreGlobal?: number
  compatibilityScoreLove?: number
  compatibilityScoreFriendship?: number
  compatibilityScoreCarnal?: number
  matchedAt: Date
  lastMessageAt?: Date
  lastMessage?: string
  unreadCount: number
  conversationQualityScore?: number
}

export type MessageType = 'text' | 'voice' | 'photo' | 'system'

export type PhotoViewMode = 'once' | 'unlimited'

export type MediaReceiverStatus = 'pending' | 'accepted' | 'rejected'

export interface MessageMedia {
  id: string
  messageId: string
  filePath: string
  mimeType: string
  fileSize: number
  duration?: number // Pour les vocaux (en secondes)
  isReel?: boolean // Photo prise avec l'app
  viewMode?: PhotoViewMode
  viewDuration?: number // Durée d'affichage si mode "once" (en secondes)
  viewed?: boolean
  viewedAt?: Date
  moderationResult?: {
    isSafe: boolean
    nudityScore?: number
    violenceScore?: number
    explicitScore?: number
    warnings?: string[]
  }
  receiverStatus?: MediaReceiverStatus // Statut d'acceptation par le destinataire
  receiverDecisionAt?: Date // Date de décision du destinataire
  url?: string // URL signée générée par le serveur
  moderationWarnings?: string[]
}

export interface Message {
  id: string
  matchId: string
  senderId: string
  receiverId: string
  type: MessageType
  content?: string // Optionnel maintenant (car vocal/photo n'ont pas de content)
  media?: MessageMedia
  delivered: boolean
  deliveredAt?: Date
  read: boolean
  readAt?: Date
  createdAt: Date
}

export interface OnboardingQuestion {
  id: string
  key: string
  type: 'text' | 'single_choice' | 'multiple_choice' | 'date' | 'number' | 'slider' | 'range' | 'photo' | 'city_location'
  question: string
  placeholder?: string
  options?: string[]
  required: boolean
  min?: number
  max?: number
}

export interface OnboardingAnswer {
  questionId: string
  questionKey?: string // Added to help backend identify which field to update
  answer: string | string[] | number | Date | [number, number]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  options?: string[]
  selectionType?: 'single' | 'multiple' | 'freetext'
  structuredData?: {
    step?: string
    question?: string
    question_number?: string
    expect_user_response?: boolean
  }
  profileState?: {
    bio?: string
    completion?: number
    summary?: string
    profileAI?: {
      personnalité?: string | null
      intention?: string | null
      identité?: string | null
      amitié?: string | null
      amour?: string | null
      sexualité?: string | null
    }
  }
}

export interface CompatibilityCriteria {
  name: string
  score: number
  weight: number
}

export interface CompatibilityEvolution {
  trend: 'up' | 'down' | 'stable'
  weeklyChange: number
  lastUpdated: Date
}

export interface CompatibilityCache {
  id: string
  userId: string
  targetUserId: string
  scoreGlobal: number
  scoreLove?: number
  scoreFriendship?: number
  scoreCarnal?: number
  compatibilityInsight?: string
  userProfileHash: string
  targetProfileHash: string
  embeddingScore?: number
  calculatedAt: Date
  expiresAt?: Date
}

export interface CompatibilityScores {
  global: number
  love: number
  friendship: number
  carnal: number
  insight: string
  embeddingScore?: number
}

export interface SearchFilters {
  ageMin: number
  ageMax: number
  distance: number
  minCompatibility: number
  genders: ('male' | 'female' | 'other')[]
}

export interface DiscoverProfilesResponse {
  profiles: User[]
  hasProfileEmbedding: boolean
  cacheStats?: {
    hits: number
    misses: number
    total: number
  }
}

export type DiscoverViewMode = 'swipe' | 'list' | 'mixed'

export type RelationshipFilter = 'all' | 'love' | 'friendship' | 'carnal'