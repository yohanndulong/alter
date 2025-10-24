import { useEffect } from 'react'
import { privacyScreenService } from '@/services/privacyScreen'

/**
 * Hook pour activer la protection contre les captures d'écran
 * pendant la durée de vie du composant
 */
export const usePrivacyScreen = (enabled: boolean = true) => {
  useEffect(() => {
    if (enabled) {
      privacyScreenService.enable()
    }

    return () => {
      if (enabled) {
        privacyScreenService.disable()
      }
    }
  }, [enabled])
}
