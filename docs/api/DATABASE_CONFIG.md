# Configuration de la base de données

## Vue d'ensemble

L'API ALTER supporte deux méthodes de configuration de la base de données PostgreSQL.

## Option 1 : DATABASE_URL (Recommandé)

Utilisez une seule variable d'environnement au format URL PostgreSQL standard :

```env
DATABASE_URL=postgresql://username:password@host:port/database
```

### Exemples

**Développement local :**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/alter_db
```

**Production (avec SSL) :**
```env
DATABASE_URL=postgresql://user:pass@prod-server.com:5432/alter_db?sslmode=require
```

**Heroku, Railway, Render, etc. :**
```env
DATABASE_URL=postgresql://generated-user:generated-pass@host.com:5432/db-name
```

### Avantages

- ✅ **Standard** : Format universel supporté par la plupart des plateformes cloud
- ✅ **Simple** : Une seule variable au lieu de 5
- ✅ **Compatible** : Fonctionne directement avec Heroku, Railway, Render, etc.
- ✅ **Sécurisé** : Facile à configurer via secrets/variables d'environnement

## Option 2 : Variables individuelles (Legacy)

Utilisez 5 variables séparées :

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=alter_db
```

### Quand utiliser cette option ?

- Compatibilité avec anciens systèmes
- Configuration par défaut pour développement local

## Comportement de l'application

L'application vérifie la présence de `DATABASE_URL` en priorité :

1. **Si `DATABASE_URL` existe** → Utilise cette URL
2. **Sinon** → Utilise les variables individuelles (DB_HOST, DB_PORT, etc.)

## Configuration dans .env

**Fichier `.env` (recommandé) :**
```env
# Application
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Database (Option 1 - Recommandée)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/alter_db

# JWT
JWT_SECRET=alter-super-secret-jwt-key-change-in-production-2024
JWT_EXPIRES_IN=30d

# LLM (OpenRouter)
OPENROUTER_API_KEY=your-api-key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Email (Resend)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM_NAME=Alter
EMAIL_FROM_ADDRESS=noreply@alter.app

# WebSocket
WEBSOCKET_CORS_ORIGIN=http://localhost:5173
```

## Scripts de migration

Les scripts JavaScript (`install-pgvector.js`, `migrate-photos-to-db.js`) utilisent automatiquement :

1. `DATABASE_URL` si disponible
2. Sinon, les variables individuelles

Aucun changement n'est nécessaire dans ces scripts.

## Déploiement

### Heroku
```bash
heroku config:set DATABASE_URL=postgresql://...
```

### Railway
Railway définit automatiquement `DATABASE_URL` quand vous ajoutez une base PostgreSQL.

### Render
Render définit automatiquement `DATABASE_URL` pour les services PostgreSQL.

### Docker Compose
```yaml
services:
  api:
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/alter_db

  db:
    image: pgvector/pgvector:pg16
    environment:
      - POSTGRES_DB=alter_db
      - POSTGRES_PASSWORD=postgres
```

## Dépannage

### Erreur : "Could not connect to database"

Vérifiez que :
1. PostgreSQL est démarré
2. Les credentials sont corrects
3. Le port 5432 est accessible
4. La base de données existe

### Tester la connexion

```bash
# Avec psql
psql postgresql://postgres:postgres@localhost:5432/alter_db

# Si ça fonctionne, votre DATABASE_URL est correcte
```

### Logs de connexion

L'application affiche les logs de connexion au démarrage :
```
[Nest] INFO [TypeOrmModule] Connected to database
```

### Variables d'environnement non chargées

Assurez-vous que le fichier `.env` existe à la racine du projet :
```bash
ls -la .env
```

## Migration depuis variables individuelles

Si vous utilisez actuellement `DB_HOST`, `DB_PORT`, etc., vous pouvez migrer vers `DATABASE_URL` :

1. Construisez l'URL :
   ```
   postgresql://[DB_USERNAME]:[DB_PASSWORD]@[DB_HOST]:[DB_PORT]/[DB_DATABASE]
   ```

2. Ajoutez-la dans `.env` :
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/alter_db
   ```

3. (Optionnel) Supprimez les anciennes variables :
   ```env
   # DB_HOST=localhost      ← Plus nécessaire
   # DB_PORT=5432           ← Plus nécessaire
   # DB_USERNAME=postgres   ← Plus nécessaire
   # DB_PASSWORD=postgres   ← Plus nécessaire
   # DB_DATABASE=alter_db   ← Plus nécessaire
   ```

L'application fonctionnera avec les deux configurations pendant la transition.
