import { communityService } from '@/lib/services/CommunityService'

/**
 * Utility functions for handling legacy URL redirection from ID-based to slug-based URLs
 */

/**
 * Resolve a community ID to its slug-based URL
 */
export async function resolveCommunityIdToSlugUrl(communityId: string): Promise<string | null> {
  try {
    const community = await communityService.getCommunityById(communityId)
    if (!community) {
      return null
    }
    
    const slug = communityService.getCommunitySlug(community)
    return `/community/c/${slug}`
  } catch (error) {
    console.error('Error resolving community ID to slug URL:', error)
    return null
  }
}

/**
 * Resolve a post ID within a community to its slug-based URL
 */
export async function resolvePostIdToSlugUrl(
  communityId: string, 
  postId: string
): Promise<string | null> {
  try {
    const [community, post] = await Promise.all([
      communityService.getCommunityById(communityId),
      communityService.getPostById(postId)
    ])
    
    if (!community || !post) {
      return null
    }
    
    // Verify the post belongs to the community
    if (post.community_id !== communityId) {
      return null
    }
    
    const communitySlug = communityService.getCommunitySlug(community)
    const postSlug = post.slug
    
    if (!postSlug) {
      return null
    }
    
    return `/community/c/${communitySlug}/post/p/${postSlug}`
  } catch (error) {
    console.error('Error resolving post ID to slug URL:', error)
    return null
  }
}

/**
 * Check if a URL is a legacy ID-based community URL
 */
export function isLegacyCommunityUrl(url: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const communityIdMatch = url.match(/^\/community\/([a-f0-9-]{36})(?:\/.*)?$/)
  return communityIdMatch ? uuidRegex.test(communityIdMatch[1]) : false
}

/**
 * Check if a URL is a legacy ID-based post URL
 */
export function isLegacyPostUrl(url: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const postIdMatch = url.match(/^\/community\/([a-f0-9-]{36})\/post\/([a-f0-9-]{36})$/)
  return postIdMatch ? 
    uuidRegex.test(postIdMatch[1]) && uuidRegex.test(postIdMatch[2]) : 
    false
}

/**
 * Extract community ID from legacy URL
 */
export function extractCommunityIdFromLegacyUrl(url: string): string | null {
  const communityIdMatch = url.match(/^\/community\/([a-f0-9-]{36})(?:\/.*)?$/)
  return communityIdMatch ? communityIdMatch[1] : null
}

/**
 * Extract community and post IDs from legacy post URL
 */
export function extractPostIdsFromLegacyUrl(url: string): { communityId: string; postId: string } | null {
  const postIdMatch = url.match(/^\/community\/([a-f0-9-]{36})\/post\/([a-f0-9-]{36})$/)
  return postIdMatch ? {
    communityId: postIdMatch[1],
    postId: postIdMatch[2]
  } : null
}

/**
 * Client-side redirect handler for legacy URLs
 * This can be used in components to programmatically redirect legacy URLs
 */
export async function handleLegacyUrlRedirect(
  url: string,
  router: { push: (url: string) => void; replace: (url: string) => void }
): Promise<boolean> {
  if (isLegacyCommunityUrl(url)) {
    const communityId = extractCommunityIdFromLegacyUrl(url)
    if (communityId) {
      const slugUrl = await resolveCommunityIdToSlugUrl(communityId)
      if (slugUrl) {
        router.replace(slugUrl)
        return true
      }
    }
  } else if (isLegacyPostUrl(url)) {
    const postIds = extractPostIdsFromLegacyUrl(url)
    if (postIds) {
      const slugUrl = await resolvePostIdToSlugUrl(postIds.communityId, postIds.postId)
      if (slugUrl) {
        router.replace(slugUrl)
        return true
      }
    }
  }
  
  return false
}

/**
 * Generate a slug-based URL for sharing
 * This ensures that any programmatically generated URLs use the slug format
 */
export async function generateSlugBasedUrl(
  type: 'community' | 'post',
  communityId: string,
  postId?: string
): Promise<string | null> {
  if (type === 'community') {
    return await resolveCommunityIdToSlugUrl(communityId)
  } else if (type === 'post' && postId) {
    return await resolvePostIdToSlugUrl(communityId, postId)
  }
  
  return null
}

/**
 * Generate shareable URL for a community (always slug-based)
 * This function ensures backward compatibility while providing slug-based URLs for sharing
 */
export async function generateShareableCommunityUrl(
  communityIdOrSlug: string,
  baseUrl?: string
): Promise<string> {
  const base = baseUrl || window.location.origin
  
  // Check if it's already a slug (not a UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  
  if (uuidRegex.test(communityIdOrSlug)) {
    // It's an ID, resolve to slug
    const slugUrl = await resolveCommunityIdToSlugUrl(communityIdOrSlug)
    return slugUrl ? `${base}${slugUrl}` : `${base}/community`
  } else {
    // It's already a slug
    return `${base}/community/c/${communityIdOrSlug}`
  }
}

/**
 * Generate shareable URL for a post (always slug-based)
 * This function ensures backward compatibility while providing slug-based URLs for sharing
 */
export async function generateShareablePostUrl(
  communityIdOrSlug: string,
  postIdOrSlug: string,
  baseUrl?: string
): Promise<string> {
  const base = baseUrl || window.location.origin
  
  // Check if both are UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  
  if (uuidRegex.test(communityIdOrSlug) && uuidRegex.test(postIdOrSlug)) {
    // Both are IDs, resolve to slugs
    const slugUrl = await resolvePostIdToSlugUrl(communityIdOrSlug, postIdOrSlug)
    return slugUrl ? `${base}${slugUrl}` : `${base}/community`
  } else if (uuidRegex.test(communityIdOrSlug)) {
    // Community is ID, post is slug - resolve community ID
    const community = await communityService.getCommunityById(communityIdOrSlug)
    if (community) {
      const communitySlug = communityService.getCommunitySlug(community)
      return `${base}/community/c/${communitySlug}/post/p/${postIdOrSlug}`
    }
    return `${base}/community`
  } else {
    // Both are slugs or community is slug
    return `${base}/community/c/${communityIdOrSlug}/post/p/${postIdOrSlug}`
  }
}