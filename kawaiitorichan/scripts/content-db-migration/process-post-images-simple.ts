#!/usr/bin/env node

import { getPayload } from 'payload';
import configPromise from '../../src/payload.config';
import { uploadImageToPayload, cleanupTempImages } from './image-handler';

/**
 * Simple script to process images in posts - replacing markdown images with upload nodes
 */
async function processPostImages(postId?: string) {
  const payload = await getPayload({ config: configPromise });

  try {
    // Get posts to process
    const query: any = {
      collection: 'posts',
      limit: 1000,
    };

    if (postId) {
      query.where = { id: { equals: postId } };
    } else {
      // Only process posts from content database
      query.where = {
        'contentDbMeta.originalId': { exists: true },
      };
    }

    const posts = await payload.find(query);

    console.log(`📋 Found ${posts.docs.length} posts to process`);

    let processedCount = 0;
    let totalImages = 0;

    for (const post of posts.docs) {
      console.log(`\n📄 Processing: ${post.title}`);

      let imageCount = 0;
      let modified = false;

      // Deep clone the content
      const updatedContent = JSON.parse(JSON.stringify(post.content));

      // Process each paragraph to find markdown images
      if (updatedContent.root && updatedContent.root.children) {
        for (let i = 0; i < updatedContent.root.children.length; i++) {
          const node = updatedContent.root.children[i];

          // Check if this is a paragraph with text containing markdown images
          if (node.type === 'paragraph' && node.children) {
            for (let j = 0; j < node.children.length; j++) {
              const child = node.children[j];

              if (child.type === 'text' && child.text) {
                // Check for markdown image pattern
                const imagePattern = /^!\[([^\]]*)\]\(([^)]+)\)$/;
                const match = imagePattern.exec(child.text.trim());

                if (match) {
                  const alt = match[1] || '';
                  const url = match[2];

                  console.log(`   📤 Found image: ${url.substring(0, 50)}...`);

                  // Try to upload the image
                  const uploaded = await uploadImageToPayload(url, alt);

                  if (uploaded) {
                    // Replace the entire paragraph with an upload node
                    updatedContent.root.children[i] = {
                      type: 'upload',
                      version: 1,
                      relationTo: 'media',
                      value: {
                        id: uploaded.id,
                      },
                    };
                    imageCount++;
                    modified = true;
                    console.log(`   ✅ Uploaded with ID: ${uploaded.id}`);
                  } else {
                    console.log(`   ❌ Failed to upload image`);
                  }
                  break; // Move to next paragraph
                }
              }
            }
          }
        }
      }

      if (modified) {
        // Update the post with new content
        console.log(`   💾 Updating post with ${imageCount} uploaded images`);
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: updatedContent,
          },
        });
        processedCount++;
        totalImages += imageCount;
      } else {
        console.log('   No images found or already processed');
      }
    }

    console.log(`\n✅ Complete! Processed ${processedCount} posts, uploaded ${totalImages} images`);

  } catch (error) {
    console.error('❌ Error processing posts:', error);
  } finally {
    // Clean up temp directory
    cleanupTempImages();
  }

  process.exit(0);
}

// Handle command line arguments
const postId = process.argv[2];
if (postId === '--help') {
  console.log('Usage: pnpm tsx scripts/content-db-migration/process-post-images-simple.ts [postId]');
  console.log('  postId: Optional. If provided, only process that specific post');
  console.log('          If not provided, process all posts with contentDbMeta');
  process.exit(0);
}

// Run the script
processPostImages(postId).catch(console.error);