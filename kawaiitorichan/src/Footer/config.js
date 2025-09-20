"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Footer = void 0;
const link_1 = require("@/fields/link");
const revalidateFooter_1 = require("./hooks/revalidateFooter");
exports.Footer = {
    slug: 'footer',
    access: {
        read: () => true,
    },
    fields: [
        {
            name: 'navItems',
            type: 'array',
            fields: [
                (0, link_1.link)({
                    appearances: false,
                }),
            ],
            maxRows: 6,
            admin: {
                initCollapsed: true,
                components: {
                    RowLabel: '@/Footer/RowLabel#RowLabel',
                },
            },
        },
    ],
    hooks: {
        afterChange: [revalidateFooter_1.revalidateFooter],
    },
};
