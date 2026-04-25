import BlockEditorShell from './BlockEditorShell'

type FormulaBlockProps = {
  content: string
  onChange: (content: string) => void
}

export default function FormulaBlock({ content, onChange }: FormulaBlockProps) {
  return (
    <BlockEditorShell
      label="Formula"
      helperText="Capture a formula you want to study, transform, or graph."
      output={
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            Formula preview
          </p>
          <pre className="mt-3 overflow-x-auto rounded-md bg-slate-50 p-3 text-sm text-slate-800">
            {content || 'Enter a formula to preview it here.'}
          </pre>
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
