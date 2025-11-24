import { BusResult, Stop } from './BusResult'

/**
 * Abstract base decorator class for the Decorator Pattern implementation
 * 
 * This class implements the BusResult interface and delegates all base properties
 * to the wrapped instance. Concrete decorators extend this class to add additional
 * computed properties without modifying the base BusResult interface.
 * 
 * **Design Pattern:** Decorator Pattern
 * - Allows behavior to be added to individual objects dynamically
 * - Provides a flexible alternative to subclassing for extending functionality
 * - Follows the Open/Closed Principle (open for extension, closed for modification)
 * 
 * @abstract
 * @class BusResultDecorator
 * @implements {BusResult}
 * 
 * @example
 * ```typescript
 * // Concrete decorator extending the base
 * class JourneyLengthDecorator extends BusResultDecorator {
 *   constructor(busResult: BusResult, private journeyLength: number) {
 *     super(busResult)
 *   }
 *   
 *   getJourneyLength(): number {
 *     return this.journeyLength
 *   }
 * }
 * 
 * // Usage
 * const baseBus: BusResult = { ... }
 * const decorated = new JourneyLengthDecorator(baseBus, 5.2)
 * console.log(decorated.name) // Delegates to baseBus
 * console.log(decorated.getJourneyLength()) // New functionality
 * ```
 * 
 * @see {JourneyLengthDecorator} for journey length enhancement
 * @see {WalkingDistanceDecorator} for walking distance enhancement
 * @see {TimeEstimateDecorator} for time estimate enhancement
 * @see {EnhancedBusResultFactory} for composing multiple decorators
 */
export abstract class BusResultDecorator implements BusResult {
  /**
   * Creates a new decorator wrapping the given bus result
   * 
   * @param {BusResult} busResult - The bus result to wrap and enhance
   * @protected
   */
  constructor(protected busResult: BusResult) {}

  /**
   * Gets the unique identifier of the bus
   * Delegates to the wrapped bus result
   * 
   * @returns {string} The bus ID
   */
  get id(): string {
    return this.busResult.id
  }

  /**
   * Gets the human-readable name of the bus
   * Delegates to the wrapped bus result
   * 
   * @returns {string} The bus name (e.g., "Bus #42")
   */
  get name(): string {
    return this.busResult.name
  }

  /**
   * Gets whether the bus has air conditioning
   * Delegates to the wrapped bus result
   * 
   * @returns {boolean} True if the bus has AC, false otherwise
   */
  get isAC(): boolean {
    return this.busResult.isAC
  }

  /**
   * Gets the coach type of the bus
   * Delegates to the wrapped bus result
   * 
   * @returns {'standard' | 'express' | 'luxury'} The coach type
   */
  get coachType(): 'standard' | 'express' | 'luxury' {
    return this.busResult.coachType
  }

  /**
   * Gets the stop where the user boards the bus
   * Delegates to the wrapped bus result
   * 
   * @returns {Stop} The onboarding stop with coordinates
   */
  get onboardingStop(): Stop {
    return this.busResult.onboardingStop
  }

  /**
   * Gets the stop where the user exits the bus
   * Delegates to the wrapped bus result
   * 
   * @returns {Stop} The offboarding stop with coordinates
   */
  get offboardingStop(): Stop {
    return this.busResult.offboardingStop
  }
}
