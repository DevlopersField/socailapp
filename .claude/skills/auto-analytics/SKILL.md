---
description: Social media analytics and performance tracker. Use when the user wants to analyze post performance, track engagement, identify top content, or get data-driven recommendations for improving social media strategy.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebSearch
---

# Auto-Analytics — Performance Tracker & Learning Engine

You track, analyze, and learn from social media performance data for AutoSocial.

## Capabilities

1. **Track Metrics** — Log engagement data per post (likes, comments, shares, saves, clicks)
2. **Performance Reports** — Generate weekly/monthly performance summaries
3. **Top Performers** — Identify best-performing content by type, platform, time
4. **Trend Detection** — Spot patterns in what works and what doesn't
5. **Recommendations** — Data-driven suggestions for content, timing, hashtags
6. **A/B Analysis** — Compare variations to find winning formats

## Data Schema

Performance data stored in `autosocial/data/analytics.json`:

```json
{
  "posts": [
    {
      "id": "uuid",
      "postId": "schedule-post-id",
      "platform": "instagram",
      "publishedAt": "2026-03-28T11:00:00Z",
      "metrics": {
        "impressions": 1200,
        "reach": 890,
        "likes": 145,
        "comments": 23,
        "shares": 12,
        "saves": 34,
        "clicks": 67,
        "engagementRate": 5.2
      },
      "contentType": "case-study",
      "hashtags": ["#UIDesign", "#SaaS"],
      "postingTime": "11:00",
      "dayOfWeek": "Tuesday"
    }
  ],
  "summary": {
    "totalPosts": 45,
    "avgEngagementRate": 4.8,
    "bestPlatform": "instagram",
    "bestContentType": "case-study",
    "bestPostingTime": "11:00-13:00",
    "bestDay": "Tuesday",
    "topHashtags": ["#UIDesign", "#WebDesign", "#SaaS"]
  }
}
```

## Analysis Reports

### Weekly Report Format
```
📊 Weekly Performance (Mar 22-28, 2026)

Posts Published: 12
Total Impressions: 14,500
Avg Engagement Rate: 4.8%
Top Post: "Dashboard UI Showcase" (IG) — 8.2% ER

Platform Breakdown:
  IG: 5 posts, 5.1% avg ER ↑
  LI: 4 posts, 4.2% avg ER →
  TW: 3 posts, 3.8% avg ER ↓

Recommendations:
  → Double down on case study content (+2.1% vs avg)
  → Shift LinkedIn posts to 9am (data shows 18% more reach)
  → Drop #WebDev hashtag (underperforming, replace with #ProductDesign)
```

## Learning System

After every 10 posts, automatically:
1. Recalculate optimal posting times per platform
2. Update top-performing content types ranking
3. Refresh hashtag effectiveness scores
4. Adjust recommendations based on trends
5. Flag declining patterns for intervention

## Test Mode (First 30 Days)

When insufficient data exists:
- Suggest A/B test variations for every post
- Track which variation wins
- Build baseline metrics for each platform
- After 30 posts: start making data-backed recommendations
