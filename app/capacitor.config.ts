import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alterdating.alter',
  appName: 'Alter - Dating App',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      // Permet de choisir entre caméra et galerie
      promptLabelHeader: 'Choisir une source',
      promptLabelCancel: 'Annuler',
      promptLabelPhoto: 'Depuis la galerie',
      promptLabelPicture: 'Prendre une photo'
    }
  },
  android: {
    // Permettre l'accès aux fichiers
    allowMixedContent: true
  }
};

export default config;
