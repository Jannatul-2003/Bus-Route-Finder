# Legacy URL Redirection System

This document describes the legacy URL redirection system that ensures backward compatibility for existing bookmarks and links while migrating to slug-based URLs.

## Overview

The system automatically redirects legacy ID-based URLs to their equivalent slug-based URLs, ensuring that:
- Existing bookmarks continue to work
- Shared links remain valid
- SEO benefits are maintained
- User experience is seamless

## URL Formats

### Legacy Format (ID-based)
- Community: `/community/{community-id}`
- Post: `/community/{community-id}/post/{post-id}`
- Post Creation: `/community/{community-id}/create-post`

### New Format (Slug-based)
- Community: `/community/c/{community-slug}`
- Post: `/community/c/{community-slug}/post/p/{post-slug}`
- Post Creation: `/community/c/{community-slug}/create-post`

## Implementation Components

### 1. Middleware (`middleware.ts`)

The Next.js middleware intercepts requests and identifies legacy URLs:

```typescript
// Detects UUID patterns in URLs
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Redirects to resolution endpoints
if (uuidRegex.test(communityId)) {
  return NextResponse.redirect(`/api/redirect/community/${communityId}`)
}
```

### 2. Resolution API Endpoints

#### Community Redirection (`/api/redirect/community/[id]`)
- Validates UUID format
- Resolves community ID to slug
- Redirects to slug-based URL with 301 status

#### Post Redirection (`/api/redirect/post/[communityId]/[postId]`)
- Validates both community and post IDs
- Resolves both to their respective slugs
- Verifies post belongs to community
- Redirects to slug-based URL with 301 status

### 3. Utility Functions (`src/lib/utils/legacyRedirect.ts`)

Provides helper functions for:
- URL pattern detection
- ID extraction from URLs
- Slug resolution
- Shareable URL generation

### 4. React Hooks (`src/hooks/useLegacyRedirect.ts`)

Client-side hooks for:
- Automatic redirection detection
- Component-level URL handling
- Programmatic redirection

### 5. Shareable URL Provider (`src/components/community/ShareableUrlProvider.tsx`)

React context for generating shareable URLs that are always slug-based.

## Usage Examples

### Automatic Redirection

When a user visits a legacy URL:
```
/community/123e4567-e89b-12d3-a456-426614174000
```

They are automatically redirected to:
```
/community/c/dhaka-bus-community
```

### Programmatic URL Generation

```typescript
import { generateShareableCommunityUrl } from '@/lib/utils/legacyRedirect'

// Always returns slug-based URL regardless of input format
const shareUrl = await generateShareableCommunityUrl(communityIdOrSlug)
```

### Component Usage

```typescript
import { useLegacyRedirect } from '@/hooks/useLegacyRedirect'

function CommunityPage() {
  // Automatically handles legacy URL redirection
  useLegacyRedirect()
  
  return <div>Community Content</div>
}
```

## Error Handling

The system gracefully handles various error conditions:

- **Invalid UUID Format**: Returns 400 Bad Request
- **Non-existent Resources**: Returns 404 Not Found
- **Missing Slugs**: Falls back to ID-based URLs temporarily
- **Network Errors**: Logs errors and continues with fallback behavior

## Performance Considerations

- **301 Redirects**: Permanent redirects help search engines update their indexes
- **Caching**: Redirect responses can be cached by browsers and CDNs
- **Minimal Overhead**: Only legacy URLs trigger the resolution process
- **Database Queries**: Efficient lookups using indexed ID fields

## Testing

The system includes comprehensive tests for:
- URL pattern detection
- ID extraction
- Slug resolution
- API endpoint behavior
- Error conditions

Run tests with:
```bash
npm run test -- --run src/__tests__/legacyRedirect.test.ts
npm run test -- --run src/__tests__/api/redirect.test.ts
```

## Migration Strategy

1. **Phase 1**: Deploy redirection system alongside existing routes
2. **Phase 2**: Update all internal links to use slug-based URLs
3. **Phase 3**: Monitor redirect usage and update external references
4. **Phase 4**: Eventually deprecate legacy routes (optional)

## Monitoring

Monitor the effectiveness of the redirection system by tracking:
- Redirect response codes (301 vs 404)
- Most frequently redirected URLs
- Performance impact of resolution queries
- User experience metrics

## Future Enhancements

Potential improvements to consider:
- Caching resolved slugs to reduce database queries
- Batch resolution for multiple URLs
- Analytics integration for redirect tracking
- Automated external link updates