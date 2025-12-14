-- Fix community posts visibility to allow all users to view posts
-- Requirements 4.4, 5.1, 5.5: Posts should be visible to all users regardless of membership

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Community posts are viewable by members" ON community_posts;

-- Create new policy that allows all users to view posts
CREATE POLICY "Community posts are viewable by everyone"
  ON community_posts FOR SELECT
  USING (true);

-- Keep the existing policies for creating and updating posts (members only)
-- These policies remain unchanged:
-- - "Community members can create posts" (INSERT)
-- - "Authors can update their own posts" (UPDATE)

-- Also update comments policy to allow viewing by anyone who can see the post
DROP POLICY IF EXISTS "Comments are viewable by post viewers" ON post_comments;

CREATE POLICY "Comments are viewable by everyone"
  ON post_comments FOR SELECT
  USING (true);

-- Keep the existing policy for creating comments (members only)
-- This policy remains unchanged:
-- - Community members can create comments (INSERT)