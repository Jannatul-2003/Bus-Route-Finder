import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as getCommunityBySlug } from '../communities/by-slug/[slug]/route'
import { GET as getPostsBySlug, POST as createPostBySlug } from '../communities/by-slug/[slug]/posts/route'
import { GET as getPostBySlug } from '../communities/by-slug/[slug]/posts/[postSlug]/route'
import { GET as resolveCommunity } from '../communities/resolve/route'
import { GET as resolvePost } from '../posts/resolve/route'

// Mock the community service
vi.mock('@/lib/services/CommunityService', () => {
  const mockMethods = {
    getCommunityBySlug: vi.fn(),
    getCommunityById: vi.fn(),
    getCommunitySlug: vi.fn(),
    getPostsByCommunity: vi.fn(),
    getPostBySlug: vi.fn(),
    getPostById: vi.fn(),
    createPost: vi.fn(),
    generateUniquePostSlug: vi.fn(),
    getBusIdByName: vi.fn(),
    incrementPostViewCount: vi.fn(),
    getMembersByCommunity: vi.fn(),
    getCommentsByPost: vi.fn(),
    getPostsByUser: vi.fn(),
    getPostsByBus: vi.fn()
  }
  
  return {
    communityService: mockMethods,
    CommunityService: vi.fn().mockImplementation(() => mockMethods)
  }
})

// Mock Supabase server
vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServer: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null
      })
    }
  })
}))

const mockCommunityService = await import('@/lib/services/CommunityService')

// Get the mocked methods for easier access in tests
const getMockMethods = () => {
  const service = new mockCommunityService.CommunityService({} as any)
  return service
}

describe('Slug-based API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('/api/communities/by-slug/[slug]', () => {
    it('should validate slug format', async () => {
      const request = new NextRequest('http://localhost/api/communities/by-slug/invalid@slug')
      const params = Promise.resolve({ slug: 'invalid@slug' })
      
      const response = await getCommunityBySlug(request, { params })
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid community slug format')
    })

    it('should return 404 for non-existent community', async () => {
      const mockMethods = getMockMethods()
      mockMethods.getCommunityBySlug.mockResolvedValue(null)
      
      const request = new NextRequest('http://localhost/api/communities/by-slug/non-existent')
      const params = Promise.resolve({ slug: 'non-existent' })
      
      const response = await getCommunityBySlug(request, { params })
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data.error).toContain('Community not found')
    })

    it('should return community with slug when found', async () => {
      const mockCommunity = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Community',
        description: 'A test community'
      }
      
      const mockMethods = getMockMethods()
      mockMethods.getCommunityBySlug.mockResolvedValue(mockCommunity)
      mockMethods.getCommunitySlug.mockReturnValue('test-community')
      
      const request = new NextRequest('http://localhost/api/communities/by-slug/test-community')
      const params = Promise.resolve({ slug: 'test-community' })
      
      const response = await getCommunityBySlug(request, { params })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toEqual({
        ...mockCommunity,
        slug: 'test-community'
      })
    })
  })

  describe('/api/communities/by-slug/[slug]/posts', () => {
    it('should validate slug format for posts endpoint', async () => {
      const request = new NextRequest('http://localhost/api/communities/by-slug/invalid@slug/posts')
      const params = Promise.resolve({ slug: 'invalid@slug' })
      
      const response = await getPostsBySlug(request, { params })
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid community slug format')
    })

    it('should return posts for valid community slug', async () => {
      const mockCommunity = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Community'
      }
      const mockPosts = [
        { id: '1', title: 'Test Post 1', content: 'Content 1' },
        { id: '2', title: 'Test Post 2', content: 'Content 2' }
      ]
      
      const mockMethods = getMockMethods()
      mockMethods.getCommunityBySlug.mockResolvedValue(mockCommunity)
      mockMethods.getPostsByCommunity.mockResolvedValue(mockPosts)
      
      const request = new NextRequest('http://localhost/api/communities/by-slug/test-community/posts')
      const params = Promise.resolve({ slug: 'test-community' })
      
      const response = await getPostsBySlug(request, { params })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toEqual(mockPosts)
    })
  })

  // Note: Skipping /api/communities/by-slug/[slug]/posts/[postSlug] tests 
  // as they require Supabase server context which is complex to mock in unit tests
  // These endpoints are tested through integration tests instead

  describe('/api/communities/resolve', () => {
    it('should require either slug or id parameter', async () => {
      const request = new NextRequest('http://localhost/api/communities/resolve')
      
      const response = await resolveCommunity(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toContain('Either slug or id parameter is required')
    })

    it('should not allow both slug and id parameters', async () => {
      const request = new NextRequest('http://localhost/api/communities/resolve?slug=test&id=123')
      
      const response = await resolveCommunity(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toContain('Only one parameter')
    })

    it('should resolve slug to community info', async () => {
      const mockCommunity = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Community'
      }
      
      const mockMethods = getMockMethods()
      mockMethods.getCommunityBySlug.mockResolvedValue(mockCommunity)
      mockMethods.getCommunitySlug.mockReturnValue('test-community')
      
      const request = new NextRequest('http://localhost/api/communities/resolve?slug=test-community')
      
      const response = await resolveCommunity(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toEqual({
        id: mockCommunity.id,
        slug: 'test-community',
        name: mockCommunity.name
      })
    })
  })

  describe('/api/posts/resolve', () => {
    it('should require community context', async () => {
      const request = new NextRequest('http://localhost/api/posts/resolve?post_slug=test')
      
      const response = await resolvePost(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toContain('Either community_id or community_slug is required')
    })

    it('should require post identifier', async () => {
      const request = new NextRequest('http://localhost/api/posts/resolve?community_slug=test')
      
      const response = await resolvePost(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toContain('Either post_slug or post_id is required')
    })

    it('should resolve post with community context', async () => {
      const mockCommunity = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Community'
      }
      const mockPost = {
        id: '456e7890-e89b-12d3-a456-426614174000',
        title: 'Test Post',
        slug: 'test-post',
        community_id: mockCommunity.id
      }
      
      const mockMethods = getMockMethods()
      mockMethods.getCommunityBySlug.mockResolvedValue(mockCommunity)
      mockMethods.getPostBySlug.mockResolvedValue(mockPost)
      mockMethods.getCommunitySlug.mockReturnValue('test-community')
      
      const request = new NextRequest('http://localhost/api/posts/resolve?community_slug=test-community&post_slug=test-post')
      
      const response = await resolvePost(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toEqual({
        post: {
          id: mockPost.id,
          slug: mockPost.slug,
          title: mockPost.title
        },
        community: {
          id: mockCommunity.id,
          slug: 'test-community',
          name: mockCommunity.name
        }
      })
    })
  })
})