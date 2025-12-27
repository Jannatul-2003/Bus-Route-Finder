import type { Coordinate, DistanceResult, DistanceCalculationStrategy } from "./DistanceCalculationStrategy"

/**
 * Strategy Pattern - OSRM Distance Calculation Strategy
 * 
 * Implements distance calculation using OSRM (Open Source Routing Machine) API.
 * This provides accurate road-based distances and durations, but requires
 * an OSRM server to be running.
 */
export class OSRMStrategy implements DistanceCalculationStrategy {
  private readonly baseUrl: string
  private readonly timeout: number

  constructor(baseUrl: string = "http://router.project-osrm.org", timeout: number = 30000) {
    this.baseUrl = baseUrl
    this.timeout = timeout
  }

  /**
   * Validate coordinates before making API calls
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
   * Calculate distances between origins and destinations using OSRM API
   * Requirements 8.3: OSRM timeout handling (30 seconds)
   * Requirements 2.3: Handle OSRM unavailability with proper error messages
   */
  async calculateDistances(
    origins: Coordinate[],
    destinations: Coordinate[],
  ): Promise<DistanceResult[][]> {
    // Validate coordinates before making the call
    this.validateCoordinates(origins, destinations)

    // OSRM expects coordinates in format: longitude,latitude;longitude,latitude;...
    const coordinates = [
      ...origins.map((o) => `${o.lng},${o.lat}`),
      ...destinations.map((d) => `${d.lng},${d.lat}`),
    ].join(";")

    const osrmUrl = `${this.baseUrl}/table/v1/driving/${coordinates}?annotations=distance,duration`

    try {
      // Requirement 8.3: Set 30-second timeout for OSRM requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(osrmUrl, { 
        signal: controller.signal 
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`OSRM API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.code !== "Ok" && data.code !== "ok") {
        throw new Error(`OSRM API error: ${data.message || data.code}`)
      }

      if (!data.distances || !Array.isArray(data.distances) || data.distances.length === 0) {
        throw new Error("Invalid response format from OSRM service")
      }

      // Transform OSRM response to match our format
      // OSRM returns distances in meters and durations in seconds
      const results: DistanceResult[][] = []

      // OSRM returns a matrix where rows are origins and columns are destinations
      // But we need to account for the fact that origins come first in the coordinate string
      const originCount = origins.length
      const destinationCount = destinations.length

      for (let i = 0; i < originCount; i++) {
        const row: DistanceResult[] = []
        for (let j = 0; j < destinationCount; j++) {
          // OSRM matrix: first originCount rows are origins, next destinationCount are destinations
          // We need to find the distance from origin[i] to destination[j]
          const originIndex = i
          const destinationIndex = originCount + j

          const distanceInMeters = data.distances[originIndex]?.[destinationIndex] ?? 0
          const durationInSeconds = data.durations?.[originIndex]?.[destinationIndex] ?? 0

          row.push({
            distance: distanceInMeters / 1000, // Convert meters to kilometers
            duration: durationInSeconds,
            method: this.getName(),
          })
        }
        results.push(row)
      }

      return results
    } catch (error) {
      // Requirement 8.3: Handle timeout errors specifically
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`OSRM request timed out after ${this.timeout}ms`)
      }
      
      // Requirement 2.3: Provide clear error messages for OSRM failures
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('OSRM service is unreachable. Network error occurred.')
      }
      
      throw new Error(`OSRM calculation failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Get strategy name
   */
  getName(): string {
    return "OSRM"
  }

  /**
   * Check if OSRM service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const testUrl = `${this.baseUrl}/table/v1/driving/0,0;0,0?annotations=distance`
      const response = await fetch(testUrl, { signal: AbortSignal.timeout(5000) })
      return response.ok
    } catch {
      return false
    }
  }
}


