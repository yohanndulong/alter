-- Add sequenceId column for cursor-based synchronization
-- This enables efficient incremental message sync without missing events

ALTER TABLE messages
ADD COLUMN "sequenceId" BIGSERIAL;

-- Create index for sync queries (WHERE sequenceId > X)
CREATE INDEX idx_messages_sequence_id ON messages("sequenceId");

-- Backfill existing messages with sequential IDs based on createdAt
WITH ranked_messages AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt", id) as seq
  FROM messages
)
UPDATE messages
SET "sequenceId" = ranked_messages.seq
FROM ranked_messages
WHERE messages.id = ranked_messages.id;

-- Make sequenceId NOT NULL after backfill
ALTER TABLE messages
ALTER COLUMN "sequenceId" SET NOT NULL;

-- Add unique constraint to ensure no duplicate sequence IDs
ALTER TABLE messages
ADD CONSTRAINT uq_messages_sequence_id UNIQUE ("sequenceId");
