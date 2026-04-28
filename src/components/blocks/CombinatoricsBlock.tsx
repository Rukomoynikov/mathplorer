import { Combine, Hash, Shuffle, type LucideIcon } from 'lucide-react'
import { useMemo } from 'react'
import BlockEditorShell from './BlockEditorShell'
import type { NotebookViewMode } from '../../types'
import {
  calculateCombinatorics,
  formatBigInt,
  getCombinatoricsModeLabel,
  parseCombinatoricsBlockContent,
  serializeCombinatoricsBlockContent,
  type CombinatoricsBlockContent,
  type CombinatoricsMode,
} from '../../lib/combinatorics'

type CombinatoricsBlockProps = {
  content: string
  mode: NotebookViewMode
  onChange: (content: string) => void
}

type ModeOption = {
  icon: LucideIcon
  mode: CombinatoricsMode
  shortLabel: string
}

const MODE_OPTIONS: ModeOption[] = [
  { icon: Hash, mode: 'factorial', shortLabel: 'n!' },
  { icon: Shuffle, mode: 'permutation', shortLabel: 'P(n,r)' },
  { icon: Combine, mode: 'combination', shortLabel: 'C(n,r)' },
]

function CombinatoricsPreview({
  content,
  mode,
}: {
  content: CombinatoricsBlockContent
  mode: NotebookViewMode
}) {
  const result = useMemo(() => calculateCombinatorics(content), [content])

  return (
    <div className="space-y-4">
      {mode === 'edit' && (
        <p className="text-[11px] font-semibold uppercase text-slate-500">
          Count preview
        </p>
      )}

      {!result.ok ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-950">
            Cannot count yet
          </p>
          <p className="mt-1 text-sm leading-6 text-amber-900">
            {result.message}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-fuchsia-100 bg-fuchsia-50/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase text-fuchsia-700">
                {getCombinatoricsModeLabel(result.mode)}
              </p>
              <p className="mt-1 font-mono text-sm text-slate-700">
                {result.formula}
              </p>
            </div>
            <div className="rounded-lg bg-white px-3 py-2 text-right shadow-sm ring-1 ring-fuchsia-100">
              <p className="text-[11px] font-semibold uppercase text-slate-500">
                {result.resultLabel}
              </p>
              <p className="mt-1 max-w-full overflow-x-auto font-mono text-xl font-semibold text-slate-950">
                {formatBigInt(result.result)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            {result.interpretation}
          </p>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
          <p className="text-xs font-semibold text-slate-800">
            Arranging
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Permutations count ordered outcomes.
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
          <p className="text-xs font-semibold text-slate-800">Choosing</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Combinations count groups where order is ignored.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CombinatoricsBlock({
  content,
  mode,
  onChange,
}: CombinatoricsBlockProps) {
  const parsedContent = parseCombinatoricsBlockContent(content)
  const needsR = parsedContent.mode !== 'factorial'

  function handleContentChange(nextContent: Partial<CombinatoricsBlockContent>) {
    onChange(
      serializeCombinatoricsBlockContent({
        ...parsedContent,
        ...nextContent,
      }),
    )
  }

  return (
    <BlockEditorShell
      label="Counting setup"
      helperText="Use whole numbers. This MVP supports n values up to 100."
      mode={mode}
      output={<CombinatoricsPreview content={parsedContent} mode={mode} />}
    >
      <div className="space-y-4">
        <div
          aria-label="Combinatorics mode"
          className="grid gap-2 sm:grid-cols-3"
          role="group"
        >
          {MODE_OPTIONS.map(({ icon: Icon, mode: optionMode, shortLabel }) => {
            const isSelected = parsedContent.mode === optionMode

            return (
              <button
                key={optionMode}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleContentChange({ mode: optionMode })}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  isSelected
                    ? 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800 ring-2 ring-fuchsia-100'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Icon size={15} aria-hidden="true" />
                {shortLabel}
              </button>
            )
          })}
        </div>

        <div className={needsR ? 'grid gap-3 sm:grid-cols-2' : 'grid gap-3'}>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase text-slate-500">
              n
            </span>
            <input
              value={parsedContent.n}
              onChange={(event) => handleContentChange({ n: event.target.value })}
              inputMode="numeric"
              placeholder="5"
              className="mnl-field font-mono focus:border-fuchsia-400 focus:ring-fuchsia-100"
            />
          </label>

          {needsR && (
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase text-slate-500">
                r
              </span>
              <input
                value={parsedContent.r}
                onChange={(event) =>
                  handleContentChange({ r: event.target.value })
                }
                inputMode="numeric"
                placeholder="2"
                className="mnl-field font-mono focus:border-fuchsia-400 focus:ring-fuchsia-100"
              />
            </label>
          )}
        </div>
      </div>
    </BlockEditorShell>
  )
}
