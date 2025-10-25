import { useState } from 'react';

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
 * Utilise l'API HTML5 Geolocation + Nominatim (OpenStreetMap) pour le reverse geocoding
 */
export const useGeolocation = (): UseGeolocationReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = async (): Promise<GeolocationResult> => {
    setLoading(true);
    setError(null);

    try {
      // Vérifier si la géolocalisation est disponible
      if (!navigator.geolocation) {
        throw new Error('La géolocalisation n\'est pas supportée par votre navigateur');
      }

      // Obtenir la position GPS de l'utilisateur
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (err) => {
            switch (err.code) {
              case err.PERMISSION_DENIED:
                reject(new Error('Permission de géolocalisation refusée'));
                break;
              case err.POSITION_UNAVAILABLE:
                reject(new Error('Position indisponible'));
                break;
              case err.TIMEOUT:
                reject(new Error('Délai de géolocalisation dépassé'));
                break;
              default:
                reject(new Error('Erreur de géolocalisation'));
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
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
