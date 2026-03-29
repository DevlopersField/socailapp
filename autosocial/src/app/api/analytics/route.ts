import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const supabase = getAuthClient(request);
    const { data: entries, error } = await supabase.from('analytics').select('*').order('published_at', { ascending: false });
    if (error) throw error;

    // Compute summary
    const totalImpressions = (entries || []).reduce((s, e) => s + (e.metrics?.impressions || 0), 0);
    const totalReach = (entries || []).reduce((s, e) => s + (e.metrics?.reach || 0), 0);
    const avgER = entries?.length ? (entries.reduce((s, e) => s + (e.metrics?.engagement_rate || 0), 0) / entries.length) : 0;

    return NextResponse.json({
      entries: entries || [],
      summary: {
        totalPosts: entries?.length || 0,
        totalImpressions,
        totalReach,
        avgEngagementRate: Math.round(avgER * 100) / 100,
        bestPlatform: 'instagram',
      },
    });
  } catch (error) {
    console.error('[GET /api/analytics]', error);
    return NextResponse.json({ error: 'Failed to read analytics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getAuthClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { data, error } = await supabase.from('analytics').insert({
      user_id: user.id,
      post_id: body.postId,
      platform: body.platform,
      published_at: new Date().toISOString(),
      metrics: body.metrics,
      content_type: body.contentType ?? 'design',
      hashtags: body.hashtags ?? [],
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ entry: data }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/analytics]', error);
    return NextResponse.json({ error: 'Failed to add analytics' }, { status: 500 });
  }
}
