import { describe, expect, it } from 'vitest'
import {
  differentiateExpression,
  evaluateExpression,
  expressionToPlainText,
  expressionToTex,
  parseExpression,
  simplifyExpression,
  type MathEngineResult,
} from './mathEngine'

function expectOk<T>(result: MathEngineResult<T>) {
  expect(result.ok).toBe(true)

  if (!result.ok) {
    throw new Error(result.error.message)
  }

  return result.value
}

describe('mathEngine', () => {
  it('parses valid expressions and normalizes formula wrappers', () => {
    const parsed = expectOk(parseExpression('  $$ x^2 - 4x + 3 $$  '))

    expect(parsed.normalized).toBe('x^2 - 4x + 3')
    expect(parsed.text).toContain('x ^ 2')
    expect(parsed.tex).toContain('x')
  })

  it('round-trips x^2 - 4x + 3 through AST plain text and TeX output', () => {
    const parsed = expectOk(parseExpression('x^2 - 4x + 3'))
    const plainText = expectOk(expressionToPlainText(parsed))
    const tex = expectOk(expressionToTex(parsed))
    const reparsed = expectOk(parseExpression(plainText))

    expect(tex).toContain('x')
    expect(expectOk(evaluateExpression(parsed, { x: 2 }))).toBe(-1)
    expect(expectOk(evaluateExpression(reparsed, { x: 2 }))).toBe(-1)
  })

  it('evaluates sin(pi / 2) to 1 with the safe numeric scope', () => {
    const value = expectOk(evaluateExpression('sin(pi / 2)'))

    expect(value).toBeCloseTo(1)
  })

  it('simplifies and differentiates parsed expressions', () => {
    const simplified = expectOk(simplifyExpression('x + x'))
    const derivative = expectOk(differentiateExpression('x^2 - 4x + 3'))

    expect(simplified.text).toBe('2 * x')
    expect(derivative.text).toBe('2 * x - 4')
  })

  it('returns structured errors for malformed expressions', () => {
    const result = parseExpression('x^2 +')

    expect(result.ok).toBe(false)

    if (!result.ok) {
      expect(result.error.kind).toBe('parse-error')
      expect(result.error.message).toMatch(/unexpected/i)
      expect(result.error.normalized).toBe('x^2 +')
      expect(result.error.position).toBeGreaterThan(0)
    }
  })

  it('does not numerically evaluate mutating expressions', () => {
    const result = evaluateExpression('y = x^2', { x: 2 })

    expect(result.ok).toBe(false)

    if (!result.ok) {
      expect(result.error.kind).toBe('unsupported-expression')
      expect(result.error.message).toContain('AssignmentNode')
    }
  })

  it('does not numerically evaluate string-backed expressions', () => {
    const result = evaluateExpression('evaluate("2 + 2")')

    expect(result.ok).toBe(false)

    if (!result.ok) {
      expect(result.error.kind).toBe('unsupported-expression')
      expect(result.error.message).toMatch(/evaluate|string/i)
    }
  })
})
