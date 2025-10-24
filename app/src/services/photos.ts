import { api } from './api'

export interface Photo {
  id: string
  order: number
  isPrimary: boolean
  url: string
  createdAt: string
}

export const photosService = {
  async getUserPhotos(): Promise<Photo[]> {
    return api.get<Photo[]>('/photos')
  },

  async uploadPhoto(file: File): Promise<Photo> {
    const formData = new FormData()
    formData.append('file', file)

    const token = localStorage.getItem('auth_token')
    const response = await fetch(`${import.meta.env.VITE_API_URL}/photos/upload`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Upload failed')
    }

    return response.json()
  },

  async deletePhoto(photoId: string): Promise<void> {
    await api.delete(`/photos/${photoId}`)
  },

  async setPrimaryPhoto(photoId: string): Promise<void> {
    await api.put(`/photos/${photoId}/primary`)
  },

  async reorderPhotos(photoIds: string[]): Promise<void> {
    await api.put('/photos/reorder', { photoIds })
  },

  getPhotoUrl(photo: Photo): string {
    // Return the signed URL from the API (already includes token)
    return `${import.meta.env.VITE_API_URL}${photo.url}`
  }
}
