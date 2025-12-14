# Implementation Plan

- [x] 1. Add post slug generation and database schema updates





  - Add slug field to posts table in database migration
  - Create slug generation utility function for post titles
  - Implement unique slug validation within communities
  - Update post creation to generate and store slugs
  - _Requirements: 1.2, 4.1_

- [ ]* 1.1 Write property test for post slug generation
  - **Property 1: Slug-based URL format consistency**
  - **Validates: Requirements 1.1, 1.2, 1.4, 1.5, 4.1, 4.2, 4.3**

- [x] 2. Create new slug-based post routing structure





  - Create new route file at `/community/c/[slug]/post/p/[postSlug]/page.tsx`
  - Implement post resolution by community slug and post slug
  - Add API endpoint to fetch posts by slug within community context
  - Update post detail page to work with slug-based routing
  - _Requirements: 1.2, 4.1_
- [x] 3. Update post creation flow for slug-based routing




- [ ] 3. Update post creation flow for slug-based routing

  - Create new route file at `/community/c/[slug]/create-post/page.tsx`
  - Update post creation form to resolve community by slug
  - Ensure post creation redirects back to slug-based community page
  - Handle error cases while maintaining slug-based URLs
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 3.1 Write property test for post creation flow
  - **Property 5: Post creation flow consistency**
  - **Validates: Requirements 3.1, 3.2, 3.4**

- [x] 4. Fix post status filtering logic





  - Update PostSearchInput component to properly handle "active" vs "all" status filters
  - Fix community store filtering logic to distinguish between status types
  - Ensure "active" filter shows only active posts
  - Ensure "all" filter shows posts of any status
  - Set default filter to "active" posts only
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 4.1 Write property test for active status filtering
  - **Property 3: Active status filtering accuracy**
  - **Validates: Requirements 2.1, 2.3, 2.5**

- [ ]* 4.2 Write property test for all status filtering
  - **Property 4: All status filter completeness**
  - **Validates: Requirements 2.2, 2.4**

- [x] 5. Update PostCard component for slug-based navigation




  - Modify PostCard to use post slugs for navigation
  - Update navigation logic to generate slug-based URLs
  - Ensure PostCard works with both community slug and post slug
  - Update click handlers to use slug-based routing
  - _Requirements: 1.1, 1.2_

- [x] 6. Update usePostNavigation hook for slug-based routing





  - Modify navigation functions to use slugs instead of IDs
  - Add slug generation and validation functions
  - Update URL generation to use `/community/c/[slug]/post/p/[postSlug]` format
  - Ensure back navigation maintains slug-based URLs
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ]* 6.1 Write property test for navigation back consistency
  - **Property 2: Navigation back consistency**
  - **Validates: Requirements 1.3, 3.3, 3.5**

- [x] 7. Add legacy URL redirection support



  - Create middleware or route handlers to redirect ID-based URLs to slug-based URLs
  - Implement community ID to slug resolution
  - Implement post ID to slug resolution within community context
  - Ensure backward compatibility for existing bookmarks and links
  - _Requirements: 4.4, 4.5_

- [ ]* 7.1 Write property test for legacy URL redirection
  - **Property 6: Legacy URL redirection**
  - **Validates: Requirements 4.4, 4.5**




- [ ] 8. Update all community navigation to use slug-based URLs

  - Update community store navigation methods
  - Update breadcrumb generation to use slug-based URLs
  - Update any hardcoded navigation links





  - Ensure all programmatic URL generation uses slugs
  - _Requirements: 4.2, 4.3_

- [ ] 9. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Update API endpoints to support slug-based resolution



  - Create or update API endpoints to resolve communities by slug
  - Create or update API endpoints to resolve posts by slug within community
  - Ensure existing ID-based endpoints continue to work for backward compatibility
  - Add proper error handling for invalid slugs
  - _Requirements: 1.2, 3.2, 4.1_

- [x] 11. Final integration testing and cleanup





  - Test complete user flows with slug-based routing
  - Verify post status filtering works correctly
  - Test legacy URL redirection
  - Clean up any unused ID-based route files
  - Verify all navigation maintains slug consistency
  - _Requirements: All_
-

- [x] 12. Final Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.