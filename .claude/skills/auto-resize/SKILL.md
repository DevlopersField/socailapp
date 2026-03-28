---
description: Image resizer and optimizer for social media platforms. Use when the user needs to resize, crop, or optimize images for Instagram, LinkedIn, Twitter/X, Pinterest, Dribbble, or Google My Business posting requirements.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Auto-Resize — Platform Image Optimizer

You resize and optimize images for every social media platform in AutoSocial.

## Platform Specifications

### Instagram
| Type | Size | Ratio |
|------|------|-------|
| Feed Square | 1080x1080 | 1:1 |
| Feed Portrait | 1080x1350 | 4:5 |
| Feed Landscape | 1080x566 | 1.91:1 |
| Story/Reel | 1080x1920 | 9:16 |
| Carousel | 1080x1080 | 1:1 |
| Profile Pic | 320x320 | 1:1 |

### LinkedIn
| Type | Size | Ratio |
|------|------|-------|
| Feed Image | 1200x627 | 1.91:1 |
| Article Cover | 1200x644 | 1.86:1 |
| Carousel | 1080x1080 | 1:1 |
| Company Logo | 300x300 | 1:1 |
| Banner | 1128x191 | 5.9:1 |

### Twitter/X
| Type | Size | Ratio |
|------|------|-------|
| In-stream | 1200x675 | 16:9 |
| Card Image | 1600x900 | 16:9 |
| Profile | 400x400 | 1:1 |
| Header | 1500x500 | 3:1 |

### Pinterest
| Type | Size | Ratio |
|------|------|-------|
| Standard Pin | 1000x1500 | 2:3 |
| Long Pin | 1000x2100 | 1:2.1 |
| Square Pin | 1000x1000 | 1:1 |

### Dribbble
| Type | Size | Ratio |
|------|------|-------|
| Shot | 1600x1200 | 4:3 |
| Thumbnail | 800x600 | 4:3 |

### Google My Business
| Type | Size | Ratio |
|------|------|-------|
| Post Image | 720x720 | 1:1 |
| Cover Photo | 1080x608 | 16:9 |
| Logo | 250x250 | 1:1 |

## Resize Strategy

1. **Smart Crop** — Focus on center of interest, avoid cutting important content
2. **Quality** — Output at 85-92% JPEG quality (balance size vs quality)
3. **Format** — JPEG for photos, PNG for graphics/text, WebP for web
4. **Max file size** — Keep under 5MB for all platforms
5. **Batch processing** — Resize one source image for all selected platforms at once

## Implementation

Uses Sharp (Node.js) for image processing:

```javascript
const sharp = require('sharp');

async function resizeForPlatform(inputPath, platform, type) {
  const specs = PLATFORM_SPECS[platform][type];
  return sharp(inputPath)
    .resize(specs.width, specs.height, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 90 })
    .toFile(outputPath);
}
```

## Workflow

1. User provides source image(s)
2. Select target platforms and types
3. Generate all resized versions
4. Output to organized folder structure
5. Return summary with file paths and sizes
