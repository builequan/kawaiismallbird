import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

export const Glossary: CollectionConfig = {
  slug: 'glossary',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'term',
    defaultColumns: ['term', 'reading', 'source', 'updatedAt'],
    listSearchableFields: ['term', 'reading', 'definition'],
    group: 'Content',
  },
  labels: {
    singular: 'Glossary Term',
    plural: 'Glossary',
  },
  fields: [
    {
      name: 'term',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'The Japanese term (e.g., 文鳥)',
      },
    },
    {
      name: 'reading',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Hiragana reading for sorting (e.g., ぶんちょう)',
      },
    },
    {
      name: 'definition',
      type: 'textarea',
      required: true,
      admin: {
        description: '2-3 sentence definition in Japanese',
      },
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'llm',
      options: [
        { label: 'Wikipedia', value: 'wikipedia' },
        { label: 'LLM Generated', value: 'llm' },
      ],
      admin: {
        description: 'Where the definition came from',
      },
    },
    {
      name: 'wikipediaUrl',
      type: 'text',
      admin: {
        description: 'Link to Japanese Wikipedia article (if source is Wikipedia)',
        condition: (data) => data?.source === 'wikipedia',
      },
    },
    {
      name: 'posts',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
      admin: {
        description: 'Posts that contain this term',
        readOnly: true,
      },
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Bird Species (鳥の種類)', value: 'bird-species' },
        { label: 'Bird Care (鳥の飼育)', value: 'bird-care' },
        { label: 'Bird Anatomy (鳥の体)', value: 'bird-anatomy' },
        { label: 'Bird Behavior (鳥の行動)', value: 'bird-behavior' },
        { label: 'Equipment (用品)', value: 'equipment' },
        { label: 'Food (餌・食べ物)', value: 'food' },
        { label: 'Health (健康)', value: 'health' },
        { label: 'General (一般)', value: 'general' },
      ],
      admin: {
        description: 'Category for grouping terms',
      },
    },
  ],
  timestamps: true,
}
