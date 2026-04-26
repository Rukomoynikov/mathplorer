import { rationalize, type MathNode } from 'mathjs'
import {
  differentiateExpression,
  evaluateExpression,
  expressionToTex,
  normalizeExpressionText,
  parseExpression,
  type MathEngineErrorKind,
  type MathEngineResult,
  type ParsedExpression,
} from './mathEngine'

export type CalculusOperation =
  | 'definite-integral'
  | 'derivative-at-point'
  | 'differentiate'
  | 'tangent-line'

export type CalculusFormulaResult = {
  content: string
  operation: CalculusOperation
  tex: string
  value?: number
}

export type DerivativePreview = {
  derivativeTex: string
  derivativeText: string
  sourceTex: string
  variable: string
}

type FormulaExpressionSource = {
  expression: MathNode
  input: string
  normalized: string
}

const SCOPE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/
const DEFAULT_QUADRATURE_INTERVALS = 512

function ok<T>(value: T): MathEngineResult<T> {
  return { ok: true, value }
}

function error<T>(
  kind: MathEngineErrorKind,
  input: string,
  normalized: string,
  message: string,
): MathEngineResult<T> {
  return {
    error: {
      input,
      kind,
      message,
      normalized,
    },
    ok: false,
  }
}

function getErrorMessage(caughtError: unknown) {
  return caughtError instanceof Error ? caughtError.message : String(caughtError)
}

function isMathNode(value: unknown): value is MathNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    'isNode' in value &&
    value.isNode === true
  )
}

function getFormulaExpression(
  parsed: ParsedExpression,
): MathEngineResult<FormulaExpressionSource> {
  const { ast, input, normalized } = parsed

  if (ast.type === 'FunctionAssignmentNode') {
    const expr = (ast as MathNode & { expr?: unknown }).expr

    if (isMathNode(expr)) {
      return ok({ expression: expr, input, normalized })
    }

    return error(
      'unsupported-expression',
      input,
      normalized,
      'Function formulas must have an expression body.',
    )
  }

  if (ast.type === 'AssignmentNode') {
    const value = (ast as MathNode & { value?: unknown }).value

    if (isMathNode(value)) {
      return ok({ expression: value, input, normalized })
    }

    return error(
      'unsupported-expression',
      input,
      normalized,
      'Formula assignments must have an expression value.',
    )
  }

  return ok({ expression: ast, input, normalized })
}

function parseFormulaExpression(
  content: string,
): MathEngineResult<FormulaExpressionSource> {
  const parsed = parseExpression(content)

  return parsed.ok ? getFormulaExpression(parsed.value) : parsed
}

function validateVariable(
  variable: string,
  source: FormulaExpressionSource,
): MathEngineResult<string> {
  const normalizedVariable = variable.trim()

  if (!SCOPE_NAME_PATTERN.test(normalizedVariable)) {
    return error(
      'invalid-scope',
      source.input,
      source.normalized,
      `Variable "${variable}" is not a valid symbol name.`,
    )
  }

  return ok(normalizedVariable)
}

function evaluateNumericInput(
  input: string,
  emptyMessage: string,
): MathEngineResult<number> {
  const normalized = normalizeExpressionText(input)

  if (!normalized) {
    return error('empty-expression', input, normalized, emptyMessage)
  }

  return evaluateExpression(normalized)
}

function formatNumber(value: number) {
  if (Math.abs(value) < 1e-12) {
    return '0'
  }

  return Number(value.toPrecision(12)).toString()
}

function variableToTex(variable: string) {
  if (/^[A-Za-z]$/.test(variable)) {
    return variable
  }

  return `\\mathrm{${variable.replace(/_/g, '\\_')}}`
}

function createDerivative(
  content: string,
  variable: string,
): MathEngineResult<{
  derivative: ParsedExpression
  source: FormulaExpressionSource
  sourceTex: string
  variable: string
}> {
  const source = parseFormulaExpression(content)

  if (!source.ok) {
    return source
  }

  const normalizedVariable = validateVariable(variable, source.value)

  if (!normalizedVariable.ok) {
    return normalizedVariable
  }

  const derivative = differentiateExpression(
    source.value.expression,
    normalizedVariable.value,
  )

  if (!derivative.ok) {
    return derivative
  }

  const sourceTex = expressionToTex(source.value.expression)

  if (!sourceTex.ok) {
    return sourceTex
  }

  return ok({
    derivative: derivative.value,
    source: source.value,
    sourceTex: sourceTex.value,
    variable: normalizedVariable.value,
  })
}

export function createDerivativePreview(
  content: string,
  variable = 'x',
): MathEngineResult<DerivativePreview> {
  const derivative = createDerivative(content, variable)

  if (!derivative.ok) {
    return derivative
  }

  return ok({
    derivativeTex: derivative.value.derivative.tex,
    derivativeText: derivative.value.derivative.text,
    sourceTex: derivative.value.sourceTex,
    variable: derivative.value.variable,
  })
}

export function differentiateCalculusFormula(
  content: string,
  variable = 'x',
): MathEngineResult<CalculusFormulaResult> {
  const derivative = createDerivative(content, variable)

  if (!derivative.ok) {
    return derivative
  }

  return ok({
    content: derivative.value.derivative.text,
    operation: 'differentiate',
    tex: derivative.value.derivative.tex,
  })
}

export function evaluateDerivativeAtPointFormula(
  content: string,
  variable = 'x',
  pointInput = '0',
): MathEngineResult<CalculusFormulaResult> {
  const derivative = createDerivative(content, variable)

  if (!derivative.ok) {
    return derivative
  }

  const point = evaluateNumericInput(pointInput, 'Enter a point for the derivative.')

  if (!point.ok) {
    return point
  }

  const derivativeValue = evaluateExpression(derivative.value.derivative, {
    [derivative.value.variable]: point.value,
  })

  if (!derivativeValue.ok) {
    return derivativeValue
  }

  const variableTex = variableToTex(derivative.value.variable)
  const pointText = formatNumber(point.value)
  const valueText = formatNumber(derivativeValue.value)
  const tex = `\\left.\\frac{d}{d${variableTex}}\\left(${derivative.value.sourceTex}\\right)\\right|_{${variableTex}=${pointText}} \\approx ${valueText}`

  return ok({
    content: valueText,
    operation: 'derivative-at-point',
    tex,
    value: derivativeValue.value,
  })
}

export function createTangentLineFormula(
  content: string,
  variable = 'x',
  pointInput = '0',
): MathEngineResult<CalculusFormulaResult> {
  const derivative = createDerivative(content, variable)

  if (!derivative.ok) {
    return derivative
  }

  const point = evaluateNumericInput(pointInput, 'Enter a point for the tangent line.')

  if (!point.ok) {
    return point
  }

  const scope = { [derivative.value.variable]: point.value }
  const functionValue = evaluateExpression(derivative.value.source.expression, scope)

  if (!functionValue.ok) {
    return functionValue
  }

  const slope = evaluateExpression(derivative.value.derivative, scope)

  if (!slope.ok) {
    return slope
  }

  const lineExpression = `${formatNumber(slope.value)} * (${
    derivative.value.variable
  } - (${formatNumber(point.value)})) + (${formatNumber(functionValue.value)})`

  try {
    const line = rationalize(lineExpression)
    const lineTex = line.toTex()

    return ok({
      content: `y = ${line.toString()}`,
      operation: 'tangent-line',
      tex: `y=${lineTex}`,
      value: functionValue.value,
    })
  } catch (caughtError) {
    return error(
      'unsupported-expression',
      derivative.value.source.input,
      derivative.value.source.normalized,
      getErrorMessage(caughtError),
    )
  }
}

export function integrateDefiniteFormula(
  content: string,
  variable = 'x',
  lowerInput = '0',
  upperInput = '1',
): MathEngineResult<CalculusFormulaResult> {
  const source = parseFormulaExpression(content)

  if (!source.ok) {
    return source
  }

  const normalizedVariable = validateVariable(variable, source.value)

  if (!normalizedVariable.ok) {
    return normalizedVariable
  }

  const lowerBound = evaluateNumericInput(
    lowerInput,
    'Enter a lower bound for the integral.',
  )

  if (!lowerBound.ok) {
    return lowerBound
  }

  const upperBound = evaluateNumericInput(
    upperInput,
    'Enter an upper bound for the integral.',
  )

  if (!upperBound.ok) {
    return upperBound
  }

  const sourceTex = expressionToTex(source.value.expression)

  if (!sourceTex.ok) {
    return sourceTex
  }

  if (lowerBound.value === upperBound.value) {
    const variableTex = variableToTex(normalizedVariable.value)
    const boundText = formatNumber(lowerBound.value)
    const tex = `\\int_{${boundText}}^{${boundText}} ${sourceTex.value}\\,d${variableTex} \\approx 0`

    return ok({
      content: '0',
      operation: 'definite-integral',
      tex,
      value: 0,
    })
  }

  const intervalCount =
    DEFAULT_QUADRATURE_INTERVALS % 2 === 0
      ? DEFAULT_QUADRATURE_INTERVALS
      : DEFAULT_QUADRATURE_INTERVALS + 1
  const step = (upperBound.value - lowerBound.value) / intervalCount
  let sum = 0

  for (let index = 0; index <= intervalCount; index += 1) {
    const x = lowerBound.value + step * index
    const sample = evaluateExpression(source.value.expression, {
      [normalizedVariable.value]: x,
    })

    if (!sample.ok) {
      return error(
        'evaluation-error',
        source.value.input,
        source.value.normalized,
        `Integral sample at ${normalizedVariable.value} = ${formatNumber(
          x,
        )} failed: ${sample.error.message}`,
      )
    }

    const weight = index === 0 || index === intervalCount ? 1 : index % 2 ? 4 : 2
    sum += weight * sample.value
  }

  const value = (sum * step) / 3
  const variableTex = variableToTex(normalizedVariable.value)
  const lowerText = formatNumber(lowerBound.value)
  const upperText = formatNumber(upperBound.value)
  const valueText = formatNumber(value)
  const tex = `\\int_{${lowerText}}^{${upperText}} ${sourceTex.value}\\,d${variableTex} \\approx ${valueText}`

  return ok({
    content: valueText,
    operation: 'definite-integral',
    tex,
    value,
  })
}
