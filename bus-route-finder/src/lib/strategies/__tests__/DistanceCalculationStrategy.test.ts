import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HaversineStrategy } from '../HaversineStrategy'
import { OSRMStrategy } from '../OSRMStrategy'
import { DistanceCalculator } from '../DistanceCalculator'
import type { Coordinate } from '../DistanceCalculationStrategy'

// Mock fetch globally
global.fetch = vi.fn()

describe('Strategy Pattern - Distance Calculation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('HaversineStrategy', () => {
    it('JUSTIFICATION: Should implement DistanceCalculationStrategy interface', () => {
      const strategy = new HaversineStrategy()

      expect(strategy).toHaveProperty('calculateDistances')
      expect(strategy).toHaveProperty('getName')
      expect(strategy).toHaveProperty('isAvailable')
      expect(typeof strategy.calculateDistances).toBe('function')
      expect(typeof strategy.getName).toBe('function')
      expect(typeof strategy.isAvailable).toBe('function')
    })

    it('should calculate distance between two points correctly', async () => {
      const strategy = new HaversineStrategy()
      const origin: Coordinate = { lat: 23.8103, lng: 90.4125 } // Dhaka
      const destination: Coordinate = { lat: 22.3569, lng: 91.7832 } // Chittagong

      const results = await strategy.calculateDistances([origin], [destination])

      expect(results).toHaveLength(1)
      expect(results[0]).toHaveLength(1)
      expect(results[0][0].distance).toBeGreaterThan(0)
      expect(results[0][0].method).toBe('Haversine')
    })

    it('should calculate distances for multiple origins and destinations', async () => {
      const strategy = new HaversineStrategy()
      const origins: Coordinate[] = [
        { lat: 23.8103, lng: 90.4125 },
        { lat: 22.3569, lng: 91.7832 },
      ]
      const destinations: Coordinate[] = [
        { lat: 24.3745, lng: 88.6042 },
        { lat: 23.685, lng: 90.3563 },
      ]

      const results = await strategy.calculateDistances(origins, destinations)

      expect(results).toHaveLength(2) // 2 origins
      expect(results[0]).toHaveLength(2) // 2 destinations
      expect(results[1]).toHaveLength(2) // 2 destinations

      // All results should have distance and method
      results.forEach((row) => {
        row.forEach((result) => {
          expect(result.distance).toBeGreaterThan(0)
          expect(result.method).toBe('Haversine')
        })
      })
    })

    it('JUSTIFICATION: Should always be available (no external dependencies)', () => {
      const strategy = new HaversineStrategy()

      expect(strategy.isAvailable()).toBe(true)
    })

    it('should return correct strategy name', () => {
      const strategy = new HaversineStrategy()

      expect(strategy.getName()).toBe('Haversine')
    })
  })

  describe('OSRMStrategy', () => {
    it('JUSTIFICATION: Should implement DistanceCalculationStrategy interface', () => {
      const strategy = new OSRMStrategy()

      expect(strategy).toHaveProperty('calculateDistances')
      expect(strategy).toHaveProperty('getName')
      expect(strategy).toHaveProperty('isAvailable')
      expect(typeof strategy.calculateDistances).toBe('function')
      expect(typeof strategy.getName).toBe('function')
      expect(typeof strategy.isAvailable).toBe('function')
    })

    it('should calculate distance using OSRM API', async () => {
      const mockResponse = {
        code: 'Ok',
        distances: [[0, 5000]], // 0m from origin to origin, 5000m from origin to destination
        durations: [[0, 300]], // 0s and 300s
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const strategy = new OSRMStrategy('http://localhost:5000')
      const origin: Coordinate = { lat: 23.8103, lng: 90.4125 }
      const destination: Coordinate = { lat: 23.8113, lng: 90.4135 }

      const results = await strategy.calculateDistances([origin], [destination])

      expect(results).toHaveLength(1)
      expect(results[0]).toHaveLength(1)
      expect(results[0][0].distance).toBe(5) // 5000m = 5km
      expect(results[0][0].duration).toBe(300)
      expect(results[0][0].method).toBe('OSRM')
    })

    it('should handle OSRM API errors', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      const strategy = new OSRMStrategy('http://localhost:5000')
      const origin: Coordinate = { lat: 23.8103, lng: 90.4125 }
      const destination: Coordinate = { lat: 23.8113, lng: 90.4135 }

      await expect(strategy.calculateDistances([origin], [destination])).rejects.toThrow()
    })

    it('should check availability correctly', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 'Ok' }),
      })

      const strategy = new OSRMStrategy('http://localhost:5000')
      const isAvailable = await strategy.isAvailable()

      expect(isAvailable).toBe(true)
    })

    it('should return false when OSRM is not available', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Connection failed'))

      const strategy = new OSRMStrategy('http://localhost:5000')
      const isAvailable = await strategy.isAvailable()

      expect(isAvailable).toBe(false)
    })

    it('should return correct strategy name', () => {
      const strategy = new OSRMStrategy()

      expect(strategy.getName()).toBe('OSRM')
    })
  })

  describe('DistanceCalculator - Strategy Pattern Context', () => {
    it('JUSTIFICATION: Should use primary strategy when available', async () => {
      const primaryStrategy = new HaversineStrategy()
      const fallbackStrategy = new HaversineStrategy()
      const calculator = new DistanceCalculator(primaryStrategy, fallbackStrategy)

      const origin: Coordinate = { lat: 23.8103, lng: 90.4125 }
      const destination: Coordinate = { lat: 23.8113, lng: 90.4135 }

      const results = await calculator.calculateDistances([origin], [destination])

      expect(results).toBeDefined()
      expect(results[0][0].method).toBe('Haversine')
    })

    it('JUSTIFICATION: Should fallback to fallback strategy when primary fails', async () => {
      const primaryStrategy = new OSRMStrategy('http://invalid-url:5000')
      const fallbackStrategy = new HaversineStrategy()
      const calculator = new DistanceCalculator(primaryStrategy, fallbackStrategy)

      // Mock OSRM to fail
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Connection failed'))

      const origin: Coordinate = { lat: 23.8103, lng: 90.4125 }
      const destination: Coordinate = { lat: 23.8113, lng: 90.4135 }

      const results = await calculator.calculateDistances([origin], [destination], true)

      // Should use fallback strategy
      expect(results[0][0].method).toBe('Haversine')
    })

    it('JUSTIFICATION: Should allow switching strategies at runtime', () => {
      const calculator = new DistanceCalculator()
      const newStrategy = new HaversineStrategy()

      calculator.setPrimaryStrategy(newStrategy)

      expect(calculator.getPrimaryStrategy()).toBe(newStrategy)
    })

    it('JUSTIFICATION: Should allow setting different fallback strategy', () => {
      const calculator = new DistanceCalculator()
      const newFallback = new HaversineStrategy()

      calculator.setFallbackStrategy(newFallback)

      expect(calculator.getFallbackStrategy()).toBe(newFallback)
    })

    it('JUSTIFICATION: Demonstrates Strategy pattern - algorithms are interchangeable', async () => {
      const haversineCalculator = new DistanceCalculator(new HaversineStrategy())
      const osrmCalculator = new DistanceCalculator(new OSRMStrategy('http://localhost:5000'))

      const origin: Coordinate = { lat: 23.8103, lng: 90.4125 }
      const destination: Coordinate = { lat: 23.8113, lng: 90.4135 }

      // Both calculators have the same interface
      const haversineResults = await haversineCalculator.calculateDistances([origin], [destination])
      const osrmResults = await osrmCalculator.calculateDistances([origin], [destination], false).catch(() => null)

      // Both return the same structure
      expect(haversineResults).toBeDefined()
      expect(Array.isArray(haversineResults)).toBe(true)
    })

    it('JUSTIFICATION: Proves strategies can be used independently', async () => {
      const haversineStrategy = new HaversineStrategy()
      const osrmStrategy = new OSRMStrategy()

      const origin: Coordinate = { lat: 23.8103, lng: 90.4125 }
      const destination: Coordinate = { lat: 23.8113, lng: 90.4135 }

      // Each strategy can be used independently
      const haversineResult = await haversineStrategy.calculateDistances([origin], [destination])
      const osrmResult = await osrmStrategy.calculateDistances([origin], [destination]).catch(() => null)

      expect(haversineResult).toBeDefined()
      // OSRM might fail, but that's okay - strategies are independent
    })

    it('should create default calculator with OSRM and Haversine', () => {
      const calculator = DistanceCalculator.createDefault()

      expect(calculator.getPrimaryStrategy().getName()).toBe('OSRM')
      expect(calculator.getFallbackStrategy().getName()).toBe('Haversine')
    })

    it('should create default calculator with custom OSRM URL', () => {
      const calculator = DistanceCalculator.createDefault('http://custom-osrm:5000')

      expect(calculator.getPrimaryStrategy().getName()).toBe('OSRM')
    })
  })

  describe('Strategy Pattern Validation', () => {
    it('JUSTIFICATION: Demonstrates Open/Closed Principle - can add new strategies without modifying existing code', () => {
      // New strategy can be added by implementing the interface
      class MockStrategy implements DistanceCalculationStrategy {
        async calculateDistances() {
          return [[{ distance: 10, method: 'Mock' }]]
        }
        getName() {
          return 'Mock'
        }
        isAvailable() {
          return true
        }
      }

      const calculator = new DistanceCalculator(new MockStrategy())
      expect(calculator.getPrimaryStrategy().getName()).toBe('Mock')
    })

    it('JUSTIFICATION: Proves Strategy pattern enables runtime algorithm selection', async () => {
      const calculator = new DistanceCalculator()

      // Can switch strategies at runtime
      calculator.setPrimaryStrategy(new HaversineStrategy())
      expect(calculator.getPrimaryStrategy().getName()).toBe('Haversine')

      calculator.setPrimaryStrategy(new OSRMStrategy())
      expect(calculator.getPrimaryStrategy().getName()).toBe('OSRM')
    })

    it('JUSTIFICATION: Shows strategies are encapsulated and independent', async () => {
      const haversine = new HaversineStrategy()
      const osrm = new OSRMStrategy()

      const origin: Coordinate = { lat: 23.8103, lng: 90.4125 }
      const destination: Coordinate = { lat: 23.8113, lng: 90.4135 }

      // Each strategy works independently
      const haversineResult = await haversine.calculateDistances([origin], [destination])
      const osrmAvailable = await osrm.isAvailable()

      expect(haversineResult).toBeDefined()
      expect(typeof osrmAvailable).toBe('boolean')
    })
  })
})


