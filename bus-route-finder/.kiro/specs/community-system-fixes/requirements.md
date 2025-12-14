# Requirements Document

## Introduction

This document outlines the requirements for fixing critical issues in the community system related to post filtering, search functionality, and navigation. The fixes will ensure proper resolved post filtering, controlled search behavior, flexible search parameters, and correct post creation routing.

## Glossary

- **Community_System**: The application module that manages community discovery, membership, and content
- **Resolved_Posts**: Posts that have been marked as resolved or completed by community members
- **Search_Radius**: A geographic distance parameter (in meters) used to filter communities by location
- **Keystroke_Search**: Real-time search that triggers on every character input
- **Enter_Triggered_Search**: Search that only executes when the user presses Enter or clicks search
- **Slug_Route**: URL path using community name slug format (/community/c/[slug])
- **ID_Route**: URL path using community ID format (/community/[id])

## Requirements

### Requirement 1

**User Story:** As a user viewing community posts, I want to filter posts by status including resolved posts, so that I can see only the posts that match my current needs.

#### Acceptance Criteria

1. WHEN a user selects "resolved" status filter THEN the Community_System SHALL display only posts marked as resolved
2. WHEN a user selects "active" status filter THEN the Community_System SHALL display only posts that are not resolved
3. WHEN a user selects "all" status filter THEN the Community_System SHALL display all posts regardless of status
4. WHEN the resolved posts filter is applied THEN the Community_System SHALL fetch and display the correct posts from the backend
5. WHEN no posts match the resolved filter THEN the Community_System SHALL display an appropriate empty state message

### Requirement 2

**User Story:** As a user searching for communities by radius, I want search to only trigger when I press Enter or click search, so that I have control over when the search executes and avoid excessive API calls.

#### Acceptance Criteria

1. WHEN a user types in the radius input field THEN the Community_System SHALL NOT automatically fetch communities
2. WHEN a user presses Enter in the radius input field THEN the Community_System SHALL execute the search with the current radius value
3. WHEN a user clicks the search/refresh button THEN the Community_System SHALL execute the search with the current radius value
4. WHEN a user is typing in the radius field THEN the Community_System SHALL provide visual feedback about the current radius value without triggering searches
5. WHEN the radius value changes THEN the Community_System SHALL update the internal state but not fetch data until explicitly triggered
6. WHEN a user types numeric values in the radius input THEN the Community_System SHALL correctly capture and display the full number without input corruption

### Requirement 3

**User Story:** As a user searching for communities, I want to search by name without requiring a radius parameter, so that I can find communities globally by name alone.

#### Acceptance Criteria

1. WHEN a user enters a community name without setting a radius THEN the Community_System SHALL allow the search to proceed
2. WHEN a user searches by name only THEN the Community_System SHALL return all communities matching the name regardless of location
3. WHEN a user combines name search with radius THEN the Community_System SHALL return communities matching the name within the specified radius
4. WHEN a user clears the name search THEN the Community_System SHALL fall back to location-based search if radius is set
5. WHEN neither name nor radius is provided THEN the Community_System SHALL display appropriate guidance to the user

### Requirement 4

**User Story:** As a community member viewing a community via slug route, I want to create posts successfully, so that I can contribute content to the community.

#### Acceptance Criteria

1. WHEN a member clicks "Create Post" from a slug-based community page THEN the Community_System SHALL navigate to the correct post creation route
2. WHEN navigating to post creation from slug route THEN the Community_System SHALL convert the slug to the appropriate community ID
3. WHEN the post creation page loads THEN the Community_System SHALL display the correct community context and creation form
4. WHEN a post is created successfully THEN the Community_System SHALL redirect back to the community page and display the new post
5. WHEN post creation fails THEN the Community_System SHALL display appropriate error messages and allow retry