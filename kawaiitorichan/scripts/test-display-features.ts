#!/usr/bin/env node

import { getPayload } from 'payload';
import configPromise from '../src/payload.config';

async function testDisplayFeatures() {
  console.log('🧪 Creating test post with various display features...\n');

  try {
    const payload = await getPayload({ config: configPromise });

    // Create Lexical document with various features
    const lexicalContent = {
      root: {
        type: 'root',
        version: 1,
        children: [
          {
            type: 'heading',
            version: 1,
            tag: 'h1',
            children: [{ type: 'text', version: 1, text: 'Display Test Post', format: 0, detail: 0, mode: 'normal' }],
            format: 0,
            indent: 0,
            direction: null,
          },
          {
            type: 'paragraph',
            version: 1,
            children: [
              { type: 'text', version: 1, text: 'This is ', format: 0, detail: 0, mode: 'normal' },
              { type: 'text', version: 1, text: 'bold text', format: 1, detail: 0, mode: 'normal' }, // Bold
              { type: 'text', version: 1, text: ', ', format: 0, detail: 0, mode: 'normal' },
              { type: 'text', version: 1, text: 'italic text', format: 2, detail: 0, mode: 'normal' }, // Italic
              { type: 'text', version: 1, text: ', and ', format: 0, detail: 0, mode: 'normal' },
              { type: 'text', version: 1, text: 'bold italic text', format: 3, detail: 0, mode: 'normal' }, // Bold+Italic
              { type: 'text', version: 1, text: '.', format: 0, detail: 0, mode: 'normal' },
            ],
            format: 0,
            indent: 0,
            direction: null,
          },
          {
            type: 'heading',
            version: 1,
            tag: 'h2',
            children: [{ type: 'text', version: 1, text: 'Bullet List', format: 0, detail: 0, mode: 'normal' }],
            format: 0,
            indent: 0,
            direction: null,
          },
          {
            type: 'list',
            version: 1,
            tag: 'ul',
            listType: 'bullet',
            children: [
              {
                type: 'listitem',
                version: 1,
                children: [{ type: 'text', version: 1, text: 'First bullet point', format: 0, detail: 0, mode: 'normal' }],
                format: 0,
                indent: 0,
                direction: null,
              },
              {
                type: 'listitem',
                version: 1,
                children: [{ type: 'text', version: 1, text: 'Second bullet point with ', format: 0, detail: 0, mode: 'normal' }, { type: 'text', version: 1, text: 'bold', format: 1, detail: 0, mode: 'normal' }],
                format: 0,
                indent: 0,
                direction: null,
              },
              {
                type: 'listitem',
                version: 1,
                children: [{ type: 'text', version: 1, text: 'Third bullet point', format: 0, detail: 0, mode: 'normal' }],
                format: 0,
                indent: 0,
                direction: null,
              },
            ],
            format: 0,
            indent: 0,
            direction: null,
          },
          {
            type: 'heading',
            version: 1,
            tag: 'h2',
            children: [{ type: 'text', version: 1, text: 'Numbered List', format: 0, detail: 0, mode: 'normal' }],
            format: 0,
            indent: 0,
            direction: null,
          },
          {
            type: 'list',
            version: 1,
            tag: 'ol',
            listType: 'number',
            start: 1,
            children: [
              {
                type: 'listitem',
                version: 1,
                children: [{ type: 'text', version: 1, text: 'First numbered item', format: 0, detail: 0, mode: 'normal' }],
                format: 0,
                indent: 0,
                direction: null,
              },
              {
                type: 'listitem',
                version: 1,
                children: [{ type: 'text', version: 1, text: 'Second numbered item with ', format: 0, detail: 0, mode: 'normal' }, { type: 'text', version: 1, text: 'italic text', format: 2, detail: 0, mode: 'normal' }],
                format: 0,
                indent: 0,
                direction: null,
              },
              {
                type: 'listitem',
                version: 1,
                children: [{ type: 'text', version: 1, text: 'Third numbered item', format: 0, detail: 0, mode: 'normal' }],
                format: 0,
                indent: 0,
                direction: null,
              },
            ],
            format: 0,
            indent: 0,
            direction: null,
          },
          {
            type: 'heading',
            version: 1,
            tag: 'h2',
            children: [{ type: 'text', version: 1, text: 'Code Example', format: 0, detail: 0, mode: 'normal' }],
            format: 0,
            indent: 0,
            direction: null,
          },
          {
            type: 'paragraph',
            version: 1,
            children: [
              { type: 'text', version: 1, text: 'Here is some ', format: 0, detail: 0, mode: 'normal' },
              { type: 'text', version: 1, text: 'inline code', format: 16, detail: 0, mode: 'normal' }, // Code format
              { type: 'text', version: 1, text: ' in the text.', format: 0, detail: 0, mode: 'normal' },
            ],
            format: 0,
            indent: 0,
            direction: null,
          },
        ],
        format: 0,
        indent: 0,
        direction: null,
      },
    };

    const postData = {
      title: 'Display Test - All Features',
      content: lexicalContent,
      slug: 'display-test-' + Date.now(),
      language: 'ja',
      _status: 'published' as const,
    };

    console.log('📤 Creating test post...');
    const created = await payload.create({
      collection: 'posts',
      data: postData,
    });

    console.log(`✅ Test post created with ID: ${created.id}`);
    console.log(`📍 View at: http://localhost:3001/posts/${created.slug}`);
    console.log('\nFeatures to verify:');
    console.log('  ✓ Bold text');
    console.log('  ✓ Italic text');
    console.log('  ✓ Bold + Italic text');
    console.log('  ✓ Bullet lists');
    console.log('  ✓ Numbered lists');
    console.log('  ✓ Inline code');
    console.log('  ✓ Headings');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  process.exit(0);
}

testDisplayFeatures().catch(console.error);