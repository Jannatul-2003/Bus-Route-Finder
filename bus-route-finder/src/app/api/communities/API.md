# Community System API Documentation

This document describes all API endpoints for the Area-Based Community System.

## Authentication

Most endpoints require authentication. Include the Supabase session token in your requests.

## Communities

### Get Communities

```
GET /api/communities
```

Get all communities or nearby communities based on coordinates.

**Query Parameters:**
- `latitude` (optional): User's latitude
- `longitude` (optional): User's longitude
- `radius` (optional): Search radius in meters (default: 5000)

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Downtown Commuters",
    "description": "Community for downtown area",
    "center_latitude": 40.7128,
    "center_longitude": -74.0060,
    "radius_meters": 2000,
    "member_count": 150,
    "post_count": 45,
    "created_at": "2024-11-27T00:00:00Z",
    "updated_at": "2024-11-27T00:00:00Z",
    "distance": 1250.5
  }
]
```

### Get Community by ID

```
GET /api/communities/:id
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Downtown Commuters",
  "description": "Community for downtown area",
  "center_latitude": 40.7128,
  "center_longitude": -74.0060,
  "radius_meters": 2000,
  "member_count": 150,
  "post_count": 45,
  "created_at": "2024-11-27T00:00:00Z",
  "updated_at": "2024-11-27T00:00:00Z"
}
```

### Create Community

```
POST /api/communities
```

**Request Body:**
```json
{
  "name": "Downtown Commuters",
  "description": "Community for downtown area",
  "center_latitude": 40.7128,
  "center_longitude": -74.0060,
  "radius_meters": 2000
}
```

**Response:** `201 Created` with community object

### Update Community

```
PUT /api/communities/:id
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "radius_meters": 3000
}
```

**Response:** Updated community object

### Delete Community

```
DELETE /api/communities/:id
```

**Response:** `{ "success": true }`

## Community Members

### Join Community

```
POST /api/communities/:id/join
```

**Request Body:**
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

**Response:** `201 Created` with member object

### Leave Community

```
POST /api/communities/:id/leave
```

**Response:** `{ "success": true }`

### Get Community Members

```
GET /api/communities/:id/members
```

**Response:**
```json
[
  {
    "id": "uuid",
    "community_id": "uuid",
    "user_id": "uuid",
    "role": "member",
    "joined_at": "2024-11-27T00:00:00Z",
    "last_active_at": "2024-11-27T00:00:00Z",
    "notification_preferences": {
      "new_posts": true,
      "lost_items": true,
      "delays": true,
      "emergencies": true
    },
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    }
  }
]
```

### Get User Communities

```
GET /api/users/:userId/communities
```

**Response:** Array of community objects

## Community Posts

### Get Community Posts

```
GET /api/communities/:id/posts
```

**Query Parameters:**
- `post_type` (optional): Filter by type (discussion, lost_item, found_item, delay_report, emergency)
- `status` (optional): Filter by status (active, resolved, closed)
- `limit` (optional): Number of posts to return
- `offset` (optional): Pagination offset

**Response:**
```json
[
  {
    "id": "uuid",
    "community_id": "uuid",
    "author_id": "uuid",
    "post_type": "lost_item",
    "title": "Lost wallet on Bus 42",
    "content": "I lost my brown leather wallet...",
    "item_category": "wallet",
    "item_description": "Brown leather wallet",
    "photo_url": "https://...",
    "location_latitude": 40.7128,
    "location_longitude": -74.0060,
    "bus_id": "uuid",
    "status": "active",
    "resolved_at": null,
    "view_count": 25,
    "comment_count": 3,
    "helpful_count": 5,
    "created_at": "2024-11-27T00:00:00Z",
    "updated_at": "2024-11-27T00:00:00Z",
    "author": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "bus": {
      "id": "uuid",
      "name": "Bus 42"
    }
  }
]
```

### Create Post

```
POST /api/communities/:id/posts
```

**Request Body:**
```json
{
  "post_type": "lost_item",
  "title": "Lost wallet on Bus 42",
  "content": "I lost my brown leather wallet this morning around 8:30 AM",
  "item_category": "wallet",
  "item_description": "Brown leather wallet with ID cards",
  "photo_url": "https://...",
  "location_latitude": 40.7128,
  "location_longitude": -74.0060,
  "bus_id": "uuid"
}
```

**Response:** `201 Created` with post object

### Get Post by ID

```
GET /api/posts/:id
```

**Response:** Post object (also increments view count)

### Update Post

```
PUT /api/posts/:id
```

**Request Body:**
```json
{
  "title": "Updated title",
  "content": "Updated content",
  "status": "resolved"
}
```

**Response:** Updated post object

### Delete Post

```
DELETE /api/posts/:id
```

**Response:** `{ "success": true }`

## Post Comments

### Get Post Comments

```
GET /api/posts/:id/comments
```

**Response:**
```json
[
  {
    "id": "uuid",
    "post_id": "uuid",
    "author_id": "uuid",
    "content": "I found a wallet matching this description!",
    "is_resolution": false,
    "contact_info": null,
    "helpful_count": 2,
    "created_at": "2024-11-27T00:00:00Z",
    "updated_at": "2024-11-27T00:00:00Z",
    "author": {
      "id": "uuid",
      "email": "user@example.com"
    }
  }
]
```

### Create Comment

```
POST /api/posts/:id/comments
```

**Request Body:**
```json
{
  "content": "I found a wallet matching this description!",
  "is_resolution": true,
  "contact_info": "Contact me at [email]"
}
```

**Response:** `201 Created` with comment object

### Update Comment

```
PUT /api/comments/:id
```

**Request Body:**
```json
{
  "content": "Updated comment",
  "is_resolution": true
}
```

**Response:** Updated comment object

### Delete Comment

```
DELETE /api/comments/:id
```

**Response:** `{ "success": true }`

## Notifications

### Get User Notifications

```
GET /api/users/:userId/notifications
```

**Query Parameters:**
- `unread_only` (optional): Set to "true" to get only unread notifications
- `limit` (optional): Number of notifications to return (default: 50)

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "community_id": "uuid",
    "post_id": "uuid",
    "notification_type": "found_item",
    "title": "Someone found your lost item!",
    "message": "A user commented on your lost wallet post",
    "read": false,
    "created_at": "2024-11-27T00:00:00Z"
  }
]
```

### Mark Notification as Read

```
POST /api/notifications/:id/read
```

**Response:** `{ "success": true }`

### Mark All Notifications as Read

```
POST /api/notifications/read-all
```

**Response:** `{ "success": true }`

## Frequent Routes

### Get User Frequent Routes

```
GET /api/users/:userId/frequent-routes
```

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "bus_id": "uuid",
    "onboarding_stop_id": "uuid",
    "offboarding_stop_id": "uuid",
    "usage_count": 15,
    "last_used_at": "2024-11-27T00:00:00Z",
    "created_at": "2024-11-27T00:00:00Z"
  }
]
```

### Add/Update Frequent Route

```
POST /api/frequent-routes
```

**Request Body:**
```json
{
  "bus_id": "uuid",
  "onboarding_stop_id": "uuid",
  "offboarding_stop_id": "uuid"
}
```

**Response:** `201 Created` with route object (or updated existing route)

### Delete Frequent Route

```
DELETE /api/frequent-routes/:id
```

**Response:** `{ "success": true }`

## Error Responses

All endpoints may return the following error responses:

- `400 Bad Request`: Invalid input or missing required fields
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: User doesn't have permission
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

**Error Response Format:**
```json
{
  "error": "Error message description"
}
```
