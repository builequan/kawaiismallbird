"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revalidateHeader = void 0;
const cache_1 = require("next/cache");
const revalidateHeader = ({ doc, req: { payload, context } }) => {
    if (!context.disableRevalidate) {
        payload.logger.info(`Revalidating header`);
        (0, cache_1.revalidateTag)('global_header');
    }
    return doc;
};
exports.revalidateHeader = revalidateHeader;
