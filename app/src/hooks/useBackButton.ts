import { useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Hook pour gérer le bouton retour arrière du navigateur/mobile
 *
 * @param onBack - Callback à exécuter quand l'utilisateur appuie sur retour
 * @param enabled - Si false, le hook est désactivé (défaut: true)
 *
 * @example
 * // Navigation simple vers une route
 * useBackButton(() => navigate('/discover'))
 *
 * @example
 * // Action personnalisée (ex: fermer une modale)
 * useBackButton(() => {
 *   setShowModal(false)
 *   return true // true = empêcher la navigation par défaut
 * })
 *
 * @example
 * // Désactiver temporairement
 * useBackButton(() => navigate('/discover'), isModalOpen)
 */
export function useBackButton(
  onBack: () => void | boolean,
  enabled: boolean = true
) {
  const navigate = useNavigate()
  const onBackRef = useRef(onBack)
  const stateIdRef = useRef<string | null>(null)

  // Mettre à jour la ref à chaque render pour avoir toujours la dernière version
  useEffect(() => {
    onBackRef.current = onBack
  }, [onBack])

  useEffect(() => {
    if (!enabled) return

    // Pusher un état dans l'historique
    const stateId = `back-handler-${Date.now()}`
    stateIdRef.current = stateId
    window.history.pushState({ stateId }, '')

    const handlePopState = (event: PopStateEvent) => {
      // Vérifier que c'est bien notre état qui est poppé
      if (event.state?.stateId === stateId) {
        // Exécuter le callback
        const result = onBackRef.current()

        // Si le callback retourne true, empêcher la navigation
        // Sinon, laisser la navigation se faire
        if (result === true) {
          // Re-pusher l'état pour rester sur la page
          window.history.pushState({ stateId }, '')
        }
      }
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)

      // Nettoyer l'historique si on unmount
      if (window.history.state?.stateId === stateId) {
        window.history.back()
      }
    }
  }, [enabled])
}

/**
 * Hook spécial pour les pages qui veulent juste naviguer vers une route au retour
 * Plus simple que useBackButton pour les cas simples
 *
 * @example
 * useBackButtonNavigation('/discover')
 */
export function useBackButtonNavigation(route: string, enabled: boolean = true) {
  const navigate = useNavigate()

  useBackButton(
    useCallback(() => {
      navigate(route)
      return true // Empêcher la navigation par défaut
    }, [navigate, route]),
    enabled
  )
}

/**
 * Hook pour demander une confirmation avant de quitter (ex: formulaire non sauvegardé)
 *
 * @example
 * useBackButtonConfirm(
 *   'Voulez-vous vraiment quitter sans sauvegarder ?',
 *   isDirty // Activer seulement si le formulaire a changé
 * )
 */
export function useBackButtonConfirm(
  message: string,
  enabled: boolean = true
) {
  useBackButton(
    useCallback(() => {
      const confirmed = window.confirm(message)
      return !confirmed // Si pas confirmé, empêcher la navigation
    }, [message]),
    enabled
  )
}
