import { http, HttpResponse } from 'msw'

const API_BASE = '/api'

export const parametersHandlers = [
  // GET /api/parameters/public/:key - Get public parameter
  http.get(`${API_BASE}/parameters/public/:key`, ({ params }) => {
    const { key } = params

    // Default parameter values
    const defaultParams: Record<string, any> = {
      'upload.min_photos_per_user': 2,
      'upload.max_photos_per_user': 6,
      'matching.max_daily_likes': 100,
      'matching.max_distance_km': 100,
      'matching.min_compatibility_default': 50,
      'matching.max_active_conversations': 10,
    }

    const value = defaultParams[key as string]

    if (value === undefined) {
      return HttpResponse.json(
        { message: 'Parameter not found or not publicly accessible' },
        { status: 404 }
      )
    }

    return HttpResponse.json({
      key,
      value,
    })
  }),
]
