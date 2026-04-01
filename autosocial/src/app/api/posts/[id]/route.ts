import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/auth-helpers';

const VALID_PLATFORMS = ['instagram', 'linkedin', 'twitter', 'pinterest', 'dribbble', 'gmb'] as const;
const VALID_STATUSES = ['draft', 'scheduled', 'published', 'failed'] as const;
const VALID_CONTENT_TYPES = ['case-study', 'knowledge', 'design', 'trend', 'promotion'] as const;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const supabase = getAuthClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    // Validate fields if provided
    if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    if (body.contentType !== undefined && !VALID_CONTENT_TYPES.includes(body.contentType)) {
      return NextResponse.json({ error: 'Invalid contentType' }, { status: 400 });
    }
    if (body.platforms !== undefined) {
      if (!Array.isArray(body.platforms)) return NextResponse.json({ error: 'platforms must be an array' }, { status: 400 });
      for (const p of body.platforms) {
        if (!VALID_PLATFORMS.includes(p)) return NextResponse.json({ error: `Invalid platform: ${p}` }, { status: 400 });
      }
    }
    if (body.scheduledAt !== undefined && isNaN(Date.parse(body.scheduledAt))) {
      return NextResponse.json({ error: 'scheduledAt must be a valid ISO date' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = typeof body.title === 'string' ? body.title.trim() : body.title;
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('[DELETE /api/posts/[id]]', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
