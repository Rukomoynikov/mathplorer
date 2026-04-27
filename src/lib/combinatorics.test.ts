import { describe, expect, it } from 'vitest'
import {
  calculateCombinatorics,
  formatBigInt,
  type CombinatoricsBlockContent,
} from './combinatorics'

function calculate(content: Partial<CombinatoricsBlockContent>) {
  return calculateCombinatorics({
    version: 1,
    mode: 'combination',
    n: '5',
    r: '2',
    ...content,
  })
}

describe('combinatorics', () => {
  it('calculates factorials exactly', () => {
    const result = calculate({ mode: 'factorial', n: '5' })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.result).toBe(120n)
      expect(result.formula).toBe('5!')
    }
  })

  it('calculates permutations exactly', () => {
    const result = calculate({ mode: 'permutation', n: '5', r: '2' })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.result).toBe(20n)
      expect(result.resultLabel).toBe('P(5, 2)')
    }
  })

  it('calculates combinations exactly', () => {
    const result = calculate({ mode: 'combination', n: '5', r: '2' })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.result).toBe(10n)
      expect(result.resultLabel).toBe('C(5, 2)')
    }
  })

  it('rejects impossible choices', () => {
    const result = calculate({ mode: 'combination', n: '3', r: '5' })

    expect(result).toEqual({
      message: 'r must be less than or equal to n.',
      ok: false,
    })
  })

  it('formats large exact values with separators', () => {
    expect(formatBigInt(1234567890n)).toBe('1,234,567,890')
  })
})
