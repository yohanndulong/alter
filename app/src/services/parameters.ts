import { api } from './api'

export interface AppParameters {
  'upload.min_photos_per_user': number
  'upload.max_photos_per_user': number
  'matching.max_daily_likes': number
  'matching.max_distance_km': number
  'matching.min_compatibility_default': number
  // Add more as needed
}

class ParametersService {
  private cache: Map<string, any> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  async get<T = any>(key: keyof AppParameters): Promise<T> {
    // Check cache
    const cached = this.cache.get(key)
    const expiry = this.cacheExpiry.get(key)

    if (cached !== undefined && expiry && Date.now() < expiry) {
      return cached as T
    }

    // Fetch from API
    try {
      const response = await api.get<{ key: string; value: any }>(`/parameters/public/${key}`)

      // Check if response exists and has value
      if (!response || response.value === undefined) {
        console.warn(`Empty response for parameter ${key}, using default value`)
        return this.getDefaultValue(key) as T
      }

      const value = response.value

      // Update cache
      this.cache.set(key, value)
      this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL)

      return value as T
    } catch (error) {
      console.error(`Failed to fetch parameter ${key}:`, error)
      // Return default values if API fails
      return this.getDefaultValue(key) as T
    }
  }

  async getMultiple(keys: (keyof AppParameters)[]): Promise<Partial<AppParameters>> {
    const results: Partial<AppParameters> = {}

    await Promise.all(
      keys.map(async (key) => {
        results[key] = await this.get(key)
      })
    )

    return results
  }

  private getDefaultValue(key: keyof AppParameters): any {
    const defaults: AppParameters = {
      'upload.min_photos_per_user': 2,
      'upload.max_photos_per_user': 6,
      'matching.max_daily_likes': 100,
      'matching.max_distance_km': 100,
      'matching.min_compatibility_default': 50,
    }

    return defaults[key]
  }

  clearCache(): void {
    this.cache.clear()
    this.cacheExpiry.clear()
  }
}

export default new ParametersService()
