import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import BlockEditorShell from './BlockEditorShell'

type FormulaBlockProps = {
  content: string
  onChange: (content: string) => void
  onDelete: () => void
  onDuplicate: () => void
  onExplain: () => void
  onGraph: () => void
}

function toDisplayMath(content: string) {
  const trimmed = content.trim()

  if (!trimmed) {
    return ''
  }

  if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
    return trimmed
  }

  if (trimmed.startsWith('\\[') && trimmed.endsWith('\\]')) {
    return `$$\n${trimmed.slice(2, -2).trim()}\n$$`
  }

  return `$$\n${trimmed}\n$$`
}

export default function FormulaBlock({
  content,
  onChange,
  onDelete,
  onDuplicate,
  onExplain,
  onGraph,
}: FormulaBlockProps) {
  const displayMath = toDisplayMath(content)

  return (
    <BlockEditorShell
      label="Formula"
      helperText="Capture a formula you want to study, transform, or graph."
      output={
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            Formula preview
          </p>
          <div className="mt-3 rounded-md bg-slate-50 p-4 text-slate-900">
            {displayMath ? (
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
              >
                {displayMath}
              </ReactMarkdown>
            ) : (
              <p className="text-sm text-slate-500">
                Enter a formula to preview it here.
              </p>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onGraph}
              disabled={!content.trim()}
              className="rounded-md bg-cyan-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Graph
            </button>
            <button
              type="button"
              onClick={onExplain}
              disabled={!content.trim()}
              className="rounded-md bg-teal-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Explain
            </button>
            <button
              type="button"
              onClick={onDuplicate}
              className="rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-white"
            >
              Duplicate
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
            >
              Delete
            </button>
          </div>
        </div>
      }
    >
      <textarea
        value={content}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        placeholder="f(x) = x^2 - 4x + 3"
        className="min-h-28 rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm leading-6 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
      />
    </BlockEditorShell>
  )
}
