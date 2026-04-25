import BlockEditorShell from './BlockEditorShell'

type ExplanationBlockProps = {
  content: string
  onChange: (content: string) => void
}

export default function ExplanationBlock({
  content,
  onChange,
}: ExplanationBlockProps) {
  return (
    <BlockEditorShell
      label="Question"
      helperText="Ask a question about the concept you are studying."
      output={
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            Explanation workspace
          </p>
          <p className="mt-3 rounded-md bg-amber-50 px-3 py-3 text-sm leading-6 text-amber-950">
            Ask a question about slope, quadratics, derivatives, or factoring.
            A focused explanation will appear here.
          </p>
        </div>
      }
    >
      <textarea
        value={content}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        placeholder="Explain why changing a in y = ax^2 changes the parabola."
        className="min-h-32 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
      />
    </BlockEditorShell>
  )
}
