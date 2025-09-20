"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallToAction = void 0;
const richtext_lexical_1 = require("@payloadcms/richtext-lexical");
const linkGroup_1 = require("../../fields/linkGroup");
exports.CallToAction = {
    slug: 'cta',
    interfaceName: 'CallToActionBlock',
    fields: [
        {
            name: 'richText',
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
            label: false,
        },
        (0, linkGroup_1.linkGroup)({
            appearances: ['default', 'outline'],
            overrides: {
                maxRows: 2,
            },
        }),
    ],
    labels: {
        plural: 'Calls to Action',
        singular: 'Call to Action',
    },
};
