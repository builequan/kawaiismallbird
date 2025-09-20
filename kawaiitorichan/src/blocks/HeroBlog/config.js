"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeroBlog = void 0;
exports.HeroBlog = {
    slug: 'heroBlog',
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
            localized: true,
            admin: {
                description: 'Main hero title (e.g., "あなたの情報源")',
            },
        },
        {
            name: 'subtitle',
            type: 'textarea',
            required: true,
            localized: true,
            admin: {
                description: 'Hero subtitle/description',
            },
        },
        {
            name: 'ctaText',
            type: 'text',
            required: false,
            localized: true,
            admin: {
                description: 'Call-to-action button text (optional)',
            },
        },
        {
            name: 'ctaLink',
            type: 'text',
            required: false,
            admin: {
                description: 'Call-to-action button link (optional)',
            },
        },
        {
            name: 'heroImage',
            type: 'upload',
            relationTo: 'media',
            required: false,
            admin: {
                description: 'Hero background/feature image (optional)',
            },
        },
        {
            name: 'gradientStyle',
            type: 'select',
            defaultValue: 'pinkPurple',
            options: [
                { label: 'Pink to Purple (Default)', value: 'pinkPurple' },
                { label: 'Mint to Blue', value: 'mintBlue' },
                { label: 'Yellow to Orange', value: 'yellowOrange' },
                { label: 'Lavender to Pink', value: 'lavenderPink' },
            ],
            required: true,
            admin: {
                description: 'Choose gradient background style',
            },
        },
        {
            name: 'layout',
            type: 'select',
            defaultValue: 'center',
            options: [
                { label: 'Centered', value: 'center' },
                { label: 'Left Aligned', value: 'left' },
                { label: 'Right Aligned', value: 'right' },
            ],
            required: true,
            admin: {
                description: 'Text alignment and layout style',
            },
        },
    ],
    interfaceName: 'HeroBlogBlock',
};
