import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import Constants from 'expo-constants';

/**
 * Configuration de l'application et détection de la plateforme
 */

// Bundle ID / Package Name (stable, ne change jamais)
export const APP_BUNDLE_ID = Capacitor.getPlatform() === 'ios'
  ? 'com.alterdating.alter'
  : 'com.alterdating.alter';

// Version de l'app (depuis app.json via Expo Constants)
export const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

// Clé API mobile (depuis .env)
export const MOBILE_API_KEY = import.meta.env.VITE_MOBILE_API_KEY || '';

/**
 * Récupère les informations de la plateforme
 */
export async function getPlatformInfo(): Promise<{
  platform: 'ios' | 'android';
  bundleId: string;
  appVersion: string;
  osVersion: string;
}> {
  const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';

  // Pour web, utiliser des valeurs par défaut (dev uniquement)
  if (platform === 'web') {
    return {
      platform: 'ios', // Valeur par défaut pour le dev web
      bundleId: APP_BUNDLE_ID,
      appVersion: APP_VERSION,
      osVersion: 'web',
    };
  }

  // Pour mobile, récupérer les vraies infos
  const deviceInfo = await Device.getInfo();

  return {
    platform: platform as 'ios' | 'android',
    bundleId: APP_BUNDLE_ID,
    appVersion: APP_VERSION,
    osVersion: deviceInfo.osVersion || 'unknown',
  };
}

/**
 * Génère les headers requis pour sécuriser les appels API
 */
export async function getSecurityHeaders(): Promise<Record<string, string>> {
  const platformInfo = await getPlatformInfo();

  return {
    'X-App-Key': MOBILE_API_KEY,
    'X-App-Version': platformInfo.appVersion,
    'X-OS-Version': platformInfo.osVersion,
  };
}
