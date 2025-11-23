import { BusResult } from './BusResult'
import { BusResultDecorator } from './BusResultDecorator'

/**
 * Decorator that adds walking distance calculations
 * Tracks distances from starting location to onboarding stop and from offboarding stop to destination
 */
export class WalkingDistanceDecorator extends BusResultDecorator {
  private readonly _walkingToOnboarding: number
  private readonly _walkingFromOffboarding: number

  constructor(
    busResult: BusResult,
    walkingToOnboarding: number,
    walkingFromOffboarding: number
  ) {
    super(busResult)
    this._walkingToOnboarding = walkingToOnboarding
    this._walkingFromOffboarding = walkingFromOffboarding
  }

  /**
   * Get walking distance from starting location to onboarding stop
   * @returns Distance in kilometers
   */
  getWalkingDistanceToOnboarding(): number {
    return this._walkingToOnboarding
  }

  /**
   * Get walking distance from offboarding stop to destination location
   * @returns Distance in kilometers
   */
  getWalkingDistanceFromOffboarding(): number {
    return this._walkingFromOffboarding
  }

  /**
   * Get total walking distance (both ends combined)
   * @returns Total walking distance in kilometers
   */
  getTotalWalkingDistance(): number {
    return this._walkingToOnboarding + this._walkingFromOffboarding
  }
}
