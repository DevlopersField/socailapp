import { NextRequest, NextResponse } from 'next/server';
import { getPostById, updatePost, deletePost } from '@/lib/db';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const post = await getPostById(id);
    return NextResponse.json({ post }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/posts/[id]]', error);
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
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

    const post = await updatePost(id, updates);
    return NextResponse.json({ post }, { status: 200 });
  } catch (error) {
    console.error('[PUT /api/posts/[id]]', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const post = await getPostById(id);
    await deletePost(id);
    return NextResponse.json({ deleted: post }, { status: 200 });
  } catch (error) {
    console.error('[DELETE /api/posts/[id]]', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
