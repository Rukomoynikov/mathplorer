import {
  evaluateExpression,
  normalizeExpressionText,
  parseExpression,
  type ParsedExpression,
} from './mathEngine'

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
  leftText: string
  rightText: string
}

type LinearExpression = {
  coefficient: number
  constant: number
  expression: ParsedExpression
}

export const UNSUPPORTED_LINEAR_EQUATION_MESSAGE =
  'This MVP solver currently supports simple linear equations like 2x + 5 = 17.'

const LINEAR_TOLERANCE = 1e-9

function normalizeEquation(input: string) {
  return normalizeExpressionText(input)
}

function isNearlyEqual(left: number, right: number) {
  return Math.abs(left - right) <= LINEAR_TOLERANCE
}

function normalizeNumber(value: number) {
  return Math.abs(value) < LINEAR_TOLERANCE ? 0 : value
}

function evaluateAt(expression: ParsedExpression, x: number) {
  const result = evaluateExpression(expression, { x })

  return result.ok ? result.value : null
}

function parseLinearExpression(input: string): LinearExpression | null {
  const parsed = parseExpression(input)

  if (!parsed.ok) {
    return null
  }

  const atZero = evaluateAt(parsed.value, 0)
  const atOne = evaluateAt(parsed.value, 1)
  const atTwo = evaluateAt(parsed.value, 2)
  const atNegativeOne = evaluateAt(parsed.value, -1)

  if (
    atNegativeOne === null ||
    atZero === null ||
    atOne === null ||
    atTwo === null
  ) {
    return null
  }

  const constant = atZero
  const coefficient = atOne - constant
  const expectedAtTwo = constant + coefficient * 2

  if (
    !isNearlyEqual(atNegativeOne, constant - coefficient) ||
    !isNearlyEqual(atTwo, expectedAtTwo)
  ) {
    return null
  }

  return {
    coefficient: normalizeNumber(coefficient),
    constant: normalizeNumber(constant),
    expression: parsed.value,
  }
}

function parseEquation(input: string): LinearEquation | null {
  const normalized = normalizeEquation(input)
  const parts = normalized.split('=')

  if (parts.length !== 2) {
    return null
  }

  const [leftSide, rightSide] = parts
  const parsedLeftSide = parseLinearExpression(leftSide)
  const parsedRightSide = parseLinearExpression(rightSide)

  if (!parsedLeftSide || !parsedRightSide) {
    return null
  }

  const coefficient = parsedLeftSide.coefficient - parsedRightSide.coefficient
  const constant = parsedLeftSide.constant - parsedRightSide.constant

  if (normalizeNumber(coefficient) === 0) {
    return null
  }

  return {
    coefficient: normalizeNumber(coefficient),
    constant: normalizeNumber(constant),
    leftText: parsedLeftSide.expression.text,
    rightText: parsedRightSide.expression.text,
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

export function solveLinearEquation(input: string): SolverResult {
  if (!input.trim()) {
    return { kind: 'empty' }
  }

  const equation = parseEquation(input)

  if (!equation) {
    return { kind: 'unsupported' }
  }

  const { coefficient, constant, leftText, rightText } = equation
  const isolatedRightSide = -constant
  const solution = isolatedRightSide / coefficient
  const solutionEquation = `x = ${formatNumber(solution)}`
  const steps: SolverStep[] = [
    {
      equation: `${leftText} = ${rightText}`,
      explanation: 'Start with the original equation.',
    },
  ]

  const isolatedVariableEquation = `${formatCoefficientTerm(
    coefficient,
  )} = ${formatNumber(isolatedRightSide)}`

  if (steps[steps.length - 1].equation !== isolatedVariableEquation) {
    steps.push({
      equation: isolatedVariableEquation,
      explanation: 'Move x terms to one side and constants to the other.',
    })
  }

  if (!isNearlyEqual(coefficient, 1)) {
    steps.push({
      equation: solutionEquation,
      explanation: `Divide both sides by ${formatNumber(coefficient)} to solve for x.`,
    })
  } else if (!isNearlyEqual(constant, 0)) {
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
