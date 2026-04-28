import { useMemo, useState } from 'react'
import BlockEditorShell from './BlockEditorShell'
import type { NotebookViewMode } from '../../types'
import {
  generateLocalExplanation,
  type ExplanationResult,
} from '../../lib/explanationGenerator'

type ExplanationBlockProps = {
  content: string
  mode: NotebookViewMode
  onChange: (content: string) => void
}

function ExplanationOutput({
  explanation,
  mode,
}: {
  explanation: ExplanationResult | null
  mode: NotebookViewMode
}) {
  if (!explanation) {
    if (mode === 'preview') {
      return null
    }

    return (
      <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm leading-6 text-amber-950">
        Ask a question about sets, counting, probability, slope, quadratics,
        derivatives, graphs, or solving.
        A focused local explanation will appear here.
      </p>
    )
  }

  if (mode === 'preview') {
    return (
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">
          {explanation.title}
        </h2>
        <div className="space-y-3">
          {explanation.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-base leading-7 text-slate-700">
              {paragraph}
            </p>
          ))}
        </div>
        {explanation.examples && explanation.examples.length > 0 && (
          <div className="pt-1">
            <p className="text-sm font-semibold text-slate-900">Examples</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-base leading-7 text-slate-700">
              {explanation.examples.map((example) => (
                <li key={example}>{example}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    )
  }

  return (
    <div className="mt-3 rounded-md border border-violet-100 bg-violet-50/50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[11px] font-semibold uppercase text-violet-700">
          Local MVP explanation
        </p>
        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-violet-700 ring-1 ring-violet-200">
          {explanation.topic}
        </span>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-slate-950">
        {explanation.title}
      </h3>
      <div className="mt-3 space-y-3">
        {explanation.paragraphs.map((paragraph) => (
          <p key={paragraph} className="text-sm leading-6 text-slate-700">
            {paragraph}
          </p>
        ))}
      </div>
      {explanation.examples && explanation.examples.length > 0 && (
        <div className="mt-4 rounded-md border border-violet-100 bg-white p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Examples
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
            {explanation.examples.map((example) => (
              <li key={example}>{example}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function ExplanationBlock({
  content,
  mode,
  onChange,
}: ExplanationBlockProps) {
  const [explanation, setExplanation] = useState<ExplanationResult | null>(null)
  const canGenerate = content.trim().length > 0
  const previewExplanation = useMemo(
    () => (canGenerate ? generateLocalExplanation(content) : null),
    [canGenerate, content],
  )
  const displayedExplanation =
    mode === 'preview' ? previewExplanation : explanation

  function handleContentChange(nextContent: string) {
    onChange(nextContent)
    setExplanation(null)
  }

  function handleGenerateExplanation() {
    if (!canGenerate) {
      return
    }

    // Future LLM integration can replace this local generator call with an async API request.
    setExplanation(generateLocalExplanation(content))
  }

  return (
    <BlockEditorShell
      label="Question"
      helperText="Ask a question about the concept you are studying."
      mode={mode}
      output={
        <div>
          {mode === 'edit' && (
            <p className="text-[11px] font-semibold uppercase text-slate-500">
              Explanation
            </p>
          )}
          <ExplanationOutput explanation={displayedExplanation} mode={mode} />
        </div>
      }
    >
      <textarea
        value={content}
        onChange={(event) => handleContentChange(event.target.value)}
        rows={5}
        placeholder="Explain why changing a in y = ax^2 changes the parabola."
        className="mnl-textarea min-h-32 focus:border-violet-400 focus:ring-violet-100"
      />
      <button
        type="button"
        onClick={handleGenerateExplanation}
        disabled={!canGenerate}
        className="inline-flex min-h-9 items-center justify-center self-start rounded-md bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
      >
        Generate explanation
      </button>
    </BlockEditorShell>
  )
}
