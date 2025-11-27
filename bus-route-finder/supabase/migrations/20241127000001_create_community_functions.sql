-- Community System Helper Functions
-- Migration: Create RPC functions for community operations
-- Created: 2024-11-27

-- Function: Get nearby communities using PostGIS
-- Returns communities within search radius with distance calculation
CREATE OR REPLACE FUNCTION get_nearby_communities(
  user_lat DECIMAL,
  user_lng DECIMAL,
  search_radius INTEGER
)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  description TEXT,
  center_latitude DECIMAL(10, 8),
  center_longitude DECIMAL(11, 8),
  radius_meters INTEGER,
  member_count INTEGER,
  post_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  distance DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.center_latitude,
    c.center_longitude,
    c.radius_meters,
    c.member_count,
    c.post_count,
    c.created_at,
    c.updated_at,
    ST_Distance(
      ST_MakePoint(user_lng, user_lat)::geography,
      ST_MakePoint(c.center_longitude, c.center_latitude)::geography
    ) as distance
  FROM communities c
  WHERE ST_DWithin(
    ST_MakePoint(user_lng, user_lat)::geography,
    ST_MakePoint(c.center_longitude, c.center_latitude)::geography,
    search_radius
  )
  ORDER BY distance ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Increment post view count atomically
CREATE OR REPLACE FUNCTION increment_post_view_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE community_posts
  SET view_count = view_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Function: Get posts near a location (for lost items)
CREATE OR REPLACE FUNCTION get_posts_near_location(
  search_lat DECIMAL,
  search_lng DECIMAL,
  search_radius INTEGER,
  post_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  community_id UUID,
  author_id UUID,
  post_type VARCHAR(50),
  title VARCHAR(500),
  content TEXT,
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
  distance DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.community_id,
    p.author_id,
    p.post_type,
    p.title,
    p.content,
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
    ST_Distance(
      ST_MakePoint(search_lng, search_lat)::geography,
      ST_MakePoint(p.location_longitude, p.location_latitude)::geography
    ) as distance
  FROM community_posts p
  WHERE 
    p.location_latitude IS NOT NULL 
    AND p.location_longitude IS NOT NULL
    AND ST_DWithin(
      ST_MakePoint(search_lng, search_lat)::geography,
      ST_MakePoint(p.location_longitude, p.location_latitude)::geography,
      search_radius
    )
    AND (post_types IS NULL OR p.post_type = ANY(post_types))
  ORDER BY distance ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_nearby_communities(DECIMAL, DECIMAL, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_post_view_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_posts_near_location(DECIMAL, DECIMAL, INTEGER, TEXT[]) TO authenticated;

-- Comments
COMMENT ON FUNCTION get_nearby_communities IS 'Find communities within a radius using PostGIS spatial queries';
COMMENT ON FUNCTION increment_post_view_count IS 'Atomically increment the view count for a post';
COMMENT ON FUNCTION get_posts_near_location IS 'Find posts (especially lost items) near a specific location';
