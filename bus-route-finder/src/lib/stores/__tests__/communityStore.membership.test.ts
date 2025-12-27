import { describe, it, expect, beforeEach, vi } from 'vitest'
import { communityStore } from '../communityStore'

// Mock fetch globally
global.fetch = vi.fn()

describe('CommunityStore - Membership Management', () => {
  beforeEach(() => {
    // Reset the store state
    communityStore.reset()
    vi.clearAllMocks()
  })

  describe('membership state management', () => {
    it('should initialize with empty membership state', () => {
      const state = communityStore.getState()
      expect(state.membershipState).toEqual({})
    })

    it('should cache membership status', async () => {
      const communityId = 'test-community-1'
      const userId = 'test-user-1'
      
      // Mock successful API response
      const mockMembers = [
        { user_id: userId, community_id: communityId }
      ]
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMembers
      } as Response)

      const isMember = await communityStore.getMembershipStatus(communityId, userId)
      
      expect(isMember).toBe(true)
      
      const state = communityStore.getState()
      expect(state.membershipState[communityId]).toEqual({
        isMember: true,
        loading: false,
        lastChecked: expect.any(Number)
      })
    })

    it('should return cached membership status when available', async () => {
      const communityId = 'test-community-1'
      const userId = 'test-user-1'
      
      // Set up initial cache
      const mockMembers = [{ user_id: userId, community_id: communityId }]
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMembers
      } as Response)

      // First call - should make API request
      await communityStore.getMembershipStatus(communityId, userId)
      expect(fetch).toHaveBeenCalledTimes(1)

      // Second call within cache window - should use cache
      const isMember = await communityStore.getMembershipStatus(communityId, userId)
      expect(isMember).toBe(true)
      expect(fetch).toHaveBeenCalledTimes(1) // No additional API call
    })

    it('should get cached membership status without API call', () => {
      const communityId = 'test-community-1'
      
      // Initially no cache
      const noCacheResult = communityStore.getCachedMembershipStatus(communityId)
      expect(noCacheResult).toBeNull()
      
      // Manually set cache state
      const state = communityStore.getState()
      state.membershipState[communityId] = {
        isMember: true,
        loading: false,
        lastChecked: Date.now()
      }
      
      const cachedResult = communityStore.getCachedMembershipStatus(communityId)
      expect(cachedResult).toEqual({
        isMember: true,
        loading: false
      })
    })
  })

  describe('join community with state management', () => {
    it('should update membership state when joining community', async () => {
      const communityId = 'test-community-1'
      
      // Mock successful join response
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'member-1', community_id: communityId })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: communityId, name: 'Test Community' })
        } as Response)

      await communityStore.joinCommunity(communityId)
      
      const state = communityStore.getState()
      expect(state.membershipState[communityId]).toEqual({
        isMember: true,
        loading: false,
        lastChecked: expect.any(Number)
      })
    })

    it('should handle join community errors gracefully', async () => {
      const communityId = 'test-community-1'
      
      // Set initial state - user is not a member
      const initialState = communityStore.getState()
      initialState.membershipState[communityId] = {
        isMember: false,
        loading: false,
        lastChecked: Date.now() - 60000 // Old timestamp to force refresh
      }
      
      // Mock failed join response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 403
      } as Response)

      await communityStore.joinCommunity(communityId)
      
      const state = communityStore.getState()
      expect(state.error).toBe('Failed to join community')
      expect(state.membershipState[communityId]).toEqual({
        isMember: false, // Should preserve original state
        loading: false,
        lastChecked: expect.any(Number)
      })
    })
  })

  describe('leave community with state management', () => {
    it('should update membership state when leaving community', async () => {
      const communityId = 'test-community-1'
      
      // Set initial member state
      const initialState = communityStore.getState()
      initialState.membershipState[communityId] = {
        isMember: true,
        loading: false,
        lastChecked: Date.now()
      }
      
      // Mock successful leave response
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: communityId, name: 'Test Community' })
        } as Response)

      await communityStore.leaveCommunity(communityId)
      
      const state = communityStore.getState()
      expect(state.membershipState[communityId]).toEqual({
        isMember: false,
        loading: false,
        lastChecked: expect.any(Number)
      })
    })
  })

  describe('membership validation for post creation', () => {
    it('should validate membership before post creation', async () => {
      const communityId = 'test-community-validation'
      const userId = 'test-user-validation'
      
      // Ensure no cached state for this community
      const state = communityStore.getState()
      delete state.membershipState[communityId]
      
      // Mock user is not a member
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [] // Empty members array
      } as Response)

      const validation = await communityStore.validateMembershipForPostCreation(communityId, userId)
      
      expect(validation.canCreate).toBe(false)
      expect(validation.reason).toBe('You must be a member of this community to create posts')
    })

    it('should allow post creation for community members', async () => {
      const communityId = 'test-community-member'
      const userId = 'test-user-member'
      
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

  describe('user communities with membership status', () => {
    it('should update membership state when fetching user communities', async () => {
      const userId = 'test-user-communities'
      const communities = [
        { id: 'user-community-1', name: 'User Community 1' },
        { id: 'user-community-2', name: 'User Community 2' }
      ]
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => communities
      } as Response)

      await communityStore.fetchUserCommunities(userId)
      
      const state = communityStore.getState()
      expect(state.userCommunities).toEqual(communities)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
      
      // Check that membership state is updated for all communities
      expect(state.membershipState['user-community-1']).toEqual({
        isMember: true,
        loading: false,
        lastChecked: expect.any(Number)
      })
      expect(state.membershipState['user-community-2']).toEqual({
        isMember: true,
        loading: false,
        lastChecked: expect.any(Number)
      })
    })
  })
})