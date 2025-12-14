import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as communityRedirectHandler } from '@/app/api/redirect/community/[id]/route'
import { GET as postRedirectHandler } from '@/app/api/redirect/post/[communityId]/[postId]/route'

// Mock the communityService
vi.mock('@/lib/services/CommunityService', () => ({
  communityService: {
    getCommunityById: vi.fn(),
    getPostById: vi.fn(),
    getCommunitySlug: vi.fn()
  }
}))

describe('Redirect API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Community Redirect API', () => {
    it('should redirect community ID to slug URL', async () => {
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
      
      const request = new NextRequest('http://localhost:3000/api/redirect/community/123e4567-e89b-12d3-a456-426614174000')
      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' })
      
      const response = await communityRedirectHandler(request, { params })
      
      expect(response.status).toBe(301)
      expect(response.headers.get('location')).toBe('http://localhost:3000/community/c/test-community')
    })

    it('should return 404 for non-existent community', async () => {
      const { communityService } = await import('@/lib/services/CommunityService')
      
      vi.mocked(communityService.getCommunityById).mockResolvedValue(null)
      
      // Use a valid UUID format that doesn't exist
      const request = new NextRequest('http://localhost:3000/api/redirect/community/123e4567-e89b-12d3-a456-426614174999')
      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174999' })
      
      const response = await communityRedirectHandler(request, { params })
      
      expect(response.status).toBe(404)
    })

    it('should return 400 for invalid UUID format', async () => {
      const request = new NextRequest('http://localhost:3000/api/redirect/community/invalid-id')
      const params = Promise.resolve({ id: 'invalid-id' })
      
      const response = await communityRedirectHandler(request, { params })
      
      expect(response.status).toBe(400)
    })
  })

  describe('Post Redirect API', () => {
    it('should redirect post ID to slug URL', async () => {
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
      
      const request = new NextRequest('http://localhost:3000/api/redirect/post/123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f12-345678901234')
      const params = Promise.resolve({ 
        communityId: '123e4567-e89b-12d3-a456-426614174000',
        postId: '987fcdeb-51a2-43d1-9f12-345678901234'
      })
      
      const response = await postRedirectHandler(request, { params })
      
      expect(response.status).toBe(301)
      expect(response.headers.get('location')).toBe('http://localhost:3000/community/c/test-community/post/p/test-post')
    })

    it('should return 404 for non-existent community in post redirect', async () => {
      const { communityService } = await import('@/lib/services/CommunityService')
      
      vi.mocked(communityService.getCommunityById).mockResolvedValue(null)
      
      // Use valid UUID formats that don't exist
      const request = new NextRequest('http://localhost:3000/api/redirect/post/123e4567-e89b-12d3-a456-426614174999/987fcdeb-51a2-43d1-9f12-345678901234')
      const params = Promise.resolve({ 
        communityId: '123e4567-e89b-12d3-a456-426614174999',
        postId: '987fcdeb-51a2-43d1-9f12-345678901234'
      })
      
      const response = await postRedirectHandler(request, { params })
      
      expect(response.status).toBe(404)
    })

    it('should return 400 for mismatched community and post', async () => {
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
      
      vi.mocked(communityService.getPostById).mockResolvedValue({
        id: '987fcdeb-51a2-43d1-9f12-345678901234',
        community_id: 'different-community-id', // Different community ID
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
      
      const request = new NextRequest('http://localhost:3000/api/redirect/post/123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f12-345678901234')
      const params = Promise.resolve({ 
        communityId: '123e4567-e89b-12d3-a456-426614174000',
        postId: '987fcdeb-51a2-43d1-9f12-345678901234'
      })
      
      const response = await postRedirectHandler(request, { params })
      
      expect(response.status).toBe(400)
    })
  })
})