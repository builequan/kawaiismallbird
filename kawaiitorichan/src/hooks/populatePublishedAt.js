"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.populatePublishedAt = void 0;
const populatePublishedAt = ({ data, operation, req }) => {
    if (operation === 'create' || operation === 'update') {
        if (req.data && !req.data.publishedAt) {
            const now = new Date();
            return {
                ...data,
                publishedAt: now,
            };
        }
    }
    return data;
};
exports.populatePublishedAt = populatePublishedAt;
