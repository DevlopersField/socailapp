# AutoSocial Architecture

## System Overview

AutoSocial is a full-stack Next.js application with Supabase backend and AI integration. It enables multi-platform social media content creation, scheduling, and analytics through a unified web interface.

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser Client                         │
│              (Next.js 16 + React + TypeScript)              │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP(S)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                        │
│        (Authentication, Rate Limiting, Data Processing)     │
├─────────────────────────────────────────────────────────────┤
│  • /api/auth/* — OAuth flows for platforms                  │
│  • /api/insights/* — Analytics & strategy generation        │
│  • /api/connect/* — Platform connection management          │
│  • /api/brain/* — AI image analysis                         │
│  • /api/scheduler/* — Content scheduling                    │
│  • /api/posts/* — Post CRUD                                 │
│  • /api/trends/* — Trending data                            │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Supabase    │  │ AI Provider  │  │ Social Media │
│ (PostgreSQL) │  │ (OpenRouter/ │  │   Platforms  │
│   + Auth     │  │ OpenAI/      │  │ (Instagram,  │
│   + Storage  │  │ Anthropic)   │  │ LinkedIn,    │
│              │  │              │  │ Pinterest..) │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Core Components

### Frontend (Client)

| Page | Purpose | Key Features |
|------|---------|--------------|
| **Brain** | AI image analysis | Drag-drop upload, platform resizing, caption generation |
| **Insights** | Analytics dashboard | Real charts, platform filter, engagement tracking, AI strategy |
| **Connect** | Platform management | OAuth login, account insights, token refresh, disconnect |
| **Scheduler** | Content calendar | Drag-to-reschedule, bulk create, auto-publish |
| **Packages** | Export & publish | Format options, direct platform APIs |
| **Guides** | Setup instructions | Step-by-step guides, portal links, credential forms |
| **Settings** | Configuration | AI provider selection, platform credentials |

### Backend (API Routes)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/[platform]` | POST | Initiate OAuth flow for platform |
| `/api/auth/[platform]/callback` | GET | Handle OAuth redirect & save token |
| `/api/insights` | GET | Fetch analytics data (range + platform filters) |
| `/api/strategy` | POST | Generate AI strategy based on analytics |
| `/api/trends` | GET/POST | Fetch/refresh trending topics |
| `/api/connect/insights` | GET | Real-time platform API insights |
| `/api/connect/[platform]/posts` | GET | Platform-specific posts & analytics |
| `/api/brain` | POST | AI image analysis & resizing |
| `/api/posts` | GET/POST | List/create posts |
| `/api/posts/[id]` | GET/PUT/DELETE | Post operations |
| `/api/schedule` | POST | Schedule post for publishing |
| `/api/packages` | POST | Generate export package |
| `/api/user-settings` | GET/POST | User preferences |

### Database Schema

#### Tables (7 total)

**users** — Supabase Auth (managed automatically)
- id, email, created_at, verified

**posts**
```sql
id, user_id, title, platforms, scheduled_at, status, content_type,
content (JSON: { caption, hashtags per platform }), media (URLs),
created_at, updated_at
```

**analytics**
```sql
id, user_id, post_id, platform, published_at,
metrics (JSON: impressions, reach, likes, comments, shares, saves, clicks, engagement_rate),
content_type, hashtags, created_at
```

**platform_connections**
```sql
id, user_id, platform, access_token, refresh_token, token_expires_at,
account_name, account_id, connected_at, status
```

**oauth_credentials** (per-user app keys)
```sql
id, user_id, platform, client_id, client_secret, created_at, updated_at
```

**trends**
```sql
id, source (google|reddit|twitter), keyword, volume, trend_score,
category, url, fetched_at
```

**scheduled_jobs**
```sql
id, user_id, post_id, platform, scheduled_at, status, result
```

#### Security (RLS Policies)

All tables use Row Level Security:
- Users can only see/modify their own data
- Service role key (server-only) bypasses RLS for admin operations
- Anonymous access disabled — all endpoints require auth

## Data Flow

### Content Creation Flow

```
User uploads image
         ↓
   [Brain page]
         ↓
apiPost(/api/brain)
         ↓
     [API route]
         ├─ Save to Supabase Storage
         ├─ Call AI provider (vision)
         ├─ Resize with Sharp (6 variants)
         └─ Return: titles, captions, hashtags per platform
         ↓
[Client displays results]
     ↓
User edits captions
     ↓
Create post record in DB
     ↓
[Post saved to drafts]
```

### Scheduling & Publishing Flow

```
User clicks "Schedule"
     ↓
Scheduler page shows calendar
     ↓
User picks date/time & platforms
     ↓
apiPost(/api/schedule)
     ↓
Create scheduled_job record
     ↓
POST /api/scheduler/process runs via CRON
     ↓
Fetch due jobs
     ↓
For each job:
  ├─ Build platform-specific payload
  ├─ Call platform API
  └─ Update job status
     ↓
Record analytics if successful
```

### Analytics Flow

```
User views Insights → Performance tab
     ↓
Fetch /api/insights?range=30d&platform=instagram
     ↓
[API route]
├─ Query analytics table
├─ Aggregate by day (dailySeries)
├─ Group by platform/content-type/hour/day
├─ Rank posts, hashtags
└─ Return: 8 metrics per platform + time-series
     ↓
[Charts render with SVG]
├─ Line chart: impressions + reach over time
├─ Bar charts: best days/hours
└─ KPI cards: 8 metrics
```

## Authentication & Authorization

### User Authentication
- **Method**: Supabase Auth (email/password)
- **Session**: JWT stored in httpOnly cookie (secure)
- **Refresh**: Automatic via Supabase client
- **RLS**: All queries filtered by `user_id` from JWT

### OAuth (Platform Connections)
- **Flow**: Authorization Code with PKCE (Supabase handles)
- **Endpoints**:
  - `/api/auth/[platform]` — generates auth URL + state cookie
  - `/api/auth/[platform]/callback` — exchanges code for token
- **Security**: State parameter prevents CSRF attacks
- **Token Storage**: Encrypted in Supabase (access + refresh tokens)

### API Security
- **Rate Limiting**: 
  - Read: 60 req/min
  - Write: 20 req/min
  - AI: 10 req/5min
  - Auth: 5 req/min
- **CSRF Protection**: Origin/Referer validation on mutations
- **Headers**: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection

## AI Integration

### Provider Abstraction

Three providers supported via unified interface:

```typescript
const ai = new AIProvider({
  provider: 'openrouter' | 'openai' | 'anthropic',
  apiKey: string,
  model: string,
});

const result = await ai.generateText({
  prompt: string,
  system?: string,
  temperature?: 0-1,
});
```

### Image Resizing

Sharp library handles 6 platform variants per image:

| Platform | Dimensions | Mode |
|----------|-----------|------|
| Instagram | 1080x1350 | contain |
| LinkedIn | 1200x628 | cover |
| Pinterest | 1000x1500 | contain |
| Twitter | 1200x675 | cover |
| Dribbble | 800x600 | contain |
| GMB | 1200x900 | cover |

Modes: `contain` (no crop), `cover` (crop to fit), `stretch` (distort)

## Performance Considerations

### Caching
- **Trends**: 1-hour TTL with fallback data
- **Analytics**: Computed on-demand, no caching (fresh data)
- **Images**: Cached in Supabase Storage (CDN)

### Rate Limiting
Prevents abuse while allowing normal usage:
- Peak agency workflows: ~30 posts/day ≈ 1 req/sec (well under 60 req/min)
- AI generation: 10 per 5 minutes ≈ 2 per minute

### Database Queries
- Indexed on: user_id, platform, published_at
- Most queries filter by user_id (RLS ensures this)
- No N+1 queries — all aggregations done server-side

## Extensibility

### Adding a New Platform

1. **Register OAuth credentials** in `oauth_credentials` table
2. **Add platform config** to `PLATFORMS` in `lib/platforms.ts`
3. **Create API route** `/api/auth/[platform]/route.ts`
4. **Implement callback** `/api/auth/[platform]/callback/route.ts`
5. **Add publishing logic** to `/api/scheduler/process/route.ts`

### Adding a New AI Provider

1. Create new provider class extending `BaseAIProvider`
2. Add to `ai-provider.ts` factory
3. Update `.env.local.example` with new key
4. No code changes needed — abstraction handles the rest

## Deployment

### Recommended: Vercel

```bash
vercel deploy
```

Automatically:
- Deploys Next.js app
- Sets environment variables
- Handles SSL/TLS
- Provides analytics

### Self-Hosted (Docker)

```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
CMD ["npm", "start"]
```

Requires:
- Environment variables in `.env.local`
- PostgreSQL database (Supabase provides this)
- Node.js runtime

## Monitoring & Logging

### Built-In
- **Console logs**: API errors, OAuth flows, job processing
- **Supabase dashboard**: Query performance, auth logs
- **RLS enforcement**: All unauthorized queries blocked at DB level

### Recommended Additions
- Sentry (error tracking)
- LogRocket (session replay)
- PostHog (analytics)

---

**For API details, see [API.md](./API.md). For setup, see [SETUP.md](./SETUP.md).**
