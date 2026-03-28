import sharp from 'sharp';
import type { Platform } from './types';

export interface ImageSpec {
  name: string;
  width: number;
  height: number;
  fit: keyof sharp.FitEnum;
}

export const PLATFORM_SPECS: Record<Platform, ImageSpec[]> = {
  instagram: [
    { name: 'feed_square', width: 1080, height: 1080, fit: 'cover' },
    { name: 'feed_portrait', width: 1080, height: 1350, fit: 'cover' },
  ],
  linkedin: [
    { name: 'feed', width: 1200, height: 627, fit: 'cover' },
  ],
  twitter: [
    { name: 'in_stream', width: 1200, height: 675, fit: 'cover' },
  ],
  pinterest: [
    { name: 'standard_pin', width: 1000, height: 1500, fit: 'cover' },
  ],
  dribbble: [
    { name: 'shot', width: 1600, height: 1200, fit: 'cover' },
  ],
  gmb: [
    { name: 'post', width: 720, height: 720, fit: 'cover' },
  ],
};

export interface ResizedImage {
  platform: Platform;
  spec: string;
  width: number;
  height: number;
  buffer: Buffer;
  sizeKB: number;
  filename: string;
}

export async function resizeForAllPlatforms(imageBuffer: Buffer): Promise<ResizedImage[]> {
  const results: ResizedImage[] = [];

  for (const [platform, specs] of Object.entries(PLATFORM_SPECS)) {
    for (const spec of specs) {
      const resized = await sharp(imageBuffer)
        .resize(spec.width, spec.height, {
          fit: spec.fit,
          position: 'center',
          withoutEnlargement: false,
        })
        .jpeg({ quality: 90, progressive: true })
        .toBuffer();

      results.push({
        platform: platform as Platform,
        spec: spec.name,
        width: spec.width,
        height: spec.height,
        buffer: resized,
        sizeKB: Math.round(resized.length / 1024),
        filename: `${platform}_${spec.name}_${spec.width}x${spec.height}.jpg`,
      });
    }
  }

  return results;
}

export async function getImageInfo(imageBuffer: Buffer) {
  const metadata = await sharp(imageBuffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    sizeKB: Math.round(imageBuffer.length / 1024),
  };
}
