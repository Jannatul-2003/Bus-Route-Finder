-- Add slug support to community posts
-- Migration: Add post slug field and generation functions
-- Created: 2024-12-14

-- Add slug column to community_posts table
ALTER TABLE community_posts 
ADD COLUMN slug VARCHAR(255);

-- Create index for efficient slug lookups
CREATE INDEX idx_community_posts_slug ON community_posts(slug);

-- Create unique constraint for slug within community
CREATE UNIQUE INDEX idx_community_posts_unique_slug 
ON community_posts(community_id, slug) 
WHERE slug IS NOT NULL;

-- Function to generate URL-safe slug from title
CREATE OR REPLACE FUNCTION generate_post_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(title, '[^a-zA-Z0-9\s\-]', '', 'g'), -- Remove special chars
        '\s+', '-', 'g'  -- Replace spaces with hyphens
      ),
      '-+', '-', 'g'  -- Replace multiple hyphens with single
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to ensure unique slug within community
CREATE OR REPLACE FUNCTION ensure_unique_post_slug(
  base_slug TEXT,
  community_id UUID,
  post_id UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  final_slug TEXT;
  counter INTEGER := 0;
  slug_exists BOOLEAN;
BEGIN
  final_slug := base_slug;
  
  LOOP
    -- Check if slug exists in the same community (excluding current post if updating)
    SELECT EXISTS(
      SELECT 1 FROM community_posts 
      WHERE community_posts.community_id = ensure_unique_post_slug.community_id 
      AND slug = final_slug
      AND (post_id IS NULL OR id != post_id)
    ) INTO slug_exists;
    
    -- If slug doesn't exist, we can use it
    IF NOT slug_exists THEN
      EXIT;
    END IF;
    
    -- Increment counter and try again
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically generate and set slug on insert/update
CREATE OR REPLACE FUNCTION set_post_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
BEGIN
  -- Only generate slug if it's not already set or if title changed
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.title != NEW.title) THEN
    -- Generate base slug from title
    base_slug := generate_post_slug(NEW.title);
    
    -- Ensure uniqueness within community
    final_slug := ensure_unique_post_slug(
      base_slug, 
      NEW.community_id, 
      CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END
    );
    
    NEW.slug := final_slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set slug on insert and update
CREATE TRIGGER trigger_set_post_slug
  BEFORE INSERT OR UPDATE ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION set_post_slug();

-- Backfill existing posts with slugs
UPDATE community_posts 
SET slug = ensure_unique_post_slug(
  generate_post_slug(title), 
  community_id, 
  id
)
WHERE slug IS NULL;

-- Add comment
COMMENT ON COLUMN community_posts.slug IS 'URL-safe identifier generated from post title, unique within community';