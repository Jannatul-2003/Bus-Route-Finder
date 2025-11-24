import { BusResult } from './BusResult'
import { BusResultDecorator } from './BusResultDecorator'

/**
 * Decorator that adds time estimates for journey and walking to bus results
 * 
 * Calculates estimated times based on average speeds for Dhaka city traffic conditions.
 * These estimates help users compare routes and plan their journeys.
 * 
 * **Average Speeds:**
 * - Bus speed: 20 km/h (accounts for Dhaka traffic congestion)
 * - Walking speed: 5 km/h (standard walking pace)
 * 
 * **Design Pattern:** Decorator Pattern
 * **Responsibility:** Add time estimate information to bus results
 * **Requirements:** 5.5 - Time estimate display
 * 
 * @class TimeEstimateDecorator
 * @extends {BusResultDecorator}
 * 
 * @example
 * ```typescript
 * const baseBus: BusResult = { ... }
 * 
 * // Add time estimates (5 km journey, 0.5 km walking)
 * const decorated = new TimeEstimateDecorator(baseBus, 5.0, 0.5)
 * 
 * console.log(decorated.getEstimatedJourneyTime()) // 15 minutes
 * console.log(decorated.getEstimatedWalkingTime()) // 6 minutes
 * console.log(decorated.getEstimatedTotalTime()) // 21 minutes
 * ```
 * 
 * @see {BusResultDecorator} for the base decorator class
 * @see {JourneyLengthDecorator} for journey length enhancement
 * @see {WalkingDistanceDecorator} for walking distance enhancement
 * @see {EnhancedBusResultFactory} for composing multiple decorators
 */
export class TimeEstimateDecorator extends BusResultDecorator {
  /**
   * Average bus speed in Dhaka city traffic (km/h)
   * Based on typical Dhaka traffic conditions with congestion
   * @private
   * @readonly
   */
  private readonly AVERAGE_BUS_SPEED_KMH = 20

  /**
   * Average walking speed (km/h)
   * Standard comfortable walking pace
   * @private
   * @readonly
   */
  private readonly AVERAGE_WALKING_SPEED_KMH = 5

  private readonly _journeyLength: number
  private readonly _totalWalkingDistance: number

  /**
   * Creates a new TimeEstimateDecorator
   * 
   * @param {BusResult} busResult - The bus result to decorate
   * @param {number} journeyLength - The journey length in kilometers
   * @param {number} totalWalkingDistance - Total walking distance (both ends) in kilometers
   * 
   * @example
   * ```typescript
   * const decorated = new TimeEstimateDecorator(baseBus, 5.0, 0.5)
   * ```
   */
  constructor(
    busResult: BusResult,
    journeyLength: number,
    totalWalkingDistance: number
  ) {
    super(busResult)
    this._journeyLength = journeyLength
    this._totalWalkingDistance = totalWalkingDistance
  }

  /**
   * Get estimated journey time on the bus
   * 
   * Calculates time based on journey length and average bus speed (20 km/h).
   * This accounts for typical Dhaka traffic conditions including congestion.
   * 
   * @returns {number} Time in minutes
   * 
   * @example
   * ```typescript
   * const decorated = new TimeEstimateDecorator(baseBus, 5.0, 0.5)
   * console.log(decorated.getEstimatedJourneyTime()) // 15 minutes
   * // Calculation: (5 km / 20 km/h) * 60 = 15 minutes
   * ```
   */
  getEstimatedJourneyTime(): number {
    return (this._journeyLength / this.AVERAGE_BUS_SPEED_KMH) * 60
  }

  /**
   * Get estimated walking time (both ends combined)
   * 
   * Calculates time based on total walking distance and average walking speed (5 km/h).
   * Includes walking from start to onboarding stop and from offboarding stop to destination.
   * 
   * @returns {number} Time in minutes
   * 
   * @example
   * ```typescript
   * const decorated = new TimeEstimateDecorator(baseBus, 5.0, 0.5)
   * console.log(decorated.getEstimatedWalkingTime()) // 6 minutes
   * // Calculation: (0.5 km / 5 km/h) * 60 = 6 minutes
   * ```
   */
  getEstimatedWalkingTime(): number {
    return (this._totalWalkingDistance / this.AVERAGE_WALKING_SPEED_KMH) * 60
  }

  /**
   * Get total estimated time (journey + walking)
   * 
   * Calculates the complete door-to-door time including:
   * - Walking from starting location to onboarding stop
   * - Journey time on the bus
   * - Walking from offboarding stop to destination
   * 
   * This is the most useful metric for comparing different route options.
   * 
   * @returns {number} Time in minutes
   * 
   * @example
   * ```typescript
   * const decorated = new TimeEstimateDecorator(baseBus, 5.0, 0.5)
   * console.log(decorated.getEstimatedTotalTime()) // 21 minutes
   * // Calculation: 15 (journey) + 6 (walking) = 21 minutes
   * ```
   */
  getEstimatedTotalTime(): number {
    return this.getEstimatedJourneyTime() + this.getEstimatedWalkingTime()
  }
}
