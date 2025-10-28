-- Migration: Ajouter question d'onboarding pour la ville et localisation GPS
-- Date: 2025-10-25
-- Description: Ajoute une question d'onboarding pour capturer la ville et les coordonnées GPS de l'utilisateur

-- Ajouter le type 'city_location' à l'enum si il n'existe pas déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'onboarding_questions_type_enum'
    AND e.enumlabel = 'city_location'
  ) THEN
    ALTER TYPE onboarding_questions_type_enum ADD VALUE 'city_location';
  END IF;
END $$;

-- Insérer la question de localisation dans la table onboarding_questions
INSERT INTO onboarding_questions (
  "key",
  "type",
  "question",
  "placeholder",
  "required",
  "order",
  "isActive"
) VALUES (
  'city_location',
  'city_location',
  'Où habitez-vous ?',
  NULL,
  true,
  3,
  true
)
ON CONFLICT ("key") DO NOTHING;

-- Commentaire pour documentation
COMMENT ON COLUMN users."locationLatitude" IS 'Latitude GPS de la position de l''utilisateur (WGS84)';
COMMENT ON COLUMN users."locationLongitude" IS 'Longitude GPS de la position de l''utilisateur (WGS84)';
COMMENT ON COLUMN users."city" IS 'Nom de la ville de résidence de l''utilisateur';
