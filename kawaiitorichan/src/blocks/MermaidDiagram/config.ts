import type { Block } from 'payload'

export const MermaidDiagram: Block = {
  slug: 'mermaidDiagram',
  interfaceName: 'MermaidDiagramBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Optional title for the diagram',
      },
    },
    {
      name: 'diagramCode',
      type: 'code',
      label: 'Mermaid Diagram Code',
      required: true,
      admin: {
        language: 'mermaid',
        description: 'Enter your Mermaid diagram code here',
      },
    },
    {
      name: 'caption',
      type: 'text',
      admin: {
        description: 'Optional caption for the diagram',
      },
    },
  ],
}