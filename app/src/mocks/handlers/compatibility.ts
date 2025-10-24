import { http, HttpResponse } from 'msw'
import { CompatibilityCache, CompatibilityScores, User } from '@/types'
import { delay } from '../data/mockData'
import { getCurrentUser } from '../data/storage'

const API_BASE = '/api'

/**
 * Mock storage pour le cache de compatibilité
 */
const compatibilityCache = new Map<string, CompatibilityCache>()

/**
 * Génère une clé unique pour le cache
 */
function getCacheKey(userId: string, targetUserId: string): string {
  return `${userId}:${targetUserId}`
}

/**
 * Simule le calcul de compatibilité par LLM
 * En réalité, génère des scores aléatoires mais cohérents
 */
function mockCalculateCompatibility(user: User, target: User): CompatibilityScores {
  // Utiliser les noms pour générer des scores reproductibles
  const seed = user.name + target.name
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash = hash & hash
  }

  const randomFromSeed = (min: number, max: number, offset: number = 0) => {
    const value = Math.abs((hash + offset) % 1000) / 1000
    return Math.round(min + value * (max - min))
  }

  const global = randomFromSeed(65, 95, 0)
  const love = randomFromSeed(60, 98, 1)
  const friendship = randomFromSeed(60, 98, 2)
  const carnal = randomFromSeed(50, 98, 3)

  // Templates d'insights
  const insights = [
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

  const insightIndex = Math.abs(hash) % insights.length

  return {
    global,
    love,
    friendship,
    carnal,
    insight: insights[insightIndex],
    embeddingScore: randomFromSeed(70, 95, 4) / 100
  }
}

/**
 * Handlers pour les routes de compatibilité
 */
export const compatibilityHandlers = [
  // GET /compatibility/cache/:userId/:targetUserId
  http.get(`${API_BASE}/compatibility/cache/:userId/:targetUserId`, async ({ request, params }) => {
    await delay(50)

    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { userId, targetUserId } = params as { userId: string; targetUserId: string }
    const cacheKey = getCacheKey(userId, targetUserId)
    const cached = compatibilityCache.get(cacheKey)

    if (!cached) {
      return HttpResponse.json({ message: 'Cache not found' }, { status: 404 })
    }

    return HttpResponse.json(cached, { status: 200 })
  }),

  // POST /compatibility/cache
  http.post(`${API_BASE}/compatibility/cache`, async ({ request }) => {
    await delay(50)

    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as Omit<CompatibilityCache, 'id' | 'calculatedAt'>

    const cache: CompatibilityCache = {
      ...body,
      id: `cache-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      calculatedAt: new Date()
    }

    const cacheKey = getCacheKey(body.userId, body.targetUserId)
    compatibilityCache.set(cacheKey, cache)

    return HttpResponse.json({ message: 'Cache saved successfully' }, { status: 201 })
  }),

  // DELETE /compatibility/cache/user/:userId
  http.delete(`${API_BASE}/compatibility/cache/user/:userId`, async ({ request, params }) => {
    await delay(50)

    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = params as { userId: string }

    // Supprimer tous les caches concernant cet utilisateur
    const keysToDelete: string[] = []
    compatibilityCache.forEach((_, key) => {
      if (key.startsWith(`${userId}:`) || key.includes(`:${userId}`)) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => compatibilityCache.delete(key))

    return HttpResponse.json(
      { message: `Invalidated ${keysToDelete.length} cache entries` },
      { status: 200 }
    )
  }),

  // POST /compatibility/calculate
  http.post(`${API_BASE}/compatibility/calculate`, async ({ request }) => {
    await delay(500) // Simule le temps de calcul LLM

    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as {
      userId: string
      targetUserId: string
      user: Partial<User>
      target: Partial<User>
    }

    console.log('🤖 [MOCK] Calculating compatibility with LLM...')

    // Simuler le calcul
    const scores = mockCalculateCompatibility(body.user as User, body.target as User)

    return HttpResponse.json(scores, { status: 200 })
  }),

  // POST /compatibility/calculate/batch
  http.post(`${API_BASE}/compatibility/calculate/batch`, async ({ request }) => {
    await delay(1000) // Calcul batch plus long

    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as {
      userId: string
      user: Partial<User>
      targets: Array<Partial<User> & { id: string }>
    }

    console.log(`🤖 [MOCK] Batch calculating ${body.targets.length} compatibilities...`)

    const results: { [targetId: string]: CompatibilityScores } = {}

    body.targets.forEach(target => {
      results[target.id] = mockCalculateCompatibility(body.user as User, target as User)
    })

    return HttpResponse.json(results, { status: 200 })
  }),

  // GET /compatibility/cache/stats
  http.get(`${API_BASE}/compatibility/cache/stats`, async ({ request }) => {
    await delay(50)

    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    let oldestEntry: Date | null = null
    let totalAge = 0

    compatibilityCache.forEach(cache => {
      if (!oldestEntry || cache.calculatedAt < oldestEntry) {
        oldestEntry = cache.calculatedAt
      }
      totalAge += now.getTime() - cache.calculatedAt.getTime()
    })

    const averageAge = compatibilityCache.size > 0
      ? totalAge / compatibilityCache.size / 1000 // en secondes
      : 0

    return HttpResponse.json({
      totalEntries: compatibilityCache.size,
      cacheHitRate: 0.85, // Mock
      oldestEntry,
      averageAge
    }, { status: 200 })
  }),

  // POST /matching/recalculate
  http.post(`${API_BASE}/matching/recalculate`, async ({ request }) => {
    await delay(100)

    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    console.log(`🔄 [MOCK] Queued compatibility recalculation job: ${jobId}`)

    return HttpResponse.json({ jobId }, { status: 202 })
  }),

  // POST /matching/calculate/:targetUserId
  http.post(`${API_BASE}/matching/calculate/:targetUserId`, async ({ request, params }) => {
    await delay(500)

    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { targetUserId } = params as { targetUserId: string }
    const currentUser = getCurrentUser()

    if (!currentUser) {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Mock target user
    const target: User = {
      id: targetUserId as string,
      name: 'Target User',
      age: 28,
      gender: 'female',
      email: 'target@example.com',
      bio: 'Mock target user',
      interests: ['travel', 'music'],
      images: [],
      photos: [],
      onboardingComplete: true,
      preferences: {
        ageRange: [25, 35],
        distance: 50,
        gender: ['male']
      }
    }

    console.log(`🤖 [MOCK] Force calculating compatibility for ${targetUserId}`)

    const scores = mockCalculateCompatibility(currentUser, target)

    return HttpResponse.json(scores, { status: 200 })
  })
]
