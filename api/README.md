# Alter API V2

API backend NestJS pour l'application de rencontres Alter.

## Technologies

- **NestJS** - Framework Node.js
- **TypeORM** - ORM pour PostgreSQL
- **PostgreSQL** - Base de données
- **JWT** - Authentification
- **Resend** - Envoi d'emails
- **OpenRouter** - Intégration LLM (GPT-4, etc.)
- **Socket.io** - Chat en temps réel (WebSocket)

## Fonctionnalités

### Modules implémentés

1. **Auth** - Authentification par email avec code de vérification
2. **Users** - Gestion des profils utilisateurs
3. **Onboarding** - Questions d'onboarding dynamiques
4. **Matching** - Découverte, likes, matches avec scores de compatibilité LLM
5. **Chat** - Messagerie en temps réel (WebSocket)
6. **Alter Chat** - Conversation avec l'IA Alter
7. **Upload** - Upload de photos
8. **Parameters** - Système de paramètres versionnés
9. **LLM** - Service d'intégration OpenRouter avec templates de prompts
10. **Email** - Service d'envoi d'emails via Resend

### Intégration LLM

L'API utilise OpenRouter pour 3 cas d'usage :

1. **Calcul de compatibilité** - Analyse les profils et calcule les scores
2. **Chat Alter** - Conversation empathique pour créer un profil authentique
3. **Analyse de qualité de conversation** - Évalue la qualité des échanges

## Installation

### Prérequis

- Node.js 18+
- PostgreSQL 14+
- Compte Resend (pour les emails)
- Compte OpenRouter (pour le LLM)

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer la base de données

Créez une base de données PostgreSQL :

```sql
CREATE DATABASE alter_db;
```

### 3. Configuration

Modifiez le fichier .env avec vos paramètres :

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=votre_mot_de_passe
DB_DATABASE=alter_db

# JWT
JWT_SECRET=votre-secret-jwt-super-securise

# Resend
RESEND_API_KEY=re_votre_cle_api_resend

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-votre_cle_api_openrouter
```

### 4. Lancer l'API

Mode développement :

```bash
npm run start:dev
```

L'API sera accessible sur : http://localhost:3000/api

## Endpoints principaux

### Auth
- POST /api/auth/send-code - Envoyer un code de vérification
- POST /api/auth/login - Se connecter avec le code
- GET /api/auth/me - Récupérer l'utilisateur connecté

### Matching
- GET /api/matching/discover - Profils à découvrir
- POST /api/matching/like/:userId - Liker un profil
- GET /api/matching/matches - Liste des matches

### Chat
- GET /api/chat/matches/:matchId/messages - Historique messages
- WebSocket : join-match, send-message, message

### Alter Chat
- GET /api/chat/ai/messages - Historique avec Alter
- POST /api/chat/ai/messages - Envoyer un message à Alter

## Structure

```
src/
├── main.ts
├── app.module.ts
└── modules/
    ├── auth/
    ├── users/
    ├── matching/
    ├── chat/
    ├── alter-chat/
    └── llm/
```

## Licence

ISC
