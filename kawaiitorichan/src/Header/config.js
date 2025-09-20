"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Header = void 0;
const link_1 = require("@/fields/link");
const revalidateHeader_1 = require("./hooks/revalidateHeader");
exports.Header = {
    slug: 'header',
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
                    RowLabel: '@/Header/RowLabel#RowLabel',
                },
            },
        },
    ],
    hooks: {
        afterChange: [revalidateHeader_1.revalidateHeader],
    },
};
