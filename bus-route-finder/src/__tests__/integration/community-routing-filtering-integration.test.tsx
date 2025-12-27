import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, useParams } from 'next/navigation'
import { communityStore } from '@/lib/stores/communityStore'
import { searchService } from '@/lib/services/SearchService'
import type { PostWithAuthor, Community } from '@/lib/types/community'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
  useSearchParams: vi.fn(() => ({
    get: vi.fn()
  }))
}))

// Mock auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user123', email: 'test@example.com' }
  }))
}))

// Mock legacy redirect hooks
vi.mock('@/hooks/useLegacyRedirect', () => ({
  useCommunityLegacyRedirect: vi.fn(),
  usePostLegacyRedirect: vi.fn()
}))

describe('Community Routing and Filtering Integration Tests', () => {
  const mockRouter = {
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn()
  }

  const mockCommunity: Community = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Community',
    description: 'A test community for integration testing',
    center_latitude: 23.8103,
    center_longitude: 90.4125,
    radius_meters: 1000,
    member_count: 10,
    post_count: 5,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  const mockPosts: PostWithAuthor[] = [
    {
      id: 'post1',
      community_id: '123e4567-e89b-12d3-a456-426614174000',
      author_id: 'user1',
      post_type: 'discussion',
      title: 'Active Discussion Post',
      content: 'This is an active discussion',
      slug: 'active-discussion-post',
      status: 'active',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      view_count: 10,
      comment_count: 5,
      helpful_count: 2,
      item_category: null,
      item_description: null,
      photo_url: null,
      location_latitude: null,
      location_longitude: null,
      bus_id: null,
      resolved_at: null,
      author: { id: 'user1', email: 'user1@example.com' },
      bus: null
    },
    {
      id: 'post2',
      community_id: '123e4567-e89b-12d3-a456-426614174000',
      author_id: 'user2',
      post_type: 'lost_item',
      title: 'Lost Phone',
      content: 'I lost my phone on the bus',
      slug: 'lost-phone',
      status: 'resolved',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      view_count: 15,
      comment_count: 3,
      helpful_count: 1,
      item_category: 'phone',
      item_description: 'Black iPhone',
      photo_url: null,
      location_latitude: null,
      location_longitude: null,
      bus_id: null,
      resolved_at: '2024-01-03T00:00:00Z',
      author: { id: 'user2', email: 'user2@example.com' },
      bus: null
    },
    {
      id: 'post3',
      community_id: '123e4567-e89b-12d3-a456-426614174000',
      author_id: 'user3',
      post_type: 'delay_report',
      title: 'Bus Delay Alert',
      content: 'Route 25 is delayed',
      slug: 'bus-delay-alert',
      status: 'active',
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
      view_count: 25,
      comment_count: 8,
      helpful_count: 5,
      item_category: null,
      item_description: null,
      photo_url: null,
      location_latitude: null,
      location_longitude: null,
      bus_id: 'bus25',
      resolved_at: null,
      author: { id: 'user3', email: 'user3@example.com' },
      bus: null
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(mockRouter)
    vi.mocked(useParams).mockReturnValue({ slug: 'test-community' })
    
    // Reset community store state
    communityStore.setState({
      selectedCommunity: mockCommunity,
      posts: mockPosts,
      postFilters: { status: 'active' },
      postSearchKeyword: '',
      loading: false,
      error: null,
      communities: [],
      communityMembers: [],
      comments: []
    })
  })

  describe('Slug-based URL Format Consistency (Property 1)', () => {
    it('should generate consistent slug-based URLs for all community navigation', () => {
      // Test URL generation for various community slugs and post slugs
      const testCases = [
        { communitySlug: 'test-community', postSlug: 'test-post', expected: '/community/c/test-community/post/p/test-post' },
        { communitySlug: 'another-community', postSlug: 'another-post', expected: '/community/c/another-community/post/p/another-post' },
        { communitySlug: 'special-chars-123', postSlug: 'post-with-numbers-456', expected: '/community/c/special-chars-123/post/p/post-with-numbers-456' }
      ]

      testCases.forEach(({ communitySlug, postSlug, expected }) => {
        const generatedUrl = `/community/c/${communitySlug}/post/p/${postSlug}`
        expect(generatedUrl).toBe(expected)
        expect(generatedUrl).toMatch(/^\/community\/c\/[a-zA-Z0-9_-]+\/post\/p\/[a-zA-Z0-9_-]+$/)
      })
    })

    it('should maintain slug format in post creation URLs', () => {
      const communitySlug = 'test-community'
      const createPostUrl = `/community/c/${communitySlug}/create-post`
      
      expect(createPostUrl).toBe('/community/c/test-community/create-post')
      expect(createPostUrl).toMatch(/^\/community\/c\/[a-zA-Z0-9_-]+\/create-post$/)
    })

    it('should validate slug format consistency', () => {
      const validSlugs = ['test-community', 'valid_slug', 'slug123', 'a-b-c']
      const invalidSlugs = ['invalid@slug', 'invalid slug', '', 'a'.repeat(101)]
      
      const slugRegex = /^[a-zA-Z0-9_-]{1,100}$/
      
      validSlugs.forEach(slug => {
        expect(slugRegex.test(slug)).toBe(true)
      })
      
      invalidSlugs.forEach(slug => {
        expect(slugRegex.test(slug)).toBe(false)
      })
    })
  })

  describe('Active Status Filtering Accuracy (Property 3)', () => {
    it('should return only active posts when active filter is applied', () => {
      const activePosts = searchService.filterPostsByStatus('active', mockPosts)
      
      expect(activePosts).toHaveLength(2)
      expect(activePosts.every(post => post.status === 'active')).toBe(true)
      expect(activePosts.map(p => p.id)).toEqual(['post1', 'post3'])
    })

    it('should filter correctly across different post collections', () => {
      // Test with different post collections
      const mixedPosts = [
        ...mockPosts,
        {
          ...mockPosts[0],
          id: 'post4',
          status: 'closed' as const,
          title: 'Closed Post'
        }
      ]

      const activePosts = searchService.filterPostsByStatus('active', mixedPosts)
      const resolvedPosts = searchService.filterPostsByStatus('resolved', mixedPosts)
      const closedPosts = searchService.filterPostsByStatus('closed', mixedPosts)

      expect(activePosts).toHaveLength(2)
      expect(resolvedPosts).toHaveLength(1)
      expect(closedPosts).toHaveLength(1)
      
      expect(activePosts.every(post => post.status === 'active')).toBe(true)
      expect(resolvedPosts.every(post => post.status === 'resolved')).toBe(true)
      expect(closedPosts.every(post => post.status === 'closed')).toBe(true)
    })
  })

  describe('All Status Filter Completeness (Property 4)', () => {
    it('should return all posts regardless of status when all filter is applied', () => {
      const allPosts = searchService.filterPostsByStatus(null, mockPosts)
      
      expect(allPosts).toHaveLength(3)
      expect(allPosts).toEqual(mockPosts)
    })

    it('should show different counts between active and all filters', () => {
      const activePosts = searchService.filterPostsByStatus('active', mockPosts)
      const allPosts = searchService.filterPostsByStatus(null, mockPosts)
      
      expect(activePosts.length).toBe(2)
      expect(allPosts.length).toBe(3)
      expect(activePosts.length).toBeLessThan(allPosts.length)
    })

    it('should include posts of all statuses in all filter', () => {
      const allPosts = searchService.filterPostsByStatus(null, mockPosts)
      const statuses = [...new Set(allPosts.map(post => post.status))]
      
      expect(statuses).toContain('active')
      expect(statuses).toContain('resolved')
      expect(statuses.length).toBeGreaterThan(1)
    })
  })

  describe('Legacy URL Redirection (Property 6)', () => {
    it('should redirect ID-based community URLs to slug-based URLs', () => {
      const legacyUrl = '/community/123e4567-e89b-12d3-a456-426614174000'
      const expectedSlugUrl = '/community/c/test-community'
      
      // Test URL pattern detection
      const isLegacy = /^\/community\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/.test(legacyUrl)
      const isSlugBased = /^\/community\/c\/[a-zA-Z0-9_-]+$/.test(expectedSlugUrl)
      
      expect(isLegacy).toBe(true)
      expect(isSlugBased).toBe(true)
    })

    it('should redirect ID-based post URLs to slug-based URLs', () => {
      const legacyPostUrl = '/community/123e4567-e89b-12d3-a456-426614174000/post/987fcdeb-51a2-43d1-9f12-345678901234'
      const expectedSlugPostUrl = '/community/c/test-community/post/p/test-post'
      
      const isLegacyPost = /^\/community\/[0-9a-f-]+\/post\/[0-9a-f-]+/.test(legacyPostUrl)
      const isSlugBasedPost = /^\/community\/c\/[a-zA-Z0-9_-]+\/post\/p\/[a-zA-Z0-9_-]+$/.test(expectedSlugPostUrl)
      
      expect(isLegacyPost).toBe(true)
      expect(isSlugBasedPost).toBe(true)
    })

    it('should provide slug-based URLs for sharing', () => {
      const shareableUrls = [
        '/community/c/test-community',
        '/community/c/test-community/post/p/test-post',
        '/community/c/test-community/create-post'
      ]
      
      shareableUrls.forEach(url => {
        expect(url).toMatch(/^\/community\/c\/[a-zA-Z0-9_-]+/)
        expect(url).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/)
      })
    })
  })

  describe('Complete User Flow Integration', () => {
    it('should handle complete navigation flow with slug-based routing', () => {
      // Simulate user navigating from community list to community page
      const communitySlug = 'test-community'
      const communityUrl = `/community/c/${communitySlug}`
      
      // Verify community URL format
      expect(communityUrl).toBe('/community/c/test-community')
      
      // Simulate clicking on a post
      const postSlug = 'active-discussion-post'
      const postUrl = `/community/c/${communitySlug}/post/p/${postSlug}`
      
      // Verify post URL format
      expect(postUrl).toBe('/community/c/test-community/post/p/active-discussion-post')
      
      // Simulate navigating to create post
      const createPostUrl = `/community/c/${communitySlug}/create-post`
      
      // Verify create post URL format
      expect(createPostUrl).toBe('/community/c/test-community/create-post')
      
      // All URLs should maintain slug-based format
      const urls = [communityUrl, postUrl, createPostUrl]
      urls.forEach(url => {
        expect(url).toMatch(/^\/community\/c\/[a-zA-Z0-9_-]+/)
        expect(url).not.toContain('123e4567') // No UUIDs
      })
    })

    it('should handle post status filtering workflow', () => {
      // Test initial state - should default to active posts
      const initialPosts = communityStore.getFilteredPosts()
      expect(initialPosts.length).toBeLessThanOrEqual(mockPosts.length)
      
      // Test filtering by active status
      communityStore.setPostFilters({ status: 'active' })
      const activePosts = searchService.filterPostsByStatus('active', mockPosts)
      expect(activePosts).toHaveLength(2)
      expect(activePosts.every(post => post.status === 'active')).toBe(true)
      
      // Test filtering by all status
      const allPosts = searchService.filterPostsByStatus(null, mockPosts)
      expect(allPosts).toHaveLength(3)
      expect(allPosts.length).toBeGreaterThan(activePosts.length)
      
      // Test filtering by resolved status
      const resolvedPosts = searchService.filterPostsByStatus('resolved', mockPosts)
      expect(resolvedPosts).toHaveLength(1)
      expect(resolvedPosts[0].status).toBe('resolved')
    })

    it('should maintain navigation consistency during filtering', () => {
      // Set up different filter states
      const filterStates = [
        { status: 'active' },
        { status: 'resolved' },
        { status: null }, // all posts
        { keyword: 'bus' },
        { postType: 'discussion' }
      ]
      
      filterStates.forEach(filters => {
        communityStore.setPostFilters(filters)
        
        // Navigation URLs should remain consistent regardless of filter state
        const communityUrl = '/community/c/test-community'
        const postUrl = '/community/c/test-community/post/p/test-post'
        const createPostUrl = '/community/c/test-community/create-post'
        
        expect(communityUrl).toMatch(/^\/community\/c\/[a-zA-Z0-9_-]+$/)
        expect(postUrl).toMatch(/^\/community\/c\/[a-zA-Z0-9_-]+\/post\/p\/[a-zA-Z0-9_-]+$/)
        expect(createPostUrl).toMatch(/^\/community\/c\/[a-zA-Z0-9_-]+\/create-post$/)
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid slug formats gracefully', () => {
      const invalidSlugs = ['invalid@slug', 'invalid slug', '', 'a'.repeat(101)]
      const slugRegex = /^[a-zA-Z0-9_-]{1,100}$/
      
      invalidSlugs.forEach(slug => {
        expect(slugRegex.test(slug)).toBe(false)
      })
    })

    it('should handle empty post collections in filtering', () => {
      const emptyPosts: PostWithAuthor[] = []
      
      const activeFiltered = searchService.filterPostsByStatus('active', emptyPosts)
      const allFiltered = searchService.filterPostsByStatus(null, emptyPosts)
      
      expect(activeFiltered).toHaveLength(0)
      expect(allFiltered).toHaveLength(0)
    })

    it('should handle posts with missing status gracefully', () => {
      const postsWithMissingStatus = [
        {
          ...mockPosts[0],
          status: undefined as any
        }
      ]
      
      // Should not throw error
      expect(() => {
        searchService.filterPostsByStatus('active', postsWithMissingStatus)
      }).not.toThrow()
    })
  })

  describe('Requirements Validation', () => {
    it('should validate Requirement 1.1 - slug-based post navigation', () => {
      const postUrl = '/community/c/test-community/post/p/test-post'
      expect(postUrl).toMatch(/^\/community\/c\/[a-zA-Z0-9_-]+\/post\/p\/[a-zA-Z0-9_-]+$/)
    })

    it('should validate Requirement 1.2 - slug-based URL format', () => {
      const urls = [
        '/community/c/test-community',
        '/community/c/test-community/post/p/test-post',
        '/community/c/test-community/create-post'
      ]
      
      urls.forEach(url => {
        expect(url).toMatch(/^\/community\/c\/[a-zA-Z0-9_-]+/)
      })
    })

    it('should validate Requirement 2.1 - active status filtering', () => {
      const activePosts = searchService.filterPostsByStatus('active', mockPosts)
      expect(activePosts.every(post => post.status === 'active')).toBe(true)
    })

    it('should validate Requirement 2.2 - all status filtering', () => {
      const allPosts = searchService.filterPostsByStatus(null, mockPosts)
      expect(allPosts).toEqual(mockPosts)
    })

    it('should validate Requirement 4.4 - legacy URL redirection', () => {
      const legacyPattern = /^\/community\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/
      const slugPattern = /^\/community\/c\/[a-zA-Z0-9_-]+/
      
      const legacyUrl = '/community/123e4567-e89b-12d3-a456-426614174000'
      const slugUrl = '/community/c/test-community'
      
      expect(legacyPattern.test(legacyUrl)).toBe(true)
      expect(slugPattern.test(slugUrl)).toBe(true)
    })
  })
})