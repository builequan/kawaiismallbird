import React from 'react'
import { MermaidDiagram } from './Component.client'

export type MermaidDiagramBlockProps = {
  diagramCode: string
  title?: string
  caption?: string
  blockType: 'mermaidDiagram'
}

type Props = MermaidDiagramBlockProps & {
  className?: string
}

export const MermaidDiagramBlock: React.FC<Props> = ({ 
  className, 
  diagramCode, 
  title, 
  caption 
}) => {
  return (
    <div className={[className, 'not-prose'].filter(Boolean).join(' ')}>
      <MermaidDiagram 
        diagramCode={diagramCode} 
        title={title} 
        caption={caption} 
      />
    </div>
  )
}