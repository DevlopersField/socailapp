import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const supabase = getAuthClient(request);
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start') ?? new Date(Date.now() - 7 * 86400000).toISOString();
    const end = searchParams.get('end') ?? new Date(Date.now() + 30 * 86400000).toISOString();

    const { data, error } = await supabase.from('posts').select('*')
      .gte('scheduled_at', start).lte('scheduled_at', end).order('scheduled_at', { ascending: true });
    if (error) throw error;

    const calendar: Record<string, typeof data> = {};
    for (const post of (data || [])) {
      const date = new Date(post.scheduled_at).toISOString().slice(0, 10);
      if (!calendar[date]) calendar[date] = [];
      calendar[date].push(post);
    }

    return NextResponse.json({ calendar });
  } catch (error) {
    console.error('[GET /api/schedule]', error);
    return NextResponse.json({ error: 'Failed to read schedule' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getAuthClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { postId, scheduledAt } = await request.json();
    if (!postId || !scheduledAt) return NextResponse.json({ error: 'postId and scheduledAt required' }, { status: 400 });

    const { data: post, error } = await supabase.from('posts')
      .update({ scheduled_at: scheduledAt, status: 'scheduled' }).eq('id', postId).select().single();
    if (error) throw error;

    // Create scheduled jobs
    const jobs = post.platforms.map((platform: string) => ({
      user_id: user.id, post_id: post.id, platform, scheduled_at: scheduledAt, status: 'pending', result: null, processed_at: null,
    }));
    await supabase.from('scheduled_jobs').insert(jobs);

    return NextResponse.json({ post });
  } catch (error) {
    console.error('[POST /api/schedule]', error);
    return NextResponse.json({ error: 'Failed to schedule' }, { status: 500 });
  }
}
