-- Fix for payload_locked_documents_rels missing comments_id column
-- This ensures the Comments collection can be tracked in locked documents

-- Add comments_id column if it doesn't exist
ALTER TABLE payload_locked_documents_rels
  ADD COLUMN IF NOT EXISTS comments_id integer;

-- Create index for the column
CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_comments_id_idx
  ON payload_locked_documents_rels(comments_id);

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'payload_locked_documents_rels_comments_fk'
  ) THEN
    ALTER TABLE payload_locked_documents_rels
      ADD CONSTRAINT payload_locked_documents_rels_comments_fk
      FOREIGN KEY (comments_id) REFERENCES comments(id) ON DELETE CASCADE;
  END IF;
END $$;

SELECT 'Comments locked documents fix applied successfully' as result;
