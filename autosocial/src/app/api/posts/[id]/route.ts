import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/auth-helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const supabase = getAuthClient(request);
    const { id } = await params;
    const { data, error } = await supabase.from('posts').select('*').eq('id', id).single();
    if (error) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    return NextResponse.json({ post: data });
  } catch (error) {
    console.error('[GET /api/posts/[id]]', error);
    return NextResponse.json({ error: 'Failed to read post' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const supabase = getAuthClient(request);
    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.platforms !== undefined) updates.platforms = body.platforms;
    if (body.scheduledAt !== undefined) updates.scheduled_at = body.scheduledAt;
    if (body.status !== undefined) updates.status = body.status;
    if (body.contentType !== undefined) updates.content_type = body.contentType;
    if (body.content !== undefined) updates.content = body.content;
    if (body.media !== undefined) updates.media = body.media;

    const { data, error } = await supabase.from('posts').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return NextResponse.json({ post: data });
  } catch (error) {
    console.error('[PUT /api/posts/[id]]', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const supabase = getAuthClient(request);
    const { id } = await params;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('[DELETE /api/posts/[id]]', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
