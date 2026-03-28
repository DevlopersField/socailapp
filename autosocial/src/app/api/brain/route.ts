import { NextRequest, NextResponse } from 'next/server';
import { analyzeImageAndGenerate } from '@/lib/ai-provider';
import { resizeForAllPlatforms, getImageInfo } from '@/lib/image-resizer';
import type { ResizeMode } from '@/lib/image-resizer';
import type { Platform } from '@/lib/types';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const context = formData.get('context') as string | null;
    const resizeMode = (formData.get('resizeMode') as ResizeMode) || 'contain';
    const bgColor = (formData.get('bgColor') as string) || '#000000';
    const quality = parseInt(formData.get('quality') as string) || 90;
    const outputFormat = (formData.get('format') as 'jpeg' | 'png' | 'webp') || 'jpeg';
    const platformsRaw = formData.get('platforms') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported image type. Use JPEG, PNG, WebP, or GIF.' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large. Maximum 10MB.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const imageBase64 = imageBuffer.toString('base64');

    // Parse platform selection
    const platforms = platformsRaw
      ? (platformsRaw.split(',').filter(Boolean) as Platform[])
      : undefined;

    // Run AI analysis and image resize in parallel
    const [aiResult, resizedImages, imageInfo] = await Promise.all([
      analyzeImageAndGenerate(imageBase64, file.type, context || undefined),
      resizeForAllPlatforms(imageBuffer, {
        mode: resizeMode,
        background: bgColor,
        quality,
        format: outputFormat,
      }, platforms),
      getImageInfo(imageBuffer),
    ]);

    // Save resized images to public directory
    const timestamp = Date.now();
    const slug = aiResult.analysis.subject
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 30);
    const outputDir = path.join(process.cwd(), 'public', 'brain-output', `${timestamp}_${slug}`);
    await mkdir(outputDir, { recursive: true });

    const savedImages = [];
    for (const img of resizedImages) {
      const filePath = path.join(outputDir, img.filename);
      await writeFile(filePath, img.buffer);
      savedImages.push({
        platform: img.platform,
        spec: img.spec,
        orientation: img.orientation,
        width: img.width,
        height: img.height,
        sizeKB: img.sizeKB,
        filename: img.filename,
        url: `/brain-output/${timestamp}_${slug}/${img.filename}`,
      });
    }

    // Save original
    const originalExt = file.type.split('/')[1] || 'jpg';
    const originalPath = path.join(outputDir, `original.${originalExt}`);
    await writeFile(originalPath, imageBuffer);

    return NextResponse.json({
      success: true,
      outputId: `${timestamp}_${slug}`,
      original: {
        width: imageInfo.width,
        height: imageInfo.height,
        format: imageInfo.format,
        sizeKB: imageInfo.sizeKB,
        orientation: imageInfo.orientation,
        aspectRatio: imageInfo.aspectRatio,
      },
      resizeSettings: { mode: resizeMode, bgColor, quality, format: outputFormat },
      analysis: aiResult.analysis,
      titles: aiResult.titles,
      captions: aiResult.captions,
      hashtags: aiResult.hashtags,
      strategy: aiResult.strategy,
      images: savedImages,
    }, { status: 200 });
  } catch (error) {
    console.error('[POST /api/brain]', error);
    return NextResponse.json(
      { error: 'Brain processing failed', details: String(error) },
      { status: 500 }
    );
  }
}
