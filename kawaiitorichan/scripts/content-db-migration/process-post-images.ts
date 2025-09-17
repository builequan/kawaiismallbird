#!/usr/bin/env node

import { getPayload } from 'payload';
import configPromise from '../../src/payload.config';
import { extractImageUrls, uploadImageToPayload, cleanupTempImages } from './image-handler';

/**
 * Process images in existing posts and convert to proper upload nodes
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
    let imageCount = 0;

    for (const post of posts.docs) {
      console.log(`\n📄 Processing: ${post.title}`);

      // Convert content to string to search for images
      const contentStr = JSON.stringify(post.content);
      const images = extractImageUrls(contentStr);

      if (images.length === 0) {
        console.log('   No images found');
        continue;
      }

      console.log(`   Found ${images.length} images`);

      // Process the Lexical content
      let updatedContent = JSON.parse(JSON.stringify(post.content));
      let modified = false;

      // Recursively process nodes to find and replace image text
      async function processNode(node: any): Promise<any> {
        let nodeModified = false;

        if (node.type === 'text' && node.text) {
          // Check if this text contains markdown images
          const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
          let match;
          const matches: Array<{ full: string; alt: string; url: string }> = [];

          while ((match = imagePattern.exec(node.text)) !== null) {
            matches.push({
              full: match[0],
              alt: match[1] || '',
              url: match[2],
            });
          }

          if (matches.length > 0) {
            // This text node contains images, we need to split it
            const parts: any[] = [];
            let lastIndex = 0;

            for (const imageMatch of matches) {
              const index = node.text.indexOf(imageMatch.full, lastIndex);

              // Add text before the image
              if (index > lastIndex) {
                const textBefore = node.text.substring(lastIndex, index);
                if (textBefore) {
                  parts.push({
                    type: 'text',
                    version: 1,
                    text: textBefore,
                    format: node.format || 0,
                    detail: node.detail || 0,
                    mode: node.mode || 'normal',
                  });
                }
              }

              // Upload the image and create upload node
              console.log(`   📤 Uploading: ${imageMatch.url.substring(0, 50)}...`);
              const uploaded = await uploadImageToPayload(imageMatch.url, imageMatch.alt);

              if (uploaded) {
                // Create upload node
                parts.push({
                  type: 'upload',
                  version: 1,
                  relationTo: 'media',
                  value: {
                    id: uploaded.id,
                  },
                });
                imageCount++;
              } else {
                // If upload failed, keep the text
                parts.push({
                  type: 'text',
                  version: 1,
                  text: imageMatch.full,
                  format: node.format || 0,
                  detail: node.detail || 0,
                  mode: node.mode || 'normal',
                });
              }

              lastIndex = index + imageMatch.full.length;
            }

            // Add any remaining text
            if (lastIndex < node.text.length) {
              const textAfter = node.text.substring(lastIndex);
              if (textAfter) {
                parts.push({
                  type: 'text',
                  version: 1,
                  text: textAfter,
                  format: node.format || 0,
                  detail: node.detail || 0,
                  mode: node.mode || 'normal',
                });
              }
            }

            // Return the parts to be inserted
            return parts;
          }
        }

        // Process children recursively
        if (node.children && Array.isArray(node.children)) {
          const newChildren: any[] = [];
          for (const child of node.children) {
            const result = await processNode(child);
            if (Array.isArray(result)) {
              // Child was replaced with multiple nodes
              newChildren.push(...result);
              nodeModified = true;
            } else if (result === true) {
              // Child was modified
              newChildren.push(child);
              nodeModified = true;
            } else {
              // Child was not modified
              newChildren.push(child);
            }
          }
          if (nodeModified) {
            node.children = newChildren;
          }
        }

        return nodeModified;
      }

      // Process the root content
      modified = await processNode(updatedContent.root);

      if (modified) {
        // Update the post with new content
        console.log(`   ✅ Updating post with ${imageCount} uploaded images`);
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: updatedContent,
          },
        });
        processedCount++;
      }
    }

    console.log(`\n✅ Processed ${processedCount} posts, uploaded ${imageCount} images`);

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
  console.log('Usage: pnpm tsx scripts/content-db-migration/process-post-images.ts [postId]');
  console.log('  postId: Optional. If provided, only process that specific post');
  console.log('          If not provided, process all posts with contentDbMeta');
  process.exit(0);
}

// Run the script
processPostImages(postId).catch(console.error);