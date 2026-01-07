# Bus Route Finder - Features Documentation

## Table of Contents
1. [Overview](#overview)
2. [Core Features](#core-features)
3. [Architecture & Design Patterns](#architecture--design-patterns)
4. [Feature Implementation Details](#feature-implementation-details)
5. [User Interface Components](#user-interface-components)
6. [API Integration](#api-integration)
7. [Performance Optimizations](#performance-optimizations)
8. [Testing Strategy](#testing-strategy)

## Overview

The Bus Route Finder is a comprehensive web application designed to help users in Dhaka, Bangladesh find optimal bus routes between any two locations. The application uses advanced algorithms, real-time data, and intelligent filtering to provide the best possible route recommendations.

### Key Technologies
- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL database)
- **Mapping**: OpenStreetMap with Nominatim geocoding
- **Distance Calculation**: OSRM (Open Source Routing Machine) with Haversine fallback
- **State Management**: Custom Observable pattern implementation
- **Testing**: Vitest with comprehensive unit tests

## Core Features

### 1. Intelligent Location Input System
**Purpose**: Allow users to enter any location in Dhaka, not just bus stop names.

**How it works**:
- Users can enter natural language locations (e.g., "Dhanmondi 27", "Gulshan Circle")
- The system uses Nominatim geocoding API to convert location names to coordinates
- Supports current location detection via browser geolocation API
- Automatically clears cached coordinates when location text changes to ensure fresh geocoding

**Implementation Logic**:
```typescript
const geocodeLocation = async (locationName: string): Promise<{ lat: number; lng: number } | null> => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?` +
    `q=${encodeURIComponent(locationName + ", Dhaka, Bangladesh")}` +
    `&format=json&limit=1&countrycodes=bd`
  )
  // Returns coordinates for the location
}
```

### 2. Threshold-Based Stop Discovery
**Purpose**: Find bus stops within a configurable distance from user's actual locations.

**How it works**:
- Users set distance thresholds (100m - 5000m) for starting and destination locations
- System discovers all bus stops within the specified radius
- Uses OSRM for accurate walking distances, falls back to Haversine for straight-line distance
- Destination threshold can be set to null to search by exact stop name match

**Implementation Logic**:
```typescript
class StopDiscoveryService {
  async discoverStops(location: Coordinates, threshold: number): Promise<StopWithDistance[]> {
    // 1. Query database for stops within bounding box
    // 2. Calculate precise distances using OSRM
    // 3. Filter stops within threshold
    // 4. Sort by distance
    // 5. Return enriched stop data with walking distances
  }
}
```

**Key Features**:
- Validates threshold ranges (100m - 5000m)
- Provides visual feedback on distance calculation method used
- Handles API failures gracefully with fallback strategies

### 3. Interactive Stop Selection
**Purpose**: Allow users to choose optimal boarding and alighting points.

**How it works**:
- Displays discovered stops in order of proximity
- Shows walking distance and estimated time for each stop
- Radio button selection for onboarding stops
- Checkbox selection for offboarding stops (when threshold is used)
- Real-time distance calculations between selected stops

**Implementation Logic**:
```typescript
async selectOnboardingStop(stop: StopWithDistance): Promise<void> {
  // 1. Set selected onboarding stop
  // 2. Calculate walking distance from starting location
  // 3. If offboarding stop already selected, calculate journey distance
  // 4. Automatically trigger bus route search
  // 5. Update UI state and notify observers
}
```

### 4. Advanced Bus Route Search
**Purpose**: Find buses that serve both selected stops in the correct sequence.

**How it works**:
- Queries database for buses serving both onboarding and offboarding stops
- Verifies that onboarding stop appears before offboarding stop in the route
- Calculates journey length between stops along the bus route
- Filters out inactive buses
- Enriches results with computed properties (estimated time, total distance)

**Implementation Logic**:
```typescript
class BusRouteService {
  async findBusRoutes(onboardingStopId: string, offboardingStopId: string): Promise<BusRoute[]> {
    // 1. Find buses serving onboarding stop
    // 2. Filter buses that also serve offboarding stop
    // 3. Verify correct stop sequence in route
    // 4. Calculate journey distances
    // 5. Return valid bus routes with metadata
  }
}
```

### 5. Intelligent Filtering System
**Purpose**: Help users narrow down bus options based on preferences.

**Filter Types**:
- **AC/Non-AC Filter**: Filter buses by air conditioning availability
- **Coach Type Filter**: Filter by standard, express, or luxury coaches
- **Multiple Filter Support**: Apply multiple filters simultaneously with AND logic

**Implementation Logic**:
```typescript
class BusFilterBuilder {
  withAC(isAC: boolean): BusFilterBuilder
  withCoachTypes(types: CoachType[]): BusFilterBuilder
  apply(buses: EnhancedBusResult[]): EnhancedBusResult[]
}
```

**Performance Optimization**:
- Uses memoization to cache filtered results
- Clears cache when filter criteria change
- Applies filters to original unfiltered dataset

### 6. Multi-Criteria Sorting
**Purpose**: Order bus results by user preferences.

**Sorting Options**:
- **Journey Length**: Sort by distance between stops
- **Estimated Time**: Sort by total travel time (walking + bus journey)
- **Bus Name**: Alphabetical sorting
- **Sort Order**: Ascending or descending for each criteria

**Implementation Logic**:
```typescript
#sortBuses(buses: EnhancedBusResult[]): EnhancedBusResult[] {
  return buses.sort((a, b) => {
    let comparison = 0
    switch (this.sortBy) {
      case 'journeyLength': comparison = a.journeyLength - b.journeyLength; break
      case 'estimatedTime': comparison = a.estimatedTotalTime - b.estimatedTotalTime; break
      case 'name': comparison = a.name.localeCompare(b.name); break
    }
    return this.sortOrder === 'asc' ? comparison : -comparison
  })
}
```

### 7. Enhanced Bus Result Display
**Purpose**: Provide comprehensive information about each bus option.

**Displayed Information**:
- Bus name and route number
- AC/Non-AC status with visual indicators
- Coach type (Standard/Express/Luxury)
- Journey length between stops
- Walking distances to/from stops
- Estimated total travel time
- Route visualization with all intermediate stops

**Computed Properties**:
```typescript
interface EnhancedBusResult {
  // Basic bus info
  id: string
  name: string
  isAC: boolean
  coachType: 'standard' | 'express' | 'luxury'
  
  // Computed distances and times
  journeyLength: number // km between stops
  walkingDistanceToOnboarding: number // km to boarding point
  walkingDistanceFromOffboarding: number // km from alighting point
  totalDistance: number // total journey distance
  estimatedBusTime: number // minutes on bus
  estimatedWalkingTime: number // minutes walking
  estimatedTotalTime: number // total journey time
  
  // Route information
  onboardingStop: Stop
  offboardingStop: Stop
  routeStops: StopWithDistance[] // all stops between boarding and alighting
}
```

### 8. Interactive Map Integration
**Purpose**: Provide visual representation of routes and stops.

**Features**:
- Shows selected stops on map
- Displays walking routes to/from stops
- Interactive markers with stop information
- Responsive design for mobile and desktop

**Implementation**:
- Uses custom Map component with lazy loading
- Integrates with OpenStreetMap tiles
- Supports multiple stop visualization
- Optimized for performance with marker clustering

### 9. Real-Time Distance Calculations
**Purpose**: Provide accurate walking and journey distances.

**Distance Calculation Strategy**:
1. **Primary**: OSRM API for routing-based distances
2. **Fallback**: Haversine formula for straight-line distances
3. **Caching**: Results cached to minimize API calls
4. **Error Handling**: Graceful degradation when APIs are unavailable

**Implementation Logic**:
```typescript
class DistanceCalculator {
  async calculateDistances(
    origins: Coordinates[],
    destinations: Coordinates[],
    preferOSRM: boolean = true
  ): Promise<DistanceResult[][]> {
    try {
      if (preferOSRM) {
        return await this.osrmStrategy.calculateDistances(origins, destinations)
      }
    } catch (error) {
      console.warn('OSRM failed, falling back to Haversine')
      return await this.haversineStrategy.calculateDistances(origins, destinations)
    }
  }
}
```

### 10. State Management with Observer Pattern
**Purpose**: Maintain consistent application state across components.

**Key Benefits**:
- Loose coupling between components
- Automatic UI updates when state changes
- Centralized state management
- Easy testing and debugging

**Implementation**:
```typescript
class RoutePlannerStore extends Observable<RoutePlannerState> {
  #setState(partial: Partial<RoutePlannerState>) {
    this.#state = { ...this.#state, ...partial }
    this.notify(this.#state) // Notify all observers
  }
}
```

**Observer Integration**:
```typescript
React.useEffect(() => {
  const observer = {
    update: (newState: RoutePlannerState) => {
      setState(newState)
    }
  }
  routePlannerStore.subscribe(observer)
  return () => routePlannerStore.unsubscribe(observer)
}, [])
```

## Architecture & Design Patterns

### 1. Observer Pattern
**Used for**: State management and component communication
**Benefits**: Loose coupling, automatic updates, scalable architecture

### 2. Strategy Pattern
**Used for**: Distance calculation algorithms
**Benefits**: Flexible algorithm selection, easy testing, fallback support

### 3. Builder Pattern
**Used for**: Filter construction
**Benefits**: Flexible filter combinations, readable code, extensible design

### 4. Factory Pattern
**Used for**: Enhanced bus result creation
**Benefits**: Consistent object creation, computed property injection

### 5. Decorator Pattern
**Used for**: Bus result enhancement
**Benefits**: Dynamic property addition, separation of concerns

## Feature Implementation Details

### Search Results Persistence Fix
**Problem**: Search results persisted when users changed location inputs.

**Solution**:
1. Added `clearSearchResults()` method to clear all search-related state
2. Modified location setters to clear cached coordinates
3. Integrated clearing logic into search workflow

**Implementation**:
```typescript
clearSearchResults(): void {
  this.#setState({
    startingStops: [],
    destinationStops: [],
    selectedOnboardingStop: null,
    selectedOffboardingStop: null,
    walkingDistanceToOnboarding: null,
    walkingDistanceFromOffboarding: null,
    journeyDistanceBetweenStops: null,
    allBuses: [],
    availableBuses: [],
    searchResults: [],
    plannedRoute: null,
    mapStops: [],
    error: null
  })
  this.#filterCache.clear()
}
```

### Geolocation Handling
**Features**:
- Browser geolocation API integration
- Permission handling with user-friendly messages
- Timeout and error recovery
- Manual location entry fallback

**Error Handling Logic**:
```typescript
switch (error.code) {
  case error.PERMISSION_DENIED:
    errorMessage += "Location permission was denied. Please enable location access..."
    break
  case error.POSITION_UNAVAILABLE:
    errorMessage += "Location information is unavailable..."
    break
  case error.TIMEOUT:
    errorMessage += "Location request timed out..."
    break
}
```

### Threshold Validation
**Rules**:
- Starting threshold: Required, 100m - 5000m
- Destination threshold: Optional (null allowed), 100m - 5000m when set
- Real-time validation with user feedback

**Validation Logic**:
```typescript
setStartingThreshold(threshold: number) {
  if (threshold < 100 || threshold > 5000) {
    this.#setState({ 
      error: "Threshold must be between 100 and 5000 meters" 
    })
    throw new Error("Threshold must be between 100 and 5000 meters")
  }
  this.#setState({ startingThreshold: threshold, error: null })
}
```

## User Interface Components

### 1. ThresholdInput Component
**Purpose**: Configurable distance threshold input with validation.

**Features**:
- Slider and numeric input combination
- Real-time validation feedback
- Optional threshold support (null values)
- Responsive design

### 2. StopSelectionCard Component
**Purpose**: Display bus stops with selection capabilities.

**Features**:
- Distance and accessibility information
- Radio/checkbox selection modes
- Walking time estimates
- Responsive card layout

### 3. BusResultCard Component
**Purpose**: Comprehensive bus route information display.

**Features**:
- Multi-section layout (header, route, stats)
- AC/coach type indicators
- Expandable route details
- Action buttons for selection

### 4. FilterControls Component
**Purpose**: Advanced filtering interface.

**Features**:
- AC/Non-AC toggle buttons
- Multi-select coach type checkboxes
- Clear filters functionality
- Real-time filter application

### 5. Map Component
**Purpose**: Interactive route visualization.

**Features**:
- Lazy loading for performance
- Multiple stop support
- Responsive design
- Custom markers and popups

## API Integration

### 1. Supabase Database
**Tables**:
- `buses`: Bus information and status
- `stops`: Bus stop locations and metadata
- `route_stops`: Bus-stop relationships with sequence

**Key Queries**:
```sql
-- Find buses serving both stops in correct order
SELECT DISTINCT b.*, rs1.stop_order as onboarding_order, rs2.stop_order as offboarding_order
FROM buses b
JOIN route_stops rs1 ON b.id = rs1.bus_id
JOIN route_stops rs2 ON b.id = rs2.bus_id
WHERE rs1.stop_id = $1 AND rs2.stop_id = $2 
AND rs1.stop_order < rs2.stop_order
AND b.status = 'active'
```

### 2. Nominatim Geocoding API
**Purpose**: Convert location names to coordinates.

**Features**:
- Free, no API key required
- Biased towards Dhaka, Bangladesh
- Country code filtering
- Rate limiting compliance

### 3. OSRM Routing API
**Purpose**: Calculate accurate walking and driving distances.

**Features**:
- Public API with fallback support
- Multiple coordinate batch processing
- Route optimization
- Distance and duration calculations

## Performance Optimizations

### 1. Memoization and Caching
- Filter results cached to avoid redundant calculations
- Distance calculations cached per coordinate pair
- Component memoization for expensive renders

### 2. Lazy Loading
- Map component loaded only when needed
- Large datasets paginated or virtualized
- API calls debounced to reduce server load

### 3. Efficient State Updates
- Immutable state updates for React optimization
- Selective component re-renders
- Observer pattern minimizes unnecessary updates

### 4. Database Optimization
- Indexed queries for fast stop discovery
- Efficient JOIN operations for bus route queries
- Spatial indexing for location-based searches

## Testing Strategy

### 1. Unit Tests
**Coverage**:
- State management (Observer pattern)
- Business logic (filtering, sorting, calculations)
- Component behavior
- Error handling scenarios

**Key Test Categories**:
```typescript
describe('RoutePlannerStore', () => {
  describe('Observer Pattern Integration', () => {
    // Tests for subscription, notification, unsubscription
  })
  
  describe('Threshold Management', () => {
    // Tests for validation, boundary conditions
  })
  
  describe('Stop Discovery', () => {
    // Tests for API integration, error handling
  })
  
  describe('Search Results Management', () => {
    // Tests for clearing state, coordinate handling
  })
})
```

### 2. Integration Tests
- API endpoint testing
- Database query validation
- End-to-end user workflows
- Error recovery scenarios

### 3. Performance Tests
- Large dataset handling
- Memory usage monitoring
- API response time validation
- Concurrent user simulation

## Error Handling & User Experience

### 1. Graceful Degradation
- OSRM API failure → Haversine fallback
- Geolocation denial → Manual input
- Network issues → Cached results
- Invalid input → Clear error messages

### 2. User Feedback
- Loading states for all async operations
- Progress indicators for multi-step processes
- Clear error messages with recovery suggestions
- Success confirmations for completed actions

### 3. Accessibility
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast mode compatibility
- Mobile-first responsive design

## Future Enhancements

### 1. Real-Time Features
- Live bus tracking integration
- Real-time arrival predictions
- Traffic-aware route optimization
- Push notifications for delays

### 2. Advanced Features
- Multi-modal transport integration
- Favorite routes saving
- Route sharing capabilities
- Offline mode support

### 3. Performance Improvements
- Service worker caching
- Progressive web app features
- Advanced data compression
- Edge computing integration

## Conclusion

The Bus Route Finder represents a comprehensive solution for urban transportation planning in Dhaka. Through careful architecture design, robust error handling, and user-centered features, the application provides reliable and efficient route planning capabilities. The modular design and extensive testing ensure maintainability and scalability for future enhancements.

The combination of modern web technologies, intelligent algorithms, and thoughtful user experience design creates a powerful tool that addresses real-world transportation challenges while maintaining high performance and reliability standards.