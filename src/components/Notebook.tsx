import AddBlockMenu from './AddBlockMenu'
import BlockRenderer from './BlockRenderer'
import type { Block, BlockType, NotebookViewMode } from '../types'

type NotebookProps = {
  blocks: Block[]
  mode: NotebookViewMode
  onAddBlock: (type: BlockType) => void
  onCreateExplanationFromFormula: (id: string) => void
  onCreateGraphFromFormula: (id: string) => void
  onDeleteBlock: (id: string) => void
  onDuplicateBlock: (id: string) => void
  onLoadSampleNotebook: () => void
  onMoveBlock: (id: string, direction: 'up' | 'down') => void
  onUpdateBlock: (id: string, content: string) => void
}

export default function Notebook({
  blocks,
  mode,
  onAddBlock,
  onCreateExplanationFromFormula,
  onCreateGraphFromFormula,
  onDeleteBlock,
  onDuplicateBlock,
  onLoadSampleNotebook,
  onMoveBlock,
  onUpdateBlock,
}: NotebookProps) {
  const isEditing = mode === 'edit'

  return (
    <section className="flex flex-col gap-4" aria-label="Notebook">
      {isEditing && <AddBlockMenu onAddBlock={onAddBlock} />}

      {blocks.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-teal-50 text-2xl font-semibold text-teal-700">
            ∑
          </div>
          <p className="mt-5 text-xl font-semibold text-slate-950">
            Start a math notebook
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            {isEditing
              ? 'Build from a sample, or add your first block and start exploring.'
              : 'This notebook is empty. Switch to edit mode to add blocks.'}
          </p>
          {isEditing && (
            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onLoadSampleNotebook}
                className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
              >
                Load sample into current notebook
              </button>
              <button
                type="button"
                onClick={() => onAddBlock('text')}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Add text block
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          className={
            isEditing
              ? 'flex flex-col gap-4'
              : 'rounded-lg bg-white px-5 py-6 shadow-sm ring-1 ring-slate-200 sm:px-8 sm:py-8'
          }
        >
          <div
            className={
              isEditing ? 'flex flex-col gap-4' : 'mx-auto max-w-3xl space-y-8'
            }
          >
            {blocks.map((block, index) => (
              <BlockRenderer
                key={block.id}
                block={block}
                index={index}
                mode={mode}
                totalBlocks={blocks.length}
                onCreateExplanationFromFormula={onCreateExplanationFromFormula}
                onCreateGraphFromFormula={onCreateGraphFromFormula}
                onDeleteBlock={onDeleteBlock}
                onDuplicateBlock={onDuplicateBlock}
                onMoveBlock={onMoveBlock}
                onUpdateBlock={onUpdateBlock}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
