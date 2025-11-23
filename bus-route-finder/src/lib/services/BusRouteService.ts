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
 */
export interface RouteStopWithDetails extends RouteStop {
  bus?: Bus
  stop?: Stop
}

/**
 * Service for finding and analyzing bus routes
 * 
 * This service handles querying buses that serve specific stops,
 * calculating journey lengths, and validating route ordering.
 */
export class BusRouteService {
  constructor(
    private supabaseClient: SupabaseClient,
    private distanceCalculator: DistanceCalculator
  ) {}

  /**
   * Find buses that serve both onboarding and offboarding stops
   * 
   * @param onboardingStopId The stop where user boards the bus
   * @param offboardingStopId The stop where user exits the bus
   * @returns Promise resolving to array of valid bus routes
   * @throws Error if database query fails
   */
  async findBusRoutes(
    onboardingStopId: string,
    offboardingStopId: string
  ): Promise<BusRoute[]> {
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
        created_at,
        updated_at,
        buses (
          id,
          name,
          status,
          is_ac,
          coach_type,
          created_at,
          updated_at
        ),
        stops (
          id,
          name,
          latitude,
          longitude,
          accessible,
          created_at
        )
      `)
      .in('stop_id', [onboardingStopId, offboardingStopId])
      .eq('buses.status', 'active')
    
    if (error) {
      throw new Error(`Failed to fetch bus routes: ${error.message}`)
    }
    
    if (!routes || routes.length === 0) {
      return []
    }
    
    // Filter for valid routes where onboarding comes before offboarding
    const validRoutes = await this.filterValidRoutes(
      routes as RouteStopWithDetails[],
      onboardingStopId,
      offboardingStopId
    )
    
    return validRoutes
  }

  /**
   * Calculate journey length from pre-calculated segment distances
   * 
   * @param busId The bus ID
   * @param onboardingStopOrder The stop order of onboarding stop
   * @param offboardingStopOrder The stop order of offboarding stop
   * @param direction The route direction
   * @returns Promise resolving to journey length in kilometers
   * @throws Error if database query fails
   */
  async calculateJourneyLength(
    busId: string,
    onboardingStopOrder: number,
    offboardingStopOrder: number,
    direction: 'outbound' | 'inbound'
  ): Promise<number> {
    // Fetch all segments between onboarding and offboarding stops
    const { data: segments, error } = await this.supabaseClient
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
    
    if (!segments || segments.length === 0) {
      return 0
    }
    
    // Calculate total distance, handling missing distance_to_next values
    let totalDistance = 0
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      
      if (segment.distance_to_next !== null && segment.distance_to_next !== undefined) {
        // Use pre-calculated distance
        totalDistance += segment.distance_to_next
      } else {
        // Fallback: calculate using OSRM
        console.warn(
          `Missing distance_to_next for bus ${busId}, stop_order ${segment.stop_order}. ` +
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
              const distances = await this.distanceCalculator.calculateDistances(
                [{ lat: currentStop.latitude, lng: currentStop.longitude }],
                [{ lat: nextStop.latitude, lng: nextStop.longitude }]
              )
              
              totalDistance += distances[0][0].distance
            } catch (calcError) {
              console.error(
                `Failed to calculate distance for segment ${segment.stop_order}: ${calcError}`
              )
              // Continue without adding distance for this segment
            }
          }
        }
      }
    }
    
    return totalDistance
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
    // Group by bus_id and direction
    const grouped = new Map<string, RouteStopWithDetails[]>()
    
    routes.forEach(route => {
      const key = `${route.bus_id}-${route.direction}`
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(route)
    })
    
    // Filter routes where onboarding comes before offboarding
    const validRoutes: BusRoute[] = []
    
    for (const [key, routeStops] of grouped.entries()) {
      const onboarding = routeStops.find(r => r.stop_id === onboardingStopId)
      const offboarding = routeStops.find(r => r.stop_id === offboardingStopId)
      
      if (onboarding && offboarding && 
          onboarding.stop_order < offboarding.stop_order &&
          onboarding.bus && onboarding.stop &&
          offboarding.stop) {
        
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
            created_at,
            updated_at,
            stops (
              id,
              name,
              latitude,
              longitude,
              accessible,
              created_at
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
          bus: onboarding.bus,
          onboardingStop: onboarding.stop,
          offboardingStop: offboarding.stop,
          onboardingStopOrder: onboarding.stop_order,
          offboardingStopOrder: offboarding.stop_order,
          direction: onboarding.direction,
          routeStops: (allRouteStops || []) as RouteStopWithDetails[]
        })
      }
    }
    
    return validRoutes
  }
}
