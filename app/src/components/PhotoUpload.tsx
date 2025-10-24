import React, { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import './PhotoUpload.css'

interface PhotoUploadProps {
  photos: string[]
  onChange: (photos: string[]) => void
  maxPhotos?: number
  disabled?: boolean
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  photos,
  onChange,
  maxPhotos = 6,
  disabled = false,
}) => {
  const { t } = useTranslation()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const remainingSlots = maxPhotos - photos.length
    const filesToUpload = files.slice(0, remainingSlots)

    setUploading(true)
    try {
      const uploadedUrls: string[] = []

      for (const file of filesToUpload) {
        // Validate file
        if (!file.type.startsWith('image/')) {
          alert(t('upload.invalidType'))
          continue
        }

        if (file.size > 5 * 1024 * 1024) {
          alert(t('upload.fileTooLarge'))
          continue
        }

        // Create preview URL
        const previewUrl = URL.createObjectURL(file)
        uploadedUrls.push(previewUrl)
      }

      onChange([...photos, ...uploadedUrls])
    } catch (error) {
      console.error('Upload error:', error)
      alert(t('upload.error'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    onChange(newPhotos)
  }

  const handleClick = () => {
    if (!disabled && photos.length < maxPhotos) {
      fileInputRef.current?.click()
    }
  }

  const canAddMore = photos.length < maxPhotos

  return (
    <div className="photo-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled || !canAddMore}
      />

      <div className="photo-upload-grid">
        {photos.map((photo, index) => (
          <div key={index} className="photo-upload-item">
            <img src={photo} alt={`Photo ${index + 1}`} className="photo-upload-image" />
            {!disabled && (
              <button
                type="button"
                className="photo-upload-remove"
                onClick={() => handleRemove(index)}
                aria-label={t('upload.remove')}
              >
                ×
              </button>
            )}
          </div>
        ))}

        {canAddMore && !disabled && (
          <button type="button" className="photo-upload-add" onClick={handleClick} disabled={uploading}>
            {uploading ? (
              <div className="photo-upload-spinner" />
            ) : (
              <>
                <span className="photo-upload-plus">+</span>
                <span className="photo-upload-text">{t('upload.addPhoto')}</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="photo-upload-hint">
        {t('upload.hint', { current: photos.length, max: maxPhotos })}
      </div>
    </div>
  )
}
