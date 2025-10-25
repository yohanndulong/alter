import React, { useState, useEffect, useRef } from 'react'
import './CityAutocomplete.css'

interface CityResult {
  display_name: string
  lat: string
  lon: string
  address: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    country: string
  }
  place_id: number
}

export interface CityAutocompleteProps {
  value: string
  onChange: (city: string, latitude: number, longitude: number) => void
  onError?: (error: string) => void
  placeholder?: string
  label?: string
  required?: boolean
  countryCodes?: string[] // Codes pays ISO (ex: ['fr', 'be', 'ch'])
  disabled?: boolean
}

/**
 * Composant d'autocomplete pour rechercher une ville
 * Utilise l'API Nominatim (OpenStreetMap) pour la recherche géographique
 */
export const CityAutocomplete: React.FC<CityAutocompleteProps> = ({
  value,
  onChange,
  onError,
  placeholder = 'Rechercher votre ville...',
  label,
  required = false,
  countryCodes = ['fr', 'be', 'ch', 'ca'], // Pays francophones par défaut
  disabled = false,
}) => {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<CityResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fermer les suggestions quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Mettre à jour la query quand la value externe change
  useEffect(() => {
    setQuery(value)
  }, [value])

  // Rechercher les villes avec debounce
  useEffect(() => {
    const searchCities = async () => {
      if (query.length < 2) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      setLoading(true)
      try {
        const countryCodesParam = countryCodes.join(',')
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(query)}&` +
            `format=json&` +
            `addressdetails=1&` +
            `limit=8&` +
            `countrycodes=${countryCodesParam}&` +
            `accept-language=fr`,
          {
            headers: {
              'User-Agent': 'AlterApp/1.0',
            },
          }
        )

        if (!response.ok) {
          throw new Error('Erreur de recherche')
        }

        const data: CityResult[] = await response.json()

        // Filtrer pour ne garder que les villes/villages
        const cities = data.filter(
          (result) =>
            result.address.city ||
            result.address.town ||
            result.address.village ||
            result.address.municipality
        )

        setSuggestions(cities)
        setShowSuggestions(cities.length > 0)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Erreur de géocodage:', error)
        if (onError) {
          onError('Impossible de rechercher les villes')
        }
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchCities, 400)
    return () => clearTimeout(debounceTimer)
  }, [query, countryCodes, onError])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const handleSelect = (result: CityResult) => {
    const cityName =
      result.address.city ||
      result.address.town ||
      result.address.village ||
      result.address.municipality ||
      result.display_name.split(',')[0]

    const latitude = parseFloat(result.lat)
    const longitude = parseFloat(result.lon)

    setQuery(cityName)
    setShowSuggestions(false)
    setSuggestions([])
    onChange(cityName, latitude, longitude)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break

      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break

      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex])
        }
        break

      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const formatDisplayName = (result: CityResult): string => {
    const parts = result.display_name.split(',').map((part) => part.trim())
    // Afficher ville, département/région, pays
    return parts.slice(0, 3).join(', ')
  }

  return (
    <div className="city-autocomplete" ref={wrapperRef}>
      {label && (
        <label className="city-autocomplete__label">
          {label}
          {required && <span className="city-autocomplete__required">*</span>}
        </label>
      )}

      <div className="city-autocomplete__input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="city-autocomplete__input"
        />

        {loading && (
          <div className="city-autocomplete__loading">
            <div className="city-autocomplete__spinner" />
          </div>
        )}

        {!loading && query.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setSuggestions([])
              setShowSuggestions(false)
              inputRef.current?.focus()
            }}
            className="city-autocomplete__clear"
            aria-label="Effacer"
          >
            ×
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul className="city-autocomplete__suggestions">
          {suggestions.map((result, index) => (
            <li
              key={result.place_id}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`city-autocomplete__suggestion ${
                index === selectedIndex ? 'city-autocomplete__suggestion--selected' : ''
              }`}
            >
              <span className="city-autocomplete__suggestion-icon">📍</span>
              <span className="city-autocomplete__suggestion-text">
                {formatDisplayName(result)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {showSuggestions && suggestions.length === 0 && query.length >= 2 && !loading && (
        <div className="city-autocomplete__no-results">Aucune ville trouvée</div>
      )}
    </div>
  )
}
