import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import type { Post, ScheduleData } from '@/lib/types';

const DATA_PATH = path.join(process.cwd(), 'src/data/schedule.json');

async function readData(): Promise<ScheduleData> {
  const raw = await readFile(DATA_PATH, 'utf-8');
  return JSON.parse(raw) as ScheduleData;
}

async function writeData(data: ScheduleData): Promise<void> {
  await writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const data = await readData();
    const post = data.posts.find((p) => p.id === id);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/posts/[id]]', error);
    return NextResponse.json({ error: 'Failed to read post' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data = await readData();
    const index = data.posts.findIndex((p) => p.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const allowedFields: (keyof Post)[] = [
      'title',
      'platforms',
      'scheduledAt',
      'status',
      'contentType',
      'content',
      'media',
    ];

    const updated: Post = { ...data.posts[index] };

    for (const field of allowedFields) {
      if (field in body) {
        (updated as unknown as Record<string, unknown>)[field] = body[field];
      }
    }

    if (body.title !== undefined && (typeof body.title !== 'string' || body.title.trim() === '')) {
      return NextResponse.json({ error: 'title must be a non-empty string' }, { status: 400 });
    }

    const validStatuses = ['draft', 'scheduled', 'published', 'failed'];
    if (body.status !== undefined && !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: `status must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    data.posts[index] = updated;
    await writeData(data);

    return NextResponse.json({ post: updated }, { status: 200 });
  } catch (error) {
    console.error('[PUT /api/posts/[id]]', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const data = await readData();
    const index = data.posts.findIndex((p) => p.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const deleted = data.posts.splice(index, 1)[0];
    await writeData(data);

    return NextResponse.json({ deleted }, { status: 200 });
  } catch (error) {
    console.error('[DELETE /api/posts/[id]]', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
