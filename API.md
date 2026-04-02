# AutoSocial API Reference

All endpoints require authentication (valid Supabase JWT) except OAuth callback routes.

## Authentication Endpoints

### `POST /api/auth/[platform]`
Initiate OAuth flow for connecting a platform.

**Parameters:**
- `platform` (path): `instagram` | `linkedin` | `twitter` | `pinterest` | `dribbble` | `gmb`

**Response:**
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

**Redirect to `url` to start OAuth flow.**

### `GET /api/auth/[platform]/callback`
Handle OAuth redirect. Automatically exchanges code for token.

**Query Parameters:**
- `code` (string): Authorization code from platform
- `state` (string): CSRF state token

**Response:**
Redirects to `/connect?connected=instagram` on success, or `/connect?error=access_denied` on failure.

---

## Content Creation

### `POST /api/brain`
Analyze image with AI and generate captions, hashtags, resized images.

**Request:**
```json
{
  "image": "base64 data or URL",
  "context": "optional context like 'This is a case study for our fintech client'",
  "resizeMode": "contain|cover|stretch",
  "orientations": ["portrait", "landscape", "square"]
}
```

**Response:**
```json
{
  "captions": {
    "instagram": "Innovative fintech solutions...",
    "linkedin": "Driving financial innovation...",
    "pinterest": "...",
    "twitter": "...",
    "dribbble": "...",
    "gmb": "..."
  },
  "hashtags": {
    "instagram": ["#fintech", "#innovation", "..."],
    "linkedin": ["#fintech", "#innovation", "..."],
    "..."
  },
  "resizedImages": {
    "instagram": "https://storage.url/1080x1350.webp",
    "linkedin": "https://storage.url/1200x628.webp",
    "..."
  }
}
```

**Rate Limit:** 10 per 5 minutes

---

## Post Management

### `GET /api/posts`
List user's posts with optional filters.

**Query Parameters:**
- `status` (string, optional): `draft` | `scheduled` | `published` | `failed`
- `platform` (string, optional): Filter by platform
- `limit` (number, optional): Default 20

**Response:**
```json
{
  "posts": [
    {
      "id": "uuid",
      "title": "Q1 Strategy Review",
      "platforms": ["instagram", "linkedin"],
      "status": "scheduled",
      "scheduled_at": "2026-04-15T14:00:00Z",
      "content": {
        "instagram": { "caption": "...", "hashtags": ["#"] },
        "linkedin": { "caption": "...", "hashtags": ["#"] }
      },
      "media": ["https://storage.url/image.jpg"],
      "created_at": "2026-04-02T10:30:00Z"
    }
  ],
  "total": 45
}
```

### `POST /api/posts`
Create a new post.

**Request:**
```json
{
  "title": "Q1 Strategy Review",
  "platforms": ["instagram", "linkedin"],
  "content": {
    "instagram": { "caption": "...", "hashtags": ["#"] },
    "linkedin": { "caption": "...", "hashtags": ["#"] }
  },
  "media": ["https://storage.url/image.jpg"],
  "scheduled_at": "2026-04-15T14:00:00Z",
  "status": "draft"
}
```

**Response:** Created post object (see GET response)

### `GET /api/posts/[id]`
Get single post.

**Response:** Post object

### `PUT /api/posts/[id]`
Update post.

**Request:** Partial post object (any fields to update)

**Response:** Updated post object

### `DELETE /api/posts/[id]`
Delete post.

**Response:** `{ "success": true }`

---

## Scheduling

### `POST /api/schedule`
Schedule a post for publishing.

**Request:**
```json
{
  "post_id": "uuid",
  "platforms": ["instagram", "linkedin"],
  "scheduled_at": "2026-04-15T14:00:00Z"
}
```

**Response:**
```json
{
  "job_id": "uuid",
  "status": "pending",
  "scheduled_at": "2026-04-15T14:00:00Z",
  "message": "Post scheduled for 2 hours from now"
}
```

### `GET /api/schedule`
List scheduled jobs.

**Query Parameters:**
- `status` (string, optional): `pending` | `processing` | `completed` | `failed`

**Response:**
```json
{
  "jobs": [
    {
      "id": "uuid",
      "post_id": "uuid",
      "platform": "instagram",
      "scheduled_at": "2026-04-15T14:00:00Z",
      "status": "pending",
      "result": null
    }
  ]
}
```

### `POST /api/scheduler/process`
Internal endpoint for CRON job to process scheduled posts. Requires `CRON_SECRET` header.

**Response:** `{ "processed": 5, "failed": 0 }`

---

## Analytics

### `GET /api/insights`
Fetch analytics and insights.

**Query Parameters:**
- `range` (string): `7d` | `30d` | `90d` | `all` (default: `30d`)
- `platform` (string, optional): Filter by platform (default: `all`)

**Response:**
```json
{
  "summary": {
    "totalPosts": 45,
    "totalImpressions": 150000,
    "totalReach": 120000,
    "totalLikes": 5000,
    "totalComments": 250,
    "totalShares": 80,
    "totalSaves": 300,
    "totalClicks": 450,
    "avgEngagementRate": 3.2
  },
  "platformBreakdown": [
    {
      "platform": "instagram",
      "posts": 30,
      "impressions": 100000,
      "reach": 80000,
      "likes": 4000,
      "comments": 200,
      "shares": 60,
      "saves": 250,
      "clicks": 300,
      "avgEngagementRate": 4.1
    }
  ],
  "contentTypeBreakdown": [
    {
      "type": "design",
      "posts": 20,
      "avgEngagementRate": 3.8
    }
  ],
  "topPosts": [
    {
      "id": "uuid",
      "postId": "uuid",
      "platform": "instagram",
      "contentType": "design",
      "publishedAt": "2026-03-28T10:00:00Z",
      "metrics": {
        "impressions": 5000,
        "reach": 4000,
        "likes": 250,
        "comments": 15,
        "shares": 5,
        "saves": 50,
        "clicks": 30,
        "engagement_rate": 5.6
      },
      "hashtags": ["#design", "#web", "#innovation"]
    }
  ],
  "worstPosts": [...],
  "topHashtags": [
    {
      "tag": "#design",
      "count": 25,
      "avgER": 4.2
    }
  ],
  "bestHours": [
    {
      "hour": 14,
      "posts": 5,
      "avgER": 4.8
    }
  ],
  "bestDays": [
    {
      "day": "Wednesday",
      "posts": 8,
      "avgER": 4.2
    }
  ],
  "dailySeries": [
    {
      "date": "2026-03-28",
      "posts": 1,
      "impressions": 2500,
      "reach": 2000,
      "likes": 120,
      "comments": 8,
      "shares": 2,
      "saves": 25,
      "clicks": 15,
      "avgEngagementRate": 5.2
    }
  ],
  "range": "30d",
  "platform": "all"
}
```

**Rate Limit:** 60 per minute

### `POST /api/strategy`
Generate AI strategy based on analytics.

**Request:**
```json
{
  "goal": "growth|engagement|brand-awareness|traffic|leads",
  "platforms": ["instagram", "linkedin", "pinterest"],
  "context": "optional context about the brand or audience",
  "analyticsData": {...},
  "trendsData": [...]
}
```

**Response:**
```json
{
  "strategy": {
    "overview": "Focus on Instagram Reels...",
    "weeklyPlan": [
      {
        "day": "Monday",
        "platform": "instagram",
        "contentType": "design",
        "topic": "Case Study: Web Design for SaaS",
        "caption": "Today's case study...",
        "bestTime": "2:00 PM",
        "hashtags": ["#design", "#saas"]
      }
    ],
    "platformStrategies": {
      "instagram": {
        "focus": "Reels for reach + Carousel for engagement",
        "frequency": "3x per week",
        "contentMix": "60% case studies, 30% tips, 10% behind-the-scenes",
        "tip": "Post Reels at 2-3 PM for maximum reach"
      }
    },
    "trendOpportunities": [
      {
        "trend": "AI in design",
        "angle": "How AI tools can enhance your design workflow",
        "platform": "linkedin",
        "urgency": "high"
      }
    ],
    "improvements": [
      {
        "area": "Engagement Rate",
        "action": "Increase call-to-action clarity in captions",
        "expectedImpact": "+15% engagement"
      }
    ]
  }
}
```

**Rate Limit:** 10 per 5 minutes

---

## Trends

### `GET /api/trends`
Fetch trending topics from multiple sources.

**Query Parameters:**
- `source` (string, optional): `pinterest` | `instagram` | `reddit` | `google` (default: all)

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "source": "pinterest",
      "keyword": "minimalist kitchen design",
      "volume": 50000,
      "trend_score": 92,
      "category": "Home & Garden",
      "url": "https://pinterest.com/...",
      "fetched_at": "2026-04-02T09:00:00Z"
    }
  ],
  "lastUpdated": "2026-04-02T09:00:00Z"
}
```

### `POST /api/trends`
Refresh trends from latest data.

**Response:** Same as GET (with fresh data)

**Rate Limit:** 60 per minute (GET), 5 per minute (POST)

---

## Platform Connections

### `GET /api/connections`
List all platform connections for user.

**Response:**
```json
{
  "connections": [
    {
      "platform": "instagram",
      "accountName": "myclient_agency",
      "accountId": "123456789",
      "status": "connected",
      "connectedAt": "2026-03-15T10:00:00Z",
      "tokenExpiry": "2026-05-14T10:00:00Z"
    }
  ]
}
```

**Note:** Access tokens NOT returned for security.

### `GET /api/connect/insights`
Get live insights from connected platforms.

**Query Parameters:**
- `platform` (string, optional): Filter by platform (default: all)

**Response:**
```json
{
  "connections": [...],
  "platformInsights": [
    {
      "platform": "instagram",
      "accountName": "myclient_agency",
      "status": "connected",
      "insights": {
        "followers": 5000,
        "reach": 15000,
        "impressions": 25000
      },
      "error": null
    }
  ],
  "internalStats": {
    "instagram": {
      "posts": 15,
      "totalImpressions": 12000,
      "totalReach": 10000,
      "totalLikes": 500,
      "avgER": 3.2
    }
  }
}
```

### `GET /api/connect/[platform]/posts`
Get posts and analytics for a specific platform.

**Response:**
```json
{
  "isConnected": true,
  "posts": [
    {
      "id": "uuid",
      "title": "Q1 Review",
      "caption": "#design #strategy",
      "publishedAt": "2026-03-28T14:00:00Z",
      "metrics": {
        "impressions": 2500,
        "reach": 2000,
        "likes": 120,
        "comments": 8,
        "shares": 2,
        "engagement_rate": 5.2
      }
    }
  ],
  "stats": {
    "totalPosts": 15,
    "totalImpressions": 12000,
    "totalReach": 10000,
    "totalLikes": 500,
    "avgEngagementRate": 3.2
  }
}
```

### `DELETE /api/connections`
Disconnect a platform.

**Query Parameters:**
- `platform` (string): Platform to disconnect

**Response:** `{ "success": true, "platform": "instagram" }`

---

## Packages (Export)

### `POST /api/packages`
Generate export package.

**Request:**
```json
{
  "post_ids": ["uuid1", "uuid2"],
  "format": "json|csv|pdf",
  "platforms": ["instagram", "linkedin"],
  "include": ["captions", "hashtags", "images", "metrics"]
}
```

**Response:**
```json
{
  "package_id": "uuid",
  "download_url": "https://storage.url/package_abc123.zip",
  "format": "json",
  "posts": 2,
  "size_mb": 15.5
}
```

---

## User Settings

### `GET /api/user-settings`
Get user's preferences.

**Response:**
```json
{
  "aiProvider": "openrouter",
  "resizeMode": "contain",
  "exportFormat": "json",
  "defaultPlatforms": ["instagram", "linkedin"],
  "autoOptimizeHashtags": true
}
```

### `POST /api/user-settings`
Update user preferences.

**Request:** Partial settings object

**Response:** Updated settings

### `POST /api/user-settings/test`
Test AI provider connection.

**Request:**
```json
{
  "provider": "openrouter",
  "apiKey": "sk-or-..."
}
```

**Response:**
```json
{
  "success": true,
  "model": "meta-llama/llama-2-70b-chat-hf",
  "message": "Connection successful"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "status": 400
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (invalid params) |
| 401 | Unauthorized (no valid JWT) |
| 403 | Forbidden (RLS policy denied) |
| 404 | Not found |
| 429 | Rate limited |
| 500 | Server error |

---

**For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md). For setup, see [SETUP.md](./SETUP.md).**
