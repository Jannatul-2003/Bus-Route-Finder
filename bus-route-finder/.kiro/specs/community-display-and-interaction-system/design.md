# Design Document

## Overview

This design addresses three critical issues in the community system:

1. **Author Display Problem**: Posts currently show "unknown author" instead of actual user emails
2. **Non-functional Helpful Button**: The helpful button doesn't work for logged-in users
3. **Comment System Issues**: Authenticated users see barriers when trying to comment

The solution involves fixing database queries to properly join with auth.users table, implementing helpful button functionality using the existing helpful_count field, and ensuring proper authentication state management for commenting.

## Architecture

The fix involves three main layers:

1. **Data Layer**: Update database queries to join community_posts with auth.users table
2. **API Layer**: Implement endpoints for helpful button interactions and proper comment handling
3. **UI Layer**: Update components to display author emails and handle helpful button interactions

## Components and Interfaces

### Enhanced Database Queries

The system will update queries to:
- Join community_posts table with auth.users table using author_id foreign key
- Return complete author information including email
- Handle cases where user data might be missing with appropriate fallbacks

### Helpful Button System

The helpful button functionality will:
- Use existing helpful_count field in community_posts table
- Track user interactions to prevent duplicate helpful marks
- Update counts in real-time when users interact
- Show current helpful state for logged-in users

### Comment System Integration

The comment system will:
- Properly detect authenticated user state
- Show active comment input for logged-in users
- Save comments to post_comments table with correct author_id
- Update comment_count field in community_posts table

## Data Models

### Enhanced Post Interface
```typescript
interface PostWithAuthor {
  id: string
  community_id: string
  author_id: string
  post_type: string
  title: string
  content: string
  helpful_count: number
  comment_count: number
  created_at: string
  updated_at: string
  author: {
    id: string
    email: string
  }
}
```

### Enhanced Comment Interface
```typescript
interface CommentWithAuthor {
  id: string
  post_id: string
  author_id: string
  content: string
  helpful_count: number
  created_at: string
  updated_at: string
  author: {
    id: string
    email: string
  }
}
```

### Helpful Interaction State
```typescript
interface HelpfulState {
  post_id: string
  user_id: string
  is_helpful: boolean
}
```
## 
Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing the acceptance criteria, several properties can be consolidated:
- Properties 1.1 and 1.4 (database joins and foreign key usage) can be combined into one property about author data retrieval
- Properties 2.1 and 2.2 (helpful button toggle and count update) can be combined into one comprehensive helpful functionality property
- Properties 1.2 and 3.3 (author email display for posts and comments) can be combined into one property about author information display

### Core Properties

**Property 1: Author data retrieval completeness**
*For any* community post or comment retrieved by the system, the author information should include the actual email from auth.users table using the author_id foreign key relationship
**Validates: Requirements 1.1, 1.2, 1.4, 3.3**

**Property 2: Helpful button functionality**
*For any* logged-in user clicking the helpful button on a post, the system should toggle the helpful state, update the helpful_count in the database, and prevent duplicate helpful actions from the same user
**Validates: Requirements 2.1, 2.2, 2.4**

**Property 3: Helpful count display accuracy**
*For any* post displayed in the system, the helpful count shown should match the helpful_count value stored in the community_posts table
**Validates: Requirements 2.3**

**Property 4: Helpful button state display**
*For any* logged-in user viewing a post, the helpful button should show the correct state (marked/unmarked) based on the user's previous interactions with that post
**Validates: Requirements 2.5**

**Property 5: Comment interface for authenticated users**
*For any* authenticated user viewing a post detail page, the comment interface should display an active input field rather than authentication prompts
**Validates: Requirements 3.1**

**Property 6: Comment submission and storage**
*For any* authenticated user submitting a valid comment, the system should save the comment to post_comments table with the correct author_id and update the comment_count in community_posts table
**Validates: Requirements 3.2, 3.5**

**Property 7: Authentication state responsiveness**
*For any* change in authentication state, the comment interface should update immediately to reflect the new authentication status
**Validates: Requirements 3.4**

## Error Handling

### Missing Author Data
- When auth.users data is unavailable, display meaningful fallback (email domain or "User [ID]")
- Log missing author data for system monitoring
- Gracefully handle database join failures

### Helpful Button Interactions
- Handle network failures during helpful button clicks with retry mechanisms
- Prevent race conditions when multiple users interact simultaneously
- Revert UI state if database update fails

### Comment System Errors
- Validate comment content before submission
- Handle authentication token expiration during comment submission
- Provide clear error messages for failed comment operations

## Testing Strategy

### Unit Testing Approach
- Test individual components with mocked authentication states
- Verify database query construction for author data joins
- Test helpful button state management with various user scenarios
- Validate comment submission flow with different authentication states

### Property-Based Testing Approach
- Use **fast-check** library for JavaScript/TypeScript property-based testing
- Configure each property test to run minimum 100 iterations
- Generate random user data, posts, comments, and authentication states
- Test universal properties across all valid input combinations

**Property-based testing requirements:**
- Each correctness property will be implemented as a single property-based test
- Tests will be tagged with format: **Feature: community-display-and-interaction-system, Property {number}: {property_text}**
- Minimum 100 iterations per property test to ensure thorough coverage
- Random data generation for users, posts, comments, and helpful interactions

### Integration Testing
- Test complete flow from post display to author email showing
- Verify helpful button functionality across different user sessions
- Test comment submission and display with real authentication
- Validate database consistency after multiple user interactions