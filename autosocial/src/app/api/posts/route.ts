import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import type { Post, ScheduleData } from '@/lib/types';

const DATA_PATH = path.join(process.cwd(), 'src/data/schedule.json');

async function readData(): Promise<ScheduleData> {
  const raw = await readFile(DATA_PATH, 'utf-8');
  return JSON.parse(raw) as ScheduleData;
}

async function writeData(data: ScheduleData): Promise<void> {
  await writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    const contentType = searchParams.get('contentType');

    const data = await readData();
    let posts = data.posts;

    if (status) {
      posts = posts.filter((p) => p.status === status);
    }
    if (platform) {
      posts = posts.filter((p) => p.platforms.includes(platform as Post['platforms'][number]));
    }
    if (contentType) {
      posts = posts.filter((p) => p.contentType === contentType);
    }

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
      return NextResponse.json({ error: 'title is required and must be a non-empty string' }, { status: 400 });
    }
    if (!Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ error: 'platforms must be a non-empty array' }, { status: 400 });
    }
    if (!scheduledAt || isNaN(Date.parse(scheduledAt))) {
      return NextResponse.json({ error: 'scheduledAt must be a valid ISO date string' }, { status: 400 });
    }

    const validStatuses = ['draft', 'scheduled', 'published', 'failed'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: `status must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const newPost: Post = {
      id: `post-${randomUUID()}`,
      title: title.trim(),
      platforms,
      scheduledAt,
      status: status ?? 'draft',
      contentType: contentType ?? 'design',
      content: content ?? {},
      media: Array.isArray(media) ? media : [],
      createdAt: new Date().toISOString(),
    };

    const data = await readData();
    data.posts.push(newPost);
    await writeData(data);

    return NextResponse.json({ post: newPost }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/posts]', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
