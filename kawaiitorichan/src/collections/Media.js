"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Media = void 0;
const richtext_lexical_1 = require("@payloadcms/richtext-lexical");
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
const anyone_1 = require("../access/anyone");
const authenticated_1 = require("../access/authenticated");
const filename = (0, url_1.fileURLToPath)(import.meta.url);
const dirname = path_1.default.dirname(filename);
exports.Media = {
    slug: 'media',
    access: {
        create: authenticated_1.authenticated,
        delete: authenticated_1.authenticated,
        read: anyone_1.anyone,
        update: authenticated_1.authenticated,
    },
    fields: [
        {
            name: 'alt',
            type: 'text',
            //required: true,
        },
        {
            name: 'caption',
            type: 'richText',
            editor: (0, richtext_lexical_1.lexicalEditor)({
                features: ({ rootFeatures }) => {
                    return [...rootFeatures, (0, richtext_lexical_1.FixedToolbarFeature)(), (0, richtext_lexical_1.InlineToolbarFeature)()];
                },
            }),
        },
    ],
    upload: {
        // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
        staticDir: path_1.default.resolve(dirname, '../../public/media'),
        adminThumbnail: 'thumbnail',
        focalPoint: true,
        imageSizes: [
            {
                name: 'thumbnail',
                width: 300,
            },
            {
                name: 'square',
                width: 500,
                height: 500,
            },
            {
                name: 'small',
                width: 600,
            },
            {
                name: 'medium',
                width: 900,
            },
            {
                name: 'large',
                width: 1400,
            },
            {
                name: 'xlarge',
                width: 1920,
            },
            {
                name: 'og',
                width: 1200,
                height: 630,
                crop: 'center',
            },
        ],
    },
};
