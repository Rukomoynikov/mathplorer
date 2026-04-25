import BlockEditorShell from './BlockEditorShell'

type SolverBlockProps = {
  content: string
  onChange: (content: string) => void
}

type LinearEquation = {
  coefficient: number
  constant: number
  rightSide: number
}

type SolverStep = {
  equation: string
  explanation: string
}

type SolverResult =
  | {
      kind: 'empty'
    }
  | {
      kind: 'unsupported'
    }
  | {
      kind: 'solved'
      steps: SolverStep[]
    }

const UNSUPPORTED_MESSAGE =
  'This MVP solver currently supports simple linear equations like 2x + 5 = 17.'

const NUMBER_PATTERN = '[+-]?(?:\\d+(?:\\.\\d+)?|\\.\\d+)'

function normalizeEquation(input: string) {
  return input.replace(/−/g, '-').replace(/\s+/g, '')
}

function parseNumber(value: string) {
  if (!new RegExp(`^${NUMBER_PATTERN}$`).test(value)) {
    return null
  }

  const parsedValue = Number(value)

  return Number.isFinite(parsedValue) ? parsedValue : null
}

function parseCoefficient(term: string) {
  const withoutVariable = term.replace(/x/i, '').replace('*', '')

  if (withoutVariable === '' || withoutVariable === '+') {
    return 1
  }

  if (withoutVariable === '-') {
    return -1
  }

  return parseNumber(withoutVariable)
}

function parseLeftSide(leftSide: string) {
  if (!leftSide || !/[xX]/.test(leftSide)) {
    return null
  }

  const terms = leftSide
    .replace(/-/g, '+-')
    .split('+')
    .filter(Boolean)

  let coefficient = 0
  let constant = 0

  for (const term of terms) {
    if (/x/i.test(term)) {
      if (!new RegExp(`^[+-]?(?:(?:\\d+(?:\\.\\d+)?|\\.\\d+)\\*?)?x$`, 'i').test(term)) {
        return null
      }

      const parsedCoefficient = parseCoefficient(term)

      if (parsedCoefficient === null) {
        return null
      }

      coefficient += parsedCoefficient
      continue
    }

    const parsedConstant = parseNumber(term)

    if (parsedConstant === null) {
      return null
    }

    constant += parsedConstant
  }

  if (coefficient === 0) {
    return null
  }

  return { coefficient, constant }
}

function parseEquation(input: string): LinearEquation | null {
  const normalized = normalizeEquation(input)
  const parts = normalized.split('=')

  if (parts.length !== 2) {
    return null
  }

  const [leftSide, rightSide] = parts
  const parsedLeftSide = parseLeftSide(leftSide)
  const parsedRightSide = parseNumber(rightSide)

  if (!parsedLeftSide || parsedRightSide === null) {
    return null
  }

  return {
    coefficient: parsedLeftSide.coefficient,
    constant: parsedLeftSide.constant,
    rightSide: parsedRightSide,
  }
}

function formatNumber(value: number) {
  const normalized = Math.abs(value) < 1e-10 ? 0 : value

  if (Number.isInteger(normalized)) {
    return String(normalized)
  }

  return Number(normalized.toFixed(6)).toString()
}

function formatCoefficientTerm(coefficient: number) {
  if (coefficient === 1) {
    return 'x'
  }

  if (coefficient === -1) {
    return '-x'
  }

  return `${formatNumber(coefficient)}x`
}

function formatLinearExpression(coefficient: number, constant: number) {
  const coefficientTerm = formatCoefficientTerm(coefficient)

  if (constant === 0) {
    return coefficientTerm
  }

  const operator = constant > 0 ? '+' : '-'
  const absoluteConstant = formatNumber(Math.abs(constant))

  return `${coefficientTerm} ${operator} ${absoluteConstant}`
}

function solveEquation(input: string): SolverResult {
  if (!input.trim()) {
    return { kind: 'empty' }
  }

  const equation = parseEquation(input)

  if (!equation) {
    return { kind: 'unsupported' }
  }

  const { coefficient, constant, rightSide } = equation
  const isolatedRightSide = rightSide - constant
  const solution = isolatedRightSide / coefficient
  const steps: SolverStep[] = [
    {
      equation: `${formatLinearExpression(coefficient, constant)} = ${formatNumber(rightSide)}`,
      explanation: 'Start with the original equation.',
    },
  ]

  if (constant !== 0) {
    const action = constant > 0 ? 'Subtract' : 'Add'
    const amount = formatNumber(Math.abs(constant))
    const direction = constant > 0 ? 'remove the constant term' : 'cancel the negative constant term'

    steps.push({
      equation: `${formatCoefficientTerm(coefficient)} = ${formatNumber(isolatedRightSide)}`,
      explanation: `${action} ${amount} on both sides to ${direction}.`,
    })
  }

  if (coefficient !== 1) {
    steps.push({
      equation: `x = ${formatNumber(solution)}`,
      explanation: `Divide both sides by ${formatNumber(coefficient)} to solve for x.`,
    })
  } else if (constant !== 0) {
    steps.push({
      equation: `x = ${formatNumber(solution)}`,
      explanation: 'The x term is already isolated, so this is the solution.',
    })
  }

  if (steps[steps.length - 1].equation !== `x = ${formatNumber(solution)}`) {
    steps.push({
      equation: `x = ${formatNumber(solution)}`,
      explanation: 'Read the isolated value of x as the solution.',
    })
  }

  return {
    kind: 'solved',
    steps,
  }
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
          {UNSUPPORTED_MESSAGE}
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
  const result = solveEquation(content)

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
