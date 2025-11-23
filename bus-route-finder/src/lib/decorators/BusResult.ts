/**
 * Base interface for bus results
 * This represents the minimal bus information returned from database queries
 */
export interface Stop {
  id: string
  name: string
  latitude: number
  longitude: number
}

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
 * This is the final interface returned to the UI
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
