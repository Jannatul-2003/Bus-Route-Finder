"use client"

import { Observable } from "@/lib/observer"
import type { StopWithDistance, Coordinates } from "@/lib/types/database"
import { StopDiscoveryService } from "@/lib/services/StopDiscoveryService"
import { BusRouteService } from "@/lib/services/BusRouteService"
import { DistanceCalculator } from "@/lib/strategies/DistanceCalculator"
import { getSupabaseClient } from "@/lib/supabase/client"
import { BusFilterBuilder } from "@/lib/builders/BusFilterBuilder"
import { EnhancedBusResultFactory } from "@/lib/decorators/EnhancedBusResultFactory"
import type { BusResult, EnhancedBusResult as DecoratorEnhancedBusResult } from "@/lib/decorators/BusResult"

export interface Bus {
  id: string
  name: string
  status: string
}

export interface Stop {
  id: string
  name: string
  latitude: number
  longitude: number
  distance?: number
}

export interface SearchResult {
  busId: string
  busName: string
  stopId: string
  stopName: string
  distance: number
}

export interface PlannedRoute {
  from: Stop
  to: Stop
  buses: Bus[]
}

export interface BusFilters {
  isAC: boolean | null // null = no filter, true = AC only, false = non-AC only
  coachTypes: ('standard' | 'express' | 'luxury')[]
}

export interface EnhancedBusResult extends DecoratorEnhancedBusResult {
  status: string
  routeStops: StopWithDistance[] // all stops between onboarding and offboarding
}

export interface RoutePlannerState {
  // Location inputs
  fromLocation: string
  toLocation: string
  fromCoords: Coordinates | null
  toCoords: Coordinates | null
  
  // Threshold configuration (in meters)
  startingThreshold: number
  destinationThreshold: number | null // null means no threshold
  
  // Discovered stops
  startingStops: StopWithDistance[]
  destinationStops: StopWithDistance[]
  
  // Selected stops
  selectedOnboardingStop: StopWithDistance | null
  selectedOffboardingStop: StopWithDistance | null
  
  // Walking distances (calculated via OSRM, in meters)
  walkingDistanceToOnboarding: number | null
  walkingDistanceFromOffboarding: number | null
  
  // Bus results
  allBuses: EnhancedBusResult[] // Original unfiltered results
  availableBuses: EnhancedBusResult[] // Filtered and sorted results
  
  // Filters
  filters: BusFilters
  sortBy: 'journeyLength' | 'estimatedTime' | 'name'
  sortOrder: 'asc' | 'desc'
  
  // Legacy fields (kept for backward compatibility)
  searchResults: SearchResult[]
  plannedRoute: PlannedRoute | null
  buses: Bus[]
  mapStops: Stop[]
  
  // UI state
  loading: boolean
  error: string | null
  distanceCalculationMethod: 'OSRM' | 'Haversine'
}

const initialState: RoutePlannerState = {
  // Location inputs
  fromLocation: "",
  toLocation: "",
  fromCoords: null,
  toCoords: null,
  
  // Threshold configuration (default 500m)
  startingThreshold: 500,
  destinationThreshold: 500,
  
  // Discovered stops
  startingStops: [],
  destinationStops: [],
  
  // Selected stops
  selectedOnboardingStop: null,
  selectedOffboardingStop: null,
  
  // Walking distances
  walkingDistanceToOnboarding: null,
  walkingDistanceFromOffboarding: null,
  
  // Bus results
  allBuses: [],
  availableBuses: [],
  
  // Filters
  filters: {
    isAC: null,
    coachTypes: []
  },
  sortBy: 'journeyLength',
  sortOrder: 'asc',
  
  // Legacy fields
  searchResults: [],
  plannedRoute: null,
  buses: [],
  mapStops: [],
  
  // UI state
  loading: false,
  error: null,
  distanceCalculationMethod: 'OSRM'
}

class RoutePlannerStore extends Observable<RoutePlannerState> {
  #state: RoutePlannerState
  #isInitialized: boolean
  #stopDiscoveryService: StopDiscoveryService | null = null
  #busRouteService: BusRouteService | null = null
  #distanceCalculator: DistanceCalculator | null = null
  // Performance optimization: Cache for filtered/sorted results
  // Requirements 6.7: Add memoization for expensive calculations
  #filterCache: Map<string, EnhancedBusResult[]> = new Map()

  constructor() {
    super()
    this.#state = { ...initialState }
    this.#isInitialized = false
  }

  /**
   * Lazy initialization of DistanceCalculator
   */
  #getDistanceCalculator(): DistanceCalculator {
    if (!this.#distanceCalculator) {
      this.#distanceCalculator = DistanceCalculator.createDefault(
        process.env.NEXT_PUBLIC_OSRM_BASE_URL || "http://localhost:5000"
      )
    }
    return this.#distanceCalculator
  }

  /**
   * Lazy initialization of StopDiscoveryService
   */
  #getStopDiscoveryService(): StopDiscoveryService {
    if (!this.#stopDiscoveryService) {
      const distanceCalculator = this.#getDistanceCalculator()
      const supabaseClient = getSupabaseClient()
      this.#stopDiscoveryService = new StopDiscoveryService(
        distanceCalculator,
        supabaseClient
      )
    }
    return this.#stopDiscoveryService
  }

  /**
   * Lazy initialization of BusRouteService
   */
  #getBusRouteService(): BusRouteService {
    if (!this.#busRouteService) {
      const distanceCalculator = this.#getDistanceCalculator()
      const supabaseClient = getSupabaseClient()
      this.#busRouteService = new BusRouteService(
        supabaseClient,
        distanceCalculator
      )
    }
    return this.#busRouteService
  }

  getState() {
    return this.#state
  }

  setFromLocation(value: string) {
    this.#setState({ fromLocation: value })
  }

  setToLocation(value: string) {
    this.#setState({ toLocation: value })
  }

  setFromCoords(coords: Coordinates) {
    this.#setState({ fromCoords: coords })
  }

  setToCoords(coords: Coordinates) {
    this.#setState({ toCoords: coords })
  }

  setError(error: string | null) {
    this.#setState({ error })
  }

  /**
   * Set the starting location threshold
   * Validates that the threshold is between 100 and 5000 meters
   * 
   * @param threshold The threshold in meters
   * @throws Error if threshold is invalid
   */
  setStartingThreshold(threshold: number) {
    // Validate threshold range (Requirements 1.3)
    if (threshold < 100 || threshold > 5000) {
      this.#setState({ 
        error: "Threshold must be between 100 and 5000 meters" 
      })
      throw new Error("Threshold must be between 100 and 5000 meters")
    }
    
    this.#setState({ 
      startingThreshold: threshold,
      error: null 
    })
  }

  /**
   * Set the destination location threshold
   * Validates that the threshold is between 100 and 5000 meters, or null for no threshold
   * 
   * @param threshold The threshold in meters, or null for no threshold
   * @throws Error if threshold is invalid
   */
  setDestinationThreshold(threshold: number | null) {
    // Allow null for no threshold (Requirements 1.4)
    if (threshold === null) {
      this.#setState({ 
        destinationThreshold: null,
        error: null 
      })
      return
    }
    
    // Validate threshold range (Requirements 1.3)
    if (threshold < 100 || threshold > 5000) {
      this.#setState({ 
        error: "Threshold must be between 100 and 5000 meters" 
      })
      throw new Error("Threshold must be between 100 and 5000 meters")
    }
    
    this.#setState({ 
      destinationThreshold: threshold,
      error: null 
    })
  }

  /**
   * Discover stops near a location using the configured threshold
   * 
   * @param location The reference location coordinates
   * @param threshold The threshold distance in meters
   * @param isStarting Whether this is for the starting location (true) or destination (false)
   */
  async discoverStopsNearLocation(
    location: Coordinates,
    threshold: number,
    isStarting: boolean
  ): Promise<void> {
    console.log("[RoutePlannerStore] discoverStopsNearLocation called:", { location, threshold, isStarting })
    
    // Validate threshold before making the call (Requirements 1.3)
    if (threshold < 100 || threshold > 5000) {
      console.log("[RoutePlannerStore] Invalid threshold:", threshold)
      this.#setState({ 
        error: "Threshold must be between 100 and 5000 meters" 
      })
      return
    }

    this.#setState({ loading: true, error: null })

    try {
      const service = this.#getStopDiscoveryService()
      console.log("[RoutePlannerStore] StopDiscoveryService obtained, calling discoverStops...")
      
      // Discover stops within threshold (Requirements 2.1, 2.2)
      const discoveredStops = await service.discoverStops(location, threshold)
      console.log("[RoutePlannerStore] Discovered stops:", discoveredStops.length, discoveredStops)
      
      // Determine if OSRM or Haversine was used
      const distanceMethod = discoveredStops.length > 0 
        ? discoveredStops[0].distanceMethod 
        : 'OSRM'
      
      console.log("[RoutePlannerStore] Distance method:", distanceMethod)
      
      // Group stops by starting vs destination (Requirements 2.5)
      if (isStarting) {
        console.log("[RoutePlannerStore] Setting starting stops:", discoveredStops.length)
        this.#setState({
          startingStops: discoveredStops,
          distanceCalculationMethod: distanceMethod,
          loading: false
        })
      } else {
        console.log("[RoutePlannerStore] Setting destination stops:", discoveredStops.length)
        this.#setState({
          destinationStops: discoveredStops,
          distanceCalculationMethod: distanceMethod,
          loading: false
        })
      }
      
      // Notify user if Haversine fallback was used (Requirements 2.3)
      if (distanceMethod === 'Haversine') {
        this.#setState({
          error: "OSRM unavailable. Using approximate straight-line distances."
        })
      }
    } catch (error) {
      console.error("[RoutePlannerStore] Error discovering stops:", error)
      this.#setState({
        loading: false,
        error: `Failed to discover stops: ${error instanceof Error ? error.message : String(error)}`
      })
    }
  }

  /**
   * Select an onboarding stop and calculate walking distance from starting location
   * Requirements 3.3: Highlight selection and enable offboarding stop selection
   * Requirements 3.4: Calculate and display distance from starting location to onboarding stop
   * 
   * @param stop The stop to select as onboarding point
   */
  async selectOnboardingStop(stop: StopWithDistance): Promise<void> {
    console.log("[RoutePlannerStore] selectOnboardingStop called:", stop.name, "distance:", stop.distance)
    
    // Requirement 3.3: Highlight the selection
    // Requirement 3.4: Use the already-calculated distance from the stop discovery
    // The stop.distance field already contains the walking distance in meters
    // Only set walking distance if we have starting coordinates
    const walkingDistance = this.#state.fromCoords ? stop.distance : null
    
    this.#setState({
      selectedOnboardingStop: stop,
      walkingDistanceToOnboarding: walkingDistance,
      loading: false,
      error: null
    })
    
    console.log("[RoutePlannerStore] Onboarding stop selected, walking distance:", walkingDistance, "meters")
  }

  /**
   * Select an offboarding stop and calculate walking distance to destination location
   * Requirements 3.5: Calculate and display distance from offboarding stop to destination
   * Requirements 3.6: Enable bus route search when both stops are selected
   * 
   * @param stop The stop to select as offboarding point
   */
  async selectOffboardingStop(stop: StopWithDistance): Promise<void> {
    console.log("[RoutePlannerStore] selectOffboardingStop called:", stop.name, "distance:", stop.distance)
    
    // Highlight the selection
    // Requirement 3.5: Use the already-calculated distance from the stop discovery
    // The stop.distance field already contains the walking distance in meters
    // Only set walking distance if we have destination coordinates
    const walkingDistance = this.#state.toCoords ? stop.distance : null
    
    this.#setState({
      selectedOffboardingStop: stop,
      walkingDistanceFromOffboarding: walkingDistance,
      loading: false,
      error: null
    })
    
    console.log("[RoutePlannerStore] Offboarding stop selected, walking distance:", walkingDistance, "meters")
    
    // Requirement 3.6: Both stops are now selected, bus route search can be enabled
    // The UI can check if both selectedOnboardingStop and selectedOffboardingStop are non-null
  }

  /**
   * Search for buses that serve the selected onboarding and offboarding stops
   * Requirements 4.1: Query buses that serve both stops in correct order
   * Requirements 4.2: Verify onboarding stop appears before offboarding stop
   * Requirements 4.5: Show only active buses
   * 
   * This method integrates BusRouteService and EnhancedBusResultFactory to:
   * 1. Find valid bus routes between selected stops
   * 2. Calculate journey lengths
   * 3. Decorate results with computed properties
   * 4. Apply filters and sorting
   */
  async searchBusesForRoute(): Promise<void> {
    console.log("[RoutePlannerStore] searchBusesForRoute called")
    console.log("[RoutePlannerStore] Selected stops:", {
      onboarding: this.#state.selectedOnboardingStop?.name,
      offboarding: this.#state.selectedOffboardingStop?.name
    })
    
    // Validate that both stops are selected
    if (!this.#state.selectedOnboardingStop || !this.#state.selectedOffboardingStop) {
      console.log("[RoutePlannerStore] Missing stop selection")
      this.#setState({
        error: "Please select both onboarding and offboarding stops"
      })
      return
    }

    // Validate that walking distances are calculated
    console.log("[RoutePlannerStore] Walking distances:", {
      toOnboarding: this.#state.walkingDistanceToOnboarding,
      fromOffboarding: this.#state.walkingDistanceFromOffboarding
    })
    
    if (this.#state.walkingDistanceToOnboarding === null || 
        this.#state.walkingDistanceFromOffboarding === null) {
      console.log("[RoutePlannerStore] Walking distances not calculated")
      this.#setState({
        error: "Walking distances not calculated. Please reselect stops."
      })
      return
    }

    this.#setState({ loading: true, error: null })

    try {
      const busRouteService = this.#getBusRouteService()
      console.log("[RoutePlannerStore] BusRouteService obtained, finding bus routes...")
      console.log("[RoutePlannerStore] Stop IDs:", {
        onboarding: this.#state.selectedOnboardingStop.id,
        offboarding: this.#state.selectedOffboardingStop.id
      })
      
      // Find buses that serve both stops (Requirements 4.1, 4.2)
      const busRoutes = await busRouteService.findBusRoutes(
        this.#state.selectedOnboardingStop.id,
        this.#state.selectedOffboardingStop.id
      )
      
      console.log("[RoutePlannerStore] Found bus routes:", busRoutes.length)

      // Requirement 4.3: Handle no buses found
      if (busRoutes.length === 0) {
        this.#setState({
          availableBuses: [],
          loading: false,
          error: "No direct bus routes available between the selected stops"
        })
        return
      }

      // Create enhanced bus results with all computed properties
      const enhancedBuses: EnhancedBusResult[] = []

      for (const route of busRoutes) {
        // Calculate journey length (Requirement 5.1)
        const journeyLength = await busRouteService.calculateJourneyLength(
          route.busId,
          route.onboardingStopOrder,
          route.offboardingStopOrder,
          route.direction
        )

        // Create base bus result
        const baseBusResult: BusResult = {
          id: route.bus.id,
          name: route.bus.name,
          isAC: route.bus.is_ac,
          coachType: route.bus.coach_type,
          onboardingStop: {
            id: route.onboardingStop.id,
            name: route.onboardingStop.name,
            latitude: route.onboardingStop.latitude,
            longitude: route.onboardingStop.longitude
          },
          offboardingStop: {
            id: route.offboardingStop.id,
            name: route.offboardingStop.name,
            latitude: route.offboardingStop.latitude,
            longitude: route.offboardingStop.longitude
          }
        }

        // Use EnhancedBusResultFactory to decorate with computed properties
        const decoratedResult = EnhancedBusResultFactory.create(
          baseBusResult,
          journeyLength,
          this.#state.walkingDistanceToOnboarding! / 1000, // convert meters to km
          this.#state.walkingDistanceFromOffboarding! / 1000 // convert meters to km
        )

        // Add store-specific properties
        const enhanced: EnhancedBusResult = {
          ...decoratedResult,
          status: route.bus.status,
          routeStops: route.routeStops.map(rs => ({
            id: (rs as any).stops?.id || rs.stops?.id || '',
            name: (rs as any).stops?.name || rs.stops?.name || '',
            latitude: (rs as any).stops?.latitude || rs.stops?.latitude || 0,
            longitude: (rs as any).stops?.longitude || rs.stops?.longitude || 0,
            accessible: (rs as any).stops?.accessible || rs.stops?.accessible || false,
            created_at: (rs as any).stops?.created_at || rs.stops?.created_at || '',
            distance: 0, // Distance from reference point not applicable here
            distanceMethod: 'OSRM' as const
          }))
        }

        enhancedBuses.push(enhanced)
      }

      // Apply filters and sorting
      const filteredAndSorted = this.#applyFiltersAndSort(enhancedBuses)

      this.#setState({
        allBuses: enhancedBuses, // Store original unfiltered results
        availableBuses: filteredAndSorted,
        loading: false
      })
    } catch (error) {
      console.error("[RoutePlannerStore] Error searching buses:", error)
      this.#setState({
        loading: false,
        error: `Failed to search buses: ${error instanceof Error ? error.message : String(error)}`
      })
    }
  }

  /**
   * Apply filters and sorting to bus results
   * Requirements 6.2, 6.3, 6.4, 6.5: Apply filters
   * Requirements 6.7: Apply sorting
   * Performance: Memoized to avoid redundant calculations
   * 
   * @param buses Array of enhanced bus results
   * @returns Filtered and sorted array of bus results
   */
  #applyFiltersAndSort(buses: EnhancedBusResult[]): EnhancedBusResult[] {
    // Create cache key based on filter and sort state
    const cacheKey = `filtered_buses_${JSON.stringify({
      isAC: this.#state.filters.isAC,
      coachTypes: this.#state.filters.coachTypes,
      sortBy: this.#state.sortBy,
      sortOrder: this.#state.sortOrder,
      busIds: buses.map(b => b.id).join(',')
    })}`

    // Check cache first (Requirements 6.7: Optimize filter performance)
    const cached = this.#filterCache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Build filter using BusFilterBuilder
    const filterBuilder = new BusFilterBuilder()

    // Apply AC filter (Requirements 6.2, 6.3)
    if (this.#state.filters.isAC !== null) {
      filterBuilder.withAC(this.#state.filters.isAC)
    }

    // Apply coach type filter (Requirement 6.4)
    if (this.#state.filters.coachTypes.length > 0) {
      filterBuilder.withCoachTypes(this.#state.filters.coachTypes)
    }

    // Apply filters (Requirement 6.5: Multiple filters with AND logic)
    let filtered = filterBuilder.apply(buses)

    // Apply sorting (Requirement 6.7)
    filtered = this.#sortBuses(filtered)

    // Cache the result
    this.#filterCache.set(cacheKey, filtered)

    return filtered
  }

  /**
   * Sort buses by the configured sort criteria
   * Requirement 6.7: Sort by journey length, estimated time, or name
   * 
   * @param buses Array of bus results to sort
   * @returns Sorted array of bus results
   */
  #sortBuses(buses: EnhancedBusResult[]): EnhancedBusResult[] {
    const sorted = [...buses]

    sorted.sort((a, b) => {
      let comparison = 0

      switch (this.#state.sortBy) {
        case 'journeyLength':
          comparison = a.journeyLength - b.journeyLength
          break
        case 'estimatedTime':
          comparison = a.estimatedTotalTime - b.estimatedTotalTime
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
      }

      // Apply sort order
      return this.#state.sortOrder === 'asc' ? comparison : -comparison
    })

    return sorted
  }

  /**
   * Set AC filter
   * Requirement 6.2, 6.3: Filter by AC/Non-AC
   * 
   * @param isAC true for AC only, false for non-AC only, null for no filter
   */
  setACFilter(isAC: boolean | null): void {
    // Clear filter cache when filters change
    this.#filterCache.clear()
    
    this.#setState({
      filters: {
        ...this.#state.filters,
        isAC
      }
    })

    // Re-apply filters to original unfiltered results
    if (this.#state.allBuses.length > 0) {
      const filteredAndSorted = this.#applyFiltersAndSort(this.#state.allBuses)
      this.#setState({ availableBuses: filteredAndSorted })
    }
  }

  /**
   * Set coach type filter
   * Requirement 6.4: Filter by coach type
   * 
   * @param coachTypes Array of coach types to include
   */
  setCoachTypeFilter(coachTypes: ('standard' | 'express' | 'luxury')[]): void {
    // Clear filter cache when filters change
    this.#filterCache.clear()
    
    this.#setState({
      filters: {
        ...this.#state.filters,
        coachTypes
      }
    })

    // Re-apply filters to original unfiltered results
    if (this.#state.allBuses.length > 0) {
      const filteredAndSorted = this.#applyFiltersAndSort(this.#state.allBuses)
      this.#setState({ availableBuses: filteredAndSorted })
    }
  }

  /**
   * Clear all filters (AC and coach type)
   * Resets filters to default state
   */
  clearAllFilters(): void {
    // Clear filter cache
    this.#filterCache.clear()
    
    this.#setState({
      filters: {
        isAC: null,
        coachTypes: []
      }
    })

    // Re-apply filters (which are now cleared) to original unfiltered results
    if (this.#state.allBuses.length > 0) {
      const filteredAndSorted = this.#applyFiltersAndSort(this.#state.allBuses)
      this.#setState({ availableBuses: filteredAndSorted })
    }
  }

  /**
   * Set sort criteria
   * Requirement 6.7: Sort by journey length, estimated time, or name
   * 
   * @param sortBy The field to sort by
   */
  setSortBy(sortBy: 'journeyLength' | 'estimatedTime' | 'name'): void {
    // Clear filter cache when sort changes
    this.#filterCache.clear()
    
    this.#setState({ sortBy })

    // Re-apply sorting to original unfiltered results
    if (this.#state.allBuses.length > 0) {
      const filteredAndSorted = this.#applyFiltersAndSort(this.#state.allBuses)
      this.#setState({ availableBuses: filteredAndSorted })
    }
  }

  /**
   * Set sort order
   * Requirement 6.7: Sort in ascending or descending order
   * 
   * @param sortOrder 'asc' for ascending, 'desc' for descending
   */
  setSortOrder(sortOrder: 'asc' | 'desc'): void {
    // Clear filter cache when sort order changes
    this.#filterCache.clear()
    
    this.#setState({ sortOrder })

    // Re-apply sorting to original unfiltered results
    if (this.#state.allBuses.length > 0) {
      const filteredAndSorted = this.#applyFiltersAndSort(this.#state.allBuses)
      this.#setState({ availableBuses: filteredAndSorted })
    }
  }

  async ensureInitialized() {
    if (this.#isInitialized) return
    this.#isInitialized = true
    await this.#fetchActiveBuses()
  }

  /**
   * Handle geolocation request
   * Requirements 8.4: Handle geolocation permission denial gracefully
   */
  handleGetLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      this.#setState({ 
        error: "Geolocation is not supported in this browser. Please enter your location manually." 
      })
      return
    }

    this.#setState({ loading: true, error: null })

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.#setState({
          fromLocation: "Current Location",
          fromCoords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          loading: false,
          error: null,
        })
      },
      (error) => {
        console.error("[RoutePlannerStore] Geolocation error:", error)
        
        // Requirement 8.4: Handle geolocation permission denial with specific messages
        let errorMessage = "Unable to get your current location. "
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Location permission was denied. Please enable location access in your browser settings or enter your location manually."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable. Please try again or enter your location manually."
            break
          case error.TIMEOUT:
            errorMessage += "Location request timed out. Please try again or enter your location manually."
            break
          default:
            errorMessage += "Please enter your location manually."
            break
        }
        
        this.#setState({ 
          loading: false,
          error: errorMessage 
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 second timeout
        maximumAge: 0
      }
    )
  }

  async searchRoutes() {
    if (!this.#state.toLocation) return

    this.#setState({ loading: true, error: null })

    try {
      let searchCoords = this.#state.fromCoords

      if (!searchCoords && this.#state.fromLocation && this.#state.fromLocation !== "Current Location") {
        try {
          const fromStops = await this.#safeJsonFetch(
            `/api/stops/search?q=${encodeURIComponent(this.#state.fromLocation)}`,
          )

          if (!fromStops || fromStops.length === 0) {
            this.#setState({
              error: "Starting location not found. Please use 'Current Location' or enter a valid stop name",
            })
            return
          }

          searchCoords = {
            lat: fromStops[0].latitude,
            lng: fromStops[0].longitude,
          }
          this.#setState({ fromCoords: searchCoords })
        } catch (error) {
          console.error("[v0] Error fetching from location:", error)
          this.#setState({
            error: "Could not find starting location. Please try 'Current Location' instead",
          })
          return
        }
      }

      if (!searchCoords || searchCoords.lat === 0 || searchCoords.lng === 0) {
        this.#setState({
          error: "Please use 'Current Location' button or enter a valid stop name",
        })
        return
      }

      const stops = await this.#safeJsonFetch(`/api/stops/search?q=${encodeURIComponent(this.#state.toLocation)}`)

      if (!stops || stops.length === 0) {
        this.#setState({ error: "No stops found for that destination" })
        return
      }

      const destinationStop = stops[0]
      this.#setState({ mapStops: [destinationStop] })

      const servingBuses = await this.#safeJsonFetch(`/api/route-stops/by-stop?stop_id=${destinationStop.id}`)

      if (!servingBuses || servingBuses.length === 0) {
        this.#setState({ error: "No buses serve this destination" })
        return
      }

      const results: SearchResult[] = []

      for (const bus of servingBuses) {
        try {
          const closestStop = await this.#safeJsonFetch(
            `/api/route-stops/closest?bus_id=${bus.id}&latitude=${searchCoords.lat}&longitude=${searchCoords.lng}`,
          )

          if (closestStop && closestStop.id) {
            results.push({
              busId: bus.id,
              busName: bus.name,
              stopId: closestStop.id,
              stopName: closestStop.name,
              distance: closestStop.distance,
            })
          }
        } catch (error) {
          console.error("[v0] Error finding closest stop for bus:", error)
        }
      }

      results.sort((a, b) => a.distance - b.distance)
      this.#setState({ searchResults: results })
    } catch (error) {
      console.error("[v0] Error searching routes:", error)
      this.#setState({ error: `Error searching routes: ${String(error)}` })
    } finally {
      this.#setState({ loading: false })
    }
  }

  async selectResult(result: SearchResult) {
    this.#setState({ toLocation: result.stopName })

    try {
      const stops = await this.#safeJsonFetch(`/api/stops/search?q=${encodeURIComponent(result.stopName)}`)
      if (stops && stops.length > 0) {
        const stop = stops[0]
        this.#setState({ mapStops: [stop] })

        if (this.#state.fromCoords) {
          const bus = this.#state.buses.find((b) => b.id === result.busId)
          if (bus) {
            this.#setState({
              plannedRoute: {
                from: {
                  id: "current",
                  name: this.#state.fromLocation,
                  latitude: this.#state.fromCoords.lat,
                  longitude: this.#state.fromCoords.lng,
                },
                to: stop,
                buses: [bus],
              },
            })
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error handling result click:", error)
      this.#setState({ error: `Error loading stop details: ${String(error)}` })
    }
  }

  reset() {
    this.#state = { ...initialState }
    this.#isInitialized = false
    this.notify(this.#state)
  }

  #setState(partial: Partial<RoutePlannerState>) {
    this.#state = { ...this.#state, ...partial }
    this.notify(this.#state)
  }

  async #fetchActiveBuses() {
    try {
      const response = await fetch("/api/buses")
      if (!response.ok) {
        const text = await response.text()
        throw new Error(`API error: ${response.status} - ${text}`)
      }
      const data = await response.json()
      this.#setState({ buses: data.filter((b: Bus) => b.status === "active") })
    } catch (error) {
      console.error("[v0] Error fetching buses:", error)
      this.#setState({
        error: "Failed to load buses. Please check your Supabase configuration.",
      })
    }
  }

  async #safeJsonFetch(url: string) {
    const response = await fetch(url)
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`API error: ${response.status} - ${text}`)
    }
    return response.json()
  }
}

export const routePlannerStore = new RoutePlannerStore()

