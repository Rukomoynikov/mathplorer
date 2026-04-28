import { useMemo } from 'react'
import BlockEditorShell from './BlockEditorShell'
import type { NotebookViewMode } from '../../types'
import {
  analyzeProbability,
  parseProbabilityBlockContent,
  serializeProbabilityBlockContent,
  type ProbabilityAnalysis,
  type ProbabilityBlockContent,
} from '../../lib/probability'

type ProbabilityBlockProps = {
  content: string
  mode: NotebookViewMode
  onChange: (content: string) => void
}

function ProbabilityMetric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-md border border-cyan-100 bg-white px-3 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase text-slate-500">
        {label}
      </p>
      <p className="mt-1 overflow-x-auto font-mono text-lg font-semibold text-slate-950">
        {value}
      </p>
    </div>
  )
}

function ProbabilityResult({ analysis }: { analysis: ProbabilityAnalysis }) {
  if (!analysis.ok) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-950">
          Cannot calculate yet
        </p>
        <p className="mt-1 text-sm leading-6 text-amber-900">
          {analysis.message}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-cyan-100 bg-cyan-50/50 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase text-cyan-700">
              Probability
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-700">
              {analysis.favorableOutcomes} favorable outcomes out of{' '}
              {analysis.totalOutcomes} total outcomes.
            </p>
          </div>
          <p className="font-mono text-2xl font-semibold text-slate-950">
            {analysis.numerator}/{analysis.denominator}
          </p>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white ring-1 ring-cyan-100">
          <div
            aria-label={`${analysis.percent} probability`}
            className="h-full rounded-full bg-cyan-500 transition-all"
            role="img"
            style={{ width: `${analysis.percentValue}%` }}
          />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <ProbabilityMetric
          label="Fraction"
          value={`${analysis.numerator}/${analysis.denominator}`}
        />
        <ProbabilityMetric label="Decimal" value={analysis.decimal} />
        <ProbabilityMetric label="Percent" value={analysis.percent} />
      </div>
    </div>
  )
}

function ProbabilityPreview({
  content,
  mode,
}: {
  content: ProbabilityBlockContent
  mode: NotebookViewMode
}) {
  const analysis = useMemo(() => analyzeProbability(content), [content])

  return (
    <div className="space-y-4">
      {mode === 'edit' && (
        <p className="text-[11px] font-semibold uppercase text-slate-500">
          Probability preview
        </p>
      )}
      <ProbabilityResult analysis={analysis} />
    </div>
  )
}

export default function ProbabilityBlock({
  content,
  mode,
  onChange,
}: ProbabilityBlockProps) {
  const parsedContent = parseProbabilityBlockContent(content)

  function handleContentChange(nextContent: Partial<ProbabilityBlockContent>) {
    onChange(
      serializeProbabilityBlockContent({
        ...parsedContent,
        ...nextContent,
      }),
    )
  }

  return (
    <BlockEditorShell
      label="Outcome counts"
      helperText="Use whole-number counts for favorable outcomes and total outcomes."
      mode={mode}
      output={<ProbabilityPreview content={parsedContent} mode={mode} />}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase text-slate-500">
            Favorable
          </span>
          <input
            value={parsedContent.favorableOutcomes}
            onChange={(event) =>
              handleContentChange({ favorableOutcomes: event.target.value })
            }
            inputMode="numeric"
            placeholder="3"
            className="mnl-field font-mono focus:border-cyan-400 focus:ring-cyan-100"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase text-slate-500">
            Total
          </span>
          <input
            value={parsedContent.totalOutcomes}
            onChange={(event) =>
              handleContentChange({ totalOutcomes: event.target.value })
            }
            inputMode="numeric"
            placeholder="8"
            className="mnl-field font-mono focus:border-cyan-400 focus:ring-cyan-100"
          />
        </label>
      </div>
    </BlockEditorShell>
  )
}
