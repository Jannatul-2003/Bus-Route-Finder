# Design Document

## Overview

This design addresses the inappropriate display of "No communities found" messages when no search has been performed. The solution involves adding search state tracking to distinguish between "no search performed" and "search performed but no results found" states.

## Architecture

The fix will be implemented at the store level by adding a `hasSearchBeenPerformed` flag to the search state, and updating the UI logic to use this flag for appropriate message display.

## Components and Interfaces

### CommunityStore Updates
- Add `hasSearchBeenPerformed: boolean` to `searchState`
- Update search methods to set this flag when searches are performed
- Update clear methods to reset this flag

### Community Page Updates  
- Modify display logic to check `hasSearchBeenPerformed` before showing empty state messages
- Ensure proper message display based on search state

## Data Models

```typescript
interface SearchState {
  query: string
  radius: number
  isRadiusSet: boolean
  filteredCommunities: CommunityWithDistance[]
  isSearching: boolean
  searchError: string | null
  hasSearchBeenPerformed: boolean // NEW FIELD
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property 1: No search performed means no empty results message
*For any* application state where `hasSearchBeenPerformed` is false, the system should not display "No communities found" messages
**Validates: Requirements 1.2**

Property 2: Name search with no results shows appropriate message
*For any* search query by name that returns zero results, the system should display "No communities found matching [search term]"
**Validates: Requirements 1.3**

Property 3: Radius search with no results shows appropriate message  
*For any* radius search that returns zero results, the system should display "No communities found nearby"
**Validates: Requirements 1.4**

Property 4: Clear search returns to initial state
*For any* search state, clearing the search should reset `hasSearchBeenPerformed` to false and display the "Ready to explore?" message
**Validates: Requirements 1.5**

## Error Handling

- Handle cases where search state becomes inconsistent
- Ensure proper fallback to initial state if search tracking fails
- Graceful degradation if search performed flag is undefined

## Testing Strategy

### Unit Tests
- Test initial state display logic
- Test search state transitions
- Test clear search functionality
- Test message display conditions

### Property-Based Tests
- Property 1: Test that no empty results message appears when hasSearchBeenPerformed is false
- Property 2: Test name search empty results message format
- Property 3: Test radius search empty results message format  
- Property 4: Test clear search state reset behavior

The testing will use Jest for unit tests and fast-check for property-based testing to verify the correctness properties across many random inputs and states.