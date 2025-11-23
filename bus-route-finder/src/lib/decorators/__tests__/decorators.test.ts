import { describe, it, expect } from 'vitest'
import {
  BusResult,
  Stop,
  JourneyLengthDecorator,
  WalkingDistanceDecorator,
  TimeEstimateDecorator,
  EnhancedBusResultFactory
} from '../index'

describe('Decorator Pattern - Bus Results', () => {
  // Test data
  const mockStop1: Stop = {
    id: 'stop-1',
    name: 'Gulshan Circle 1',
    latitude: 23.7808,
    longitude: 90.4172
  }

  const mockStop2: Stop = {
    id: 'stop-2',
    name: 'Motijheel',
    latitude: 23.7330,
    longitude: 90.4172
  }

  const baseBusResult: BusResult = {
    id: 'bus-123',
    name: 'Bus #42 - Express',
    isAC: true,
    coachType: 'express',
    onboardingStop: mockStop1,
    offboardingStop: mockStop2
  }

  describe('JourneyLengthDecorator', () => {
    it('should preserve all base properties', () => {
      const decorator = new JourneyLengthDecorator(baseBusResult, 2.5)

      expect(decorator.id).toBe(baseBusResult.id)
      expect(decorator.name).toBe(baseBusResult.name)
      expect(decorator.isAC).toBe(baseBusResult.isAC)
      expect(decorator.coachType).toBe(baseBusResult.coachType)
      expect(decorator.onboardingStop).toBe(baseBusResult.onboardingStop)
      expect(decorator.offboardingStop).toBe(baseBusResult.offboardingStop)
    })

    it('should return the correct journey length', () => {
      const journeyLength = 2.5
      const decorator = new JourneyLengthDecorator(baseBusResult, journeyLength)

      expect(decorator.getJourneyLength()).toBe(journeyLength)
    })

    it('should handle zero journey length', () => {
      const decorator = new JourneyLengthDecorator(baseBusResult, 0)

      expect(decorator.getJourneyLength()).toBe(0)
    })

    it('should handle large journey lengths', () => {
      const decorator = new JourneyLengthDecorator(baseBusResult, 50.75)

      expect(decorator.getJourneyLength()).toBe(50.75)
    })
  })

  describe('WalkingDistanceDecorator', () => {
    it('should preserve all base properties', () => {
      const decorator = new WalkingDistanceDecorator(baseBusResult, 0.25, 0.42)

      expect(decorator.id).toBe(baseBusResult.id)
      expect(decorator.name).toBe(baseBusResult.name)
      expect(decorator.isAC).toBe(baseBusResult.isAC)
      expect(decorator.coachType).toBe(baseBusResult.coachType)
    })

    it('should return correct walking distance to onboarding', () => {
      const decorator = new WalkingDistanceDecorator(baseBusResult, 0.25, 0.42)

      expect(decorator.getWalkingDistanceToOnboarding()).toBe(0.25)
    })

    it('should return correct walking distance from offboarding', () => {
      const decorator = new WalkingDistanceDecorator(baseBusResult, 0.25, 0.42)

      expect(decorator.getWalkingDistanceFromOffboarding()).toBe(0.42)
    })

    it('should calculate total walking distance correctly', () => {
      const decorator = new WalkingDistanceDecorator(baseBusResult, 0.25, 0.42)

      expect(decorator.getTotalWalkingDistance()).toBeCloseTo(0.67, 2)
    })

    it('should handle zero walking distances', () => {
      const decorator = new WalkingDistanceDecorator(baseBusResult, 0, 0)

      expect(decorator.getWalkingDistanceToOnboarding()).toBe(0)
      expect(decorator.getWalkingDistanceFromOffboarding()).toBe(0)
      expect(decorator.getTotalWalkingDistance()).toBe(0)
    })
  })

  describe('TimeEstimateDecorator', () => {
    it('should preserve all base properties', () => {
      const decorator = new TimeEstimateDecorator(baseBusResult, 2.5, 0.67)

      expect(decorator.id).toBe(baseBusResult.id)
      expect(decorator.name).toBe(baseBusResult.name)
    })

    it('should calculate journey time correctly (20 km/h average)', () => {
      // 2.5 km at 20 km/h = 0.125 hours = 7.5 minutes
      const decorator = new TimeEstimateDecorator(baseBusResult, 2.5, 0.67)

      expect(decorator.getEstimatedJourneyTime()).toBe(7.5)
    })

    it('should calculate walking time correctly (5 km/h average)', () => {
      // 0.67 km at 5 km/h = 0.134 hours = 8.04 minutes
      const decorator = new TimeEstimateDecorator(baseBusResult, 2.5, 0.67)

      expect(decorator.getEstimatedWalkingTime()).toBeCloseTo(8.04, 1)
    })

    it('should calculate total time correctly', () => {
      const decorator = new TimeEstimateDecorator(baseBusResult, 2.5, 0.67)
      const expectedTotal = 7.5 + 8.04

      expect(decorator.getEstimatedTotalTime()).toBeCloseTo(expectedTotal, 1)
    })

    it('should handle zero distances', () => {
      const decorator = new TimeEstimateDecorator(baseBusResult, 0, 0)

      expect(decorator.getEstimatedJourneyTime()).toBe(0)
      expect(decorator.getEstimatedWalkingTime()).toBe(0)
      expect(decorator.getEstimatedTotalTime()).toBe(0)
    })
  })

  describe('EnhancedBusResultFactory', () => {
    it('should create enhanced result with all properties', () => {
      const enhanced = EnhancedBusResultFactory.create(
        baseBusResult,
        2.5,
        0.25,
        0.42
      )

      // Base properties
      expect(enhanced.id).toBe('bus-123')
      expect(enhanced.name).toBe('Bus #42 - Express')
      expect(enhanced.isAC).toBe(true)
      expect(enhanced.coachType).toBe('express')
      expect(enhanced.onboardingStop).toBe(mockStop1)
      expect(enhanced.offboardingStop).toBe(mockStop2)

      // Journey length
      expect(enhanced.journeyLength).toBe(2.5)

      // Walking distances
      expect(enhanced.walkingDistanceToOnboarding).toBe(0.25)
      expect(enhanced.walkingDistanceFromOffboarding).toBe(0.42)
      expect(enhanced.totalWalkingDistance).toBeCloseTo(0.67, 2)
      expect(enhanced.totalDistance).toBeCloseTo(3.17, 2)

      // Time estimates
      expect(enhanced.estimatedJourneyTime).toBe(7.5)
      expect(enhanced.estimatedWalkingTime).toBeCloseTo(8.04, 1)
      expect(enhanced.estimatedTotalTime).toBeCloseTo(15.54, 1)
    })

    it('should handle zero distances', () => {
      const enhanced = EnhancedBusResultFactory.create(
        baseBusResult,
        0,
        0,
        0
      )

      expect(enhanced.journeyLength).toBe(0)
      expect(enhanced.totalWalkingDistance).toBe(0)
      expect(enhanced.totalDistance).toBe(0)
      expect(enhanced.estimatedTotalTime).toBe(0)
    })

    it('should handle large distances', () => {
      const enhanced = EnhancedBusResultFactory.create(
        baseBusResult,
        50,
        2,
        1.5
      )

      expect(enhanced.journeyLength).toBe(50)
      expect(enhanced.totalWalkingDistance).toBe(3.5)
      expect(enhanced.totalDistance).toBe(53.5)
      expect(enhanced.estimatedJourneyTime).toBe(150) // 50km at 20km/h = 150 min
      expect(enhanced.estimatedWalkingTime).toBe(42) // 3.5km at 5km/h = 42 min
      expect(enhanced.estimatedTotalTime).toBe(192)
    })

    it('should create different instances for different inputs', () => {
      const enhanced1 = EnhancedBusResultFactory.create(baseBusResult, 2.5, 0.25, 0.42)
      const enhanced2 = EnhancedBusResultFactory.create(baseBusResult, 3.0, 0.30, 0.50)

      expect(enhanced1.journeyLength).not.toBe(enhanced2.journeyLength)
      expect(enhanced1.totalDistance).not.toBe(enhanced2.totalDistance)
    })

    it('should work with non-AC standard buses', () => {
      const standardBus: BusResult = {
        ...baseBusResult,
        isAC: false,
        coachType: 'standard'
      }

      const enhanced = EnhancedBusResultFactory.create(standardBus, 1.5, 0.2, 0.3)

      expect(enhanced.isAC).toBe(false)
      expect(enhanced.coachType).toBe('standard')
      expect(enhanced.journeyLength).toBe(1.5)
    })

    it('should work with luxury buses', () => {
      const luxuryBus: BusResult = {
        ...baseBusResult,
        coachType: 'luxury'
      }

      const enhanced = EnhancedBusResultFactory.create(luxuryBus, 5.0, 0.5, 0.6)

      expect(enhanced.coachType).toBe('luxury')
      expect(enhanced.journeyLength).toBe(5.0)
    })
  })

  describe('Decorator Composition', () => {
    it('should allow manual decorator composition', () => {
      const journeyDecorator = new JourneyLengthDecorator(baseBusResult, 2.5)
      const walkingDecorator = new WalkingDistanceDecorator(journeyDecorator, 0.25, 0.42)
      const timeDecorator = new TimeEstimateDecorator(walkingDecorator, 2.5, 0.67)

      // All decorators should preserve base properties
      expect(timeDecorator.id).toBe(baseBusResult.id)
      expect(timeDecorator.name).toBe(baseBusResult.name)

      // Each decorator should provide its functionality
      expect((journeyDecorator as JourneyLengthDecorator).getJourneyLength()).toBe(2.5)
      expect((walkingDecorator as WalkingDistanceDecorator).getTotalWalkingDistance()).toBeCloseTo(0.67, 2)
      expect((timeDecorator as TimeEstimateDecorator).getEstimatedTotalTime()).toBeCloseTo(15.54, 1)
    })
  })
})
