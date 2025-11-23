# Design Document

## Overview

This design document outlines the technical architecture for an enhanced bus route planning system for Dhaka city. The system enables users to find optimal bus routes by discovering stops within configurable threshold distances, selecting onboarding/offboarding stops, and filtering buses by amenities. The design emphasizes modern, beautiful, and concise UI/UX while leveraging design patterns (Strategy, Decorator, Builder, Observer) for maintainability and extensibility.

The system integrates OSRM for accurate road-network distance calculations, uses Supabase for data persistence with pre-calculated inter-stop distances, and provides real-time filtering and sorting capabilities.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Route Planner   │  │   Map Component  │                │
│  │   UI Component   │  │   (Leaflet/Map)  │                │
│  └────────┬─────────┘  └────────┬─────────┘                │
│           │                     │                            │
│           └──────────┬──────────┘                            │
│                      │                                       │
└──────────────────────┼───────────────────────────────────────┘
                       │
┌──────────────────────┼───────────────────────────────────────┐
│                 Business Logic Layer                         │
│                      │                                       │
│  ┌───────────────────▼────────────────────┐                 │
│  │   RoutePlannerStore (Observable)       │                 │
│  │   - State Management                   │                 │
│  │   - Business Logic Orchestration       │                 │
│  └───┬────────────────────────────────┬───┘                 │
│      │                                │                     │
│  ┌───▼──────────────┐    ┌───────────▼──────────┐          │
│  │  StopDiscovery   │    │  BusFilterBuilder    │          │
│  │  Service         │    │  (Builder Pattern)   │          │
│  └───┬──────────────┘    └──────────────────────┘          │
│      │                                                       │
│  ┌───▼──────────────────────────────────┐                   │
│  │   DistanceCalculator (Strategy)      │                   │
│  │   - OSRMStrategy (Primary)           │                   │
│  │   - HaversineStrategy (Fallback)     │                   │
│  └───┬──────────────────────────────────┘                   │
│      │                                                       │
└──────┼───────────────────────────────────────────────────────┘
       │
┌──────┼───────────────────────────────────────────────────────┐
│  Data Access Layer                                           │
│      │                                                       │
│  ┌───▼──────────────┐    ┌──────────────────┐              │
│  │  Supabase Client │    │   OSRM Service   │              │
│  │  - Buses         │    │   (Dhaka Map)    │              │
│  │  - Stops         │    └──────────────────┘              │
│  │  - RouteStops    │                                       │
│  └──────────────────┘                                       │
└──────────────────────────────────────────────────────────────┘
```

### Design Patterns Used

1. **Strategy Pattern**: Distance calculation with OSRM and Haversine strategies (already implemented)
2. **Observer Pattern**: State management for reactive UI updates (already implemented)
3. **Decorator Pattern**: Enhancing bus results with additional computed properties (journey length, walking distances)
4. **Builder Pattern**: Constructing complex bus filter queries with chainable methods
5. **Facade Pattern**: Simplifying complex stop discovery and route calculation operations

## Components and Interfaces

### 1. Frontend Components

#### RoutePlannerPage Component (Modern UI)

A modern, clean interface with the following layout:

```
┌─────────────────────────────────────────────────────────────┐
│  🚌 Dhaka Bus Route Planner                    [Dark Mode]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────┐  ┌────────────────────────────┐│
│  │  📍 Starting Location  │  │  🎯 Destination Location   ││
│  │  [Input with autocomplete] [Input with autocomplete]   ││
│  │  📏 Threshold: 500m ▼  │  │  📏 Threshold: 500m ▼     ││
│  │  [Get Current Location]│  │  [ ] No threshold          ││
│  └────────────────────────┘  └────────────────────────────┘│
│                                                              │
│  [Search Stops] ──────────────────────────────────────────  │
│                                                              │
├──────────────────────────┬───────────────────────────────────┤
│  📍 Nearby Stops         │  🗺️ Map View                    │
│  (Starting Location)     │                                   │
│  ┌────────────────────┐  │   [Interactive Map showing:      │
│  │ ✓ Stop A  (250m)   │  │    - Starting location marker    │
│  │   Stop B  (450m)   │  │    - Destination marker          │
│  │   Stop C  (480m)   │  │    - Discovered stops            │
│  └────────────────────┘  │    - Selected route]             │
│                          │                                   │
│  🎯 Nearby Stops         │                                   │
│  (Destination)           │                                   │
│  ┌────────────────────┐  │                                   │
│  │   Stop X  (300m)   │  │                                   │
│  │ ✓ Stop Y  (420m)   │  │                                   │
│  │   Stop Z  (500m)   │  │                                   │
│  └────────────────────┘  │                                   │
├──────────────────────────┴───────────────────────────────────┤
│  🚌 Available Buses                                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Filters: [❄️ AC] [🚌 Non-AC] [⭐ Express] [🎫 Standard] ││
│  │ Sort by: [Journey Length ▼]                             ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🚌 Bus #42 - Express AC                    2.5 km       ││
│  │ Stop A → Stop B → Stop C → Stop Y                       ││
│  │ 🚶 Walk: 250m → 🚌 Ride: 2.5km → 🚶 Walk: 420m         ││
│  │ ⏱️ Est. Time: 15 min                    [Select Route] ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🚌 Bus #15 - Standard Non-AC               3.2 km       ││
│  │ Stop A → Stop D → Stop E → Stop Y                       ││
│  │ 🚶 Walk: 250m → 🚌 Ride: 3.2km → 🚶 Walk: 420m         ││
│  │ ⏱️ Est. Time: 20 min                    [Select Route] ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Design Principles:**
- Clean, card-based layout with subtle shadows
- Responsive grid system (2-column on desktop, stacked on mobile)
- Color-coded elements (green for selected, blue for available, gray for inactive)
- Icon-driven UI for quick visual recognition
- Smooth transitions and micro-interactions
- Accessible with proper ARIA labels and keyboard navigation

#### StopSelectionCard Component
Displays discovered stops with:
- Stop name and distance badge
- Selection state (checkbox or radio)
- Distance indicator with color coding (green < 300m, yellow < 600m, orange > 600m)
- Hover effects and smooth transitions

#### BusResultCard Component
Enhanced bus display with:
- Bus name, type badges (AC/Non-AC, Express/Standard)
- Journey length prominently displayed
- Route visualization (stop sequence)
- Walking distances at both ends
- Estimated time
- Expandable details section

### 2. State Management

#### Enhanced RoutePlannerState

```typescript
interface RoutePlannerState {
  // Location inputs
  fromLocation: string
  toLocation: string
  fromCoords: Coordinates | null
  toCoords: Coordinates | null
  
  // Threshold configuration
  startingThreshold: number // in meters, default 500
  destinationThreshold: number | null // null means no threshold
  
  // Discovered stops
  startingStops: StopWithDistance[]
  destinationStops: StopWithDistance[]
  
  // Selected stops
  selectedOnboardingStop: StopWithDistance | null
  selectedOffboardingStop: StopWithDistance | null
  
  // Walking distances (calculated via OSRM)
  walkingDistanceToOnboarding: number | null
  walkingDistanceFromOffboarding: number | null
  
  // Bus results
  availableBuses: EnhancedBusResult[]
  
  // Filters
  filters: BusFilters
  sortBy: 'journeyLength' | 'estimatedTime' | 'name'
  sortOrder: 'asc' | 'desc'
  
  // UI state
  loading: boolean
  error: string | null
  distanceCalculationMethod: 'OSRM' | 'Haversine'
}

interface StopWithDistance {
  id: string
  name: string
  latitude: number
  longitude: number
  distance: number // distance from reference point
  distanceMethod: 'OSRM' | 'Haversine'
}

interface EnhancedBusResult {
  id: string
  name: string
  isAC: boolean
  coachType: 'standard' | 'express' | 'luxury'
  status: string
  
  // Route information
  onboardingStop: Stop
  offboardingStop: Stop
  routeStops: Stop[] // all stops between onboarding and offboarding
  
  // Calculated distances
  journeyLength: number // sum of segment distances
  walkingDistanceToOnboarding: number
  walkingDistanceFromOffboarding: number
  totalDistance: number // walking + journey
  
  // Time estimates
  estimatedJourneyTime: number // in minutes
  estimatedTotalTime: number // including walking
}

interface BusFilters {
  isAC: boolean | null // null = no filter, true = AC only, false = non-AC only
  coachTypes: ('standard' | 'express' | 'luxury')[]
}
```

### 3. Service Layer

#### StopDiscoveryService

Responsible for finding stops within threshold distances:

```typescript
class StopDiscoveryService {
  constructor(
    private distanceCalculator: DistanceCalculator,
    private supabaseClient: SupabaseClient
  ) {}
  
  /**
   * Discover stops within threshold of a location
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
    
    // 3. Filter stops within threshold
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
  
  private async fetchAllStops(): Promise<Stop[]> {
    const { data, error } = await this.supabaseClient
      .from('stops')
      .select('*')
    
    if (error) throw error
    return data
  }
}
```

#### BusRouteService

Handles bus route queries and journey calculations:

```typescript
class BusRouteService {
  constructor(
    private supabaseClient: SupabaseClient,
    private distanceCalculator: DistanceCalculator
  ) {}
  
  /**
   * Find buses that serve both onboarding and offboarding stops
   */
  async findBusRoutes(
    onboardingStopId: string,
    offboardingStopId: string
  ): Promise<BusRoute[]> {
    // Query route_stops to find buses serving both stops
    const { data: routes, error } = await this.supabaseClient
      .from('route_stops')
      .select(`
        bus_id,
        stop_id,
        stop_order,
        direction,
        distance_to_next,
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
          longitude
        )
      `)
      .in('stop_id', [onboardingStopId, offboardingStopId])
      .eq('buses.status', 'active')
    
    if (error) throw error
    
    // Group by bus and direction, filter for valid routes
    const validRoutes = this.filterValidRoutes(routes, onboardingStopId, offboardingStopId)
    
    return validRoutes
  }
  
  /**
   * Calculate journey length from pre-calculated segment distances
   */
  async calculateJourneyLength(
    busId: string,
    onboardingStopOrder: number,
    offboardingStopOrder: number,
    direction: string
  ): Promise<number> {
    const { data: segments, error } = await this.supabaseClient
      .from('route_stops')
      .select('distance_to_next')
      .eq('bus_id', busId)
      .eq('direction', direction)
      .gte('stop_order', onboardingStopOrder)
      .lt('stop_order', offboardingStopOrder)
      .order('stop_order', { ascending: true })
    
    if (error) throw error
    
    // Sum all segment distances
    const totalDistance = segments.reduce(
      (sum, segment) => sum + (segment.distance_to_next || 0),
      0
    )
    
    return totalDistance
  }
  
  private filterValidRoutes(
    routes: any[],
    onboardingStopId: string,
    offboardingStopId: string
  ): BusRoute[] {
    // Group by bus_id and direction
    const grouped = new Map<string, any[]>()
    
    routes.forEach(route => {
      const key = `${route.bus_id}-${route.direction}`
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(route)
    })
    
    // Filter routes where onboarding comes before offboarding
    const validRoutes: BusRoute[] = []
    
    grouped.forEach((routeStops, key) => {
      const onboarding = routeStops.find(r => r.stop_id === onboardingStopId)
      const offboarding = routeStops.find(r => r.stop_id === offboardingStopId)
      
      if (onboarding && offboarding && onboarding.stop_order < offboarding.stop_order) {
        validRoutes.push({
          busId: onboarding.bus_id,
          bus: onboarding.buses,
          onboardingStop: onboarding.stops,
          offboardingStop: offboarding.stops,
          onboardingStopOrder: onboarding.stop_order,
          offboardingStopOrder: offboarding.stop_order,
          direction: onboarding.direction
        })
      }
    })
    
    return validRoutes
  }
}
```

### 4. Design Pattern Implementations

#### Decorator Pattern: BusResultDecorator

Enhances basic bus results with computed properties:

```typescript
/**
 * Base interface for bus results
 */
interface BusResult {
  id: string
  name: string
  isAC: boolean
  coachType: string
  onboardingStop: Stop
  offboardingStop: Stop
}

/**
 * Base decorator
 */
abstract class BusResultDecorator implements BusResult {
  constructor(protected busResult: BusResult) {}
  
  get id() { return this.busResult.id }
  get name() { return this.busResult.name }
  get isAC() { return this.busResult.isAC }
  get coachType() { return this.busResult.coachType }
  get onboardingStop() { return this.busResult.onboardingStop }
  get offboardingStop() { return this.busResult.offboardingStop }
}

/**
 * Decorator that adds journey length calculation
 */
class JourneyLengthDecorator extends BusResultDecorator {
  constructor(
    busResult: BusResult,
    private journeyLength: number
  ) {
    super(busResult)
  }
  
  getJourneyLength(): number {
    return this.journeyLength
  }
}

/**
 * Decorator that adds walking distances
 */
class WalkingDistanceDecorator extends BusResultDecorator {
  constructor(
    busResult: BusResult,
    private walkingToOnboarding: number,
    private walkingFromOffboarding: number
  ) {
    super(busResult)
  }
  
  getWalkingDistanceToOnboarding(): number {
    return this.walkingToOnboarding
  }
  
  getWalkingDistanceFromOffboarding(): number {
    return this.walkingFromOffboarding
  }
  
  getTotalWalkingDistance(): number {
    return this.walkingToOnboarding + this.walkingFromOffboarding
  }
}

/**
 * Decorator that adds time estimates
 */
class TimeEstimateDecorator extends BusResultDecorator {
  private readonly AVERAGE_BUS_SPEED_KMH = 20
  private readonly AVERAGE_WALKING_SPEED_KMH = 5
  
  constructor(
    busResult: BusResult,
    private journeyLength: number,
    private totalWalkingDistance: number
  ) {
    super(busResult)
  }
  
  getEstimatedJourneyTime(): number {
    // Time in minutes
    return (this.journeyLength / this.AVERAGE_BUS_SPEED_KMH) * 60
  }
  
  getEstimatedWalkingTime(): number {
    // Time in minutes
    return (this.totalWalkingDistance / this.AVERAGE_WALKING_SPEED_KMH) * 60
  }
  
  getEstimatedTotalTime(): number {
    return this.getEstimatedJourneyTime() + this.getEstimatedWalkingTime()
  }
}

/**
 * Factory for creating fully decorated bus results
 */
class EnhancedBusResultFactory {
  static create(
    baseBusResult: BusResult,
    journeyLength: number,
    walkingToOnboarding: number,
    walkingFromOffboarding: number
  ): EnhancedBusResult {
    // Apply decorators in sequence
    let decorated: any = baseBusResult
    
    decorated = new JourneyLengthDecorator(decorated, journeyLength)
    decorated = new WalkingDistanceDecorator(
      decorated,
      walkingToOnboarding,
      walkingFromOffboarding
    )
    decorated = new TimeEstimateDecorator(
      decorated,
      journeyLength,
      walkingToOnboarding + walkingFromOffboarding
    )
    
    return decorated as EnhancedBusResult
  }
}
```

#### Builder Pattern: BusFilterBuilder

Constructs complex filter queries with a fluent interface:

```typescript
/**
 * Builder for constructing bus filter queries
 */
class BusFilterBuilder {
  private filters: {
    isAC?: boolean
    coachTypes?: string[]
    minJourneyLength?: number
    maxJourneyLength?: number
    maxWalkingDistance?: number
  } = {}
  
  /**
   * Filter by AC/Non-AC
   */
  withAC(isAC: boolean): this {
    this.filters.isAC = isAC
    return this
  }
  
  /**
   * Filter by coach types
   */
  withCoachTypes(types: string[]): this {
    this.filters.coachTypes = types
    return this
  }
  
  /**
   * Filter by journey length range
   */
  withJourneyLengthRange(min?: number, max?: number): this {
    if (min !== undefined) this.filters.minJourneyLength = min
    if (max !== undefined) this.filters.maxJourneyLength = max
    return this
  }
  
  /**
   * Filter by maximum walking distance
   */
  withMaxWalkingDistance(maxDistance: number): this {
    this.filters.maxWalkingDistance = maxDistance
    return this
  }
  
  /**
   * Apply filters to bus results
   */
  apply(buses: EnhancedBusResult[]): EnhancedBusResult[] {
    let filtered = buses
    
    if (this.filters.isAC !== undefined) {
      filtered = filtered.filter(bus => bus.isAC === this.filters.isAC)
    }
    
    if (this.filters.coachTypes && this.filters.coachTypes.length > 0) {
      filtered = filtered.filter(bus => 
        this.filters.coachTypes!.includes(bus.coachType)
      )
    }
    
    if (this.filters.minJourneyLength !== undefined) {
      filtered = filtered.filter(bus => 
        bus.journeyLength >= this.filters.minJourneyLength!
      )
    }
    
    if (this.filters.maxJourneyLength !== undefined) {
      filtered = filtered.filter(bus => 
        bus.journeyLength <= this.filters.maxJourneyLength!
      )
    }
    
    if (this.filters.maxWalkingDistance !== undefined) {
      filtered = filtered.filter(bus => 
        bus.totalDistance <= this.filters.maxWalkingDistance!
      )
    }
    
    return filtered
  }
  
  /**
   * Build Supabase query (for database-level filtering)
   */
  buildSupabaseQuery(query: any): any {
    if (this.filters.isAC !== undefined) {
      query = query.eq('is_ac', this.filters.isAC)
    }
    
    if (this.filters.coachTypes && this.filters.coachTypes.length > 0) {
      query = query.in('coach_type', this.filters.coachTypes)
    }
    
    return query
  }
  
  /**
   * Reset all filters
   */
  reset(): this {
    this.filters = {}
    return this
  }
}

// Usage example:
const filterBuilder = new BusFilterBuilder()
const filteredBuses = filterBuilder
  .withAC(true)
  .withCoachTypes(['express', 'luxury'])
  .withMaxWalkingDistance(1000)
  .apply(allBuses)
```

## Data Models

### Database Schema Enhancements

#### Updated `buses` Table

```sql
CREATE TABLE public.buses (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NULL DEFAULT 'active'::text,
  is_ac BOOLEAN NOT NULL DEFAULT false,
  coach_type TEXT NOT NULL DEFAULT 'standard'::text,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  
  CONSTRAINT buses_pkey PRIMARY KEY (id),
  CONSTRAINT buses_status_check CHECK (
    status = ANY (ARRAY['active'::text, 'inactive'::text])
  ),
  CONSTRAINT buses_coach_type_check CHECK (
    coach_type = ANY (ARRAY['standard'::text, 'express'::text, 'luxury'::text])
  )
) TABLESPACE pg_default;

CREATE INDEX idx_buses_status ON public.buses USING btree (status);
CREATE INDEX idx_buses_is_ac ON public.buses USING btree (is_ac);
CREATE INDEX idx_buses_coach_type ON public.buses USING btree (coach_type);
```

#### Updated `route_stops` Table

```sql
CREATE TABLE public.route_stops (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  bus_id UUID NULL,
  stop_id UUID NULL,
  stop_order INTEGER NOT NULL,
  direction TEXT NOT NULL DEFAULT 'outbound'::text,
  distance_to_next NUMERIC(10, 3) NULL, -- Distance in kilometers to next stop
  duration_to_next INTEGER NULL, -- Duration in seconds to next stop (optional)
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  
  CONSTRAINT route_stops_pkey PRIMARY KEY (id),
  CONSTRAINT route_stops_bus_id_stop_id_direction_key UNIQUE (bus_id, stop_id, direction),
  CONSTRAINT route_stops_bus_id_stop_order_direction_key UNIQUE (bus_id, stop_order, direction),
  CONSTRAINT route_stops_bus_id_fkey FOREIGN KEY (bus_id) 
    REFERENCES buses (id) ON DELETE CASCADE,
  CONSTRAINT route_stops_stop_id_fkey FOREIGN KEY (stop_id) 
    REFERENCES stops (id) ON DELETE CASCADE,
  CONSTRAINT route_stops_direction_check CHECK (
    direction = ANY (ARRAY['outbound'::text, 'inbound'::text])
  ),
  CONSTRAINT route_stops_distance_check CHECK (distance_to_next >= 0),
  CONSTRAINT route_stops_duration_check CHECK (duration_to_next >= 0)
) TABLESPACE pg_default;

CREATE INDEX idx_route_stops_bus_id_dir ON public.route_stops 
  USING btree (bus_id, direction);
CREATE INDEX idx_route_stops_stop_id ON public.route_stops 
  USING btree (stop_id);
CREATE INDEX idx_route_stops_bus_stop_order ON public.route_stops 
  USING btree (bus_id, stop_order, direction);
```

#### `stops` Table (No Changes Needed)

The existing stops table structure is sufficient:

```sql
CREATE TABLE public.stops (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  latitude NUMERIC NULL,
  longitude NUMERIC NULL,
  accessible BOOLEAN NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  
  CONSTRAINT stops_pkey PRIMARY KEY (id),
  CONSTRAINT unique_stop_name UNIQUE (name)
) TABLESPACE pg_default;

CREATE INDEX idx_stops_lat_long ON public.stops 
  USING btree (latitude, longitude) TABLESPACE pg_default;
```

### TypeScript Interfaces

```typescript
// Database models
interface Bus {
  id: string
  name: string
  status: 'active' | 'inactive'
  is_ac: boolean
  coach_type: 'standard' | 'express' | 'luxury'
  created_at: string
  updated_at: string
}

interface Stop {
  id: string
  name: string
  latitude: number
  longitude: number
  accessible: boolean
  created_at: string
}

interface RouteStop {
  id: string
  bus_id: string
  stop_id: string
  stop_order: number
  direction: 'outbound' | 'inbound'
  distance_to_next: number | null
  duration_to_next: number | null
  created_at: string
  updated_at: string
}

// Joined query result
interface RouteStopWithDetails extends RouteStop {
  bus: Bus
  stop: Stop
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Default Threshold Application
*For any* route planning state where threshold values are undefined or null, the system should apply default values of 500 meters for both starting and destination thresholds.
**Validates: Requirements 1.2**

### Property 2: Threshold Validation Range
*For any* user-provided threshold value, the system should accept only positive numbers between 100 and 5000 meters, rejecting all other inputs.
**Validates: Requirements 1.3**

### Property 3: Threshold Change Reactivity
*For any* threshold modification while search results are displayed, the system should recalculate and update the available stops to match the new threshold values.
**Validates: Requirements 1.5**

### Property 4: Stop Discovery Within Threshold
*For any* starting location and threshold, all returned stops should have calculated distances less than or equal to the specified threshold distance.
**Validates: Requirements 2.1, 2.2**

### Property 5: Stop Grouping Consistency
*For any* set of discovered stops, the system should group them into exactly two distinct sections: starting location stops and destination location stops, with no overlap.
**Validates: Requirements 2.5, 3.1**

### Property 6: Stop Display Completeness
*For any* displayed stop, the rendered output should contain both the stop name and the calculated distance from the reference location.
**Validates: Requirements 3.2**

### Property 7: Selection State Propagation
*For any* onboarding stop selection, the system should update the UI to highlight the selection and enable the offboarding stop selection controls.
**Validates: Requirements 3.3**

### Property 8: Walking Distance Calculation
*For any* pair of selected stops (onboarding and offboarding), the system should calculate and display walking distances from starting location to onboarding stop and from offboarding stop to destination location.
**Validates: Requirements 3.4, 3.5, 9.1, 9.2**

### Property 9: Bus Route Ordering Invariant
*For any* bus returned in search results, the onboarding stop must appear before the offboarding stop in the bus route sequence (lower stop_order value).
**Validates: Requirements 4.2**

### Property 10: Bus Result Completeness
*For any* bus in the search results, all required fields (name, status, is_ac, coach_type) should be present and non-null.
**Validates: Requirements 4.4**

### Property 11: Active Bus Filter
*For any* set of displayed bus results, all buses should have status equal to 'active'.
**Validates: Requirements 4.5**

### Property 12: Journey Length Calculation
*For any* bus route with onboarding stop at position i and offboarding stop at position j, the journey length should equal the sum of all distance_to_next values for stops at positions i through j-1.
**Validates: Requirements 5.1**

### Property 13: Distance Display Formatting
*For any* calculated journey length or walking distance, the displayed value should be formatted in meters if less than 1000 meters, otherwise in kilometers with two decimal precision.
**Validates: Requirements 5.5, 9.4**

### Property 14: AC Filter Correctness
*For any* bus result set with AC filter applied, all returned buses should have is_ac equal to the filter value (true for AC, false for non-AC).
**Validates: Requirements 6.2, 6.3**

### Property 15: Coach Type Filter Correctness
*For any* bus result set with coach type filter applied, all returned buses should have coach_type matching one of the selected filter values.
**Validates: Requirements 6.4**

### Property 16: Multiple Filter Conjunction
*For any* combination of filters applied simultaneously, all returned buses should satisfy every filter criterion (AND logic).
**Validates: Requirements 6.5**

### Property 17: Sort Order Preservation
*For any* sorted bus result list, consecutive elements should be ordered according to the sort criterion (journey length ascending or descending) while maintaining all applied filters.
**Validates: Requirements 6.7**

### Property 18: Coach Type Validation
*For any* bus record being stored, the coach_type value should be one of the allowed values: 'standard', 'express', or 'luxury'.
**Validates: Requirements 7.4**

### Property 19: OSRM Error Handling
*For any* OSRM request, the system should include timeout configuration and handle errors gracefully without crashing.
**Validates: Requirements 8.3**

### Property 20: Fallback Notification
*For any* distance calculation using Haversine fallback, the system should display a notification to the user indicating that distances are approximate.
**Validates: Requirements 8.5**

### Property 21: Map Marker Display
*For any* selected onboarding or offboarding stop, the map should display a distinct highlighted marker at that stop's coordinates.
**Validates: Requirements 10.2, 10.3**

### Property 22: Complete Route Visualization
*For any* complete route with both stops selected, the map should display all four points (starting location, onboarding stop, offboarding stop, destination location) and connecting lines.
**Validates: Requirements 10.4, 10.5**

## Error Handling

### Distance Calculation Errors

1. **OSRM Unavailability**: When OSRM service is unreachable, automatically fall back to Haversine calculation and notify the user
2. **Invalid Coordinates**: Validate latitude (-90 to 90) and longitude (-180 to 180) before making distance calculations
3. **Timeout Handling**: Set 30-second timeout for OSRM requests, fall back to Haversine on timeout
4. **Network Errors**: Catch and handle network errors gracefully with user-friendly error messages

### Database Errors

1. **Missing Distance Data**: When distance_to_next is null, calculate using OSRM and log warning for data update
2. **Query Failures**: Wrap all Supabase queries in try-catch blocks with specific error messages
3. **Connection Issues**: Implement retry logic (3 attempts) for transient database connection failures
4. **Data Integrity**: Validate that route sequences are complete (no gaps in stop_order)

### User Input Errors

1. **Invalid Thresholds**: Display inline validation errors for out-of-range threshold values
2. **Empty Locations**: Prevent search with empty location inputs, show validation message
3. **No Results**: Display helpful message when no stops or buses are found, suggest adjusting thresholds
4. **Geolocation Denied**: Handle geolocation permission denial gracefully with fallback to manual input

### UI Error States

1. **Loading States**: Show skeleton loaders during async operations
2. **Error Boundaries**: Implement React error boundaries to catch and display component errors
3. **Retry Actions**: Provide retry buttons for failed operations
4. **Partial Failures**: Handle cases where some buses fail to load but others succeed

## Testing Strategy

### Unit Testing

**Framework**: Vitest with React Testing Library

**Coverage Areas**:

1. **Component Testing**:
   - StopSelectionCard renders correctly with distance formatting
   - BusResultCard displays all required information
   - Filter controls update state correctly
   - Threshold input validation

2. **Service Layer Testing**:
   - StopDiscoveryService filters stops within threshold
   - BusRouteService finds valid routes
   - Journey length calculation with mock data

3. **Pattern Implementation Testing**:
   - BusFilterBuilder applies filters correctly
   - Decorator pattern adds properties correctly
   - Observer pattern notifies subscribers

4. **Utility Function Testing**:
   - Distance formatting (meters vs kilometers)
   - Coordinate validation
   - Time estimation calculations

### Property-Based Testing

**Framework**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**: Each property test should run a minimum of 100 iterations

**Test Tagging**: Each property-based test must include a comment with the format:
`// Feature: threshold-based-route-planning, Property {number}: {property_text}`

**Property Tests**:

1. **Property 1: Default Threshold Application**
   ```typescript
   // Feature: threshold-based-route-planning, Property 1: Default Threshold Application
   test('default thresholds are applied when values are undefined', () => {
     fc.assert(
       fc.property(
         fc.record({
           fromLocation: fc.string(),
           toLocation: fc.string(),
           startingThreshold: fc.constantFrom(undefined, null),
           destinationThreshold: fc.constantFrom(undefined, null)
         }),
         (input) => {
           const state = initializeRoutePlannerState(input)
           expect(state.startingThreshold).toBe(500)
           expect(state.destinationThreshold).toBe(500)
         }
       ),
       { numRuns: 100 }
     )
   })
   ```

2. **Property 2: Threshold Validation Range**
   ```typescript
   // Feature: threshold-based-route-planning, Property 2: Threshold Validation Range
   test('threshold validation accepts only values between 100 and 5000', () => {
     fc.assert(
       fc.property(
         fc.integer(),
         (threshold) => {
           const isValid = validateThreshold(threshold)
           const shouldBeValid = threshold >= 100 && threshold <= 5000
           expect(isValid).toBe(shouldBeValid)
         }
       ),
       { numRuns: 100 }
     )
   })
   ```

3. **Property 4: Stop Discovery Within Threshold**
   ```typescript
   // Feature: threshold-based-route-planning, Property 4: Stop Discovery Within Threshold
   test('all discovered stops are within threshold distance', async () => {
     fc.assert(
       await fc.asyncProperty(
         fc.record({
           location: fc.record({
             lat: fc.double({ min: 23.7, max: 23.9 }), // Dhaka bounds
             lng: fc.double({ min: 90.3, max: 90.5 })
           }),
           threshold: fc.integer({ min: 100, max: 5000 })
         }),
         async ({ location, threshold }) => {
           const stops = await discoverStops(location, threshold)
           stops.forEach(stop => {
             expect(stop.distance).toBeLessThanOrEqual(threshold)
           })
         }
       ),
       { numRuns: 100 }
     )
   })
   ```

4. **Property 9: Bus Route Ordering Invariant**
   ```typescript
   // Feature: threshold-based-route-planning, Property 9: Bus Route Ordering Invariant
   test('onboarding stop always comes before offboarding stop', async () => {
     fc.assert(
       await fc.asyncProperty(
         fc.record({
           onboardingStopId: fc.uuid(),
           offboardingStopId: fc.uuid()
         }),
         async ({ onboardingStopId, offboardingStopId }) => {
           const buses = await findBusRoutes(onboardingStopId, offboardingStopId)
           buses.forEach(bus => {
             expect(bus.onboardingStopOrder).toBeLessThan(bus.offboardingStopOrder)
           })
         }
       ),
       { numRuns: 100 }
     )
   })
   ```

5. **Property 12: Journey Length Calculation**
   ```typescript
   // Feature: threshold-based-route-planning, Property 12: Journey Length Calculation
   test('journey length equals sum of segment distances', () => {
     fc.assert(
       fc.property(
         fc.array(fc.double({ min: 0.1, max: 10 }), { minLength: 2, maxLength: 20 }),
         (segmentDistances) => {
           const expectedSum = segmentDistances.reduce((a, b) => a + b, 0)
           const calculatedLength = calculateJourneyLength(segmentDistances)
           expect(calculatedLength).toBeCloseTo(expectedSum, 2)
         }
       ),
       { numRuns: 100 }
     )
   })
   ```

6. **Property 14: AC Filter Correctness**
   ```typescript
   // Feature: threshold-based-route-planning, Property 14: AC Filter Correctness
   test('AC filter returns only buses matching AC status', () => {
     fc.assert(
       fc.property(
         fc.array(
           fc.record({
             id: fc.uuid(),
             name: fc.string(),
             is_ac: fc.boolean(),
             coach_type: fc.constantFrom('standard', 'express', 'luxury')
           })
         ),
         fc.boolean(),
         (buses, filterAC) => {
           const filtered = new BusFilterBuilder()
             .withAC(filterAC)
             .apply(buses)
           
           filtered.forEach(bus => {
             expect(bus.is_ac).toBe(filterAC)
           })
         }
       ),
       { numRuns: 100 }
     )
   })
   ```

7. **Property 16: Multiple Filter Conjunction**
   ```typescript
   // Feature: threshold-based-route-planning, Property 16: Multiple Filter Conjunction
   test('multiple filters apply AND logic', () => {
     fc.assert(
       fc.property(
         fc.array(
           fc.record({
             id: fc.uuid(),
             name: fc.string(),
             is_ac: fc.boolean(),
             coach_type: fc.constantFrom('standard', 'express', 'luxury'),
             journeyLength: fc.double({ min: 0.5, max: 50 })
           })
         ),
         fc.boolean(),
         fc.constantFrom('standard', 'express', 'luxury'),
         fc.double({ min: 0, max: 30 }),
         (buses, filterAC, filterCoachType, maxJourneyLength) => {
           const filtered = new BusFilterBuilder()
             .withAC(filterAC)
             .withCoachTypes([filterCoachType])
             .withJourneyLengthRange(undefined, maxJourneyLength)
             .apply(buses)
           
           filtered.forEach(bus => {
             expect(bus.is_ac).toBe(filterAC)
             expect(bus.coach_type).toBe(filterCoachType)
             expect(bus.journeyLength).toBeLessThanOrEqual(maxJourneyLength)
           })
         }
       ),
       { numRuns: 100 }
     )
   })
   ```

### Integration Testing

1. **End-to-End Route Planning Flow**:
   - User enters locations → stops discovered → stops selected → buses displayed → filters applied
   - Test with real Supabase test database and mock OSRM

2. **OSRM Integration**:
   - Test actual OSRM API calls with Dhaka coordinates
   - Verify fallback to Haversine when OSRM is down

3. **Database Operations**:
   - Test complex queries joining buses, stops, and route_stops
   - Verify journey length calculation with real data

### UI/Component Testing

1. **Visual Regression Testing**: Capture screenshots of key UI states
2. **Accessibility Testing**: Verify ARIA labels, keyboard navigation, screen reader compatibility
3. **Responsive Design Testing**: Test layouts on mobile, tablet, and desktop viewports
4. **Map Integration Testing**: Verify Leaflet map renders correctly with markers and lines

### Performance Testing

1. **Stop Discovery Performance**: Measure time to filter 1000+ stops within threshold
2. **Journey Calculation Performance**: Test with routes having 50+ stops
3. **Filter Performance**: Measure filter application time with 100+ bus results
4. **Map Rendering Performance**: Test map performance with 50+ markers

### Test Data Strategy

1. **Mock Data Generation**: Use factories to generate consistent test data
2. **Dhaka-Specific Data**: Use realistic Dhaka coordinates and stop names
3. **Edge Cases**: Test with empty results, single results, maximum results
4. **Boundary Values**: Test threshold boundaries (100m, 5000m), coordinate boundaries

