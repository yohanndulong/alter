# 📚 Documentation ALTER

Bienvenue dans la documentation complète du projet ALTER - Dating App avec IA.

## 📖 Table des matières

### 🎯 Démarrage rapide
- [**CLAUDE.md**](./CLAUDE.md) - Vue d'ensemble complète du projet (À LIRE EN PREMIER)

### 🔧 API Backend
- [**README.md**](./api/README.md) - Documentation de l'API
- [**DATABASE_CONFIG.md**](./api/DATABASE_CONFIG.md) - Configuration PostgreSQL + pgvector
- [**FIREBASE_SETUP.md**](./api/FIREBASE_SETUP.md) - Configuration Firebase pour push notifications
- [**MEDIA_MODERATION.md**](./api/MEDIA_MODERATION.md) - Modération automatique de contenu
- [**MODERATION_IMPROVEMENTS.md**](./api/MODERATION_IMPROVEMENTS.md) - Améliorations de la modération

### 📱 Application Frontend
- [**README.md**](./app/README.md) - Documentation de l'app React/Capacitor
- [**QUICK_START.md**](./app/QUICK_START.md) - Guide de démarrage rapide
- [**IMPLEMENTATION_SUMMARY.md**](./app/IMPLEMENTATION_SUMMARY.md) - Résumé des implémentations
- [**IMAGE_CACHE.md**](./app/IMAGE_CACHE.md) - Gestion du cache d'images
- [**MOCK_API_SETUP.md**](./app/MOCK_API_SETUP.md) - Configuration MSW pour le développement

### 🚀 Déploiement
- [**DEPLOY.md**](./deployment/DEPLOY.md) - Guide de déploiement général
- [**RAILWAY_DEPLOYMENT.md**](./deployment/RAILWAY_DEPLOYMENT.md) - Déploiement sur Railway
- [**OTA_UPDATES.md**](./deployment/OTA_UPDATES.md) - Mises à jour OTA avec Capgo

### 📱 Mobile (iOS/Android)
- [**IOS_DEPLOYMENT.md**](./mobile/IOS_DEPLOYMENT.md) - Déploiement iOS
- [**IOS_SETUP_NO_MAC.md**](./mobile/IOS_SETUP_NO_MAC.md) - Configuration iOS sans Mac
- [**IOS_GEOLOCATION_SETUP.md**](./mobile/IOS_GEOLOCATION_SETUP.md) - Configuration géolocalisation iOS
- [**IOS_NOTIFICATIONS_SETUP.md**](./mobile/IOS_NOTIFICATIONS_SETUP.md) - Configuration notifications iOS
- [**SCREENSHOT_PROTECTION.md**](./mobile/SCREENSHOT_PROTECTION.md) - Protection contre les screenshots

### 🏪 Publication sur les Stores
- [**GUIDE_PLAY_STORE.md**](./store/GUIDE_PLAY_STORE.md) - Publication sur Google Play Store
- [**PLAY_STORE_SETUP.md**](./store/PLAY_STORE_SETUP.md) - Configuration Play Store
- [**store-assets/**](./store/store-assets/) - Assets pour les stores (captures d'écran, icônes)

## 🗂️ Structure de la documentation

```
docs/
├── README.md                      # Ce fichier
├── CLAUDE.md                      # Vue d'ensemble du projet
│
├── api/                           # Documentation backend
│   ├── README.md
│   ├── DATABASE_CONFIG.md
│   ├── FIREBASE_SETUP.md
│   ├── MEDIA_MODERATION.md
│   └── MODERATION_IMPROVEMENTS.md
│
├── app/                           # Documentation frontend
│   ├── README.md
│   ├── QUICK_START.md
│   ├── IMPLEMENTATION_SUMMARY.md
│   ├── IMAGE_CACHE.md
│   └── MOCK_API_SETUP.md
│
├── deployment/                    # Guides de déploiement
│   ├── DEPLOY.md
│   ├── RAILWAY_DEPLOYMENT.md
│   └── OTA_UPDATES.md
│
├── mobile/                        # Documentation mobile
│   ├── IOS_DEPLOYMENT.md
│   ├── IOS_SETUP_NO_MAC.md
│   ├── IOS_GEOLOCATION_SETUP.md
│   ├── IOS_NOTIFICATIONS_SETUP.md
│   └── SCREENSHOT_PROTECTION.md
│
└── store/                         # Publication sur les stores
    ├── GUIDE_PLAY_STORE.md
    ├── PLAY_STORE_SETUP.md
    └── store-assets/
```

## 🚀 Par où commencer ?

### Nouveau développeur
1. Lisez [**CLAUDE.md**](./CLAUDE.md) pour comprendre l'architecture
2. Suivez [**QUICK_START.md**](./app/QUICK_START.md) pour lancer le projet
3. Consultez [**DATABASE_CONFIG.md**](./api/DATABASE_CONFIG.md) pour configurer la DB

### Déploiement production
1. [**DEPLOY.md**](./deployment/DEPLOY.md) - Guide général
2. [**RAILWAY_DEPLOYMENT.md**](./deployment/RAILWAY_DEPLOYMENT.md) - Backend
3. [**IOS_DEPLOYMENT.md**](./mobile/IOS_DEPLOYMENT.md) ou [**GUIDE_PLAY_STORE.md**](./store/GUIDE_PLAY_STORE.md) - Mobile

### Publication sur les stores
1. [**GUIDE_PLAY_STORE.md**](./store/GUIDE_PLAY_STORE.md) - Android
2. [**IOS_DEPLOYMENT.md**](./mobile/IOS_DEPLOYMENT.md) - iOS
3. [**store-assets/**](./store/store-assets/) - Assets requis

## 📞 Support

Pour toute question :
- Consulter la documentation appropriée dans ce dossier
- Vérifier les README dans `/api/src/modules/` pour la documentation de chaque module
- Créer une issue sur le repository Git

---

**Version** : 1.0.1
**Dernière mise à jour** : Janvier 2025
