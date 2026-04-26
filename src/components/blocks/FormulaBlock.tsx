import { useId, useState, type FormEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import {
  Braces,
  Copy,
  Diff,
  LineChart,
  Replace,
  Sparkles,
  Trash2,
  Wand,
  type LucideIcon,
} from 'lucide-react'
import BlockEditorShell from './BlockEditorShell'
import type { NotebookViewMode } from '../../types'

type FormulaBlockProps = {
  content: string
  mode: NotebookViewMode
  onChange: (content: string) => void
  onDelete: () => void
  onDifferentiate: () => void
  onDuplicate: () => void
  onExplain: () => void
  onExpand: () => void
  onGraph: () => void
  onSimplify: () => void
  onSubstitute: (substitution: string) => void
}

type FormulaActionButtonProps = {
  disabled?: boolean
  icon: LucideIcon
  label: string
  onClick: () => void
  tone?: 'danger' | 'emerald' | 'indigo' | 'neutral' | 'violet'
}

const ACTION_BUTTON_TONES: Record<
  NonNullable<FormulaActionButtonProps['tone']>,
  string
> = {
  danger:
    'border-rose-200 bg-white text-rose-700 hover:bg-rose-50 disabled:border-slate-200',
  emerald:
    'border-emerald-600 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 disabled:border-slate-300 disabled:bg-slate-300',
  indigo:
    'border-indigo-600 bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 disabled:border-slate-300 disabled:bg-slate-300',
  neutral:
    'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:border-slate-200 disabled:bg-slate-100',
  violet:
    'border-violet-600 bg-violet-600 text-white shadow-sm hover:bg-violet-700 disabled:border-slate-300 disabled:bg-slate-300',
}

function FormulaActionButton({
  disabled = false,
  icon: Icon,
  label,
  onClick,
  tone = 'neutral',
}: FormulaActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:text-white disabled:shadow-none ${ACTION_BUTTON_TONES[tone]}`}
    >
      <Icon size={14} aria-hidden="true" />
      {label}
    </button>
  )
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
  onDifferentiate,
  onDuplicate,
  onExplain,
  onExpand,
  onGraph,
  onSimplify,
  onSubstitute,
}: FormulaBlockProps) {
  const displayMath = toDisplayMath(content)
  const substitutionInputId = useId()
  const [substitution, setSubstitution] = useState('x = 2')
  const hasFormulaContent = Boolean(content.trim())

  function handleSubstituteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!hasFormulaContent || !substitution.trim()) {
      return
    }

    onSubstitute(substitution)
  }

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
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <FormulaActionButton
                  icon={Wand}
                  label="Simplify"
                  onClick={onSimplify}
                  disabled={!hasFormulaContent}
                  tone="indigo"
                />
                <FormulaActionButton
                  icon={Braces}
                  label="Expand"
                  onClick={onExpand}
                  disabled={!hasFormulaContent}
                  tone="indigo"
                />
                <FormulaActionButton
                  icon={Diff}
                  label="d/dx"
                  onClick={onDifferentiate}
                  disabled={!hasFormulaContent}
                  tone="indigo"
                />
              </div>

              <form
                onSubmit={handleSubstituteSubmit}
                className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-2.5 sm:flex-row sm:items-center"
              >
                <label
                  htmlFor={substitutionInputId}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600"
                >
                  <Replace size={14} aria-hidden="true" />
                  Substitute
                </label>
                <input
                  id={substitutionInputId}
                  value={substitution}
                  onChange={(event) => setSubstitution(event.target.value)}
                  placeholder="x = 2"
                  className="min-h-9 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                />
                <button
                  type="submit"
                  disabled={!hasFormulaContent || !substitution.trim()}
                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  <Replace size={14} aria-hidden="true" />
                  Apply
                </button>
              </form>

              <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-3">
                <FormulaActionButton
                  icon={LineChart}
                  label="Graph"
                  onClick={onGraph}
                  disabled={!hasFormulaContent}
                  tone="emerald"
                />
                <FormulaActionButton
                  icon={Sparkles}
                  label="Explain"
                  onClick={onExplain}
                  disabled={!hasFormulaContent}
                  tone="violet"
                />
                <FormulaActionButton
                  icon={Copy}
                  label="Duplicate"
                  onClick={onDuplicate}
                />
                <FormulaActionButton
                  icon={Trash2}
                  label="Delete"
                  onClick={onDelete}
                  tone="danger"
                />
              </div>
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
