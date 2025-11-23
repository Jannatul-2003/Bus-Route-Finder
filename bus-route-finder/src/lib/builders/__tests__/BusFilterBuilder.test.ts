import { describe, it, expect, beforeEach } from 'vitest'
import { BusFilterBuilder } from '../BusFilterBuilder'
import type { EnhancedBusResult } from '../BusFilterBuilder'

describe('Builder Pattern - Bus Filter Builder', () => {
  let builder: BusFilterBuilder
  let sampleBuses: EnhancedBusResult[]

  beforeEach(() => {
    builder = new BusFilterBuilder()
    
    // Create sample bus data for testing
    sampleBuses = [
      {
        id: '1',
        name: 'Bus 1',
        isAC: true,
        coachType: 'express',
        status: 'active',
        journeyLength: 5.5,
        walkingDistanceToOnboarding: 200,
        walkingDistanceFromOffboarding: 300,
        totalDistance: 6.0,
      },
      {
        id: '2',
        name: 'Bus 2',
        isAC: false,
        coachType: 'standard',
        status: 'active',
        journeyLength: 3.2,
        walkingDistanceToOnboarding: 150,
        walkingDistanceFromOffboarding: 250,
        totalDistance: 3.6,
      },
      {
        id: '3',
        name: 'Bus 3',
        isAC: true,
        coachType: 'luxury',
        status: 'active',
        journeyLength: 7.8,
        walkingDistanceToOnboarding: 400,
        walkingDistanceFromOffboarding: 500,
        totalDistance: 8.7,
      },
      {
        id: '4',
        name: 'Bus 4',
        isAC: false,
        coachType: 'express',
        status: 'active',
        journeyLength: 4.1,
        walkingDistanceToOnboarding: 100,
        walkingDistanceFromOffboarding: 200,
        totalDistance: 4.4,
      },
      {
        id: '5',
        name: 'Bus 5',
        isAC: true,
        coachType: 'standard',
        status: 'active',
        journeyLength: 2.5,
        walkingDistanceToOnboarding: 250,
        walkingDistanceFromOffboarding: 350,
        totalDistance: 3.1,
      },
    ]
  })

  describe('Fluent Interface', () => {
    it('JUSTIFICATION: Should implement fluent interface pattern with method chaining', () => {
      const result = builder
        .withAC(true)
        .withCoachTypes(['express'])
        .withJourneyLengthRange(2, 10)
        .withMaxWalkingDistance(1000)

      expect(result).toBe(builder)
    })

    it('should allow chaining multiple filter methods', () => {
      const filtered = builder
        .withAC(true)
        .withCoachTypes(['express', 'luxury'])
        .apply(sampleBuses)

      expect(filtered.length).toBeGreaterThan(0)
      filtered.forEach(bus => {
        expect(bus.isAC).toBe(true)
        expect(['express', 'luxury']).toContain(bus.coachType)
      })
    })
  })

  describe('AC Filter - Requirements 6.2, 6.3', () => {
    it('should filter buses by AC status (AC only)', () => {
      const filtered = builder.withAC(true).apply(sampleBuses)

      expect(filtered.length).toBe(3) // Buses 1, 3, 5
      filtered.forEach(bus => {
        expect(bus.isAC).toBe(true)
      })
    })

    it('should filter buses by AC status (Non-AC only)', () => {
      const filtered = builder.withAC(false).apply(sampleBuses)

      expect(filtered.length).toBe(2) // Buses 2, 4
      filtered.forEach(bus => {
        expect(bus.isAC).toBe(false)
      })
    })

    it('should return all buses when AC filter is not set', () => {
      const filtered = builder.apply(sampleBuses)

      expect(filtered.length).toBe(5)
    })
  })

  describe('Coach Type Filter - Requirement 6.4', () => {
    it('should filter buses by single coach type', () => {
      const filtered = builder.withCoachTypes(['express']).apply(sampleBuses)

      expect(filtered.length).toBe(2) // Buses 1, 4
      filtered.forEach(bus => {
        expect(bus.coachType).toBe('express')
      })
    })

    it('should filter buses by multiple coach types', () => {
      const filtered = builder.withCoachTypes(['express', 'luxury']).apply(sampleBuses)

      expect(filtered.length).toBe(3) // Buses 1, 3, 4
      filtered.forEach(bus => {
        expect(['express', 'luxury']).toContain(bus.coachType)
      })
    })

    it('should return all buses when coach type filter is not set', () => {
      const filtered = builder.apply(sampleBuses)

      expect(filtered.length).toBe(5)
    })

    it('should return empty array when no buses match coach type', () => {
      const filtered = builder.withCoachTypes(['nonexistent' as any]).apply(sampleBuses)

      expect(filtered.length).toBe(0)
    })
  })

  describe('Journey Length Filter', () => {
    it('should filter buses by minimum journey length', () => {
      const filtered = builder.withJourneyLengthRange(5).apply(sampleBuses)

      expect(filtered.length).toBe(2) // Buses 1, 3
      filtered.forEach(bus => {
        expect(bus.journeyLength).toBeGreaterThanOrEqual(5)
      })
    })

    it('should filter buses by maximum journey length', () => {
      const filtered = builder.withJourneyLengthRange(undefined, 4).apply(sampleBuses)

      expect(filtered.length).toBe(2) // Buses 2, 5
      filtered.forEach(bus => {
        expect(bus.journeyLength).toBeLessThanOrEqual(4)
      })
    })

    it('should filter buses by journey length range', () => {
      const filtered = builder.withJourneyLengthRange(3, 6).apply(sampleBuses)

      expect(filtered.length).toBe(3) // Buses 1, 2, 4
      filtered.forEach(bus => {
        expect(bus.journeyLength).toBeGreaterThanOrEqual(3)
        expect(bus.journeyLength).toBeLessThanOrEqual(6)
      })
    })
  })

  describe('Walking Distance Filter', () => {
    it('should filter buses by maximum walking distance', () => {
      const filtered = builder.withMaxWalkingDistance(5).apply(sampleBuses)

      expect(filtered.length).toBe(3) // Buses 2, 4, 5
      filtered.forEach(bus => {
        expect(bus.totalDistance).toBeLessThanOrEqual(5)
      })
    })

    it('should return empty array when no buses meet walking distance criteria', () => {
      const filtered = builder.withMaxWalkingDistance(1).apply(sampleBuses)

      expect(filtered.length).toBe(0)
    })
  })

  describe('Multiple Filter Conjunction - Requirement 6.5', () => {
    it('should apply multiple filters with AND logic', () => {
      const filtered = builder
        .withAC(true)
        .withCoachTypes(['express', 'luxury'])
        .withJourneyLengthRange(5, 10)
        .apply(sampleBuses)

      expect(filtered.length).toBe(2) // Buses 1, 3
      filtered.forEach(bus => {
        expect(bus.isAC).toBe(true)
        expect(['express', 'luxury']).toContain(bus.coachType)
        expect(bus.journeyLength).toBeGreaterThanOrEqual(5)
        expect(bus.journeyLength).toBeLessThanOrEqual(10)
      })
    })

    it('should apply all filters including walking distance', () => {
      const filtered = builder
        .withAC(true)
        .withCoachTypes(['express'])
        .withMaxWalkingDistance(7)
        .apply(sampleBuses)

      expect(filtered.length).toBe(1) // Bus 1
      filtered.forEach(bus => {
        expect(bus.isAC).toBe(true)
        expect(bus.coachType).toBe('express')
        expect(bus.totalDistance).toBeLessThanOrEqual(7)
      })
    })

    it('should return empty array when no buses satisfy all filters', () => {
      const filtered = builder
        .withAC(true)
        .withCoachTypes(['standard'])
        .withJourneyLengthRange(10, 20)
        .apply(sampleBuses)

      expect(filtered.length).toBe(0)
    })
  })

  describe('Supabase Query Building - Requirement 6.1', () => {
    it('should build Supabase query with AC filter', () => {
      const mockQuery = {
        eq: (field: string, value: any) => {
          expect(field).toBe('is_ac')
          expect(value).toBe(true)
          return mockQuery
        },
      }

      builder.withAC(true).buildSupabaseQuery(mockQuery)
    })

    it('should build Supabase query with coach type filter', () => {
      const mockQuery = {
        in: (field: string, values: any[]) => {
          expect(field).toBe('coach_type')
          expect(values).toEqual(['express', 'luxury'])
          return mockQuery
        },
      }

      builder.withCoachTypes(['express', 'luxury']).buildSupabaseQuery(mockQuery)
    })

    it('should build Supabase query with multiple filters', () => {
      let eqCalled = false
      let inCalled = false

      const mockQuery = {
        eq: (field: string, value: any) => {
          eqCalled = true
          expect(field).toBe('is_ac')
          expect(value).toBe(false)
          return mockQuery
        },
        in: (field: string, values: any[]) => {
          inCalled = true
          expect(field).toBe('coach_type')
          expect(values).toEqual(['standard'])
          return mockQuery
        },
      }

      builder.withAC(false).withCoachTypes(['standard']).buildSupabaseQuery(mockQuery)

      expect(eqCalled).toBe(true)
      expect(inCalled).toBe(true)
    })

    it('should not modify query when no database-level filters are set', () => {
      const mockQuery = {
        eq: () => {
          throw new Error('eq should not be called')
        },
        in: () => {
          throw new Error('in should not be called')
        },
      }

      // Only set client-side filters
      const result = builder
        .withJourneyLengthRange(5, 10)
        .withMaxWalkingDistance(1000)
        .buildSupabaseQuery(mockQuery)

      expect(result).toBe(mockQuery)
    })
  })

  describe('Reset Functionality', () => {
    it('should reset all filters', () => {
      builder
        .withAC(true)
        .withCoachTypes(['express'])
        .withJourneyLengthRange(5, 10)
        .withMaxWalkingDistance(1000)
        .reset()

      const filtered = builder.apply(sampleBuses)

      expect(filtered.length).toBe(5) // All buses
    })

    it('should allow reusing builder after reset', () => {
      // First use
      const firstFiltered = builder.withAC(true).apply(sampleBuses)
      expect(firstFiltered.length).toBe(3)

      // Reset and reuse
      builder.reset()
      const secondFiltered = builder.withAC(false).apply(sampleBuses)
      expect(secondFiltered.length).toBe(2)
    })

    it('should return builder instance for chaining after reset', () => {
      const result = builder.reset()
      expect(result).toBe(builder)
    })
  })

  describe('Filter Inspection', () => {
    it('should return current filter configuration', () => {
      builder
        .withAC(true)
        .withCoachTypes(['express', 'luxury'])
        .withJourneyLengthRange(5, 10)

      const filters = builder.getFilters()

      expect(filters.isAC).toBe(true)
      expect(filters.coachTypes).toEqual(['express', 'luxury'])
      expect(filters.minJourneyLength).toBe(5)
      expect(filters.maxJourneyLength).toBe(10)
    })

    it('should return copy of filters (not reference)', () => {
      builder.withAC(true)

      const filters = builder.getFilters()
      filters.isAC = false

      const actualFilters = builder.getFilters()
      expect(actualFilters.isAC).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty bus array', () => {
      const filtered = builder.withAC(true).apply([])

      expect(filtered).toEqual([])
    })

    it('should handle empty coach types array', () => {
      const filtered = builder.withCoachTypes([]).apply(sampleBuses)

      expect(filtered.length).toBe(5) // All buses (empty array means no filter)
    })

    it('should handle zero journey length', () => {
      const busWithZeroLength: EnhancedBusResult = {
        ...sampleBuses[0],
        id: '6',
        journeyLength: 0,
      }

      const filtered = builder
        .withJourneyLengthRange(0, 1)
        .apply([...sampleBuses, busWithZeroLength])

      expect(filtered.length).toBe(1)
      expect(filtered[0].id).toBe('6')
    })

    it('should handle negative values gracefully', () => {
      const filtered = builder.withJourneyLengthRange(-10, -5).apply(sampleBuses)

      expect(filtered.length).toBe(0)
    })
  })

  describe('Builder Pattern Validation', () => {
    it('JUSTIFICATION: Demonstrates Builder pattern - separates construction from representation', () => {
      // Builder constructs complex filter configuration step by step
      const complexFilter = new BusFilterBuilder()
        .withAC(true)
        .withCoachTypes(['express', 'luxury'])
        .withJourneyLengthRange(3, 8)
        .withMaxWalkingDistance(1000)

      // The same configuration can be applied to different datasets
      const filtered1 = complexFilter.apply(sampleBuses)
      const filtered2 = complexFilter.apply(sampleBuses.slice(0, 3))

      expect(filtered1).toBeDefined()
      expect(filtered2).toBeDefined()
    })

    it('JUSTIFICATION: Shows Builder pattern enables incremental construction', () => {
      // Start with basic filter
      builder.withAC(true)
      let filtered = builder.apply(sampleBuses)
      expect(filtered.length).toBe(3)

      // Add more criteria incrementally
      builder.withCoachTypes(['express'])
      filtered = builder.apply(sampleBuses)
      expect(filtered.length).toBe(1)

      // Add even more criteria
      builder.withJourneyLengthRange(5, 10)
      filtered = builder.apply(sampleBuses)
      expect(filtered.length).toBe(1)
    })

    it('JUSTIFICATION: Proves Builder pattern provides clear, readable API', () => {
      // The fluent interface makes the code self-documenting
      const filtered = new BusFilterBuilder()
        .withAC(true) // Only AC buses
        .withCoachTypes(['express', 'luxury']) // Express or luxury coaches
        .withJourneyLengthRange(5, 10) // Journey between 5-10 km
        .withMaxWalkingDistance(1000) // Max 1km walking
        .apply(sampleBuses)

      expect(filtered).toBeDefined()
    })
  })
})
