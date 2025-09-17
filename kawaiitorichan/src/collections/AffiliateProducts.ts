import type { CollectionConfig } from 'payload'

export const AffiliateProducts: CollectionConfig = {
  slug: 'affiliate-products',
  admin: {
    useAsTitle: 'product_name',
    defaultColumns: ['product_name', 'language', 'status', 'usageCount', 'updatedAt'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'product_name',
      type: 'text',
      required: true,
      admin: {
        description: 'The name of the affiliate product',
      },
    },
    {
      name: 'price',
      type: 'text',
      admin: {
        description: 'Product price (with currency symbol)',
      },
    },
    {
      name: 'category',
      type: 'text',
      admin: {
        description: 'Product category',
      },
    },
    {
      name: 'keyword_research',
      type: 'text',
      required: true,
      admin: {
        description: 'Primary keyword for matching',
      },
    },
    {
      name: 'keywords',
      type: 'array',
      admin: {
        description: 'Additional keywords for matching',
      },
      fields: [
        {
          name: 'keyword',
          type: 'text',
        },
      ],
    },
    {
      name: 'affiliate_url',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Full affiliate HTML code or URL',
      },
    },
    {
      name: 'clean_url',
      type: 'text',
      admin: {
        description: 'Clean affiliate URL extracted from HTML',
      },
    },
    {
      name: 'product_url',
      type: 'text',
      admin: {
        description: 'Direct product URL',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Product description for context matching',
      },
    },
    {
      name: 'language',
      type: 'select',
      defaultValue: 'ja',
      options: [
        { label: 'Japanese', value: 'ja' },
        { label: 'English', value: 'en' },
        { label: 'Both', value: 'both' },
      ],
      admin: {
        description: 'Language of the product',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Discontinued', value: 'discontinued' },
      ],
      admin: {
        description: 'Product availability status',
      },
    },
    {
      name: 'embedding',
      type: 'json',
      admin: {
        hidden: true,
        description: 'Vector embedding for semantic matching',
      },
    },
    {
      name: 'metadata',
      type: 'group',
      admin: {
        description: 'Import and tracking metadata',
      },
      fields: [
        {
          name: 'original_id',
          type: 'number',
          admin: {
            description: 'Original ID from import source',
          },
        },
        {
          name: 'source',
          type: 'text',
          admin: {
            description: 'Import source (e.g., A8.net)',
          },
        },
        {
          name: 'commission_rate',
          type: 'text',
          admin: {
            description: 'Commission rate if available',
          },
        },
        {
          name: 'shop_name',
          type: 'text',
          admin: {
            description: 'Shop or merchant name',
          },
        },
        {
          name: 'importedAt',
          type: 'date',
          admin: {
            description: 'When the product was first imported',
          },
        },
        {
          name: 'lastModified',
          type: 'date',
          admin: {
            description: 'Last modification date from source',
          },
        },
        {
          name: 'contentHash',
          type: 'text',
          admin: {
            hidden: true,
            description: 'Hash of product data for change detection',
          },
        },
      ],
    },
    {
      name: 'performance',
      type: 'group',
      admin: {
        description: 'Performance tracking',
      },
      fields: [
        {
          name: 'usageCount',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Number of times linked in posts',
          },
        },
        {
          name: 'clickCount',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Number of clicks (if trackable)',
          },
        },
        {
          name: 'performanceScore',
          type: 'number',
          defaultValue: 0,
          min: 0,
          max: 100,
          admin: {
            description: 'Calculated performance score',
          },
        },
      ],
    },
    {
      name: 'anchorPhrases',
      type: 'array',
      admin: {
        description: 'Extracted anchor phrases for natural linking',
      },
      fields: [
        {
          name: 'phrase',
          type: 'text',
        },
      ],
    },
  ],
  timestamps: true,
}

export default AffiliateProducts