"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Posts = void 0;
const richtext_lexical_1 = require("@payloadcms/richtext-lexical");
const authenticated_1 = require("../../access/authenticated");
const authenticatedOrPublished_1 = require("../../access/authenticatedOrPublished");
const config_1 = require("../../blocks/Banner/config");
const config_2 = require("../../blocks/Code/config");
const config_3 = require("../../blocks/MediaBlock/config");
const config_4 = require("../../blocks/MermaidDiagram/config");
const generatePreviewPath_1 = require("../../utilities/generatePreviewPath");
const populateAuthors_1 = require("./hooks/populateAuthors");
const revalidatePost_1 = require("./hooks/revalidatePost");
const fields_1 = require("@payloadcms/plugin-seo/fields");
const slug_1 = require("@/fields/slug");
exports.Posts = {
    slug: 'posts',
    access: {
        create: authenticated_1.authenticated,
        delete: authenticated_1.authenticated,
        read: authenticatedOrPublished_1.authenticatedOrPublished,
        update: authenticated_1.authenticated,
    },
    // This config controls what's populated by default when a post is referenced
    // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
    // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'posts'>
    defaultPopulate: {
        title: true,
        slug: true,
        heroImage: true,
        excerpt: true,
        categories: true,
        tags: true,
        publishedAt: true,
        meta: {
            image: true,
            description: true,
        },
    },
    admin: {
        defaultColumns: ['title', 'slug', 'updatedAt'],
        livePreview: {
            url: ({ data, req }) => {
                const path = (0, generatePreviewPath_1.generatePreviewPath)({
                    slug: typeof data?.slug === 'string' ? data.slug : '',
                    collection: 'posts',
                    req,
                });
                return path;
            },
        },
        preview: (data, { req }) => (0, generatePreviewPath_1.generatePreviewPath)({
            slug: typeof data?.slug === 'string' ? data.slug : '',
            collection: 'posts',
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
            name: 'excerpt',
            type: 'richText',
            admin: {
                description: 'Short description or summary of the post',
            },
        },
        {
            name: 'categories',
            type: 'relationship',
            admin: {
                description: 'Select categories for this post',
                allowCreate: true,
            },
            hasMany: true,
            relationTo: 'categories',
        },
        {
            name: 'tags',
            type: 'relationship',
            admin: {
                description: 'Select tags for this post',
            },
            hasMany: true,
            relationTo: 'tags',
        },
        {
            name: 'language',
            type: 'select',
            defaultValue: 'ja',
            options: [
                { label: 'Japanese', value: 'ja' },
                { label: 'English', value: 'en' },
            ],
            admin: {
                position: 'sidebar',
            },
        },
        {
            type: 'tabs',
            tabs: [
                {
                    fields: [
                        {
                            name: 'heroImage',
                            type: 'upload',
                            relationTo: 'media',
                        },
                        {
                            name: 'heroImageAlt',
                            type: 'text',
                            admin: {
                                description: 'Alternative text for the hero image',
                            },
                        },
                        {
                            name: 'content',
                            type: 'richText',
                            editor: (0, richtext_lexical_1.lexicalEditor)({
                                features: ({ rootFeatures }) => {
                                    return [
                                        ...rootFeatures,
                                        (0, richtext_lexical_1.HeadingFeature)({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                                        (0, richtext_lexical_1.BlocksFeature)({ blocks: [config_1.Banner, config_2.Code, config_3.MediaBlock, config_4.MermaidDiagram] }),
                                        (0, richtext_lexical_1.FixedToolbarFeature)(),
                                        (0, richtext_lexical_1.InlineToolbarFeature)(),
                                        (0, richtext_lexical_1.HorizontalRuleFeature)(),
                                    ];
                                },
                            }),
                            label: false,
                            required: true,
                        },
                    ],
                    label: 'Content',
                },
                {
                    fields: [
                        {
                            name: 'relatedPosts',
                            type: 'relationship',
                            admin: {
                                position: 'sidebar',
                            },
                            filterOptions: ({ id }) => {
                                return {
                                    id: {
                                        not_in: [id],
                                    },
                                };
                            },
                            hasMany: true,
                            relationTo: 'posts',
                        },
                    ],
                    label: 'Meta',
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
                        {
                            name: 'keywords',
                            type: 'text',
                            admin: {
                                description: 'Comma-separated keywords for SEO',
                            },
                        },
                        {
                            name: 'focusKeyphrase',
                            type: 'text',
                            admin: {
                                description: 'Main focus keyword or phrase for SEO',
                            },
                        },
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
            name: 'wordpressMetadata',
            type: 'group',
            admin: {
                position: 'sidebar',
                description: 'Metadata imported from WordPress',
            },
            fields: [
                {
                    name: 'originalAuthor',
                    type: 'text',
                },
                {
                    name: 'originalDate',
                    type: 'date',
                },
                {
                    name: 'modifiedDate',
                    type: 'date',
                },
                {
                    name: 'status',
                    type: 'select',
                    options: [
                        { label: 'Draft', value: 'draft' },
                        { label: 'Published', value: 'published' },
                    ],
                },
                {
                    name: 'enableComments',
                    type: 'checkbox',
                    defaultValue: true,
                },
                {
                    name: 'enableToc',
                    type: 'checkbox',
                    defaultValue: true,
                    label: 'Enable Table of Contents',
                },
            ],
        },
        {
            name: 'internalLinksMetadata',
            type: 'group',
            admin: {
                position: 'sidebar',
                description: 'Internal linking tracking data',
            },
            fields: [
                {
                    name: 'version',
                    type: 'text',
                    admin: {
                        readOnly: true,
                    },
                },
                {
                    name: 'lastProcessed',
                    type: 'date',
                    admin: {
                        readOnly: true,
                    },
                },
                {
                    name: 'linksAdded',
                    type: 'array',
                    admin: {
                        readOnly: true,
                    },
                    fields: [
                        {
                            name: 'targetSlug',
                            type: 'text',
                        },
                        {
                            name: 'anchorText',
                            type: 'text',
                        },
                        {
                            name: 'position',
                            type: 'text',
                        },
                    ],
                },
                {
                    name: 'contentHash',
                    type: 'text',
                    admin: {
                        readOnly: true,
                        description: 'Hash of content when links were last applied',
                    },
                },
            ],
        },
        {
            name: 'contentDbMeta',
            type: 'group',
            admin: {
                position: 'sidebar',
                description: 'Content database import tracking',
            },
            fields: [
                {
                    name: 'originalId',
                    type: 'text',
                    admin: {
                        readOnly: true,
                        description: 'Original content database article ID',
                    },
                },
                {
                    name: 'websiteId',
                    type: 'number',
                    admin: {
                        readOnly: true,
                    },
                },
                {
                    name: 'language',
                    type: 'text',
                    admin: {
                        readOnly: true,
                    },
                },
                {
                    name: 'importedAt',
                    type: 'date',
                    admin: {
                        readOnly: true,
                    },
                },
            ],
        },
        {
            name: 'affiliateLinksMetadata',
            type: 'group',
            admin: {
                position: 'sidebar',
                description: 'Affiliate linking tracking data',
            },
            fields: [
                {
                    name: 'version',
                    type: 'text',
                    admin: {
                        readOnly: true,
                    },
                },
                {
                    name: 'lastProcessed',
                    type: 'date',
                    admin: {
                        readOnly: true,
                    },
                },
                {
                    name: 'linksAdded',
                    type: 'array',
                    admin: {
                        readOnly: true,
                    },
                    fields: [
                        {
                            name: 'productId',
                            type: 'text',
                        },
                        {
                            name: 'productName',
                            type: 'text',
                        },
                        {
                            name: 'anchorText',
                            type: 'text',
                        },
                        {
                            name: 'position',
                            type: 'text',
                        },
                        {
                            name: 'type',
                            type: 'select',
                            options: [
                                { label: 'Inline', value: 'inline' },
                                { label: 'Recommendation', value: 'recommendation' },
                            ],
                        },
                    ],
                },
                {
                    name: 'contentHash',
                    type: 'text',
                    admin: {
                        readOnly: true,
                        description: 'Hash of content when affiliate links were last applied',
                    },
                },
                {
                    name: 'excludeFromAffiliates',
                    type: 'checkbox',
                    defaultValue: false,
                    admin: {
                        description: 'Manually exclude this post from affiliate linking',
                    },
                },
            ],
        },
        {
            name: 'publishedAt',
            type: 'date',
            admin: {
                date: {
                    pickerAppearance: 'dayAndTime',
                },
                position: 'sidebar',
            },
            hooks: {
                beforeChange: [
                    ({ siblingData, value }) => {
                        if (siblingData._status === 'published' && !value) {
                            return new Date();
                        }
                        return value;
                    },
                ],
            },
        },
        {
            name: 'authors',
            type: 'relationship',
            admin: {
                position: 'sidebar',
            },
            hasMany: true,
            relationTo: 'users',
        },
        // This field is only used to populate the user data via the `populateAuthors` hook
        // This is because the `user` collection has access control locked to protect user privacy
        // GraphQL will also not return mutated user data that differs from the underlying schema
        {
            name: 'populatedAuthors',
            type: 'array',
            access: {
                update: () => false,
            },
            admin: {
                disabled: true,
                readOnly: true,
            },
            fields: [
                {
                    name: 'id',
                    type: 'text',
                },
                {
                    name: 'name',
                    type: 'text',
                },
            ],
        },
        ...(0, slug_1.slugField)(),
    ],
    hooks: {
        afterChange: [revalidatePost_1.revalidatePost],
        afterRead: [populateAuthors_1.populateAuthors],
        afterDelete: [revalidatePost_1.revalidateDelete],
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
