"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Archive = void 0;
const richtext_lexical_1 = require("@payloadcms/richtext-lexical");
exports.Archive = {
    slug: 'archive',
    interfaceName: 'ArchiveBlock',
    fields: [
        {
            name: 'introContent',
            type: 'richText',
            editor: (0, richtext_lexical_1.lexicalEditor)({
                features: ({ rootFeatures }) => {
                    return [
                        ...rootFeatures,
                        (0, richtext_lexical_1.HeadingFeature)({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                        (0, richtext_lexical_1.FixedToolbarFeature)(),
                        (0, richtext_lexical_1.InlineToolbarFeature)(),
                    ];
                },
            }),
            label: 'Intro Content',
        },
        {
            name: 'populateBy',
            type: 'select',
            defaultValue: 'collection',
            options: [
                {
                    label: 'Collection',
                    value: 'collection',
                },
                {
                    label: 'Individual Selection',
                    value: 'selection',
                },
            ],
        },
        {
            name: 'relationTo',
            type: 'select',
            admin: {
                condition: (_, siblingData) => siblingData.populateBy === 'collection',
            },
            defaultValue: 'posts',
            label: 'Collections To Show',
            options: [
                {
                    label: 'Posts',
                    value: 'posts',
                },
            ],
        },
        {
            name: 'categories',
            type: 'relationship',
            admin: {
                condition: (_, siblingData) => siblingData.populateBy === 'collection',
            },
            hasMany: true,
            label: 'Categories To Show',
            relationTo: 'categories',
        },
        {
            name: 'limit',
            type: 'number',
            admin: {
                condition: (_, siblingData) => siblingData.populateBy === 'collection',
                step: 1,
            },
            defaultValue: 10,
            label: 'Limit',
        },
        {
            name: 'selectedDocs',
            type: 'relationship',
            admin: {
                condition: (_, siblingData) => siblingData.populateBy === 'selection',
            },
            hasMany: true,
            label: 'Selection',
            relationTo: ['posts'],
        },
    ],
    labels: {
        plural: 'Archives',
        singular: 'Archive',
    },
};
