import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import BlockEditorShell from './BlockEditorShell'
import type { NotebookViewMode } from '../../types'

type TextBlockProps = {
  content: string
  mode: NotebookViewMode
  onChange: (content: string) => void
}

export default function TextBlock({ content, mode, onChange }: TextBlockProps) {
  const hasContent = content.trim().length > 0

  return (
    <BlockEditorShell
      label="Notes"
      helperText="Use this space for definitions, observations, and scratch work."
      mode={mode}
      output={
        <div>
          {mode === 'edit' && (
            <p className="text-xs font-semibold uppercase text-slate-400">
              Preview
            </p>
          )}
          {hasContent ? (
            <div
              className={
                mode === 'preview'
                  ? 'text-base leading-7 text-slate-700'
                  : 'mt-3 text-sm leading-6 text-slate-700'
              }
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="mb-3 text-2xl font-semibold text-slate-950">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mb-2 mt-4 text-xl font-semibold text-slate-900">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mb-2 mt-4 text-base font-semibold text-slate-900">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => <p className="mb-3">{children}</p>,
                  strong: ({ children }) => (
                    <strong className="font-semibold text-slate-950">
                      {children}
                    </strong>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-3 list-decimal space-y-1 pl-5">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => <li>{children}</li>,
                  code: ({ children }) => (
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-900">
                      {children}
                    </code>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : mode === 'preview' ? null : (
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Start typing to see your note preview.
            </p>
          )}
        </div>
      }
    >
      <textarea
        value={content}
        onChange={(event) => onChange(event.target.value)}
        rows={6}
        placeholder="Write your notes here..."
        className="min-h-36 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
      />
    </BlockEditorShell>
  )
}
