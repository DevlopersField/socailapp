# AutoSocial — Tools Reference

## Quick Start
```bash
cd autosocial && npm run dev
# Opens at http://localhost:3000
```

## Pages (9)

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | KPIs, upcoming posts, platform performance |
| Brain | `/brain` | Upload image → AI generates everything + auto-resize |
| Trends | `/trends` | Live Google Trends + Reddit + X trending topics |
| Content Creator | `/content` | Manual content generation with platform templates |
| Scheduler | `/scheduler` | Full CRUD calendar (create/edit/delete/publish) |
| Packages | `/packages` | Export ready-to-post bundles per platform |
| Analytics | `/analytics` | Performance tracking + AI recommendations |
| Settings | `/settings` | AI provider config + platform connections |

## API Routes (10)

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/posts` | GET, POST | List/create posts |
| `/api/posts/[id]` | GET, PUT, DELETE | Single post CRUD |
| `/api/analytics` | GET, POST | Analytics entries + summary |
| `/api/schedule` | GET, POST | Calendar view + schedule posts |
| `/api/trends` | GET, POST | Cached trends / force refresh |
| `/api/brain` | POST | Image → AI analysis + resize |
| `/api/brain/settings` | GET | AI provider status |
| `/api/connections` | GET, POST, DELETE | Platform connections |
| `/api/packages` | POST | Generate export packages |
| `/api/scheduler/process` | POST | Execute due scheduled jobs |

## Skills (18)

### AutoSocial Suite
| Skill | Command | Purpose |
|-------|---------|---------|
| AutoSocial | `/autosocial` | Full content workflow |
| Auto-Brain | `/auto-brain` | Image → everything pipeline |
| Auto-Content | `/auto-content` | Generate titles/captions/hashtags |
| Auto-Scheduler | `/auto-scheduler` | Calendar + scheduling |
| Auto-Uploader | `/auto-uploader` | Export packages / API publish |
| Auto-Analytics | `/auto-analytics` | Performance tracking |
| Auto-Resize | `/auto-resize` | Image resizing for all platforms |

### General
| Skill | Command |
|-------|---------|
| Superpowers | `/superpowers` |
| Frontend Design | `/frontend-design` |
| Debugging | `/debugging` |
| Security | `/security` |
| Thinking | `/thinking` |
| Optimization | `/optimization` |
| Web Artifacts | `/web-artifacts` |
| Algorithmic Art | `/algorithmic-art` |
| Brand Guideline | `/brand-guideline` |
| Skill Creator | `/skill-creator` |
| Documentation | `/documentation` |
| Progress | `/progress` |

## Database (Supabase)

### Tables
| Table | Purpose |
|-------|---------|
| `posts` | All social media posts (draft/scheduled/published) |
| `analytics` | Per-post engagement metrics by platform |
| `platform_connections` | OAuth tokens for connected platforms |
| `trends` | Cached trending topics (Google/Reddit/X) |
| `scheduled_jobs` | Queue of posts to auto-publish |

### Schema
Run `autosocial/supabase-schema.sql` in Supabase SQL Editor to create tables.

## AI Providers
| Provider | Model | Vision | Env Var |
|----------|-------|--------|---------|
| OpenRouter | Nemotron 120B (free) | No | `OPENROUTER_API_KEY` |
| OpenAI | GPT-4o | Yes | `OPENAI_API_KEY` |
| Anthropic | Claude Sonnet | Yes | `ANTHROPIC_API_KEY` |

Set `AI_PROVIDER` in `.env.local` to switch.

## Image Resize Modes
| Mode | Behavior |
|------|----------|
| Contain | Fits image, adds padding — no content lost |
| Cover | Fills dimensions, may crop edges |
| Stretch | Forces exact size, distorts aspect ratio |

## Platform Specs
| Platform | Sizes Generated |
|----------|----------------|
| Instagram | 1080×1080, 1080×1350, 1080×566 |
| LinkedIn | 1200×627, 1080×1080, 1080×1350 |
| Twitter/X | 1200×675, 1200×1200 |
| Pinterest | 1000×1500, 1000×1000 |
| Dribbble | 1600×1200, 1200×1200 |
| GMB | 720×720, 1080×608 |
