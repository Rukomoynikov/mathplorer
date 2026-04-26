import { rationalize, type MathNode } from 'mathjs'
import {
  differentiateExpression,
  evaluateExpression,
  normalizeExpressionText,
  parseExpression,
  simplifyExpression,
  type MathEngineErrorKind,
  type MathEngineResult,
  type NumericScope,
  type ParsedExpression,
} from './mathEngine'

export type AlgebraOperation =
  | 'differentiate'
  | 'expand'
  | 'simplify'
  | 'substitute'

export type AlgebraFormulaResult = {
  content: string
  operation: AlgebraOperation
}

export type ParsedSubstitution = {
  input: string
  value: number
  valueExpression: string
  variable: string
}

type FormulaExpressionSource = {
  expression: MathNode
  input: string
  normalized: string
}

const SCOPE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

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

function toFormulaResult(
  operation: AlgebraOperation,
  result: MathEngineResult<ParsedExpression>,
): MathEngineResult<AlgebraFormulaResult> {
  return result.ok
    ? ok({ content: result.value.text, operation })
    : result
}

function toNumericScope(substitution: ParsedSubstitution): NumericScope {
  return {
    [substitution.variable]: substitution.value,
  }
}

export function parseSubstitution(
  input: string,
): MathEngineResult<ParsedSubstitution> {
  const normalized = normalizeExpressionText(input)
  const match = normalized.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/)

  if (!match) {
    return error(
      'parse-error',
      input,
      normalized,
      'Use a substitution like x = 2.',
    )
  }

  const [, variable, rawValueExpression] = match
  const valueExpression = rawValueExpression.trim()

  if (!SCOPE_NAME_PATTERN.test(variable)) {
    return error(
      'invalid-scope',
      input,
      normalized,
      `Variable "${variable}" is not a valid symbol name.`,
    )
  }

  const evaluatedValue = evaluateExpression(valueExpression)

  if (!evaluatedValue.ok) {
    return evaluatedValue
  }

  return ok({
    input,
    value: evaluatedValue.value,
    valueExpression,
    variable,
  })
}

export function simplifyFormula(
  content: string,
): MathEngineResult<AlgebraFormulaResult> {
  const source = parseFormulaExpression(content)

  if (!source.ok) {
    return source
  }

  return toFormulaResult('simplify', simplifyExpression(source.value.expression))
}

export function expandFormula(
  content: string,
): MathEngineResult<AlgebraFormulaResult> {
  const source = parseFormulaExpression(content)

  if (!source.ok) {
    return source
  }

  try {
    const expanded = rationalize(source.value.expression)

    return ok({
      content: expanded.toString(),
      operation: 'expand',
    })
  } catch (caughtError) {
    return error(
      'unsupported-expression',
      source.value.input,
      source.value.normalized,
      getErrorMessage(caughtError),
    )
  }
}

export function differentiateFormula(
  content: string,
  variable = 'x',
): MathEngineResult<AlgebraFormulaResult> {
  const source = parseFormulaExpression(content)

  if (!source.ok) {
    return source
  }

  return toFormulaResult(
    'differentiate',
    differentiateExpression(source.value.expression, variable),
  )
}

export function substituteFormula(
  content: string,
  substitutionInput: string,
): MathEngineResult<AlgebraFormulaResult> {
  const substitution = parseSubstitution(substitutionInput)

  if (!substitution.ok) {
    return substitution
  }

  const source = parseFormulaExpression(content)

  if (!source.ok) {
    return source
  }

  return toFormulaResult(
    'substitute',
    simplifyExpression(source.value.expression, toNumericScope(substitution.value)),
  )
}
