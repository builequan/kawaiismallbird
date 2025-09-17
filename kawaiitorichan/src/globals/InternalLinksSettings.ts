import { GlobalConfig } from 'payload'

export const InternalLinksSettings: GlobalConfig = {
  slug: 'internal-links-settings',
  label: 'Internal Links Settings',
  typescript: {
    interface: 'InternalLinksSettings',
  },
  graphQL: {
    name: 'InternalLinksSettings',
  },
  access: {
    read: () => true,
    update: () => true,
  },
  admin: {
    components: {
      beforeFields: ['@/components/admin/InternalLinksSettingsHeader'],
    },
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General Settings',
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              label: 'Enable Internal Links',
              defaultValue: true,
              admin: {
                description: 'Enable or disable the internal links system globally',
              },
            },
            {
              name: 'maxLinksPerPost',
              type: 'number',
              label: 'Maximum Links per Post',
              defaultValue: 5,
              min: 1,
              max: 20,
              admin: {
                description: 'Maximum number of internal links to add per post',
              },
            },
            {
              name: 'minimumSimilarityScore',
              type: 'number',
              label: 'Minimum Similarity Score',
              defaultValue: 0.7,
              min: 0.1,
              max: 1.0,
              admin: {
                description: 'Minimum cosine similarity score for link matching (0-1)',
              },
            },
          ],
        },
        {
          label: 'Automation',
          fields: [
            {
              name: 'autoProcessNewPosts',
              type: 'checkbox',
              label: 'Auto-process New Posts',
              defaultValue: false,
              admin: {
                description: 'Automatically add internal links to new posts on publish',
              },
            },
            {
              name: 'autoRebuildSchedule',
              type: 'select',
              label: 'Auto-rebuild Schedule',
              defaultValue: 'manual',
              options: [
                { label: 'Manual Only', value: 'manual' },
                { label: 'Daily', value: 'daily' },
                { label: 'Weekly', value: 'weekly' },
                { label: 'Monthly', value: 'monthly' },
              ],
              admin: {
                description: 'Schedule for automatic index rebuilding',
              },
            },
            {
              name: 'lastRebuildDate',
              type: 'date',
              label: 'Last Rebuild Date',
              admin: {
                readOnly: true,
                description: 'Last time the index was rebuilt',
              },
            },
          ],
        },
        {
          label: 'Exclusions',
          fields: [
            {
              name: 'excludedCategories',
              type: 'relationship',
              label: 'Excluded Categories',
              relationTo: 'categories',
              hasMany: true,
              admin: {
                description: 'Posts in these categories will not receive internal links',
              },
            },
            {
              name: 'excludedPosts',
              type: 'relationship',
              label: 'Excluded Posts',
              relationTo: 'posts',
              hasMany: true,
              admin: {
                description: 'Specific posts to exclude from internal linking',
              },
            },
            {
              name: 'ignoredTerms',
              type: 'array',
              label: 'Ignored Terms',
              fields: [
                {
                  name: 'term',
                  type: 'text',
                  label: 'Term',
                  required: true,
                },
              ],
              admin: {
                description: 'Terms that should not be linked (e.g., common words)',
              },
            },
          ],
        },
        {
          label: 'Statistics',
          fields: [
            {
              name: 'totalPostsProcessed',
              type: 'number',
              label: 'Total Posts Processed',
              admin: {
                readOnly: true,
              },
            },
            {
              name: 'totalLinksCreated',
              type: 'number',
              label: 'Total Links Created',
              admin: {
                readOnly: true,
              },
            },
            {
              name: 'averageLinksPerPost',
              type: 'number',
              label: 'Average Links per Post',
              admin: {
                readOnly: true,
              },
            },
          ],
        },
      ],
    },
  ],
}