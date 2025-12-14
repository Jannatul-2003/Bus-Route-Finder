import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  isLegacyCommunityUrl,
  isLegacyPostUrl,
  extractCommunityIdFromLegacyUrl,
  extractPostIdsFromLegacyUrl,
  resolveCommunityIdToSlugUrl,
  resolvePostIdToSlugUrl
} from '@/lib/utils/legacyRedirect'

// Mock the communityService
vi.mock('@/lib/services/CommunityService', () => ({
  communityService: {
    getCommunityById: vi.fn(),
    getPostById: vi.fn(),
    getCommunitySlug: vi.fn()
  }
}))

describe('Legacy URL Redirection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('URL Detection', () => {
    it('should detect legacy community URLs', () => {
      const legacyUrl = '/community/123e4567-e89b-12d3-a456-426614174000'
      const slugUrl = '/community/c/test-community'
      
      expect(isLegacyCommunityUrl(legacyUrl)).toBe(true)
      expect(isLegacyCommunityUrl(slugUrl)).toBe(false)
    })

    it('should detect legacy post URLs', () => {
      const legacyUrl = '/community/123e4567-e89b-12d3-a456-426614174000/post/987fcdeb-51a2-43d1-9f12-345678901234'
      const slugUrl = '/community/c/test-community/post/p/test-post'
      
      expect(isLegacyPostUrl(legacyUrl)).toBe(true)
      expect(isLegacyPostUrl(slugUrl)).toBe(false)
    })

    it('should extract community ID from legacy URL', () => {
      const legacyUrl = '/community/123e4567-e89b-12d3-a456-426614174000/some-path'
      const communityId = extractCommunityIdFromLegacyUrl(legacyUrl)
      
      expect(communityId).toBe('123e4567-e89b-12d3-a456-426614174000')
    })

    it('should extract post IDs from legacy URL', () => {
      const legacyUrl = '/community/123e4567-e89b-12d3-a456-426614174000/post/987fcdeb-51a2-43d1-9f12-345678901234'
      const postIds = extractPostIdsFromLegacyUrl(legacyUrl)
      
      expect(postIds).toEqual({
        communityId: '123e4567-e89b-12d3-a456-426614174000',
        postId: '987fcdeb-51a2-43d1-9f12-345678901234'
      })
    })
  })

  describe('URL Resolution', () => {
    it('should resolve community ID to slug URL', async () => {
      const { communityService } = await import('@/lib/services/CommunityService')
      
      // Mock the service methods
      vi.mocked(communityService.getCommunityById).mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Community',
        description: 'A test community',
        center_latitude: 23.8103,
        center_longitude: 90.4125,
        radius_meters: 1000,
        member_count: 10,
        post_count: 5,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      })
      
      vi.mocked(communityService.getCommunitySlug).mockReturnValue('test-community')
      
      const slugUrl = await resolveCommunityIdToSlugUrl('123e4567-e89b-12d3-a456-426614174000')
      
      expect(slugUrl).toBe('/community/c/test-community')
      expect(communityService.getCommunityById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000')
    })

    it('should resolve post ID to slug URL', async () => {
      const { communityService } = await import('@/lib/services/CommunityService')
      
      // Mock the service methods
      vi.mocked(communityService.getCommunityById).mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Community',
        description: 'A test community',
        center_latitude: 23.8103,
        center_longitude: 90.4125,
        radius_meters: 1000,
        member_count: 10,
        post_count: 5,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      })
      
      vi.mocked(communityService.getPostById).mockResolvedValue({
        id: '987fcdeb-51a2-43d1-9f12-345678901234',
        community_id: '123e4567-e89b-12d3-a456-426614174000',
        author_id: 'user123',
        post_type: 'discussion',
        title: 'Test Post',
        content: 'This is a test post',
        slug: 'test-post',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        view_count: 0,
        comment_count: 0,
        helpful_count: 0,
        item_category: null,
        item_description: null,
        photo_url: null,
        location_latitude: null,
        location_longitude: null,
        bus_id: null,
        resolved_at: null,
        author: { id: 'user123', email: null },
        bus: null
      })
      
      vi.mocked(communityService.getCommunitySlug).mockReturnValue('test-community')
      
      const slugUrl = await resolvePostIdToSlugUrl(
        '123e4567-e89b-12d3-a456-426614174000',
        '987fcdeb-51a2-43d1-9f12-345678901234'
      )
      
      expect(slugUrl).toBe('/community/c/test-community/post/p/test-post')
    })

    it('should return null for non-existent community', async () => {
      const { communityService } = await import('@/lib/services/CommunityService')
      
      vi.mocked(communityService.getCommunityById).mockResolvedValue(null)
      
      const slugUrl = await resolveCommunityIdToSlugUrl('non-existent-id')
      
      expect(slugUrl).toBe(null)
    })

    it('should return null for non-existent post', async () => {
      const { communityService } = await import('@/lib/services/CommunityService')
      
      vi.mocked(communityService.getCommunityById).mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Community',
        description: 'A test community',
        center_latitude: 23.8103,
        center_longitude: 90.4125,
        radius_meters: 1000,
        member_count: 10,
        post_count: 5,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      })
      
      vi.mocked(communityService.getPostById).mockResolvedValue(null)
      
      const slugUrl = await resolvePostIdToSlugUrl(
        '123e4567-e89b-12d3-a456-426614174000',
        'non-existent-post-id'
      )
      
      expect(slugUrl).toBe(null)
    })
  })
})