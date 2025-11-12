-- Add sequenceId column for cursor-based synchronization to alter_messages
-- This enables efficient incremental message sync for Alter Chat

ALTER TABLE alter_messages
ADD COLUMN "sequenceId" BIGSERIAL;

-- Create index for sync queries (WHERE sequenceId > X)
CREATE INDEX idx_alter_messages_sequence_id ON alter_messages("sequenceId");

-- Backfill existing messages with sequential IDs based on createdAt
WITH ranked_messages AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt", id) as seq
  FROM alter_messages
)
UPDATE alter_messages
SET "sequenceId" = ranked_messages.seq
FROM ranked_messages
WHERE alter_messages.id = ranked_messages.id;

-- Make sequenceId NOT NULL after backfill
ALTER TABLE alter_messages
ALTER COLUMN "sequenceId" SET NOT NULL;

-- Add unique constraint to ensure no duplicate sequence IDs
ALTER TABLE alter_messages
ADD CONSTRAINT uq_alter_messages_sequence_id UNIQUE ("sequenceId");
