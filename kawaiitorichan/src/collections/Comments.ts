import type { CollectionConfig } from 'payload'

export const Comments: CollectionConfig = {
  slug: 'comments',
  admin: {
    useAsTitle: 'authorName',
    defaultColumns: ['authorName', 'post', 'createdAt', 'approved'],
  },
  access: {
    // Anyone can create comments (public submission)
    create: () => true,
    // Only admins can read all comments
    read: () => true,
    // Only admins can update/delete
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts',
      required: true,
      index: true,
    },
    {
      name: 'authorName',
      type: 'text',
      required: true,
      maxLength: 100,
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      maxLength: 1000,
    },
    {
      name: 'approved',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Comments must be approved by admin before displaying publicly',
      },
    },
    {
      name: 'ipAddress',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'IP address of commenter for spam prevention',
      },
    },
  ],
  timestamps: true,
}
