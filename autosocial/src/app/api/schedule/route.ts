import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import type { ScheduleData } from '@/lib/types';

const DATA_PATH = path.join(process.cwd(), 'src/data/schedule.json');

async function readData(): Promise<ScheduleData> {
  const raw = await readFile(DATA_PATH, 'utf-8');
  return JSON.parse(raw) as ScheduleData;
}

async function writeData(data: ScheduleData): Promise<void> {
  await writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
  try {
    const data = await readData();
    const grouped: Record<string, typeof data.posts> = {};

    for (const post of data.posts) {
      const date = new Date(post.scheduledAt).toISOString().slice(0, 10);
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(post);
    }

    return NextResponse.json({ calendar: grouped }, { status: 200 });
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

    const data = await readData();
    const post = data.posts.find(p => p.id === postId);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    post.scheduledAt = scheduledAt;
    post.status = 'scheduled';
    await writeData(data);

    return NextResponse.json({ post }, { status: 200 });
  } catch (error) {
    console.error('[POST /api/schedule]', error);
    return NextResponse.json({ error: 'Failed to schedule post' }, { status: 500 });
  }
}
