import { Plus, Sparkles } from 'lucide-react'
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
  onDifferentiateFormula: (id: string, variable: string) => void
  onEvaluateDerivativeFormula: (id: string, variable: string, point: string) => void
  onDuplicateBlock: (id: string) => void
  onExpandFormula: (id: string) => void
  onIntegrateDefiniteFormula: (
    id: string,
    variable: string,
    lowerBound: string,
    upperBound: string,
  ) => void
  onLoadSampleNotebook: () => void
  onMoveBlock: (id: string, direction: 'up' | 'down') => void
  onSimplifyFormula: (id: string) => void
  onSubstituteFormula: (id: string, substitution: string) => void
  onTangentLineFormula: (id: string, variable: string, point: string) => void
  onUpdateBlock: (id: string, content: string) => void
}

export default function Notebook({
  blocks,
  mode,
  onAddBlock,
  onCreateExplanationFromFormula,
  onCreateGraphFromFormula,
  onDeleteBlock,
  onDifferentiateFormula,
  onEvaluateDerivativeFormula,
  onDuplicateBlock,
  onExpandFormula,
  onIntegrateDefiniteFormula,
  onLoadSampleNotebook,
  onMoveBlock,
  onSimplifyFormula,
  onSubstituteFormula,
  onTangentLineFormula,
  onUpdateBlock,
}: NotebookProps) {
  const isEditing = mode === 'edit'

  return (
    <section className="flex flex-col gap-4" aria-label="Notebook">
      {isEditing && <AddBlockMenu onAddBlock={onAddBlock} />}

      {blocks.length === 0 ? (
        <div className="mnl-panel border-dashed px-6 py-12 text-center">
          <div className="mx-auto max-w-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-2xl font-semibold text-white shadow-sm">
              ∑
            </div>
            <p className="mt-5 text-xl font-semibold text-slate-950">
              {isEditing ? 'Start a math notebook' : 'This notebook is empty'}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {isEditing
                ? 'Build from a sample, or add your first block and start exploring.'
                : 'Switch to edit mode to add blocks.'}
            </p>
            {isEditing && (
              <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={onLoadSampleNotebook}
                  className="mnl-button-primary"
                >
                  <Sparkles size={16} aria-hidden="true" />
                  Load sample
                </button>
                <button
                  type="button"
                  onClick={() => onAddBlock('text')}
                  className="mnl-button-secondary"
                >
                  <Plus size={16} aria-hidden="true" />
                  Add text block
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className={
            isEditing
              ? 'flex flex-col gap-3'
              : 'rounded-lg border border-slate-200 bg-white px-5 py-7 shadow-sm sm:px-8 sm:py-8'
          }
        >
          <div
            className={
              isEditing ? 'flex flex-col gap-3' : 'mx-auto max-w-3xl space-y-7'
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
                onDifferentiateFormula={onDifferentiateFormula}
                onEvaluateDerivativeFormula={onEvaluateDerivativeFormula}
                onDuplicateBlock={onDuplicateBlock}
                onExpandFormula={onExpandFormula}
                onIntegrateDefiniteFormula={onIntegrateDefiniteFormula}
                onMoveBlock={onMoveBlock}
                onSimplifyFormula={onSimplifyFormula}
                onSubstituteFormula={onSubstituteFormula}
                onTangentLineFormula={onTangentLineFormula}
                onUpdateBlock={onUpdateBlock}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
