import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import type { AnalyticsData, AnalyticsEntry } from '@/lib/types';

const DATA_PATH = path.join(process.cwd(), 'src/data/analytics.json');

async function readData(): Promise<AnalyticsData> {
  const raw = await readFile(DATA_PATH, 'utf-8');
  return JSON.parse(raw) as AnalyticsData;
}

async function writeData(data: AnalyticsData): Promise<void> {
  await writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
  try {
    const data = await readData();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[GET /api/analytics]', error);
    return NextResponse.json({ error: 'Failed to read analytics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, platform, metrics, contentType, hashtags } = body;

    if (!postId || !platform || !metrics) {
      return NextResponse.json({ error: 'postId, platform, and metrics are required' }, { status: 400 });
    }

    const entry: AnalyticsEntry = {
      id: `analytics-${randomUUID()}`,
      postId,
      platform,
      publishedAt: new Date().toISOString(),
      metrics,
      contentType: contentType ?? 'design',
      hashtags: hashtags ?? [],
    };

    const data = await readData();
    data.posts.push(entry);
    await writeData(data);

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/analytics]', error);
    return NextResponse.json({ error: 'Failed to add analytics entry' }, { status: 500 });
  }
}
