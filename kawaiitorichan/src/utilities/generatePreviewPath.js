"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePreviewPath = void 0;
const collectionPrefixMap = {
    posts: '/posts',
    pages: '',
};
const generatePreviewPath = ({ collection, slug }) => {
    const encodedParams = new URLSearchParams({
        slug,
        collection,
        path: `${collectionPrefixMap[collection]}/${slug}`,
        previewSecret: process.env.PREVIEW_SECRET || '',
    });
    const url = `/next/preview?${encodedParams.toString()}`;
    return url;
};
exports.generatePreviewPath = generatePreviewPath;
