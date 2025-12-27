import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

// Mock environment variables
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: vi.fn()
}))

// Import after mocking
const { CommunityService } = await import('../CommunityService')

describe('CommunityService - Author Data Retrieval', () => {
  let mockSupabaseClient: any
  let communityService: CommunityService

  beforeEach(() => {
    mockSupabaseClient = {
      rpc: vi.fn(),
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      }))
    }
    communityService = new CommunityService(mockSupabaseClient as SupabaseClient)
  })

  describe('getPostsByCommunity with author data', () => {
    it('should call get_posts_with_authors RPC function', async () => {
      const mockPosts = [
        {
          id: '1',
          community_id: 'comm-1',
          author_id: 'user-1',
          title: 'Test Post',
          content: 'Test content',
          author_email: 'test@example.com',
          bus_id: null
        }
      ]

      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockPosts,
        error: null
      })

      const result = await communityService.getPostsByCommunity('comm-1')

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_posts_with_authors', {
        p_community_id: 'comm-1',
        p_post_type: null,
        p_status: null,
        p_limit: null,
        p_offset: 0
      })

      expect(result).toHaveLength(1)
      expect(result[0].author.email).toBe('test@example.com')
      expect(result[0].author.id).toBe('user-1')
    })

    it('should handle missing author email with fallback', async () => {
      const mockPosts = [
        {
          id: '1',
          community_id: 'comm-1',
          author_id: 'user-1',
          title: 'Test Post',
          content: 'Test content',
          author_email: 'User 12345678', // Fallback format
          bus_id: null
        }
      ]

      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockPosts,
        error: null
      })

      const result = await communityService.getPostsByCommunity('comm-1')

      expect(result[0].author.email).toBe('User 12345678')
    })

    it('should handle RPC function errors', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC function not found' }
      })

      await expect(communityService.getPostsByCommunity('comm-1')).rejects.toThrow(
        'Failed to fetch community posts: RPC function not found'
      )
    })
  })

  describe('getCommentsByPost with author data', () => {
    it('should call get_comments_with_authors RPC function', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          post_id: 'post-1',
          author_id: 'user-1',
          content: 'Test comment',
          author_email: 'commenter@example.com',
          is_resolution: false,
          contact_info: null,
          helpful_count: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockComments,
        error: null
      })

      const result = await communityService.getCommentsByPost('post-1')

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_comments_with_authors', {
        p_post_id: 'post-1'
      })

      expect(result).toHaveLength(1)
      expect(result[0].author.email).toBe('commenter@example.com')
      expect(result[0].author.id).toBe('user-1')
    })
  })

  describe('getPostById with author data', () => {
    it('should call get_post_with_author RPC function', async () => {
      const mockPost = [
        {
          id: 'post-1',
          community_id: 'comm-1',
          author_id: 'user-1',
          title: 'Test Post',
          content: 'Test content',
          author_email: 'author@example.com',
          bus_id: null
        }
      ]

      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockPost,
        error: null
      })

      const result = await communityService.getPostById('post-1')

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_post_with_author', {
        p_post_id: 'post-1'
      })

      expect(result).not.toBeNull()
      expect(result!.author.email).toBe('author@example.com')
      expect(result!.author.id).toBe('user-1')
    })

    it('should return null when post not found', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await communityService.getPostById('non-existent')

      expect(result).toBeNull()
    })
  })
})