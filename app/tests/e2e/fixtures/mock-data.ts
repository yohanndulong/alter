/**
 * Mock data for API responses
 * Centralized test data for all e2e tests
 */

export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  phoneNumber: '+33612345678',
  name: 'Alex Martin',
  age: 28,
  gender: 'male',
  bio: 'Passionné de technologie et de voyages',
  interests: ['Technologie', 'Voyages', 'Cinéma', 'Cuisine'],
  photos: [
    {
      id: 'photo-1',
      url: 'https://via.placeholder.com/400x600/FF6B6B/FFFFFF?text=Photo+1',
      order: 0,
    },
    {
      id: 'photo-2',
      url: 'https://via.placeholder.com/400x600/4ECDC4/FFFFFF?text=Photo+2',
      order: 1,
    },
  ],
  location: {
    city: 'Paris',
    country: 'France',
  },
  onboardingComplete: true,
  isAdmin: false,
  preferences: {
    minAge: 22,
    maxAge: 35,
    maxDistance: 50,
    gender: 'female',
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-15T12:00:00.000Z',
}

export const mockAdminUser = {
  ...mockUser,
  id: 'admin-456',
  email: 'admin@example.com',
  isAdmin: true,
}

export const mockProfiles = [
  {
    id: 'profile-1',
    name: 'Sophie Dubois',
    age: 26,
    bio: 'Amoureuse de la nature et des randonnées 🌲',
    photos: [
      {
        id: 'photo-p1-1',
        url: 'https://via.placeholder.com/400x600/FFB6B9/FFFFFF?text=Sophie',
        order: 0,
      },
    ],
    distance: 5,
    interests: ['Nature', 'Randonnée', 'Photographie'],
  },
  {
    id: 'profile-2',
    name: 'Marie Laurent',
    age: 24,
    bio: 'Artiste et créative, toujours en quête de nouvelles inspirations ✨',
    photos: [
      {
        id: 'photo-p2-1',
        url: 'https://via.placeholder.com/400x600/C7CEEA/FFFFFF?text=Marie',
        order: 0,
      },
    ],
    distance: 8,
    interests: ['Art', 'Musique', 'Danse'],
  },
  {
    id: 'profile-3',
    name: 'Emma Petit',
    age: 29,
    bio: 'Passionnée de sport et de cuisine healthy 🏃‍♀️🥗',
    photos: [
      {
        id: 'photo-p3-1',
        url: 'https://via.placeholder.com/400x600/B5EAD7/FFFFFF?text=Emma',
        order: 0,
      },
    ],
    distance: 12,
    interests: ['Sport', 'Cuisine', 'Bien-être'],
  },
]

export const mockMatches = [
  {
    id: 'match-1',
    user: mockProfiles[0],
    matchedAt: '2024-01-10T14:30:00.000Z',
    lastMessage: {
      id: 'msg-1',
      content: 'Salut ! Comment vas-tu ?',
      senderId: 'profile-1',
      timestamp: '2024-01-10T15:00:00.000Z',
      read: false,
    },
    unreadCount: 2,
  },
  {
    id: 'match-2',
    user: mockProfiles[1],
    matchedAt: '2024-01-09T10:00:00.000Z',
    lastMessage: {
      id: 'msg-2',
      content: 'Merci pour le match ! 😊',
      senderId: 'user-123',
      timestamp: '2024-01-09T11:30:00.000Z',
      read: true,
    },
    unreadCount: 0,
  },
]

export const mockChatMessages = [
  {
    id: 'msg-chat-1',
    content: 'Salut ! Comment vas-tu ?',
    senderId: 'profile-1',
    timestamp: '2024-01-10T15:00:00.000Z',
    read: true,
  },
  {
    id: 'msg-chat-2',
    content: 'Très bien merci ! Et toi ?',
    senderId: 'user-123',
    timestamp: '2024-01-10T15:05:00.000Z',
    read: true,
  },
  {
    id: 'msg-chat-3',
    content: 'Super ! Tu as prévu quoi ce week-end ?',
    senderId: 'profile-1',
    timestamp: '2024-01-10T15:10:00.000Z',
    read: false,
  },
]

export const mockAlterMessages = [
  {
    id: 'alter-1',
    role: 'assistant',
    content: "Bonjour ! Je suis ALTER, votre assistant pour optimiser votre profil de rencontre. Je vais vous poser quelques questions pour mieux vous connaître. Commençons par vos centres d'intérêt.",
    timestamp: '2024-01-01T10:00:00.000Z',
  },
  {
    id: 'alter-2',
    role: 'assistant',
    content: "Qu'est-ce qui vous passionne le plus dans la vie ?",
    options: [
      'Sport et activités physiques',
      'Arts et culture',
      'Technologie et innovation',
      'Voyages et découvertes',
      'Cuisine et gastronomie',
    ],
    selectionType: 'multiple',
    timestamp: '2024-01-01T10:00:05.000Z',
  },
]

export const mockCompatibilityAnalysis = {
  profileId: 'profile-1',
  compatibility: {
    overall: 87,
    dimensions: {
      personality: 92,
      interests: 85,
      values: 88,
      lifestyle: 82,
    },
  },
  insights: [
    {
      type: 'strength',
      message: 'Vous partagez de nombreux centres d\'intérêt communs',
    },
    {
      type: 'opportunity',
      message: 'Vos valeurs sont très alignées',
    },
  ],
  createdAt: '2024-01-10T14:30:00.000Z',
}

export const mockOnboardingSteps = [
  {
    step: 1,
    title: 'Photos',
    description: 'Ajoutez au moins 2 photos',
    completed: false,
  },
  {
    step: 2,
    title: 'Informations',
    description: 'Complétez votre profil',
    completed: false,
  },
  {
    step: 3,
    title: 'Préférences',
    description: 'Définissez vos critères de recherche',
    completed: false,
  },
]

export const mockLikes = [
  {
    id: 'like-1',
    profile: mockProfiles[0],
    likedAt: '2024-01-08T16:00:00.000Z',
    isMatch: false,
  },
  {
    id: 'like-2',
    profile: mockProfiles[1],
    likedAt: '2024-01-07T12:00:00.000Z',
    isMatch: false,
  },
]
