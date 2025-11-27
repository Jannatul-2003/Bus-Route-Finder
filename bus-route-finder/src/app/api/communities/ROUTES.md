# Community System API Routes - Quick Reference

## Communities
- `GET /api/communities` - Get all or nearby communities
- `GET /api/communities/:id` - Get community by ID
- `POST /api/communities` - Create community
- `PUT /api/communities/:id` - Update community
- `DELETE /api/communities/:id` - Delete community

## Community Members
- `POST /api/communities/:id/join` - Join community
- `POST /api/communities/:id/leave` - Leave community
- `GET /api/communities/:id/members` - Get members of a community
- `GET /api/users/:userId/communities` - Get communities for a user

## Community Posts
- `GET /api/communities/:id/posts` - Get posts by community (with filters)
- `GET /api/posts/:id` - Get post by ID
- `POST /api/communities/:id/posts` - Create post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

## Post Comments
- `GET /api/posts/:id/comments` - Get comments for a post
- `POST /api/posts/:id/comments` - Create comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

## Notifications
- `GET /api/users/:userId/notifications` - Get notifications for a user
- `POST /api/notifications/:id/read` - Mark notification as read
- `POST /api/notifications/read-all` - Mark all notifications as read

## Frequent Routes
- `GET /api/users/:userId/frequent-routes` - Get user frequent routes
- `POST /api/frequent-routes` - Add or update a frequent route
- `DELETE /api/frequent-routes/:id` - Delete a frequent route

## File Structure

```
src/app/api/
├── communities/
│   ├── [id]/
│   │   ├── join/
│   │   │   └── route.ts
│   │   ├── leave/
│   │   │   └── route.ts
│   │   ├── members/
│   │   │   └── route.ts
│   │   ├── posts/
│   │   │   └── route.ts
│   │   └── route.ts
│   └── route.ts
├── posts/
│   └── [id]/
│       ├── comments/
│       │   └── route.ts
│       └── route.ts
├── comments/
│   └── [id]/
│       └── route.ts
├── notifications/
│   ├── [id]/
│   │   └── read/
│   │       └── route.ts
│   └── read-all/
│       └── route.ts
├── frequent-routes/
│   ├── [id]/
│   │   └── route.ts
│   └── route.ts
└── users/
    └── [userId]/
        ├── communities/
        │   └── route.ts
        ├── notifications/
        │   └── route.ts
        └── frequent-routes/
            └── route.ts
```
