import { BusResult } from './BusResult'
import { BusResultDecorator } from './BusResultDecorator'

/**
 * Decorator that adds journey length calculation to bus results
 * 
 * Journey length is the total distance traveled on the bus from the onboarding stop
 * to the offboarding stop. This is calculated by summing the pre-calculated distances
 * between consecutive stops in the route.
 * 
 * **Design Pattern:** Decorator Pattern
 * **Responsibility:** Add journey length information to bus results
 * **Requirements:** 5.1 - Journey length calculation
 * 
 * @class JourneyLengthDecorator
 * @extends {BusResultDecorator}
 * 
 * @example
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
 * // Add journey length
 * const decorated = new JourneyLengthDecorator(baseBus, 5.2)
 * 
 * // Access base properties (delegated)
 * console.log(decorated.name) // "Bus #42"
 * console.log(decorated.isAC) // true
 * 
 * // Access new functionality
 * console.log(decorated.getJourneyLength()) // 5.2
 * ```
 * 
 * @see {BusResultDecorator} for the base decorator class
 * @see {WalkingDistanceDecorator} for walking distance enhancement
 * @see {TimeEstimateDecorator} for time estimate enhancement
 * @see {EnhancedBusResultFactory} for composing multiple decorators
 */
export class JourneyLengthDecorator extends BusResultDecorator {
  private readonly _journeyLength: number

  /**
   * Creates a new JourneyLengthDecorator
   * 
   * @param {BusResult} busResult - The bus result to decorate
   * @param {number} journeyLength - The journey length in kilometers
   * 
   * @example
   * ```typescript
   * const decorated = new JourneyLengthDecorator(baseBus, 5.2)
   * ```
   */
  constructor(busResult: BusResult, journeyLength: number) {
    super(busResult)
    this._journeyLength = journeyLength
  }

  /**
   * Get the journey length in kilometers
   * 
   * This is the total distance traveled on the bus from onboarding to offboarding stop,
   * calculated by summing the pre-calculated distances between consecutive stops.
   * 
   * @returns {number} Journey length in kilometers
   * 
   * @example
   * ```typescript
   * const decorated = new JourneyLengthDecorator(baseBus, 5.2)
   * console.log(decorated.getJourneyLength()) // 5.2
   * ```
   */
  getJourneyLength(): number {
    return this._journeyLength
  }
}
