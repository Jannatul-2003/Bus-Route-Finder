# Services

This directory contains service classes that encapsulate business logic for the bus route planning application.

## StopDiscoveryService

The `StopDiscoveryService` is responsible for discovering bus stops within a specified threshold distance from a given location.

### Features

- **Distance Calculation**: Uses the Strategy pattern via `DistanceCalculator` to calculate distances with OSRM as the primary method and Haversine as fallback
- **Threshold Filtering**: Filters stops to only include those within the specified distance threshold
- **Distance Sorting**: Returns stops sorted by distance in ascending order
- **Method Tracking**: Preserves information about which calculation method was used (OSRM or Haversine)

### Usage

```typescript
import { StopDiscoveryService } from '@/lib/services'
import { DistanceCalculator } from '@/lib/strategies/DistanceCalculator'
import { getSupabaseClient } from '@/lib/supabase/client'

// Create service instance
const distanceCalculator = DistanceCalculator.createDefault()
const supabaseClient = getSupabaseClient()
const stopDiscoveryService = new StopDiscoveryService(
  distanceCalculator,
  supabaseClient
)

// Discover stops within 500 meters
const location = { lat: 23.8103, lng: 90.4125 }
const thresholdMeters = 500

const nearbyStops = await stopDiscoveryService.discoverStops(
  location,
  thresholdMeters
)

// nearbyStops will contain:
// - All stops within 500 meters
// - Sorted by distance (closest first)
// - Each stop includes distance in meters and calculation method
```

### API

#### `discoverStops(location: Coordinates, thresholdMeters: number): Promise<StopWithDistance[]>`

Discovers stops within the specified threshold distance from a location.

**Parameters:**
- `location`: The reference location coordinates `{ lat: number, lng: number }`
- `thresholdMeters`: Maximum distance in meters (e.g., 500 for 500 meters)

**Returns:**
- Array of `StopWithDistance` objects, sorted by distance ascending
- Each object includes all stop properties plus:
  - `distance`: Distance in meters from the reference location
  - `distanceMethod`: Either 'OSRM' or 'Haversine' indicating which method was used

**Example:**
```typescript
const stops = await service.discoverStops({ lat: 23.8103, lng: 90.4125 }, 500)
// [
//   { id: '1', name: 'Stop A', distance: 200, distanceMethod: 'OSRM', ... },
//   { id: '2', name: 'Stop B', distance: 450, distanceMethod: 'OSRM', ... }
// ]
```

#### `fetchAllStops(): Promise<Stop[]>`

Fetches all stops from the Supabase database.

**Returns:**
- Array of all `Stop` objects from the database

**Throws:**
- Error if the database query fails

### Requirements Validation

This service validates the following requirements:

- **Requirement 2.1**: Queries OSRM to calculate road network distances and returns stops within threshold
- **Requirement 2.2**: Handles destination location threshold similarly
- **Requirement 2.3**: Falls back to Haversine when OSRM is unavailable

### Testing

Comprehensive unit tests are available in `__tests__/StopDiscoveryService.test.ts` covering:

- Fetching stops from Supabase
- Distance calculation and filtering
- Threshold boundary conditions
- Distance sorting
- Method preservation (OSRM vs Haversine)
- Error handling

Run tests with:
```bash
npm test -- src/lib/services/__tests__/StopDiscoveryService.test.ts
```

## BusRouteService

The `BusRouteService` is responsible for finding buses that serve specific stops and calculating journey lengths between stops.

### Features

- **Route Discovery**: Finds all buses that serve both an onboarding and offboarding stop
- **Route Validation**: Ensures onboarding stop comes before offboarding stop in the route sequence
- **Journey Length Calculation**: Calculates total journey distance using pre-calculated segment distances
- **Fallback Distance Calculation**: Uses OSRM to calculate missing segment distances with warning logging
- **Active Bus Filtering**: Only returns buses with 'active' status

### Usage

```typescript
import { BusRouteService } from '@/lib/services'
import { DistanceCalculator } from '@/lib/strategies/DistanceCalculator'
import { getSupabaseClient } from '@/lib/supabase/client'

// Create service instance
const distanceCalculator = DistanceCalculator.createDefault()
const supabaseClient = getSupabaseClient()
const busRouteService = new BusRouteService(
  supabaseClient,
  distanceCalculator
)

// Find buses between two stops
const onboardingStopId = 'stop-123'
const offboardingStopId = 'stop-456'

const routes = await busRouteService.findBusRoutes(
  onboardingStopId,
  offboardingStopId
)

// Calculate journey length for a specific route
const journeyLength = await busRouteService.calculateJourneyLength(
  'bus-789',
  1,  // onboarding stop order
  5,  // offboarding stop order
  'outbound'
)
```

### API

#### `findBusRoutes(onboardingStopId: string, offboardingStopId: string): Promise<BusRoute[]>`

Finds all buses that serve both stops in the correct order.

**Parameters:**
- `onboardingStopId`: The ID of the stop where the user boards
- `offboardingStopId`: The ID of the stop where the user exits

**Returns:**
- Array of `BusRoute` objects containing:
  - `busId`: The bus ID
  - `bus`: Full bus details (name, status, is_ac, coach_type, etc.)
  - `onboardingStop`: Full stop details for boarding location
  - `offboardingStop`: Full stop details for exit location
  - `onboardingStopOrder`: Position of onboarding stop in route
  - `offboardingStopOrder`: Position of offboarding stop in route
  - `direction`: Route direction ('outbound' or 'inbound')
  - `routeStops`: All stops between onboarding and offboarding

**Throws:**
- Error if the database query fails

**Example:**
```typescript
const routes = await service.findBusRoutes('stop-1', 'stop-5')
// [
//   {
//     busId: 'bus-42',
//     bus: { name: 'Express 42', is_ac: true, coach_type: 'express', ... },
//     onboardingStop: { name: 'Mirpur 10', ... },
//     offboardingStop: { name: 'Farmgate', ... },
//     onboardingStopOrder: 1,
//     offboardingStopOrder: 5,
//     direction: 'outbound',
//     routeStops: [...]
//   }
// ]
```

#### `calculateJourneyLength(busId: string, onboardingStopOrder: number, offboardingStopOrder: number, direction: 'outbound' | 'inbound'): Promise<number>`

Calculates the total journey distance between two stops on a bus route.

**Parameters:**
- `busId`: The bus ID
- `onboardingStopOrder`: The stop order number for boarding
- `offboardingStopOrder`: The stop order number for exiting
- `direction`: The route direction

**Returns:**
- Total journey length in kilometers

**Behavior:**
- Sums all `distance_to_next` values for segments between the stops
- If `distance_to_next` is missing, calculates using OSRM and logs a warning
- Returns 0 if no segments are found

**Throws:**
- Error if the database query fails

**Example:**
```typescript
const length = await service.calculateJourneyLength('bus-42', 1, 5, 'outbound')
// 3.7 (kilometers)
```

### Requirements Validation

This service validates the following requirements:

- **Requirement 4.1**: Queries Supabase to find buses serving both stops
- **Requirement 4.2**: Verifies onboarding stop appears before offboarding stop
- **Requirement 4.3**: Displays message when no buses found
- **Requirement 4.4**: Retrieves all bus information including amenities
- **Requirement 5.1**: Calculates journey length as sum of segment distances
- **Requirement 5.2**: Retrieves pre-calculated distances from database
- **Requirement 5.4**: Calculates missing distances using OSRM with warning log

### Testing

Comprehensive unit tests are available in `__tests__/BusRouteService.test.ts` covering:

- Finding buses serving both stops
- Handling empty results
- Journey length calculation with pre-calculated distances
- OSRM fallback for missing distances
- Error handling for database failures

Run tests with:
```bash
npm test -- src/lib/services/__tests__/BusRouteService.test.ts
```
