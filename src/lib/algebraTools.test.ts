import { describe, expect, it } from 'vitest'
import {
  differentiateFormula,
  expandFormula,
  parseSubstitution,
  simplifyFormula,
  substituteFormula,
  type AlgebraFormulaResult,
} from './algebraTools'
import { evaluateExpression, type MathEngineResult } from './mathEngine'

function expectOk<T>(result: MathEngineResult<T>) {
  expect(result.ok).toBe(true)

  if (!result.ok) {
    throw new Error(result.error.message)
  }

  return result.value
}

describe('algebraTools', () => {
  it('simplifies like terms in a formula', () => {
    const result = expectOk(simplifyFormula('2x + 3x'))

    expect(result).toEqual<AlgebraFormulaResult>({
      content: '5 * x',
      operation: 'simplify',
    })
    expect(expectOk(evaluateExpression(result.content, { x: 2 }))).toBe(10)
  })

  it('expands polynomial powers using rationalization behavior', () => {
    const result = expectOk(expandFormula('(x + 1)^2'))

    expect(result.content).toBe('x ^ 2 + 2 * x + 1')
    expect(expectOk(evaluateExpression(result.content, { x: 3 }))).toBe(16)
  })

  it('differentiates formulas with respect to x', () => {
    const result = expectOk(differentiateFormula('x^2 + 2x + 1'))

    expect(result.operation).toBe('differentiate')
    expect(expectOk(evaluateExpression(result.content, { x: 3 }))).toBe(8)
  })

  it('substitutes finite values and simplifies the result', () => {
    const result = expectOk(substituteFormula('x^2 + 2x + 1', 'x = 3'))

    expect(result).toEqual<AlgebraFormulaResult>({
      content: '16',
      operation: 'substitute',
    })
  })

  it('fails bad substitutions without throwing', () => {
    const malformed = parseSubstitution('x -> 2')
    const nonNumeric = substituteFormula('x^2 + 1', 'x = y')

    expect(malformed.ok).toBe(false)
    expect(nonNumeric.ok).toBe(false)

    if (!malformed.ok) {
      expect(malformed.error.message).toMatch(/substitution/i)
    }

    if (!nonNumeric.ok) {
      expect(nonNumeric.error.kind).toBe('evaluation-error')
    }
  })
})
