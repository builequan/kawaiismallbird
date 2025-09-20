"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MermaidDiagram = void 0;
exports.MermaidDiagram = {
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
};
