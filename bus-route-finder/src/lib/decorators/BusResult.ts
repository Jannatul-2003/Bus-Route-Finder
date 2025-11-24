/**
 * Represents a bus stop with geographic coordinates
 * 
 * @interface Stop
 * @property {string} id - Unique identifier for the stop
 * @property {string} name - Human-readable name of the stop
 * @property {number} latitude - Latitude coordinate (decimal degrees)
 * @property {number} longitude - Longitude coordinate (decimal degrees)
 */
export interface Stop {
  id: string
  name: string
  latitude: number
  longitude: number
}

/**
 * Base interface for bus results from database queries
 * 
 * This represents the minimal bus information before enhancement with computed properties.
 * Used as the base for the Decorator Pattern implementation.
 * 
 * @interface BusResult
 * @property {string} id - Unique identifier for the bus
 * @property {string} name - Human-readable name of the bus (e.g., "Bus #42")
 * @property {boolean} isAC - Whether the bus has air conditioning
 * @property {'standard' | 'express' | 'luxury'} coachType - Type of coach service
 * @property {Stop} onboardingStop - Stop where user boards the bus
 * @property {Stop} offboardingStop - Stop where user exits the bus
 * 
 * @see {EnhancedBusResult} for the enhanced version with computed properties
 * @see {EnhancedBusResultFactory} for creating enhanced results
 */
export interface BusResult {
  id: string
  name: string
  isAC: boolean
  coachType: 'standard' | 'express' | 'luxury'
  onboardingStop: Stop
  offboardingStop: Stop
}

/**
 * Enhanced bus result with all computed properties
 * 
 * This interface extends BusResult with additional computed properties added by decorators:
 * - Journey length (distance on bus)
 * - Walking distances (to/from stops)
 * - Time estimates (journey and walking)
 * 
 * This is the final interface returned to the UI components.
 * 
 * @interface EnhancedBusResult
 * @extends {BusResult}
 * 
 * @property {number} journeyLength - Total distance traveled on bus in kilometers
 * @property {number} walkingDistanceToOnboarding - Walking distance from start to onboarding stop in kilometers
 * @property {number} walkingDistanceFromOffboarding - Walking distance from offboarding stop to destination in kilometers
 * @property {number} totalWalkingDistance - Sum of both walking distances in kilometers
 * @property {number} totalDistance - Sum of journey length and total walking distance in kilometers
 * @property {number} estimatedJourneyTime - Estimated time on bus in minutes (based on 20 km/h average)
 * @property {number} estimatedWalkingTime - Estimated walking time in minutes (based on 5 km/h average)
 * @property {number} estimatedTotalTime - Sum of journey and walking time in minutes
 * 
 * @example
 * ```typescript
 * const enhanced: EnhancedBusResult = {
 *   id: '123',
 *   name: 'Bus #42',
 *   isAC: true,
 *   coachType: 'express',
 *   onboardingStop: { id: 'stop1', name: 'Mohakhali', lat: 23.78, lng: 90.40 },
 *   offboardingStop: { id: 'stop2', name: 'Shahbag', lat: 23.74, lng: 90.39 },
 *   journeyLength: 5.2,
 *   walkingDistanceToOnboarding: 0.3,
 *   walkingDistanceFromOffboarding: 0.4,
 *   totalWalkingDistance: 0.7,
 *   totalDistance: 5.9,
 *   estimatedJourneyTime: 15.6,
 *   estimatedWalkingTime: 8.4,
 *   estimatedTotalTime: 24.0
 * }
 * ```
 * 
 * @see {BusResult} for the base interface
 * @see {EnhancedBusResultFactory} for creating enhanced results
 * @see {JourneyLengthDecorator} for journey length calculation
 * @see {WalkingDistanceDecorator} for walking distance calculation
 * @see {TimeEstimateDecorator} for time estimate calculation
 */
export interface EnhancedBusResult extends BusResult {
  journeyLength: number
  walkingDistanceToOnboarding: number
  walkingDistanceFromOffboarding: number
  totalWalkingDistance: number
  totalDistance: number
  estimatedJourneyTime: number
  estimatedWalkingTime: number
  estimatedTotalTime: number
}
