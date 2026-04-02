# Multi-User Platform Setup Guide

This document explains the new **per-user OAuth credential system** that makes AutoSocial a true multi-tenant SaaS platform.

## Architecture Overview

### Before (Single-Tenant)
```
.env.local
├── INSTAGRAM_CLIENT_ID
├── INSTAGRAM_CLIENT_SECRET
├── LINKEDIN_CLIENT_ID
└── etc...

All users share the same OAuth app credentials
```

### After (Multi-Tenant)
```
Database: oauth_credentials table
├── user_1 → Instagram App (their own)
├── user_1 → LinkedIn App (their own)
├── user_2 → Instagram App (different app)
└── user_2 → LinkedIn App (different app)

Each user manages their own platform integrations
```

## What Changed

### 1. **New Database Tables & Columns**

Added `user_id` to all user-scoped tables:
- `posts.user_id`
- `platform_connections.user_id`
- `scheduled_jobs.user_id`
- `analytics.user_id`

New table: `oauth_credentials`
```sql
oauth_credentials (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  platform TEXT,
  client_id TEXT,
  client_secret TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, platform)
)
```

### 2. **RLS Policies**

Every table now has row-level security:
- Users can ONLY see/modify their own data
- Enforced at database level (cannot bypass with admin keys)

### 3. **OAuth Flow Changes**

**Old Flow:**
1. User clicks "Connect Instagram"
2. Gets redirected to platform OAuth
3. Platform redirects back to `/api/auth/instagram/callback`
4. Callback reads `INSTAGRAM_CLIENT_ID` from env
5. Token is stored with platform name only

**New Flow:**
1. User must FIRST configure their OAuth app credentials
2. User clicks "Connect Instagram"
3. Gets redirected to platform OAuth using THEIR credentials
4. Platform redirects back to `/api/auth/instagram/callback`
5. Callback reads credentials from `oauth_credentials` table
6. Token is stored with `user_id + platform` key

## Setup Instructions for Each User

### Step 1: User Creates Their Own OAuth Apps

For each platform they want to connect, users must:

**Instagram:**
1. Go to [Facebook Developers](https://developers.facebook.com/apps)
2. Create a new App (or use existing Business Manager account)
3. Add Instagram Graph API product
4. Get App ID (Client ID) and App Secret (Client Secret)
5. Set Callback URL to: `{APP_URL}/api/auth/instagram/callback`

**LinkedIn:**
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Create a new App
3. Get Client ID and Client Secret
4. Set Callback URL to: `{APP_URL}/api/auth/linkedin/callback`

*(Similar process for Twitter, Pinterest, Dribbble, Google My Business)*

### Step 2: Save OAuth Credentials in AutoSocial

Users save their credentials via API or UI:

**Via API (POST):**
```bash
curl -X POST http://localhost:3000/api/oauth-credentials \
  -H "Authorization: Bearer {USER_SESSION_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "instagram",
    "clientId": "YOUR_INSTAGRAM_APP_ID",
    "clientSecret": "YOUR_INSTAGRAM_APP_SECRET"
  }'
```

**Response:**
```json
{
  "credentials": {
    "id": "uuid",
    "user_id": "user-id",
    "platform": "instagram",
    "client_id": "YOUR_ID",
    "client_secret": "YOUR_SECRET",
    "created_at": "2026-04-02T...",
    "updated_at": "2026-04-02T..."
  }
}
```

### Step 3: Connect Platform Account

Once credentials are saved, user can connect their platform account:
1. Go to Settings → Connected Platforms
2. Click "Connect Instagram" (or other platform)
3. Logs in with their Instagram Business account
4. Authorizes the app
5. Token is automatically stored in `platform_connections` with their user_id

### Step 4: Create & Schedule Posts

All posts created will automatically be associated with the user:
- Posts are scoped to `user_id`
- Can only post to platforms they've connected
- Scheduling respects their timezone

## API Changes

### Database Queries

All functions now require `userId` as first parameter:

**Before:**
```typescript
const posts = await getPosts({ status: 'draft' });
```

**After:**
```typescript
const posts = await getPosts(userId, { status: 'draft' });
```

### Middleware

User ID is automatically set on every request via `user-id` cookie:

```typescript
// In route handlers
const userId = request.cookies.get('user-id')?.value;
```

### New Endpoints

**GET /api/oauth-credentials**
- List user's saved OAuth credentials
- Response: `{ credentials: [{id, platform, created_at, ...}] }`

**POST /api/oauth-credentials**
- Save OAuth credentials for a platform
- Body: `{ platform, clientId, clientSecret }`

**DELETE /api/oauth-credentials?platform=instagram**
- Delete saved credentials for a platform

## Migration Checklist

- [ ] Run SQL migration: `supabase migration up 01_add_user_isolation`
- [ ] Update `.env.local` — REMOVE all PLATFORM_CLIENT_ID/SECRET vars
- [ ] Update all route handlers to accept `userId` parameter
- [ ] Update UI to show "Add OAuth Credentials" form
- [ ] Test: Create new user → Save credentials → Connect platform → Post
- [ ] Test: Two users connect same platform with different apps
- [ ] Verify RLS: User A cannot see User B's posts/connections

## Testing Multi-Tenant Isolation

```bash
# Test in browser or Postman

# User A: Save Instagram credentials
curl -X POST http://localhost:3000/api/oauth-credentials \
  -H "Cookie: user-id=user-a-id" \
  -d '{platform: "instagram", clientId: "app-1", clientSecret: "secret-1"}'

# User B: Save Instagram credentials with different app
curl -X POST http://localhost:3000/api/oauth-credentials \
  -H "Cookie: user-id=user-b-id" \
  -d '{platform: "instagram", clientId: "app-2", clientSecret: "secret-2"}'

# User A: Can see their credentials
curl http://localhost:3000/api/oauth-credentials \
  -H "Cookie: user-id=user-a-id"
# Returns: app-1, app-2 (their platform apps)

# User A: Cannot see User B's data
# (automatically blocked by RLS at database level)
```

## Common Questions

**Q: Can I still use env-based credentials?**
A: No. For true multi-tenancy, every user must have their own app credentials. This is a breaking change but required for the platform to work properly.

**Q: What if my user only wants to post to one platform?**
A: They only need to configure credentials for that one platform. Other platforms are optional.

**Q: Can users update their credentials?**
A: Yes, POST to `/api/oauth-credentials` with the same platform — it upserts the row.

**Q: What happens if a user deletes their credentials?**
A: They can still access past posts and analytics, but cannot create new connections or schedule new posts to that platform.

**Q: Are credentials encrypted?**
A: They're stored in plain text in the database. Consider using Supabase Vault for production to encrypt sensitive fields.

## Database Performance

Each query now filters by `user_id`:
- Index: `idx_posts_user_id` for fast lookups
- RLS policy checks `auth.uid()` on every query
- No full table scans across users

## Security Considerations

1. **RLS is enforced at database level** — cannot bypass even with service role key
2. **Credentials are in plain text** — consider encryption for production
3. **CSRF protection** still active on OAuth flow
4. **Session tokens** never exposed to client
5. **Each user's cookie only contains their user-id** — cannot be tampered to access others' data

## Next Steps

1. Deploy the SQL migration
2. Add UI form for users to configure OAuth credentials
3. Update all API endpoints to use userId
4. Remove OAuth credentials from `.env.local`
5. Test with multiple users
6. Document for end-users: "How to connect your Instagram account"
