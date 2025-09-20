"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const payload_1 = require("payload");
const payload_config_1 = __importDefault(require("../src/payload.config"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
async function importProductionData() {
    const payload = await (0, payload_1.getPayload)({ config: payload_config_1.default });
    console.log('📥 Importing production data...');
    try {
        // Check if data file exists
        const dataPath = path_1.default.join(process.cwd(), 'production_data.json');
        try {
            await promises_1.default.access(dataPath);
        }
        catch {
            console.log('⚠️ No production_data.json found. Skipping import.');
            return;
        }
        const dataContent = await promises_1.default.readFile(dataPath, 'utf-8');
        const data = JSON.parse(dataContent);
        console.log(`📊 Found data from ${data.metadata.exportedAt}`);
        console.log('🔄 Starting import...');
        // Import categories first (for relationships)
        if (data.collections.categories?.length > 0) {
            console.log(`\n📁 Importing ${data.collections.categories.length} categories...`);
            for (const category of data.collections.categories) {
                try {
                    // Check if category exists
                    const existing = await payload.find({
                        collection: 'categories',
                        where: { slug: { equals: category.slug } },
                        limit: 1
                    });
                    if (existing.totalDocs === 0) {
                        const { id, createdAt, updatedAt, ...categoryData } = category;
                        await payload.create({
                            collection: 'categories',
                            data: categoryData,
                        });
                        console.log(`   ✅ Created category: ${category.title}`);
                    }
                    else {
                        console.log(`   ⏭️ Category already exists: ${category.title}`);
                    }
                }
                catch (error) {
                    console.error(`   ❌ Failed to import category ${category.title}:`, error.message);
                }
            }
        }
        // Import tags
        if (data.collections.tags?.length > 0) {
            console.log(`\n🏷️ Importing ${data.collections.tags.length} tags...`);
            for (const tag of data.collections.tags) {
                try {
                    const existing = await payload.find({
                        collection: 'tags',
                        where: { slug: { equals: tag.slug } },
                        limit: 1
                    });
                    if (existing.totalDocs === 0) {
                        const { id, createdAt, updatedAt, ...tagData } = tag;
                        await payload.create({
                            collection: 'tags',
                            data: tagData,
                        });
                        console.log(`   ✅ Created tag: ${tag.title}`);
                    }
                }
                catch (error) {
                    console.error(`   ❌ Failed to import tag ${tag.title}:`, error.message);
                }
            }
        }
        // Import media
        if (data.collections.media?.length > 0) {
            console.log(`\n🖼️ Importing ${data.collections.media.length} media items...`);
            for (const media of data.collections.media) {
                try {
                    const existing = await payload.find({
                        collection: 'media',
                        where: { filename: { equals: media.filename } },
                        limit: 1
                    });
                    if (existing.totalDocs === 0) {
                        const { id, createdAt, updatedAt, ...mediaData } = media;
                        await payload.create({
                            collection: 'media',
                            data: mediaData,
                        });
                        console.log(`   ✅ Created media: ${media.filename}`);
                    }
                }
                catch (error) {
                    console.error(`   ❌ Failed to import media ${media.filename}:`, error.message);
                }
            }
        }
        // Import posts
        if (data.collections.posts?.length > 0) {
            console.log(`\n📝 Importing ${data.collections.posts.length} posts...`);
            for (const post of data.collections.posts) {
                try {
                    // Check if post exists
                    const existing = await payload.find({
                        collection: 'posts',
                        where: { slug: { equals: post.slug } },
                        limit: 1
                    });
                    if (existing.totalDocs === 0) {
                        const { id, createdAt, updatedAt, categories, tags, hero, ...postData } = post;
                        // Map category relationships
                        let categoryIds = [];
                        if (categories && Array.isArray(categories)) {
                            for (const cat of categories) {
                                const catSlug = typeof cat === 'object' ? cat.slug : cat;
                                const foundCat = await payload.find({
                                    collection: 'categories',
                                    where: { slug: { equals: catSlug } },
                                    limit: 1
                                });
                                if (foundCat.docs.length > 0) {
                                    categoryIds.push(foundCat.docs[0].id);
                                }
                            }
                        }
                        // Map tag relationships
                        let tagIds = [];
                        if (tags && Array.isArray(tags)) {
                            for (const tag of tags) {
                                const tagSlug = typeof tag === 'object' ? tag.slug : tag;
                                const foundTag = await payload.find({
                                    collection: 'tags',
                                    where: { slug: { equals: tagSlug } },
                                    limit: 1
                                });
                                if (foundTag.docs.length > 0) {
                                    tagIds.push(foundTag.docs[0].id);
                                }
                            }
                        }
                        // Map hero media relationship
                        let heroId = undefined;
                        if (hero && typeof hero === 'object' && hero.media) {
                            const mediaFilename = typeof hero.media === 'object' ? hero.media.filename : null;
                            if (mediaFilename) {
                                const foundMedia = await payload.find({
                                    collection: 'media',
                                    where: { filename: { equals: mediaFilename } },
                                    limit: 1
                                });
                                if (foundMedia.docs.length > 0) {
                                    heroId = { media: foundMedia.docs[0].id };
                                }
                            }
                        }
                        await payload.create({
                            collection: 'posts',
                            data: {
                                ...postData,
                                categories: categoryIds,
                                tags: tagIds,
                                hero: heroId,
                            },
                        });
                        console.log(`   ✅ Created post: ${post.title}`);
                    }
                    else {
                        console.log(`   ⏭️ Post already exists: ${post.title}`);
                    }
                }
                catch (error) {
                    console.error(`   ❌ Failed to import post ${post.title}:`, error.message);
                }
            }
        }
        // Import pages
        if (data.collections.pages?.length > 0) {
            console.log(`\n📄 Importing ${data.collections.pages.length} pages...`);
            for (const page of data.collections.pages) {
                try {
                    const existing = await payload.find({
                        collection: 'pages',
                        where: { slug: { equals: page.slug } },
                        limit: 1
                    });
                    if (existing.totalDocs === 0) {
                        const { id, createdAt, updatedAt, hero, ...pageData } = page;
                        // Map hero media relationship
                        let heroId = undefined;
                        if (hero && typeof hero === 'object' && hero.media) {
                            const mediaFilename = typeof hero.media === 'object' ? hero.media.filename : null;
                            if (mediaFilename) {
                                const foundMedia = await payload.find({
                                    collection: 'media',
                                    where: { filename: { equals: mediaFilename } },
                                    limit: 1
                                });
                                if (foundMedia.docs.length > 0) {
                                    heroId = { media: foundMedia.docs[0].id };
                                }
                            }
                        }
                        await payload.create({
                            collection: 'pages',
                            data: {
                                ...pageData,
                                hero: heroId,
                            },
                        });
                        console.log(`   ✅ Created page: ${page.title}`);
                    }
                }
                catch (error) {
                    console.error(`   ❌ Failed to import page ${page.title}:`, error.message);
                }
            }
        }
        // Import globals
        if (data.globals) {
            console.log('\n🌍 Importing globals...');
            if (data.globals.header) {
                try {
                    await payload.updateGlobal({
                        slug: 'header',
                        data: data.globals.header,
                    });
                    console.log('   ✅ Updated header global');
                }
                catch (error) {
                    console.error('   ❌ Failed to update header:', error.message);
                }
            }
            if (data.globals.footer) {
                try {
                    await payload.updateGlobal({
                        slug: 'footer',
                        data: data.globals.footer,
                    });
                    console.log('   ✅ Updated footer global');
                }
                catch (error) {
                    console.error('   ❌ Failed to update footer:', error.message);
                }
            }
        }
        console.log('\n✅ Import completed successfully!');
    }
    catch (error) {
        console.error('❌ Import failed:', error);
        throw error;
    }
}
// Only run if called directly
if (require.main === module) {
    importProductionData()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
exports.default = importProductionData;
