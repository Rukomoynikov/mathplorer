import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import { Copy, Sparkles, Trash2, LineChart } from 'lucide-react'
import BlockEditorShell from './BlockEditorShell'
import type { NotebookViewMode } from '../../types'

type FormulaBlockProps = {
  content: string
  mode: NotebookViewMode
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
  mode,
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
      mode={mode}
      output={
        <div>
          {mode === 'edit' && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Formula preview
            </p>
          )}
          <div
            className={
              mode === 'preview'
                ? 'overflow-x-auto text-center text-slate-950'
                : 'mt-3 rounded-lg border border-indigo-100 bg-indigo-50/40 p-4 text-slate-900'
            }
          >
            {displayMath ? (
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
              >
                {displayMath}
              </ReactMarkdown>
            ) : mode === 'preview' ? null : (
              <p className="text-sm text-slate-500">
                Enter a formula to preview it here.
              </p>
            )}
          </div>
          {mode === 'edit' && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onGraph}
                disabled={!content.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                <LineChart size={14} aria-hidden="true" />
                Graph
              </button>
              <button
                type="button"
                onClick={onExplain}
                disabled={!content.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                <Sparkles size={14} aria-hidden="true" />
                Explain
              </button>
              <span className="mx-1 self-center h-5 w-px bg-slate-200" aria-hidden="true" />
              <button
                type="button"
                onClick={onDuplicate}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <Copy size={14} aria-hidden="true" />
                Duplicate
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
              >
                <Trash2 size={14} aria-hidden="true" />
                Delete
              </button>
            </div>
          )}
        </div>
      }
    >
      <textarea
        value={content}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        placeholder="f(x) = x^2 - 4x + 3"
        className="min-h-28 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm leading-6 text-slate-900 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
      />
    </BlockEditorShell>
  )
}
