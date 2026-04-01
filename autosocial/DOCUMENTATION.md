# AutoSocial Documentation

AI Social Media Manager for web agencies. Create content, schedule posts, track performance, and generate strategies across Instagram, LinkedIn, Pinterest, Dribbble, Google My Business, and Reddit.

## Quick Start

```bash
cd autosocial
cp .env.local.example .env.local   # Add your Supabase + AI keys
npm install
npm run dev                         # http://localhost:3000
```

### Required Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
CRON_SECRET=...                     # For scheduler process endpoint
```

### AI Provider (choose one)

```
AI_PROVIDER=openrouter              # or openai or anthropic
OPENROUTER_API_KEY=...
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
```

---

## Architecture

```
autosocial/
  src/
    app/                  # Next.js App Router pages + API routes
      api/                # 15 REST API endpoints
      brain/              # AI image analysis + resize
      connect/            # Platform connection manager
      insights/           # Analytics + Trends + Strategy hub
      scheduler/          # Content calendar
      ...
    components/           # AuthProvider, AppShell, Sidebar
    lib/                  # Core utilities
      ai-provider.ts      # OpenRouter / OpenAI / Anthropic integration
      api.ts              # Authenticated fetch wrapper
      auth-helpers.ts     # Supabase auth for API routes
      db.ts               # Database query helpers
      image-resizer.ts    # Sharp-based parallel image processor
      platforms.ts        # Platform metadata (icons, colors, names)
      types.ts            # TypeScript type definitions
    data/                 # Static fallback data (analytics, schedule)
  public/
    brain-output/         # Generated images stored per-user
  supabase-schema.sql     # Full database schema + seed data
```

---

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Dashboard — KPIs, upcoming posts, platform performance, recent activity |
| `/brain` | AI Brain — upload image, AI analyzes and generates captions/hashtags for all platforms, auto-resizes |
| `/insights` | **All-in-one hub** — Performance analytics, Live trends (Pinterest/Instagram/Reddit), AI strategy generator |
| `/connect` | Platform manager — connect accounts, view live insights, manage tokens (Buffer/Hootsuite-style) |
| `/scheduler` | Content calendar — drag-and-drop scheduling, date-range view |
| `/packages` | Export content packages — download captions/hashtags/notes per platform per post |
| `/guides` | Setup documentation — step-by-step instructions for all providers and platforms |
| `/settings` | AI provider config, API keys, export defaults, data source status |
| `/login` `/signup` | Supabase Auth (email/password) |

---

## API Routes

All routes require authentication (Supabase JWT in `Authorization: Bearer` header) unless noted.

### Posts

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/posts` | List posts. Filters: `?status=draft&platform=instagram` |
| POST | `/api/posts` | Create post. Body: `{ title, platforms, scheduledAt, status, contentType, content, media }` |
| GET | `/api/posts/[id]` | Get single post |
| PUT | `/api/posts/[id]` | Update post fields |
| DELETE | `/api/posts/[id]` | Delete post |

### Analytics

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/analytics` | All analytics entries + summary |
| POST | `/api/analytics` | Add analytics entry |
| GET | `/api/insights` | Deep analytics — platform breakdown, content types, top posts, best times, hashtag performance. Params: `?range=30d&platform=all`. Rate limited: 30 req/min |

### Strategy

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/strategy` | AI-generated strategy. Body: `{ goal, platforms, context, analyticsData, trendsData }`. Rate limited: 10 req/5min |

### Trends

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/trends` | Cached trends. Filter: `?source=pinterest\|instagram\|reddit` |
| POST | `/api/trends` | Force refresh from all sources |

### Platform Connections

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/connections` | List connections (safe fields only, no tokens) |
| POST | `/api/connections` | Connect platform. Body: `{ platform, access_token, account_name }` |
| DELETE | `/api/connections?platform=instagram` | Disconnect platform |
| GET | `/api/connect/insights` | Live insights from connected platform APIs. Rate limited: 20 req/min |

### Brain / Automation

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/brain` | Upload image → AI analysis + resize. FormData: `image, context, resizeMode, bgColor, quality, format, platforms` |
| GET | `/api/brain/settings` | Get configured AI provider info |
| POST | `/api/automate` | Full pipeline: image → AI → resize → create post → schedule → jobs |

### Schedule & Jobs

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/schedule` | Calendar view. Params: `?start=ISO&end=ISO` |
| POST | `/api/schedule` | Schedule a post. Body: `{ postId, scheduledAt }` |
| POST | `/api/scheduler/process` | Process pending jobs. Requires `CRON_SECRET` bearer token |

### Other

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/user-settings` | Get user AI/export preferences |
| POST | `/api/user-settings` | Save preferences |
| POST | `/api/packages` | Generate export packages. Body: `{ postIds, platforms, include }` |

---

## Database Schema (Supabase PostgreSQL)

### `posts`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Auto-generated |
| user_id | uuid | Owner |
| title | text | Post title |
| platforms | text[] | Target platforms |
| scheduled_at | timestamptz | Scheduled publish time |
| status | text | draft / scheduled / published / failed |
| content_type | text | case-study / knowledge / design / trend / promotion |
| content | jsonb | Platform-specific `{ caption, hashtags }` |
| media | text[] | Image URLs |

### `analytics`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Auto-generated |
| post_id | text | Related post |
| platform | text | Platform name |
| published_at | timestamptz | When published |
| metrics | jsonb | `{ impressions, reach, likes, comments, shares, saves, clicks, engagement_rate }` |
| content_type | text | Content type |
| hashtags | text[] | Hashtags used |

### `platform_connections`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Auto-generated |
| platform | text (unique) | Platform name |
| access_token | text | Encrypted API token |
| refresh_token | text | Optional refresh token |
| account_name | text | Display name |
| status | text | connected / expired / disconnected |

### `trends`
| Column | Type | Description |
|--------|------|-------------|
| source | text | pinterest / instagram / reddit |
| keyword | text | Trend topic |
| trend_score | real | Relevance score (0-100) |

### `scheduled_jobs`
| Column | Type | Description |
|--------|------|-------------|
| post_id | uuid (FK) | Related post |
| platform | text | Target platform |
| status | text | pending / processing / completed / failed |

---

## Security

- All API routes require Supabase JWT authentication
- Row Level Security (RLS) enabled on all tables
- API keys stored encrypted per-user in Supabase, never exposed to browser
- Rate limiting on expensive endpoints (insights, strategy, connect)
- Platform/status/contentType validated against allowlists
- File extensions sanitized to prevent path traversal
- MIME type validation on image uploads
- Scheduler endpoint secured with CRON_SECRET
- Error messages never leak internal details

---

## AI Providers

| Provider | Models | Vision Support |
|----------|--------|----------------|
| OpenRouter (default) | Nemotron 120B (free), Qwen3 80B (free), GPT-OSS 120B (free) | Depends on model |
| OpenAI | GPT-4o | Yes |
| Anthropic | Claude Sonnet 4 | Yes |

Configure in Settings page or via `user_settings` table.

---

## Image Resizing

Platform-specific dimensions using Sharp:

| Platform | Formats | Sizes |
|----------|---------|-------|
| Instagram | Square, Portrait, Landscape | 1080x1080, 1080x1350, 1080x566 |
| LinkedIn | Landscape, Square, Portrait | 1200x627, 1080x1080, 1080x1350 |
| Pinterest | Portrait, Square | 1000x1500, 1000x1000 |
| Dribbble | Landscape, Square | 1600x1200, 1200x1200 |
| GMB | Square, Landscape | 720x720, 1080x608 |

Modes: `contain` (pad), `cover` (crop), `fill` (stretch). All resizes run in parallel.
