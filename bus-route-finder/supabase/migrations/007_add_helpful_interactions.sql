-- Add helpful interactions tracking
-- Migration: Create post_helpful_interactions table
-- Created: 2024-12-14

-- Post helpful interactions table: Track which users marked posts as helpful
CREATE TABLE IF NOT EXISTS post_helpful_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Constraints
  UNIQUE(post_id, user_id) -- Prevent duplicate helpful marks from same user
);

-- Create indexes for efficient queries
CREATE INDEX idx_post_helpful_interactions_post ON post_helpful_interactions(post_id);
CREATE INDEX idx_post_helpful_interactions_user ON post_helpful_interactions(user_id);
CREATE INDEX idx_post_helpful_interactions_created_at ON post_helpful_interactions(created_at DESC);

-- Function: Update post helpful count when interaction is added/removed
CREATE OR REPLACE FUNCTION update_post_helpful_count()
RETURNS TRIGGER AS $
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts 
    SET helpful_count = helpful_count + 1, updated_at = NOW()
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts 
    SET helpful_count = GREATEST(0, helpful_count - 1), updated_at = NOW()
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$ LANGUAGE plpgsql;

-- Trigger: Update post helpful count
CREATE TRIGGER trigger_update_post_helpful_count
AFTER INSERT OR DELETE ON post_helpful_interactions
FOR EACH ROW EXECUTE FUNCTION update_post_helpful_count();

-- Row Level Security (RLS) Policies

-- Enable RLS on the table
ALTER TABLE post_helpful_interactions ENABLE ROW LEVEL SECURITY;

-- Users can view helpful interactions for posts they can see
CREATE POLICY "Users can view helpful interactions for accessible posts"
  ON post_helpful_interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_posts
      JOIN community_members ON community_members.community_id = community_posts.community_id
      WHERE community_posts.id = post_helpful_interactions.post_id
      AND community_members.user_id = auth.uid()
    )
  );

-- Users can create helpful interactions for posts they can see
CREATE POLICY "Users can create helpful interactions for accessible posts"
  ON post_helpful_interactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM community_posts
      JOIN community_members ON community_members.community_id = community_posts.community_id
      WHERE community_posts.id = post_helpful_interactions.post_id
      AND community_members.user_id = auth.uid()
    )
  );

-- Users can delete their own helpful interactions
CREATE POLICY "Users can delete their own helpful interactions"
  ON post_helpful_interactions FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, DELETE ON post_helpful_interactions TO authenticated;

-- Comments
COMMENT ON TABLE post_helpful_interactions IS 'Tracks which users marked posts as helpful to prevent duplicates and enable toggling';