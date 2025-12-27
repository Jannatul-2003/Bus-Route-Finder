import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SearchService } from '../SearchService'
import type { CommunityWithDistance } from '../../types/community'

describe('SearchService', () => {
  let searchService: SearchService
  let mockCommunities: CommunityWithDistance[]

  beforeEach(() => {
    searchService = new SearchService()
    mockCommunities = [
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
      },
      {
        id: '3',
        name: 'Business District',
        description: 'For office workers',
        center_latitude: 23.8300,
        center_longitude: 90.4300,
        radius_meters: 2000,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        distance: 1200
      }
    ]
  })

  describe('searchCommunitiesByName', () => {
    it('should filter communities by name prefix (case-insensitive)', () => {
      const result = searchService.searchCommunitiesByName('bus', mockCommunities)
      
      expect(result).toHaveLength(2) // "Bus Riders Community" and "Business District"
      expect(result.map(c => c.name)).toContain('Bus Riders Community')
      expect(result.map(c => c.name)).toContain('Business District')
    })

    it('should filter communities by name prefix with different case', () => {
      const result = searchService.searchCommunitiesByName('BUS', mockCommunities)
      
      expect(result).toHaveLength(2) // "Bus Riders Community" and "Business District"
      expect(result.map(c => c.name)).toContain('Bus Riders Community')
      expect(result.map(c => c.name)).toContain('Business District')
    })

    it('should filter communities by partial name match', () => {
      const result = searchService.searchCommunitiesByName('b', mockCommunities)
      
      expect(result).toHaveLength(3) // All three start with 'b'
      expect(result.map(c => c.name)).toContain('Bus Riders Community')
      expect(result.map(c => c.name)).toContain('Bike Commuters')
      expect(result.map(c => c.name)).toContain('Business District')
    })

    it('should return all communities when query is empty', () => {
      const result = searchService.searchCommunitiesByName('', mockCommunities)
      
      expect(result).toHaveLength(3)
      expect(result).toEqual(mockCommunities)
    })

    it('should return empty array when no matches found', () => {
      const result = searchService.searchCommunitiesByName('xyz', mockCommunities)
      
      expect(result).toHaveLength(0)
    })

    it('should handle whitespace in query', () => {
      const result = searchService.searchCommunitiesByName('  bus  ', mockCommunities)
      
      expect(result).toHaveLength(2) // "Bus Riders Community" and "Business District"
      expect(result.map(c => c.name)).toContain('Bus Riders Community')
      expect(result.map(c => c.name)).toContain('Business District')
    })
  })

  describe('debounceSearch', () => {
    it('should create a debounced function', () => {
      const mockCallback = vi.fn()
      const debouncedFn = searchService.debounceSearch(mockCallback, 100)
      
      expect(typeof debouncedFn).toBe('function')
    })

    it('should delay function execution', async () => {
      const mockCallback = vi.fn()
      const debouncedFn = searchService.debounceSearch(mockCallback, 100)
      
      debouncedFn('test')
      expect(mockCallback).not.toHaveBeenCalled()
      
      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 150))
      expect(mockCallback).toHaveBeenCalledWith('test')
    })
  })

  describe('filterByRadius', () => {
    const userLocation = { latitude: 23.8103, longitude: 90.4125 }

    it('should filter communities within radius', () => {
      const mockCommunitiesWithoutDistance = mockCommunities.map(({ distance, ...community }) => community)
      const result = searchService.filterByRadius(mockCommunitiesWithoutDistance, userLocation, 1000)
      
      expect(result.length).toBeGreaterThan(0)
      result.forEach(community => {
        expect(community.distance).toBeLessThanOrEqual(1000)
      })
    })

    it('should sort communities by distance', () => {
      const mockCommunitiesWithoutDistance = mockCommunities.map(({ distance, ...community }) => community)
      const result = searchService.filterByRadius(mockCommunitiesWithoutDistance, userLocation, 5000)
      
      for (let i = 1; i < result.length; i++) {
        expect(result[i].distance).toBeGreaterThanOrEqual(result[i - 1].distance)
      }
    })

    it('should include distance property in results', () => {
      const mockCommunitiesWithoutDistance = mockCommunities.map(({ distance, ...community }) => community)
      const result = searchService.filterByRadius(mockCommunitiesWithoutDistance, userLocation, 5000)
      
      result.forEach(community => {
        expect(community).toHaveProperty('distance')
        expect(typeof community.distance).toBe('number')
      })
    })
  })
})