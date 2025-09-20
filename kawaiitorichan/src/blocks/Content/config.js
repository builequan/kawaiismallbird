"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Content = void 0;
const richtext_lexical_1 = require("@payloadcms/richtext-lexical");
const link_1 = require("@/fields/link");
const columnFields = [
    {
        name: 'size',
        type: 'select',
        defaultValue: 'oneThird',
        options: [
            {
                label: 'One Third',
                value: 'oneThird',
            },
            {
                label: 'Half',
                value: 'half',
            },
            {
                label: 'Two Thirds',
                value: 'twoThirds',
            },
            {
                label: 'Full',
                value: 'full',
            },
        ],
    },
    {
        name: 'richText',
        type: 'richText',
        editor: (0, richtext_lexical_1.lexicalEditor)({
            features: ({ rootFeatures }) => {
                return [
                    ...rootFeatures,
                    (0, richtext_lexical_1.HeadingFeature)({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
                    (0, richtext_lexical_1.FixedToolbarFeature)(),
                    (0, richtext_lexical_1.InlineToolbarFeature)(),
                ];
            },
        }),
        label: false,
    },
    {
        name: 'enableLink',
        type: 'checkbox',
    },
    (0, link_1.link)({
        overrides: {
            admin: {
                condition: (_data, siblingData) => {
                    return Boolean(siblingData?.enableLink);
                },
            },
        },
    }),
];
exports.Content = {
    slug: 'content',
    interfaceName: 'ContentBlock',
    fields: [
        {
            name: 'columns',
            type: 'array',
            admin: {
                initCollapsed: true,
            },
            fields: columnFields,
        },
    ],
};
