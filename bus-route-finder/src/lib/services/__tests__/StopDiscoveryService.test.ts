import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StopDiscoveryService } from '../StopDiscoveryService'
import type { DistanceCalculator } from '../../strategies/DistanceCalculator'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Stop, Coordinates } from '../../types/database'

describe('StopDiscoveryService', () => {
  let service: StopDiscoveryService
  let mockDistanceCalculator: DistanceCalculator
  let mockSupabaseClient: SupabaseClient

  const mockStops: Stop[] = [
    {
      id: '1',
      name: 'Stop A',
      latitude: 23.8103,
      longitude: 90.4125,
      accessible: true,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'Stop B',
      latitude: 23.8150,
      longitude: 90.4200,
      accessible: true,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '3',
      name: 'Stop C',
      latitude: 23.8200,
      longitude: 90.4300,
      accessible: false,
      created_at: '2024-01-01T00:00:00Z'
    }
  ]

  beforeEach(() => {
    // Mock DistanceCalculator
    mockDistanceCalculator = {
      calculateDistances: vi.fn(),
      setPrimaryStrategy: vi.fn(),
      setFallbackStrategy: vi.fn(),
      getPrimaryStrategy: vi.fn(),
      getFallbackStrategy: vi.fn()
    } as any

    // Mock SupabaseClient
    mockSupabaseClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          data: mockStops,
          error: null
        }))
      }))
    } as any

    service = new StopDiscoveryService(mockDistanceCalculator, mockSupabaseClient)
  })

  describe('fetchAllStops', () => {
    it('should fetch all stops from Supabase', async () => {
      const stops = await service.fetchAllStops()

      expect(stops).toEqual(mockStops)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('stops')
    })

    it('should throw error when Supabase query fails', async () => {
      // Clear cache to ensure test isolation
      const { cache } = await import('../../utils/cache')
      cache.clear()
      
      const errorMessage = 'Database connection failed'
      mockSupabaseClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            data: null,
            error: { message: errorMessage }
          }))
        }))
      } as any

      service = new StopDiscoveryService(mockDistanceCalculator, mockSupabaseClient)

      await expect(service.fetchAllStops()).rejects.toThrow(
        `Failed to fetch stops: ${errorMessage}`
      )
    })
  })

  describe('discoverStops', () => {
    const location: Coordinates = { lat: 23.8103, lng: 90.4125 }
    const thresholdMeters = 500

    it('should discover stops within threshold distance', async () => {
      // Mock distance results: 0.2km, 0.4km, 0.6km (200m, 400m, 600m)
      const mockDistanceResults = [[
        { distance: 0.2, method: 'OSRM' },
        { distance: 0.4, method: 'OSRM' },
        { distance: 0.6, method: 'OSRM' }
      ]]

      vi.mocked(mockDistanceCalculator.calculateDistances).mockResolvedValue(mockDistanceResults)

      const result = await service.discoverStops(location, thresholdMeters)

      // Should return only stops within 500m (0.2km and 0.4km)
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Stop A')
      expect(result[0].distance).toBe(200)
      expect(result[0].distanceMethod).toBe('OSRM')
      expect(result[1].name).toBe('Stop B')
      expect(result[1].distance).toBe(400)
    })

    it('should sort stops by distance in ascending order', async () => {
      // Mock distance results in non-sorted order
      const mockDistanceResults = [[
        { distance: 0.6, method: 'OSRM' },
        { distance: 0.2, method: 'OSRM' },
        { distance: 0.4, method: 'OSRM' }
      ]]

      vi.mocked(mockDistanceCalculator.calculateDistances).mockResolvedValue(mockDistanceResults)

      const result = await service.discoverStops(location, 700)

      // Should be sorted by distance
      expect(result[0].distance).toBe(200)
      expect(result[1].distance).toBe(400)
      expect(result[2].distance).toBe(600)
    })

    it('should convert distances from kilometers to meters', async () => {
      const mockDistanceResults = [[
        { distance: 0.25, method: 'OSRM' }, // 0.25 km = 250 meters
        { distance: 0.35, method: 'OSRM' },
        { distance: 0.45, method: 'OSRM' }
      ]]

      vi.mocked(mockDistanceCalculator.calculateDistances).mockResolvedValue(mockDistanceResults)

      const result = await service.discoverStops(location, 300)

      expect(result[0].distance).toBe(250)
    })

    it('should preserve distance calculation method (OSRM)', async () => {
      const mockDistanceResults = [[
        { distance: 0.3, method: 'OSRM' },
        { distance: 0.4, method: 'OSRM' },
        { distance: 0.5, method: 'OSRM' }
      ]]

      vi.mocked(mockDistanceCalculator.calculateDistances).mockResolvedValue(mockDistanceResults)

      const result = await service.discoverStops(location, 500)

      expect(result[0].distanceMethod).toBe('OSRM')
    })

    it('should preserve distance calculation method (Haversine)', async () => {
      const mockDistanceResults = [[
        { distance: 0.3, method: 'Haversine' },
        { distance: 0.4, method: 'Haversine' },
        { distance: 0.5, method: 'Haversine' }
      ]]

      vi.mocked(mockDistanceCalculator.calculateDistances).mockResolvedValue(mockDistanceResults)

      const result = await service.discoverStops(location, 500)

      expect(result[0].distanceMethod).toBe('Haversine')
    })

    it('should return empty array when no stops within threshold', async () => {
      const mockDistanceResults = [[
        { distance: 1.0, method: 'OSRM' },
        { distance: 1.5, method: 'OSRM' },
        { distance: 2.0, method: 'OSRM' }
      ]]

      vi.mocked(mockDistanceCalculator.calculateDistances).mockResolvedValue(mockDistanceResults)

      const result = await service.discoverStops(location, 500)

      expect(result).toHaveLength(0)
    })

    it('should include stops exactly at threshold distance', async () => {
      const mockDistanceResults = [[
        { distance: 0.5, method: 'OSRM' }, // exactly 500 meters
        { distance: 0.6, method: 'OSRM' },
        { distance: 0.7, method: 'OSRM' }
      ]]

      vi.mocked(mockDistanceCalculator.calculateDistances).mockResolvedValue(mockDistanceResults)

      const result = await service.discoverStops(location, 500)

      expect(result).toHaveLength(1)
      expect(result[0].distance).toBe(500)
    })

    it('should call DistanceCalculator with correct parameters', async () => {
      const mockDistanceResults = [[
        { distance: 0.2, method: 'OSRM' },
        { distance: 0.4, method: 'OSRM' },
        { distance: 0.6, method: 'OSRM' }
      ]]

      vi.mocked(mockDistanceCalculator.calculateDistances).mockResolvedValue(mockDistanceResults)

      await service.discoverStops(location, thresholdMeters)

      expect(mockDistanceCalculator.calculateDistances).toHaveBeenCalledWith(
        [location],
        [
          { lat: 23.8103, lng: 90.4125 },
          { lat: 23.8150, lng: 90.4200 },
          { lat: 23.8200, lng: 90.4300 }
        ]
      )
    })

    it('should preserve all stop properties in result', async () => {
      const mockDistanceResults = [[
        { distance: 0.2, method: 'OSRM' },
        { distance: 0.4, method: 'OSRM' },
        { distance: 0.6, method: 'OSRM' }
      ]]

      vi.mocked(mockDistanceCalculator.calculateDistances).mockResolvedValue(mockDistanceResults)

      const result = await service.discoverStops(location, 500)

      expect(result[0]).toMatchObject({
        id: '1',
        name: 'Stop A',
        latitude: 23.8103,
        longitude: 90.4125,
        accessible: true,
        created_at: '2024-01-01T00:00:00Z',
        distance: 200,
        distanceMethod: 'OSRM'
      })
    })
  })
})
