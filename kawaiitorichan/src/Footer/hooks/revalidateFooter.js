"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revalidateFooter = void 0;
const cache_1 = require("next/cache");
const revalidateFooter = ({ doc, req: { payload, context } }) => {
    if (!context.disableRevalidate) {
        payload.logger.info(`Revalidating footer`);
        (0, cache_1.revalidateTag)('global_footer');
    }
    return doc;
};
exports.revalidateFooter = revalidateFooter;
