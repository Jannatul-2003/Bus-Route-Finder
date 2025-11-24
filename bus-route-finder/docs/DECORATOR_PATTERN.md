# Decorator Pattern Documentation

## Overview

The Decorator Pattern is used to enhance bus results with additional computed properties without modifying the base `BusResult` interface. This allows for flexible composition of functionality and separation of concerns.

## Design Pattern

**Decorator Pattern**: Attaches additional responsibilities to an object dynamically. Decorators provide a flexible alternative to subclassing for extending functionality.

### Benefits
- **Open/Closed Principle**: Open for extension, closed for modification
- **Single Responsibility**: Each decorator handles one specific enhancement
- **Composability**: Decorators can be stacked in any order
- **Flexibility**: Add or remove enhancements at runtime

## Requirements

Implements requirements: 5.1, 5.5, 9.1, 9.2

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    BusResult (Interface)                 │
│  - id, name, isAC, coachType                            │
│  - onboardingStop, offboardingStop                      │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │
                           │ implements
                           │
┌──────────────────────────┴──────────────────────────────┐
│          BusResultDecorator (Abstract Base)             │
│  - Delegates all base properties to wrapped instance    │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │
                           │ extends
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼────────┐  ┌──────▼──────┐  ┌───────▼────────┐
│ JourneyLength  │  │   Walking   │  │ TimeEstimate   │
│   Decorator    │  │   Distance  │  │   Decorator    │
│                │  │  Decorator  │  │                │
│ + journey      │  │ + walking   │  │ + estimated    │
│   Length       │  │   distances │  │   times        │
└────────────────┘  └─────────────┘  └────────────────┘
                           │
                           │ composed by
                           │
                ┌──────────▼──────────┐
                │ EnhancedBusResult   │
                │     Factory         │
                │                     │
                │ Creates fully       │
                │ decorated results   │
                └─────────────────────┘
```

## Components

### 1. BusResult Interface

The base interface representing a bus result from the database.

```typescript
interface BusResult {
  id: string
  name: string
  isAC: boolean
  coachType: 'standard' | 'express' | 'luxury'
  onboardingStop: Stop
  offboardingStop: Stop
}

interface Stop {
  id: string
  name: string
  latitude: number
  longitude: number
  accessible: boolean
  created_at: string
}
```

### 2. BusResultDecorator (Abstract Base)

Abstract base class that implements `BusResult` and delegates to the wrapped instance.

```typescript
abstract class BusResultDecorator implements BusResult {
  constructor(protected busResult: BusResult) {}

  get id(): string { return this.busResult.id }
  get name(): string { return this.busResult.name }
  get isAC(): boolean { return this.busResult.isAC }
  get coachType(): 'standard' | 'express' | 'luxury' { 
    return this.busResult.coachType 
  }
  get onboardingStop(): Stop { return this.busResult.onboardingStop }
  get offboardingStop(): Stop { return this.busResult.offboardingStop }
}
```

### 3. JourneyLengthDecorator

Adds journey length calculation to bus results.

**Responsibility:** Calculate and provide the total distance traveled on the bus from onboarding to offboarding stop.

**Requirements:** 5.1 - Journey length calculation

```typescript
class JourneyLengthDecorator extends BusResultDecorator {
  private readonly _journeyLength: number

  constructor(busResult: BusResult, journeyLength: number) {
    super(busResult)
    this._journeyLength = journeyLength
  }

  /**
   * Get the journey length in kilometers
   * @returns Journey length in kilometers
   */
  getJourneyLength(): number {
    return this._journeyLength
  }
}
```

**Usage:**
```typescript
const decorated = new JourneyLengthDecorator(baseBusResult, 5.2)
console.log(decorated.getJourneyLength()) // 5.2
```

### 4. WalkingDistanceDecorator

Adds walking distance calculations to bus results.

**Responsibility:** Track distances from starting location to onboarding stop and from offboarding stop to destination.

**Requirements:** 9.1, 9.2 - Walking distance calculation and display

```typescript
class WalkingDistanceDecorator extends BusResultDecorator {
  private readonly _walkingToOnboarding: number
  private readonly _walkingFromOffboarding: number

  constructor(
    busResult: BusResult,
    walkingToOnboarding: number,
    walkingFromOffboarding: number
  ) {
    super(busResult)
    this._walkingToOnboarding = walkingToOnboarding
    this._walkingFromOffboarding = walkingFromOffboarding
  }

  /**
   * Get walking distance from starting location to onboarding stop
   * @returns Distance in kilometers
   */
  getWalkingDistanceToOnboarding(): number {
    return this._walkingToOnboarding
  }

  /**
   * Get walking distance from offboarding stop to destination location
   * @returns Distance in kilometers
   */
  getWalkingDistanceFromOffboarding(): number {
    return this._walkingFromOffboarding
  }

  /**
   * Get total walking distance (both ends combined)
   * @returns Total walking distance in kilometers
   */
  getTotalWalkingDistance(): number {
    return this._walkingToOnboarding + this._walkingFromOffboarding
  }
}
```

**Usage:**
```typescript
const decorated = new WalkingDistanceDecorator(baseBusResult, 0.3, 0.4)
console.log(decorated.getWalkingDistanceToOnboarding()) // 0.3
console.log(decorated.getWalkingDistanceFromOffboarding()) // 0.4
console.log(decorated.getTotalWalkingDistance()) // 0.7
```

### 5. TimeEstimateDecorator

Adds time estimates for journey and walking.

**Responsibility:** Calculate estimated times based on average speeds.

**Requirements:** 5.5 - Time estimate display

**Constants:**
- Average bus speed: 20 km/h
- Average walking speed: 5 km/h

```typescript
class TimeEstimateDecorator extends BusResultDecorator {
  private readonly AVERAGE_BUS_SPEED_KMH = 20
  private readonly AVERAGE_WALKING_SPEED_KMH = 5

  private readonly _journeyLength: number
  private readonly _totalWalkingDistance: number

  constructor(
    busResult: BusResult,
    journeyLength: number,
    totalWalkingDistance: number
  ) {
    super(busResult)
    this._journeyLength = journeyLength
    this._totalWalkingDistance = totalWalkingDistance
  }

  /**
   * Get estimated journey time on the bus
   * @returns Time in minutes
   */
  getEstimatedJourneyTime(): number {
    return (this._journeyLength / this.AVERAGE_BUS_SPEED_KMH) * 60
  }

  /**
   * Get estimated walking time (both ends combined)
   * @returns Time in minutes
   */
  getEstimatedWalkingTime(): number {
    return (this._totalWalkingDistance / this.AVERAGE_WALKING_SPEED_KMH) * 60
  }

  /**
   * Get total estimated time (journey + walking)
   * @returns Time in minutes
   */
  getEstimatedTotalTime(): number {
    return this.getEstimatedJourneyTime() + this.getEstimatedWalkingTime()
  }
}
```

**Usage:**
```typescript
const decorated = new TimeEstimateDecorator(baseBusResult, 5.0, 0.5)
console.log(decorated.getEstimatedJourneyTime()) // 15 minutes
console.log(decorated.getEstimatedWalkingTime()) // 6 minutes
console.log(decorated.getEstimatedTotalTime()) // 21 minutes
```

### 6. EnhancedBusResultFactory

Factory class that composes all decorators to create fully enhanced bus results.

**Responsibility:** Apply all decorators in the correct sequence and create a plain object with all computed properties.

```typescript
class EnhancedBusResultFactory {
  /**
   * Create an enhanced bus result with all computed properties
   * 
   * @param baseBusResult - The base bus result from database query
   * @param journeyLength - Journey length in kilometers
   * @param walkingToOnboarding - Walking distance to onboarding stop in kilometers
   * @param walkingFromOffboarding - Walking distance from offboarding stop in kilometers
   * @returns Enhanced bus result with all computed properties
   */
  static create(
    baseBusResult: BusResult,
    journeyLength: number,
    walkingToOnboarding: number,
    walkingFromOffboarding: number
  ): EnhancedBusResult {
    // Apply decorators in sequence
    const journeyDecorator = new JourneyLengthDecorator(
      baseBusResult, 
      journeyLength
    )
    
    const walkingDecorator = new WalkingDistanceDecorator(
      journeyDecorator,
      walkingToOnboarding,
      walkingFromOffboarding
    )
    
    const timeDecorator = new TimeEstimateDecorator(
      walkingDecorator,
      journeyLength,
      walkingToOnboarding + walkingFromOffboarding
    )

    // Create the enhanced result by extracting all properties
    const enhanced: EnhancedBusResult = {
      // Base properties
      id: timeDecorator.id,
      name: timeDecorator.name,
      isAC: timeDecorator.isAC,
      coachType: timeDecorator.coachType,
      onboardingStop: timeDecorator.onboardingStop,
      offboardingStop: timeDecorator.offboardingStop,
      
      // Journey length
      journeyLength: journeyDecorator.getJourneyLength(),
      
      // Walking distances
      walkingDistanceToOnboarding: walkingDecorator.getWalkingDistanceToOnboarding(),
      walkingDistanceFromOffboarding: walkingDecorator.getWalkingDistanceFromOffboarding(),
      totalWalkingDistance: walkingDecorator.getTotalWalkingDistance(),
      totalDistance: journeyDecorator.getJourneyLength() + 
                     walkingDecorator.getTotalWalkingDistance(),
      
      // Time estimates
      estimatedJourneyTime: timeDecorator.getEstimatedJourneyTime(),
      estimatedWalkingTime: timeDecorator.getEstimatedWalkingTime(),
      estimatedTotalTime: timeDecorator.getEstimatedTotalTime()
    }

    return enhanced
  }
}
```

## EnhancedBusResult Interface

The final enhanced result contains all base properties plus computed properties:

```typescript
interface EnhancedBusResult extends BusResult {
  // Journey information
  journeyLength: number // in kilometers
  
  // Walking distances
  walkingDistanceToOnboarding: number // in kilometers
  walkingDistanceFromOffboarding: number // in kilometers
  totalWalkingDistance: number // in kilometers
  totalDistance: number // journey + walking, in kilometers
  
  // Time estimates
  estimatedJourneyTime: number // in minutes
  estimatedWalkingTime: number // in minutes
  estimatedTotalTime: number // in minutes
}
```

## Usage Examples

### Example 1: Basic Enhancement

```typescript
import { EnhancedBusResultFactory } from '@/lib/decorators/EnhancedBusResultFactory'

// Base bus result from database
const baseBusResult: BusResult = {
  id: '123',
  name: 'Bus #42',
  isAC: true,
  coachType: 'express',
  onboardingStop: { /* stop data */ },
  offboardingStop: { /* stop data */ }
}

// Create enhanced result
const enhanced = EnhancedBusResultFactory.create(
  baseBusResult,
  5.2,  // journey length in km
  0.3,  // walking to onboarding in km
  0.4   // walking from offboarding in km
)

console.log(enhanced.journeyLength) // 5.2
console.log(enhanced.totalWalkingDistance) // 0.7
console.log(enhanced.totalDistance) // 5.9
console.log(enhanced.estimatedTotalTime) // ~24 minutes
```

### Example 2: Integration with BusRouteService

```typescript
import { BusRouteService } from '@/lib/services/BusRouteService'
import { EnhancedBusResultFactory } from '@/lib/decorators/EnhancedBusResultFactory'

async function findEnhancedBusRoutes(
  onboardingStopId: string,
  offboardingStopId: string,
  startLocation: Coordinates,
  destLocation: Coordinates
) {
  const busRouteService = new BusRouteService(supabase, distanceCalculator)
  
  // Find bus routes
  const routes = await busRouteService.findBusRoutes(
    onboardingStopId,
    offboardingStopId
  )
  
  // Enhance each route
  const enhancedRoutes = await Promise.all(
    routes.map(async (route) => {
      // Calculate journey length
      const journeyLength = await busRouteService.calculateJourneyLength(
        route.busId,
        route.onboardingStopOrder,
        route.offboardingStopOrder,
        route.direction
      )
      
      // Calculate walking distances
      const walkingToOnboarding = await calculateDistance(
        startLocation,
        route.onboardingStop
      )
      const walkingFromOffboarding = await calculateDistance(
        route.offboardingStop,
        destLocation
      )
      
      // Create enhanced result
      return EnhancedBusResultFactory.create(
        route.bus,
        journeyLength,
        walkingToOnboarding,
        walkingFromOffboarding
      )
    })
  )
  
  return enhancedRoutes
}
```

### Example 3: Manual Decorator Composition

```typescript
// You can also compose decorators manually for custom use cases
const baseBus: BusResult = { /* ... */ }

// Add only journey length
const withJourney = new JourneyLengthDecorator(baseBus, 5.2)
console.log(withJourney.getJourneyLength()) // 5.2

// Add walking distances
const withWalking = new WalkingDistanceDecorator(withJourney, 0.3, 0.4)
console.log(withWalking.getTotalWalkingDistance()) // 0.7

// Add time estimates
const withTime = new TimeEstimateDecorator(withWalking, 5.2, 0.7)
console.log(withTime.getEstimatedTotalTime()) // ~24 minutes
```

### Example 4: Conditional Enhancement

```typescript
// Enhance with different properties based on conditions
function enhanceBusResult(
  baseBus: BusResult,
  includeTime: boolean = true
): BusResult {
  let decorated: BusResult = baseBus
  
  // Always add journey length
  decorated = new JourneyLengthDecorator(decorated, 5.2)
  
  // Conditionally add time estimates
  if (includeTime) {
    decorated = new TimeEstimateDecorator(decorated, 5.2, 0.7)
  }
  
  return decorated
}
```

## Testing

The decorator pattern implementation has comprehensive test coverage:

- Journey length calculation (Property 12)
- Distance display formatting (Property 13)
- Individual decorator functionality
- Factory composition

See `src/lib/decorators/__tests__/decorators.test.ts` for test examples.

## Performance Considerations

### Decorator Overhead

Each decorator adds a small overhead due to:
- Object wrapping
- Method delegation
- Property access

For typical use cases (hundreds of bus results), this overhead is negligible.

### Factory Pattern

The `EnhancedBusResultFactory` creates a plain object rather than keeping the decorator chain. This:
- ✅ Improves serialization performance
- ✅ Simplifies debugging
- ✅ Reduces memory usage
- ✅ Makes the result easier to work with in React components

## Extending the Pattern

### Adding a New Decorator

To add a new enhancement:

1. Create a new decorator class extending `BusResultDecorator`
2. Add the computed property methods
3. Update `EnhancedBusResultFactory` to include the new decorator
4. Update the `EnhancedBusResult` interface

Example - Adding a price decorator:

```typescript
class PriceDecorator extends BusResultDecorator {
  private readonly _basePrice: number
  private readonly _pricePerKm: number

  constructor(
    busResult: BusResult,
    basePrice: number,
    pricePerKm: number
  ) {
    super(busResult)
    this._basePrice = basePrice
    this._pricePerKm = pricePerKm
  }

  getPrice(journeyLength: number): number {
    return this._basePrice + (journeyLength * this._pricePerKm)
  }
}

// Update factory
static create(...) {
  // ... existing decorators
  const priceDecorator = new PriceDecorator(timeDecorator, 20, 5)
  
  return {
    // ... existing properties
    price: priceDecorator.getPrice(journeyLength)
  }
}
```

## Related Documentation

- [BusFilterBuilder Documentation](./BUS_FILTER_BUILDER.md)
- [BusRouteService Documentation](./BUS_ROUTE_SERVICE.md)
- [Design Document](.kiro/specs/threshold-based-route-planning/design.md)
