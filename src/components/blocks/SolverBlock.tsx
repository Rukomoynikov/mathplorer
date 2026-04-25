import BlockEditorShell from './BlockEditorShell'
import {
  solveLinearEquation,
  UNSUPPORTED_LINEAR_EQUATION_MESSAGE,
  type SolverResult,
} from '../../lib/linearSolver'

type SolverBlockProps = {
  content: string
  onChange: (content: string) => void
}

function SolverOutput({ result }: { result: SolverResult }) {
  if (result.kind === 'empty') {
    return (
      <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm leading-6 text-slate-600">
          Type a simple linear equation to see the steps.
        </p>
      </div>
    )
  }

  if (result.kind === 'unsupported') {
    return (
      <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-950">Unsupported equation</p>
        <p className="mt-1 text-sm leading-6 text-amber-900">
          {UNSUPPORTED_LINEAR_EQUATION_MESSAGE}
        </p>
      </div>
    )
  }

  return (
    <ol className="mt-3 space-y-3 text-sm text-slate-700">
      {result.steps.map((step, index) => (
        <li
          key={`${step.equation}-${index}`}
          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3"
        >
          <div className="flex gap-3">
            <span className="flex h-6 min-w-6 items-center justify-center rounded bg-white text-xs font-semibold text-teal-700">
              {index + 1}
            </span>
            <div>
              <p className="font-mono text-base text-slate-950">{step.equation}</p>
              <p className="mt-1 leading-6 text-slate-600">{step.explanation}</p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}

export default function SolverBlock({ content, onChange }: SolverBlockProps) {
  const result = solveLinearEquation(content)

  return (
    <BlockEditorShell
      label="Equation"
      helperText="This MVP solver supports equations shaped like ax + b = c."
      output={
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            Solver steps
          </p>
          <SolverOutput result={result} />
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
