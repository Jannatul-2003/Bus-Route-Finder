import type { Coordinate, DistanceResult, DistanceCalculationStrategy } from "./DistanceCalculationStrategy"

/**
 * Strategy Pattern - Haversine Distance Calculation Strategy
 * 
 * Implements the Haversine formula for calculating great-circle distances
 * between two points on a sphere. This is a fallback strategy that doesn't
 * require external services and works offline.
 */
export class HaversineStrategy implements DistanceCalculationStrategy {
  private readonly EARTH_RADIUS_KM = 6371

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateHaversineDistance(coord1: Coordinate, coord2: Coordinate): number {
    const dLat = this.toRadians(coord2.lat - coord1.lat)
    const dLon = this.toRadians(coord2.lng - coord1.lng)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.lat)) *
        Math.cos(this.toRadians(coord2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return this.EARTH_RADIUS_KM * c
  }

  /**
   * Validate coordinates before calculations
   * Requirements 8.3: Validate coordinates before distance calculations
   */
  private validateCoordinates(origins: Coordinate[], destinations: Coordinate[]): void {
    const allCoords = [...origins, ...destinations]
    
    for (const coord of allCoords) {
      if (coord.lat < -90 || coord.lat > 90) {
        throw new Error(`Invalid latitude: ${coord.lat}. Must be between -90 and 90.`)
      }
      if (coord.lng < -180 || coord.lng > 180) {
        throw new Error(`Invalid longitude: ${coord.lng}. Must be between -180 and 180.`)
      }
      if (isNaN(coord.lat) || isNaN(coord.lng)) {
        throw new Error(`Invalid coordinates: lat=${coord.lat}, lng=${coord.lng}`)
      }
    }
  }

  /**
   * Calculate distances between origins and destinations using Haversine formula
   * Requirements 8.3: Validate coordinates before distance calculations
   */
  async calculateDistances(
    origins: Coordinate[],
    destinations: Coordinate[],
  ): Promise<DistanceResult[][]> {
    // Validate coordinates before calculation
    this.validateCoordinates(origins, destinations)

    return origins.map((origin) =>
      destinations.map((destination) => {
        const distance = this.calculateHaversineDistance(origin, destination)
        return {
          distance,
          method: this.getName(),
        }
      }),
    )
  }

  /**
   * Get strategy name
   */
  getName(): string {
    return "Haversine"
  }

  /**
   * Haversine is always available (no external dependencies)
   */
  isAvailable(): boolean {
    return true
  }
}


