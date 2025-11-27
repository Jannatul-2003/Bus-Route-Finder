# Community System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Database Setup (1 minute)

```bash
cd bus-route-finder
supabase db push
```

Or manually:
```bash
psql -d your_db -f supabase/migrations/20241127000000_create_community_tables.sql
psql -d your_db -f supabase/migrations/20241127000001_create_community_functions.sql
```

### 2. Start Dev Server (30 seconds)

```bash
npm run dev
```

### 3. Access Community Features (30 seconds)

Open browser:
- http://localhost:3000/community

### 4. Test API (1 minute)

```bash
# Get nearby communities
curl "http://localhost:3000/api/communities?latitude=40.7128&longitude=-74.0060&radius=5000"
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/lib/stores/communityStore.ts` | State management |
| `src/lib/services/CommunityService.ts` | Database operations |
| `src/app/community/page.tsx` | Community list page |
| `src/components/community/CommunityCard.tsx` | Community card component |

---

## 🎯 Common Tasks

### Fetch Nearby Communities

```typescript
import { communityStore } from "@/lib/stores/communityStore"

communityStore.fetchNearbyCommunities(latitude, longitude, 5000)
```

### Join a Community

```typescript
await communityStore.joinCommunity(communityId, {
  new_posts: true,
  lost_items: true,
  delays: true,
  emergencies: true
})
```

### Create a Post

```typescript
await communityStore.createPost(communityId, {
  post_type: 'discussion',
  title: 'Hello!',
  content: 'My first post'
})
```

### Add a Comment

```typescript
await communityStore.createComment(postId, {
  content: 'Great post!'
})
```

---

## 🔗 API Endpoints

### Communities
- `GET /api/communities` - List/search
- `POST /api/communities` - Create
- `GET /api/communities/:id` - Get one
- `POST /api/communities/:id/join` - Join
- `POST /api/communities/:id/leave` - Leave

### Posts
- `GET /api/communities/:id/posts` - List
- `POST /api/communities/:id/posts` - Create
- `GET /api/posts/:id` - Get one
- `PUT /api/posts/:id` - Update
- `DELETE /api/posts/:id` - Delete

### Comments
- `GET /api/posts/:id/comments` - List
- `POST /api/posts/:id/comments` - Create

### Notifications
- `GET /api/users/:userId/notifications` - List
- `POST /api/notifications/:id/read` - Mark read
- `POST /api/notifications/read-all` - Mark all read

---

## 📚 Documentation

- **Complete Guide**: `COMMUNITY_SYSTEM_SUMMARY.md`
- **API Reference**: `API_ENDPOINTS_COMPLETE.md`
- **Implementation Details**: `IMPLEMENTATION_COMPLETE.md`
- **API Docs**: `src/app/api/communities/API.md`

---

## ✅ Verification

Check everything works:

```bash
# 1. Database
psql -d your_db -c "SELECT COUNT(*) FROM communities;"

# 2. API
curl http://localhost:3000/api/communities

# 3. Frontend
# Open http://localhost:3000/community in browser
```

---

## 🐛 Troubleshooting

**Communities not showing?**
- Enable location permissions in browser
- Check PostGIS extension: `CREATE EXTENSION IF NOT EXISTS postgis;`

**Can't create posts?**
- Verify you're logged in
- Check you're a community member

**API errors?**
- Check Supabase credentials in `.env.local`
- Verify migrations ran successfully

---

## 📞 Need Help?

1. Check `COMMUNITY_SYSTEM_SUMMARY.md` for detailed info
2. Review `API_ENDPOINTS_COMPLETE.md` for API details
3. See `CommunityService.example.ts` for code examples

---

**Status**: ✅ Ready to use!
