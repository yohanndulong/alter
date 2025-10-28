/**
 * Calcule la distance entre deux points géographiques en utilisant la formule de Haversine
 *
 * @param lat1 - Latitude du point 1 (en degrés)
 * @param lon1 - Longitude du point 1 (en degrés)
 * @param lat2 - Latitude du point 2 (en degrés)
 * @param lon2 - Longitude du point 2 (en degrés)
 * @returns Distance en kilomètres
 *
 * @example
 * // Distance Paris - Lyon
 * const distance = calculateDistance(48.8566, 2.3522, 45.7640, 4.8357);
 * console.log(distance); // ~392 km
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  // Vérifier que les coordonnées sont valides
  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return Infinity; // Retourner une distance infinie si les coordonnées sont invalides
  }

  // Rayon de la Terre en kilomètres
  const R = 6371;

  // Convertir les degrés en radians
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Distance en kilomètres
  const distance = R * c;

  return Math.round(distance); // Arrondir à l'entier le plus proche
}

/**
 * Vérifie si deux points sont à une distance maximale l'un de l'autre
 *
 * @param lat1 - Latitude du point 1
 * @param lon1 - Longitude du point 1
 * @param lat2 - Latitude du point 2
 * @param lon2 - Longitude du point 2
 * @param maxDistance - Distance maximale en kilomètres
 * @returns true si les points sont à une distance <= maxDistance
 */
export function isWithinDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  maxDistance: number,
): boolean {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  return distance !== Infinity && distance <= maxDistance;
}
