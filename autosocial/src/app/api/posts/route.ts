import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const supabase = getAuthClient(request);
    const { searchParams } = new URL(request.url);

    let query = supabase.from('posts').select('*').order('scheduled_at', { ascending: true });
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    if (status) query = query.eq('status', status);
    if (platform) query = query.contains('platforms', [platform]);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ posts: data || [], total: data?.length || 0 });
  } catch (error) {
    console.error('[GET /api/posts]', error);
    return NextResponse.json({ error: 'Failed to read posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getAuthClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, platforms, scheduledAt, status, contentType, content, media } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    if (!Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ error: 'platforms must be a non-empty array' }, { status: 400 });
    }

    const { data, error } = await supabase.from('posts').insert({
      user_id: user.id,
      title: title.trim(),
      platforms,
      scheduled_at: scheduledAt || new Date().toISOString(),
      status: status ?? 'draft',
      content_type: contentType ?? 'design',
      content: content ?? {},
      media: Array.isArray(media) ? media : [],
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ post: data }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/posts]', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
