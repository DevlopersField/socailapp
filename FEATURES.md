# AutoSocial — Feature Guide

AutoSocial has 7 core features. Each one works independently but integrates seamlessly with the others.

---

## 1. Brain — AI Image Analysis

**Purpose:** Upload an image → AI auto-generates titles, captions, hashtags, and resized images optimized for all platforms.

**Location:** `/brain` page

### User Workflow

```
1. Upload Image (drag-drop or click)
   ↓
2. (Optional) Add Context (e.g., "fintech case study")
   ↓
3. Select Resize Mode (contain | cover | stretch)
   ↓
4. Select Orientations (portrait, landscape, square)
   ↓
5. AI Analyzes Image (2-5 seconds)
   ↓
6. Review Results:
   - Titles for all 6 platforms
   - Captions (unique per platform)
   - Hashtags (grouped by platform)
   - Resized images (6 variants)
   ↓
7. Edit Captions/Hashtags
   ↓
8. Save to Draft or Schedule
```

### What Brain Does

| Step | Action | Details |
|------|--------|---------|
| **Upload** | Save to Supabase Storage | Max 10MB, formats: JPEG, PNG, WebP |
| **Analyze** | Call AI provider (vision) | Examines image content, colors, composition |
| **Generate** | AI creates per-platform content | Titles: 5-10 words, captions: platform-specific length, hashtags: 15-25 per platform |
| **Resize** | Sharp processes 6 variants | Instagram (1080×1350), LinkedIn (1200×628), Pinterest (1000×1500), Twitter (1200×675), Dribbble (800×600), GMB (1200×900) |
| **Display** | Group results by orientation | User sees results organized: portrait / landscape / square |

### Settings

- **AI Provider**: Select OpenRouter, OpenAI, or Anthropic (in Settings page)
- **Resize Mode**:
  - `contain` — no crop, add letterbox/pillarbox
  - `cover` — crop to fit, no letterbox
  - `stretch` — distort to fit (not recommended)
- **Image Context** (optional): Tell AI more about the image for better captions

### Example

**Input:** Logo image + context "We're a SaaS design agency"

**Output:**
- Instagram caption: "Turning ideas into elegant interfaces. Your design, amplified. 🎨✨"
- LinkedIn caption: "Elevating SaaS products through thoughtful design and strategic branding"
- Pinterest caption: "Discover how modern design drives product adoption and user satisfaction"
- Twitter caption: "Great design isn't about looks—it's about solving problems ✨"
- Dribbble caption: "Logo exploration for SaaS brand identity"
- GMB caption: "Premium Design Services for SaaS Companies"

---

## 2. Insights — Analytics & Strategy

**Purpose:** Track performance across all platforms, analyze trends, and get AI-powered strategy recommendations.

**Location:** `/insights` page (3 tabs)

### Tab 1: Performance

Real-time analytics dashboard with charts and metrics.

**Workflow:**

```
1. View default range (30 days)
   ↓
2. (Optional) Change range: 7d | 30d | 90d | all
   ↓
3. (Optional) Filter by platform: All | Instagram | LinkedIn | Pinterest | Twitter | Dribbble
   ↓
4. View Platform Overview (if single platform selected):
   - 8 KPI cards: Impressions, Reach, Likes, Comments, Shares, Saves, Clicks, Avg ER
   - Audience trend line chart (impressions + reach over time)
   ↓
5. Scroll down for deeper insights:
   - Best Days & Hours (bar charts)
   - Top Hashtags (sorted by engagement)
   - Top Posts (highest performing)
   - Worst Posts (lowest performing)
   - Daily Series (time-series data)
```

**Key Metrics:**

| Metric | Definition |
|--------|-----------|
| **Impressions** | Total times your content was displayed |
| **Reach** | Unique users who saw your content |
| **Likes** | User engagement metric (primary) |
| **Comments** | Deeper engagement indicator |
| **Shares** | Audience finding your content valuable |
| **Saves** | Users bookmarking for later |
| **Clicks** | Links clicked (if included) |
| **Avg ER** | Engagement Rate = (likes+comments+shares+saves+clicks) / impressions |

### Tab 2: Trends

Trending topics from Pinterest, Instagram, Reddit, and Google Trends.

**Workflow:**

```
1. View all trending topics (default)
   ↓
2. (Optional) Filter by source: All | Pinterest | Instagram | Reddit | Google
   ↓
3. See trend score, volume, category
   ↓
4. Click trend to expand details (URL, last updated)
   ↓
5. Inspiration for next post idea
```

**Trend Score:** 0-100, higher = trending faster right now

### Tab 3: Strategy

AI-generated content strategy based on your analytics and trends.

**Workflow:**

```
1. Select Goal: growth | engagement | brand-awareness | traffic | leads
   ↓
2. Select Platforms: Instagram, LinkedIn, Pinterest, etc.
   ↓
3. (Optional) Add Brand Context
   ↓
4. AI Generates Weekly Plan:
   - Monday: "Instagram Reels — AI in Design" at 2 PM
   - Tuesday: "LinkedIn Post — Design Trends 2026"
   - Wednesday: REST DAY
   - Thursday-Sunday: Scheduled content with specific topics, captions, hashtags
   ↓
5. Per-Platform Strategy:
   - Content mix recommendations (e.g., "60% case studies, 30% tips, 10% behind-the-scenes")
   - Best posting frequency (e.g., "3x per week on Instagram")
   - Content types to focus on (e.g., "Reels for reach, Carousel for engagement")
   ↓
6. Trend Opportunities:
   - Emerging trends relevant to your niche
   - Suggested angle for each trend
   - Urgency level (high | medium | low)
   ↓
7. Improvement Opportunities:
   - Areas to improve (e.g., "engagement rate too low")
   - Specific action (e.g., "add CTAs in captions")
   - Expected impact (e.g., "+15% engagement")
```

**Example Output:**

```
Strategy: "Focus on Instagram Reels for reach, mix in Carousels for engagement"

Weekly Plan:
- MON: Instagram Reels — "5 Typography Tips for 2026" (2 PM, #design #typography)
- TUE: LinkedIn — "Design as a Business Strategy" (9 AM, #leadership)
- WED: REST
- THU: Pinterest — Pins for 4 case studies
- FRI: Instagram Carousel — Client work breakdown
- SAT: Twitter — Quick design hot takes
- SUN: LinkedIn — Week in review

Platform Strategies:
- Instagram: "3x/week, focus Reels + Carousel, 60% case studies"
- LinkedIn: "2x/week, long-form posts + articles, 80% thought leadership"
- Pinterest: "Daily Pins, evergreen content, link to case studies"

Improvements:
- Engagement Rate: Add CTAs in captions (+15%)
- Reach: Post Reels at 2-3 PM slot (+20%)
- Comments: Ask questions in captions (+25%)
```

---

## 3. Connect — Platform Management

**Purpose:** Connect your Instagram, LinkedIn, Pinterest, etc. accounts and see real-time insights.

**Location:** `/connect` page + `/connect/[platform]` detail pages

### Main Connect Page

**Workflow:**

```
1. See 6 platform cards (connected or not)
   ↓
2. For each platform:
   - Green badge "Connected" or gray "Not Connected"
   - Account name (if connected)
   - Token expiry warning (if expiring soon)
   ↓
3. Click "View Details →":
   - Connected platform → Analytics tab with stats + posts
   - Not connected → Setup guide with step-by-step instructions
```

### Platform Detail Page

**For Connected Platforms:**

```
1. See "Overview & Analytics" tab (default for connected)
   ↓
2. View 5 stat cards:
   - Followers / Posts / Reach / Engagement Rate / Last Posted
   ↓
3. Scroll for recent posts grid (up to 6):
   - Post image
   - Metrics: impressions, reach, likes
   - Published date
   ↓
4. Switch to "Setup Guide" tab anytime:
   - Shows green banner: "✅ Connected. View Analytics →"
   - Shows setup steps (for reference, already completed)
```

**For Not Connected Platforms:**

```
1. See "Setup Guide" tab (default for not connected)
   ↓
2. Follow 3-step setup:
   - Step 1: Add OAuth credentials (from platform's developer portal)
   - Step 2: Configure Meta Portal / LinkedIn Admin / Pinterest Business
   - Step 3: Click "Connect with [Platform]" button
   ↓
3. Redirected to platform login
   ↓
4. Authorize AutoSocial
   ↓
5. Redirected back, connection saved
   ↓
6. Switch to "Analytics" tab to see stats
```

### Security Note

Access tokens are encrypted and stored server-side. Tokens never exposed to browser.

---

## 4. Scheduler — Content Calendar

**Purpose:** Create a content calendar, schedule posts for optimal times, and auto-publish.

**Location:** `/scheduler` page

### Workflow

```
1. View calendar:
   - Month view or week view
   - Color-coded posts (Instagram = pink, LinkedIn = blue, etc.)
   ↓
2. Create new post:
   - Click "New Post" or click a date on calendar
   - Title, platforms, content per platform, media
   - Status: Draft | Scheduled | Published
   ↓
3. Schedule post:
   - Pick date + time
   - Select platforms
   - System suggests "best posting times" from your analytics
   ↓
4. Edit existing post:
   - Click post on calendar
   - Change content, date, platforms
   - Save changes
   ↓
5. Bulk actions:
   - Select multiple posts
   - "Schedule all for next week"
   - "Unschedule" posts
   ↓
6. Auto-publish:
   - Post reaches scheduled time
   - CRON job processes scheduled_jobs table
   - Post sent to each platform's API
   - Analytics recorded automatically
```

**Best Posting Times**

System learns from your analytics:
- Shows which hours + days get best engagement
- Suggests optimal times for each platform
- Example: "Instagram performs best 2-3 PM on Wednesdays"

**Status Lifecycle**

```
Draft
  ↓ (User clicks "Schedule")
Scheduled (waiting for time)
  ↓ (Time arrives, CRON processes)
Processing (sending to platforms)
  ↓
Published (success) or Failed (error)
```

---

## 5. Packages — Export & Publish

**Purpose:** Export posts as packages for client review or publish directly to platforms.

**Location:** `/packages` page

### Workflow

```
1. Select posts to export:
   - Click checkboxes for 1+ posts
   ↓
2. Choose format:
   - JSON (structured data, for developers)
   - CSV (spreadsheet, for non-technical review)
   - PDF (visual, for client presentation)
   ↓
3. Choose platforms to include:
   - Instagram | LinkedIn | Pinterest | Twitter | Dribbble | GMB
   ↓
4. Select what to include:
   - Captions ✓
   - Hashtags ✓
   - Images ✓
   - Metrics ✓
   ↓
5. Generate package:
   - Creates .zip file
   - Includes all selected content
   - Ready for download or direct sharing
   ↓
6. Download or share:
   - Download to local computer
   - Share link with client for review
   - Client provides feedback → you re-upload
```

### Use Cases

**Agency Workflow:**
```
1. Create 4 posts for client
2. Export as PDF package
3. Email to client for approval
4. Client reviews, approves
5. Re-schedule posts
6. Publish
```

**Bulk Publishing:**
```
1. Create 20 posts
2. Export as structured data
3. Use automation tools to publish to multiple platforms
4. Track publishing logs
```

**Content Archive:**
```
1. Select all posts from past 3 months
2. Export as CSV
3. Archive in shared drive
4. Reference for future content planning
```

---

## 6. Guides — Setup Instructions

**Purpose:** Step-by-step guides for setting up AI providers, platforms, and features.

**Location:** `/guides` page

### Guide Categories

**AI Provider Setup**
- How to get OpenRouter API key (free tier)
- How to get OpenAI API key (paid)
- How to get Anthropic API key (paid)
- How to switch providers in Settings

**Platform Connection**
- Instagram/Meta setup (create developer app, get credentials)
- LinkedIn setup (configure OAuth credentials)
- Pinterest setup (developer app creation)
- Twitter/X setup (API access)
- Dribbble setup (create application)
- Google My Business setup (OAuth)

**Feature Walkthroughs**
- Using Brain to analyze images
- Scheduling posts for optimal times
- Creating analytics dashboards
- Building content strategies
- Exporting post packages

**Troubleshooting**
- OAuth connection failed?
- AI not generating content?
- Posts not publishing?
- Analytics not showing?

### Guide Format

Each guide includes:
- Difficulty badge (Beginner | Intermediate | Advanced)
- Time estimate (5 min | 15 min | 30+ min)
- Step-by-step instructions
- Screenshots / code snippets
- Link to platform's developer portal
- FAQ for common issues

### Example: Instagram Setup

```
Difficulty: Beginner | Time: 15 min

Step 1: Create Meta App
  → Go to developers.facebook.com
  → Click "My Apps" → "Create App"
  → Choose "Consumer" type
  → Fill in app name, email, purpose
  → Create app

Step 2: Add Instagram Graph API
  → In your app, click "+ Add Product"
  → Find "Instagram Graph API"
  → Click "Set Up"

Step 3: Get Credentials
  → Go to Settings → Basic
  → Copy "App ID" and "App Secret"
  → Paste into AutoSocial Settings

Step 4: Connect Account
  → Go to Connect page
  → Click "Connect with Instagram"
  → Login with your Instagram account
  → Click Authorize
  → Done!

FAQ:
Q: "My app was rejected"
A: Make sure your app name describes what it does (e.g., "Content Scheduler for My Agency"). 
   Meta reviews apps to prevent spam.

Q: "Connection failed"
A: Check that you copied the App ID and App Secret correctly. They're different!
```

---

## 7. Settings — Configuration

**Purpose:** Configure AI provider, platform credentials, export defaults, and user preferences.

**Location:** `/settings` page

### Settings Tabs

**AI Provider**
- Select: OpenRouter | OpenAI | Anthropic
- Add API key
- Test connection (calls API, confirms it works)
- Model selection (if applicable)

**Platform Credentials**
- View all 6 platforms (Instagram, LinkedIn, Pinterest, Twitter, Dribbble, GMB)
- Add OAuth credentials for each
- Status: Connected | Not Connected
- Disconnect button (revokes token)

**Export Defaults**
- Default format: JSON | CSV | PDF
- Default platforms to include
- Default content to include (captions, hashtags, images, metrics)

**Resize Preferences**
- Default resize mode: contain | cover | stretch
- Default orientations to generate

**Profile**
- Email address
- Account created date
- Delete account (irreversible)

### Workflow: Add AI Provider

```
1. Go to Settings
2. Tab: "AI Provider"
3. Select provider: OpenRouter
4. Add API key from openrouter.ai
5. Click "Test Connection"
6. See "✓ Connection successful"
7. System now uses this provider for Brain, Strategy, etc.
```

### Workflow: Connect Platform

```
1. Go to Settings
2. Tab: "Platform Credentials"
3. Find Instagram
4. Click "Add Credentials"
5. Enter App ID and App Secret from developer.facebook.com
6. Click "Save"
7. Now when user goes to Connect page, they can click "Connect with Instagram"
```

---

## Feature Integrations

All 7 features work together:

```
Brain                    Insights
  ↓                        ↑
  └──→ Create Post ←───────┘
         ↓
      Scheduler ← (Best times from Insights)
         ↓
      Publish via Connect
         ↓
      (Auto-track analytics)
         ↓
      Insights (Data updated)
         ↓
      Strategy (Updated recommendations)

Packages: Export any post (from Scheduler or Insights)
Guides: Help with setup (AI Provider, Platform Credentials)
Settings: Configure everything (AI, Platforms, Defaults)
```

### Example: End-to-End Workflow

```
Monday 9 AM:
1. Go to Brain page
2. Upload client's logo image
3. AI generates 6 caption versions + hashtags + resized images
4. Edit captions to match brand voice
5. Click "Save as Draft"

Monday 2 PM:
6. Go to Insights
7. Check that Wednesday 2 PM is best posting time
8. Go to Scheduler
9. Create post for Wednesday 2 PM, add to Instagram + LinkedIn
10. Schedule for publication

Wednesday 2 PM:
11. CRON job publishes post
12. Platform APIs send content

Wednesday 3 PM - Friday:
13. Go to Insights
14. View post performance (likes, comments, reach)
15. Strategy tab suggests next topics based on this post's success
16. Go to Brain
17. Create 3 more posts following strategy recommendations

Friday 5 PM:
18. Go to Packages
19. Select all 4 posts
20. Export as PDF
21. Email to client with "Here's what we published this week"
22. Client approves, you archive in shared folder

Next week:
23. Start over, repeat
```

---

**For API details, see [API.md](./API.md). For setup, see [SETUP.md](./SETUP.md).**
