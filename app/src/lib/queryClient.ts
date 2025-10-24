import { QueryClient } from '@tanstack/react-query'

/**
 * Configuration globale de React Query
 * Optimisée pour le mode offline et les connexions lentes
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache pendant 5 minutes par défaut
      staleTime: 5 * 60 * 1000,

      // Garde en cache pendant 10 minutes même si inutilisé
      gcTime: 10 * 60 * 1000,

      // Retry automatique en cas d'erreur (3 fois avec backoff exponentiel)
      retry: (failureCount, error: any) => {
        // Ne pas retry si c'est une erreur 404 ou 401
        if (error?.response?.status === 404 || error?.response?.status === 401) {
          return false
        }
        // Retry max 3 fois pour les erreurs réseau
        return failureCount < 3
      },

      // Délai entre les retries (1s, 2s, 4s)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Ne pas refetch automatiquement au focus de la fenêtre (mobile friendly)
      refetchOnWindowFocus: false,

      // Refetch si la connexion revient
      refetchOnReconnect: true,

      // Ne pas refetch au mount si les données sont fraîches
      refetchOnMount: false,

      // Fonction pour gérer les erreurs globalement
      throwOnError: false,

      // Network mode: online-first mais garde le cache offline
      networkMode: 'online',
    },
    mutations: {
      // Retry pour les mutations en cas d'erreur réseau
      retry: 1,

      // Network mode pour les mutations
      networkMode: 'online',
    },
  },
})
