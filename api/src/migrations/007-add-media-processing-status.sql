-- Migration: Add processing status to message_media
-- Description: Adds processingStatus column to track NSFW analysis state
-- Date: 2025-01-04

-- Create enum type for processing status
DO $$ BEGIN
    CREATE TYPE media_processing_status AS ENUM ('processing', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add processingStatus column with default value 'completed' for existing records
ALTER TABLE message_media
ADD COLUMN IF NOT EXISTS "processingStatus" media_processing_status NOT NULL DEFAULT 'completed';

-- Update existing records to have 'completed' status
UPDATE message_media
SET "processingStatus" = 'completed'
WHERE "processingStatus" IS NULL;

-- Add index for faster queries on processing status
CREATE INDEX IF NOT EXISTS idx_message_media_processing_status
ON message_media("processingStatus");

-- Comment
COMMENT ON COLUMN message_media."processingStatus" IS 'Status of NSFW analysis: processing, completed, or failed';
