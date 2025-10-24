import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { RelationshipFilter } from '@/types'
import './CompatibilityFilter.css'

interface CompatibilityFilterProps {
  value: RelationshipFilter
  onChange: (filter: RelationshipFilter) => void
  compact?: boolean
}

interface FilterOption {
  value: RelationshipFilter
  icon: string
  gradient: string
}

export const CompatibilityFilter: React.FC<CompatibilityFilterProps> = ({ value, onChange, compact = false }) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filterOptions: FilterOption[] = [
    {
      value: 'all',
      icon: '🌟',
      gradient: 'linear-gradient(135deg, #9333ea, #c026d3)'
    },
    {
      value: 'love',
      icon: '💕',
      gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)'
    },
    {
      value: 'friendship',
      icon: '🤝',
      gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)'
    },
    {
      value: 'carnal',
      icon: '🔥',
      gradient: 'linear-gradient(135deg, #ef4444, #f97316)'
    }
  ]

  const getLabel = (filter: RelationshipFilter): string => {
    switch (filter) {
      case 'all':
        return t('discover.sortGlobal')
      case 'love':
        return t('discover.sortLove')
      case 'friendship':
        return t('discover.sortFriendship')
      case 'carnal':
        return t('discover.sortCarnal')
      default:
        return ''
    }
  }

  const selectedOption = filterOptions.find(opt => opt.value === value) || filterOptions[0]

  const handleSelect = (filter: RelationshipFilter) => {
    onChange(filter)
    setIsOpen(false)
  }

  // Fermer le dropdown si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className={`compatibility-filter ${compact ? 'compact' : ''}`} ref={dropdownRef}>
      <button
        className={`filter-trigger ${isOpen ? 'open' : ''} ${compact ? 'compact' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          '--filter-gradient': selectedOption.gradient
        } as React.CSSProperties}
        title={compact ? getLabel(value) : undefined}
      >
        {compact ? (
          <span className="filter-trigger-icon-only">{selectedOption.icon}</span>
        ) : (
          <>
            <div className="filter-trigger-content">
              <span className="filter-trigger-icon">{selectedOption.icon}</span>
              <span className="filter-trigger-label">{getLabel(value)}</span>
            </div>
            <svg
              className="filter-trigger-arrow"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </>
        )}
      </button>

      {isOpen && (
        <div className="filter-dropdown">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              className={`filter-dropdown-option ${value === option.value ? 'active' : ''}`}
              onClick={() => handleSelect(option.value)}
              style={{
                '--filter-gradient': option.gradient
              } as React.CSSProperties}
            >
              <span className="filter-option-icon">{option.icon}</span>
              <span className="filter-option-label">{getLabel(option.value)}</span>
              {value === option.value && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
