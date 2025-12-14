import { describe, it, expect, beforeEach, vi } from 'vitest'
import { communityStore } from '../communityStore'
import type { PostType } from '@/lib/types/community'

// Mock fetch globally
global.fetch = vi.fn()

describe('CommunityStore - Post Creation', () => {
  beforeEach(() => {
    // Reset store state
    communityStore.reset()
    // Clear all mocks
    vi.clearAllMocks()
  })

  describe('post creation validation', () => {
    it('should validate membership before creating post', async () => {
      const communityId = 'test-community'
      const userId = 'test-user'
      
      // Ensure no cached state for this community
      const state = communityStore.getState()
      delete state.membershipState[communityId]
      
      // Mock user is not a member (empty members array)
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      } as Response)

      const validation = await communityStore.validateMembershipForPostCreation(communityId, userId)
      
      expect(validation.canCreate).toBe(false)
      expect(validation.reason).toBe('You must be a member of this community to create posts')
    })

    it('should allow post creation for community members', async () => {
      const communityId = 'test-community'
      const userId = 'test-user'
      
      // Ensure no cached state for this community
      const state = communityStore.getState()
      delete state.membershipState[communityId]
      
      // Mock user is a member
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [{ user_id: userId, community_id: communityId }]
      } as Response)

      const validation = await communityStore.validateMembershipForPostCreation(communityId, userId)
      
      expect(validation.canCreate).toBe(true)
      expect(validation.reason).toBeUndefined()
    })
  })

  describe('post creation with proper validation', () => {
    it('should create post with valid data and membership', async () => {
      const communityId = 'test-community'
      const userId = 'test-user'
      const postData = {
        post_type: 'discussion' as PostType,
        title: 'Test Discussion Post',
        content: 'This is a test discussion post content that meets minimum length requirements.'
      }

      // Ensure no cached state for this community
      const state = communityStore.getState()
      delete state.membershipState[communityId]

      // Mock membership validation to return true
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ user_id: userId, community_id: communityId }]
        } as Response)
        // Mock post creation API call
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'new-post-id',
            community_id: communityId,
            author_id: userId,
            ...postData,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        } as Response)

      const result = await communityStore.createPost(communityId, postData, userId)
      
      expect(result).toBeTruthy()
      expect(result?.id).toBe('new-post-id')
      expect(result?.title).toBe(postData.title)
      expect(result?.content).toBe(postData.content)
      expect(result?.post_type).toBe(postData.post_type)
      
      // Verify API calls
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch).toHaveBeenNthCalledWith(2, `/api/communities/${communityId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...postData, author_id: userId })
      })
    })

    it('should handle post creation errors gracefully', async () => {
      const communityId = 'test-community'
      const userId = 'test-user'
      const postData = {
        post_type: 'discussion' as PostType,
        title: 'Test Post',
        content: 'Test content'
      }

      // Ensure no cached state for this community
      const state = communityStore.getState()
      delete state.membershipState[communityId]

      // Mock membership validation to return true
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ user_id: userId, community_id: communityId }]
        } as Response)
        // Mock post creation API call to fail
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Failed to create post' })
        } as Response)

      const result = await communityStore.createPost(communityId, postData, userId)
      
      expect(result).toBeNull()
      
      const finalState = communityStore.getState()
      expect(finalState.error).toBe('Failed to create post')
      expect(finalState.loading).toBe(false)
    })

    it('should reject post creation for non-members', async () => {
      const communityId = 'test-community'
      const userId = 'test-user'
      const postData = {
        post_type: 'discussion' as PostType,
        title: 'Test Post',
        content: 'Test content'
      }

      // Ensure no cached state for this community
      const state = communityStore.getState()
      delete state.membershipState[communityId]

      // Mock membership validation to return false (empty members array)
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      } as Response)

      const result = await communityStore.createPost(communityId, postData, userId)
      
      expect(result).toBeNull()
      
      const finalState = communityStore.getState()
      expect(finalState.error).toBe('You must be a member of this community to create posts')
      expect(finalState.loading).toBe(false)
    })
  })

  describe('post creation with item-specific data', () => {
    it('should create lost item post with additional fields', async () => {
      const communityId = 'test-community'
      const userId = 'test-user'
      const postData = {
        post_type: 'lost_item' as PostType,
        title: 'Lost Phone',
        content: 'I lost my phone on the bus this morning',
        item_category: 'phone',
        item_description: 'Black iPhone 13 with blue case'
      }

      // Ensure no cached state for this community
      const state = communityStore.getState()
      delete state.membershipState[communityId]

      // Mock membership validation and post creation
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ user_id: userId, community_id: communityId }]
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'lost-item-post-id',
            community_id: communityId,
            author_id: userId,
            ...postData,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        } as Response)

      const result = await communityStore.createPost(communityId, postData, userId)
      
      expect(result).toBeTruthy()
      expect(result?.post_type).toBe('lost_item')
      expect(result?.item_category).toBe('phone')
      expect(result?.item_description).toBe('Black iPhone 13 with blue case')
    })
  })
})