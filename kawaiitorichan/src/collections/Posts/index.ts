import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { Banner } from '../../blocks/Banner/config'
import { Code } from '../../blocks/Code/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { MermaidDiagram } from '../../blocks/MermaidDiagram/config'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { populateAuthors } from './hooks/populateAuthors'
import { revalidateDelete, revalidatePost } from './hooks/revalidatePost'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { slugField } from '@/fields/slug'

export const Posts: CollectionConfig<'posts'> = {
  slug: 'posts',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
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
        const path = generatePreviewPath({
          slug: typeof data?.slug === 'string' ? data.slug : '',
          collection: 'posts',
          req,
        })

        return path
      },
    },
    preview: (data, { req }) =>
      generatePreviewPath({
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
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                    BlocksFeature({ blocks: [Banner, Code, MediaBlock, MermaidDiagram] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ]
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
                }
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
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
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
            PreviewField({
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
              return new Date()
            }
            return value
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
    ...slugField(),
  ],
  hooks: {
    afterChange: [revalidatePost],
    afterRead: [populateAuthors],
    afterDelete: [revalidateDelete],
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
}
