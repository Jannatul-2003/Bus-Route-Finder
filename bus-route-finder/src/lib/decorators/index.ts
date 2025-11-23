/**
 * Decorator Pattern Implementation for Enhanced Bus Results
 * 
 * This module implements the Decorator pattern to enhance basic bus results
 * with computed properties like journey length, walking distances, and time estimates.
 * 
 * Usage:
 * ```typescript
 * const baseBus: BusResult = {
 *   id: '123',
 *   name: 'Bus #42',
 *   isAC: true,
 *   coachType: 'express',
 *   onboardingStop: { ... },
 *   offboardingStop: { ... }
 * }
 * 
 * const enhanced = EnhancedBusResultFactory.create(
 *   baseBus,
 *   2.5,  // journey length in km
 *   0.25, // walking to onboarding in km
 *   0.42  // walking from offboarding in km
 * )
 * 
 * console.log(enhanced.journeyLength) // 2.5
 * console.log(enhanced.totalWalkingDistance) // 0.67
 * console.log(enhanced.estimatedTotalTime) // time in minutes
 * ```
 */

export type { BusResult, Stop, EnhancedBusResult } from './BusResult'
export { BusResultDecorator } from './BusResultDecorator'
export { JourneyLengthDecorator } from './JourneyLengthDecorator'
export { WalkingDistanceDecorator } from './WalkingDistanceDecorator'
export { TimeEstimateDecorator } from './TimeEstimateDecorator'
export { EnhancedBusResultFactory } from './EnhancedBusResultFactory'
