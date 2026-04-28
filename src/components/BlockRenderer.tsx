import BlockToolbar from './BlockToolbar'
import { BLOCK_META } from './blockMeta'
import ExplanationBlock from './blocks/ExplanationBlock'
import FormulaBlock from './blocks/FormulaBlock'
import GeometryBlock from './blocks/GeometryBlock'
import GraphBlock from './blocks/GraphBlock'
import CombinatoricsBlock from './blocks/CombinatoricsBlock'
import ProbabilityBlock from './blocks/ProbabilityBlock'
import SetBlock from './blocks/SetBlock'
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
  onMoveBlock: (id: string, direction: 'up' | 'down') => void
  onSimplifyFormula: (id: string) => void
  onSubstituteFormula: (id: string, substitution: string) => void
  onTangentLineFormula: (id: string, variable: string, point: string) => void
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
  onDifferentiateFormula,
  onEvaluateDerivativeFormula,
  onDuplicateBlock,
  onExpandFormula,
  onIntegrateDefiniteFormula,
  onMoveBlock,
  onSimplifyFormula,
  onSubstituteFormula,
  onTangentLineFormula,
  onUpdateBlock,
}: BlockRendererProps) {
  const commonProps = {
    content: block.content,
    mode,
    onChange: (content: string) => onUpdateBlock(block.id, content),
  }
  const meta = BLOCK_META[block.type]

  if (mode === 'preview' && !block.content.trim()) {
    return null
  }

  const blockContent = (
    <>
      {block.type === 'text' && <TextBlock {...commonProps} />}
      {block.type === 'formula' && (
        <FormulaBlock
          {...commonProps}
          onDifferentiate={(variable) =>
            onDifferentiateFormula(block.id, variable)
          }
          onEvaluateDerivative={(variable, point) =>
            onEvaluateDerivativeFormula(block.id, variable, point)
          }
          onExplain={() => onCreateExplanationFromFormula(block.id)}
          onExpand={() => onExpandFormula(block.id)}
          onGraph={() => onCreateGraphFromFormula(block.id)}
          onIntegrateDefinite={(variable, lowerBound, upperBound) =>
            onIntegrateDefiniteFormula(
              block.id,
              variable,
              lowerBound,
              upperBound,
            )
          }
          onSimplify={() => onSimplifyFormula(block.id)}
          onSubstitute={(substitution) =>
            onSubstituteFormula(block.id, substitution)
          }
          onTangentLine={(variable, point) =>
            onTangentLineFormula(block.id, variable, point)
          }
        />
      )}
      {block.type === 'graph' && <GraphBlock {...commonProps} />}
      {block.type === 'geometry' && <GeometryBlock {...commonProps} />}
      {block.type === 'solver' && <SolverBlock {...commonProps} />}
      {block.type === 'explanation' && <ExplanationBlock {...commonProps} />}
      {block.type === 'set' && <SetBlock {...commonProps} />}
      {block.type === 'combinatorics' && (
        <CombinatoricsBlock {...commonProps} />
      )}
      {block.type === 'probability' && <ProbabilityBlock {...commonProps} />}
    </>
  )

  if (mode === 'preview') {
    return <section className="min-w-0">{blockContent}</section>
  }

  return (
    <article className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 left-0 w-1 ${meta.accentBar}`}
      />
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

      <div className="min-w-0 p-4 sm:p-5">{blockContent}</div>
    </article>
  )
}
