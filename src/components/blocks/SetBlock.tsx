import { useMemo } from 'react'
import BlockEditorShell from './BlockEditorShell'
import type { NotebookViewMode } from '../../types'
import {
  analyzeSetOperations,
  formatFiniteSet,
  parseSetBlockContent,
  serializeSetBlockContent,
  type SetBlockContent,
} from '../../lib/setTheory'

type SetBlockProps = {
  content: string
  mode: NotebookViewMode
  onChange: (content: string) => void
}

type SetResultCardProps = {
  label: string
  symbol: string
  value: string[]
}

function SetResultCard({ label, symbol, value }: SetResultCardProps) {
  return (
    <div className="rounded-lg border border-sky-100 bg-white px-3 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-700">{label}</p>
        <code className="rounded bg-sky-50 px-2 py-0.5 font-mono text-[11px] text-sky-800">
          {symbol}
        </code>
      </div>
      <p className="mt-2 overflow-x-auto whitespace-nowrap font-mono text-sm text-slate-950">
        {formatFiniteSet(value)}
      </p>
    </div>
  )
}

function SetRegion({
  label,
  value,
}: {
  label: string
  value: string[]
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <div className="mt-2 flex min-h-8 flex-wrap gap-1.5">
        {value.length > 0 ? (
          value.map((item) => (
            <span
              key={item}
              className="rounded-full bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-700"
            >
              {item}
            </span>
          ))
        ) : (
          <span className="font-mono text-sm text-slate-400">∅</span>
        )}
      </div>
    </div>
  )
}

function SetPreview({
  content,
  mode,
}: {
  content: SetBlockContent
  mode: NotebookViewMode
}) {
  const analysis = useMemo(
    () => analyzeSetOperations(content.setA, content.setB),
    [content.setA, content.setB],
  )

  return (
    <div className={mode === 'edit' ? 'space-y-4' : 'space-y-5'}>
      {mode === 'edit' && (
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Set preview
        </p>
      )}

      {analysis.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
          {analysis.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="relative mx-auto h-28 max-w-sm">
          <div
            aria-hidden="true"
            className="absolute left-[12%] top-2 h-24 w-36 rounded-full border-2 border-sky-300 bg-sky-200/40"
          />
          <div
            aria-hidden="true"
            className="absolute right-[12%] top-2 h-24 w-36 rounded-full border-2 border-cyan-300 bg-cyan-200/40"
          />
          <div className="absolute left-[23%] top-5 text-xs font-semibold text-sky-800">
            A
          </div>
          <div className="absolute right-[23%] top-5 text-xs font-semibold text-cyan-800">
            B
          </div>
          <div className="absolute inset-x-0 top-11 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            overlap
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <SetRegion label="A only" value={analysis.aOnly} />
          <SetRegion label="A ∩ B" value={analysis.intersection} />
          <SetRegion label="B only" value={analysis.bOnly} />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <SetResultCard
          label="Union"
          symbol="A ∪ B"
          value={analysis.union}
        />
        <SetResultCard
          label="Intersection"
          symbol="A ∩ B"
          value={analysis.intersection}
        />
        <SetResultCard
          label="A minus B"
          symbol="A \\ B"
          value={analysis.differenceAB}
        />
        <SetResultCard
          label="B minus A"
          symbol="B \\ A"
          value={analysis.differenceBA}
        />
        <SetResultCard
          label="Symmetric difference"
          symbol="A Δ B"
          value={analysis.symmetricDifference}
        />
      </div>
    </div>
  )
}

export default function SetBlock({ content, mode, onChange }: SetBlockProps) {
  const parsedContent = parseSetBlockContent(content)

  function handleContentChange(nextContent: Partial<SetBlockContent>) {
    onChange(
      serializeSetBlockContent({
        ...parsedContent,
        ...nextContent,
      }),
    )
  }

  return (
    <BlockEditorShell
      label="Finite sets"
      helperText="Separate entries with commas, semicolons, or new lines."
      mode={mode}
      output={<SetPreview content={parsedContent} mode={mode} />}
    >
      <div className="grid gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Set A
          </span>
          <textarea
            value={parsedContent.setA}
            onChange={(event) =>
              handleContentChange({ setA: event.target.value })
            }
            rows={4}
            placeholder="1, 2, 3, 4"
            className="min-h-24 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm leading-6 text-slate-900 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-4 focus:ring-sky-100"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Set B
          </span>
          <textarea
            value={parsedContent.setB}
            onChange={(event) =>
              handleContentChange({ setB: event.target.value })
            }
            rows={4}
            placeholder="3, 4, 5"
            className="min-h-24 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm leading-6 text-slate-900 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-4 focus:ring-sky-100"
          />
        </label>
      </div>
    </BlockEditorShell>
  )
}
