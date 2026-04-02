# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Every output is reviewed by another AI agent — so generate only what is required, to the point, using the simplest approach with the best possible quality.**

## Project

**AutoSocial** — AI Social Media Manager for web agencies.

- **Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Supabase
- **App Dir:** `autosocial/`
- **Run:** `cd autosocial && npm run dev`
- **Auth:** Supabase Auth (email/password), per-user data isolation via RLS
- **Database:** Supabase PostgreSQL (7 tables with RLS policies)
- **Multi-Tenant:** Each user manages their own OAuth app credentials (per-user Instagram/LinkedIn/etc apps)
- **AI:** OpenRouter (Nemotron free) / OpenAI / Anthropic — switchable via .env.local
- **Image Processing:** Sharp (parallel resize, contain/cover/stretch)
- **Automation:** Upload image → AI generates → auto-schedule → package (one click)
- **Platforms:** Instagram (per-user OAuth), LinkedIn (per-user OAuth), Twitter/X, Pinterest, Dribbble, GMB — each user brings their own app credentials

## Custom Agents

Five specialized agents are available in `.claude/agents/`:

| Agent | When to use |
|-------|-------------|
| `frontend-agent` | UI components, styling, layouts, client-side logic |
| `backend-agent` | APIs, server logic, database, auth, server infrastructure |
| `qa-agent` | Writing tests, bug hunting, edge case validation, code quality |
| `dashboard-agent` | Charts, data tables, metrics displays, admin panels |
| **`autosocial-agent`** | **AutoSocial development — knows full architecture, DB schema, APIs** |

Use them via `@"agent-name"` in conversation or `/agents` to browse.

## Custom Skills

20 skills are available in `.claude/skills/`:

### General Skills

| Skill | Invoke | Purpose |
|-------|--------|---------|
| Superpowers | `/superpowers` | Full-power mode for ambitious, complex tasks |
| Frontend Design | `/frontend-design` | Pixel-perfect, modern UI creation |
| Algorithmic Art | `/algorithmic-art` | Generative art, creative coding, math visuals |
| Debugging | `/debugging` | Systematic root cause analysis and bug fixing |
| Web Artifacts | `/web-artifacts` | Self-contained single HTML file demos and tools |
| Optimization | `/optimization` | Performance tuning for code, queries, and builds |
| Skill Creator | `/skill-creator` | Meta-skill to create new skills |
| Brand Guideline | `/brand-guideline` | Enforce brand colors, typography, and identity |
| Progress | `/progress` | Auto-tracks tool development in PROGRESS.md |
| Thinking | `/thinking` | Ask clarifying questions first, then deliver precise output |
| Documentation | `/documentation` | Generate READMEs, API docs, architecture docs |
| **Security** | **`/security`** | **OWASP audit, API hardening, secret protection, XSS/CSRF** |
| **Agency** | **`/agency`** | **Full team orchestration — dev, design, SEO, security, QA** |

### AutoSocial Skills (Social Media Manager Suite)

| Skill | Invoke | Purpose |
|-------|--------|---------|
| **AutoSocial** | `/autosocial` | Main AI Social Media Manager — full content workflow |
| **Auto-Content** | `/auto-content` | Generate titles, captions, hashtags per platform |
| **Auto-Scheduler** | `/auto-scheduler` | Content calendar, posting times, bulk scheduling |
| **Auto-Uploader** | `/auto-uploader` | Export post packages or publish via APIs |
| **Auto-Analytics** | `/auto-analytics` | Track performance, analyze data, improve strategy |
| **Auto-Resize** | `/auto-resize` | Resize images for platform-specific dimensions |
| **Auto-Brain** | `/auto-brain` | Upload image → auto-generate everything for all platforms |

## Progress Tracking

The `/progress` skill maintains `PROGRESS.md` at the project root. It auto-runs after every successful task via a Stop hook in `.claude/settings.json`, logging only meaningful development progress of this tool — no noise.
