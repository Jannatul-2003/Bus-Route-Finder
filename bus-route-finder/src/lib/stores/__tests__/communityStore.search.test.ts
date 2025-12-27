import { describe, it, expect, beforeEach, vi } from 'vitest'
import { communityStore } from '../communityStore'
import type { CommunityWithDistance } from '../../types/community'

// Mock fetch globally
global.fetch = vi.fn()

describe('CommunityStore - Search Functionality', () => {
  const mockCommunities: CommunityWithDistance[] = [
    {
      id: '1',
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
      id: '2',
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

  beforeEach(() => {
    communityStore.reset()
    vi.clearAllMocks()
  })

  describe('Search State Management', () => {
    it('should initialize with default search state', () => {
      const state = communityStore.getState()
      
      expect(state.searchState.query).toBe('')
      expect(state.searchState.radius).toBe(5000)
      expect(state.searchState.isRadiusSet).toBe(false)
      expect(state.searchState.filteredCommunities).toEqual([])
      expect(state.searchState.isSearching).toBe(false)
      expect(state.searchState.searchError).toBeNull()
    })

    it('should update search query and filter communities', async () => {
      // Mock fetch to return communities
      const fetchSpy = vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockCommunities
      } as Response)
      
      // Set radius and fetch communities
      communityStore.setSearchRadius(5000)
      await communityStore.fetchNearbyCommunities(23.8103, 90.4125, 5000)
      
      // Then set search query
      communityStore.setSearchQuery('bus')
      
      const state = communityStore.getState()
      expect(state.searchState.query).toBe('bus')
      expect(state.searchState.filteredCommunities).toHaveLength(1)
      expect(state.searchState.filteredCommunities[0].name).toBe('Bus Riders Community')
    })

    it('should update search radius and set radius status', () => {
      communityStore.setSearchRadius(3000)
      
      const state = communityStore.getState()
      expect(state.searchState.radius).toBe(3000)
      expect(state.searchState.isRadiusSet).toBe(true)
    })

    it('should not set radius status when radius is 0', () => {
      communityStore.setSearchRadius(0)
      
      const state = communityStore.getState()
      expect(state.searchState.radius).toBe(0)
      expect(state.searchState.isRadiusSet).toBe(false)
    })

    it('should clear search state', async () => {
      // Mock fetch to return communities
      const fetchSpy = vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockCommunities
      } as Response)
      
      // Set up some search state
      communityStore.setSearchRadius(5000)
      await communityStore.fetchNearbyCommunities(23.8103, 90.4125, 5000)
      communityStore.setSearchQuery('test')
      
      // Clear search
      communityStore.clearSearch()
      
      const state = communityStore.getState()
      expect(state.searchState.query).toBe('')
      expect(state.searchState.filteredCommunities).toEqual(mockCommunities)
      expect(state.searchState.searchError).toBeNull()
      expect(state.searchState.hasSearchBeenPerformed).toBe(false)
    })

    it('should track search performed state correctly', async () => {
      // Mock fetch to return communities
      const fetchSpy = vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockCommunities
      } as Response)
      
      // Initially should be false
      let state = communityStore.getState()
      expect(state.searchState.hasSearchBeenPerformed).toBe(false)
      
      // After radius search, should be true
      communityStore.setSearchRadius(5000)
      await communityStore.fetchNearbyCommunities(23.8103, 90.4125, 5000)
      
      state = communityStore.getState()
      expect(state.searchState.hasSearchBeenPerformed).toBe(true)
      
      // Clear search should reset to false
      communityStore.clearSearch()
      
      state = communityStore.getState()
      expect(state.searchState.hasSearchBeenPerformed).toBe(false)
    })

    it('should set hasSearchBeenPerformed when name search is performed', async () => {
      // Initially should be false
      let state = communityStore.getState()
      expect(state.searchState.hasSearchBeenPerformed).toBe(false)
      
      // Setting query should not set hasSearchBeenPerformed
      communityStore.setSearchQuery('bus')
      
      state = communityStore.getState()
      expect(state.searchState.hasSearchBeenPerformed).toBe(false)
      
      // Only after performing actual search should it be true
      await communityStore.performNameSearch()
      
      state = communityStore.getState()
      expect(state.searchState.hasSearchBeenPerformed).toBe(true)
      
      // Setting empty query should not change it back to false
      communityStore.setSearchQuery('')
      
      state = communityStore.getState()
      expect(state.searchState.hasSearchBeenPerformed).toBe(true)
      
      // Only clearSearch should reset it
      communityStore.clearSearch()
      
      state = communityStore.getState()
      expect(state.searchState.hasSearchBeenPerformed).toBe(false)
    })
  })

  describe('Filtered Communities', () => {
    beforeEach(async () => {
      // Mock fetch to return communities
      const fetchSpy = vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockCommunities
      } as Response)
      
      communityStore.setSearchRadius(5000)
      await communityStore.fetchNearbyCommunities(23.8103, 90.4125, 5000)
    })

    it('should return all communities when no search query', () => {
      const filtered = communityStore.getFilteredCommunities()
      expect(filtered).toEqual(mockCommunities)
    })

    it('should return filtered communities when search query exists', () => {
      communityStore.setSearchQuery('bus')
      
      const filtered = communityStore.getFilteredCommunities()
      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toBe('Bus Riders Community')
    })

    it('should return all communities when search query is only whitespace', () => {
      communityStore.setSearchQuery('   ')
      
      const filtered = communityStore.getFilteredCommunities()
      expect(filtered).toEqual(mockCommunities)
    })
  })

  describe('Conditional Data Fetching', () => {
    it('should not fetch when radius is not set', async () => {
      const fetchSpy = vi.mocked(fetch)
      
      await communityStore.fetchCommunitiesIfRadiusSet(23.8103, 90.4125)
      
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('should fetch when radius is set', async () => {
      const fetchSpy = vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockCommunities
      } as Response)
      
      communityStore.setSearchRadius(5000)
      await communityStore.fetchCommunitiesIfRadiusSet(23.8103, 90.4125)
      
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/communities?latitude=23.8103&longitude=90.4125&radius=5000'
      )
    })
  })
})