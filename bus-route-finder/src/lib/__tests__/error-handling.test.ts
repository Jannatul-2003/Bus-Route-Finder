import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OSRMStrategy } from '../strategies/OSRMStrategy'
import { HaversineStrategy } from '../strategies/HaversineStrategy'
import { DistanceCalculator } from '../strategies/DistanceCalculator'

describe('Error Handling - Requirements 8.3, 8.4', () => {
  describe('Coordinate Validation', () => {
    it('should reject invalid latitude in OSRMStrategy', async () => {
      const strategy = new OSRMStrategy()
      
      await expect(
        strategy.calculateDistances(
          [{ lat: 91, lng: 90 }], // Invalid latitude > 90
          [{ lat: 23.8, lng: 90.4 }]
        )
      ).rejects.toThrow('Invalid latitude: 91')
    })

    it('should reject invalid longitude in OSRMStrategy', async () => {
      const strategy = new OSRMStrategy()
      
      await expect(
        strategy.calculateDistances(
          [{ lat: 23.8, lng: 181 }], // Invalid longitude > 180
          [{ lat: 23.8, lng: 90.4 }]
        )
      ).rejects.toThrow('Invalid longitude: 181')
    })

    it('should reject NaN coordinates in OSRMStrategy', async () => {
      const strategy = new OSRMStrategy()
      
      await expect(
        strategy.calculateDistances(
          [{ lat: NaN, lng: 90 }],
          [{ lat: 23.8, lng: 90.4 }]
        )
      ).rejects.toThrow('Invalid coordinates')
    })

    it('should reject invalid latitude in HaversineStrategy', async () => {
      const strategy = new HaversineStrategy()
      
      await expect(
        strategy.calculateDistances(
          [{ lat: -91, lng: 90 }], // Invalid latitude < -90
          [{ lat: 23.8, lng: 90.4 }]
        )
      ).rejects.toThrow('Invalid latitude: -91')
    })

    it('should reject invalid longitude in HaversineStrategy', async () => {
      const strategy = new HaversineStrategy()
      
      await expect(
        strategy.calculateDistances(
          [{ lat: 23.8, lng: -181 }], // Invalid longitude < -180
          [{ lat: 23.8, lng: 90.4 }]
        )
      ).rejects.toThrow('Invalid longitude: -181')
    })

    it('should accept valid coordinates', async () => {
      const strategy = new HaversineStrategy()
      
      const result = await strategy.calculateDistances(
        [{ lat: 23.8, lng: 90.4 }],
        [{ lat: 23.9, lng: 90.5 }]
      )
      
      expect(result).toBeDefined()
      expect(result[0][0].distance).toBeGreaterThan(0)
    })
  })

  describe('OSRM Timeout Handling', () => {
    it('should timeout after configured duration', async () => {
      // Create strategy with very short timeout
      const strategy = new OSRMStrategy('http://localhost:5000', 1)
      
      // Mock fetch to delay longer than timeout
      global.fetch = vi.fn(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      ) as any
      
      await expect(
        strategy.calculateDistances(
          [{ lat: 23.8, lng: 90.4 }],
          [{ lat: 23.9, lng: 90.5 }]
        )
      ).rejects.toThrow()
    }, 10000)
  })

  describe('Fallback to Haversine', () => {
    it('should fallback to Haversine when OSRM fails', async () => {
      const osrmStrategy = new OSRMStrategy('http://invalid-url:9999')
      const haversineStrategy = new HaversineStrategy()
      const calculator = new DistanceCalculator(osrmStrategy, haversineStrategy)
      
      const result = await calculator.calculateDistances(
        [{ lat: 23.8, lng: 90.4 }],
        [{ lat: 23.9, lng: 90.5 }],
        true // Enable fallback
      )
      
      expect(result).toBeDefined()
      expect(result[0][0].method).toBe('Haversine')
    })

    it('should throw error when fallback is disabled', async () => {
      const osrmStrategy = new OSRMStrategy('http://invalid-url:9999')
      const haversineStrategy = new HaversineStrategy()
      const calculator = new DistanceCalculator(osrmStrategy, haversineStrategy)
      
      await expect(
        calculator.calculateDistances(
          [{ lat: 23.8, lng: 90.4 }],
          [{ lat: 23.9, lng: 90.5 }],
          false // Disable fallback
        )
      ).rejects.toThrow('is not available and fallback is disabled')
    })
  })

  describe('Error Messages', () => {
    it('should provide clear error message for network errors', async () => {
      const strategy = new OSRMStrategy('http://invalid-url:9999')
      
      await expect(
        strategy.calculateDistances(
          [{ lat: 23.8, lng: 90.4 }],
          [{ lat: 23.9, lng: 90.5 }]
        )
      ).rejects.toThrow('OSRM calculation failed')
    })
  })
})
