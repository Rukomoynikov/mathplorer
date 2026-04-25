import AddBlockMenu from './AddBlockMenu'
import BlockRenderer from './BlockRenderer'
import type { Block, BlockType } from '../types'

type NotebookProps = {
  blocks: Block[]
  onAddBlock: (type: BlockType) => void
  onDeleteBlock: (id: string) => void
  onDuplicateBlock: (id: string) => void
  onMoveBlock: (id: string, direction: 'up' | 'down') => void
  onUpdateBlock: (id: string, content: string) => void
}

export default function Notebook({
  blocks,
  onAddBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveBlock,
  onUpdateBlock,
}: NotebookProps) {
  return (
    <section className="flex flex-col gap-4" aria-label="Notebook">
      <AddBlockMenu onAddBlock={onAddBlock} />

      {blocks.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">
            Your notebook is empty.
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Add a text, formula, graph, solver, or explanation block to start
            exploring a concept. Everything saves automatically in this browser.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {blocks.map((block, index) => (
            <BlockRenderer
              key={block.id}
              block={block}
              index={index}
              totalBlocks={blocks.length}
              onDeleteBlock={onDeleteBlock}
              onDuplicateBlock={onDuplicateBlock}
              onMoveBlock={onMoveBlock}
              onUpdateBlock={onUpdateBlock}
            />
          ))}
        </div>
      )}
    </section>
  )
}
