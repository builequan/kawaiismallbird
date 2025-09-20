"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revalidateDelete = exports.revalidatePost = void 0;
const cache_1 = require("next/cache");
const revalidatePost = ({ doc, previousDoc, req: { payload, context }, }) => {
    if (!context.disableRevalidate) {
        if (doc._status === 'published') {
            const path = `/posts/${doc.slug}`;
            payload.logger.info(`Revalidating post at path: ${path}`);
            try {
                (0, cache_1.revalidatePath)(path);
                (0, cache_1.revalidateTag)('posts-sitemap');
            }
            catch (error) {
                // Ignore revalidation errors when running outside Next.js context
                payload.logger.info('Note: Revalidation skipped (not in Next.js context)');
            }
        }
        // If the post was previously published, we need to revalidate the old path
        if (previousDoc._status === 'published' && doc._status !== 'published') {
            const oldPath = `/posts/${previousDoc.slug}`;
            payload.logger.info(`Revalidating old post at path: ${oldPath}`);
            try {
                (0, cache_1.revalidatePath)(oldPath);
                (0, cache_1.revalidateTag)('posts-sitemap');
            }
            catch (error) {
                // Ignore revalidation errors when running outside Next.js context
                payload.logger.info('Note: Revalidation skipped (not in Next.js context)');
            }
        }
    }
    return doc;
};
exports.revalidatePost = revalidatePost;
const revalidateDelete = ({ doc, req: { context } }) => {
    if (!context.disableRevalidate) {
        const path = `/posts/${doc?.slug}`;
        try {
            (0, cache_1.revalidatePath)(path);
            (0, cache_1.revalidateTag)('posts-sitemap');
        }
        catch (error) {
            // Ignore revalidation errors when running outside Next.js context
        }
    }
    return doc;
};
exports.revalidateDelete = revalidateDelete;
