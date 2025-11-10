import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { Logo } from '@/components'
import './Introduction.css'

interface Slide {
  icon: 'logo' | string
  title: string
  description: string
  gradient: string
}

export const Introduction: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [dragDirection, setDragDirection] = useState(0)

  const slides: Slide[] = [
    {
      icon: 'logo',
      title: t('intro.slide1Title'),
      description: t('intro.slide1Description'),
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      icon: '💬',
      title: t('intro.slide2Title'),
      description: t('intro.slide2Description'),
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      icon: '🎯',
      title: t('intro.slide3Title'),
      description: t('intro.slide3Description'),
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      icon: '🛡️',
      title: t('intro.slide4Title'),
      description: t('intro.slide4Description'),
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
  ]

  const handleNext = () => {
    setDragDirection(-1)
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      handleStart()
    }
  }

  const handlePrev = () => {
    setDragDirection(1)
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const handleStart = () => {
    localStorage.setItem('intro_completed', 'true')
    navigate('/login')
  }

  const handleSkip = () => {
    localStorage.setItem('intro_completed', 'true')
    navigate('/login')
  }

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50

    if (info.offset.x > swipeThreshold) {
      // Swipe right -> previous slide
      handlePrev()
    } else if (info.offset.x < -swipeThreshold) {
      // Swipe left -> next slide
      handleNext()
    }
  }

  return (
    <div className="introduction">
      <div className="introduction__header">
        <Logo size={40} />
        {currentSlide < slides.length - 1 && (
          <button className="introduction__skip" onClick={handleSkip}>
            {t('intro.skip')}
          </button>
        )}
      </div>

      <div className="introduction__content">
        <AnimatePresence mode="wait" custom={dragDirection}>
          <motion.div
            key={currentSlide}
            custom={dragDirection}
            initial={{ opacity: 0, x: dragDirection > 0 ? -50 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dragDirection > 0 ? 50 : -50 }}
            transition={{ duration: 0.3 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="introduction__slide"
          >
            <motion.div
              className="introduction__icon-container"
              style={{ background: slides[currentSlide].gradient }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              {slides[currentSlide].icon === 'logo' ? (
                <Logo variant="icon" size={80} className="introduction__icon-logo" />
              ) : (
                <span className="introduction__icon">{slides[currentSlide].icon}</span>
              )}
            </motion.div>

            <motion.h1
              className="introduction__title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              {slides[currentSlide].title}
            </motion.h1>

            <motion.p
              className="introduction__description"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              {slides[currentSlide].description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="introduction__footer">
        <div className="introduction__dots">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`introduction__dot ${index === currentSlide ? 'introduction__dot--active' : ''}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <div className="introduction__actions">
          {currentSlide > 0 && (
            <button className="introduction__arrow introduction__arrow--prev" onClick={handlePrev} aria-label={t('intro.previous')}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {currentSlide === slides.length - 1 ? (
            <button className="introduction__button introduction__button--primary" onClick={handleStart}>
              {t('intro.getStarted')}
            </button>
          ) : (
            <button className="introduction__arrow introduction__arrow--next" onClick={handleNext} aria-label={t('intro.next')}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
