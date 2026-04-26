import { describe, expect, it } from 'vitest'
import {
  createDerivativePreview,
  createTangentLineFormula,
  differentiateCalculusFormula,
  evaluateDerivativeAtPointFormula,
  integrateDefiniteFormula,
} from './calculusTools'
import { evaluateExpression, type MathEngineResult } from './mathEngine'

function expectOk<T>(result: MathEngineResult<T>) {
  expect(result.ok).toBe(true)

  if (!result.ok) {
    throw new Error(result.error.message)
  }

  return result.value
}

describe('calculusTools', () => {
  it('differentiates x^3 with respect to x', () => {
    const result = expectOk(differentiateCalculusFormula('x^3', 'x'))

    expect(result.content).toBe('3 * x ^ 2')
    expect(expectOk(evaluateExpression(result.content, { x: 2 }))).toBe(12)
  })

  it('differentiates sin(x)', () => {
    const result = expectOk(differentiateCalculusFormula('sin(x)', 'x'))

    expect(result.content).toBe('cos(x)')
  })

  it('returns a symbolic derivative preview in TeX', () => {
    const preview = expectOk(createDerivativePreview('f(x) = x^3', 'x'))

    expect(preview.derivativeText).toBe('3 * x ^ 2')
    expect(preview.derivativeTex).toContain('3')
    expect(preview.sourceTex).toContain('x')
  })

  it('evaluates a derivative at a point', () => {
    const result = expectOk(evaluateDerivativeAtPointFormula('x^3', 'x', '2'))

    expect(result.content).toBe('12')
    expect(result.value).toBe(12)
    expect(result.tex).toContain('12')
    expectOk(createDerivativePreview(result.content, 'x'))
  })

  it('creates the tangent line to x^2 at x = 2', () => {
    const result = expectOk(createTangentLineFormula('x^2', 'x', '2'))
    const lineExpression = result.content.replace(/^y\s*=\s*/, '')

    expect(result.content).toBe('y = 4 * x - 4')
    expect(expectOk(evaluateExpression(lineExpression, { x: 2 }))).toBe(4)
    expect(expectOk(evaluateExpression(lineExpression, { x: 3 }))).toBe(8)
  })

  it('numerically integrates x from 0 to 1', () => {
    const result = expectOk(integrateDefiniteFormula('x', 'x', '0', '1'))

    expect(result.content).toBe('0.5')
    expect(result.value).toBeCloseTo(0.5)
    expect(result.tex).toContain('0.5')
    expectOk(createDerivativePreview(result.content, 'x'))
  })
})
