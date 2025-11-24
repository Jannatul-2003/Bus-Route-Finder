# BusFilterBuilder Documentation

## Overview

The `BusFilterBuilder` class implements the **Builder Pattern** to provide a fluent interface for constructing complex bus filter queries. It supports both client-side filtering of bus results and database-level query building for optimal performance.

## Design Pattern

**Builder Pattern**: Separates the construction of complex filter queries from their representation, allowing the same construction process to create different filter combinations.

### Benefits
- **Fluent Interface**: Chainable methods for readable filter construction
- **Flexibility**: Supports multiple filter criteria that can be combined
- **Performance**: Offers both client-side and database-level filtering
- **Maintainability**: Easy to add new filter criteria without modifying existing code

## Requirements

Implements requirements: 6.1, 6.2, 6.3, 6.4, 6.5

## API Reference

### Constructor

```typescript
const filterBuilder = new BusFilterBuilder()
```

Creates a new filter builder instance with empty filters.

### Methods

#### `withAC(isAC: boolean): this`

Filter buses by air conditioning status.

**Parameters:**
- `isAC` (boolean): `true` for AC buses only, `false` for non-AC buses only

**Returns:** The builder instance for method chaining

**Example:**
```typescript
// Filter for AC buses only
filterBuilder.withAC(true)

// Filter for non-AC buses only
filterBuilder.withAC(false)
```

---

#### `withCoachTypes(types: string[]): this`

Filter buses by coach type.

**Parameters:**
- `types` (string[]): Array of coach types to include. Valid values: `'standard'`, `'express'`, `'luxury'`

**Returns:** The builder instance for method chaining

**Example:**
```typescript
// Filter for express and luxury buses
filterBuilder.withCoachTypes(['express', 'luxury'])

// Filter for standard buses only
filterBuilder.withCoachTypes(['standard'])
```

---

#### `withJourneyLengthRange(min?: number, max?: number): this`

Filter buses by journey length range.

**Parameters:**
- `min` (number, optional): Minimum journey length in kilometers
- `max` (number, optional): Maximum journey length in kilometers

**Returns:** The builder instance for method chaining

**Example:**
```typescript
// Filter for journeys between 2km and 5km
filterBuilder.withJourneyLengthRange(2, 5)

// Filter for journeys at least 3km
filterBuilder.withJourneyLengthRange(3)

// Filter for journeys at most 10km
filterBuilder.withJourneyLengthRange(undefined, 10)
```

---

#### `withMaxWalkingDistance(maxDistance: number): this`

Filter buses by maximum total walking distance.

**Parameters:**
- `maxDistance` (number): Maximum total walking distance in meters (includes both walking to onboarding stop and from offboarding stop)

**Returns:** The builder instance for method chaining

**Example:**
```typescript
// Filter for routes with max 1km total walking
filterBuilder.withMaxWalkingDistance(1000)
```

---

#### `apply<T extends EnhancedBusResult>(buses: T[]): T[]`

Apply filters to bus results (client-side filtering).

**Parameters:**
- `buses` (T[]): Array of enhanced bus results to filter

**Returns:** Filtered array of bus results

**Example:**
```typescript
const filteredBuses = filterBuilder
  .withAC(true)
  .withCoachTypes(['express'])
  .apply(allBuses)
```

---

#### `buildSupabaseQuery(query: any): any`

Build Supabase query with filters (database-level filtering).

**Note:** Only AC status and coach type filters can be applied at the database level. Journey length and walking distance filters require computed values and must be applied client-side.

**Parameters:**
- `query`: Supabase query builder instance

**Returns:** Modified query builder with filters applied

**Example:**
```typescript
let query = supabase
  .from('buses')
  .select('*')

query = filterBuilder
  .withAC(true)
  .withCoachTypes(['express', 'luxury'])
  .buildSupabaseQuery(query)

const { data } = await query
```

---

#### `reset(): this`

Reset all filters to empty state.

**Returns:** The builder instance for method chaining

**Example:**
```typescript
filterBuilder.reset()
```

---

#### `getFilters(): object`

Get current filter configuration (for debugging/inspection).

**Returns:** Copy of current filters object

**Example:**
```typescript
const currentFilters = filterBuilder.getFilters()
console.log('Active filters:', currentFilters)
```

## Usage Examples

### Example 1: Simple AC Filter

```typescript
import { BusFilterBuilder } from '@/lib/builders/BusFilterBuilder'

const filterBuilder = new BusFilterBuilder()

// Filter for AC buses only
const acBuses = filterBuilder
  .withAC(true)
  .apply(allBuses)

console.log(`Found ${acBuses.length} AC buses`)
```

### Example 2: Multiple Filters

```typescript
// Find express or luxury AC buses with journey under 5km
const premiumShortRoutes = new BusFilterBuilder()
  .withAC(true)
  .withCoachTypes(['express', 'luxury'])
  .withJourneyLengthRange(undefined, 5)
  .apply(allBuses)
```

### Example 3: Walking Distance Filter

```typescript
// Find buses where total walking distance is under 500m
const nearbyRoutes = new BusFilterBuilder()
  .withMaxWalkingDistance(500)
  .apply(allBuses)
```

### Example 4: Database-Level Filtering

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const filterBuilder = new BusFilterBuilder()

// Build query with database-level filters
let query = supabase
  .from('buses')
  .select('*')
  .eq('status', 'active')

query = filterBuilder
  .withAC(true)
  .withCoachTypes(['express'])
  .buildSupabaseQuery(query)

const { data: buses } = await query

// Apply client-side filters for computed properties
const finalResults = filterBuilder
  .withJourneyLengthRange(2, 8)
  .apply(buses)
```

### Example 5: Reusable Filter Builder

```typescript
// Create a reusable filter builder
const premiumBusFilter = new BusFilterBuilder()
  .withAC(true)
  .withCoachTypes(['express', 'luxury'])

// Apply to different bus sets
const route1Premium = premiumBusFilter.apply(route1Buses)
const route2Premium = premiumBusFilter.apply(route2Buses)

// Reset and create a different filter
premiumBusFilter
  .reset()
  .withCoachTypes(['standard'])
  .withMaxWalkingDistance(300)

const standardNearby = premiumBusFilter.apply(allBuses)
```

### Example 6: Complex Filter Combination

```typescript
// Find the best buses: AC, express/luxury, short journey, minimal walking
const bestBuses = new BusFilterBuilder()
  .withAC(true)
  .withCoachTypes(['express', 'luxury'])
  .withJourneyLengthRange(1, 6)
  .withMaxWalkingDistance(400)
  .apply(allBuses)

if (bestBuses.length === 0) {
  // Relax filters if no results
  const relaxedBuses = new BusFilterBuilder()
    .withAC(true)
    .withJourneyLengthRange(undefined, 10)
    .apply(allBuses)
}
```

### Example 7: Filter Inspection

```typescript
const filterBuilder = new BusFilterBuilder()
  .withAC(true)
  .withCoachTypes(['express'])
  .withJourneyLengthRange(2, 8)

// Inspect current filters
const filters = filterBuilder.getFilters()
console.log('Current filters:', filters)
// Output: { isAC: true, coachTypes: ['express'], minJourneyLength: 2, maxJourneyLength: 8 }
```

## Performance Considerations

### Database-Level vs Client-Side Filtering

**Database-Level Filtering** (via `buildSupabaseQuery`):
- ✅ Reduces data transfer from database
- ✅ Faster for large datasets
- ✅ Reduces memory usage
- ❌ Limited to database columns (AC status, coach type)

**Client-Side Filtering** (via `apply`):
- ✅ Can filter on computed properties (journey length, walking distance)
- ✅ More flexible
- ❌ Requires loading all data first
- ❌ Slower for very large datasets

### Best Practice

Use a hybrid approach:
1. Apply database-level filters first to reduce data transfer
2. Apply client-side filters for computed properties

```typescript
// Optimal approach
let query = supabase.from('buses').select('*')

// Database-level filtering
query = filterBuilder
  .withAC(true)
  .withCoachTypes(['express'])
  .buildSupabaseQuery(query)

const { data: buses } = await query

// Client-side filtering for computed properties
const finalResults = filterBuilder
  .withJourneyLengthRange(2, 8)
  .withMaxWalkingDistance(500)
  .apply(buses)
```

## Integration with Route Planner

The `BusFilterBuilder` is integrated into the route planner store:

```typescript
// In routePlannerStore.ts
import { BusFilterBuilder } from '@/lib/builders/BusFilterBuilder'

// Apply filters to bus results
const filterBuilder = new BusFilterBuilder()

if (filters.isAC !== null) {
  filterBuilder.withAC(filters.isAC)
}

if (filters.coachTypes.length > 0) {
  filterBuilder.withCoachTypes(filters.coachTypes)
}

const filteredBuses = filterBuilder.apply(state.availableBuses)
```

## Testing

The `BusFilterBuilder` has comprehensive test coverage including:
- AC filter correctness (Property 14)
- Coach type filter correctness (Property 15)
- Multiple filter conjunction (Property 16)

See `src/lib/builders/__tests__/BusFilterBuilder.test.ts` for test examples.

## Related Documentation

- [Decorator Pattern Documentation](./DECORATOR_PATTERN.md)
- [Route Planner Store](./ROUTE_PLANNER_STORE.md)
- [Design Document](.kiro/specs/threshold-based-route-planning/design.md)
