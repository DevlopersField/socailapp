import { NextRequest, NextResponse } from 'next/server';
import { getAnalytics, getAnalyticsSummary, addAnalyticsEntry } from '@/lib/db';

export async function GET() {
  try {
    const [entries, summary] = await Promise.all([getAnalytics(), getAnalyticsSummary()]);
    return NextResponse.json({ entries, summary }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/analytics]', error);
    return NextResponse.json({ error: 'Failed to read analytics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, platform, metrics, contentType, hashtags } = body;

    if (!postId || !platform || !metrics) {
      return NextResponse.json({ error: 'postId, platform, and metrics are required' }, { status: 400 });
    }

    const entry = await addAnalyticsEntry({
      post_id: postId,
      platform,
      published_at: new Date().toISOString(),
      metrics,
      content_type: contentType ?? 'design',
      hashtags: hashtags ?? [],
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/analytics]', error);
    return NextResponse.json({ error: 'Failed to add analytics entry' }, { status: 500 });
  }
}
