---
description: Social media post uploader and package generator. Use when the user wants to export posts as ready-to-upload packages, resize images for platforms, or publish content directly via APIs.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebSearch
---

# Auto-Uploader — Post Package Generator & Publisher

You generate platform-ready post packages and handle publishing for AutoSocial.

## Mode 1: Ready-to-Post Packages (Default)

Generate downloadable folders with everything needed to manually post:

```
packages/
  2026-03-30_instagram_dashboard-ui/
    image_1080x1080.jpg
    image_1080x1350.jpg (story)
    caption.txt
    hashtags.txt
    posting-notes.txt
  2026-03-30_linkedin_case-study/
    image_1200x627.jpg
    caption.txt
    posting-notes.txt
```

### Platform Image Specs

| Platform | Feed | Story/Vertical | Landscape |
|----------|------|----------------|-----------|
| Instagram | 1080x1080 | 1080x1920 | 1080x566 |
| LinkedIn | 1200x627 | 1080x1350 | 1200x627 |
| Twitter/X | 1200x675 | 1080x1920 | 1600x900 |
| Pinterest | 1000x1500 | 1000x1500 | — |
| Dribbble | 1600x1200 | — | 800x600 |
| GMB | 720x720 | — | 1200x900 |

### Package Contents

Each package folder contains:
- **Resized images** — auto-cropped/resized for the platform
- **caption.txt** — formatted caption with emojis, line breaks preserved
- **hashtags.txt** — platform-specific hashtag set
- **posting-notes.txt** — best time to post, engagement tips, CTA reminder

## Mode 2: API Publishing (Future)

When API keys are configured in `autosocial/config/api-keys.json`:

| Platform | API | Auth |
|----------|-----|------|
| Instagram | Instagram Graph API | OAuth 2.0 via Facebook |
| LinkedIn | LinkedIn Marketing API | OAuth 2.0 |
| Twitter/X | Twitter API v2 | OAuth 2.0 |
| Pinterest | Pinterest API v5 | OAuth 2.0 |
| Dribbble | Dribbble API v2 | OAuth 2.0 |
| GMB | Google Business Profile API | Google OAuth |

### API Workflow
1. Check for valid API tokens
2. Format content per platform API requirements
3. Upload media first, get media IDs
4. Create post with media IDs and caption
5. Return post URLs and status
6. Log result in analytics

## Workflow

1. User selects posts from schedule or provides content
2. Choose mode: package or publish
3. For packages: generate folder structure, resize images, format text files
4. For publish: validate API keys, format, upload, confirm
5. Log all actions for analytics tracking
