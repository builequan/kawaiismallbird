"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pages = void 0;
const authenticated_1 = require("../../access/authenticated");
const authenticatedOrPublished_1 = require("../../access/authenticatedOrPublished");
const config_1 = require("../../blocks/ArchiveBlock/config");
const config_2 = require("../../blocks/CallToAction/config");
const config_3 = require("../../blocks/Content/config");
const config_4 = require("../../blocks/Form/config");
const config_5 = require("../../blocks/HeroBlog/config");
const config_6 = require("../../blocks/HomepageLayout/config");
const config_7 = require("../../blocks/MediaBlock/config");
const config_8 = require("../../blocks/MermaidDiagram/config");
const config_9 = require("@/heros/config");
const slug_1 = require("@/fields/slug");
const populatePublishedAt_1 = require("../../hooks/populatePublishedAt");
const generatePreviewPath_1 = require("../../utilities/generatePreviewPath");
const revalidatePage_1 = require("./hooks/revalidatePage");
const fields_1 = require("@payloadcms/plugin-seo/fields");
exports.Pages = {
    slug: 'pages',
    access: {
        create: authenticated_1.authenticated,
        delete: authenticated_1.authenticated,
        read: authenticatedOrPublished_1.authenticatedOrPublished,
        update: authenticated_1.authenticated,
    },
    // This config controls what's populated by default when a page is referenced
    // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
    // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'pages'>
    defaultPopulate: {
        title: true,
        slug: true,
    },
    admin: {
        defaultColumns: ['title', 'slug', 'updatedAt'],
        livePreview: {
            url: ({ data, req }) => {
                const path = (0, generatePreviewPath_1.generatePreviewPath)({
                    slug: typeof data?.slug === 'string' ? data.slug : '',
                    collection: 'pages',
                    req,
                });
                return path;
            },
        },
        preview: (data, { req }) => (0, generatePreviewPath_1.generatePreviewPath)({
            slug: typeof data?.slug === 'string' ? data.slug : '',
            collection: 'pages',
            req,
        }),
        useAsTitle: 'title',
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
        },
        {
            type: 'tabs',
            tabs: [
                {
                    fields: [config_9.hero],
                    label: 'Hero',
                },
                {
                    fields: [
                        {
                            name: 'layout',
                            type: 'blocks',
                            blocks: [config_5.HeroBlog, config_6.HomepageLayout, config_2.CallToAction, config_3.Content, config_7.MediaBlock, config_1.Archive, config_4.FormBlock, config_8.MermaidDiagram],
                            required: true,
                            admin: {
                                initCollapsed: true,
                            },
                        },
                    ],
                    label: 'Content',
                },
                {
                    name: 'meta',
                    label: 'SEO',
                    fields: [
                        (0, fields_1.OverviewField)({
                            titlePath: 'meta.title',
                            descriptionPath: 'meta.description',
                            imagePath: 'meta.image',
                        }),
                        (0, fields_1.MetaTitleField)({
                            hasGenerateFn: true,
                        }),
                        (0, fields_1.MetaImageField)({
                            relationTo: 'media',
                        }),
                        (0, fields_1.MetaDescriptionField)({}),
                        (0, fields_1.PreviewField)({
                            // if the `generateUrl` function is configured
                            hasGenerateFn: true,
                            // field paths to match the target field for data
                            titlePath: 'meta.title',
                            descriptionPath: 'meta.description',
                        }),
                    ],
                },
            ],
        },
        {
            name: 'publishedAt',
            type: 'date',
            admin: {
                position: 'sidebar',
            },
        },
        ...(0, slug_1.slugField)(),
    ],
    hooks: {
        afterChange: [revalidatePage_1.revalidatePage],
        beforeChange: [populatePublishedAt_1.populatePublishedAt],
        afterDelete: [revalidatePage_1.revalidateDelete],
    },
    versions: {
        drafts: {
            autosave: {
                interval: 100, // We set this interval for optimal live preview
            },
            schedulePublish: true,
        },
        maxPerDoc: 50,
    },
};
