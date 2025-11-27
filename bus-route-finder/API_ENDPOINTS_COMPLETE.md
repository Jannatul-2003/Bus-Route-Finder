# Complete API Endpoints Summary - Bus Route Finder

## All Available API Endpoints

### Bus Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/buses` | Get all buses | No |
| POST | `/api/buses` | Create bus | Yes |
| GET | `/api/buses/:id` | Get bus by ID | No |
| PUT | `/api/buses/:id` | Update bus | Yes |
| DELETE | `/api/buses/:id` | Delete bus | Yes |
| GET | `/api/buses/between-stops` | Get buses between stops | No |

### Stops

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/stops` | Get all stops | No |
| POST | `/api/stops` | Create stop | Yes |
| GET | `/api/stops/search?q=` | Search stops by name | No |
| GET | `/api/stops/within-threshold` | Get stops within threshold | No |

### Route Stops

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/route-stops` | Get all route stops | No |
| GET | `/api/route-stops/by-stop?stop_id=` | Get route stops by stop | No |
| GET | `/api/route-stops/closest` | Get closest stop | No |
| GET | `/api/route-stops/journey-length` | Calculate journey length | No |

### Reviews

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/reviews?bus_id=` | Get reviews (optionally by bus) | No |
| POST | `/api/reviews` | Create review | Yes |

### Distance Calculation

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/distance` | Calculate distance between points | No |

### User Settings

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/user-settings` | Get user settings | Yes |
| PUT | `/api/user-settings` | Update user settings | Yes |

---

## Community System API Endpoints

### Communities

| Method | Endpoint | Description | Auth | Parameters |
|--------|----------|-------------|------|------------|
| GET | `/api/communities` | Get all or nearby communities | No | `latitude`, `longitude`, `radius` |
| GET | `/api/communities/:id` | Get community by ID | No | - |
| POST | `/api/communities` | Create community | Yes | Body: `name`, `description`, `center_latitude`, `center_longitude`, `radius_meters` |
| PUT | `/api/communities/:id` | Update community | Yes | Body: Partial community data |
| DELETE | `/api/communities/:id` | Delete community | Yes | - |

**Example GET /api/communities (nearby)**:
```
GET /api/communities?latitude=40.7128&longitude=-74.0060&radius=5000
```

**Example POST /api/communities**:
```json
{
  "name": "Downtown Commuters",
  "description": "Community for downtown area",
  "center_latitude": 40.7128,
  "center_longitude": -74.0060,
  "radius_meters": 2000
}
```

### Community Members

| Method | Endpoint | Description | Auth | Parameters |
|--------|----------|-------------|------|------------|
| POST | `/api/communities/:id/join` | Join community | Yes | Body: `notification_preferences` (optional) |
| POST | `/api/communities/:id/leave` | Leave community | Yes | - |
| GET | `/api/communities/:id/members` | Get community members | No | - |
| GET | `/api/users/:userId/communities` | Get user's communities | No | - |

**Example POST /api/communities/:id/join**:
```json
{
  "notification_preferences": {
    "new_posts": true,
    "lost_items": true,
    "delays": true,
    "emergencies": true
  }
}
```

### Community Posts

| Method | Endpoint | Description | Auth | Parameters |
|--------|----------|-------------|------|------------|
| GET | `/api/communities/:id/posts` | Get posts by community | No | `post_type`, `status`, `limit`, `offset` |
| POST | `/api/communities/:id/posts` | Create post | Yes | Body: Post data |
| GET | `/api/posts/:id` | Get post by ID (increments views) | No | - |
| PUT | `/api/posts/:id` | Update post | Yes | Body: Partial post data |
| DELETE | `/api/posts/:id` | Delete post | Yes | - |

**Example GET /api/communities/:id/posts (filtered)**:
```
GET /api/communities/123/posts?post_type=lost_item&status=active&limit=20
```

**Example POST /api/communities/:id/posts (Lost Item)**:
```json
{
  "post_type": "lost_item",
  "title": "Lost wallet on Bus 42",
  "content": "I lost my brown leather wallet this morning around 8:30 AM",
  "item_category": "wallet",
  "item_description": "Brown leather wallet with ID cards",
  "photo_url": "https://example.com/photo.jpg",
  "location_latitude": 40.7128,
  "location_longitude": -74.0060,
  "bus_id": "bus-uuid"
}
```

**Example POST /api/communities/:id/posts (Discussion)**:
```json
{
  "post_type": "discussion",
  "title": "Best time to catch the morning bus?",
  "content": "What time do you usually catch the bus to avoid crowds?"
}
```

**Post Types**:
- `discussion` - General discussion
- `lost_item` - Report lost item
- `found_item` - Report found item
- `delay_report` - Report bus delay
- `emergency` - Emergency alert

**Post Status**:
- `active` - Active post
- `resolved` - Resolved (e.g., item found)
- `closed` - Closed by moderator

### Post Comments

| Method | Endpoint | Description | Auth | Parameters |
|--------|----------|-------------|------|------------|
| GET | `/api/posts/:id/comments` | Get comments for a post | No | - |
| POST | `/api/posts/:id/comments` | Create comment | Yes | Body: Comment data |
| PUT | `/api/comments/:id` | Update comment | Yes | Body: Partial comment data |
| DELETE | `/api/comments/:id` | Delete comment | Yes | - |

**Example POST /api/posts/:id/comments**:
```json
{
  "content": "I found a wallet matching this description!",
  "is_resolution": true,
  "contact_info": "Contact me at example@email.com"
}
```

### Notifications

| Method | Endpoint | Description | Auth | Parameters |
|--------|----------|-------------|------|------------|
| GET | `/api/users/:userId/notifications` | Get user notifications | Yes | `unread_only`, `limit` |
| POST | `/api/notifications/:id/read` | Mark notification as read | Yes | - |
| POST | `/api/notifications/read-all` | Mark all notifications as read | Yes | - |

**Example GET /api/users/:userId/notifications**:
```
GET /api/users/user-123/notifications?unread_only=true&limit=50
```

**Notification Types**:
- `new_post` - New post in community
- `new_comment` - New comment on post
- `found_item` - Someone found your lost item
- `delay_alert` - Bus delay reported
- `emergency` - Emergency alert

### Frequent Routes

| Method | Endpoint | Description | Auth | Parameters |
|--------|----------|-------------|------|------------|
| GET | `/api/users/:userId/frequent-routes` | Get user's frequent routes | Yes | - |
| POST | `/api/frequent-routes` | Add/update frequent route | Yes | Body: Route data |
| DELETE | `/api/frequent-routes/:id` | Delete frequent route | Yes | - |

**Example POST /api/frequent-routes**:
```json
{
  "bus_id": "bus-uuid",
  "onboarding_stop_id": "stop-uuid-1",
  "offboarding_stop_id": "stop-uuid-2"
}
```

---

## Response Formats

### Success Responses

**Single Resource**:
```json
{
  "id": "uuid",
  "name": "Resource Name",
  ...
}
```

**List of Resources**:
```json
[
  {
    "id": "uuid-1",
    "name": "Resource 1",
    ...
  },
  {
    "id": "uuid-2",
    "name": "Resource 2",
    ...
  }
]
```

**Delete/Action Success**:
```json
{
  "success": true
}
```

### Error Responses

**400 Bad Request**:
```json
{
  "error": "Missing required fields: name, center_latitude, center_longitude"
}
```

**401 Unauthorized**:
```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden**:
```json
{
  "error": "Forbidden"
}
```

**404 Not Found**:
```json
{
  "error": "Community not found"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Failed to fetch communities"
}
```

---

## Authentication

### Required Headers

For authenticated endpoints, include the Supabase session token:

```
Authorization: Bearer <supabase-jwt-token>
```

### Getting the Token

```typescript
import { getSupabaseClient } from "@/lib/supabase/client"

const supabase = getSupabaseClient()
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token
```

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production:

- 100 requests per minute per IP for read operations
- 20 requests per minute per user for write operations
- 5 requests per minute for community creation

---

## CORS

All API routes support CORS for the following origins:
- Same origin (default)
- Configure additional origins in Next.js config if needed

---

## Pagination

For endpoints that support pagination:

**Query Parameters**:
- `limit` - Number of items to return (default: 20, max: 100)
- `offset` - Number of items to skip (default: 0)

**Example**:
```
GET /api/communities/123/posts?limit=20&offset=40
```

---

## Filtering

### Posts Filtering

**By Type**:
```
GET /api/communities/123/posts?post_type=lost_item
```

**By Status**:
```
GET /api/communities/123/posts?status=active
```

**Combined**:
```
GET /api/communities/123/posts?post_type=lost_item&status=active&limit=10
```

### Notifications Filtering

**Unread Only**:
```
GET /api/users/123/notifications?unread_only=true
```

---

## Geographic Queries

### Nearby Communities

Uses PostGIS for efficient geographic queries:

```
GET /api/communities?latitude=40.7128&longitude=-74.0060&radius=5000
```

**Parameters**:
- `latitude` - User's latitude (-90 to 90)
- `longitude` - User's longitude (-180 to 180)
- `radius` - Search radius in meters (100 to 10000)

**Response includes distance**:
```json
[
  {
    "id": "uuid",
    "name": "Downtown Commuters",
    "distance": 1250.5,
    ...
  }
]
```

---

## Testing Endpoints

### Using cURL

**Get nearby communities**:
```bash
curl "http://localhost:3000/api/communities?latitude=40.7128&longitude=-74.0060&radius=5000"
```

**Create community** (requires auth):
```bash
curl -X POST "http://localhost:3000/api/communities" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Test Community",
    "center_latitude": 40.7128,
    "center_longitude": -74.0060,
    "radius_meters": 2000
  }'
```

**Join community**:
```bash
curl -X POST "http://localhost:3000/api/communities/123/join" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "notification_preferences": {
      "new_posts": true,
      "lost_items": true,
      "delays": true,
      "emergencies": true
    }
  }'
```

### Using Postman

1. Import the API collection
2. Set environment variables:
   - `BASE_URL`: http://localhost:3000
   - `AUTH_TOKEN`: Your Supabase JWT token
3. Test endpoints with pre-configured requests

---

## Database Functions (RPC)

These are called internally by the API but can also be called directly:

### get_nearby_communities

```sql
SELECT * FROM get_nearby_communities(
  user_lat := 40.7128,
  user_lng := -74.0060,
  search_radius := 5000
);
```

### increment_post_view_count

```sql
SELECT increment_post_view_count(post_id := 'uuid');
```

### get_posts_near_location

```sql
SELECT * FROM get_posts_near_location(
  search_lat := 40.7128,
  search_lng := -74.0060,
  search_radius := 1000,
  post_types := ARRAY['lost_item', 'found_item']
);
```

---

## WebSocket / Real-time (Future)

For real-time updates, consider implementing Supabase Realtime:

```typescript
const channel = supabase
  .channel('community-posts')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'community_posts',
    filter: `community_id=eq.${communityId}`
  }, (payload) => {
    console.log('New post:', payload.new)
  })
  .subscribe()
```

---

## Performance Tips

1. **Use pagination** for large datasets
2. **Filter at the API level** rather than client-side
3. **Cache responses** for frequently accessed data
4. **Use geographic queries** for location-based features
5. **Batch requests** when possible
6. **Implement debouncing** for search inputs

---

## Security Best Practices

1. **Always validate input** on the server side
2. **Use RLS policies** for data access control
3. **Sanitize user content** to prevent XSS
4. **Rate limit** write operations
5. **Log suspicious activity**
6. **Use HTTPS** in production
7. **Rotate API keys** regularly
8. **Implement CSRF protection**

---

## Monitoring

Recommended metrics to track:

- Request count by endpoint
- Response times (p50, p95, p99)
- Error rates by status code
- Geographic query performance
- Database connection pool usage
- Cache hit rates

---

## Support

For API issues:
1. Check this documentation
2. Review `/api/communities/API.md` for detailed examples
3. Check `/api/communities/ROUTES.md` for route structure
4. See `COMMUNITY_SYSTEM_SUMMARY.md` for complete system overview
