-- Migration pour optimiser la pagination des messages
-- Ajoute des index pour améliorer la performance des requêtes de messages

-- Index sur (matchId, createdAt) pour pagination efficace
CREATE INDEX IF NOT EXISTS "IDX_messages_match_created"
ON "messages" ("matchId", "createdAt" DESC);

-- Index sur (matchId, id) pour requêtes avec before/after
CREATE INDEX IF NOT EXISTS "IDX_messages_match_id"
ON "messages" ("matchId", "id");

-- Index sur (senderId, createdAt) pour trouver les messages d'un utilisateur
CREATE INDEX IF NOT EXISTS "IDX_messages_sender_created"
ON "messages" ("senderId", "createdAt" DESC);

-- Index sur (receiverId, read) pour messages non lus
CREATE INDEX IF NOT EXISTS "IDX_messages_receiver_read"
ON "messages" ("receiverId", "read")
WHERE "read" = false;

-- Index composite pour les matches actifs (optimise la requête des conversations)
CREATE INDEX IF NOT EXISTS "IDX_matches_user_updated"
ON "matches" ("userId", "unmatchedAt")
WHERE "unmatchedAt" IS NULL;

-- Statistiques pour le planificateur de requêtes
ANALYZE "messages";
ANALYZE "matches";
