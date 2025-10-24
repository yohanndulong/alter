# Système d'Embeddings pour Matching Optimisé

## 🎯 Vue d'ensemble

Les embeddings permettent de représenter les profils utilisateurs sous forme de vecteurs numériques (1536 dimensions). Cela permet :
- **Recherche sémantique** : Trouver les profils les plus similaires par calcul de similarité cosinus
- **Matching optimisé** : ~99% de réduction de coût vs analyse LLM pour chaque paire
- **Performance** : Recherche x100-1000 plus rapide grâce à pgvector

## 🏗️ Architecture

### Stack technique
- **pgvector** : Extension PostgreSQL pour stockage et recherche vectorielle
- **OpenAI text-embedding-3-small** : Modèle d'embedding (1536 dimensions, $0.02/1M tokens)
- **OpenAI API** : API utilisée pour générer les embeddings
- **TypeORM** : ORM avec support des types vector

### Flux de données

```
1. ALTER Chat complète le profil (30%+)
   └─> Auto-génération de l'embedding
       └─> Stockage dans users.profileEmbedding

2. Matching Discover
   └─> Recherche vectorielle par similarité
       └─> Top 20 profils similaires
           └─> Retour des résultats
```

## 📦 Installation

### 1. Installer pgvector dans PostgreSQL

```sql
-- Se connecter à la base de données
psql -U postgres -d alter_db

-- Installer l'extension
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Exécuter la migration SQL

```bash
# Depuis le dossier alter-api-v2
psql -U postgres -d alter_db -f src/migrations/001-add-pgvector-and-embeddings.sql
```

### 3. Générer les embeddings pour les utilisateurs existants

```bash
npm run seed:embeddings
```

## 🚀 Utilisation

### Génération automatique d'embeddings

Les embeddings sont générés automatiquement dans **AlterChatService** quand :
- Le profil ALTER est complété à au moins 30%
- L'utilisateur a un `alterSummary` ou `alterProfileAI` renseigné

```typescript
// alter-chat.service.ts (ligne 118)
if (finalProfileState.completion >= 30) {
  await this.updateProfileEmbedding(userId);
}
```

### Recherche de profils similaires

Le **MatchingService** utilise automatiquement les embeddings si disponibles :

```typescript
// matching.service.ts
async getDiscoverProfiles(userId: string): Promise<User[]> {
  // Utilise la recherche vectorielle si l'embedding existe
  if (currentUser.profileEmbedding) {
    return this.getDiscoverProfilesByEmbedding(currentUser);
  }
  // Sinon, fallback sur l'ancienne méthode
  return this.getDiscoverProfilesLegacy(currentUser);
}
```

### Recherche vectorielle SQL

```sql
-- Trouver les 20 profils les plus similaires
SELECT
  u.*,
  1 - (u."profileEmbedding" <=> '[...]'::vector) AS similarity
FROM users u
WHERE u."profileEmbedding" IS NOT NULL
  AND u.id != 'current-user-id'
ORDER BY similarity DESC
LIMIT 20;
```

## 📊 Performance

### Gains estimés (1000 utilisateurs)

| Métrique | Sans embeddings | Avec embeddings | Gain |
|----------|----------------|-----------------|------|
| **Calculs de compatibilité** | 499,500 LLM | 1,000 embeddings + 10,000 LLM | **-98%** |
| **Coût** | $1,500 | $30 | **$1,470 économisés** |
| **Temps** | ~8 minutes | ~2 secondes | **x240 plus rapide** |

### Coûts

| Opération | Modèle | Prix | Fréquence |
|-----------|--------|------|-----------|
| Génération embedding | text-embedding-3-small | $0.02/1M tokens | À chaque mise à jour profil |
| Recherche vectorielle | PostgreSQL | Gratuit | À chaque découverte |
| Analyse LLM (fallback) | gpt-4o | $3/1M tokens | Uniquement si pas d'embedding |

## 🔧 API du Service

### EmbeddingsService

```typescript
// Générer un embedding pour un texte
const embedding = await embeddingsService.generateEmbedding('texte à encoder');

// Générer un embedding pour un profil complet
const profileEmbedding = await embeddingsService.generateProfileEmbedding(user);

// Calculer la similarité entre deux vecteurs
const similarity = embeddingsService.cosineSimilarity(vec1, vec2);
// Retourne un score entre 0 (opposés) et 1 (identiques)
```

### Mise à jour manuelle d'un embedding

```typescript
// Dans AlterChatService
private async updateProfileEmbedding(userId: string): Promise<void> {
  const user = await this.usersService.findOne(userId);
  const embedding = await this.embeddingsService.generateProfileEmbedding(user);

  await this.usersService.update(userId, {
    profileEmbedding: embedding,
    profileEmbeddingUpdatedAt: new Date(),
  });
}
```

## 🗄️ Schéma de base de données

```sql
-- Colonnes ajoutées à la table users
ALTER TABLE users
ADD COLUMN "profileEmbedding" vector(1536),  -- Vecteur 1536 dimensions
ADD COLUMN "profileEmbeddingUpdatedAt" timestamp;

-- Index pour recherche rapide
CREATE INDEX users_profile_embedding_idx
ON users
USING ivfflat ("profileEmbedding" vector_cosine_ops)
WITH (lists = 100);
```

## 📈 Monitoring

### Logs à surveiller

```typescript
// Génération d'embedding
✅ Profile embedding updated for user abc123 (completion: 85%)

// Recherche vectorielle
Found 20 profiles via embedding similarity

// Fallback si pas d'embedding
⚠️ User abc123 has no embedding, using legacy matching
```

### Métriques clés

- **Taux de couverture** : % d'utilisateurs avec embedding
- **Temps moyen de recherche** : Doit être < 100ms
- **Coût par embedding** : ~$0.00001 par génération
- **Similarité moyenne** : Entre 0.4 et 0.8 pour de bons matchs

## 🐛 Troubleshooting

### Erreur "extension vector does not exist"

```sql
-- Solution : Installer pgvector
CREATE EXTENSION vector;
```

### Erreur "column profileEmbedding does not exist"

```bash
# Solution : Exécuter la migration
psql -U postgres -d alter_db -f src/migrations/001-add-pgvector-and-embeddings.sql
```

### Embeddings non générés

Vérifier que :
1. Le profil est complété à au moins 30%
2. L'utilisateur a un `alterSummary` ou `bio` non vide
3. L'API OpenRouter est accessible

### Recherche vectorielle lente

```sql
-- Vérifier que l'index existe
\d users

-- Si absent, recréer l'index
CREATE INDEX users_profile_embedding_idx
ON users
USING ivfflat ("profileEmbedding" vector_cosine_ops)
WITH (lists = 100);
```

## 🔐 Sécurité

- ✅ Embeddings stockés en base de données (pas d'accès externe)
- ✅ Génération asynchrone (pas de blocage utilisateur)
- ✅ Fallback automatique si échec de génération
- ✅ Logs des erreurs sans exposer les données sensibles

## 🚀 Évolutions futures

### Court terme
- [ ] Dashboard de monitoring des embeddings
- [ ] API pour régénérer les embeddings en masse
- [ ] Cache des similarités calculées

### Moyen terme
- [ ] Recherche hybride (embeddings + critères classiques)
- [ ] Embeddings multi-modaux (texte + images)
- [ ] A/B testing matching classique vs embeddings

### Long terme
- [ ] Fine-tuning du modèle d'embedding sur les données ALTER
- [ ] Embeddings temps réel avec streaming
- [ ] Recommandations personnalisées par ML

## 📚 Ressources

- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Vector Similarity Search](https://www.pinecone.io/learn/vector-similarity/)
