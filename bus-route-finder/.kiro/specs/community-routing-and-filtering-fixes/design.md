# Design Document

## Overview

The Community Routing and Filtering Fixes addresses critical issues in the community system related to URL routing consistency and post status filtering accuracy. The solution migrates all community-related URLs to use slug-based routing exclusively, ensuring consistent user-friendly URLs throughout the application, and fixes post status filters ("active" vs "all") to function correctly.

The fixes build upon the existing community architecture while implementing slug-only routing for all community content and improving the filtering logic to properly distinguish between different post status categories.

## Architecture

The solution follows the existing layered architecture with enhancements:

### Presentation Layer
- **Enhanced Post Navigation**: Updated PostCard and navigation components to maintain URL format consistency
- **Improved Post Filtering**: Enhanced PostSearchInput component with corrected status filtering logic
- **Route-Aware Components**: Components that detect and adapt to current route format (slug vs ID)

### Business Logic Layer
- **Route Context Management**: Enhanced navigation hooks to track and preserve route format
- **Improved Filtering Logic**: Updated post filtering to properly distinguish between "active" and "all" status filters
- **Navigation State Management**: Enhanced store to track route context and navigation history

### Data Access Layer
- **Flexible API Integration**: Support for both slug and ID-based community resolution
- **Enhanced Post Queries**: Improved post fetching with proper status filtering

## Components and Interfaces

### Slug-Based Route Management
```typescript
interface SlugRouteContext {
  communitySlug: string
  communityId: string // for API calls
  postSlug?: string
  postId?: string // for API calls
  previousRoute?: string
}

interface NavigationState {
  currentContext: SlugRouteContext
  navigationHistory: SlugRouteContext[]
}
```

### Enhanced Post Navigation Hook
```typescript
interface PostNavigationHook {
  navigateToPost: (communitySlug: string, postSlug: string, options?: NavigationOptions) => void
  navigateBackFromPost: () => void
  navigateToPostCreation: (communitySlug: string) => void
  generatePostUrl: (communitySlug: string, postSlug: string) => string
  generateCreatePostUrl: (communitySlug: string) => string
  generatePostSlug: (postTitle: string) => string
  redirectIdToSlug: (communityId: string, postId?: string) => Promise<void>
}
```

### Enhanced Post Filtering
```typescript
interface PostFilterState {
  keyword: string
  postType: PostType | null
  status: PostStatus | 'all' | null
  defaultStatus: 'active' // Default to active posts only
}

interface PostFilteringService {
  filterPostsByStatus: (posts: PostWithAuthor[], status: PostStatus | 'all' | null) => PostWithAuthor[]
  getDefaultFilter: () => PostFilterState
  isActiveFilter: (status: PostStatus | 'all' | null) => boolean
  isAllFilter: (status: PostStatus | 'all' | null) => boolean
}
```

### Slug-Based PostCard Component
```typescript
interface PostCardProps {
  post: PostWithAuthor & { slug: string }
  communitySlug: string
  onView?: (postSlug: string) => void
  onEdit?: (postSlug: string) => void
  onDelete?: (postSlug: string) => void
  isAuthor?: boolean
  className?: string
}
```

## Data Models

### Slug-Based Navigation Context
```typescript
interface NavigationContext {
  communitySlug: string
  communityId: string
  communityName: string
  postSlug?: string
  postId?: string
  postTitle?: string
  previousRoute?: string
  breadcrumbs: BreadcrumbItem[]
}

interface BreadcrumbItem {
  label: string
  url: string // always slug-based format
}

interface PostSlugGeneration {
  generateSlug: (title: string) => string
  ensureUniqueSlug: (slug: string, communityId: string) => Promise<string>
  validateSlug: (slug: string) => boolean
}
```

### Post Status Filter Model
```typescript
type PostStatusFilter = 'active' | 'resolved' | 'closed' | 'all' | null

interface FilteredPostsResult {
  posts: PostWithAuthor[]
  totalCount: number
  filteredCount: number
  appliedFilters: {
    status: PostStatusFilter
    keyword?: string
    postType?: PostType
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After reviewing all properties identified in the prework, I've identified several areas for consolidation:

- Properties 1.1, 1.2, 1.4, 1.5, 4.1, 4.2, and 4.3 all test slug-based URL format generation and can be combined
- Properties 1.3, 3.3, and 3.5 all test back navigation consistency and can be combined  
- Properties 2.1, 2.3, and 2.5 all test status filtering behavior and can be combined
- Properties 2.2 and 2.4 test the "all" filter behavior and can be combined
- Properties 3.1, 3.2, and 3.4 test post creation flow consistency and can be combined
- Properties 4.4 and 4.5 test legacy URL handling and can be combined

### Consolidated Properties

**Property 1: Slug-based URL format consistency**
*For any* community slug and post slug, all generated URLs should use the slug-based format `/community/c/[slug]/post/p/[postSlug]` exclusively
**Validates: Requirements 1.1, 1.2, 1.4, 1.5, 4.1, 4.2, 4.3**

**Property 2: Navigation back consistency**
*For any* navigation sequence from slug-based community pages to posts, navigating back should return to the original slug-based community URL
**Validates: Requirements 1.3, 3.3, 3.5**

**Property 3: Active status filtering accuracy**
*For any* collection of posts with mixed statuses, applying the "active" status filter should return only posts with status "active"
**Validates: Requirements 2.1, 2.3, 2.5**

**Property 4: All status filter completeness**
*For any* collection of posts with mixed statuses, applying the "all" status filter should return all posts regardless of status and show different counts than "active" filter
**Validates: Requirements 2.2, 2.4**

**Property 5: Post creation flow consistency**
*For any* slug-based community page, the post creation flow should maintain slug-based URL format throughout the process
**Validates: Requirements 3.1, 3.2, 3.4**

**Property 6: Legacy URL redirection**
*For any* legacy ID-based community URL, the system should redirect to the equivalent slug-based URL and provide slug-based URLs for sharing
**Validates: Requirements 4.4, 4.5**

## Error Handling

### Route Resolution Errors
- **Invalid Slugs**: Graceful handling when slugs cannot be resolved to valid communities
- **Missing Communities**: Proper error messages when communities don't exist
- **Route Format Detection**: Fallback mechanisms when route type cannot be determined
- **Navigation State Corruption**: Recovery mechanisms for invalid navigation states

### Filtering Errors
- **Invalid Status Values**: Validation and sanitization of status filter inputs
- **Empty Filter Results**: Appropriate messaging when filters return no results
- **Filter State Inconsistency**: Mechanisms to reset filters to valid states
- **Performance Issues**: Optimization for large post collections during filtering

### Navigation Errors
- **Broken Back Navigation**: Fallback routes when navigation history is corrupted
- **URL Generation Failures**: Error handling for malformed URL generation
- **Deep Link Failures**: Graceful degradation when deep links are invalid
- **Context Loss**: Recovery mechanisms when route context is lost

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit testing and property-based testing to ensure comprehensive coverage:

**Unit Tests** verify specific examples, edge cases, and integration points:
- Specific slug-to-URL conversions with known values
- Status filtering with predefined post collections
- Navigation flows with specific route sequences
- Error handling with known failure scenarios

**Property-Based Tests** verify universal properties across all inputs:
- URL format consistency with random slugs and post IDs
- Status filtering behavior with random post collections
- Navigation consistency with random navigation sequences
- Route context preservation with random route combinations

### Property-Based Testing Framework

The implementation will use **fast-check** for JavaScript/TypeScript property-based testing. Each property-based test will:
- Run a minimum of 100 iterations with randomly generated inputs
- Be tagged with comments referencing the specific correctness property
- Use the format: `**Feature: community-routing-and-filtering-fixes, Property {number}: {property_text}**`

### Test Categories

#### Component Tests
- PostCard navigation with different route contexts
- PostSearchInput filtering with various status combinations
- Navigation hook behavior with different route types
- URL generation with various input combinations

#### Integration Tests
- End-to-end navigation flows from slug pages to posts and back
- Complete filtering workflows with status changes
- Post creation flows from slug-based pages
- Deep link handling for both URL formats

#### Property-Based Tests
- Each correctness property implemented as a separate test
- Random data generation for comprehensive coverage
- Route context consistency checking across navigation sequences
- Filtering accuracy validation with generated test data

### Test Data Generation

Smart generators will be created to:
- Generate valid community slugs and IDs
- Create post collections with various status distributions
- Produce realistic navigation sequences
- Generate edge cases for boundary testing
- Create invalid inputs for error handling validation