import { NextRequest, NextResponse } from 'next/server';
import { getPostsByDateRange, updatePost, createScheduledJob } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start') ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const end = searchParams.get('end') ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const posts = await getPostsByDateRange(start, end);
    const calendar: Record<string, typeof posts> = {};
    for (const post of posts) {
      const date = new Date(post.scheduled_at).toISOString().slice(0, 10);
      if (!calendar[date]) calendar[date] = [];
      calendar[date].push(post);
    }

    return NextResponse.json({ calendar }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/schedule]', error);
    return NextResponse.json({ error: 'Failed to read schedule' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, scheduledAt } = body;

    if (!postId || !scheduledAt) {
      return NextResponse.json({ error: 'postId and scheduledAt are required' }, { status: 400 });
    }

    const post = await updatePost(postId, { scheduled_at: scheduledAt, status: 'scheduled' });

    await Promise.all(
      post.platforms.map((platform: string) =>
        createScheduledJob({
          post_id: post.id,
          platform: platform as 'instagram' | 'linkedin' | 'twitter' | 'pinterest' | 'dribbble' | 'gmb',
          scheduled_at: scheduledAt,
          status: 'pending',
          result: null,
          processed_at: null,
        })
      )
    );

    return NextResponse.json({ post }, { status: 200 });
  } catch (error) {
    console.error('[POST /api/schedule]', error);
    return NextResponse.json({ error: 'Failed to schedule post' }, { status: 500 });
  }
}
