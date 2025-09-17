#!/usr/bin/env node

import { getPayload } from 'payload';
import configPromise from '../src/payload.config';

async function fixMarkdownFormatting() {
  console.log('🔧 Fixing markdown formatting in posts...\n');

  const payload = await getPayload({ config: configPromise });

  try {
    // Get all posts
    const posts = await payload.find({
      collection: 'posts',
      limit: 1000,
      depth: 0,
    });

    console.log(`📋 Found ${posts.docs.length} posts to process`);

    let fixedCount = 0;

    for (const post of posts.docs) {
      let modified = false;
      const updatedContent = JSON.parse(JSON.stringify(post.content));

      // Process each node in the content
      if (updatedContent.root && updatedContent.root.children) {
        updatedContent.root.children = processNodes(updatedContent.root.children);
        modified = true;
      }

      if (modified) {
        // Update the post
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: updatedContent,
          },
        });
        fixedCount++;
        console.log(`✅ Fixed formatting in: ${post.title}`);
      }
    }

    console.log(`\n✅ Complete! Fixed ${fixedCount} posts`);

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

function processNodes(nodes: any[]): any[] {
  return nodes.map(node => {
    if (node.type === 'paragraph' && node.children) {
      node.children = processTextNodes(node.children);
    } else if (node.type === 'listitem' && node.children) {
      node.children = processTextNodes(node.children);
    } else if (node.type === 'heading' && node.children) {
      node.children = processTextNodes(node.children);
    } else if (node.type === 'tablecell' && node.children) {
      node.children = processTextNodes(node.children);
    } else if (node.type === 'quote' && node.children) {
      node.children = processNodes(node.children);
    } else if (node.type === 'list' && node.children) {
      node.children = processNodes(node.children);
    } else if (node.type === 'table' && node.children) {
      node.children = processNodes(node.children);
    } else if (node.type === 'tablerow' && node.children) {
      node.children = processNodes(node.children);
    }
    return node;
  });
}

function processTextNodes(children: any[]): any[] {
  const result: any[] = [];

  for (const child of children) {
    if (child.type === 'text' && child.text) {
      // Split text by markdown patterns and create appropriate nodes
      const processedNodes = parseMarkdownText(child.text, child.format || 0);
      result.push(...processedNodes);
    } else {
      result.push(child);
    }
  }

  return result;
}

function parseMarkdownText(text: string, baseFormat: number = 0): any[] {
  const nodes: any[] = [];
  let remaining = text;
  let lastIndex = 0;

  // Pattern to match bold (**text** or __text__)
  const boldPattern = /\*\*([^*]+)\*\*|__([^_]+)__/g;
  // Pattern to match italic (*text* or _text_) but not bold
  const italicPattern = /(?<!\*)\*(?!\*)([^*]+)(?<!\*)\*(?!\*)|(?<!_)_(?!_)([^_]+)(?<!_)_(?!_)/g;

  // First pass: handle bold text
  let processedText = text;
  const boldMatches: Array<{start: number, end: number, text: string}> = [];

  let match;
  while ((match = boldPattern.exec(text)) !== null) {
    boldMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[1] || match[2]
    });
  }

  // Build nodes with proper formatting
  let currentPos = 0;

  for (const boldMatch of boldMatches) {
    // Add text before the bold
    if (currentPos < boldMatch.start) {
      const beforeText = text.substring(currentPos, boldMatch.start);
      if (beforeText) {
        // Check for italic in this segment
        const italicNodes = processItalicText(beforeText, baseFormat);
        nodes.push(...italicNodes);
      }
    }

    // Add the bold text
    nodes.push({
      type: 'text',
      version: 1,
      text: boldMatch.text,
      format: baseFormat | 1, // Add bold flag (1)
      detail: 0,
      mode: 'normal',
    });

    currentPos = boldMatch.end;
  }

  // Add remaining text
  if (currentPos < text.length) {
    const remainingText = text.substring(currentPos);
    if (remainingText) {
      const italicNodes = processItalicText(remainingText, baseFormat);
      nodes.push(...italicNodes);
    }
  }

  // If no bold matches, process for italic only
  if (boldMatches.length === 0) {
    const italicNodes = processItalicText(text, baseFormat);
    nodes.push(...italicNodes);
  }

  return nodes.length > 0 ? nodes : [{
    type: 'text',
    version: 1,
    text: text,
    format: baseFormat,
    detail: 0,
    mode: 'normal',
  }];
}

function processItalicText(text: string, baseFormat: number): any[] {
  const nodes: any[] = [];
  const italicPattern = /(?<!\*)\*(?!\*)([^*]+)(?<!\*)\*(?!\*)|(?<!_)_(?!_)([^_]+)(?<!_)_(?!_)/g;

  let currentPos = 0;
  let match;

  while ((match = italicPattern.exec(text)) !== null) {
    // Add text before italic
    if (currentPos < match.index) {
      const beforeText = text.substring(currentPos, match.index);
      if (beforeText) {
        nodes.push({
          type: 'text',
          version: 1,
          text: beforeText,
          format: baseFormat,
          detail: 0,
          mode: 'normal',
        });
      }
    }

    // Add italic text
    nodes.push({
      type: 'text',
      version: 1,
      text: match[1] || match[2],
      format: baseFormat | 2, // Add italic flag (2)
      detail: 0,
      mode: 'normal',
    });

    currentPos = match.index + match[0].length;
  }

  // Add remaining text
  if (currentPos < text.length) {
    const remainingText = text.substring(currentPos);
    if (remainingText) {
      nodes.push({
        type: 'text',
        version: 1,
        text: remainingText,
        format: baseFormat,
        detail: 0,
        mode: 'normal',
      });
    }
  }

  // If no matches, return original text
  if (nodes.length === 0) {
    nodes.push({
      type: 'text',
      version: 1,
      text: text,
      format: baseFormat,
      detail: 0,
      mode: 'normal',
    });
  }

  return nodes;
}

fixMarkdownFormatting().catch(console.error);