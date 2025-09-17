import { Block } from 'payload'

export const ProductRecommendation: Block = {
  slug: 'productRecommendation',
  interfaceName: 'ProductRecommendationBlock',
  labels: {
    singular: 'Product Recommendation',
    plural: 'Product Recommendations',
  },
  fields: [
    {
      name: 'productName',
      type: 'text',
      required: true,
      label: 'Product Name',
    },
    {
      name: 'price',
      type: 'text',
      required: true,
      label: 'Price',
    },
    {
      name: 'originalPrice',
      type: 'text',
      label: 'Original Price (optional)',
    },
    {
      name: 'discount',
      type: 'text',
      label: 'Discount Text (optional)',
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      label: 'Affiliate URL',
    },
    {
      name: 'badge',
      type: 'text',
      label: 'Badge Text',
      defaultValue: '人気 #1',
    },
  ],
}