-- Migration: Migrer les photos du système de fichiers vers la base de données
-- Date: 2025-01-06
-- Description: Remplace le stockage des photos en fichiers par un stockage direct en base de données

-- Sauvegarder les anciennes données (optionnel, pour rollback)
CREATE TABLE IF NOT EXISTS photos_backup AS SELECT * FROM photos;

-- Supprimer l'ancienne colonne url
ALTER TABLE photos DROP COLUMN IF EXISTS url;

-- Ajouter les nouvelles colonnes pour stocker les images en base de données
ALTER TABLE photos
ADD COLUMN IF NOT EXISTS data bytea,
ADD COLUMN IF NOT EXISTS "mimeType" varchar(100),
ADD COLUMN IF NOT EXISTS filename varchar(255),
ADD COLUMN IF NOT EXISTS size integer;

-- Rendre les colonnes NOT NULL après migration des données
-- (Pour l'instant elles sont nullables pour permettre la migration progressive)

-- Commentaires pour documentation
COMMENT ON COLUMN photos.data IS 'Données binaires de l''image stockées en base64';
COMMENT ON COLUMN photos."mimeType" IS 'Type MIME de l''image (image/jpeg, image/png, etc.)';
COMMENT ON COLUMN photos.filename IS 'Nom du fichier original';
COMMENT ON COLUMN photos.size IS 'Taille du fichier en octets';

-- Note: Les anciennes photos stockées en fichiers devront être migrées manuellement
-- ou peuvent être conservées dans photos_backup si nécessaire
