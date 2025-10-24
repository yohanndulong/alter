# Système de Paramètres

Ce module gère les paramètres de configuration de l'application avec :
- Versioning automatique
- Cache avec TTL de 1 heure
- Interface d'administration
- Initialisation automatique au démarrage

## Paramètres par défaut

Les paramètres sont définis dans `default-parameters.ts` et sont automatiquement créés au démarrage du serveur s'ils n'existent pas.

### Catégories de paramètres

#### Application (`app.*`)
- `app.maintenance_mode` - Mode maintenance
- `app.allow_registrations` - Autorisation des inscriptions

#### Matching (`matching.*`)
- `matching.min_compatibility_score` - Score minimum pour affichage
- `matching.max_daily_likes` - Limite de likes par jour
- `matching.max_distance_km` - Distance maximale par défaut

#### Chat (`chat.*`)
- `chat.max_message_length` - Longueur max des messages
- `chat.allow_media` - Autoriser les médias

#### Alter (`alter.*`)
- `alter.max_questions_per_session` - Questions max par session
- `alter.personality_weight` - Poids personnalité (20%)
- `alter.intention_weight` - Poids intention (15%)
- `alter.identity_weight` - Poids identité (15%)
- `alter.friendship_weight` - Poids amitié (15%)
- `alter.love_weight` - Poids amour (15%)
- `alter.sexuality_weight` - Poids sexualité (10%)
- `alter.bio_weight` - Poids bio (10%)

#### Upload (`upload.*`)
- `upload.max_file_size_mb` - Taille max des fichiers
- `upload.allowed_image_types` - Types MIME autorisés
- `upload.max_photos_per_user` - Photos max par profil

#### LLM (`llm.*`)
- `llm.model` - Modèle par défaut (gpt-4o)
- `llm.temperature` - Température (0.8)
- `llm.max_tokens` - Tokens max (1500)

#### Email (`email.*`)
- `email.verification_code_expiry_minutes` - Durée validité code

#### Sécurité (`security.*`)
- `security.max_login_attempts` - Tentatives max avant blocage
- `security.lockout_duration_minutes` - Durée de blocage

#### Prompts (`prompts.*`)
- `prompts.alter_system` - Prompt système complet pour ALTER avec placeholders
- `prompts.compatibility_analysis` - Prompt pour analyse de compatibilité
- `prompts.conversation_quality` - Prompt pour évaluation de conversation

**Note** : Les prompts utilisent des placeholders `{{variable_name}}` pour injection dynamique.
Voir `/src/modules/llm/PROMPTS.md` pour la documentation complète.

## Utilisation dans le code

### Récupérer un paramètre

```typescript
constructor(private readonly parametersService: ParametersService) {}

async myMethod() {
  // Récupérer avec type
  const maintenanceMode = await this.parametersService.get<boolean>('app.maintenance_mode');

  // Récupérer la valeur brute
  const maxLikes = await this.parametersService.get('matching.max_daily_likes');
}
```

### Mettre à jour un paramètre

```typescript
// Crée une nouvelle version automatiquement
await this.parametersService.set(
  'app.maintenance_mode',
  true,
  'Activé pour maintenance planifiée'
);
```

### Voir l'historique

```typescript
const versions = await this.parametersService.getVersions('app.maintenance_mode');
```

### Restaurer une version

```typescript
await this.parametersService.restoreVersion('app.maintenance_mode', 2);
```

## Ajouter un nouveau paramètre par défaut

1. Éditer `default-parameters.ts`
2. Ajouter un objet dans le tableau `DEFAULT_PARAMETERS` :

```typescript
{
  key: 'category.parameter_name',
  value: 'default_value', // any type
  description: 'Description claire du paramètre',
}
```

3. Redémarrer le serveur - le paramètre sera créé automatiquement

## API REST (Admin seulement)

- `GET /parameters` - Liste tous les paramètres
- `GET /parameters/:key` - Récupère un paramètre
- `GET /parameters/:key/versions` - Historique
- `PUT /parameters/:key` - Mise à jour (crée nouvelle version)
- `PUT /parameters/:key/versions/:version/restore` - Restaurer
- `DELETE /parameters/:key/versions/:version` - Supprimer

## Cache

- TTL : 1 heure
- Invalidation automatique lors des mises à jour
- Clé de cache : `parameter:{key}`

## Scripts

```bash
# Définir les admins
npm run seed:admins

# Accéder à l'interface admin
# http://localhost:5173/admin/parameters (authentification requise + droits admin)
```

## Sécurité

- Routes protégées par `JwtAuthGuard` + `AdminGuard`
- Seuls les utilisateurs avec `isAdmin = true` peuvent modifier les paramètres
- Admins actuels :
  - yohann.dulong@gmail.com
  - paquiet.marion@gmail.com
