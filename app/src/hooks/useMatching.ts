import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { matchingService } from '@/services/matching'
import { SearchFilters } from '@/types'
import { useToast } from './useToast'

/**
 * Query keys pour les hooks de matching
 * Organisés hiérarchiquement pour faciliter l'invalidation
 */
export const matchingKeys = {
  all: ['matching'] as const,
  matches: () => [...matchingKeys.all, 'matches'] as const,
  discover: (filters?: Partial<SearchFilters>) => [...matchingKeys.all, 'discover', filters] as const,
  interested: () => [...matchingKeys.all, 'interested'] as const,
  conversationsStatus: () => [...matchingKeys.all, 'conversations-status'] as const,
}

/**
 * Hook pour récupérer la liste des matches
 * Avec cache automatique de 5 minutes
 */
export function useMatches() {
  return useQuery({
    queryKey: matchingKeys.matches(),
    queryFn: () => matchingService.getMatches(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook pour récupérer les profils à découvrir
 */
export function useDiscoverProfiles(filters?: Partial<SearchFilters>) {
  return useQuery({
    queryKey: matchingKeys.discover(filters),
    queryFn: () => matchingService.getDiscoverProfiles(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes (plus court car les profils changent souvent)
  })
}

/**
 * Hook pour récupérer les profils intéressés
 */
export function useInterestedProfiles() {
  return useQuery({
    queryKey: matchingKeys.interested(),
    queryFn: () => matchingService.getInterestedProfiles(),
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

/**
 * Hook pour le statut des conversations
 */
export function useConversationsStatus() {
  return useQuery({
    queryKey: matchingKeys.conversationsStatus(),
    queryFn: () => matchingService.getConversationsStatus(),
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

/**
 * Hook pour liker un profil
 * Invalide automatiquement les queries concernées
 */
export function useLikeProfile() {
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()

  return useMutation({
    mutationFn: (userId: string) => matchingService.likeProfile(userId),
    onSuccess: (data) => {
      // Invalider les queries concernées
      queryClient.invalidateQueries({ queryKey: matchingKeys.matches() })
      queryClient.invalidateQueries({ queryKey: matchingKeys.conversationsStatus() })
      queryClient.invalidateQueries({ queryKey: matchingKeys.discover() })

      // Afficher un message de succès si c'est un match
      if (data.match) {
        success('C\'est un match ! 🎉')
      }
    },
    onError: (error: any) => {
      showError(error.message || 'Erreur lors du like')
    },
  })
}

/**
 * Hook pour passer un profil
 */
export function usePassProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => matchingService.passProfile(userId),
    onSuccess: () => {
      // Invalider les profils à découvrir
      queryClient.invalidateQueries({ queryKey: matchingKeys.discover() })
    },
  })
}

/**
 * Hook pour unmatch
 */
export function useUnmatch() {
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()

  return useMutation({
    mutationFn: (matchId: string) => matchingService.unmatch(matchId),
    onSuccess: (data) => {
      // Invalider les queries concernées
      queryClient.invalidateQueries({ queryKey: matchingKeys.matches() })
      queryClient.invalidateQueries({ queryKey: matchingKeys.conversationsStatus() })

      // Message de succès
      if (data.canLikeAgain) {
        success(`Match supprimé. ${data.remainingSlots} slot(s) disponible(s)`)
      } else {
        success('Match supprimé')
      }
    },
    onError: (error: any) => {
      showError(error.message || 'Erreur lors de la suppression')
    },
  })
}

/**
 * Hook pour mettre à jour les filtres de recherche
 */
export function useUpdateSearchFilters() {
  const queryClient = useQueryClient()
  const { success } = useToast()

  return useMutation({
    mutationFn: (filters: Partial<SearchFilters>) => matchingService.updateSearchFilters(filters),
    onSuccess: () => {
      // Invalider les profils à découvrir pour recharger avec les nouveaux filtres
      queryClient.invalidateQueries({ queryKey: matchingKeys.discover() })
      success('Filtres mis à jour')
    },
  })
}
