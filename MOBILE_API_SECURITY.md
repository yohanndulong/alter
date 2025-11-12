# 🔒 Sécurisation de l'API - Apps mobiles uniquement

Ce document explique comment l'API Alter est sécurisée pour n'accepter que les requêtes provenant des applications mobiles officielles (iOS et Android).

## 📋 Vue d'ensemble

La solution implémentée combine plusieurs couches de sécurité :

1. **API Key secrète** : Filtre les requêtes non-mobiles
2. **Bundle ID / Package Name** : Valide l'origine de l'app (inclus dans le JWT)
3. **Versions trackées** : Log des versions app/OS pour analytics (sans bloquer)
4. **JWT stable** : Reste valide après mise à jour app/OS

## 🎯 Avantages

✅ **JWT stable** : Pas d'invalidation après mise à jour de l'app ou de l'OS
✅ **Simple à implémenter** : Pas besoin de services tiers
✅ **Compatible HTTP et WebSocket** : Fonctionne partout
✅ **Mode développement** : Peut être désactivé pour le dev local

## 🏗️ Architecture

### Côté API (NestJS)

```
Requête HTTP/WebSocket
    ↓
1. JWT vérifié (userId, bundleId, platform)
    ↓
2. AppPlatformGuard vérifie:
   - Header X-App-Key
   - bundleId dans JWT
    ↓
3. Versions loggées (X-App-Version, X-OS-Version)
    ↓
✅ Requête autorisée
```

### Côté App Mobile (React Native / Capacitor)

```
Connexion
    ↓
1. Récupère platformInfo (bundleId, platform, versions)
    ↓
2. Envoie à /auth/login avec bundleId + platform
    ↓
3. Reçoit JWT contenant bundleId + platform
    ↓
Chaque requête
    ↓
4. Headers ajoutés automatiquement:
   - X-App-Key: [clé secrète]
   - X-App-Version: "1.0.0"
   - X-OS-Version: "17.2"
    ↓
✅ Requête validée par l'API
```

## 📝 Fichiers modifiés

### API (Backend)

```
api/
├── .env.example                                    # Ajout de MOBILE_API_KEY
├── src/modules/auth/
│   ├── dto/verify-code.dto.ts                     # Ajout bundleId + platform
│   ├── auth.service.ts                             # JWT enrichi
│   ├── auth.controller.ts                          # Passe bundleId au service
│   ├── strategies/jwt.strategy.ts                  # Inclut bundleId dans payload
│   ├── guards/app-platform.guard.ts                # Guard HTTP
│   ├── services/app-validation.service.ts          # Service de validation
│   └── auth.module.ts                              # Exports des nouveaux services
├── src/modules/chat/
│   ├── chat.gateway.ts                             # Validation WebSocket
│   └── chat.module.ts                              # Import AuthModule
└── src/modules/alter-chat/
    ├── alter-chat.gateway.ts                       # Validation WebSocket
    └── alter-chat.module.ts                        # Import AuthModule
```

### App Mobile (Frontend)

```
app/
├── src/config/app.ts                               # Config plateforme + headers
├── src/services/
│   ├── api.ts                                      # Headers ajoutés automatiquement
│   └── chat.ts                                     # WebSocket avec headers
└── src/contexts/AuthContext.tsx                    # Login avec bundleId + platform
```

## ⚙️ Configuration

### 1. Backend (.env)

Ajoutez cette ligne dans votre fichier `.env` :

```bash
# Générez une clé aléatoire forte avec:
# openssl rand -base64 32
MOBILE_API_KEY=votre-cle-super-secrete-changez-moi-en-production
```

⚠️ **Important** :
- Utilisez une clé différente pour chaque environnement (dev, staging, prod)
- Ne commitez JAMAIS cette clé dans Git
- Gardez cette clé secrète et ne la partagez pas

### 2. Frontend (.env)

Créez ou modifiez le fichier `.env` de l'app mobile :

```bash
# Doit correspondre exactement à MOBILE_API_KEY du backend
VITE_MOBILE_API_KEY=votre-cle-super-secrete-changez-moi-en-production

# URL de votre API
VITE_API_URL=http://localhost:3000/api
```

⚠️ **Sécurité** :
- La clé sera intégrée dans le build de l'app (pas idéal mais acceptable)
- Pour plus de sécurité, utilisez Certificate Pinning (voir section Améliorations)

## 🧪 Tests

### Test 1 : Login depuis l'app mobile

```bash
# Démarrer l'API
cd api
npm run start:dev

# Démarrer l'app
cd app
npm run dev
```

✅ Le login devrait fonctionner normalement
✅ Vérifiez les logs backend : `✅ Requête validée - Platform: ios, Bundle: com.alterdating.alter`

### Test 2 : Bloquer les requêtes externes

Essayez depuis Postman / curl :

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "code": "123456",
    "bundleId": "com.alterdating.alter",
    "platform": "ios"
  }'
```

❌ Devrait retourner : `401 Unauthorized - API key invalide ou manquante`

### Test 3 : WebSocket

Ouvrez la console du navigateur/app et vérifiez les connexions WebSocket :

✅ Chat socket : `Chat - Client connected: [socket-id] (userId: [user-id])`
✅ Alter Chat socket : `Alter Chat - Client connected: [socket-id] (userId: [user-id])`

## 📊 Monitoring

Les logs backend affichent :

```
✅ Requête validée - Platform: ios, Bundle: com.alterdating.alter, App: 1.0.0, OS: 17.2
```

Vous pouvez :
- Tracker les versions utilisées
- Détecter les tentatives d'accès non autorisées
- Analyser les patterns de connexion

## 🚀 Mode développement

Si `MOBILE_API_KEY` n'est pas définie, la validation est **désactivée** :

```
⚠️  MOBILE_API_KEY non définie dans .env - La validation sera désactivée
Validation désactivée (pas de MOBILE_API_KEY)
```

C'est pratique pour le développement local, mais **n'oubliez pas de la configurer en production** !

## 🔐 Améliorations futures

### 1. Certificate Pinning (SSL Pinning)

Empêche les attaques MITM en vérifiant le certificat SSL du serveur.

**Implémentation avec Capacitor** :

```typescript
// capacitor.config.ts
export default {
  plugins: {
    CapacitorHttp: {
      enabled: true,
      sslPinning: {
        'api.alterdating.com': {
          certs: ['sha256/HASH_DU_CERTIFICAT'],
        },
      },
    },
  },
};
```

### 2. App Attestation (iOS) / Play Integrity API (Android)

Validation native par Apple/Google pour garantir l'authenticité de l'app.

- **iOS** : [Apple App Attest](https://developer.apple.com/documentation/devicecheck/validating_apps_that_connect_to_your_server)
- **Android** : [Play Integrity API](https://developer.android.com/google/play/integrity)

### 3. Rotation automatique des clés

Utilisez un service comme AWS Secrets Manager ou HashiCorp Vault pour rotationner automatiquement `MOBILE_API_KEY`.

### 4. Rate Limiting avancé

Ajoutez du rate limiting par bundleId :

```typescript
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 req / minute
```

## 🐛 Dépannage

### Erreur : "API key invalide ou manquante"

1. Vérifiez que `MOBILE_API_KEY` est définie dans `.env` (API)
2. Vérifiez que `VITE_MOBILE_API_KEY` est définie dans `.env` (App)
3. Vérifiez que les deux clés sont identiques
4. Redémarrez l'API et l'app après modification des .env

### Erreur : "Bundle ID non autorisé"

Le `bundleId` envoyé ne correspond pas à celui autorisé.

**Solution** :
1. Vérifiez `app.json` : `bundleId` doit être `com.alterdating.alter`
2. Modifiez `api/src/modules/auth/services/app-validation.service.ts` si nécessaire :

```typescript
this.allowedBundleIds = [
  'com.alterdating.alter', // Production
  'com.alterdating.alter.dev', // Dev (si vous en avez un)
];
```

### WebSocket déconnecté immédiatement

1. Vérifiez les logs backend : `Connection rejected: [raison]`
2. Vérifiez que le JWT contient bien `bundleId` et `platform`
3. Vérifiez que les headers sont envoyés (`extraHeaders` dans socket.io)

### Mode web (navigateur) ne fonctionne pas

C'est normal ! L'API n'accepte que les apps mobiles.

**Solutions** :
- Désactivez temporairement la validation (retirez `MOBILE_API_KEY` du .env)
- Ou ajoutez un bundle ID spécifique pour le web dans les `allowedBundleIds`

## 📚 Ressources

- [NestJS Guards](https://docs.nestjs.com/guards)
- [Socket.io Authentication](https://socket.io/docs/v4/middlewares/)
- [Capacitor Device API](https://capacitorjs.com/docs/apis/device)
- [OWASP Mobile Security](https://owasp.org/www-project-mobile-top-10/)

## ✅ Checklist de déploiement

Avant de déployer en production :

- [ ] Générer une `MOBILE_API_KEY` forte (32+ caractères aléatoires)
- [ ] Configurer `MOBILE_API_KEY` sur le serveur de production
- [ ] Configurer `VITE_MOBILE_API_KEY` dans les builds de production
- [ ] Vérifier que les logs de sécurité fonctionnent
- [ ] Tester le login depuis l'app de production
- [ ] Vérifier que Postman/curl sont bien bloqués
- [ ] Configurer le monitoring des tentatives d'accès non autorisées
- [ ] (Optionnel) Implémenter Certificate Pinning
- [ ] (Optionnel) Implémenter App Attestation / Play Integrity

---

**Note** : Cette solution offre un bon niveau de sécurité pour filtrer les accès non-mobiles. Pour une sécurité maximale (applications bancaires, etc.), combinez avec Certificate Pinning et App Attestation.
