import BlockEditorShell from './BlockEditorShell'

type SolverBlockProps = {
  content: string
  onChange: (content: string) => void
}

export default function SolverBlock({ content, onChange }: SolverBlockProps) {
  return (
    <BlockEditorShell
      label="Equation"
      helperText="Enter an equation and keep solving notes beside the prompt."
      output={
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            Solver workspace
          </p>
          <ol className="mt-3 space-y-2 text-sm text-slate-700">
            <li className="rounded-md bg-slate-50 px-3 py-2">
              Input: {content || 'Enter an equation.'}
            </li>
            <li className="rounded-md bg-slate-50 px-3 py-2">
              Step-by-step work will appear here.
            </li>
          </ol>
        </div>
      }
    >
      <textarea
        value={content}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        placeholder="2x + 5 = 17"
        className="min-h-28 rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm leading-6 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
      />
    </BlockEditorShell>
  )
}
