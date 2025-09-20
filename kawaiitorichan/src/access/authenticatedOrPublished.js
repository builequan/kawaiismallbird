"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticatedOrPublished = void 0;
const authenticatedOrPublished = ({ req: { user } }) => {
    if (user) {
        return true;
    }
    return {
        _status: {
            equals: 'published',
        },
    };
};
exports.authenticatedOrPublished = authenticatedOrPublished;
