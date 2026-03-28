import sharp from 'sharp';
import type { Platform } from './types';

export type ResizeMode = 'contain' | 'cover' | 'fill';
export type Orientation = 'landscape' | 'portrait' | 'square';

export interface ImageSpec {
  name: string;
  width: number;
  height: number;
  orientation: Orientation;
}

// Each platform gets landscape, portrait, and square variants where applicable
export const PLATFORM_SPECS: Record<Platform, ImageSpec[]> = {
  instagram: [
    { name: 'square', width: 1080, height: 1080, orientation: 'square' },
    { name: 'portrait', width: 1080, height: 1350, orientation: 'portrait' },
    { name: 'landscape', width: 1080, height: 566, orientation: 'landscape' },
  ],
  linkedin: [
    { name: 'landscape', width: 1200, height: 627, orientation: 'landscape' },
    { name: 'square', width: 1080, height: 1080, orientation: 'square' },
    { name: 'portrait', width: 1080, height: 1350, orientation: 'portrait' },
  ],
  twitter: [
    { name: 'landscape', width: 1200, height: 675, orientation: 'landscape' },
    { name: 'square', width: 1200, height: 1200, orientation: 'square' },
  ],
  pinterest: [
    { name: 'portrait', width: 1000, height: 1500, orientation: 'portrait' },
    { name: 'square', width: 1000, height: 1000, orientation: 'square' },
  ],
  dribbble: [
    { name: 'landscape', width: 1600, height: 1200, orientation: 'landscape' },
    { name: 'square', width: 1200, height: 1200, orientation: 'square' },
  ],
  gmb: [
    { name: 'square', width: 720, height: 720, orientation: 'square' },
    { name: 'landscape', width: 1080, height: 608, orientation: 'landscape' },
  ],
};

export interface ResizeOptions {
  mode: ResizeMode;
  background: string; // hex color for padding e.g. '#000000'
  quality: number;    // 1-100
  format: 'jpeg' | 'png' | 'webp';
}

const DEFAULT_OPTIONS: ResizeOptions = {
  mode: 'contain',
  background: '#000000',
  quality: 90,
  format: 'jpeg',
};

export interface ResizedImage {
  platform: Platform;
  spec: string;
  orientation: Orientation;
  width: number;
  height: number;
  buffer: Buffer;
  sizeKB: number;
  filename: string;
}

export async function resizeForAllPlatforms(
  imageBuffer: Buffer,
  options?: Partial<ResizeOptions>,
  platforms?: Platform[],
): Promise<ResizedImage[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const targetPlatforms = platforms || (Object.keys(PLATFORM_SPECS) as Platform[]);
  const results: ResizedImage[] = [];

  // Detect source orientation to pick best matching spec per platform
  const meta = await sharp(imageBuffer).metadata();
  const srcWidth = meta.width || 1;
  const srcHeight = meta.height || 1;
  const srcRatio = srcWidth / srcHeight;
  const srcOrientation: Orientation = srcRatio > 1.1 ? 'landscape' : srcRatio < 0.9 ? 'portrait' : 'square';

  for (const platform of targetPlatforms) {
    const specs = PLATFORM_SPECS[platform];
    if (!specs) continue;

    for (const spec of specs) {
      const resized = await resizeImage(imageBuffer, spec, opts);

      const ext = opts.format === 'png' ? 'png' : opts.format === 'webp' ? 'webp' : 'jpg';
      results.push({
        platform,
        spec: spec.name,
        orientation: spec.orientation,
        width: spec.width,
        height: spec.height,
        buffer: resized,
        sizeKB: Math.round(resized.length / 1024),
        filename: `${platform}_${spec.name}_${spec.width}x${spec.height}.${ext}`,
      });
    }
  }

  // Sort: best match for source orientation first
  results.sort((a, b) => {
    const aMatch = a.orientation === srcOrientation ? 0 : 1;
    const bMatch = b.orientation === srcOrientation ? 0 : 1;
    return aMatch - bMatch;
  });

  return results;
}

async function resizeImage(
  imageBuffer: Buffer,
  spec: ImageSpec,
  opts: ResizeOptions,
): Promise<Buffer> {
  // Parse background color to RGB
  const bg = parseHexColor(opts.background);

  let pipeline = sharp(imageBuffer);

  switch (opts.mode) {
    case 'contain':
      // Fit entire image within dimensions — no cropping, add background padding
      pipeline = pipeline.resize(spec.width, spec.height, {
        fit: 'contain',
        background: { r: bg.r, g: bg.g, b: bg.b, alpha: 1 },
        withoutEnlargement: false,
      });
      break;

    case 'cover':
      // Fill dimensions — may crop edges
      pipeline = pipeline.resize(spec.width, spec.height, {
        fit: 'cover',
        position: 'center',
        withoutEnlargement: false,
      });
      break;

    case 'fill':
      // Stretch to exact dimensions (distorts aspect ratio)
      pipeline = pipeline.resize(spec.width, spec.height, {
        fit: 'fill',
        withoutEnlargement: false,
      });
      break;
  }

  // Output format
  switch (opts.format) {
    case 'png':
      return pipeline.png({ quality: opts.quality }).toBuffer();
    case 'webp':
      return pipeline.webp({ quality: opts.quality }).toBuffer();
    default:
      return pipeline.jpeg({ quality: opts.quality, progressive: true }).toBuffer();
  }
}

// Get the best single spec per platform matching source orientation
export function getBestSpecs(
  srcWidth: number,
  srcHeight: number,
  platforms?: Platform[],
): Record<Platform, ImageSpec> {
  const ratio = srcWidth / srcHeight;
  const srcOrientation: Orientation = ratio > 1.1 ? 'landscape' : ratio < 0.9 ? 'portrait' : 'square';
  const targetPlatforms = platforms || (Object.keys(PLATFORM_SPECS) as Platform[]);
  const result: Partial<Record<Platform, ImageSpec>> = {};

  for (const platform of targetPlatforms) {
    const specs = PLATFORM_SPECS[platform];
    // Prefer matching orientation, fall back to first spec
    const match = specs.find(s => s.orientation === srcOrientation) || specs[0];
    result[platform] = match;
  }

  return result as Record<Platform, ImageSpec>;
}

export async function getImageInfo(imageBuffer: Buffer) {
  const metadata = await sharp(imageBuffer).metadata();
  const w = metadata.width || 0;
  const h = metadata.height || 0;
  const ratio = w / h;
  return {
    width: w,
    height: h,
    format: metadata.format || 'unknown',
    sizeKB: Math.round(imageBuffer.length / 1024),
    orientation: (ratio > 1.1 ? 'landscape' : ratio < 0.9 ? 'portrait' : 'square') as Orientation,
    aspectRatio: `${w}:${h}`,
  };
}

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16) || 0,
    g: parseInt(clean.slice(2, 4), 16) || 0,
    b: parseInt(clean.slice(4, 6), 16) || 0,
  };
}
