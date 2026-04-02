import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/auth-helpers';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    // Auth
    const supabase = getAuthClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!rateLimiters.read.check(user.id)) return rateLimitResponse() as unknown as NextResponse;

    const { platform } = await params;

    // Check if platform is connected
    const { data: connection, error: connError } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .single();

    if (connError && connError.code !== 'PGRST116') throw connError; // PGRST116 = not found
    if (!connection || connection.status !== 'connected') {
      return NextResponse.json({
        isConnected: false,
        posts: [],
        stats: {
          totalPosts: 0,
          totalImpressions: 0,
          totalReach: 0,
          totalLikes: 0,
          avgEngagementRate: 0,
        },
      });
    }

    // Fetch analytics data for this platform from the analytics table
    const { data: analytics, error: analyticsError } = await supabase
      .from('analytics')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .order('published_at', { ascending: false })
      .limit(50);

    if (analyticsError) throw analyticsError;

    // Compute stats
    const totalPosts = analytics?.length || 0;
    const totalImpressions = (analytics || []).reduce((s, e) => s + (e.metrics?.impressions || 0), 0);
    const totalReach = (analytics || []).reduce((s, e) => s + (e.metrics?.reach || 0), 0);
    const totalLikes = (analytics || []).reduce((s, e) => s + (e.metrics?.likes || 0), 0);
    const avgEngagementRate = analytics?.length
      ? (analytics.reduce((s, e) => s + (e.metrics?.engagement_rate || 0), 0) / analytics.length)
      : 0;

    // Transform analytics into post format
    const posts = (analytics || []).map(entry => ({
      id: entry.id,
      title: entry.content_type ? `${entry.content_type.charAt(0).toUpperCase() + entry.content_type.slice(1)} Post` : 'Post',
      caption: entry.hashtags?.join(' ') || '',
      publishedAt: entry.published_at,
      metrics: {
        impressions: entry.metrics?.impressions || 0,
        reach: entry.metrics?.reach || 0,
        likes: entry.metrics?.likes || 0,
        comments: entry.metrics?.comments || 0,
        shares: entry.metrics?.shares || 0,
        saves: entry.metrics?.saves || 0,
        engagement_rate: entry.metrics?.engagement_rate || 0,
      },
    }));

    return NextResponse.json({
      isConnected: true,
      posts,
      stats: {
        totalPosts,
        totalImpressions,
        totalReach,
        totalLikes,
        avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
      },
    });
  } catch (error) {
    console.error(`[GET /api/connect/[platform]/posts]`, error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
