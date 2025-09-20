"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revalidateDelete = exports.revalidatePage = void 0;
const cache_1 = require("next/cache");
const revalidatePage = ({ doc, previousDoc, req: { payload, context }, }) => {
    if (!context.disableRevalidate) {
        if (doc._status === 'published') {
            const path = doc.slug === 'home' ? '/' : `/${doc.slug}`;
            payload.logger.info(`Revalidating page at path: ${path}`);
            (0, cache_1.revalidatePath)(path);
            (0, cache_1.revalidateTag)('pages-sitemap');
        }
        // If the page was previously published, we need to revalidate the old path
        if (previousDoc?._status === 'published' && doc._status !== 'published') {
            const oldPath = previousDoc.slug === 'home' ? '/' : `/${previousDoc.slug}`;
            payload.logger.info(`Revalidating old page at path: ${oldPath}`);
            (0, cache_1.revalidatePath)(oldPath);
            (0, cache_1.revalidateTag)('pages-sitemap');
        }
    }
    return doc;
};
exports.revalidatePage = revalidatePage;
const revalidateDelete = ({ doc, req: { context } }) => {
    if (!context.disableRevalidate) {
        const path = doc?.slug === 'home' ? '/' : `/${doc?.slug}`;
        (0, cache_1.revalidatePath)(path);
        (0, cache_1.revalidateTag)('pages-sitemap');
    }
    return doc;
};
exports.revalidateDelete = revalidateDelete;
