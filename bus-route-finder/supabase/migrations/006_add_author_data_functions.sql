-- Add functions to retrieve posts and comments with author data
-- Migration: Add author data retrieval functions
-- Created: 2024-12-14

-- Function: Get posts with author information
CREATE OR REPLACE FUNCTION get_posts_with_authors(
  p_community_id UUID,
  p_post_type VARCHAR(50) DEFAULT NULL,
  p_status VARCHAR(50) DEFAULT NULL,
  p_limit INTEGER DEFAULT NULL,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  community_id UUID,
  author_id UUID,
  post_type VARCHAR(50),
  title VARCHAR(500),
  content TEXT,
  slug VARCHAR(255),
  item_category VARCHAR(100),
  item_description TEXT,
  photo_url TEXT,
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  bus_id UUID,
  status VARCHAR(50),
  resolved_at TIMESTAMPTZ,
  view_count INTEGER,
  comment_count INTEGER,
  helpful_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  author_email TEXT
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.community_id,
    p.author_id,
    p.post_type,
    p.title,
    p.content,
    p.slug,
    p.item_category,
    p.item_description,
    p.photo_url,
    p.location_latitude,
    p.location_longitude,
    p.bus_id,
    p.status,
    p.resolved_at,
    p.view_count,
    p.comment_count,
    p.helpful_count,
    p.created_at,
    p.updated_at,
    COALESCE(up.email, 'User ' || SUBSTRING(p.author_id::text, 1, 8)) as author_email
  FROM community_posts p
  LEFT JOIN public.user_profiles up ON up.id = p.author_id
  WHERE 
    p.community_id = p_community_id
    AND (p_post_type IS NULL OR p.post_type = p_post_type)
    AND (p_status IS NULL OR p.status = p_status)
  ORDER BY p.created_at DESC
  LIMIT COALESCE(p_limit, 50)
  OFFSET p_offset;
END;
$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get single post with author information
CREATE OR REPLACE FUNCTION get_post_with_author(p_post_id UUID)
RETURNS TABLE (
  id UUID,
  community_id UUID,
  author_id UUID,
  post_type VARCHAR(50),
  title VARCHAR(500),
  content TEXT,
  slug VARCHAR(255),
  item_category VARCHAR(100),
  item_description TEXT,
  photo_url TEXT,
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  bus_id UUID,
  status VARCHAR(50),
  resolved_at TIMESTAMPTZ,
  view_count INTEGER,
  comment_count INTEGER,
  helpful_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  author_email TEXT
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.community_id,
    p.author_id,
    p.post_type,
    p.title,
    p.content,
    p.slug,
    p.item_category,
    p.item_description,
    p.photo_url,
    p.location_latitude,
    p.location_longitude,
    p.bus_id,
    p.status,
    p.resolved_at,
    p.view_count,
    p.comment_count,
    p.helpful_count,
    p.created_at,
    p.updated_at,
    COALESCE(up.email, 'User ' || SUBSTRING(p.author_id::text, 1, 8)) as author_email
  FROM community_posts p
  LEFT JOIN public.user_profiles up ON up.id = p.author_id
  WHERE p.id = p_post_id;
END;
$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get post by slug with author information
CREATE OR REPLACE FUNCTION get_post_by_slug_with_author(
  p_community_id UUID,
  p_slug VARCHAR(255)
)
RETURNS TABLE (
  id UUID,
  community_id UUID,
  author_id UUID,
  post_type VARCHAR(50),
  title VARCHAR(500),
  content TEXT,
  slug VARCHAR(255),
  item_category VARCHAR(100),
  item_description TEXT,
  photo_url TEXT,
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  bus_id UUID,
  status VARCHAR(50),
  resolved_at TIMESTAMPTZ,
  view_count INTEGER,
  comment_count INTEGER,
  helpful_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  author_email TEXT
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.community_id,
    p.author_id,
    p.post_type,
    p.title,
    p.content,
    p.slug,
    p.item_category,
    p.item_description,
    p.photo_url,
    p.location_latitude,
    p.location_longitude,
    p.bus_id,
    p.status,
    p.resolved_at,
    p.view_count,
    p.comment_count,
    p.helpful_count,
    p.created_at,
    p.updated_at,
    COALESCE(up.email, 'User ' || SUBSTRING(p.author_id::text, 1, 8)) as author_email
  FROM community_posts p
  LEFT JOIN public.user_profiles up ON up.id = p.author_id
  WHERE p.community_id = p_community_id AND p.slug = p_slug;
END;
$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get comments with author information
CREATE OR REPLACE FUNCTION get_comments_with_authors(p_post_id UUID)
RETURNS TABLE (
  id UUID,
  post_id UUID,
  author_id UUID,
  content TEXT,
  is_resolution BOOLEAN,
  contact_info TEXT,
  helpful_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  author_email TEXT
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.post_id,
    c.author_id,
    c.content,
    c.is_resolution,
    c.contact_info,
    c.helpful_count,
    c.created_at,
    c.updated_at,
    COALESCE(up.email, 'User ' || SUBSTRING(c.author_id::text, 1, 8)) as author_email
  FROM post_comments c
  LEFT JOIN public.user_profiles up ON up.id = c.author_id
  WHERE c.post_id = p_post_id
  ORDER BY c.created_at ASC;
END;
$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get posts by user with author information
CREATE OR REPLACE FUNCTION get_posts_by_user_with_author(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  community_id UUID,
  author_id UUID,
  post_type VARCHAR(50),
  title VARCHAR(500),
  content TEXT,
  slug VARCHAR(255),
  item_category VARCHAR(100),
  item_description TEXT,
  photo_url TEXT,
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  bus_id UUID,
  status VARCHAR(50),
  resolved_at TIMESTAMPTZ,
  view_count INTEGER,
  comment_count INTEGER,
  helpful_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  author_email TEXT
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.community_id,
    p.author_id,
    p.post_type,
    p.title,
    p.content,
    p.slug,
    p.item_category,
    p.item_description,
    p.photo_url,
    p.location_latitude,
    p.location_longitude,
    p.bus_id,
    p.status,
    p.resolved_at,
    p.view_count,
    p.comment_count,
    p.helpful_count,
    p.created_at,
    p.updated_at,
    COALESCE(up.email, 'User ' || SUBSTRING(p.author_id::text, 1, 8)) as author_email
  FROM community_posts p
  LEFT JOIN public.user_profiles up ON up.id = p.author_id
  WHERE p.author_id = p_user_id
  ORDER BY p.created_at DESC;
END;
$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get posts by bus with author information
CREATE OR REPLACE FUNCTION get_posts_by_bus_with_author(p_bus_id UUID)
RETURNS TABLE (
  id UUID,
  community_id UUID,
  author_id UUID,
  post_type VARCHAR(50),
  title VARCHAR(500),
  content TEXT,
  slug VARCHAR(255),
  item_category VARCHAR(100),
  item_description TEXT,
  photo_url TEXT,
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  bus_id UUID,
  status VARCHAR(50),
  resolved_at TIMESTAMPTZ,
  view_count INTEGER,
  comment_count INTEGER,
  helpful_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  author_email TEXT
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.community_id,
    p.author_id,
    p.post_type,
    p.title,
    p.content,
    p.slug,
    p.item_category,
    p.item_description,
    p.photo_url,
    p.location_latitude,
    p.location_longitude,
    p.bus_id,
    p.status,
    p.resolved_at,
    p.view_count,
    p.comment_count,
    p.helpful_count,
    p.created_at,
    p.updated_at,
    COALESCE(up.email, 'User ' || SUBSTRING(p.author_id::text, 1, 8)) as author_email
  FROM community_posts p
  LEFT JOIN public.user_profiles up ON up.id = p.author_id
  WHERE p.bus_id = p_bus_id
  ORDER BY p.created_at DESC;
END;
$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get community members with user information
CREATE OR REPLACE FUNCTION get_members_with_users(p_community_id UUID)
RETURNS TABLE (
  id UUID,
  community_id UUID,
  user_id UUID,
  role VARCHAR(50),
  joined_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  notification_preferences JSONB,
  user_email TEXT
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    cm.id,
    cm.community_id,
    cm.user_id,
    cm.role,
    cm.joined_at,
    cm.last_active_at,
    cm.notification_preferences,
    COALESCE(up.email, 'User ' || SUBSTRING(cm.user_id::text, 1, 8)) as user_email
  FROM community_members cm
  LEFT JOIN public.user_profiles up ON up.id = cm.user_id
  WHERE cm.community_id = p_community_id
  ORDER BY cm.joined_at DESC;
END;
$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_posts_with_authors(UUID, VARCHAR(50), VARCHAR(50), INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_post_with_author(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_post_by_slug_with_author(UUID, VARCHAR(255)) TO authenticated;
GRANT EXECUTE ON FUNCTION get_comments_with_authors(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_posts_by_user_with_author(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_posts_by_bus_with_author(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_members_with_users(UUID) TO authenticated;

-- Comments
COMMENT ON FUNCTION get_posts_with_authors IS 'Get community posts with author email information';
COMMENT ON FUNCTION get_post_with_author IS 'Get single post with author email information';
COMMENT ON FUNCTION get_post_by_slug_with_author IS 'Get post by slug with author email information';
COMMENT ON FUNCTION get_comments_with_authors IS 'Get post comments with author email information';
COMMENT ON FUNCTION get_posts_by_user_with_author IS 'Get user posts with author email information';
COMMENT ON FUNCTION get_posts_by_bus_with_author IS 'Get bus posts with author email information';
COMMENT ON FUNCTION get_members_with_users IS 'Get community members with user email information';