import type { Block } from 'payload'

export const Code: Block = {
  slug: 'code',
  interfaceName: 'CodeBlock',
  fields: [
    {
      name: 'language',
      type: 'select',
      defaultValue: 'typescript',
      options: [
        {
          label: 'Typescript',
          value: 'typescript',
        },
        {
          label: 'Javascript',
          value: 'javascript',
        },
        {
          label: 'CSS',
          value: 'css',
        },
        {
          label: 'Mermaid',
          value: 'mermaid',
        },
        {
          label: 'Plain Text',
          value: 'plaintext',
        },
        {
          label: 'JSON',
          value: 'json',
        },
        {
          label: 'HTML',
          value: 'html',
        },
        {
          label: 'Python',
          value: 'python',
        },
        {
          label: 'Shell',
          value: 'bash',
        },
      ],
    },
    {
      name: 'code',
      type: 'code',
      label: false,
      required: true,
    },
  ],
}
