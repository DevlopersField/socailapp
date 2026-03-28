import { NextRequest, NextResponse } from 'next/server';
import { getPosts, createPost } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const platform = searchParams.get('platform') ?? undefined;
    const contentType = searchParams.get('contentType') ?? undefined;

    const posts = await getPosts({ status, platform, contentType });
    return NextResponse.json({ posts, total: posts.length }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/posts]', error);
    return NextResponse.json({ error: 'Failed to read posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, platforms, scheduledAt, status, contentType, content, media } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    if (!Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ error: 'platforms must be a non-empty array' }, { status: 400 });
    }
    if (!scheduledAt || isNaN(Date.parse(scheduledAt))) {
      return NextResponse.json({ error: 'scheduledAt must be a valid ISO date string' }, { status: 400 });
    }

    const post = await createPost({
      title: title.trim(),
      platforms,
      scheduled_at: scheduledAt,
      status: status ?? 'draft',
      content_type: contentType ?? 'design',
      content: content ?? {},
      media: Array.isArray(media) ? media : [],
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/posts]', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
