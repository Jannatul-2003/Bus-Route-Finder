import { BusResult, EnhancedBusResult } from './BusResult'
import { JourneyLengthDecorator } from './JourneyLengthDecorator'
import { WalkingDistanceDecorator } from './WalkingDistanceDecorator'
import { TimeEstimateDecorator } from './TimeEstimateDecorator'

/**
 * Factory for creating fully decorated bus results
 * Applies all decorators in sequence to create an EnhancedBusResult
 */
export class EnhancedBusResultFactory {
  /**
   * Create an enhanced bus result with all computed properties
   * 
   * @param baseBusResult - The base bus result from database query
   * @param journeyLength - Journey length in kilometers
   * @param walkingToOnboarding - Walking distance to onboarding stop in kilometers
   * @param walkingFromOffboarding - Walking distance from offboarding stop in kilometers
   * @returns Enhanced bus result with all computed properties
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
