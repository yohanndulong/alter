import { useEffect, useState } from 'react'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { App } from '@capacitor/app'

interface UpdateManifest {
  version: string
  url: string
  notes?: string
}

interface UpdateInfo {
  version: string
  notes?: string
}

export const useAppUpdater = (updateUrl: string, checkIntervalMinutes: number = 60) => {
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null)

  useEffect(() => {
    let checkInterval: NodeJS.Timeout

    const checkForUpdates = async () => {
      try {
        // Récupérer le manifest des mises à jour
        const response = await fetch(updateUrl)
        if (!response.ok) {
          console.log('No update manifest found')
          return
        }

        const manifest: UpdateManifest = await response.json()

        // Récupérer la version actuelle du bundle (peut être OTA ou native)
        const currentBundle = await CapacitorUpdater.current()
        const currentVersion = currentBundle.bundle.version || (await App.getInfo()).version

        console.log(`[OTA] Current bundle version: ${currentVersion}`)
        console.log(`[OTA] Manifest version: ${manifest.version}`)

        // Vérifier si cette version n'a pas déjà été téléchargée
        const lastDownloadedVersion = localStorage.getItem('last_ota_version')
        if (lastDownloadedVersion === manifest.version) {
          console.log('[OTA] Version already downloaded, skipping')
          return
        }

        // Comparer les versions
        if (manifest.version !== currentVersion) {
          console.log(`[OTA] New version available: ${manifest.version} (current: ${currentVersion})`)

          // Télécharger la mise à jour en arrière-plan
          const downloadResult = await CapacitorUpdater.download({
            url: manifest.url,
            version: manifest.version,
          })

          console.log(`[OTA] Update downloaded: ${downloadResult.version}`)

          // Stocker la version téléchargée pour éviter les téléchargements en boucle
          localStorage.setItem('last_ota_version', manifest.version)

          // Définir comme version suivante
          await CapacitorUpdater.set({ id: downloadResult.id })

          // Afficher la modale d'update
          setUpdateAvailable({
            version: manifest.version,
            notes: manifest.notes
          })
        } else {
          console.log('[OTA] App is up to date')
        }
      } catch (error) {
        console.error('[OTA] Error checking for updates:', error)
      }
    }

    const initUpdater = async () => {
      try {
        // Notifier que l'app est prête
        await CapacitorUpdater.notifyAppReady()

        // Vérifier immédiatement au démarrage
        await checkForUpdates()

        // Vérifier à l'intervalle spécifié (en minutes)
        const intervalMs = checkIntervalMinutes * 60 * 1000
        console.log(`Checking for updates every ${checkIntervalMinutes} minutes`)
        checkInterval = setInterval(checkForUpdates, intervalMs)
      } catch (error) {
        console.error('Error initializing updater:', error)
      }
    }

    initUpdater()

    // Cleanup
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval)
      }
    }
  }, [updateUrl, checkIntervalMinutes])

  const handleUpdate = async () => {
    await CapacitorUpdater.reload()
  }

  return { updateAvailable, handleUpdate }
}
