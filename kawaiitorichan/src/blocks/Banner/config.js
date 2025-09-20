"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Banner = void 0;
const richtext_lexical_1 = require("@payloadcms/richtext-lexical");
exports.Banner = {
    slug: 'banner',
    fields: [
        {
            name: 'style',
            type: 'select',
            defaultValue: 'info',
            options: [
                { label: 'Info', value: 'info' },
                { label: 'Warning', value: 'warning' },
                { label: 'Error', value: 'error' },
                { label: 'Success', value: 'success' },
            ],
            required: true,
        },
        {
            name: 'content',
            type: 'richText',
            editor: (0, richtext_lexical_1.lexicalEditor)({
                features: ({ rootFeatures }) => {
                    return [...rootFeatures, (0, richtext_lexical_1.FixedToolbarFeature)(), (0, richtext_lexical_1.InlineToolbarFeature)()];
                },
            }),
            label: false,
            required: true,
        },
    ],
    interfaceName: 'BannerBlock',
};
