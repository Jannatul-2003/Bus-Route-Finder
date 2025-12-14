-- Fix comment update and delete permissions
-- This migration adds missing UPDATE and DELETE permissions for post_comments

-- Grant UPDATE and DELETE permissions to authenticated users
GRANT UPDATE, DELETE ON post_comments TO authenticated;

-- Add RLS policy for updating comments (only author can update their own comments)
CREATE POLICY "Authors can update their own comments"
  ON post_comments FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Add RLS policy for deleting comments (only author can delete their own comments)
CREATE POLICY "Authors can delete their own comments"
  ON post_comments FOR DELETE
  USING (auth.uid() = author_id);

-- Add comment for documentation
COMMENT ON POLICY "Authors can update their own comments" ON post_comments IS 'Allow comment authors to edit their own comments';
COMMENT ON POLICY "Authors can delete their own comments" ON post_comments IS 'Allow comment authors to delete their own comments';