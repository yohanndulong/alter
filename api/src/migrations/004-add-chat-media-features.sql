-- Migration: Ajouter fonctionnalités médias au chat
-- Date: 2025-01-16
-- Description: Ajoute support pour messages vocaux et photos, avec modération et analyses de qualité

-- Ajouter type de message et rendre content nullable
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'text',
ALTER COLUMN content DROP NOT NULL;

-- Ajouter contrainte pour le type
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type') THEN
        CREATE TYPE message_type AS ENUM ('text', 'voice', 'photo');
    END IF;
END $$;

-- Changer le type de la colonne
ALTER TABLE messages
ALTER COLUMN type TYPE message_type USING type::message_type;

-- Créer la table message_media
CREATE TABLE IF NOT EXISTS message_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "messageId" UUID NOT NULL UNIQUE,
    "filePath" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    duration INTEGER,
    "isReel" BOOLEAN DEFAULT false,
    "viewMode" VARCHAR(20),
    "viewDuration" INTEGER,
    viewed BOOLEAN DEFAULT false,
    "viewedAt" TIMESTAMP,
    "moderationResult" JSONB,
    "thumbnailPath" VARCHAR(255),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_message FOREIGN KEY ("messageId") REFERENCES messages(id) ON DELETE CASCADE
);

-- Créer type enum pour viewMode
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'photo_view_mode') THEN
        CREATE TYPE photo_view_mode AS ENUM ('once', 'unlimited');
    END IF;
END $$;

-- Changer le type de la colonne viewMode
ALTER TABLE message_media
ALTER COLUMN "viewMode" TYPE photo_view_mode USING "viewMode"::photo_view_mode;

-- Index pour performances
CREATE INDEX IF NOT EXISTS message_media_message_idx ON message_media ("messageId");
CREATE INDEX IF NOT EXISTS message_media_viewed_idx ON message_media (viewed, "viewMode");
CREATE INDEX IF NOT EXISTS messages_type_idx ON messages (type);

-- Commentaires pour documentation
COMMENT ON TABLE message_media IS 'Stockage des métadonnées pour messages vocaux et photos';
COMMENT ON COLUMN message_media.id IS 'Identifiant unique du média';
COMMENT ON COLUMN message_media."messageId" IS 'ID du message associé (unique)';
COMMENT ON COLUMN message_media."filePath" IS 'Chemin du fichier stocké';
COMMENT ON COLUMN message_media."mimeType" IS 'Type MIME du fichier';
COMMENT ON COLUMN message_media."fileSize" IS 'Taille du fichier en octets';
COMMENT ON COLUMN message_media.duration IS 'Durée en secondes (pour les vocaux)';
COMMENT ON COLUMN message_media."isReel" IS 'Photo prise avec l''app (vs upload)';
COMMENT ON COLUMN message_media."viewMode" IS 'Mode d''affichage: once ou unlimited';
COMMENT ON COLUMN message_media."viewDuration" IS 'Durée d''affichage pour mode once (secondes)';
COMMENT ON COLUMN message_media.viewed IS 'Photo déjà vue par le destinataire';
COMMENT ON COLUMN message_media."viewedAt" IS 'Date de première visualisation';
COMMENT ON COLUMN message_media."moderationResult" IS 'Résultats de l''analyse de modération';
COMMENT ON COLUMN message_media."thumbnailPath" IS 'Chemin du thumbnail (pour photos)';
COMMENT ON COLUMN messages.type IS 'Type de message: text, voice ou photo';
