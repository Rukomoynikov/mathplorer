export type SolverStep = {
  equation: string
  explanation: string
}

export type SolverResult =
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

type LinearEquation = {
  coefficient: number
  constant: number
  rightSide: number
}

export const UNSUPPORTED_LINEAR_EQUATION_MESSAGE =
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
      const linearTermPattern = new RegExp(
        `^[+-]?(?:(?:\\d+(?:\\.\\d+)?|\\.\\d+)\\*?)?x$`,
        'i',
      )

      if (!linearTermPattern.test(term)) {
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

export function solveLinearEquation(input: string): SolverResult {
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
  const solutionEquation = `x = ${formatNumber(solution)}`
  const steps: SolverStep[] = [
    {
      equation: `${formatLinearExpression(coefficient, constant)} = ${formatNumber(rightSide)}`,
      explanation: 'Start with the original equation.',
    },
  ]

  if (constant !== 0) {
    const action = constant > 0 ? 'Subtract' : 'Add'
    const amount = formatNumber(Math.abs(constant))
    const direction =
      constant > 0 ? 'remove the constant term' : 'cancel the negative constant term'

    steps.push({
      equation: `${formatCoefficientTerm(coefficient)} = ${formatNumber(isolatedRightSide)}`,
      explanation: `${action} ${amount} on both sides to ${direction}.`,
    })
  }

  if (coefficient !== 1) {
    steps.push({
      equation: solutionEquation,
      explanation: `Divide both sides by ${formatNumber(coefficient)} to solve for x.`,
    })
  } else if (constant !== 0) {
    steps.push({
      equation: solutionEquation,
      explanation: 'The x term is already isolated, so this is the solution.',
    })
  }

  if (steps[steps.length - 1].equation !== solutionEquation) {
    steps.push({
      equation: solutionEquation,
      explanation: 'Read the isolated value of x as the solution.',
    })
  }

  return {
    kind: 'solved',
    steps,
  }
}
