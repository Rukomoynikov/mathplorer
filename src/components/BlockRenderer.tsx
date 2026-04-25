import BlockToolbar from './BlockToolbar'
import ExplanationBlock from './blocks/ExplanationBlock'
import FormulaBlock from './blocks/FormulaBlock'
import GraphBlock from './blocks/GraphBlock'
import SolverBlock from './blocks/SolverBlock'
import TextBlock from './blocks/TextBlock'
import type { Block } from '../types'

type BlockRendererProps = {
  block: Block
  index: number
  totalBlocks: number
  onDeleteBlock: (id: string) => void
  onDuplicateBlock: (id: string) => void
  onMoveBlock: (id: string, direction: 'up' | 'down') => void
  onUpdateBlock: (id: string, content: string) => void
}

export default function BlockRenderer({
  block,
  index,
  totalBlocks,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveBlock,
  onUpdateBlock,
}: BlockRendererProps) {
  const commonProps = {
    content: block.content,
    onChange: (content: string) => onUpdateBlock(block.id, content),
  }

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <BlockToolbar
        block={block}
        blockNumber={index + 1}
        canMoveDown={index < totalBlocks - 1}
        canMoveUp={index > 0}
        onDelete={() => onDeleteBlock(block.id)}
        onDuplicate={() => onDuplicateBlock(block.id)}
        onMoveDown={() => onMoveBlock(block.id, 'down')}
        onMoveUp={() => onMoveBlock(block.id, 'up')}
      />

      <div className="p-4">
        {block.type === 'text' && <TextBlock {...commonProps} />}
        {block.type === 'formula' && <FormulaBlock {...commonProps} />}
        {block.type === 'graph' && <GraphBlock {...commonProps} />}
        {block.type === 'solver' && <SolverBlock {...commonProps} />}
        {block.type === 'explanation' && <ExplanationBlock {...commonProps} />}
      </div>
    </article>
  )
}
