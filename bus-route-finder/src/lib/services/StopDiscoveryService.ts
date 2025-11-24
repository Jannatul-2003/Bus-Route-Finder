import type { SupabaseClient } from '@supabase/supabase-js'
import type { DistanceCalculator } from '../strategies/DistanceCalculator'
import type { Stop, StopWithDistance, Coordinates } from '../types/database'

/**
 * Service for discovering bus stops within threshold distances
 * 
 * This service uses the Strategy pattern (via DistanceCalculator) to calculate
 * distances to stops using OSRM with Haversine fallback.
 */
export class StopDiscoveryService {
  constructor(
    private distanceCalculator: DistanceCalculator,
    private supabaseClient: SupabaseClient
  ) {}

  /**
   * Discover stops within threshold of a location
   * 
   * @param location The reference location coordinates
   * @param thresholdMeters The maximum distance in meters
   * @returns Promise resolving to array of stops within threshold, sorted by distance
   */
  async discoverStops(
    location: Coordinates,
    thresholdMeters: number
  ): Promise<StopWithDistance[]> {
    // 1. Fetch all stops from Supabase
    const allStops = await this.fetchAllStops()
    
    // 2. Calculate distances using DistanceCalculator (OSRM with Haversine fallback)
    const distances = await this.distanceCalculator.calculateDistances(
      [location],
      allStops.map(s => ({ lat: s.latitude, lng: s.longitude }))
    )
    
    // 3. Map stops with their distances and filter by threshold
    const stopsWithDistances: StopWithDistance[] = allStops
      .map((stop, index) => ({
        ...stop,
        distance: distances[0][index].distance * 1000, // convert km to meters
        distanceMethod: distances[0][index].method as 'OSRM' | 'Haversine'
      }))
      .filter(stop => stop.distance <= thresholdMeters)
      .sort((a, b) => a.distance - b.distance)
    
    return stopsWithDistances
  }
  
  /**
   * Fetch all stops from Supabase with retry logic
   * Requirements 8.4: Retry logic for database connection failures (3 attempts)
   * 
   * @returns Promise resolving to array of all stops
   * @throws Error if database query fails after all retries
   */
  async fetchAllStops(): Promise<Stop[]> {
    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await this.supabaseClient
          .from('stops')
          .select('*')
        
        if (error) {
          throw new Error(`Failed to fetch stops: ${error.message}`)
        }
        
        return data as Stop[]
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        if (attempt < maxRetries) {
          // Exponential backoff: wait 1s, 2s, 4s
          const waitTime = Math.pow(2, attempt - 1) * 1000
          console.warn(
            `[StopDiscoveryService] Database query failed (attempt ${attempt}/${maxRetries}). ` +
            `Retrying in ${waitTime}ms...`,
            lastError.message
          )
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
    }

    throw new Error(
      `Failed to fetch stops after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
    )
  }
}
