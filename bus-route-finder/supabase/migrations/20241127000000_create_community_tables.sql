-- Area-Based Community System Database Schema
-- Migration: Create community tables
-- Created: 2024-11-27

-- Enable PostGIS extension for geographic queries (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Communities table: Represents geographic areas where commuters can interact
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  -- Geographic boundary (polygon or circle center point)
  center_latitude DECIMAL(10, 8) NOT NULL,
  center_longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 1000, -- Default 1km radius
  -- Metadata
  member_count INTEGER NOT NULL DEFAULT 0,
  post_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Constraints
  CONSTRAINT valid_latitude CHECK (center_latitude >= -90 AND center_latitude <= 90),
  CONSTRAINT valid_longitude CHECK (center_longitude >= -180 AND center_longitude <= 180),
  CONSTRAINT valid_radius CHECK (radius_meters >= 100 AND radius_meters <= 10000)
);

-- Create spatial index for efficient geographic queries
CREATE INDEX idx_communities_location ON communities USING GIST (
  ST_MakePoint(center_longitude, center_latitude)::geography
);

-- Community members table: Tracks user membership in communities
CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- member, moderator, admin
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notification_preferences JSONB NOT NULL DEFAULT '{"new_posts": true, "lost_items": true, "delays": true, "emergencies": true}'::jsonb,
  -- Constraints
  UNIQUE(community_id, user_id),
  CONSTRAINT valid_role CHECK (role IN ('member', 'moderator', 'admin'))
);

-- Create indexes for efficient queries
CREATE INDEX idx_community_members_community ON community_members(community_id);
CREATE INDEX idx_community_members_user ON community_members(user_id);
CREATE INDEX idx_community_members_joined_at ON community_members(joined_at DESC);

-- Community posts table: Discussions, announcements, and lost items
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_type VARCHAR(50) NOT NULL, -- discussion, lost_item, found_item, delay_report, emergency
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  -- Lost item specific fields
  item_category VARCHAR(100), -- phone, wallet, bag, keys, documents, other
  item_description TEXT,
  photo_url TEXT,
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  bus_id UUID REFERENCES buses(id) ON DELETE SET NULL,
  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, resolved, closed
  resolved_at TIMESTAMPTZ,
  -- Engagement metrics
  view_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Constraints
  CONSTRAINT valid_post_type CHECK (post_type IN ('discussion', 'lost_item', 'found_item', 'delay_report', 'emergency')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'resolved', 'closed')),
  CONSTRAINT valid_title_length CHECK (char_length(title) >= 5 AND char_length(title) <= 500),
  CONSTRAINT valid_content_length CHECK (char_length(content) >= 10 AND char_length(content) <= 10000),
  CONSTRAINT lost_item_has_category CHECK (
    post_type NOT IN ('lost_item', 'found_item') OR item_category IS NOT NULL
  )
);

-- Create indexes for efficient queries
CREATE INDEX idx_community_posts_community ON community_posts(community_id);
CREATE INDEX idx_community_posts_author ON community_posts(author_id);
CREATE INDEX idx_community_posts_type ON community_posts(post_type);
CREATE INDEX idx_community_posts_status ON community_posts(status);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX idx_community_posts_bus ON community_posts(bus_id) WHERE bus_id IS NOT NULL;

-- Create spatial index for lost items
CREATE INDEX idx_community_posts_location ON community_posts USING GIST (
  ST_MakePoint(location_longitude, location_latitude)::geography
) WHERE location_latitude IS NOT NULL AND location_longitude IS NOT NULL;

-- Post comments table: Responses to community posts
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  -- For found item responses
  is_resolution BOOLEAN NOT NULL DEFAULT false,
  contact_info TEXT, -- Encrypted or hashed contact information
  -- Engagement
  helpful_count INTEGER NOT NULL DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Constraints
  CONSTRAINT valid_comment_length CHECK (char_length(content) >= 1 AND char_length(content) <= 2000)
);

-- Create indexes for efficient queries
CREATE INDEX idx_post_comments_post ON post_comments(post_id);
CREATE INDEX idx_post_comments_author ON post_comments(author_id);
CREATE INDEX idx_post_comments_created_at ON post_comments(created_at DESC);
CREATE INDEX idx_post_comments_resolution ON post_comments(is_resolution) WHERE is_resolution = true;

-- User notifications table: Real-time notifications for community activity
CREATE TABLE IF NOT EXISTS community_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- new_post, new_comment, found_item, delay_alert, emergency
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Constraints
  CONSTRAINT valid_notification_type CHECK (
    notification_type IN ('new_post', 'new_comment', 'found_item', 'delay_alert', 'emergency')
  )
);

-- Create indexes for efficient queries
CREATE INDEX idx_community_notifications_user ON community_notifications(user_id);
CREATE INDEX idx_community_notifications_read ON community_notifications(read);
CREATE INDEX idx_community_notifications_created_at ON community_notifications(created_at DESC);
CREATE INDEX idx_community_notifications_type ON community_notifications(notification_type);

-- User frequent routes table: Track user's common routes for targeted notifications
CREATE TABLE IF NOT EXISTS user_frequent_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  onboarding_stop_id UUID NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
  offboarding_stop_id UUID NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
  usage_count INTEGER NOT NULL DEFAULT 1,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Constraints
  UNIQUE(user_id, bus_id, onboarding_stop_id, offboarding_stop_id)
);

-- Create indexes for efficient queries
CREATE INDEX idx_user_frequent_routes_user ON user_frequent_routes(user_id);
CREATE INDEX idx_user_frequent_routes_bus ON user_frequent_routes(bus_id);
CREATE INDEX idx_user_frequent_routes_usage ON user_frequent_routes(usage_count DESC);

-- Function: Update community member count
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities 
    SET member_count = member_count + 1, updated_at = NOW()
    WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities 
    SET member_count = GREATEST(0, member_count - 1), updated_at = NOW()
    WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update community member count
CREATE TRIGGER trigger_update_community_member_count
AFTER INSERT OR DELETE ON community_members
FOR EACH ROW EXECUTE FUNCTION update_community_member_count();

-- Function: Update community post count
CREATE OR REPLACE FUNCTION update_community_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities 
    SET post_count = post_count + 1, updated_at = NOW()
    WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities 
    SET post_count = GREATEST(0, post_count - 1), updated_at = NOW()
    WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update community post count
CREATE TRIGGER trigger_update_community_post_count
AFTER INSERT OR DELETE ON community_posts
FOR EACH ROW EXECUTE FUNCTION update_community_post_count();

-- Function: Update post comment count
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts 
    SET comment_count = comment_count + 1, updated_at = NOW()
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts 
    SET comment_count = GREATEST(0, comment_count - 1), updated_at = NOW()
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update post comment count
CREATE TRIGGER trigger_update_post_comment_count
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers: Update updated_at on all relevant tables
CREATE TRIGGER trigger_communities_updated_at
BEFORE UPDATE ON communities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_community_posts_updated_at
BEFORE UPDATE ON community_posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_post_comments_updated_at
BEFORE UPDATE ON post_comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_frequent_routes ENABLE ROW LEVEL SECURITY;

-- Communities: Public read, authenticated users can create
CREATE POLICY "Communities are viewable by everyone"
  ON communities FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create communities"
  ON communities FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Community members: Users can view their memberships and join communities
CREATE POLICY "Users can view community memberships"
  ON community_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join communities"
  ON community_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities"
  ON community_members FOR DELETE
  USING (auth.uid() = user_id);

-- Community posts: Members can view and create posts
CREATE POLICY "Community posts are viewable by members"
  ON community_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_posts.community_id
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Community members can create posts"
  ON community_posts FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_posts.community_id
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can update their own posts"
  ON community_posts FOR UPDATE
  USING (auth.uid() = author_id);

-- Post comments: Members can view and create comments
CREATE POLICY "Comments are viewable by post viewers"
  ON post_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_posts
      JOIN community_members ON community_members.community_id = community_posts.community_id
      WHERE community_posts.id = post_comments.post_id
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Community members can create comments"
  ON post_comments FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM community_posts
      JOIN community_members ON community_members.community_id = community_posts.community_id
      WHERE community_posts.id = post_comments.post_id
      AND community_members.user_id = auth.uid()
    )
  );

-- Notifications: Users can only view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON community_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON community_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Frequent routes: Users can manage their own routes
CREATE POLICY "Users can view their own frequent routes"
  ON user_frequent_routes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own frequent routes"
  ON user_frequent_routes FOR ALL
  USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON communities TO authenticated;
GRANT SELECT, INSERT, DELETE ON community_members TO authenticated;
GRANT SELECT, INSERT, UPDATE ON community_posts TO authenticated;
GRANT SELECT, INSERT ON post_comments TO authenticated;
GRANT SELECT, UPDATE ON community_notifications TO authenticated;
GRANT ALL ON user_frequent_routes TO authenticated;

-- Comments
COMMENT ON TABLE communities IS 'Geographic areas where commuters can interact and share information';
COMMENT ON TABLE community_members IS 'User membership in communities with notification preferences';
COMMENT ON TABLE community_posts IS 'Community discussions, lost items, delays, and emergency alerts';
COMMENT ON TABLE post_comments IS 'Responses and solutions to community posts';
COMMENT ON TABLE community_notifications IS 'Real-time notifications for community activity';
COMMENT ON TABLE user_frequent_routes IS 'User frequent routes for targeted notifications';
