import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/auth-helpers';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limit';

// Allowed values for input validation
const VALID_RANGES = ['7d', '30d', '90d', 'all'] as const;
const VALID_PLATFORMS = ['instagram', 'linkedin', 'twitter', 'pinterest', 'dribbble', 'gmb'] as const;

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const supabase = getAuthClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit
    if (!rateLimiters.read.check(user.id)) return rateLimitResponse() as unknown as NextResponse;

    // Validate query params
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const platform = searchParams.get('platform') || 'all';

    if (!VALID_RANGES.includes(range as typeof VALID_RANGES[number])) {
      return NextResponse.json({ error: 'Invalid range parameter' }, { status: 400 });
    }
    if (platform !== 'all' && !VALID_PLATFORMS.includes(platform as typeof VALID_PLATFORMS[number])) {
      return NextResponse.json({ error: 'Invalid platform parameter' }, { status: 400 });
    }

    // Calculate date range
    const now = new Date();
    const rangeMs: Record<string, number> = {
      '7d': 7 * 86400000,
      '30d': 30 * 86400000,
      '90d': 90 * 86400000,
      'all': 365 * 10 * 86400000,
    };
    const sinceDate = new Date(now.getTime() - rangeMs[range]).toISOString();

    // Fetch analytics entries
    let query = supabase
      .from('analytics')
      .select('*')
      .gte('published_at', sinceDate)
      .order('published_at', { ascending: false });

    if (platform !== 'all') {
      query = query.eq('platform', platform);
    }

    const { data: entries, error } = await query;
    if (error) throw error;

    const data = entries || [];

    // Deep performance analysis
    const totalImpressions = data.reduce((s, e) => s + (e.metrics?.impressions || 0), 0);
    const totalReach = data.reduce((s, e) => s + (e.metrics?.reach || 0), 0);
    const totalLikes = data.reduce((s, e) => s + (e.metrics?.likes || 0), 0);
    const totalComments = data.reduce((s, e) => s + (e.metrics?.comments || 0), 0);
    const totalShares = data.reduce((s, e) => s + (e.metrics?.shares || 0), 0);
    const totalSaves = data.reduce((s, e) => s + (e.metrics?.saves || 0), 0);
    const totalClicks = data.reduce((s, e) => s + (e.metrics?.clicks || 0), 0);
    const avgER = data.length ? data.reduce((s, e) => s + (e.metrics?.engagement_rate || 0), 0) / data.length : 0;

    // Platform breakdown with detailed metrics
    const platformMap: Record<string, typeof data> = {};
    data.forEach(e => {
      if (!platformMap[e.platform]) platformMap[e.platform] = [];
      platformMap[e.platform].push(e);
    });

    const platformBreakdown = Object.entries(platformMap).map(([p, entries]) => {
      const avgEngagement = entries.reduce((s, e) => s + (e.metrics?.engagement_rate || 0), 0) / entries.length;
      const totalImp = entries.reduce((s, e) => s + (e.metrics?.impressions || 0), 0);
      const totalR = entries.reduce((s, e) => s + (e.metrics?.reach || 0), 0);
      const totalL = entries.reduce((s, e) => s + (e.metrics?.likes || 0), 0);
      const totalC = entries.reduce((s, e) => s + (e.metrics?.comments || 0), 0);
      const totalSh = entries.reduce((s, e) => s + (e.metrics?.shares || 0), 0);
      const totalSa = entries.reduce((s, e) => s + (e.metrics?.saves || 0), 0);
      const totalCl = entries.reduce((s, e) => s + (e.metrics?.clicks || 0), 0);
      return {
        platform: p,
        posts: entries.length,
        impressions: totalImp,
        reach: totalR,
        likes: totalL,
        comments: totalC,
        shares: totalSh,
        saves: totalSa,
        clicks: totalCl,
        avgEngagementRate: Math.round(avgEngagement * 100) / 100,
      };
    }).sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);

    // Content type analysis
    const contentMap: Record<string, typeof data> = {};
    data.forEach(e => {
      const ct = e.content_type || 'other';
      if (!contentMap[ct]) contentMap[ct] = [];
      contentMap[ct].push(e);
    });

    const contentTypeBreakdown = Object.entries(contentMap).map(([type, entries]) => {
      const avgEng = entries.reduce((s, e) => s + (e.metrics?.engagement_rate || 0), 0) / entries.length;
      return {
        type,
        posts: entries.length,
        avgEngagementRate: Math.round(avgEng * 100) / 100,
      };
    }).sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);

    // Top performing posts (top 5)
    const topPosts = [...data]
      .sort((a, b) => (b.metrics?.engagement_rate || 0) - (a.metrics?.engagement_rate || 0))
      .slice(0, 5)
      .map(e => ({
        id: e.id,
        postId: e.post_id,
        platform: e.platform,
        contentType: e.content_type,
        publishedAt: e.published_at,
        metrics: e.metrics,
        hashtags: e.hashtags,
      }));

    // Worst performing posts (bottom 3) for improvement suggestions
    const worstPosts = [...data]
      .sort((a, b) => (a.metrics?.engagement_rate || 0) - (b.metrics?.engagement_rate || 0))
      .slice(0, 3)
      .map(e => ({
        id: e.id,
        platform: e.platform,
        contentType: e.content_type,
        metrics: e.metrics,
      }));

    // Hashtag performance
    const hashtagMap: Record<string, { count: number; totalER: number }> = {};
    data.forEach(e => {
      (e.hashtags || []).forEach((h: string) => {
        if (!hashtagMap[h]) hashtagMap[h] = { count: 0, totalER: 0 };
        hashtagMap[h].count++;
        hashtagMap[h].totalER += e.metrics?.engagement_rate || 0;
      });
    });

    const topHashtags = Object.entries(hashtagMap)
      .map(([tag, { count, totalER }]) => ({ tag, count, avgER: Math.round((totalER / count) * 100) / 100 }))
      .sort((a, b) => b.avgER - a.avgER)
      .slice(0, 10);

    // Posting time analysis (hour of day)
    const hourMap: Record<number, { count: number; totalER: number }> = {};
    data.forEach(e => {
      if (!e.published_at) return;
      const hour = new Date(e.published_at).getHours();
      if (!hourMap[hour]) hourMap[hour] = { count: 0, totalER: 0 };
      hourMap[hour].count++;
      hourMap[hour].totalER += e.metrics?.engagement_rate || 0;
    });

    const bestHours = Object.entries(hourMap)
      .map(([h, { count, totalER }]) => ({ hour: parseInt(h), posts: count, avgER: Math.round((totalER / count) * 100) / 100 }))
      .sort((a, b) => b.avgER - a.avgER);

    // Day of week analysis
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayMap: Record<number, { count: number; totalER: number }> = {};
    data.forEach(e => {
      if (!e.published_at) return;
      const day = new Date(e.published_at).getDay();
      if (!dayMap[day]) dayMap[day] = { count: 0, totalER: 0 };
      dayMap[day].count++;
      dayMap[day].totalER += e.metrics?.engagement_rate || 0;
    });

    const bestDays = Object.entries(dayMap)
      .map(([d, { count, totalER }]) => ({ day: dayNames[parseInt(d)], posts: count, avgER: Math.round((totalER / count) * 100) / 100 }))
      .sort((a, b) => b.avgER - a.avgER);

    // Daily time-series data for charting
    const dailyMap: Record<string, { posts: number; impressions: number; reach: number; likes: number; comments: number; shares: number; saves: number; clicks: number; totalER: number }> = {};
    data.forEach(e => {
      const dateStr = e.published_at ? e.published_at.split('T')[0] : new Date().toISOString().split('T')[0];
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { posts: 0, impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0, totalER: 0 };
      }
      dailyMap[dateStr].posts += 1;
      dailyMap[dateStr].impressions += e.metrics?.impressions || 0;
      dailyMap[dateStr].reach += e.metrics?.reach || 0;
      dailyMap[dateStr].likes += e.metrics?.likes || 0;
      dailyMap[dateStr].comments += e.metrics?.comments || 0;
      dailyMap[dateStr].shares += e.metrics?.shares || 0;
      dailyMap[dateStr].saves += e.metrics?.saves || 0;
      dailyMap[dateStr].clicks += e.metrics?.clicks || 0;
      dailyMap[dateStr].totalER += e.metrics?.engagement_rate || 0;
    });

    const dailySeries = Object.entries(dailyMap)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, metrics]) => ({
        date,
        posts: metrics.posts,
        impressions: metrics.impressions,
        reach: metrics.reach,
        likes: metrics.likes,
        comments: metrics.comments,
        shares: metrics.shares,
        saves: metrics.saves,
        clicks: metrics.clicks,
        avgEngagementRate: metrics.posts ? Math.round((metrics.totalER / metrics.posts) * 100) / 100 : 0,
      }));

    return NextResponse.json({
      summary: {
        totalPosts: data.length,
        totalImpressions,
        totalReach,
        totalLikes,
        totalComments,
        totalShares,
        totalSaves,
        totalClicks,
        avgEngagementRate: Math.round(avgER * 100) / 100,
      },
      platformBreakdown,
      contentTypeBreakdown,
      topPosts,
      worstPosts,
      topHashtags,
      bestHours,
      bestDays,
      dailySeries,
      range,
      platform,
    });
  } catch (error) {
    console.error('[GET /api/insights]', error);
    return NextResponse.json({ error: 'Failed to compute insights' }, { status: 500 });
  }
}
