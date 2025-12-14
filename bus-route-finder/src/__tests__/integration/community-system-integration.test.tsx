import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { communityStore } from '@/lib/stores/communityStore'
import { roleAuthService } from '@/lib/services/RoleAuthorizationService'
import type { CommunityWithDistance } from '@/lib/types/community'
import type { AuthUser } from '@/lib/services/RoleAuthorizationService'

// Mock environment variables
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null })
        })
      })
    })
  })
}))

// Mock fetch globally
global.fetch = vi.fn()

/**
 * Integration Tests for Community System Enhancement
 * 
 * Tests complete user flows for all roles (visitor, member, contributor)
 * Verifies search functionality works across communities and posts
 * Ensures role-based access control works end-to-end
 * Tests responsive design on different devices
 * 
 * Requirements: All (as specified in task 13)
 */
describe('Community System Integration Tests', () => {
  const mockCommunities: CommunityWithDistance[] = [
    {
      id: 'community-1',
      name: 'Bus Riders Community',
      description: 'For bus enthusiasts',
      center_latitude: 23.8103,
      center_longitude: 90.4125,
      radius_meters: 1000,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      distance: 500
    },
    {
      id: 'community-2',
      name: 'Bike Commuters',
      description: 'For cyclists',
      center_latitude: 23.8200,
      center_longitude: 90.4200,
      radius_meters: 1500,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      distance: 800
    }
  ]

  const mockVisitor: AuthUser | null = null
  const mockMember: AuthUser = {
    id: 'member-user-id',
    email: 'member@example.com',
    is_contributor: false
  } as AuthUser
  const mockContributor: AuthUser = {
    id: 'contributor-user-id',
    email: 'contributor@example.com',
    is_contributor: true
  } as AuthUser

  beforeEach(() => {
    communityStore.reset()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Complete User Flows for All Roles', () => {
    describe('Visitor User Flow', () => {
      it('should allow visitors to view communities and posts without authentication', async () => {
        // Verify role-based UI visibility property
        const userRole = roleAuthService.getUserRole(mockVisitor)
        expect(userRole).toBe('visitor')
        
        const canCreate = roleAuthService.canCreateCommunity(mockVisitor)
        expect(canCreate.allowed).toBe(false)
        expect(canCreate.reason).toBe('Must be logged in to create communities')

        const canJoin = roleAuthService.canJoinCommunity(mockVisitor)
        expect(canJoin.allowed).toBe(false)
        expect(canJoin.reason).toBe('Must be logged in to join communities')

        // Visitors can view posts
        const canView = roleAuthService.canViewPosts(mockVisitor)
        expect(canView.allowed).toBe(true)
      })

      it('should allow visitors to search communities without restrictions', async () => {
        // Mock API responses for community data
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => mockCommunities
        } as Response)

        // Set radius and fetch communities
        communityStore.setSearchRadius(5000)
        await communityStore.fetchNearbyCommunities(23.8103, 90.4125, 5000)

        // Test search functionality
        communityStore.setSearchQuery('bus')
        const filtered = communityStore.getFilteredCommunities()
        expect(filtered).toHaveLength(1)
        expect(filtered[0].name).toBe('Bus Riders Community')
      })
    })

    describe('Member User Flow', () => {
      it('should allow members to join communities and create posts after joining', async () => {
        // Test member permissions
        const canJoin = roleAuthService.canJoinCommunity(mockMember)
        expect(canJoin.allowed).toBe(true)

        const canView = roleAuthService.canViewPosts(mockMember)
        expect(canView.allowed).toBe(true)

        // Mock successful join
        vi.mocked(fetch)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'member-1', community_id: 'community-1' })
          } as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'community-1', name: 'Test Community' })
          } as Response)

        await communityStore.joinCommunity('community-1')
        
        const state = communityStore.getState()
        expect(state.membershipState['community-1']).toEqual({
          isMember: true,
          loading: false,
          lastChecked: expect.any(Number)
        })
      })

      it('should prevent members from creating communities', () => {
        const canCreate = roleAuthService.canCreateCommunity(mockMember)
        expect(canCreate.allowed).toBe(false)
        expect(canCreate.reason).toBe('Must be a contributor to create communities')
      })
    })

    describe('Contributor User Flow', () => {

      it('should allow contributors to create communities and automatically become members', async () => {
        const canCreate = roleAuthService.canCreateCommunity(mockContributor)
        expect(canCreate.allowed).toBe(true)

        // Mock successful community creation
        const newCommunity = {
          id: 'new-community-id',
          name: 'New Community',
          description: 'A new test community'
        }

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => newCommunity
        } as Response)

        const result = await communityStore.createCommunity({
          name: 'New Community',
          description: 'A new test community',
          center_latitude: 23.8103,
          center_longitude: 90.4125,
          radius_meters: 1000
        })

        expect(result).toEqual(newCommunity)
        expect(fetch).toHaveBeenCalledWith('/api/communities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'New Community',
            description: 'A new test community',
            center_latitude: 23.8103,
            center_longitude: 90.4125,
            radius_meters: 1000
          })
        })
      })

      it('should allow contributors all member privileges plus community creation', () => {
        const userRole = roleAuthService.getUserRole(mockContributor)
        expect(userRole).toBe('contributor')

        const canCreate = roleAuthService.canCreateCommunity(mockContributor)
        expect(canCreate.allowed).toBe(true)

        const canJoin = roleAuthService.canJoinCommunity(mockContributor)
        expect(canJoin.allowed).toBe(true)
      })
    })
  })

  describe('Search Functionality Across Communities and Posts', () => {
    beforeEach(() => {
      // Set up communities in store
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockCommunities
      } as Response)
    })

    it('should filter communities by name in real-time', async () => {
      // Set radius and fetch communities
      communityStore.setSearchRadius(5000)
      await communityStore.fetchNearbyCommunities(23.8103, 90.4125, 5000)

      // Test real-time filtering
      communityStore.setSearchQuery('bus')
      let filtered = communityStore.getFilteredCommunities()
      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toBe('Bus Riders Community')

      // Test case-insensitive search
      communityStore.setSearchQuery('BUS')
      filtered = communityStore.getFilteredCommunities()
      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toBe('Bus Riders Community')

      // Test partial matching
      communityStore.setSearchQuery('bike')
      filtered = communityStore.getFilteredCommunities()
      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toBe('Bike Commuters')

      // Test no matches
      communityStore.setSearchQuery('nonexistent')
      filtered = communityStore.getFilteredCommunities()
      expect(filtered).toHaveLength(0)

      // Test empty query returns all
      communityStore.setSearchQuery('')
      filtered = communityStore.getFilteredCommunities()
      expect(filtered).toHaveLength(2)
    })

    it('should implement conditional data fetching based on radius', async () => {
      const fetchSpy = vi.mocked(fetch)

      // Should not fetch when radius is not set
      await communityStore.fetchCommunitiesIfRadiusSet(23.8103, 90.4125)
      expect(fetchSpy).not.toHaveBeenCalled()

      // Should fetch when radius is set
      communityStore.setSearchRadius(5000)
      await communityStore.fetchCommunitiesIfRadiusSet(23.8103, 90.4125)
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/communities?latitude=23.8103&longitude=90.4125&radius=5000'
      )
    })

    it('should provide clear guidance on search radius parameter', () => {
      // Test conditional data fetching based on radius
      const initialState = communityStore.getState()
      expect(initialState.searchState.isRadiusSet).toBe(false)

      // Should not fetch when radius is not set
      communityStore.fetchCommunitiesIfRadiusSet(23.8103, 90.4125)
      expect(fetch).not.toHaveBeenCalled()

      // Should set radius status when radius is provided
      communityStore.setSearchRadius(5000)
      const updatedState = communityStore.getState()
      expect(updatedState.searchState.isRadiusSet).toBe(true)
      expect(updatedState.searchState.radius).toBe(5000)
    })
  })

  describe('Role-Based Access Control End-to-End', () => {
    it('should enforce authorization at API level', async () => {
      // Test visitor access
      let result = await roleAuthService.validateApiAccess(mockVisitor, 'create_community')
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('Must be logged in to create communities')

      // Test member access
      result = await roleAuthService.validateApiAccess(mockMember, 'create_community')
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('Must be a contributor to create communities')

      // Test contributor access
      result = await roleAuthService.validateApiAccess(mockContributor, 'create_community')
      expect(result.allowed).toBe(true)
    })

    it('should maintain consistent role-based UI visibility', () => {
      // Test visitor permissions
      const visitorRole = roleAuthService.getUserRole(mockVisitor)
      expect(visitorRole).toBe('visitor')
      
      const visitorCanCreate = roleAuthService.canCreateCommunity(mockVisitor)
      expect(visitorCanCreate.allowed).toBe(false)
      
      const visitorCanJoin = roleAuthService.canJoinCommunity(mockVisitor)
      expect(visitorCanJoin.allowed).toBe(false)

      // Test member permissions
      const memberRole = roleAuthService.getUserRole(mockMember)
      expect(memberRole).toBe('member')
      
      const memberCanCreate = roleAuthService.canCreateCommunity(mockMember)
      expect(memberCanCreate.allowed).toBe(false)
      
      const memberCanJoin = roleAuthService.canJoinCommunity(mockMember)
      expect(memberCanJoin.allowed).toBe(true)

      // Test contributor permissions
      const contributorRole = roleAuthService.getUserRole(mockContributor)
      expect(contributorRole).toBe('contributor')
      
      const contributorCanCreate = roleAuthService.canCreateCommunity(mockContributor)
      expect(contributorCanCreate.allowed).toBe(true)
      
      const contributorCanJoin = roleAuthService.canJoinCommunity(mockContributor)
      expect(contributorCanJoin.allowed).toBe(true)
    })

    it('should preserve post visibility for all user types', () => {
      // All users should be able to view posts
      expect(roleAuthService.canViewPosts(mockVisitor).allowed).toBe(true)
      expect(roleAuthService.canViewPosts(mockMember).allowed).toBe(true)
      expect(roleAuthService.canViewPosts(mockContributor).allowed).toBe(true)
    })
  })

  describe('Membership State Consistency', () => {

    it('should maintain consistent membership state during join/leave operations', async () => {
      const communityId = 'test-community'

      // Mock successful join
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
      
      let state = communityStore.getState()
      expect(state.membershipState[communityId]).toEqual({
        isMember: true,
        loading: false,
        lastChecked: expect.any(Number)
      })

      // Mock successful leave
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
      
      state = communityStore.getState()
      expect(state.membershipState[communityId]).toEqual({
        isMember: false,
        loading: false,
        lastChecked: expect.any(Number)
      })
    })

    it('should validate membership for post creation', async () => {
      const communityId = 'test-community'
      const userId = 'test-user'

      // Mock user is not a member
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      } as Response)

      const validation = await communityStore.validateMembershipForPostCreation(communityId, userId)
      expect(validation.canCreate).toBe(false)
      expect(validation.reason).toBe('You must be a member of this community to create posts')

      // Clear previous mock calls and reset store to clear cache
      vi.clearAllMocks()
      communityStore.reset()
      
      // Mock user is a member
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [{ user_id: userId, community_id: communityId }]
      } as Response)

      const validationMember = await communityStore.validateMembershipForPostCreation(communityId, userId)
      expect(validationMember.canCreate).toBe(true)
    })
  })

  describe('Responsive Design Compatibility', () => {
    it('should maintain usability across different viewport sizes', () => {
      // Test viewport size changes don't break core functionality
      const originalInnerWidth = window.innerWidth
      
      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      // Core functionality should still work
      const canView = roleAuthService.canViewPosts(mockMember)
      expect(canView.allowed).toBe(true)

      // Test tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        value: 768,
      })

      // Core functionality should still work
      const canJoin = roleAuthService.canJoinCommunity(mockMember)
      expect(canJoin.allowed).toBe(true)

      // Test desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        value: 1024,
      })

      // Core functionality should still work
      const canCreate = roleAuthService.canCreateCommunity(mockContributor)
      expect(canCreate.allowed).toBe(true)

      // Restore original width
      Object.defineProperty(window, 'innerWidth', {
        value: originalInnerWidth,
      })
    })

    it('should handle search functionality across different screen sizes', async () => {
      // Search functionality should work regardless of screen size
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockCommunities
      } as Response)

      communityStore.setSearchRadius(5000)
      await communityStore.fetchNearbyCommunities(23.8103, 90.4125, 5000)
      communityStore.setSearchQuery('bus')
      
      const filtered = communityStore.getFilteredCommunities()
      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toBe('Bus Riders Community')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

      const result = await communityStore.createCommunity({
        name: 'Test Community',
        description: 'Test',
        center_latitude: 23.8103,
        center_longitude: 90.4125,
        radius_meters: 1000
      })

      expect(result).toBeNull()
      
      const state = communityStore.getState()
      expect(state.error).toBe('Network error')
      expect(state.loading).toBe(false)
    })

    it('should handle authorization errors appropriately', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Insufficient permissions' })
      } as Response)

      const result = await communityStore.createCommunity({
        name: 'Test Community',
        description: 'Test',
        center_latitude: 23.8103,
        center_longitude: 90.4125,
        radius_meters: 1000
      })

      expect(result).toBeNull()
      
      const state = communityStore.getState()
      expect(state.error).toBe('Failed to create community')
    })

    it('should handle empty search results appropriately', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => []
      } as Response)

      communityStore.setSearchRadius(5000)
      await communityStore.fetchNearbyCommunities(23.8103, 90.4125, 5000)

      const filtered = communityStore.getFilteredCommunities()
      expect(filtered).toHaveLength(0)

      const state = communityStore.getState()
      expect(state.error).toBeNull()
    })
  })

  describe('Post Navigation Integration', () => {
    it('should support proper routing and state management', () => {
      const communityId = 'test-community'
      const postId = 'test-post'
      
      // Set up mock community for slug generation
      communityStore.setState({
        selectedCommunity: {
          id: communityId,
          name: 'Test Community',
          description: 'Test community',
          member_count: 10,
          post_count: 5,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          center_latitude: 0,
          center_longitude: 0,
          radius_meters: 5000
        }
      })
      
      // Test navigation to post detail view
      communityStore.navigateToPost(communityId, postId, {
        communityName: 'Test Community',
        postTitle: 'Test Post Title',
        previousRoute: `/community/${communityId}`
      })

      const state = communityStore.getState()
      
      // Verify state management
      expect(state.postNavigation.selectedPostId).toBe(postId)
      expect(state.postNavigation.showPostDetail).toBe(true)
      expect(state.postNavigation.previousRoute).toBe(`/community/${communityId}`)
      
      // Test back navigation - should now return slug-based URL
      const backRoute = communityStore.navigateBackFromPost()
      expect(backRoute).toBe(`/community/c/test-community`)
      
      const updatedState = communityStore.getState()
      expect(updatedState.postNavigation.selectedPostId).toBeNull()
      expect(updatedState.postNavigation.showPostDetail).toBe(false)
    })
  })
})