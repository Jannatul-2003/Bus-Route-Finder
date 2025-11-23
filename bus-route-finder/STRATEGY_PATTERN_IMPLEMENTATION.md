# Strategy Pattern Implementation - Bus Route Finder

## Overview

Yes, the **Strategy Pattern** is already implemented in this project! It's used for **distance calculation** in the Bus Route Finder application. This document explains how it works, where it's used, and why it's beneficial.

## What is the Strategy Pattern?

The Strategy Pattern is a behavioral design pattern that enables selecting an algorithm at runtime. Instead of implementing a single algorithm directly, code receives run-time instructions as to which algorithm to use from a family of algorithms.

**Key Benefits:**
- ✅ Algorithms can be swapped at runtime
- ✅ Encapsulates each algorithm in its own class
- ✅ Makes algorithms interchangeable
- ✅ Follows Open/Closed Principle (open for extension, closed for modification)

## Implementation in This Project

### Problem Solved

The application needs to calculate distances between bus stops and user locations. Different calculation methods have different trade-offs:

- **OSRM (Open Source Routing Machine)**: Provides accurate road-based distances but requires a running server
- **Haversine Formula**: Works offline, calculates straight-line distances, but less accurate for road travel

The Strategy Pattern allows the application to:
1. Try OSRM first (more accurate)
2. Automatically fall back to Haversine if OSRM is unavailable
3. Easily add new distance calculation methods in the future

## Architecture

### 1. Strategy Interface

**File:** `src/lib/strategies/DistanceCalculationStrategy.ts`

```typescript
export interface DistanceCalculationStrategy {
  calculateDistances(
    origins: Coordinate[],
    destinations: Coordinate[],
  ): Promise<DistanceResult[][]>
  
  getName(): string
  isAvailable(): boolean | Promise<boolean>
}
```

This interface defines the contract that all distance calculation strategies must follow. Any class implementing this interface can be used as a strategy.

### 2. Concrete Strategies

#### HaversineStrategy
**File:** `src/lib/strategies/HaversineStrategy.ts`

- **Purpose**: Calculates great-circle distances using the Haversine formula
- **Pros**: Always available, works offline, no external dependencies
- **Cons**: Straight-line distance (not road-based), less accurate for navigation
- **Use Case**: Fallback when OSRM is unavailable

**Key Features:**
```typescript
class HaversineStrategy implements DistanceCalculationStrategy {
  // Calculates distance between two points on Earth's surface
  calculateHaversineDistance(coord1: Coordinate, coord2: Coordinate): number
  
  // Always returns true (no dependencies)
  isAvailable(): boolean
}
```

#### OSRMStrategy
**File:** `src/lib/strategies/OSRMStrategy.ts`

- **Purpose**: Uses OSRM API for road-based distance calculation
- **Pros**: Accurate road distances, includes duration estimates
- **Cons**: Requires OSRM server running, network dependency
- **Use Case**: Primary strategy when OSRM server is available

**Key Features:**
```typescript
class OSRMStrategy implements DistanceCalculationStrategy {
  // Calls OSRM API to get road-based distances
  calculateDistances(origins, destinations): Promise<DistanceResult[][]>
  
  // Checks if OSRM server is reachable
  async isAvailable(): Promise<boolean>
}
```

### 3. Context Class

**File:** `src/lib/strategies/DistanceCalculator.ts`

The `DistanceCalculator` is the **Context** class that uses strategies. It doesn't implement distance calculation itself - it delegates to the current strategy.

**Key Responsibilities:**
- Manages primary and fallback strategies
- Automatically falls back when primary strategy fails
- Allows runtime strategy switching
- Provides a clean API for distance calculation

**Key Methods:**
```typescript
class DistanceCalculator {
  // Calculate distances with automatic fallback
  async calculateDistances(
    origins: Coordinate[],
    destinations: Coordinate[],
    useFallbackOnError: boolean = true
  ): Promise<DistanceResult[][]>
  
  // Switch strategies at runtime
  setPrimaryStrategy(strategy: DistanceCalculationStrategy): void
  setFallbackStrategy(strategy: DistanceCalculationStrategy): void
  
  // Factory method for default configuration
  static createDefault(osrmBaseUrl?: string): DistanceCalculator
}
```

## How It Works

### Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    API Route Handler                     │
│              (/api/distance/route.ts)                   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              DistanceCalculator (Context)                │
│  • Manages strategies                                   │
│  • Handles fallback logic                               │
└──────┬──────────────────────────────┬───────────────────┘
       │                              │
       ▼                              ▼
┌──────────────────┐        ┌──────────────────┐
│  OSRMStrategy    │        │ HaversineStrategy│
│  (Primary)       │        │  (Fallback)      │
│                  │        │                  │
│  • Road-based    │        │  • Straight-line │
│  • Accurate      │        │  • Always works  │
│  • Needs server  │        │  • Offline       │
└──────────────────┘        └──────────────────┘
```

### Execution Flow

1. **API Request** → `/api/distance` receives origins and destinations
2. **Create Calculator** → `DistanceCalculator.createDefault()` creates calculator with OSRM (primary) and Haversine (fallback)
3. **Check Availability** → Calculator checks if OSRM is available
4. **Try Primary Strategy**:
   - If OSRM is available → Use OSRM to calculate distances
   - If OSRM fails → Automatically fall back to Haversine
5. **Return Results** → Distance matrix is returned in consistent format

### Code Example

```typescript
// In /api/distance/route.ts
const calculator = DistanceCalculator.createDefault(osrmBaseUrl)

// This automatically:
// 1. Tries OSRM first
// 2. Falls back to Haversine if OSRM fails
// 3. Returns results in consistent format
const results = await calculator.calculateDistances(origins, destinations, true)
```

## Usage in the Application

### Where It's Used

1. **API Route**: `src/app/api/distance/route.ts`
   - Main entry point for distance calculations
   - Uses `DistanceCalculator.createDefault()` for automatic strategy selection

2. **Route Planning**: Used indirectly when finding closest bus stops
   - The `/api/route-stops/closest` endpoint uses the distance API
   - Benefits from automatic fallback when OSRM is unavailable

### Real-World Scenario

**Scenario**: User searches for bus routes near their location

1. **System tries OSRM** (if server is running):
   ```
   OSRM calculates: 2.5 km (road distance)
   Duration: 8 minutes
   ```

2. **If OSRM fails** (server down, network issue):
   ```
   System automatically switches to Haversine
   Haversine calculates: 2.1 km (straight-line distance)
   Duration: Estimated 6 minutes
   ```

3. **User gets results** regardless of which strategy was used!

## Benefits of This Implementation

### 1. **Flexibility**
- Can switch between strategies at runtime
- No code changes needed to use different algorithms

### 2. **Reliability**
- Automatic fallback ensures the system always works
- Even if OSRM server is down, Haversine provides results

### 3. **Maintainability**
- Each algorithm is in its own class
- Easy to understand and modify individual strategies

### 4. **Extensibility**
- Adding new strategies is simple:
  ```typescript
  class GoogleMapsStrategy implements DistanceCalculationStrategy {
    // Implement interface methods
  }
  
  // Use it:
  calculator.setPrimaryStrategy(new GoogleMapsStrategy())
  ```

### 5. **Testability**
- Each strategy can be tested independently
- Context class can be tested with mock strategies

## Adding New Strategies

To add a new distance calculation strategy (e.g., Google Maps API):

### Step 1: Create Strategy Class

```typescript
// src/lib/strategies/GoogleMapsStrategy.ts
import type { DistanceCalculationStrategy, Coordinate, DistanceResult } from "./DistanceCalculationStrategy"

export class GoogleMapsStrategy implements DistanceCalculationStrategy {
  async calculateDistances(
    origins: Coordinate[],
    destinations: Coordinate[],
  ): Promise<DistanceResult[][]> {
    // Implement Google Maps API call
    // ...
  }
  
  getName(): string {
    return "GoogleMaps"
  }
  
  async isAvailable(): Promise<boolean> {
    // Check if API key is configured
    return !!process.env.GOOGLE_MAPS_API_KEY
  }
}
```

### Step 2: Use It

```typescript
// In your code
const calculator = new DistanceCalculator(
  new GoogleMapsStrategy(),  // Primary
  new HaversineStrategy()     // Fallback
)
```

**That's it!** No changes needed to existing code.

## Testing

Comprehensive unit tests are available in:
- `src/lib/strategies/__tests__/DistanceCalculationStrategy.test.ts`

**Test Coverage:**
- ✅ Strategy interface compliance
- ✅ Individual strategy functionality
- ✅ Context class behavior
- ✅ Automatic fallback mechanism
- ✅ Runtime strategy switching
- ✅ Error handling

**Run Tests:**
```bash
npm run test -- DistanceCalculationStrategy
```

## Design Patterns Principles Demonstrated

### 1. **Open/Closed Principle**
- ✅ Open for extension: New strategies can be added
- ✅ Closed for modification: Existing code doesn't need changes

### 2. **Single Responsibility Principle**
- ✅ Each strategy handles one calculation method
- ✅ Context class only manages strategy selection

### 3. **Dependency Inversion Principle**
- ✅ Context depends on abstraction (interface), not concrete classes
- ✅ Strategies can be swapped without affecting context

### 4. **Encapsulation**
- ✅ Each strategy encapsulates its algorithm
- ✅ Implementation details are hidden

## File Structure

```
src/lib/strategies/
├── DistanceCalculationStrategy.ts    # Strategy interface
├── HaversineStrategy.ts              # Concrete strategy 1
├── OSRMStrategy.ts                   # Concrete strategy 2
├── DistanceCalculator.ts             # Context class
└── __tests__/
    └── DistanceCalculationStrategy.test.ts  # Unit tests
```

## Configuration

### Environment Variables

```env
# Optional: Custom OSRM server URL
OSRM_BASE_URL=http://localhost:5000

# Default: Uses localhost:5000 if not set
```

### Default Behavior

- **Primary Strategy**: OSRM (if available)
- **Fallback Strategy**: Haversine (always available)
- **Automatic Fallback**: Enabled by default

## Summary

The Strategy Pattern is **fully implemented and working** in this project. It provides:

1. ✅ **Flexible distance calculation** with automatic fallback
2. ✅ **Easy extensibility** for new calculation methods
3. ✅ **Reliable operation** even when external services fail
4. ✅ **Clean architecture** with separated concerns
5. ✅ **Comprehensive testing** to ensure correctness

The implementation follows best practices and design principles, making the codebase maintainable, testable, and extensible.

## Related Documentation

- **Test Justification**: `STRATEGY_PATTERN_JUSTIFICATION.md` - Explains how tests prove the pattern is correctly implemented
- **Observer Pattern**: `OBSERVER_README.md` - Another design pattern used in this project
- **Singleton Pattern**: Used for database connections (Supabase clients)

