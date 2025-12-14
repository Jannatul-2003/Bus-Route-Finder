# Design Document

## Overview

The Community System Enhancement introduces role-based access control, improved search functionality, and modern UI design to the existing community platform. The system will provide different experiences for contributors, members, and visitors while maintaining a clean, intuitive interface.

The enhancement builds upon the existing community architecture using React components, Zustand store management, and Supabase backend services. Key improvements include real-time search with name-based filtering, conditional UI rendering based on user roles, and enhanced user experience with better guidance and modern design patterns.

## Architecture

The enhanced community system follows a layered architecture:

### Presentation Layer
- **React Components**: Enhanced UI components with role-based rendering
- **Custom Hooks**: `useAuth` hook extended with contributor role detection
- **State Management**: Zustand store with enhanced search and filtering capabilities

### Business Logic Layer
- **Community Store**: Enhanced with real-time search and role-based operations
- **Authentication Service**: Extended to handle contributor role validation
- **Search Service**: New service for real-time community name filtering

### Data Access Layer
- **Community Service**: Enhanced with search capabilities and role validation
- **Supabase Client**: Existing database operations with new search queries
- **API Routes**: Enhanced endpoints with role-based authorization

### External Services
- **Supabase Auth**: User authentication and role management
- **Supabase Database**: Community data storage with search optimization
- **Geolocation API**: Location-based community discovery

## Components and Interfaces

### Enhanced Components

#### CommunitySearchInterface
```typescript
interface CommunitySearchProps {
  onSearch: (query: string) => void
  onRadiusChange: (radius: number) => void
  searchRadius: number
  isRadiusSet: boolean
  placeholder?: string
  hintText?: string
}
```

#### RoleBasedCommunityCard
```typescript
interface RoleBasedCommunityCardProps {
  community: CommunityWithDistance
  userRole: 'visitor' | 'member' | 'contributor'
  isMember: boolean
  onJoin?: (communityId: string) => void
  onLeave?: (communityId: string) => void
  onView: (communityId: string) => void
}
```

#### ConditionalActionButtons
```typescript
interface ConditionalActionButtonsProps {
  userRole: 'visitor' | 'member' | 'contributor'
  isMember: boolean
  communityId: string
  onJoin?: () => void
  onLeave?: () => void
  onCreatePost?: () => void
}
```

### New Services

#### SearchService
```typescript
interface SearchService {
  searchCommunitiesByName(query: string, communities: Community[]): Community[]
  debounceSearch(callback: Function, delay: number): Function
  filterByRadius(communities: Community[], userLocation: Location, radius: number): Community[]
}
```

#### RoleAuthorizationService
```typescript
interface RoleAuthorizationService {
  canCreateCommunity(user: User | null): boolean
  canJoinCommunity(user: User | null): boolean
  canCreatePost(user: User | null, communityId: string): boolean
  getUserRole(user: User | null, communityId?: string): UserRole
}
```

## Data Models

### Enhanced User Model
```typescript
interface EnhancedUser extends User {
  is_contributor: boolean
  profile?: UserProfile
}

interface UserProfile {
  id: string
  user_id: string
  display_name?: string
  avatar_url?: string
  is_contributor: boolean
  created_at: string
  updated_at: string
}
```

### Post Navigation Model
```typescript
interface PostNavigationState {
  selectedPostId: string | null
  showPostDetail: boolean
  postFilters: {
    keyword: string
    postType: PostType | null
    status: PostStatus | null
  }
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
}
```

### Role-Based UI State
```typescript
interface RoleBasedUIState {
  userRole: 'visitor' | 'member' | 'contributor'
  visibleActions: {
    canCreateCommunity: boolean
    canJoinCommunity: boolean
    canLeaveCommunity: boolean
    canCreatePost: boolean
    canViewPosts: boolean
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After reviewing all properties identified in the prework, I've identified several areas for consolidation:

- Properties 1.1 and 1.2 can be combined into a single role-based UI visibility property
- Properties 4.1, 4.2, and 4.3 are all testing the same concept and can be consolidated
- Properties 2.2 and 2.3 are specific examples of the general search property 2.1
- Several properties about post visibility and interaction can be combined

### Consolidated Properties

**Property 1: Role-based UI visibility**
*For any* user with a specific role (visitor, member, contributor), the UI should only display actions and options appropriate to that role
**Validates: Requirements 1.1, 1.2, 4.1, 4.2, 4.3**

**Property 2: Real-time community search filtering**
*For any* search query and list of communities, the filtered results should only include communities whose names start with the search query (case-insensitive)
**Validates: Requirements 2.1**

**Property 3: Conditional data fetching based on radius**
*For any* search radius input state, community data should only be fetched when a valid radius value has been provided by the user
**Validates: Requirements 3.2, 3.3, 3.5**

**Property 4: Authorization enforcement**
*For any* API endpoint requiring specific permissions, requests from users without proper authorization should be rejected with appropriate error responses
**Validates: Requirements 1.4**

**Property 5: Universal post visibility**
*For any* community and any user role, all active posts should be visible in read-only mode regardless of the user's authentication status
**Validates: Requirements 4.4, 5.1, 5.5**

**Property 6: Post metadata preservation**
*For any* post creation or community membership change, post content and author attribution should remain intact and properly associated
**Validates: Requirements 5.2, 6.2, 6.4**

**Property 7: Membership state consistency**
*For any* user and community, joining should add membership and leaving should remove membership while preserving user's existing posts
**Validates: Requirements 6.1, 6.4, 6.5**

**Property 8: Automatic community membership on creation**
*For any* community creation by a contributor, the creator should automatically become a member of that community
**Validates: Requirements 1.3**

**Property 9: Post keyword search filtering**
*For any* keyword search query and list of posts, the filtered results should only include posts whose title or content contains the search keyword (case-insensitive)
**Validates: Requirements 2.1 (extended to posts)**

**Property 10: Content validation enforcement**
*For any* post creation attempt, the system should validate content according to defined rules and reject invalid submissions
**Validates: Requirements 6.3**

**Property 11: Responsive design compatibility**
*For any* viewport size within supported ranges, the interface should maintain usability and proper layout without horizontal scrolling or broken elements
**Validates: Requirements 7.5**

## Error Handling

### Client-Side Error Handling
- **Network Errors**: Retry logic with exponential backoff for API calls
- **Validation Errors**: Real-time form validation with user-friendly messages
- **Authentication Errors**: Automatic redirect to login with return URL preservation
- **Authorization Errors**: Clear messaging about required permissions

### Server-Side Error Handling
- **Role Validation**: Consistent authorization checks across all endpoints
- **Data Validation**: Input sanitization and validation before database operations
- **Database Errors**: Graceful error responses with appropriate HTTP status codes
- **Rate Limiting**: Protection against abuse with clear error messages

### Search-Specific Error Handling
- **Empty Results**: Helpful messaging and suggestions for alternative searches
- **Location Errors**: Fallback behavior when geolocation is unavailable
- **Radius Validation**: Clear guidance on acceptable radius values
- **Search Performance**: Debouncing and loading states for smooth UX

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit testing and property-based testing to ensure comprehensive coverage:

**Unit Tests** verify specific examples, edge cases, and integration points:
- Component rendering with different user roles
- API endpoint responses for various scenarios
- Form validation and error handling
- Search functionality with specific inputs

**Property-Based Tests** verify universal properties across all inputs:
- Role-based UI visibility across all user types
- Search filtering behavior with random queries and community lists
- Authorization enforcement across all protected endpoints
- Data consistency during membership operations

### Property-Based Testing Framework

The implementation will use **fast-check** for JavaScript/TypeScript property-based testing. Each property-based test will:
- Run a minimum of 100 iterations with randomly generated inputs
- Be tagged with comments referencing the specific correctness property
- Use the format: `**Feature: community-system-enhancement, Property {number}: {property_text}**`

### Test Categories

#### Component Tests
- Role-based rendering of UI elements
- Search input handling and debouncing
- Community card display with different user states
- Form validation and submission

#### Integration Tests
- End-to-end user flows for different roles
- API integration with authentication
- Search functionality with real data
- Community membership operations

#### Property-Based Tests
- Each correctness property implemented as a separate test
- Random data generation for comprehensive coverage
- Invariant checking across state changes
- Authorization boundary testing

### Test Data Generation

Smart generators will be created to:
- Generate valid user profiles with different roles
- Create realistic community data with geographic distribution
- Produce varied search queries and radius values
- Generate edge cases for boundary testing