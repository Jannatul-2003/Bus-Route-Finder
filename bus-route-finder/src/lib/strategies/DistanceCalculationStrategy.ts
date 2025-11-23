/**
 * Strategy Pattern - Distance Calculation Strategy Interface
 * 
 * Defines the contract for different distance calculation algorithms.
 * This allows the application to switch between different calculation methods
 * (OSRM, Haversine, Google Maps, etc.) at runtime without changing the client code.
 */

export interface Coordinate {
  lat: number
  lng: number
}

export interface DistanceResult {
  distance: number // in kilometers
  duration?: number // in seconds (optional)
  method: string // strategy name for tracking
}

export interface DistanceCalculationStrategy {
  /**
   * Calculate distances between origins and destinations
   * 
   * @param origins Array of origin coordinates
   * @param destinations Array of destination coordinates
   * @returns Promise resolving to a matrix of distance results
   *          Each row corresponds to an origin, each column to a destination
   */
  calculateDistances(
    origins: Coordinate[],
    destinations: Coordinate[],
  ): Promise<DistanceResult[][]>

  /**
   * Get the name/identifier of this strategy
   * 
   * @returns Strategy name
   */
  getName(): string

  /**
   * Check if this strategy is available/ready to use
   * 
   * @returns true if strategy can be used, false otherwise
   */
  isAvailable(): boolean | Promise<boolean>
}


