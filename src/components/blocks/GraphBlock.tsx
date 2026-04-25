import BlockEditorShell from './BlockEditorShell'

type GraphBlockProps = {
  content: string
  onChange: (content: string) => void
}

export default function GraphBlock({ content, onChange }: GraphBlockProps) {
  return (
    <BlockEditorShell
      label="Function"
      helperText="Enter a function of x to keep the graph idea with your notes."
      output={
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            Graph workspace
          </p>
          <div className="mt-3 flex h-40 items-center justify-center rounded-md border border-slate-200 bg-[linear-gradient(#e2e8f0_1px,transparent_1px),linear-gradient(90deg,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px]">
            <code className="rounded bg-white/90 px-3 py-2 text-sm text-slate-700 shadow-sm">
              {content || 'y = f(x)'}
            </code>
          </div>
        </div>
      }
    >
      <textarea
        value={content}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        placeholder="y = x^2 - 4x + 3"
        className="min-h-28 rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm leading-6 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
      />
    </BlockEditorShell>
  )
}
