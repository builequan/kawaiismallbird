import type { Block } from 'payload'

export const AffiliateShowcase: Block = {
  slug: 'affiliateShowcase',
  interfaceName: 'AffiliateShowcaseBlock',
  fields: [
    {
      name: 'products',
      type: 'array',
      minRows: 1,
      maxRows: 5,
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'price',
          type: 'text',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}