import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/auth-helpers';
import { PLATFORMS } from '@/lib/platforms';

export async function POST(request: NextRequest) {
  try {
    const supabase = getAuthClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { postIds, platforms, include } = body;

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json({ error: 'postIds must be a non-empty array' }, { status: 400 });
    }

    // Validate postIds are strings
    if (!postIds.every((id: unknown) => typeof id === 'string')) {
      return NextResponse.json({ error: 'postIds must be an array of strings' }, { status: 400 });
    }

    const { data: allPosts, error } = await supabase.from('posts').select('*').order('scheduled_at', { ascending: true });
    if (error) throw error;

    const posts = (allPosts || []).filter(p => postIds.includes(p.id));

    const packages = posts.flatMap(post => {
      const targetPlatforms = platforms
        ? post.platforms.filter((p: string) => platforms.includes(p))
        : post.platforms;

      return targetPlatforms.map((platform: string) => {
        const date = new Date(post.scheduled_at).toISOString().slice(0, 10);
        const slug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
        const folder = `${date}_${platform}_${slug}`;
        const content = post.content?.[platform];

        const files: Record<string, string> = {};
        if (!include || include.captions) {
          files['caption.txt'] = content?.caption ?? `[Caption for ${PLATFORMS[platform as keyof typeof PLATFORMS]?.name ?? platform}]`;
        }
        if (!include || include.hashtags) {
          files['hashtags.txt'] = content?.hashtags?.join(' ') ?? '';
        }
        if (!include || include.notes) {
          files['posting-notes.txt'] = `Platform: ${PLATFORMS[platform as keyof typeof PLATFORMS]?.name ?? platform}\nScheduled: ${post.scheduled_at}\nContent Type: ${post.content_type}\nStatus: ${post.status}`;
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
