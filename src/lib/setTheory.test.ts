import { describe, expect, it } from 'vitest'
import {
  analyzeSetOperations,
  formatFiniteSet,
  parseFiniteSet,
} from './setTheory'

describe('setTheory', () => {
  it('parses finite sets, removes duplicates, and preserves first-seen order', () => {
    const parsed = parseFiniteSet('{ apples, bananas; apples\ncherries }', 'Set A')

    expect(parsed.items).toEqual(['apples', 'bananas', 'cherries'])
    expect(parsed.warnings).toEqual(['Set A: ignored duplicate entry apples.'])
  })

  it('ignores blank entries without failing the set operations', () => {
    const analysis = analyzeSetOperations('1, 2,, 3,', '3; 4')

    expect(analysis.union).toEqual(['1', '2', '3', '4'])
    expect(analysis.warnings).toContain('Set A: ignored 2 blank entries.')
  })

  it('computes core two-set operations', () => {
    const analysis = analyzeSetOperations('1, 2, 3', '3, 4')

    expect(analysis.intersection).toEqual(['3'])
    expect(analysis.differenceAB).toEqual(['1', '2'])
    expect(analysis.differenceBA).toEqual(['4'])
    expect(analysis.symmetricDifference).toEqual(['1', '2', '4'])
  })

  it('formats the empty set clearly', () => {
    expect(formatFiniteSet([])).toBe('∅')
    expect(formatFiniteSet(['a', 'b'])).toBe('{ a, b }')
  })
})
