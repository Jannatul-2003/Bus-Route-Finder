# Design Document

## Overview

The Community System Fixes addresses four critical issues in the existing community system: resolved post filtering, controlled search behavior, flexible search parameters, and correct post creation routing. The fixes will enhance user experience by providing proper post status filtering, preventing excessive API calls during search, enabling name-only searches, and ensuring correct navigation flows.

The solution builds upon the existing community architecture using React components, Zustand store management, and Supabase backend services. Key improvements include proper post status filtering, debounced search with explicit triggers, enhanced search flexibility, and corrected routing for post creation.

## Architecture

The fixes follow the existing layered architecture:

### Presentation Layer
- **Enhanced Post Filtering**: Updated PostSearchInput component with proper status filtering
- **Controlled Search Input**: Modified CommunitySearchInput with explicit search triggers
- **Fixed Navigation**: Corrected routing logic in community slug pages

### Business Logic Layer
- **Enhanced Community Store**: Updated search logic with controlled triggers
- **Improved Post Filtering**: Enhanced post status filtering in SearchService
- **Route Resolution**: Added slug-to-ID conversion for proper navigation

### Data Access Layer
- **Enhanced API Queries**: Updated post fetching with proper status filtering
- **Search Service**: Enhanced search methods with flexible parameters

## Components and Interfaces

### Enhanced PostSearchInput Component
```typescript
interface PostSearchInputProps {
  keyword: string
  postType: PostType | null
  status: PostStatus | null
  onKeywordChange: (keyword: string) => void
  onPostTypeChange: (postType: PostType | null) => void
  onStatusChange: (status: PostStatus | null) => void
  onClearFilters: () => void
  placeholder?: string
  showResolvedFilter?: boolean // New prop for resolved post filtering
}
```

### Enhanced CommunitySearchInput Component
```typescript
interface CommunitySearchInputProps {
  searchQuery: string
  searchRadius: number
  isRadiusSet: boolean
  onSearchChange: (query: string) => void
  onRadiusChange: (radius: number) => void
  onSearch: () => void // Made required for explicit search triggering
  onRadiusSearch?: () => void // New prop for radius-specific search
  disabled?: boolean
  preventAutoSearch?: boolean // New prop to prevent automatic searching
}
```

### Enhanced Search Service
```typescript
interface SearchService {
  searchCommunitiesByName(query: string, communities?: Community[]): Promise<Community[]>
  searchCommunitiesByLocation(lat: number, lng: number, radius: number): Promise<Community[]>
  searchCommunitiesFlexible(options: {
    name?: string
    latitude?: number
    longitude?: number
    radius?: number
  }): Promise<Community[]>
  filterPostsByStatus(posts: PostWithAuthor[], status: PostStatus | null): PostWithAuthor[]
}
```

### Route Resolution Service
```typescript
interface RouteResolutionService {
  convertSlugToId(slug: string): Promise<string | null>
  generatePostCreationRoute(communityIdentifier: string, isSlug: boolean): string
  resolveNavigationRoute(from: string, to: string, context?: any): string
}
```

## Data Models

### Enhanced Post Status Model
```typescript
type PostStatus = 'active' | 'resolved' | 'archived' | 'deleted'

interface PostStatusFilter {
  status: PostStatus | 'all' | null
  includeResolved: boolean
  includeArchived: boolean
}
```

### Search State Model
```typescript
interface CommunitySearchState {
  query: string
  radius: number
  isRadiusSet: boolean
  filteredCommunities: CommunityWithDistance[]
  isSearching: boolean
  searchError: string | null
  autoSearchEnabled: boolean // New field for controlling auto-search
  lastSearchTrigger: 'manual' | 'auto' | null // Track search trigger type
}
```

### Navigation Context Model
```typescript
interface NavigationContext {
  currentRoute: string
  communityId?: string
  communitySlug?: string
  postId?: string
  previousRoute?: string
  routeType: 'slug' | 'id'
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*
##
# Property Reflection

After reviewing all properties identified in the prework, I've identified several areas for consolidation:

- Properties 2.1, 2.4, and 2.5 all test the same concept of preventing automatic searches and can be combined
- Properties 2.2 and 2.3 test the same search triggering behavior and can be combined
- Properties 1.1, 1.2, and 1.3 all test post status filtering and can be combined into a comprehensive filtering property
- Properties 3.1, 3.2, 3.3, and 3.4 test different aspects of flexible search and can be consolidated

### Consolidated Properties

**Property 1: Post status filtering consistency**
*For any* list of posts with various statuses and any status filter (resolved, active, all), the filtered results should only include posts matching the specified status criteria
**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

**Property 2: Controlled search behavior**
*For any* search input changes, API calls should only be triggered by explicit user actions (Enter key, button clicks) and not by typing or programmatic state changes
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

**Property 3: Numeric input integrity**
*For any* numeric value entered in the radius input field, the system should correctly capture, store, and display the complete number without corruption or truncation
**Validates: Requirements 2.6**

**Property 4: Flexible search parameter handling**
*For any* combination of search parameters (name, location, radius), the system should execute appropriate search logic and return relevant results based on the provided parameters
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

**Property 5: Slug-to-ID navigation consistency**
*For any* valid community slug, navigation to post creation should correctly resolve the slug to the appropriate community ID and generate the correct route
**Validates: Requirements 4.1, 4.2**

**Property 6: Post creation flow integrity**
*For any* successful post creation, the new post should appear in the community's post list and the user should be navigated back to the community page
**Validates: Requirements 4.4**

## Error Handling

### Client-Side Error Handling
- **Input Validation**: Real-time validation for radius input with user-friendly error messages
- **Search State Management**: Proper error handling for failed searches with retry options
- **Navigation Errors**: Graceful handling of invalid slugs or missing communities
- **Post Creation Errors**: Clear error messaging for failed post creation attempts

### Server-Side Error Handling
- **Post Status Validation**: Ensure valid status values in API requests
- **Search Parameter Validation**: Validate search parameters before processing
- **Community Resolution**: Handle cases where slugs cannot be resolved to valid communities
- **Database Errors**: Graceful error responses for database operation failures

### Search-Specific Error Handling
- **Invalid Radius Values**: Clear validation and error messages for out-of-range radius values
- **Empty Search Results**: Helpful messaging when no communities or posts match search criteria
- **Network Failures**: Retry logic and offline state handling for search operations
- **Rate Limiting**: Protection against excessive search requests

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit testing and property-based testing to ensure comprehensive coverage:

**Unit Tests** verify specific examples, edge cases, and integration points:
- Post status filtering with specific status values
- Search input handling with various user interactions
- Navigation routing with known slug/ID pairs
- Error handling with specific failure scenarios

**Property-Based Tests** verify universal properties across all inputs:
- Post filtering behavior with random post collections and status filters
- Search control behavior with random input sequences and timing
- Numeric input handling with random numeric values
- Navigation consistency with random valid slugs

### Property-Based Testing Framework

The implementation will use **fast-check** for JavaScript/TypeScript property-based testing. Each property-based test will:
- Run a minimum of 100 iterations with randomly generated inputs
- Be tagged with comments referencing the specific correctness property
- Use the format: `**Feature: community-system-fixes, Property {number}: {property_text}**`

### Test Categories

#### Component Tests
- Post filtering UI with different status selections
- Search input behavior with various user interactions
- Navigation button functionality with different community contexts
- Error state rendering and user feedback

#### Integration Tests
- End-to-end post filtering from UI to API
- Complete search flows with different parameter combinations
- Post creation navigation from slug-based pages
- Error recovery and retry mechanisms

#### Property-Based Tests
- Each correctness property implemented as a separate test
- Random data generation for comprehensive coverage
- State consistency checking across user interactions
- Navigation flow validation with generated test data

### Test Data Generation

Smart generators will be created to:
- Generate posts with various status values and metadata
- Create realistic community data with different slug formats
- Produce varied search parameter combinations
- Generate edge cases for boundary testing
- Create invalid inputs for error handling validation