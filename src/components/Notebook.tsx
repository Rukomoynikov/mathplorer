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
    <section className="flex flex-col gap-5" aria-label="Notebook">
      {isEditing && <AddBlockMenu onAddBlock={onAddBlock} />}

      {blocks.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 px-6 py-14 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-20px_rgba(15,23,42,0.18)] backdrop-blur">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-16 h-40 bg-gradient-to-b from-teal-100/50 via-cyan-50/30 to-transparent blur-2xl"
          />
          <div className="relative">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-700 text-2xl font-semibold text-white shadow-md ring-1 ring-teal-700/30">
              ∑
            </div>
            <p className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
              {isEditing ? 'Start a math notebook' : 'This notebook is empty'}
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              {isEditing
                ? 'Build from a sample, or add your first block and start exploring.'
                : 'Switch to edit mode to add blocks.'}
            </p>
            {isEditing && (
              <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={onLoadSampleNotebook}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-teal-600 to-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-teal-700 hover:to-cyan-800"
                >
                  <Sparkles size={16} aria-hidden="true" />
                  Load sample
                </button>
                <button
                  type="button"
                  onClick={() => onAddBlock('text')}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
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
              ? 'flex flex-col gap-4'
              : 'rounded-2xl border border-slate-200/70 bg-white px-6 py-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-20px_rgba(15,23,42,0.16)] sm:px-10 sm:py-10'
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
