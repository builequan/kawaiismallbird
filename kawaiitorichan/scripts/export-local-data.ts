import { getPayload } from 'payload';
import configPromise from '../src/payload.config';
import fs from 'fs/promises';
import path from 'path';

async function exportLocalData() {
  const payload = await getPayload({ config: configPromise });

  console.log('📦 Exporting data from local database...');

  try {
    // Export all collections
    const [posts, categories, media, pages, users, tags] = await Promise.all([
      payload.find({ collection: 'posts', limit: 1000, depth: 2 }),
      payload.find({ collection: 'categories', limit: 100 }),
      payload.find({ collection: 'media', limit: 500 }),
      payload.find({ collection: 'pages', limit: 100, depth: 2 }),
      payload.find({ collection: 'users', limit: 10 }),
      payload.find({ collection: 'tags', limit: 100 }),
    ]);

    // Export globals
    const [header, footer] = await Promise.all([
      payload.findGlobal({ slug: 'header' }),
      payload.findGlobal({ slug: 'footer' }),
    ]);

    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        counts: {
          posts: posts.totalDocs,
          categories: categories.totalDocs,
          media: media.totalDocs,
          pages: pages.totalDocs,
          users: users.totalDocs,
          tags: tags.totalDocs,
        },
      },
      collections: {
        posts: posts.docs,
        categories: categories.docs,
        media: media.docs,
        pages: pages.docs,
        users: users.docs,
        tags: tags.docs,
      },
      globals: {
        header,
        footer,
      },
    };

    // Save to JSON file
    const exportPath = path.join(process.cwd(), 'production_data.json');
    await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));

    console.log('✅ Data exported successfully!');
    console.log(`📁 Export saved to: ${exportPath}`);
    console.log('\n📊 Export Summary:');
    console.log(`   - Posts: ${posts.totalDocs}`);
    console.log(`   - Categories: ${categories.totalDocs}`);
    console.log(`   - Media: ${media.totalDocs}`);
    console.log(`   - Pages: ${pages.totalDocs}`);
    console.log(`   - Users: ${users.totalDocs}`);
    console.log(`   - Tags: ${tags.totalDocs}`);

    console.log('\n📤 Next steps:');
    console.log('1. Commit production_data.json to your repository');
    console.log('2. Push to GitHub');
    console.log('3. Redeploy on Dokploy');
    console.log('4. The import script will automatically run on startup');

  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

exportLocalData();