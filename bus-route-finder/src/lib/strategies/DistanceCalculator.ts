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
   * 
   * @param origins Array of origin coordinates
   * @param destinations Array of destination coordinates
   * @param useFallbackOnError If true, automatically falls back to fallback strategy on error
   * @returns Promise resolving to distance matrix
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
          `[Strategy] Primary strategy (${this.primaryStrategy.getName()}) failed:`,
          error,
        )

        if (useFallbackOnError) {
          console.log(
            `[Strategy] Falling back to ${this.fallbackStrategy.getName()} strategy`,
          )
          return await this.fallbackStrategy.calculateDistances(origins, destinations)
        }

        throw error
      }
    } else {
      console.warn(
        `[Strategy] Primary strategy (${this.primaryStrategy.getName()}) is not available, using fallback`,
      )
      return await this.fallbackStrategy.calculateDistances(origins, destinations)
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


