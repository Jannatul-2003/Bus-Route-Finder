# Bus Result Decorator Pattern

This directory implements the **Decorator Pattern** to enhance basic bus results with computed properties.

## Overview

The Decorator pattern allows us to add new functionality to bus results dynamically without modifying the base `BusResult` interface. This is particularly useful for:

- Adding journey length calculations
- Computing walking distances
- Estimating travel times
- Keeping the base bus data separate from computed properties

## Architecture

```
BusResult (interface)
    ↓
BusResultDecorator (abstract base)
    ↓
    ├── JourneyLengthDecorator
    ├── WalkingDistanceDecorator
    └── TimeEstimateDecorator
         ↓
EnhancedBusResultFactory (composes all decorators)
```

## Components

### 1. BusResult Interface

The base interface representing minimal bus information from the database:

```typescript
interface BusResult {
  id: string
  name: string
  isAC: boolean
  coachType: 'standard' | 'express' | 'luxury'
  onboardingStop: Stop
  offboardingStop: Stop
}
```

### 2. BusResultDecorator

Abstract base class that implements `BusResult` and delegates all calls to the wrapped instance:

```typescript
abstract class BusResultDecorator implements BusResult {
  constructor(protected busResult: BusResult) {}
  // Delegates all base properties to wrapped instance
}
```

### 3. JourneyLengthDecorator

Adds journey length calculation:

```typescript
class JourneyLengthDecorator extends BusResultDecorator {
  getJourneyLength(): number // Returns journey length in km
}
```

### 4. WalkingDistanceDecorator

Adds walking distance calculations:

```typescript
class WalkingDistanceDecorator extends BusResultDecorator {
  getWalkingDistanceToOnboarding(): number
  getWalkingDistanceFromOffboarding(): number
  getTotalWalkingDistance(): number
}
```

### 5. TimeEstimateDecorator

Adds time estimates based on average speeds:

```typescript
class TimeEstimateDecorator extends BusResultDecorator {
  getEstimatedJourneyTime(): number // Minutes
  getEstimatedWalkingTime(): number // Minutes
  getEstimatedTotalTime(): number   // Minutes
}
```

### 6. EnhancedBusResultFactory

Factory that composes all decorators and returns a fully enhanced result:

```typescript
class EnhancedBusResultFactory {
  static create(
    baseBusResult: BusResult,
    journeyLength: number,
    walkingToOnboarding: number,
    walkingFromOffboarding: number
  ): EnhancedBusResult
}
```

## Usage Example

```typescript
import { EnhancedBusResultFactory, BusResult } from '@/lib/decorators'

// Base bus result from database
const baseBus: BusResult = {
  id: '123',
  name: 'Bus #42 - Express',
  isAC: true,
  coachType: 'express',
  onboardingStop: {
    id: 'stop-1',
    name: 'Gulshan Circle 1',
    latitude: 23.7808,
    longitude: 90.4172
  },
  offboardingStop: {
    id: 'stop-2',
    name: 'Motijheel',
    latitude: 23.7330,
    longitude: 90.4172
  }
}

// Create enhanced result with computed properties
const enhanced = EnhancedBusResultFactory.create(
  baseBus,
  2.5,  // journey length: 2.5 km
  0.25, // walking to onboarding: 250 meters
  0.42  // walking from offboarding: 420 meters
)

// Access all properties
console.log(enhanced.name)                          // 'Bus #42 - Express'
console.log(enhanced.journeyLength)                 // 2.5
console.log(enhanced.walkingDistanceToOnboarding)   // 0.25
console.log(enhanced.walkingDistanceFromOffboarding)// 0.42
console.log(enhanced.totalWalkingDistance)          // 0.67
console.log(enhanced.totalDistance)                 // 3.17
console.log(enhanced.estimatedJourneyTime)          // 7.5 minutes
console.log(enhanced.estimatedWalkingTime)          // 8.04 minutes
console.log(enhanced.estimatedTotalTime)            // 15.54 minutes
```

## Design Benefits

1. **Single Responsibility**: Each decorator handles one specific enhancement
2. **Open/Closed Principle**: Can add new decorators without modifying existing code
3. **Composability**: Decorators can be combined in any order
4. **Testability**: Each decorator can be tested independently
5. **Type Safety**: Full TypeScript support with proper interfaces

## Requirements Satisfied

This implementation satisfies the following requirements:

- **Requirement 5.1**: Journey length calculation from segment distances
- **Requirement 5.5**: Distance display formatting
- **Requirement 9.1**: Walking distance from starting location to onboarding stop
- **Requirement 9.2**: Walking distance from offboarding stop to destination

## Testing

See `__tests__/decorators.test.ts` for comprehensive unit tests covering:

- Individual decorator functionality
- Factory composition
- Edge cases (zero distances, large values)
- Type safety
