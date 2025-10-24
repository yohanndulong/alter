import React, { useState, useRef, useEffect } from 'react'
import { MessageMedia } from '@/types'
import './VoiceMessage.css'

export interface VoiceMessageProps {
  media: MessageMedia
  isSent: boolean
}

export const VoiceMessage: React.FC<VoiceMessageProps> = ({ media, isSent }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(media.duration || 0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Créer l'élément audio
    const audio = new Audio(media.url)
    audioRef.current = audio

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration)
    })

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime)
    })

    audio.addEventListener('ended', () => {
      setIsPlaying(false)
      setCurrentTime(0)
    })

    return () => {
      audio.pause()
      audio.removeEventListener('loadedmetadata', () => {})
      audio.removeEventListener('timeupdate', () => {})
      audio.removeEventListener('ended', () => {})
    }
  }, [media.url])

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={`voice-message ${isSent ? 'voice-message--sent' : 'voice-message--received'}`}>
      <button className="voice-message-play-button" onClick={togglePlay}>
        {isPlaying ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/>
            <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5v14l11-7z" fill="currentColor"/>
          </svg>
        )}
      </button>

      <div className="voice-message-content">
        <div className="voice-message-waveform">
          <div className="voice-message-progress" style={{ width: `${progress}%` }} />
        </div>
        <div className="voice-message-time">
          {formatTime(isPlaying ? currentTime : duration)}
        </div>
      </div>
    </div>
  )
}
