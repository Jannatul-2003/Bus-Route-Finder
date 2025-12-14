# Requirements Document

## Introduction

This document outlines the requirements for fixing critical routing and filtering issues in the community system. The fixes will ensure consistent slug-based routing for post navigation and proper post status filtering behavior to distinguish between "active" and "all" status filters.

## Glossary

- **Community_System**: The application module that manages community discovery, membership, and content
- **Slug_Route**: URL path using community name slug format (/community/c/[slug])
- **ID_Route**: Legacy URL path using community ID format (/community/[id]) that should redirect to slug format
- **Post_Navigation**: The routing system for navigating to individual post detail pages using post slugs
- **Post_Slug**: A URL-friendly identifier generated from post titles for use in URLs
- **Status_Filter**: A filter mechanism that allows users to view posts based on their status (active, resolved, all)
- **Active_Posts**: Posts that have a status of "active" and are not resolved or closed
- **All_Posts**: All posts regardless of their status (active, resolved, closed, etc.)

## Requirements

### Requirement 1

**User Story:** As a user viewing a community via slug route, I want post navigation to maintain slug-based routing consistency, so that URLs remain user-friendly and SEO-optimized throughout my browsing experience.

#### Acceptance Criteria

1. WHEN a user clicks on a post from a slug-based community page THEN the Community_System SHALL navigate to a slug-based post URL format
2. WHEN navigating to post details from slug route THEN the Community_System SHALL use the format `/community/c/[slug]/post/p/[postSlug]`
3. WHEN a user navigates back from a post detail page THEN the Community_System SHALL return to the original slug-based community page
4. WHEN post creation is initiated from a slug-based community page THEN the Community_System SHALL use slug-based routing for the creation flow
5. WHEN sharing or bookmarking post URLs THEN the Community_System SHALL maintain slug-based format for better user experience

### Requirement 2

**User Story:** As a user filtering community posts, I want the "active" and "all" status filters to show different results, so that I can effectively filter posts based on their current status.

#### Acceptance Criteria

1. WHEN a user selects "active" status filter THEN the Community_System SHALL display only posts with status "active"
2. WHEN a user selects "all" status filter THEN the Community_System SHALL display posts with any status including active, resolved, and closed
3. WHEN no status filter is applied THEN the Community_System SHALL default to showing active posts only
4. WHEN switching between "active" and "all" filters THEN the Community_System SHALL show visibly different post counts and content
5. WHEN posts have different statuses THEN the Community_System SHALL correctly categorize and filter them based on the selected status filter

### Requirement 3

**User Story:** As a user creating posts from a slug-based community page, I want the creation flow to maintain slug-based routing, so that the URL structure remains consistent throughout the process.

#### Acceptance Criteria

1. WHEN clicking "Create Post" from a slug-based community page THEN the Community_System SHALL navigate to `/community/c/[slug]/create-post`
2. WHEN the post creation form loads from slug route THEN the Community_System SHALL correctly identify the community context
3. WHEN a post is successfully created from slug route THEN the Community_System SHALL redirect back to the slug-based community page
4. WHEN post creation fails from slug route THEN the Community_System SHALL maintain the slug-based URL structure for error handling
5. WHEN canceling post creation from slug route THEN the Community_System SHALL return to the original slug-based community page

### Requirement 4

**User Story:** As a user accessing any community content, I want all URLs to use slug-based routing consistently, so that URLs are always user-friendly and SEO-optimized.

#### Acceptance Criteria

1. WHEN accessing any post THEN the Community_System SHALL use the format `/community/c/[slug]/post/p/[postSlug]` regardless of entry point
2. WHEN navigating between community pages THEN the Community_System SHALL always use slug-based URLs
3. WHEN generating any community-related URLs THEN the Community_System SHALL use slug format exclusively
4. WHEN handling existing ID-based URLs THEN the Community_System SHALL redirect to the equivalent slug-based URL
5. WHEN sharing or bookmarking any community content THEN the Community_System SHALL provide slug-based URLs only