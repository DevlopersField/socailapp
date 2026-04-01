import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/auth-helpers';

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

const VALID_PLATFORMS = ['instagram', 'linkedin', 'twitter', 'pinterest', 'dribbble', 'gmb'] as const;

// Platform API base URLs for real integrations
const PLATFORM_API_CONFIG: Record<string, { baseUrl: string; insightsEndpoint: string }> = {
  instagram: {
    baseUrl: 'https://graph.instagram.com/v21.0',
    insightsEndpoint: '/me/insights',
  },
  linkedin: {
    baseUrl: 'https://api.linkedin.com/v2',
    insightsEndpoint: '/organizationalEntityShareStatistics',
  },
  pinterest: {
    baseUrl: 'https://api.pinterest.com/v5',
    insightsEndpoint: '/user_account/analytics',
  },
  dribbble: {
    baseUrl: 'https://api.dribbble.com/v2',
    insightsEndpoint: '/user',
  },
  gmb: {
    baseUrl: 'https://mybusiness.googleapis.com/v4',
    insightsEndpoint: '/accounts/locations/insights',
  },
};

export async function GET(request: NextRequest) {
  try {
    // Auth
    const supabase = getAuthClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Validate platform param
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');

    if (platform && !VALID_PLATFORMS.includes(platform as typeof VALID_PLATFORMS[number])) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    // Fetch connections
    let connectionsQuery = supabase.from('platform_connections').select('*');
    if (platform) {
      connectionsQuery = connectionsQuery.eq('platform', platform);
    }
    const { data: connections, error: connError } = await connectionsQuery;
    if (connError) throw connError;

    if (!connections || connections.length === 0) {
      return NextResponse.json({ connections: [], insights: [] });
    }

    // Fetch real insights for each connected platform
    const insightsPromises = connections.map(async (conn) => {
      const apiConfig = PLATFORM_API_CONFIG[conn.platform];
      if (!apiConfig || !conn.access_token || conn.status !== 'connected') {
        return {
          platform: conn.platform,
          accountName: conn.account_name,
          accountId: conn.account_id,
          status: conn.status,
          connectedAt: conn.connected_at,
          insights: null,
          error: conn.status !== 'connected' ? 'Not connected' : 'No API config',
        };
      }

      try {
        const insights = await fetchPlatformInsights(conn.platform, conn.access_token, apiConfig);
        return {
          platform: conn.platform,
          accountName: conn.account_name,
          accountId: conn.account_id,
          status: conn.status,
          connectedAt: conn.connected_at,
          insights,
          error: null,
        };
      } catch (err) {
        console.error(`[Connect Insights] ${conn.platform} failed:`, err);
        return {
          platform: conn.platform,
          accountName: conn.account_name,
          accountId: conn.account_id,
          status: conn.status,
          connectedAt: conn.connected_at,
          insights: null,
          error: err instanceof Error ? err.message : 'Failed to fetch insights',
        };
      }
    });

    const results = await Promise.allSettled(insightsPromises);
    const insights = results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean);

    // Also fetch our internal analytics for comparison
    const { data: analyticsData } = await supabase
      .from('analytics')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(100);

    // Compute per-platform internal stats
    const internalStats: Record<string, {
      posts: number;
      totalImpressions: number;
      totalReach: number;
      totalLikes: number;
      avgER: number;
    }> = {};

    (analyticsData || []).forEach(entry => {
      if (!internalStats[entry.platform]) {
        internalStats[entry.platform] = { posts: 0, totalImpressions: 0, totalReach: 0, totalLikes: 0, avgER: 0 };
      }
      const s = internalStats[entry.platform];
      s.posts++;
      s.totalImpressions += entry.metrics?.impressions || 0;
      s.totalReach += entry.metrics?.reach || 0;
      s.totalLikes += entry.metrics?.likes || 0;
      s.avgER += entry.metrics?.engagement_rate || 0;
    });

    // Finalize averages
    Object.values(internalStats).forEach(s => {
      if (s.posts > 0) s.avgER = Math.round((s.avgER / s.posts) * 100) / 100;
    });

    return NextResponse.json({
      connections: connections.map(c => ({
        platform: c.platform,
        accountName: c.account_name,
        accountId: c.account_id,
        status: c.status,
        connectedAt: c.connected_at,
        tokenExpiry: c.token_expires_at,
      })),
      platformInsights: insights,
      internalStats,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[GET /api/connect/insights]', error);
    return NextResponse.json({ error: 'Failed to fetch platform insights' }, { status: 500 });
  }
}

async function fetchPlatformInsights(
  platform: string,
  accessToken: string,
  config: { baseUrl: string; insightsEndpoint: string }
): Promise<Record<string, unknown>> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'Accept': 'application/json',
  };

  switch (platform) {
    case 'instagram': {
      // Instagram Graph API — account info + media insights
      const [profileRes, mediaRes] = await Promise.allSettled([
        fetch(`${config.baseUrl}/me?fields=id,username,media_count,followers_count,follows_count&access_token=${accessToken}`, {
          signal: AbortSignal.timeout(10000),
        }),
        fetch(`${config.baseUrl}/me/media?fields=id,caption,media_type,timestamp,like_count,comments_count&limit=10&access_token=${accessToken}`, {
          signal: AbortSignal.timeout(10000),
        }),
      ]);

      const profile = profileRes.status === 'fulfilled' && profileRes.value.ok
        ? await profileRes.value.json()
        : null;

      const media = mediaRes.status === 'fulfilled' && mediaRes.value.ok
        ? await mediaRes.value.json()
        : null;

      const recentPosts = (media?.data || []).slice(0, 10);
      const totalLikes = recentPosts.reduce((s: number, p: { like_count?: number }) => s + (p.like_count || 0), 0);
      const totalComments = recentPosts.reduce((s: number, p: { comments_count?: number }) => s + (p.comments_count || 0), 0);

      return {
        username: profile?.username,
        followers: profile?.followers_count,
        following: profile?.follows_count,
        mediaCount: profile?.media_count,
        recentPostsAnalyzed: recentPosts.length,
        totalLikes,
        totalComments,
        avgLikesPerPost: recentPosts.length ? Math.round(totalLikes / recentPosts.length) : 0,
        avgCommentsPerPost: recentPosts.length ? Math.round(totalComments / recentPosts.length) : 0,
        estimatedER: profile?.followers_count && recentPosts.length
          ? Math.round(((totalLikes + totalComments) / recentPosts.length / profile.followers_count) * 10000) / 100
          : null,
      };
    }

    case 'linkedin': {
      const res = await fetch(`${config.baseUrl}/me`, {
        headers,
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`LinkedIn API ${res.status}`);
      const profile = await res.json();
      return {
        name: `${profile.localizedFirstName} ${profile.localizedLastName}`,
        profileId: profile.id,
      };
    }

    case 'pinterest': {
      // Pinterest API v5
      const [accountRes, analyticsRes] = await Promise.allSettled([
        fetch(`${config.baseUrl}/user_account`, {
          headers,
          signal: AbortSignal.timeout(10000),
        }),
        fetch(`${config.baseUrl}/user_account/analytics?start_date=${getDateDaysAgo(30)}&end_date=${getDateDaysAgo(0)}&metric_types=IMPRESSION,PIN_CLICK,SAVE,OUTBOUND_CLICK`, {
          headers,
          signal: AbortSignal.timeout(10000),
        }),
      ]);

      const account = accountRes.status === 'fulfilled' && accountRes.value.ok
        ? await accountRes.value.json()
        : null;

      const analytics = analyticsRes.status === 'fulfilled' && analyticsRes.value.ok
        ? await analyticsRes.value.json()
        : null;

      // Sum up 30-day metrics
      const dailyMetrics = analytics?.all?.daily_metrics || [];
      const totals = dailyMetrics.reduce((acc: Record<string, number>, day: Record<string, number>) => {
        Object.entries(day).forEach(([k, v]) => {
          if (typeof v === 'number') acc[k] = (acc[k] || 0) + v;
        });
        return acc;
      }, {});

      return {
        username: account?.username,
        followers: account?.follower_count,
        following: account?.following_count,
        monthlyViews: account?.monthly_views,
        pinCount: account?.pin_count,
        boardCount: account?.board_count,
        last30Days: {
          impressions: totals.IMPRESSION || 0,
          pinClicks: totals.PIN_CLICK || 0,
          saves: totals.SAVE || 0,
          outboundClicks: totals.OUTBOUND_CLICK || 0,
        },
      };
    }

    case 'dribbble': {
      const res = await fetch(`${config.baseUrl}/user`, {
        headers,
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`Dribbble API ${res.status}`);
      const user = await res.json();
      return {
        username: user.login,
        name: user.name,
        followers: user.followers_count,
        following: user.followings_count,
        shots: user.shots_count,
        likes: user.likes_count,
        projects: user.projects_count,
      };
    }

    case 'gmb': {
      // Google Business Profile — needs location-specific calls
      return {
        note: 'Google My Business requires location ID for insights. Configure in Settings.',
      };
    }

    default:
      return {};
  }
}

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}
