const API_BASE_URL = import.meta.env.VITE_ENABLE_MOCKS === 'true'
  ? '/api'
  : (import.meta.env.VITE_API_URL || '/api')

// Fonction pour notifier les erreurs réseau au contexte
// Sera initialisée par le NetworkProvider
let networkErrorNotifier: ((error: any) => void) | null = null

export const setNetworkErrorNotifier = (notifier: (error: any) => void) => {
  networkErrorNotifier = notifier
}

class ApiService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token')
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options?.headers,
      },
      // Timeout de 30 secondes
      signal: options?.signal || AbortSignal.timeout(30000),
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'An error occurred',
        }))

        // Créer une erreur avec toutes les données de l'API
        const error: any = new Error(errorData.message || `HTTP ${response.status}`)
        error.response = {
          status: response.status,
          data: errorData
        }

        // Notifier si c'est une erreur serveur (5xx)
        if (response.status >= 500 && networkErrorNotifier) {
          networkErrorNotifier({
            message: 'Erreur serveur, veuillez réessayer',
            timestamp: Date.now(),
            type: 'server_error'
          })
        }

        throw error
      }

      return response.json()
    } catch (error: any) {
      // Détecter les erreurs réseau spécifiques
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        // Erreur réseau (pas de connexion)
        if (networkErrorNotifier) {
          networkErrorNotifier({
            message: 'Impossible de se connecter au serveur',
            timestamp: Date.now(),
            type: 'offline'
          })
        }
        const networkError: any = new Error('Pas de connexion internet')
        networkError.isNetworkError = true
        throw networkError
      } else if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        // Timeout
        if (networkErrorNotifier) {
          networkErrorNotifier({
            message: 'La connexion est trop lente',
            timestamp: Date.now(),
            type: 'timeout'
          })
        }
        const timeoutError: any = new Error('Délai d\'attente dépassé')
        timeoutError.isTimeoutError = true
        throw timeoutError
      }

      // Re-lancer l'erreur originale si ce n'est pas une erreur réseau
      throw error
    }
  }

  async get<T>(endpoint: string, options?: { params?: Record<string, string> }): Promise<T> {
    let url = endpoint
    if (options?.params) {
      const queryString = new URLSearchParams(options.params).toString()
      url = `${endpoint}?${queryString}`
    }
    return this.request<T>(url, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async uploadFile<T>(endpoint: string, file: File): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)

    const token = localStorage.getItem('auth_token')
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Upload failed',
      }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }
}

export const api = new ApiService()