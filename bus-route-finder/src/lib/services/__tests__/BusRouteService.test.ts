import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BusRouteService } from '../BusRouteService'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { DistanceCalculator } from '../../strategies/DistanceCalculator'

describe('BusRouteService', () => {
  let service: BusRouteService
  let mockSupabaseClient: any
  let mockDistanceCalculator: any

  beforeEach(() => {
    // Create mock Supabase client
    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    }

    // Create mock DistanceCalculator
    mockDistanceCalculator = {
      calculateDistances: vi.fn(),
    }

    service = new BusRouteService(
      mockSupabaseClient as unknown as SupabaseClient,
      mockDistanceCalculator as unknown as DistanceCalculator
    )
  })

  describe('findBusRoutes', () => {
    it('should return empty array when no routes found', async () => {
      mockSupabaseClient.eq.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      const result = await service.findBusRoutes('stop1', 'stop2')

      expect(result).toEqual([])
    })

    it('should throw error when database query fails', async () => {
      mockSupabaseClient.eq.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      })

      await expect(service.findBusRoutes('stop1', 'stop2')).rejects.toThrow(
        'Failed to fetch bus routes: Database error'
      )
    })

    it('should query for buses serving both stops', async () => {
      mockSupabaseClient.eq.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      await service.findBusRoutes('stop1', 'stop2')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('route_stops')
      expect(mockSupabaseClient.in).toHaveBeenCalledWith('stop_id', ['stop1', 'stop2'])
    })
  })

  describe('calculateJourneyLength', () => {
    it('should sum pre-calculated segment distances', async () => {
      const mockSegments = [
        { stop_order: 1, distance_to_next: 1.5, stop_id: 'stop1', stops: null },
        { stop_order: 2, distance_to_next: 2.3, stop_id: 'stop2', stops: null },
        { stop_order: 3, distance_to_next: 1.8, stop_id: 'stop3', stops: null },
      ]

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockSegments,
        error: null,
      })

      const result = await service.calculateJourneyLength('bus1', 1, 4, 'outbound')

      expect(result).toBe(5.6) // 1.5 + 2.3 + 1.8
    })

    it('should return 0 when no segments found', async () => {
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      const result = await service.calculateJourneyLength('bus1', 1, 2, 'outbound')

      expect(result).toBe(0)
    })

    it('should throw error when database query fails', async () => {
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      })

      await expect(
        service.calculateJourneyLength('bus1', 1, 2, 'outbound')
      ).rejects.toThrow('Failed to fetch route segments: Database error')
    })

    it('should use OSRM fallback for missing distance_to_next values', async () => {
      const mockSegments = [
        {
          stop_order: 1,
          distance_to_next: null,
          stop_id: 'stop1',
          stops: { latitude: 23.8, longitude: 90.4 },
        },
        {
          stop_order: 2,
          distance_to_next: 2.0,
          stop_id: 'stop2',
          stops: { latitude: 23.81, longitude: 90.41 },
        },
      ]

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockSegments,
        error: null,
      })

      mockDistanceCalculator.calculateDistances.mockResolvedValueOnce([
        [{ distance: 1.2, method: 'OSRM' }],
      ])

      const result = await service.calculateJourneyLength('bus1', 1, 3, 'outbound')

      expect(result).toBe(3.2) // 1.2 (calculated) + 2.0 (pre-calculated)
      expect(mockDistanceCalculator.calculateDistances).toHaveBeenCalledWith(
        [{ lat: 23.8, lng: 90.4 }],
        [{ lat: 23.81, lng: 90.41 }]
      )
    })
  })
})
