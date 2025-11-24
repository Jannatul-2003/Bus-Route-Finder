import type { Coordinate, DistanceResult, DistanceCalculationStrategy } from "./DistanceCalculationStrategy"
import { HaversineStrategy } from "./HaversineStrategy"
import { OSRMStrategy } from "./OSRMStrategy"

/**
 * Strategy Pattern - Distance Calculator Context
 * 
 * This is the Context class that uses different distance calculation strategies.
 * It allows switching between strategies at runtime and provides fallback
 * mechanisms when primary strategies fail.
 */
export class DistanceCalculator {
  private primaryStrategy: DistanceCalculationStrategy
  private fallbackStrategy: DistanceCalculationStrategy

  /**
   * Create a new DistanceCalculator with specified strategies
   * 
   * @param primaryStrategy The primary strategy to use (e.g., OSRM)
   * @param fallbackStrategy The fallback strategy if primary fails (e.g., Haversine)
   */
  constructor(
    primaryStrategy?: DistanceCalculationStrategy,
    fallbackStrategy?: DistanceCalculationStrategy,
  ) {
    this.primaryStrategy = primaryStrategy || new OSRMStrategy()
    this.fallbackStrategy = fallbackStrategy || new HaversineStrategy()
  }

  /**
   * Calculate distances using the current strategy with automatic fallback
   * Requirements 2.3: Fallback to Haversine when OSRM is unavailable
   * Requirements 8.3: Handle OSRM errors with timeout
   * Requirements 8.4: Automatic fallback on OSRM failure
   * 
   * @param origins Array of origin coordinates
   * @param destinations Array of destination coordinates
   * @param useFallbackOnError If true, automatically falls back to fallback strategy on error
   * @returns Promise resolving to distance matrix with method indicator
   */
  async calculateDistances(
    origins: Coordinate[],
    destinations: Coordinate[],
    useFallbackOnError: boolean = true,
  ): Promise<DistanceResult[][]> {
    // Check if primary strategy is available
    const isPrimaryAvailable = await this.checkAvailability(this.primaryStrategy)

    if (isPrimaryAvailable) {
      try {
        return await this.primaryStrategy.calculateDistances(origins, destinations)
      } catch (error) {
        console.warn(
          `[DistanceCalculator] Primary strategy (${this.primaryStrategy.getName()}) failed:`,
          error instanceof Error ? error.message : String(error),
        )

        if (useFallbackOnError) {
          // Requirement 8.4: Automatic fallback to Haversine
          console.log(
            `[DistanceCalculator] Falling back to ${this.fallbackStrategy.getName()} strategy`,
          )
          
          try {
            return await this.fallbackStrategy.calculateDistances(origins, destinations)
          } catch (fallbackError) {
            console.error(
              `[DistanceCalculator] Fallback strategy also failed:`,
              fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
            )
            throw new Error(
              `Both primary and fallback distance calculation strategies failed. ` +
              `Primary: ${error instanceof Error ? error.message : String(error)}. ` +
              `Fallback: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`
            )
          }
        }

        throw error
      }
    } else {
      // Requirement 2.3: Use fallback when primary is not available
      // Only use fallback if useFallbackOnError is true
      if (useFallbackOnError) {
        console.warn(
          `[DistanceCalculator] Primary strategy (${this.primaryStrategy.getName()}) is not available, using fallback`,
        )
        return await this.fallbackStrategy.calculateDistances(origins, destinations)
      } else {
        throw new Error(
          `Primary strategy (${this.primaryStrategy.getName()}) is not available and fallback is disabled`
        )
      }
    }
  }

  /**
   * Set a new primary strategy
   * 
   * @param strategy The new primary strategy
   */
  setPrimaryStrategy(strategy: DistanceCalculationStrategy): void {
    this.primaryStrategy = strategy
  }

  /**
   * Set a new fallback strategy
   * 
   * @param strategy The new fallback strategy
   */
  setFallbackStrategy(strategy: DistanceCalculationStrategy): void {
    this.fallbackStrategy = strategy
  }

  /**
   * Get the current primary strategy
   */
  getPrimaryStrategy(): DistanceCalculationStrategy {
    return this.primaryStrategy
  }

  /**
   * Get the current fallback strategy
   */
  getFallbackStrategy(): DistanceCalculationStrategy {
    return this.fallbackStrategy
  }

  /**
   * Check if a strategy is available
   */
  private async checkAvailability(strategy: DistanceCalculationStrategy): Promise<boolean> {
    const availability = strategy.isAvailable()
    return availability instanceof Promise ? await availability : availability
  }

  /**
   * Create a default DistanceCalculator with OSRM as primary and Haversine as fallback
   */
  static createDefault(osrmBaseUrl?: string): DistanceCalculator {
    return new DistanceCalculator(
      osrmBaseUrl ? new OSRMStrategy(osrmBaseUrl) : new OSRMStrategy(),
      new HaversineStrategy(),
    )
  }
}


