/**
 * Utilitaires pour la gestion des dates
 * Toutes les dates du backend sont en UTC et converties en timezone locale
 */

/**
 * Obtient le timezone de l'utilisateur
 */
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Formate une heure en timezone locale
 * Exemple: "14:30"
 */
export const formatTime = (timestamp: Date | string | undefined | null): string => {
  if (!timestamp) return ''
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: getUserTimezone()
  })
}

/**
 * Formate une date en timezone locale
 * Exemple: "06/10"
 */
export const formatDate = (timestamp: Date | string | undefined | null): string => {
  if (!timestamp) return ''
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: getUserTimezone()
  })
}

/**
 * Formate une date et heure en timezone locale
 * Exemple: "06/10 14:30"
 */
export const formatDateTime = (timestamp: Date | string | undefined | null): string => {
  if (!timestamp) return ''
  return `${formatDate(timestamp)} ${formatTime(timestamp)}`
}

/**
 * Formate intelligemment une date/heure:
 * - Aujourd'hui: "14:30"
 * - Hier: "Hier 14:30"
 * - Autre: "06/10 14:30"
 */
export const formatMessageTime = (timestamp: Date | string | undefined | null): string => {
  if (!timestamp) return ''

  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp

  // Vérifier que la date est valide
  if (!date || isNaN(date.getTime())) return ''

  const now = new Date()

  // Créer des dates à minuit en timezone locale pour comparer les jours
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const timeStr = formatTime(date)

  if (messageDate.getTime() === today.getTime()) {
    return timeStr
  } else if (messageDate.getTime() === yesterday.getTime()) {
    return `Hier ${timeStr}`
  } else {
    return formatDateTime(date)
  }
}

/**
 * Formate un timestamp relatif
 * Exemple: "Il y a 5 min", "Il y a 2h", "Il y a 3j"
 */
export const formatRelativeTime = (timestamp: Date | string | undefined | null): string => {
  if (!timestamp) return ''

  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp

  // Vérifier que la date est valide
  if (!date || isNaN(date.getTime())) return ''

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMinutes < 1) {
    return 'À l\'instant'
  } else if (diffMinutes < 60) {
    return `Il y a ${diffMinutes} min`
  } else if (diffHours < 24) {
    return `Il y a ${diffHours}h`
  } else if (diffDays < 7) {
    return `Il y a ${diffDays}j`
  } else {
    return formatDate(date)
  }
}
