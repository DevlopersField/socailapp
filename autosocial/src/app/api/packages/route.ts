import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import type { ScheduleData } from '@/lib/types';
import { PLATFORMS } from '@/lib/platforms';

const DATA_PATH = path.join(process.cwd(), 'src/data/schedule.json');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postIds, platforms, include } = body;

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json({ error: 'postIds must be a non-empty array' }, { status: 400 });
    }

    const raw = await readFile(DATA_PATH, 'utf-8');
    const data: ScheduleData = JSON.parse(raw);
    const posts = data.posts.filter(p => postIds.includes(p.id));

    const packages = posts.flatMap(post => {
      const targetPlatforms = platforms
        ? post.platforms.filter((p: string) => platforms.includes(p))
        : post.platforms;

      return targetPlatforms.map(platform => {
        const date = new Date(post.scheduledAt).toISOString().slice(0, 10);
        const slug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
        const folder = `${date}_${platform}_${slug}`;
        const content = post.content[platform];

        const files: Record<string, string> = {};

        if (!include || include.captions) {
          files['caption.txt'] = content?.caption ?? `[Caption for ${PLATFORMS[platform].name}]`;
        }
        if (!include || include.hashtags) {
          files['hashtags.txt'] = content?.hashtags?.join(' ') ?? '';
        }
        if (!include || include.notes) {
          files['posting-notes.txt'] = `Platform: ${PLATFORMS[platform].name}\nScheduled: ${post.scheduledAt}\nContent Type: ${post.contentType}\nStatus: ${post.status}`;
        }

        return { folder, platform, postId: post.id, title: post.title, files };
      });
    });

    return NextResponse.json({ packages, total: packages.length }, { status: 200 });
  } catch (error) {
    console.error('[POST /api/packages]', error);
    return NextResponse.json({ error: 'Failed to generate packages' }, { status: 500 });
  }
}
