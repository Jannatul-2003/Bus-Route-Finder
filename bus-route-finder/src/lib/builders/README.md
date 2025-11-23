# Bus Filter Builder

The `BusFilterBuilder` class implements the Builder Pattern to provide a fluent interface for constructing complex bus filter queries.

## Features

- **Fluent Interface**: Chain multiple filter methods for readable code
- **Client-Side Filtering**: Apply filters to in-memory bus result arrays
- **Database-Level Filtering**: Build Supabase queries with filters
- **Flexible Configuration**: Set filters incrementally and reset when needed

## Requirements Covered

- **6.1**: Provides filter controls for AC/non-AC and coach type
- **6.2**: Filters buses by AC status
- **6.3**: Filters buses by non-AC status
- **6.4**: Filters buses by coach type
- **6.5**: Applies multiple filters with AND logic

## Usage Examples

### Basic Filtering

```typescript
import { BusFilterBuilder } from '@/lib/builders'

// Create a new builder instance
const builder = new BusFilterBuilder()

// Filter for AC buses only
const acBuses = builder
  .withAC(true)
  .apply(allBuses)

// Filter for express or luxury coaches
const premiumBuses = builder
  .reset()
  .withCoachTypes(['express', 'luxury'])
  .apply(allBuses)
```

### Multiple Filters (AND Logic)

```typescript
// Combine multiple filters
const filtered = new BusFilterBuilder()
  .withAC(true)                              // Only AC buses
  .withCoachTypes(['express', 'luxury'])     // Express or luxury
  .withJourneyLengthRange(5, 10)             // Journey 5-10 km
  .withMaxWalkingDistance(1000)              // Max 1km walking
  .apply(allBuses)
```

### Database-Level Filtering

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const builder = new BusFilterBuilder()
  .withAC(true)
  .withCoachTypes(['express'])

// Build Supabase query with filters
let query = supabase
  .from('buses')
  .select('*')

query = builder.buildSupabaseQuery(query)

const { data, error } = await query
```

### Incremental Construction

```typescript
const builder = new BusFilterBuilder()

// Start with basic filter
builder.withAC(true)
let results = builder.apply(buses)

// Add more criteria as needed
if (userWantsExpressOnly) {
  builder.withCoachTypes(['express'])
  results = builder.apply(buses)
}

// Add journey length constraint
if (maxJourneyLength) {
  builder.withJourneyLengthRange(undefined, maxJourneyLength)
  results = builder.apply(buses)
}
```

### Reusing Builder

```typescript
const builder = new BusFilterBuilder()
  .withAC(true)
  .withCoachTypes(['express'])

// Apply to different datasets
const morningBuses = builder.apply(morningSchedule)
const eveningBuses = builder.apply(eveningSchedule)

// Reset and create new filter
builder.reset()
  .withAC(false)
  .withCoachTypes(['standard'])

const budgetBuses = builder.apply(allBuses)
```

## API Reference

### Methods

#### `withAC(isAC: boolean): this`
Filter by AC/Non-AC status.

#### `withCoachTypes(types: string[]): this`
Filter by coach types ('standard', 'express', 'luxury').

#### `withJourneyLengthRange(min?: number, max?: number): this`
Filter by journey length range in kilometers.

#### `withMaxWalkingDistance(maxDistance: number): this`
Filter by maximum total walking distance in meters.

#### `apply(buses: EnhancedBusResult[]): EnhancedBusResult[]`
Apply all configured filters to a bus array (client-side).

#### `buildSupabaseQuery(query: any): any`
Apply database-level filters to a Supabase query.

#### `reset(): this`
Clear all filters and return to empty state.

#### `getFilters(): object`
Get current filter configuration (for debugging).

## Design Pattern

This implementation follows the **Builder Pattern**, which:

1. **Separates Construction from Representation**: The builder constructs complex filter configurations step-by-step, independent of how they're applied
2. **Provides Fluent Interface**: Method chaining makes code readable and self-documenting
3. **Enables Incremental Construction**: Filters can be added progressively based on user input or conditions
4. **Supports Reusability**: The same builder configuration can be applied to different datasets

## Testing

The builder includes comprehensive unit tests covering:
- Individual filter operations
- Multiple filter conjunction (AND logic)
- Supabase query building
- Edge cases and error handling
- Builder pattern validation

Run tests with:
```bash
npm test -- src/lib/builders/__tests__/BusFilterBuilder.test.ts --run
```
