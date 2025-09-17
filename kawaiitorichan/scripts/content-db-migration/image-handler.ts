// Using dynamic import for ESM module
const fetch = (...args: any[]) => import('node-fetch').then(({default: fetch}) => fetch(...args as any));
import { getPayload } from 'payload';
import configPromise from '../../src/payload.config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Cache for already uploaded images (URL -> media ID mapping)
const uploadedImagesCache = new Map<string, string>();

/**
 * Download image from URL and save to temporary file
 */
async function downloadImage(url: string): Promise<{ filePath: string; mimeType: string; fileName: string } | null> {
  try {
    console.log(`📥 Downloading image from: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`❌ Failed to download image: ${response.statusText}`);
      return null;
    }

    // Get content type and create appropriate extension
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const extension = contentType.split('/')[1] || 'jpg';

    // Generate unique filename
    const hash = crypto.createHash('md5').update(url).digest('hex');
    const fileName = `import-${hash}.${extension}`;

    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp-images');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filePath = path.join(tempDir, fileName);

    // Download and save the image
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    console.log(`✅ Downloaded to: ${filePath}`);

    return {
      filePath,
      mimeType: contentType,
      fileName
    };
  } catch (error) {
    console.error(`❌ Error downloading image from ${url}:`, error);
    return null;
  }
}

/**
 * Upload image to Payload media collection
 */
export async function uploadImageToPayload(
  url: string,
  altText?: string
): Promise<{ id: string; url: string; alt: string } | null> {
  // Check cache first
  if (uploadedImagesCache.has(url)) {
    const mediaId = uploadedImagesCache.get(url)!;
    console.log(`📎 Using cached image: ${mediaId}`);

    const payload = await getPayload({ config: configPromise });
    const media = await payload.findByID({
      collection: 'media',
      id: mediaId,
    });

    return {
      id: mediaId,
      url: media.url || '',
      alt: media.alt || altText || '',
    };
  }

  // Download the image
  const downloaded = await downloadImage(url);
  if (!downloaded) {
    return null;
  }

  try {
    const payload = await getPayload({ config: configPromise });

    // Read the file as buffer
    const fileBuffer = fs.readFileSync(downloaded.filePath);

    // Create a File-like object for Payload
    const file = {
      data: fileBuffer,
      mimetype: downloaded.mimeType,
      name: downloaded.fileName,
      size: fileBuffer.length,
    };

    // Upload to Payload media collection
    console.log(`📤 Uploading to Payload media collection...`);
    const uploaded = await payload.create({
      collection: 'media',
      data: {
        alt: altText || 'Imported image',
      },
      file,
    });

    console.log(`✅ Uploaded with ID: ${uploaded.id}`);

    // Cache the result
    uploadedImagesCache.set(url, uploaded.id);

    // Clean up temp file
    fs.unlinkSync(downloaded.filePath);

    return {
      id: uploaded.id,
      url: uploaded.url || '',
      alt: uploaded.alt || altText || '',
    };
  } catch (error) {
    console.error(`❌ Error uploading image to Payload:`, error);

    // Clean up temp file on error
    if (fs.existsSync(downloaded.filePath)) {
      fs.unlinkSync(downloaded.filePath);
    }

    return null;
  }
}

/**
 * Extract image URLs from markdown content
 */
export function extractImageUrls(content: string): Array<{ url: string; alt: string }> {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images: Array<{ url: string; alt: string }> = [];

  let match;
  while ((match = imageRegex.exec(content)) !== null) {
    images.push({
      alt: match[1] || '',
      url: match[2],
    });
  }

  return images;
}

/**
 * Process all images in content and upload them
 */
export async function processContentImages(content: string): Promise<Map<string, string>> {
  const images = extractImageUrls(content);
  const urlToMediaId = new Map<string, string>();

  console.log(`🔍 Found ${images.length} images to process`);

  for (const image of images) {
    const uploaded = await uploadImageToPayload(image.url, image.alt);
    if (uploaded) {
      urlToMediaId.set(image.url, uploaded.id);
    }
  }

  return urlToMediaId;
}

/**
 * Clean up temp images directory
 */
export function cleanupTempImages() {
  const tempDir = path.join(process.cwd(), 'temp-images');
  if (fs.existsSync(tempDir)) {
    const files = fs.readdirSync(tempDir);
    files.forEach(file => {
      fs.unlinkSync(path.join(tempDir, file));
    });
    fs.rmdirSync(tempDir);
    console.log('🧹 Cleaned up temp images directory');
  }
}