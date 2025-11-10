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
  const [isTransitioning, setIsTransitioning] = useState(false)

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
    if (isTransitioning) return
    setIsTransitioning(true)
    setDragDirection(-1)
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
      setTimeout(() => setIsTransitioning(false), 500)
    } else {
      handleStart()
    }
  }

  const handlePrev = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setDragDirection(1)
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
      setTimeout(() => setIsTransitioning(false), 500)
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
        {/* Background gradient animé */}
        <motion.div
          className="introduction__background-gradient"
          animate={{
            background: slides[currentSlide].gradient,
          }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />

        <AnimatePresence mode="wait" custom={dragDirection}>
          <motion.div
            key={currentSlide}
            custom={dragDirection}
            initial={{
              opacity: 0,
              x: dragDirection > 0 ? -100 : 100,
              scale: 0.8,
              rotateY: dragDirection > 0 ? -15 : 15
            }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
              rotateY: 0
            }}
            exit={{
              opacity: 0,
              x: dragDirection > 0 ? 100 : -100,
              scale: 0.8,
              rotateY: dragDirection > 0 ? 15 : -15
            }}
            transition={{
              duration: 0.5,
              ease: [0.34, 1.56, 0.64, 1]
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="introduction__slide"
          >
            {/* Particules décoratives */}
            <motion.div
              className="introduction__particles"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="introduction__particle"
                  initial={{
                    x: 0,
                    y: 0,
                    scale: 0,
                    opacity: 0
                  }}
                  animate={{
                    x: Math.cos(i * 60) * 120,
                    y: Math.sin(i * 60) * 120,
                    scale: 1,
                    opacity: [0, 0.6, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    delay: 0.2 + i * 0.1,
                    ease: "easeOut"
                  }}
                  style={{ background: slides[currentSlide].gradient }}
                />
              ))}
            </motion.div>

            <motion.div
              className="introduction__icon-container"
              style={{ background: slides[currentSlide].gradient }}
              initial={{
                scale: 0,
                rotate: -180
              }}
              animate={{
                scale: 1,
                rotate: 0
              }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.1
              }}
              whileHover={{
                scale: 1.1,
                rotate: 5
              }}
            >
              {slides[currentSlide].icon === 'logo' ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                >
                  <Logo variant="icon" size={80} className="introduction__icon-logo" />
                </motion.div>
              ) : (
                <motion.span
                  className="introduction__icon"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: 0.3,
                    type: "spring",
                    stiffness: 200,
                    damping: 12
                  }}
                >
                  {slides[currentSlide].icon}
                </motion.span>
              )}
            </motion.div>

            <motion.h1
              className="introduction__title"
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: 0.3,
                duration: 0.5,
                ease: [0.34, 1.56, 0.64, 1]
              }}
            >
              {slides[currentSlide].title.split(' ').map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  style={{ display: 'inline-block', marginRight: '0.3em' }}
                >
                  {word}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              className="introduction__description"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.5,
                duration: 0.5,
                ease: "easeOut"
              }}
            >
              {slides[currentSlide].description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.div
        className="introduction__footer"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <div className="introduction__dots">
          {slides.map((_, index) => (
            <motion.button
              key={index}
              className={`introduction__dot ${index === currentSlide ? 'introduction__dot--active' : ''}`}
              onClick={() => {
                if (!isTransitioning) {
                  setDragDirection(index > currentSlide ? -1 : 1)
                  setCurrentSlide(index)
                }
              }}
              aria-label={`Go to slide ${index + 1}`}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
              animate={{
                backgroundColor: index === currentSlide ? 'var(--color-primary)' : 'var(--color-background-tertiary)'
              }}
            />
          ))}
        </div>

        <motion.div
          className="introduction__actions"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
        >
          <AnimatePresence>
            {currentSlide > 0 && (
              <motion.button
                className="introduction__arrow introduction__arrow--prev"
                onClick={handlePrev}
                aria-label={t('intro.previous')}
                initial={{ opacity: 0, x: -20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.8 }}
                whileHover={{ scale: 1.1, x: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {currentSlide === slides.length - 1 ? (
              <motion.button
                key="start-button"
                className="introduction__button introduction__button--primary"
                onClick={handleStart}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20
                }}
              >
                {t('intro.getStarted')}
              </motion.button>
            ) : (
              <motion.button
                key="next-arrow"
                className="introduction__arrow introduction__arrow--next"
                onClick={handleNext}
                aria-label={t('intro.next')}
                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.8 }}
                whileHover={{ scale: 1.1, x: 3 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  )
}
