import BlockToolbar from './BlockToolbar'
import ExplanationBlock from './blocks/ExplanationBlock'
import FormulaBlock from './blocks/FormulaBlock'
import GraphBlock from './blocks/GraphBlock'
import SolverBlock from './blocks/SolverBlock'
import TextBlock from './blocks/TextBlock'
import type { Block, NotebookViewMode } from '../types'

type BlockRendererProps = {
  block: Block
  index: number
  mode: NotebookViewMode
  totalBlocks: number
  onCreateExplanationFromFormula: (id: string) => void
  onCreateGraphFromFormula: (id: string) => void
  onDeleteBlock: (id: string) => void
  onDuplicateBlock: (id: string) => void
  onMoveBlock: (id: string, direction: 'up' | 'down') => void
  onUpdateBlock: (id: string, content: string) => void
}

export default function BlockRenderer({
  block,
  index,
  mode,
  totalBlocks,
  onCreateExplanationFromFormula,
  onCreateGraphFromFormula,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveBlock,
  onUpdateBlock,
}: BlockRendererProps) {
  const commonProps = {
    content: block.content,
    mode,
    onChange: (content: string) => onUpdateBlock(block.id, content),
  }

  if (mode === 'preview' && !block.content.trim()) {
    return null
  }

  const blockContent = (
    <>
      {block.type === 'text' && <TextBlock {...commonProps} />}
      {block.type === 'formula' && (
        <FormulaBlock
          {...commonProps}
          onDelete={() => onDeleteBlock(block.id)}
          onDuplicate={() => onDuplicateBlock(block.id)}
          onExplain={() => onCreateExplanationFromFormula(block.id)}
          onGraph={() => onCreateGraphFromFormula(block.id)}
        />
      )}
      {block.type === 'graph' && <GraphBlock {...commonProps} />}
      {block.type === 'solver' && <SolverBlock {...commonProps} />}
      {block.type === 'explanation' && <ExplanationBlock {...commonProps} />}
    </>
  )

  if (mode === 'preview') {
    return <section>{blockContent}</section>
  }

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <BlockToolbar
        block={block}
        blockNumber={index + 1}
        canMoveDown={index < totalBlocks - 1}
        canMoveUp={index > 0}
        mode={mode}
        onDelete={() => onDeleteBlock(block.id)}
        onDuplicate={() => onDuplicateBlock(block.id)}
        onMoveDown={() => onMoveBlock(block.id, 'down')}
        onMoveUp={() => onMoveBlock(block.id, 'up')}
      />

      <div className="p-4">
        {blockContent}
      </div>
    </article>
  )
}
