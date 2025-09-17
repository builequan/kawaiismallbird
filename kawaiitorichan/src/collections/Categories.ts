import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { slugField } from '@/fields/slug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'parent', 'slug'],
    listSearchableFields: ['title', 'slug'],
    group: 'Content',
  },
  labels: {
    singular: 'Category',
    plural: 'Categories',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        description: 'Select a parent category to create a hierarchy',
        allowCreate: true, // Allow creating new parent categories inline
      },
      filterOptions: ({ id }) => {
        // Prevent selecting itself as parent
        if (id) {
          return {
            id: {
              not_equals: id,
            },
          }
        }
        return true
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Optional description for this category',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Sort order for displaying categories',
      },
    },
    ...slugField(),
  ],
}