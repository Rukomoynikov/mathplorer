import { useState } from 'react'
import BlockEditorShell from './BlockEditorShell'
import {
  generateLocalExplanation,
  type ExplanationResult,
} from '../../lib/explanationGenerator'

type ExplanationBlockProps = {
  content: string
  onChange: (content: string) => void
}

function ExplanationOutput({
  explanation,
}: {
  explanation: ExplanationResult | null
}) {
  if (!explanation) {
    return (
      <p className="mt-3 rounded-md bg-amber-50 px-3 py-3 text-sm leading-6 text-amber-950">
        Ask a question about slope, quadratics, derivatives, graphs, or solving.
        A focused local explanation will appear here.
      </p>
    )
  }

  return (
    <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase text-teal-700">
          Local MVP explanation
        </p>
        <span className="rounded bg-white px-2 py-1 text-xs font-medium text-slate-500">
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
        <div className="mt-4 rounded-md bg-white p-3">
          <p className="text-xs font-semibold uppercase text-slate-400">
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
  onChange,
}: ExplanationBlockProps) {
  const [explanation, setExplanation] = useState<ExplanationResult | null>(null)
  const canGenerate = content.trim().length > 0

  function handleContentChange(nextContent: string) {
    onChange(nextContent)
    setExplanation(null)
  }

  function handleGenerateExplanation() {
    if (!canGenerate) {
      return
    }

    setExplanation(generateLocalExplanation(content))
  }

  return (
    <BlockEditorShell
      label="Question"
      helperText="Ask a question about the concept you are studying."
      output={
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            Explanation
          </p>
          <ExplanationOutput explanation={explanation} />
        </div>
      }
    >
      <textarea
        value={content}
        onChange={(event) => handleContentChange(event.target.value)}
        rows={5}
        placeholder="Explain why changing a in y = ax^2 changes the parabola."
        className="min-h-32 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
      />
      <button
        type="button"
        onClick={handleGenerateExplanation}
        disabled={!canGenerate}
        className="self-start rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Generate explanation
      </button>
    </BlockEditorShell>
  )
}
