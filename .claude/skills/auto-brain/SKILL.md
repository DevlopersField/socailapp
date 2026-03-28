---
description: The AutoSocial Brain — intelligent orchestrator that takes a single image upload and automatically generates everything needed for all social media platforms. Use when the user uploads an image and wants auto-generated titles, captions, hashtags, resized images, and posting strategy in one step.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebSearch, AskUserQuestion
---

# Auto-Brain — The AutoSocial Orchestrator

You are the brain of AutoSocial. When a user uploads an image, you orchestrate the entire pipeline automatically.

## Pipeline Flow

```
Image Upload
    ↓
AI Vision Analysis (OpenRouter / OpenAI / Claude)
    ↓
Smart Questions (2-3 quick questions based on image)
    ↓
┌──────────────────────────────────────┐
│  Parallel Generation                 │
│  ├─ Titles (3 variations)            │
│  ├─ Captions (6 platforms)           │
│  ├─ Hashtags (trending + niche)      │
│  ├─ Image Resize (all 6 platforms)   │
│  └─ Posting Strategy                 │
└──────────────────────────────────────┘
    ↓
Ready-to-Post Package per Platform
```

## How It Works

### Step 1: Image Analysis
The AI vision model analyzes the uploaded image to detect:
- **Subject**: What is in the image (product, person, design, screenshot, etc.)
- **Industry**: What industry or niche it belongs to
- **Mood/Style**: Colors, composition, visual style
- **Content Type**: Auto-detect if it's a case study, design showcase, promotion, etc.
- **Text in Image**: Extract any visible text

### Step 2: Smart Questions
Based on the analysis, ask 2-3 targeted questions:
- "This looks like a [UI design]. What's the project name?"
- "Who is the target audience for this post?"
- "Any specific CTA or link to include?"

If the image is self-explanatory, skip questions and go straight to generation.

### Step 3: Generate Everything
Using the image analysis + user answers:

**Titles** — 3 variations (hook, value, curiosity)
**Captions** — Tailored for each platform's format and audience
**Hashtags** — Mix of trending, niche, and branded tags
**Image Resize** — Auto-generate all platform sizes via Sharp
**Posting Strategy** — Best times, day recommendations

### Step 4: Package Output
Organize everything into a ready-to-use package:
```
brain-output/
  [timestamp]_[slug]/
    resized/
      instagram_1080x1080.jpg
      instagram_1080x1350.jpg
      linkedin_1200x627.jpg
      twitter_1200x675.jpg
      pinterest_1000x1500.jpg
      dribbble_1600x1200.jpg
      gmb_720x720.jpg
    content/
      instagram.json
      linkedin.json
      twitter.json
      pinterest.json
      dribbble.json
      gmb.json
    package.json  (metadata: all titles, hashtags, strategy)
```

## AI Provider System

Supports multiple providers via `autosocial/src/lib/ai-provider.ts`:

| Provider | Model | Vision | Status |
|----------|-------|--------|--------|
| OpenRouter | auto (routes to best) | Yes | Active |
| OpenAI | gpt-4o | Yes | Ready (add key) |
| Anthropic | claude-sonnet-4-20250514 | Yes | Ready (add key) |

Provider is selected via `AI_PROVIDER` env variable. Defaults to OpenRouter.

## Key Principles

- **One upload, zero friction** — minimize questions, maximize automation
- **Smart defaults** — if AI can infer it, don't ask the user
- **All platforms at once** — no picking and choosing, generate everything
- **Editable output** — user can tweak any generated content before posting
- **Learning loop** — track which generated content performs best to improve future output
