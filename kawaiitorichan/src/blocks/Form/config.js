"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormBlock = void 0;
const richtext_lexical_1 = require("@payloadcms/richtext-lexical");
exports.FormBlock = {
    slug: 'formBlock',
    interfaceName: 'FormBlock',
    fields: [
        {
            name: 'form',
            type: 'relationship',
            relationTo: 'forms',
            required: true,
        },
        {
            name: 'enableIntro',
            type: 'checkbox',
            label: 'Enable Intro Content',
        },
        {
            name: 'introContent',
            type: 'richText',
            admin: {
                condition: (_, { enableIntro }) => Boolean(enableIntro),
            },
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
    ],
    graphQL: {
        singularName: 'FormBlock',
    },
    labels: {
        plural: 'Form Blocks',
        singular: 'Form Block',
    },
};
