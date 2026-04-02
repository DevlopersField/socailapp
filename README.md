# AutoSocial — AI Social Media Manager for Web Agencies

**AutoSocial** is a production-grade AI-powered social media management platform that helps web agencies create, schedule, and analyze content across 6 major platforms (Instagram, LinkedIn, Pinterest, Twitter/X, Dribbble, Google My Business) in one unified dashboard.

## ✨ Key Features

- **🧠 Brain** — Upload an image → AI analyzes it and auto-generates titles, captions, hashtags, and resized images optimized for all platforms
- **📊 Insights** — Real-time analytics with charts, engagement tracking, best posting times, and AI-powered strategy recommendations
- **🔗 Connect** — One-click OAuth login for all 6 platforms + live account insights and token management
- **📅 Scheduler** — Content calendar with drag-to-reschedule, bulk posting, and auto-publish at optimal times
- **📦 Packages** — Export posts as ready-to-upload packages or publish directly via platform APIs
- **📖 Guides** — Step-by-step setup instructions for AI providers and platform connections
- **⚙️ Settings** — Configure AI provider (OpenRouter/OpenAI/Anthropic), manage platform credentials, customize resizing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier works)
- At least one AI provider account (OpenRouter recommended — free)

### Setup (2 minutes)

```bash
# 1. Clone and install
cd autosocial
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local with:
# - NEXT_PUBLIC_SUPABASE_URL (from Supabase project settings)
# - NEXT_PUBLIC_SUPABASE_ANON_KEY (from Supabase project settings)
# - SUPABASE_SERVICE_ROLE_KEY (from Supabase project settings)
# - One AI provider key: OPENROUTER_KEY or OPENAI_KEY or ANTHROPIC_KEY

# 3. Start development server
npm run dev

# 4. Open http://localhost:3000
# Login with email/password (Supabase Auth handles signup)
```

For detailed setup, see [SETUP.md](./SETUP.md).

## 📋 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js (App Router) | 16.2 |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | v4 |
| **Backend** | Supabase (PostgreSQL + Auth) | Latest |
| **AI** | OpenRouter / OpenAI / Anthropic | API |
| **Image Processing** | Sharp | 0.x |
| **UI** | Headless (custom components) | - |

## 📁 Project Structure

```
autosocial/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes (20+ endpoints)
│   │   ├── brain/             # AI image analysis page
│   │   ├── insights/          # Analytics & strategy dashboard
│   │   ├── connect/           # Platform connection hub
│   │   ├── scheduler/         # Content calendar
│   │   ├── packages/          # Export & publish
│   │   ├── guides/            # Setup instructions
│   │   └── settings/          # Configuration
│   ├── lib/                    # Utilities & helpers
│   │   ├── ai-provider.ts     # AI abstraction layer
│   │   ├── image-resizer.ts   # Sharp image processing
│   │   ├── supabase.ts        # Supabase client
│   │   ├── api.ts             # Fetch helpers
│   │   └── platforms.ts       # Platform configs
│   └── components/             # Shared UI components
├── supabase/
│   └── migrations/             # Database schema
└── .env.local.example          # Environment template
```

## 🔐 Security

- ✅ Supabase Auth (email/password) with RLS on all tables
- ✅ OAuth 2.0 with CSRF protection for platform connections
- ✅ Rate limiting (5-60 req/min depending on endpoint)
- ✅ CORS and security headers (X-Frame-Options, etc.)
- ✅ Service role key never exposed to client
- ✅ API keys tested server-side only
- ✅ Authenticated endpoints require valid JWT

See [ARCHITECTURE.md](./ARCHITECTURE.md) for security details.

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** — Environment setup, Supabase config, environment variables
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — System design, data flow, database schema
- **[API.md](./API.md)** — Complete API endpoint reference
- **[FEATURES.md](./FEATURES.md)** — Feature descriptions and user workflows

## 🎯 Use Cases

**For Web Agencies:**
- Manage content for multiple client accounts in one dashboard
- Auto-generate captions and hashtags with AI
- Schedule posts across platforms automatically
- Track engagement and optimize posting times
- Export content packages for client review

**For Solopreneurs:**
- Create content in bulk from a single image
- Schedule across all platforms simultaneously
- Get AI-powered content strategy recommendations
- Track which platforms drive engagement

**For Content Teams:**
- Collaborate on post scheduling via shared calendars
- Auto-resize images for platform specs
- Analyze trending topics for content ideas

## 🤝 Contributing

This is a reference implementation for web agencies. Contributions welcome — submit PRs with:
- Clear description of changes
- Tests for new features
- Updated documentation

## 📄 License

MIT — Use freely for commercial and personal projects.

## 💬 Support

- Check [SETUP.md](./SETUP.md) for configuration issues
- See [API.md](./API.md) for endpoint details
- Read [FEATURES.md](./FEATURES.md) for feature walkthroughs

---

**Built with ❤️ for web agencies and content creators.**
