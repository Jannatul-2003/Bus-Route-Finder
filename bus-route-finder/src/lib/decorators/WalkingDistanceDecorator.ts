import { BusResult } from './BusResult'
import { BusResultDecorator } from './BusResultDecorator'

/**
 * Decorator that adds walking distance calculations to bus results
 * 
 * Tracks distances from the user's starting location to the onboarding stop,
 * and from the offboarding stop to the destination location. These distances
 * are calculated using OSRM for accurate road-network distances.
 * 
 * **Design Pattern:** Decorator Pattern
 * **Responsibility:** Add walking distance information to bus results
 * **Requirements:** 9.1, 9.2 - Walking distance calculation and display
 * 
 * @class WalkingDistanceDecorator
 * @extends {BusResultDecorator}
 * 
 * @example
 * ```typescript
 * const baseBus: BusResult = { ... }
 * 
 * // Add walking distances (0.3 km to onboarding, 0.4 km from offboarding)
 * const decorated = new WalkingDistanceDecorator(baseBus, 0.3, 0.4)
 * 
 * console.log(decorated.getWalkingDistanceToOnboarding()) // 0.3
 * console.log(decorated.getWalkingDistanceFromOffboarding()) // 0.4
 * console.log(decorated.getTotalWalkingDistance()) // 0.7
 * ```
 * 
 * @see {BusResultDecorator} for the base decorator class
 * @see {JourneyLengthDecorator} for journey length enhancement
 * @see {TimeEstimateDecorator} for time estimate enhancement
 * @see {EnhancedBusResultFactory} for composing multiple decorators
 */
export class WalkingDistanceDecorator extends BusResultDecorator {
  private readonly _walkingToOnboarding: number
  private readonly _walkingFromOffboarding: number

  /**
   * Creates a new WalkingDistanceDecorator
   * 
   * @param {BusResult} busResult - The bus result to decorate
   * @param {number} walkingToOnboarding - Walking distance from start to onboarding stop in kilometers
   * @param {number} walkingFromOffboarding - Walking distance from offboarding stop to destination in kilometers
   * 
   * @example
   * ```typescript
   * const decorated = new WalkingDistanceDecorator(baseBus, 0.3, 0.4)
   * ```
   */
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
   * 
   * This distance is calculated using OSRM for accurate road-network routing.
   * If OSRM is unavailable, falls back to Haversine (straight-line) distance.
   * 
   * @returns {number} Distance in kilometers
   * 
   * @example
   * ```typescript
   * const decorated = new WalkingDistanceDecorator(baseBus, 0.3, 0.4)
   * console.log(decorated.getWalkingDistanceToOnboarding()) // 0.3
   * ```
   */
  getWalkingDistanceToOnboarding(): number {
    return this._walkingToOnboarding
  }

  /**
   * Get walking distance from offboarding stop to destination location
   * 
   * This distance is calculated using OSRM for accurate road-network routing.
   * If OSRM is unavailable, falls back to Haversine (straight-line) distance.
   * 
   * @returns {number} Distance in kilometers
   * 
   * @example
   * ```typescript
   * const decorated = new WalkingDistanceDecorator(baseBus, 0.3, 0.4)
   * console.log(decorated.getWalkingDistanceFromOffboarding()) // 0.4
   * ```
   */
  getWalkingDistanceFromOffboarding(): number {
    return this._walkingFromOffboarding
  }

  /**
   * Get total walking distance (both ends combined)
   * 
   * This is the sum of walking distance to onboarding stop and walking distance
   * from offboarding stop. Useful for filtering routes by maximum walking distance.
   * 
   * @returns {number} Total walking distance in kilometers
   * 
   * @example
   * ```typescript
   * const decorated = new WalkingDistanceDecorator(baseBus, 0.3, 0.4)
   * console.log(decorated.getTotalWalkingDistance()) // 0.7
   * ```
   */
  getTotalWalkingDistance(): number {
    return this._walkingToOnboarding + this._walkingFromOffboarding
  }
}
