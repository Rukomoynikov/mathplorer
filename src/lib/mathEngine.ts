import { derivative, parse, simplify, type MathNode } from 'mathjs'

export type MathEngineErrorKind =
  | 'empty-expression'
  | 'evaluation-error'
  | 'invalid-scope'
  | 'parse-error'
  | 'unsupported-expression'

export type MathEngineError = {
  input: string
  kind: MathEngineErrorKind
  message: string
  normalized: string
  position?: number
}

export type MathEngineResult<T> =
  | {
      ok: true
      value: T
    }
  | {
      error: MathEngineError
      ok: false
    }

export type ParsedExpression = {
  ast: MathNode
  input: string
  normalized: string
  tex: string
  text: string
}

export type NumericScope = Record<string, number>

export type ExpressionInput = MathNode | ParsedExpression | string

const DEFAULT_NUMERIC_SCOPE: NumericScope = {
  e: Math.E,
  pi: Math.PI,
  tau: Math.PI * 2,
}

const BLOCKED_EVALUATION_NODE_TYPES = new Set([
  'AccessorNode',
  'AssignmentNode',
  'BlockNode',
  'FunctionAssignmentNode',
  'IndexNode',
  'ObjectNode',
])

const BLOCKED_EVALUATION_FUNCTIONS = new Set([
  'createUnit',
  'derivative',
  'evaluate',
  'parse',
  'pickRandom',
  'random',
  'randomInt',
  'simplify',
])

const SCOPE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

function ok<T>(value: T): MathEngineResult<T> {
  return { ok: true, value }
}

function error<T>(
  kind: MathEngineErrorKind,
  input: string,
  normalized: string,
  message: string,
  position?: number,
): MathEngineResult<T> {
  return {
    error: {
      input,
      kind,
      message,
      normalized,
      position,
    },
    ok: false,
  }
}

function getErrorMessage(caughtError: unknown) {
  return caughtError instanceof Error ? caughtError.message : String(caughtError)
}

function getErrorPosition(caughtError: unknown) {
  if (
    caughtError &&
    typeof caughtError === 'object' &&
    'char' in caughtError &&
    typeof caughtError.char === 'number'
  ) {
    return caughtError.char
  }

  return undefined
}

function createParsedExpression(
  ast: MathNode,
  input: string,
  normalized: string,
): ParsedExpression {
  return {
    ast,
    input,
    normalized,
    tex: ast.toTex(),
    text: ast.toString(),
  }
}

function isParsedExpression(input: ExpressionInput): input is ParsedExpression {
  return (
    typeof input === 'object' &&
    input !== null &&
    'ast' in input &&
    'normalized' in input &&
    'tex' in input &&
    'text' in input
  )
}

function isMathNode(input: ExpressionInput): input is MathNode {
  return (
    typeof input === 'object' &&
    input !== null &&
    'isNode' in input &&
    input.isNode === true
  )
}

function toParsedExpression(input: ExpressionInput): MathEngineResult<ParsedExpression> {
  if (typeof input === 'string') {
    return parseExpression(input)
  }

  if (isParsedExpression(input)) {
    return ok(input)
  }

  if (isMathNode(input)) {
    const text = input.toString()
    return ok(createParsedExpression(input, text, text))
  }

  return error(
    'parse-error',
    String(input),
    String(input),
    'Expression input must be a string or mathjs node.',
  )
}

function createSafeScope(scope: NumericScope = {}) {
  const safeScope = new Map<string, number>()

  for (const [name, value] of Object.entries({
    ...DEFAULT_NUMERIC_SCOPE,
    ...scope,
  })) {
    if (!SCOPE_NAME_PATTERN.test(name)) {
      return error<Map<string, number>>(
        'invalid-scope',
        name,
        name,
        `Scope name "${name}" is not a valid variable name.`,
      )
    }

    if (!Number.isFinite(value)) {
      return error<Map<string, number>>(
        'invalid-scope',
        name,
        name,
        `Scope value for "${name}" must be a finite number.`,
      )
    }

    safeScope.set(name, value)
  }

  return ok(safeScope)
}

function getFunctionNodeName(node: MathNode) {
  if (
    node.type === 'FunctionNode' &&
    'fn' in node &&
    node.fn &&
    typeof node.fn === 'object' &&
    'name' in node.fn &&
    typeof node.fn.name === 'string'
  ) {
    return node.fn.name
  }

  return null
}

function findBlockedEvaluationReason(ast: MathNode) {
  const blockedNode = ast.filter((node) => {
    if (BLOCKED_EVALUATION_NODE_TYPES.has(node.type)) {
      return true
    }

    const functionName = getFunctionNodeName(node)

    if (functionName && BLOCKED_EVALUATION_FUNCTIONS.has(functionName)) {
      return true
    }

    return (
      node.type === 'ConstantNode' &&
      'value' in node &&
      typeof node.value === 'string'
    )
  })[0]

  if (!blockedNode) {
    return null
  }

  const functionName = getFunctionNodeName(blockedNode)

  if (functionName) {
    return `Function "${functionName}" cannot be evaluated numerically.`
  }

  if (
    blockedNode.type === 'ConstantNode' &&
    'value' in blockedNode &&
    typeof blockedNode.value === 'string'
  ) {
    return 'String constants cannot be evaluated numerically.'
  }

  return `Expressions with ${blockedNode.type} cannot be evaluated numerically.`
}

export function normalizeExpressionText(input: string) {
  const trimmed = input.trim().replace(/−/g, '-')
  const wrappers: Array<[string, string]> = [
    ['$$', '$$'],
    ['\\[', '\\]'],
    ['\\(', '\\)'],
  ]

  for (const [opening, closing] of wrappers) {
    if (trimmed.startsWith(opening) && trimmed.endsWith(closing)) {
      return trimmed.slice(opening.length, -closing.length).trim()
    }
  }

  return trimmed
}

export function parseExpression(input: string): MathEngineResult<ParsedExpression> {
  const normalized = normalizeExpressionText(input)

  if (!normalized) {
    return error(
      'empty-expression',
      input,
      normalized,
      'Enter an expression to parse.',
    )
  }

  try {
    return ok(createParsedExpression(parse(normalized), input, normalized))
  } catch (caughtError) {
    return error(
      'parse-error',
      input,
      normalized,
      getErrorMessage(caughtError),
      getErrorPosition(caughtError),
    )
  }
}

export function expressionToPlainText(
  input: ExpressionInput,
): MathEngineResult<string> {
  const parsed = toParsedExpression(input)

  return parsed.ok ? ok(parsed.value.text) : parsed
}

export function expressionToTex(input: ExpressionInput): MathEngineResult<string> {
  const parsed = toParsedExpression(input)

  return parsed.ok ? ok(parsed.value.tex) : parsed
}

export function simplifyExpression(
  input: ExpressionInput,
  scope?: NumericScope,
): MathEngineResult<ParsedExpression> {
  const parsed = toParsedExpression(input)

  if (!parsed.ok) {
    return parsed
  }

  try {
    const safeScope = scope ? createSafeScope(scope) : null

    if (safeScope && !safeScope.ok) {
      return safeScope
    }

    const simplified = safeScope
      ? simplify(parsed.value.ast, safeScope.value)
      : simplify(parsed.value.ast)

    return ok(
      createParsedExpression(
        simplified,
        parsed.value.input,
        parsed.value.normalized,
      ),
    )
  } catch (caughtError) {
    return error(
      'unsupported-expression',
      parsed.value.input,
      parsed.value.normalized,
      getErrorMessage(caughtError),
    )
  }
}

export function differentiateExpression(
  input: ExpressionInput,
  variable = 'x',
): MathEngineResult<ParsedExpression> {
  const parsed = toParsedExpression(input)

  if (!parsed.ok) {
    return parsed
  }

  if (!SCOPE_NAME_PATTERN.test(variable)) {
    return error(
      'invalid-scope',
      parsed.value.input,
      parsed.value.normalized,
      `Variable "${variable}" is not a valid symbol name.`,
    )
  }

  try {
    const differentiated = derivative(parsed.value.ast, variable)

    return ok(
      createParsedExpression(
        differentiated,
        parsed.value.input,
        parsed.value.normalized,
      ),
    )
  } catch (caughtError) {
    return error(
      'unsupported-expression',
      parsed.value.input,
      parsed.value.normalized,
      getErrorMessage(caughtError),
    )
  }
}

export function evaluateExpression(
  input: ExpressionInput,
  scope: NumericScope = {},
): MathEngineResult<number> {
  const parsed = toParsedExpression(input)

  if (!parsed.ok) {
    return parsed
  }

  const blockedReason = findBlockedEvaluationReason(parsed.value.ast)

  if (blockedReason) {
    return error(
      'unsupported-expression',
      parsed.value.input,
      parsed.value.normalized,
      blockedReason,
    )
  }

  const safeScope = createSafeScope(scope)

  if (!safeScope.ok) {
    return safeScope
  }

  try {
    const value = parsed.value.ast.evaluate(safeScope.value)

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return error(
        'evaluation-error',
        parsed.value.input,
        parsed.value.normalized,
        'Expression did not evaluate to a finite number.',
      )
    }

    return ok(Math.abs(value) < 1e-12 ? 0 : value)
  } catch (caughtError) {
    return error(
      'evaluation-error',
      parsed.value.input,
      parsed.value.normalized,
      getErrorMessage(caughtError),
    )
  }
}
