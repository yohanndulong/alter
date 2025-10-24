/**
 * Build the full URL for an image
 * Handles both absolute URLs (https://...) and relative API paths (/upload/photo/...)
 */
export function getImageUrl(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) return undefined

  // Already an absolute URL
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  // Relative API path - prepend API base URL
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  return `${apiUrl}${imageUrl}`
}

/**
 * Get the first image URL from a user or match
 */
export function getProfileImageUrl(user: { images?: string[] }): string | undefined {
  const imageUrl = user.images?.[0]
  return getImageUrl(imageUrl)
}
