import React, { useState } from 'react'
import { CityAutocomplete } from './CityAutocomplete'
import { useGeolocation } from '../hooks/useGeolocation'
import './CityLocationInput.css'

export interface CityLocation {
  city: string
  latitude?: number
  longitude?: number
}

export interface CityLocationInputProps {
  value: CityLocation
  onChange: (value: CityLocation) => void
  label?: string
  required?: boolean
  disabled?: boolean
  allowGeolocation?: boolean // Afficher le bouton de géolocalisation
  allowManualSearch?: boolean // Afficher le champ de recherche
}

/**
 * Composant combiné pour sélectionner une ville
 * Offre 2 méthodes :
 * 1. Géolocalisation automatique (HTML5 + reverse geocoding)
 * 2. Recherche manuelle avec autocomplete (API Nominatim)
 */
export const CityLocationInput: React.FC<CityLocationInputProps> = ({
  value,
  onChange,
  label = 'Où habitez-vous ?',
  required = false,
  disabled = false,
  allowGeolocation = true,
  allowManualSearch = true,
}) => {
  const [mode, setMode] = useState<'choice' | 'geolocation' | 'manual'>('choice')
  const { getCurrentLocation, loading: geoLoading, error: geoError } = useGeolocation()

  const handleGeolocation = async () => {
    try {
      const location = await getCurrentLocation()
      onChange({
        city: location.city,
        latitude: location.latitude,
        longitude: location.longitude,
      })
      setMode('geolocation')
    } catch (error) {
      console.error('Erreur de géolocalisation:', error)
      // Fallback vers recherche manuelle en cas d'erreur
      if (allowManualSearch) {
        setMode('manual')
      }
    }
  }

  const handleManualSelection = (city: string, latitude: number, longitude: number) => {
    onChange({ city, latitude, longitude })
    setMode('manual')
  }

  // Si on a déjà une valeur, on affiche le mode manuel par défaut
  if (mode === 'choice' && value.city) {
    setMode('manual')
  }

  return (
    <div className="city-location-input">
      {label && (
        <label className="city-location-input__label">
          {label}
          {required && <span className="city-location-input__required">*</span>}
        </label>
      )}

      {/* Mode: Choix initial */}
      {mode === 'choice' && (
        <div className="city-location-input__choice">
          {allowGeolocation && (
            <button
              type="button"
              onClick={handleGeolocation}
              disabled={geoLoading || disabled}
              className="city-location-input__geo-button"
            >
              <span className="city-location-input__geo-icon">📍</span>
              <div className="city-location-input__geo-content">
                <span className="city-location-input__geo-title">
                  {geoLoading ? 'Localisation en cours...' : 'Utiliser ma position actuelle'}
                </span>
                <span className="city-location-input__geo-subtitle">
                  Détection automatique via GPS
                </span>
              </div>
            </button>
          )}

          {allowManualSearch && (
            <>
              {allowGeolocation && (
                <div className="city-location-input__divider">
                  <span>ou</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setMode('manual')}
                disabled={disabled}
                className="city-location-input__manual-button"
              >
                <span className="city-location-input__manual-icon">🔍</span>
                <div className="city-location-input__manual-content">
                  <span className="city-location-input__manual-title">
                    Rechercher ma ville
                  </span>
                  <span className="city-location-input__manual-subtitle">
                    Saisie manuelle avec suggestions
                  </span>
                </div>
              </button>
            </>
          )}

          {geoError && (
            <div className="city-location-input__error">
              <span className="city-location-input__error-icon">⚠️</span>
              <span>{geoError}</span>
            </div>
          )}
        </div>
      )}

      {/* Mode: Recherche manuelle */}
      {mode === 'manual' && (
        <div className="city-location-input__manual">
          <CityAutocomplete
            value={value.city || ''}
            onChange={handleManualSelection}
            placeholder="Rechercher votre ville..."
            disabled={disabled}
          />

          {allowGeolocation && (
            <button
              type="button"
              onClick={() => setMode('choice')}
              className="city-location-input__switch-button"
            >
              ← Utiliser la géolocalisation
            </button>
          )}
        </div>
      )}

      {/* Mode: Géolocalisation réussie */}
      {mode === 'geolocation' && value.city && (
        <div className="city-location-input__success">
          <div className="city-location-input__result">
            <span className="city-location-input__result-icon">✓</span>
            <div className="city-location-input__result-content">
              <span className="city-location-input__result-title">Ville détectée</span>
              <span className="city-location-input__result-city">{value.city}</span>
              {value.latitude && value.longitude && (
                <span className="city-location-input__result-coords">
                  {value.latitude.toFixed(4)}, {value.longitude.toFixed(4)}
                </span>
              )}
            </div>
          </div>

          {allowManualSearch && (
            <button
              type="button"
              onClick={() => setMode('manual')}
              className="city-location-input__switch-button"
            >
              Modifier la ville
            </button>
          )}
        </div>
      )}
    </div>
  )
}
