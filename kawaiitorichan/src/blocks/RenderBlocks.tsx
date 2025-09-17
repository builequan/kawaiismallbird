import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { HeroBlogBlock } from '@/blocks/HeroBlog/Component'
import { HomepageLayoutBlock } from '@/blocks/HomepageLayout/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { MermaidDiagramBlock } from '@/blocks/MermaidDiagram/Component'

const blockComponents = {
  archive: ArchiveBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  formBlock: FormBlock,
  heroBlog: HeroBlogBlock,
  homepageLayout: HomepageLayoutBlock,
  mediaBlock: MediaBlock,
  mermaidDiagram: MermaidDiagramBlock,
}

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            if (Block) {
              // Special blocks that handle their own spacing
              const noSpacingBlocks = ['heroBlog', 'homepageLayout']
              const shouldAddSpacing = !noSpacingBlocks.includes(blockType)

              return (
                <div className={shouldAddSpacing ? 'my-16' : ''} key={index}>
                  {/* @ts-expect-error there may be some mismatch between the expected types here */}
                  <Block {...block} disableInnerContainer />
                </div>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
