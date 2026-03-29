import { NextRequest, NextResponse } from 'next/server';
import { analyzeImageAndGenerate } from '@/lib/ai-provider';
import { resizeForAllPlatforms, getImageInfo } from '@/lib/image-resizer';
import { getAuthClient } from '@/lib/auth-helpers';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const supabase = getAuthClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const context = formData.get('context') as string | null;
    const scheduledAt = formData.get('scheduledAt') as string || new Date(Date.now() + 86400000).toISOString();
    const autoSchedule = formData.get('autoSchedule') !== 'false';

    if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Image too large (max 10MB)' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const imageBase64 = imageBuffer.toString('base64');

    // Run AI + resize + image info ALL in parallel
    const [aiResult, resizedImages, imageInfo] = await Promise.all([
      analyzeImageAndGenerate(imageBase64, file.type, context || undefined, user.id),
      resizeForAllPlatforms(imageBuffer),
      getImageInfo(imageBuffer),
    ]);

    // Save resized images
    const timestamp = Date.now();
    const slug = aiResult.analysis.subject.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
    const outputDir = path.join(process.cwd(), 'public', 'brain-output', `${user.id}`, `${timestamp}_${slug}`);
    await mkdir(outputDir, { recursive: true });

    // Save all files in parallel
    const savePromises = resizedImages.map(img =>
      writeFile(path.join(outputDir, img.filename), img.buffer)
    );
    savePromises.push(writeFile(path.join(outputDir, `original.${file.type.split('/')[1] || 'jpg'}`), imageBuffer));
    await Promise.all(savePromises);

    const savedImages = resizedImages.map(img => ({
      platform: img.platform,
      spec: img.spec,
      orientation: img.orientation,
      width: img.width,
      height: img.height,
      sizeKB: img.sizeKB,
      filename: img.filename,
      url: `/brain-output/${user.id}/${timestamp}_${slug}/${img.filename}`,
    }));

    // Build platforms list from AI result
    const platforms = Object.keys(aiResult.captions);

    // Create post in Supabase
    const { data: post, error: postError } = await supabase.from('posts').insert({
      user_id: user.id,
      title: aiResult.titles.hook,
      platforms,
      scheduled_at: scheduledAt,
      status: autoSchedule ? 'scheduled' : 'draft',
      content_type: aiResult.analysis.contentType || 'design',
      content: Object.fromEntries(
        platforms.map(p => [p, {
          caption: aiResult.captions[p] || '',
          hashtags: aiResult.hashtags[p] || [],
        }])
      ),
      media: savedImages.map(img => img.url),
    }).select().single();

    if (postError) throw postError;

    // Create scheduled jobs if auto-scheduling
    let jobs: unknown[] = [];
    if (autoSchedule && post) {
      const jobInserts = platforms.map(platform => ({
        user_id: user.id,
        post_id: post.id,
        platform,
        scheduled_at: scheduledAt,
        status: 'pending',
        result: null,
        processed_at: null,
      }));
      const { data: jobData } = await supabase.from('scheduled_jobs').insert(jobInserts).select();
      jobs = jobData || [];
    }

    return NextResponse.json({
      success: true,
      post,
      analysis: aiResult.analysis,
      titles: aiResult.titles,
      strategy: aiResult.strategy,
      images: savedImages,
      original: { ...imageInfo },
      jobs,
      automated: {
        contentGenerated: true,
        imagesResized: savedImages.length,
        postCreated: true,
        scheduled: autoSchedule,
        jobsCreated: jobs.length,
      },
    });
  } catch (error) {
    console.error('[POST /api/automate]', error);
    return NextResponse.json({ error: String(error), details: 'Automation pipeline failed' }, { status: 500 });
  }
}
