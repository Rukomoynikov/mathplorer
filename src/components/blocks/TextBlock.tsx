import BlockEditorShell from './BlockEditorShell'

type TextBlockProps = {
  content: string
  onChange: (content: string) => void
}

export default function TextBlock({ content, onChange }: TextBlockProps) {
  return (
    <BlockEditorShell
      label="Notes"
      helperText="Use this space for definitions, observations, and scratch work."
      output={
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            Preview
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {content || 'Start typing to see your note preview.'}
          </p>
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
