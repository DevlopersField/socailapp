# AutoSocial — Setup Guide

## Development Environment

### Prerequisites

- **Node.js** 18+ (check with `node -v`)
- **npm** 9+ (check with `npm -v`)
- **Supabase account** (free tier: https://supabase.com)
- **Git** (for cloning the repository)
- **At least one AI provider account:**
  - **OpenRouter** (recommended, free tier available: https://openrouter.ai)
  - **OpenAI** (paid: https://platform.openai.com)
  - **Anthropic** (paid: https://console.anthropic.com)

### Quick Start (5 minutes)

```bash
# 1. Clone repository
git clone <repo-url>
cd autosocial

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.local.example .env.local

# 4. Configure .env.local (see below)

# 5. Start development server
npm run dev

# 6. Open http://localhost:3000
```

---

## Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Enter project name: `autosocial` (or your choice)
4. Set database password (save this securely)
5. Select region closest to you
6. Click **"Create new project"** (takes 2-3 minutes)

### 2. Get API Keys

Once your project is created:

1. Go to **Project Settings** (gear icon, bottom left)
2. Select **"API"** tab
3. Copy these values into `.env.local`:
   - **`NEXT_PUBLIC_SUPABASE_URL`** — Copy from "Project URL"
   - **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** — Copy from "anon public" key
   - **`SUPABASE_SERVICE_ROLE_KEY`** — Copy from "service_role" key (keep this secret!)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Initialize Database

1. In Supabase dashboard, go to **"SQL Editor"** (left sidebar)
2. Click **"New Query"**
3. Open file: `supabase/migrations/schema.sql`
4. Copy entire contents and paste into Supabase SQL editor
5. Click **"Run"** (or Ctrl+Enter)
6. Verify: Go to **"Table Editor"** and confirm you see 7 tables:
   - `users` (auto-created by Supabase Auth)
   - `posts`
   - `analytics`
   - `platform_connections`
   - `oauth_credentials`
   - `trends`
   - `scheduled_jobs`

### 4. Enable Auth

1. In Supabase, go to **"Authentication"** (left sidebar)
2. Click **"Providers"**
3. Ensure **"Email"** is enabled (default)
4. Go to **"Policies"** tab → verify RLS policies are enabled on all tables

---

## AI Provider Setup

Choose **one or more** of these providers and add their API key to `.env.local`:

### OpenRouter (Recommended)

Best for: Free tier, multiple models, easy switching

1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up (free)
3. Click your profile icon → **"Keys"**
4. Create new API key
5. Add to `.env.local`:
   ```env
   OPENROUTER_KEY=sk-or-xxxxxxxxxxxxx
   OPENROUTER_MODEL=meta-llama/llama-2-70b-chat-hf
   ```

### OpenAI

Best for: GPT-4 access, reliable performance

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create account and add payment method
3. Go to **"API Keys"** (left sidebar)
4. Create new secret key
5. Add to `.env.local`:
   ```env
   OPENAI_KEY=sk-proj-xxxxxxxxxxxxx
   OPENAI_MODEL=gpt-4o-mini
   ```

### Anthropic

Best for: Claude models

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create account and add payment method
3. Go to **"API Keys"** (left sidebar)
4. Create new API key
5. Add to `.env.local`:
   ```env
   ANTHROPIC_KEY=sk-ant-xxxxxxxxxxxxx
   ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
   ```

---

## OAuth Platform Setup

To connect Instagram, LinkedIn, Pinterest, etc., register your app with each platform. Each user can bring their own credentials (multi-tenant setup).

### Instagram (Meta)

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create an app (type: **"Consumer"**)
3. Add **Instagram Graph API** product
4. Go to **Settings** → **Basic** → copy `APP_ID` and `APP_SECRET`
5. Configure OAuth redirect URI:
   - Go to **Settings** → **Basic** → add redirect URL
   - URL: `http://localhost:3000/api/auth/instagram/callback` (dev) or `https://yourdomain.com/api/auth/instagram/callback` (prod)
6. Add to `.env.local`:
   ```env
   INSTAGRAM_CLIENT_ID=123456789
   INSTAGRAM_CLIENT_SECRET=xxxxxxxxxxxxx
   ```

### LinkedIn

1. Go to [linkedin.com/developers](https://linkedin.com/developers)
2. Create new app
3. Copy `Client ID` and `Client Secret`
4. Configure Authorized redirect URI:
   - `http://localhost:3000/api/auth/linkedin/callback`
5. Add to `.env.local`:
   ```env
   LINKEDIN_CLIENT_ID=xxxxxxxxxxxxx
   LINKEDIN_CLIENT_SECRET=xxxxxxxxxxxxx
   ```

### Pinterest

1. Go to [developers.pinterest.com](https://developers.pinterest.com)
2. Create an app
3. Copy `App ID` and `App Secret`
4. Configure redirect URI: `http://localhost:3000/api/auth/pinterest/callback`
5. Add to `.env.local`:
   ```env
   PINTEREST_CLIENT_ID=xxxxxxxxxxxxx
   PINTEREST_CLIENT_SECRET=xxxxxxxxxxxxx
   ```

### Twitter/X

1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Create app in **Projects & Apps**
3. Copy `API Key` and `API Secret Key`
4. Configure callback URL: `http://localhost:3000/api/auth/twitter/callback`
5. Add to `.env.local`:
   ```env
   TWITTER_CLIENT_ID=xxxxxxxxxxxxx
   TWITTER_CLIENT_SECRET=xxxxxxxxxxxxx
   ```

### Dribbble

1. Go to [dribbble.com/account/applications](https://dribbble.com/account/applications)
2. Create new app
3. Copy `Client ID` and `Client Secret`
4. Set authorization callback URL: `http://localhost:3000/api/auth/dribbble/callback`
5. Add to `.env.local`:
   ```env
   DRIBBBLE_CLIENT_ID=xxxxxxxxxxxxx
   DRIBBBLE_CLIENT_SECRET=xxxxxxxxxxxxx
   ```

### Google My Business

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project
3. Enable **Google My Business API**
4. Create OAuth 2.0 credentials (type: **Web application**)
5. Configure redirect URI: `http://localhost:3000/api/auth/gmb/callback`
6. Copy `Client ID` and `Client Secret`
7. Add to `.env.local`:
   ```env
   GOOGLE_CLIENT_ID=xxxxxxxxxxxxx
   GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxx
   ```

---

## Environment Variables Reference

Complete `.env.local` template:

```env
# ============================================
# Supabase (Required)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# AI Provider (Pick One)
# ============================================

# OpenRouter (Recommended)
OPENROUTER_KEY=sk-or-xxxxxxxxxxxxx
OPENROUTER_MODEL=meta-llama/llama-2-70b-chat-hf

# OR OpenAI
# OPENAI_KEY=sk-proj-xxxxxxxxxxxxx
# OPENAI_MODEL=gpt-4o-mini

# OR Anthropic
# ANTHROPIC_KEY=sk-ant-xxxxxxxxxxxxx
# ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# ============================================
# OAuth Credentials (Optional - For Testing)
# ============================================
# Each user should add their own credentials in Settings
# These are optional for development

INSTAGRAM_CLIENT_ID=123456789
INSTAGRAM_CLIENT_SECRET=xxxxxxxxxxxxx

LINKEDIN_CLIENT_ID=xxxxxxxxxxxxx
LINKEDIN_CLIENT_SECRET=xxxxxxxxxxxxx

PINTEREST_CLIENT_ID=xxxxxxxxxxxxx
PINTEREST_CLIENT_SECRET=xxxxxxxxxxxxx

TWITTER_CLIENT_ID=xxxxxxxxxxxxx
TWITTER_CLIENT_SECRET=xxxxxxxxxxxxx

DRIBBBLE_CLIENT_ID=xxxxxxxxxxxxx
DRIBBBLE_CLIENT_SECRET=xxxxxxxxxxxxx

GOOGLE_CLIENT_ID=xxxxxxxxxxxxx
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxx

# ============================================
# Scheduler (For Background Jobs)
# ============================================
CRON_SECRET=your-secure-random-secret-here
```

---

## Development Workflow

### Running the App

```bash
cd autosocial
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
cd autosocial
npm run build
npm start
```

### Running Tests

```bash
npm test
```

### Code Formatting

```bash
npm run format
```

---

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click **"Import Project"** and select your repository
4. Configure environment variables (copy from `.env.local`)
5. Click **"Deploy"**

Vercel automatically:
- Handles Next.js builds
- Provides SSL/TLS
- Sets up preview deployments for PRs
- Supports serverless functions for API routes

### Self-Hosted (Docker)

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t autosocial .
docker run -p 3000:3000 --env-file .env.local autosocial
```

Requires: PostgreSQL database (or use Supabase), Node.js 18+

### Environment Variables for Production

Update these in your deployment platform (Vercel, Docker, etc.):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENROUTER_KEY=... (or other AI provider key)
CRON_SECRET=... (secure random token)
```

---

## Troubleshooting

### "Supabase connection failed"

- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are copied correctly
- Check that your Supabase project is active (not paused)
- Ensure tables exist: Check **Table Editor** in Supabase dashboard

### "AI provider not available"

- Verify `OPENROUTER_KEY` (or other provider key) is set in `.env.local`
- Check API key is valid at provider's dashboard
- Ensure you have credits/quota (especially for paid providers)

### "OAuth callback failed"

- Verify redirect URI matches exactly in provider's dashboard
- For localhost: `http://localhost:3000/api/auth/[platform]/callback`
- For production: Use your actual domain with HTTPS
- Check that `INSTAGRAM_CLIENT_ID`, `LINKEDIN_CLIENT_ID`, etc. are set

### "RLS policy violation"

- Ensure you're logged in (JWT in httpOnly cookie)
- Check that Row Level Security is enabled in Supabase
- Verify `SUPABASE_SERVICE_ROLE_KEY` for admin operations

### "Port 3000 already in use"

```bash
# Run on different port
npm run dev -- -p 3001
```

### Build errors with TypeScript

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

---

## Next Steps

1. **Test authentication**: Sign up at `http://localhost:3000` with email/password
2. **Configure AI provider**: Go to Settings, select your AI provider, test connection
3. **Connect a platform**: Go to Connect, click "Connect with Instagram" (or your platform)
4. **Upload an image**: Go to Brain, drag-drop an image to test AI analysis
5. **Create a post**: Edit generated content, save as draft or schedule
6. **View analytics**: Go to Insights to see performance data

---

**For API details, see [API.md](./API.md). For architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md).**
