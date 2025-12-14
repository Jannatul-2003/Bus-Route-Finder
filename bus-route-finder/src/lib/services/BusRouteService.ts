import type { SupabaseClient } from '@supabase/supabase-js'
import type { DistanceCalculator } from '../strategies/DistanceCalculator'
import type { Bus, Stop, RouteStop } from '../types/database'

/**
 * Represents a valid bus route between two stops
 */
export interface BusRoute {
  busId: string
  bus: Bus
  onboardingStop: Stop
  offboardingStop: Stop
  onboardingStopOrder: number
  offboardingStopOrder: number
  direction: 'outbound' | 'inbound'
  routeStops: RouteStopWithDetails[]
}

/**
 * Route stop with joined bus and stop details
 * Note: Supabase returns relations with the table name (buses, stops)
 */
export interface RouteStopWithDetails extends RouteStop {
  buses?: Bus  // Supabase returns this as 'buses' (table name)
  stops?: Stop  // Supabase returns this as 'stops' (table name)
}

/**
 * Service for finding and analyzing bus routes
 * 
 * This service handles querying buses that serve specific stops,
 * calculating journey lengths, and validating route ordering.
 * 
 * Performance optimization: Memoizes journey length calculations
 * Requirements 5.1, 6.7: Add memoization for expensive calculations
 */
export class BusRouteService {
  // Cache for journey length calculations
  // Key format: "busId-onboardingOrder-offboardingOrder-direction"
  private journeyLengthCache: Map<string, number> = new Map()

  constructor(
    private supabaseClient: SupabaseClient,
    private distanceCalculator: DistanceCalculator
  ) {}

  /**
   * Find buses that serve both onboarding and offboarding stops
   * Requirements 8.4: Retry logic for database connection failures (3 attempts)
   * 
   * @param onboardingStopId The stop where user boards the bus
   * @param offboardingStopId The stop where user exits the bus
   * @returns Promise resolving to array of valid bus routes
   * @throws Error if database query fails after all retries
   */
  async findBusRoutes(
    onboardingStopId: string,
    offboardingStopId: string
  ): Promise<BusRoute[]> {
    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log('[BusRouteService] Querying for stops:', { onboardingStopId, offboardingStopId })
        
        // Query route_stops to find buses serving both stops
        const { data: routes, error } = await this.supabaseClient
          .from('route_stops')
          .select(`
            id,
            bus_id,
            stop_id,
            stop_order,
            direction,
            distance_to_next,
            duration_to_next,
            buses (
              id,
              name,
              status,
              is_ac,
              coach_type
            ),
            stops (
              id,
              name,
              latitude,
              longitude,
              accessible
            )
          `)
          .in('stop_id', [onboardingStopId, offboardingStopId])
          .eq('buses.status', 'active')
        
        console.log('[BusRouteService] Query result:', { routesCount: routes?.length, error })
        
        if (error) {
          throw new Error(`Failed to fetch bus routes: ${error.message}`)
        }
        
        if (!routes || routes.length === 0) {
          console.log('[BusRouteService] No routes found for these stop IDs')
          return []
        }
        
        console.log('[BusRouteService] Found route_stops:', routes.map(r => ({
          bus: (r as any).buses?.name || 'Unknown',
          stop: (r as any).stops?.name || 'Unknown',
          stop_order: r.stop_order,
          direction: r.direction
        })))
        
        // Filter for valid routes where onboarding comes before offboarding
        const validRoutes = await this.filterValidRoutes(
          routes as unknown as RouteStopWithDetails[],
          onboardingStopId,
          offboardingStopId
        )
        
        return validRoutes
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        if (attempt < maxRetries) {
          // Exponential backoff: wait 1s, 2s, 4s
          const waitTime = Math.pow(2, attempt - 1) * 1000
          console.warn(
            `[BusRouteService] Database query failed (attempt ${attempt}/${maxRetries}). ` +
            `Retrying in ${waitTime}ms...`,
            lastError.message
          )
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
    }

    throw new Error(
      `Failed to fetch bus routes after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
    )
  }

  /**
   * Calculate journey length from pre-calculated segment distances
   * Requirements 5.4: Handle missing distance_to_next with OSRM calculation and warning log
   * Requirements 8.4: Retry logic for database connection failures
   * Requirements 5.1, 6.7: Memoization for expensive calculations
   * 
   * @param busId The bus ID
   * @param onboardingStopOrder The stop order of onboarding stop
   * @param offboardingStopOrder The stop order of offboarding stop
   * @param direction The route direction
   * @returns Promise resolving to journey length in kilometers
   * @throws Error if database query fails after all retries
   */
  async calculateJourneyLength(
    busId: string,
    onboardingStopOrder: number,
    offboardingStopOrder: number,
    direction: 'outbound' | 'inbound'
  ): Promise<number> {
    // Check cache first (Requirements 5.1, 6.7: Memoization)
    const cacheKey = `${busId}-${onboardingStopOrder}-${offboardingStopOrder}-${direction}`
    const cached = this.journeyLengthCache.get(cacheKey)
    if (cached !== undefined) {
      return cached
    }

    const maxRetries = 3
    let lastError: Error | null = null

    // Retry database query
    let segments: any[] = []
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Fetch all segments between onboarding and offboarding stops
        const { data, error } = await this.supabaseClient
          .from('route_stops')
          .select('stop_order, distance_to_next, stop_id, stops(latitude, longitude)')
          .eq('bus_id', busId)
          .eq('direction', direction)
          .gte('stop_order', onboardingStopOrder)
          .lt('stop_order', offboardingStopOrder)
          .order('stop_order', { ascending: true })
        
        if (error) {
          throw new Error(`Failed to fetch route segments: ${error.message}`)
        }
        
        segments = data || []
        break // Success, exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt - 1) * 1000
          console.warn(
            `[BusRouteService] Failed to fetch segments (attempt ${attempt}/${maxRetries}). ` +
            `Retrying in ${waitTime}ms...`,
            lastError.message
          )
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
    }

    if (segments.length === 0 && lastError) {
      throw new Error(
        `Failed to fetch route segments after ${maxRetries} attempts: ${lastError.message}`
      )
    }
    
    if (segments.length === 0) {
      return 0
    }
    
    // Calculate total distance, handling missing distance_to_next values
    // Requirement 5.4: Handle missing distance_to_next with OSRM calculation and warning log
    let totalDistance = 0
    let missingDistanceCount = 0
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      
      if (segment.distance_to_next !== null && segment.distance_to_next !== undefined) {
        // Use pre-calculated distance
        totalDistance += segment.distance_to_next
      } else {
        missingDistanceCount++
        
        // Requirement 5.4: Log warning for missing distance_to_next
        console.warn(
          `[BusRouteService] Missing distance_to_next for bus ${busId}, ` +
          `stop_order ${segment.stop_order}, direction ${direction}. ` +
          `Calculating with OSRM. Database should be updated.`
        )
        
        // Get next segment to calculate distance
        if (i + 1 < segments.length) {
          const nextSegment = segments[i + 1]
          const currentStop = segment.stops as any
          const nextStop = nextSegment.stops as any
          
          if (currentStop && nextStop && 
              currentStop.latitude && currentStop.longitude &&
              nextStop.latitude && nextStop.longitude) {
            try {
              // Requirement 5.4: Calculate using OSRM as fallback
              const distances = await this.distanceCalculator.calculateDistances(
                [{ lat: currentStop.latitude, lng: currentStop.longitude }],
                [{ lat: nextStop.latitude, lng: nextStop.longitude }]
              )
              
              const calculatedDistance = distances[0][0].distance
              const calculationMethod = distances[0][0].method
              totalDistance += calculatedDistance
              
              console.log(
                `[BusRouteService] Calculated missing distance: ${calculatedDistance.toFixed(3)} km ` +
                `for segment ${segment.stop_order} using ${calculationMethod}`
              )
              
              // Only update database if OSRM was used (not Haversine fallback)
              if (calculationMethod === 'OSRM') {
                try {
                  const { error: updateError } = await this.supabaseClient
                    .from('route_stops')
                    .update({ distance_to_next: calculatedDistance })
                    .eq('bus_id', busId)
                    .eq('direction', direction)
                    .eq('stop_order', segment.stop_order)
                  
                  if (updateError) {
                    console.error(
                      `[BusRouteService] Failed to update distance_to_next in database: ${updateError.message}`
                    )
                  } else {
                    console.log(
                      `[BusRouteService] Successfully updated distance_to_next in database for ` +
                      `bus ${busId}, stop_order ${segment.stop_order} (OSRM calculated)`
                    )
                  }
                } catch (updateErr) {
                  console.error(
                    `[BusRouteService] Error updating distance_to_next: `,
                    updateErr instanceof Error ? updateErr.message : String(updateErr)
                  )
                }
              } else {
                console.log(
                  `[BusRouteService] Skipping database update for segment ${segment.stop_order} ` +
                  `(used ${calculationMethod} fallback, not OSRM)`
                )
              }
            } catch (calcError) {
              console.error(
                `[BusRouteService] Failed to calculate distance for segment ${segment.stop_order}: `,
                calcError instanceof Error ? calcError.message : String(calcError)
              )
              // Continue without adding distance for this segment
            }
          } else {
            console.error(
              `[BusRouteService] Cannot calculate distance for segment ${segment.stop_order}: ` +
              `Missing stop coordinates`
            )
          }
        }
      }
    }
    
    if (missingDistanceCount > 0) {
      console.warn(
        `[BusRouteService] Journey calculation for bus ${busId} had ${missingDistanceCount} ` +
        `missing distance values out of ${segments.length} segments. Database update recommended.`
      )
    }
    
    // Cache the result (Requirements 5.1, 6.7: Memoization)
    this.journeyLengthCache.set(cacheKey, totalDistance)
    
    return totalDistance
  }

  /**
   * Clear the journey length cache
   * Useful when route data is updated
   */
  clearJourneyLengthCache(): void {
    this.journeyLengthCache.clear()
  }

  /**
   * Filter routes to ensure correct stop ordering
   * 
   * @param routes Array of route stops with details
   * @param onboardingStopId The onboarding stop ID
   * @param offboardingStopId The offboarding stop ID
   * @returns Promise resolving to array of valid bus routes
   */
  private async filterValidRoutes(
    routes: RouteStopWithDetails[],
    onboardingStopId: string,
    offboardingStopId: string
  ): Promise<BusRoute[]> {
    console.log('[BusRouteService] filterValidRoutes called with', routes.length, 'route_stops')
    
    // Group by bus_id and direction
    const grouped = new Map<string, RouteStopWithDetails[]>()
    
    routes.forEach(route => {
      const key = `${route.bus_id}-${route.direction}`
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(route)
    })
    
    console.log('[BusRouteService] Grouped into', grouped.size, 'bus-direction combinations')
    
    // Filter routes where onboarding comes before offboarding
    const validRoutes: BusRoute[] = []
    
    for (const [key, routeStops] of grouped.entries()) {
      const onboarding = routeStops.find(r => r.stop_id === onboardingStopId)
      const offboarding = routeStops.find(r => r.stop_id === offboardingStopId)
      
      console.log(`[BusRouteService] Checking ${key}:`, {
        hasOnboarding: !!onboarding,
        hasOffboarding: !!offboarding,
        onboardingOrder: onboarding?.stop_order,
        offboardingOrder: offboarding?.stop_order,
        busName: (onboarding as any)?.buses?.name || (offboarding as any)?.buses?.name,
        onboardingBus: (onboarding as any)?.buses,
        onboardingBuses: onboarding?.buses,
        onboardingKeys: onboarding ? Object.keys(onboarding) : []
      })
      
      if (onboarding && offboarding && 
          onboarding.stop_order < offboarding.stop_order &&
          onboarding.buses && onboarding.stops &&
          offboarding.stops) {
        console.log(`[BusRouteService] ✓ Valid route found for ${key}`)
        
        // Fetch all stops between onboarding and offboarding for this route
        const { data: allRouteStops, error } = await this.supabaseClient
          .from('route_stops')
          .select(`
            id,
            bus_id,
            stop_id,
            stop_order,
            direction,
            distance_to_next,
            duration_to_next,
            stops (
              id,
              name,
              latitude,
              longitude,
              accessible
            )
          `)
          .eq('bus_id', onboarding.bus_id)
          .eq('direction', onboarding.direction)
          .gte('stop_order', onboarding.stop_order)
          .lte('stop_order', offboarding.stop_order)
          .order('stop_order', { ascending: true })
        
        if (error) {
          console.error(`Failed to fetch route stops for ${key}: ${error.message}`)
          continue
        }
        
        validRoutes.push({
          busId: onboarding.bus_id,
          bus: onboarding.buses!,  // Use buses (Supabase table name)
          onboardingStop: onboarding.stops!,  // Use stops (Supabase table name)
          offboardingStop: offboarding.stops!,  // Use stops (Supabase table name)
          onboardingStopOrder: onboarding.stop_order,
          offboardingStopOrder: offboarding.stop_order,
          direction: onboarding.direction,
          routeStops: (allRouteStops || []) as unknown as RouteStopWithDetails[]
        })
      }
    }
    
    return validRoutes
  }
}
