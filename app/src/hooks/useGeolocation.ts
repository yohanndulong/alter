import { useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';

export interface GeolocationResult {
  city: string;
  latitude: number;
  longitude: number;
}

export interface UseGeolocationReturn {
  getCurrentLocation: () => Promise<GeolocationResult>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook pour obtenir la géolocalisation de l'utilisateur
 * Utilise Capacitor Geolocation (natif iOS/Android + web) + Nominatim pour le reverse geocoding
 */
export const useGeolocation = (): UseGeolocationReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = async (): Promise<GeolocationResult> => {
    setLoading(true);
    setError(null);

    try {
      // Vérifier les permissions
      const permission = await Geolocation.checkPermissions();

      if (permission.location === 'denied') {
        throw new Error('Permission de géolocalisation refusée');
      }

      // Demander la permission si elle n'est pas encore accordée
      if (permission.location === 'prompt' || permission.location === 'prompt-with-rationale') {
        const requestResult = await Geolocation.requestPermissions();
        if (requestResult.location !== 'granted') {
          throw new Error('Permission de géolocalisation refusée');
        }
      }

      // Obtenir la position GPS de l'utilisateur avec Capacitor
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocoding avec Nominatim (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` +
        `lat=${latitude}&` +
        `lon=${longitude}&` +
        `format=json&` +
        `addressdetails=1&` +
        `accept-language=fr`,
        {
          headers: {
            'User-Agent': 'AlterApp/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de l\'adresse');
      }

      const data = await response.json();

      // Extraire le nom de la ville
      const city =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.municipality ||
        'Ville inconnue';

      setLoading(false);

      return {
        city,
        latitude: parseFloat(latitude.toFixed(6)),
        longitude: parseFloat(longitude.toFixed(6)),
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Impossible d\'obtenir votre position';
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  };

  return {
    getCurrentLocation,
    loading,
    error,
  };
};
