import { BusResult, EnhancedBusResult } from './BusResult'
import { JourneyLengthDecorator } from './JourneyLengthDecorator'
import { WalkingDistanceDecorator } from './WalkingDistanceDecorator'
import { TimeEstimateDecorator } from './TimeEstimateDecorator'

/**
 * Factory for creating fully decorated bus results with all computed properties
 * 
 * This factory applies the Decorator Pattern to enhance base bus results with:
 * - Journey length (distance on bus)
 * - Walking distances (to/from stops)
 * - Time estimates (journey and walking)
 * 
 * The factory composes multiple decorators in sequence and then extracts all
 * properties into a plain EnhancedBusResult object for easier use in React components.
 * 
 * **Design Pattern:** Factory Pattern + Decorator Pattern
 * **Responsibility:** Compose decorators and create enhanced bus results
 * **Requirements:** 5.1, 5.5, 9.1, 9.2
 * 
 * @class EnhancedBusResultFactory
 * 
 * @example
 * ```typescript
 * // Base bus result from database
 * const baseBus: BusResult = {
 *   id: '123',
 *   name: 'Bus #42',
 *   isAC: true,
 *   coachType: 'express',
 *   onboardingStop: { ... },
 *   offboardingStop: { ... }
 * }
 * 
 * // Create enhanced result
 * const enhanced = EnhancedBusResultFactory.create(
 *   baseBus,
 *   5.2,  // journey length in km
 *   0.3,  // walking to onboarding in km
 *   0.4   // walking from offboarding in km
 * )
 * 
 * // Access all properties
 * console.log(enhanced.name) // "Bus #42"
 * console.log(enhanced.journeyLength) // 5.2
 * console.log(enhanced.totalWalkingDistance) // 0.7
 * console.log(enhanced.estimatedTotalTime) // ~24 minutes
 * ```
 * 
 * @see {BusResult} for the base interface
 * @see {EnhancedBusResult} for the enhanced interface
 * @see {JourneyLengthDecorator} for journey length calculation
 * @see {WalkingDistanceDecorator} for walking distance calculation
 * @see {TimeEstimateDecorator} for time estimate calculation
 */
export class EnhancedBusResultFactory {
  /**
   * Create an enhanced bus result with all computed properties
   * 
   * This method applies decorators in the following sequence:
   * 1. JourneyLengthDecorator - Adds journey length
   * 2. WalkingDistanceDecorator - Adds walking distances
   * 3. TimeEstimateDecorator - Adds time estimates
   * 
   * The decorators are then unwrapped into a plain EnhancedBusResult object
   * for better performance and easier serialization.
   * 
   * @param {BusResult} baseBusResult - The base bus result from database query
   * @param {number} journeyLength - Journey length in kilometers (sum of route segment distances)
   * @param {number} walkingToOnboarding - Walking distance from start to onboarding stop in kilometers
   * @param {number} walkingFromOffboarding - Walking distance from offboarding stop to destination in kilometers
   * @returns {EnhancedBusResult} Enhanced bus result with all computed properties
   * 
   * @example
   * ```typescript
   * const enhanced = EnhancedBusResultFactory.create(
   *   baseBus,
   *   5.2,  // 5.2 km journey
   *   0.3,  // 300m walk to onboarding
   *   0.4   // 400m walk from offboarding
   * )
   * 
   * // Result includes all properties:
   * // - Base: id, name, isAC, coachType, stops
   * // - Journey: journeyLength (5.2)
   * // - Walking: walkingDistanceToOnboarding (0.3), walkingDistanceFromOffboarding (0.4), totalWalkingDistance (0.7)
   * // - Total: totalDistance (5.9)
   * // - Time: estimatedJourneyTime (15.6), estimatedWalkingTime (8.4), estimatedTotalTime (24.0)
   * ```
   * 
   * @throws {Error} If any of the numeric parameters are negative
   */
  static create(
    baseBusResult: BusResult,
    journeyLength: number,
    walkingToOnboarding: number,
    walkingFromOffboarding: number
  ): EnhancedBusResult {
    // Apply decorators in sequence
    const journeyDecorator = new JourneyLengthDecorator(baseBusResult, journeyLength)
    const walkingDecorator = new WalkingDistanceDecorator(
      journeyDecorator,
      walkingToOnboarding,
      walkingFromOffboarding
    )
    const timeDecorator = new TimeEstimateDecorator(
      walkingDecorator,
      journeyLength,
      walkingToOnboarding + walkingFromOffboarding
    )

    // Create the enhanced result by extracting all properties
    const enhanced: EnhancedBusResult = {
      // Base properties
      id: timeDecorator.id,
      name: timeDecorator.name,
      isAC: timeDecorator.isAC,
      coachType: timeDecorator.coachType,
      onboardingStop: timeDecorator.onboardingStop,
      offboardingStop: timeDecorator.offboardingStop,
      
      // Journey length
      journeyLength: (journeyDecorator as JourneyLengthDecorator).getJourneyLength(),
      
      // Walking distances
      walkingDistanceToOnboarding: (walkingDecorator as WalkingDistanceDecorator).getWalkingDistanceToOnboarding(),
      walkingDistanceFromOffboarding: (walkingDecorator as WalkingDistanceDecorator).getWalkingDistanceFromOffboarding(),
      totalWalkingDistance: (walkingDecorator as WalkingDistanceDecorator).getTotalWalkingDistance(),
      totalDistance: (journeyDecorator as JourneyLengthDecorator).getJourneyLength() + 
                     (walkingDecorator as WalkingDistanceDecorator).getTotalWalkingDistance(),
      
      // Time estimates
      estimatedJourneyTime: (timeDecorator as TimeEstimateDecorator).getEstimatedJourneyTime(),
      estimatedWalkingTime: (timeDecorator as TimeEstimateDecorator).getEstimatedWalkingTime(),
      estimatedTotalTime: (timeDecorator as TimeEstimateDecorator).getEstimatedTotalTime()
    }

    return enhanced
  }
}
