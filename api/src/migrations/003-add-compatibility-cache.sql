-- Migration: Ajouter table de cache de compatibilité
-- Date: 2025-01-16
-- Description: Crée la table compatibility_cache pour stocker les scores de compatibilité calculés par LLM

-- Créer la table compatibility_cache
CREATE TABLE IF NOT EXISTS compatibility_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "targetUserId" UUID NOT NULL,
    "scoreGlobal" INTEGER NOT NULL,
    "scoreLove" INTEGER,
    "scoreFriendship" INTEGER,
    "scoreCarnal" INTEGER,
    "compatibilityInsight" TEXT,
    "userProfileHash" VARCHAR(64) NOT NULL,
    "targetProfileHash" VARCHAR(64) NOT NULL,
    "embeddingScore" FLOAT,
    "calculatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_target_user FOREIGN KEY ("targetUserId") REFERENCES users(id) ON DELETE CASCADE
);

-- Index unique pour éviter les doublons
CREATE UNIQUE INDEX IF NOT EXISTS compatibility_cache_user_target_idx
ON compatibility_cache ("userId", "targetUserId");

-- Index pour recherches par score
CREATE INDEX IF NOT EXISTS compatibility_cache_user_score_idx
ON compatibility_cache ("userId", "scoreGlobal");

-- Index pour vérification de cache avec hash
CREATE INDEX IF NOT EXISTS compatibility_cache_hash_idx
ON compatibility_cache ("userId", "userProfileHash", "targetProfileHash");

-- Commentaires pour documentation
COMMENT ON TABLE compatibility_cache IS 'Cache des scores de compatibilité calculés par LLM entre deux utilisateurs';
COMMENT ON COLUMN compatibility_cache.id IS 'Identifiant unique du cache';
COMMENT ON COLUMN compatibility_cache."userId" IS 'ID de l''utilisateur source';
COMMENT ON COLUMN compatibility_cache."targetUserId" IS 'ID de l''utilisateur cible';
COMMENT ON COLUMN compatibility_cache."scoreGlobal" IS 'Score de compatibilité globale (0-100)';
COMMENT ON COLUMN compatibility_cache."scoreLove" IS 'Score de compatibilité amoureuse (0-100)';
COMMENT ON COLUMN compatibility_cache."scoreFriendship" IS 'Score de compatibilité amicale (0-100)';
COMMENT ON COLUMN compatibility_cache."scoreCarnal" IS 'Score de compatibilité charnelle (0-100)';
COMMENT ON COLUMN compatibility_cache."compatibilityInsight" IS 'Insight personnalisé généré par l''IA';
COMMENT ON COLUMN compatibility_cache."userProfileHash" IS 'Hash SHA-256 du profil utilisateur source';
COMMENT ON COLUMN compatibility_cache."targetProfileHash" IS 'Hash SHA-256 du profil utilisateur cible';
COMMENT ON COLUMN compatibility_cache."embeddingScore" IS 'Score de similarité des embeddings (0-1)';
COMMENT ON COLUMN compatibility_cache."calculatedAt" IS 'Date de calcul initial';
COMMENT ON COLUMN compatibility_cache."updatedAt" IS 'Date de dernière mise à jour';
COMMENT ON COLUMN compatibility_cache."expiresAt" IS 'Date d''expiration du cache (NULL = pas d''expiration)';
