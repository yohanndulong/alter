-- Migration: Ajouter support pgvector et colonnes embedding
-- Date: 2025-01-06
-- Description: Active l'extension pgvector et ajoute les colonnes pour stocker les embeddings de profil

-- Activer l'extension pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Ajouter les colonnes embedding à la table users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "profileEmbedding" vector(1536),
ADD COLUMN IF NOT EXISTS "profileEmbeddingUpdatedAt" timestamp;

-- Créer un index vectoriel pour recherche rapide par similarité cosinus
-- ivfflat est un algorithme d'indexation approximative rapide
CREATE INDEX IF NOT EXISTS users_profile_embedding_idx
ON users
USING ivfflat ("profileEmbedding" vector_cosine_ops)
WITH (lists = 100);

-- Commentaires pour documentation
COMMENT ON COLUMN users."profileEmbedding" IS 'Vecteur embedding du profil utilisateur (1536 dimensions, text-embedding-3-small)';
COMMENT ON COLUMN users."profileEmbeddingUpdatedAt" IS 'Date de dernière mise à jour de l''embedding';
COMMENT ON INDEX users_profile_embedding_idx IS 'Index vectoriel pour recherche de similarité rapide (cosine distance)';
