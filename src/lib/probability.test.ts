import { describe, expect, it } from 'vitest'
import { analyzeProbability } from './probability'

describe('probability', () => {
  it('shows probability as a simplified fraction, decimal, and percent', () => {
    const result = analyzeProbability({
      version: 1,
      favorableOutcomes: '3',
      totalOutcomes: '8',
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.numerator).toBe(3)
      expect(result.denominator).toBe(8)
      expect(result.decimal).toBe('0.375')
      expect(result.percent).toBe('37.5%')
    }
  })

  it('simplifies fractions before display', () => {
    const result = analyzeProbability({
      version: 1,
      favorableOutcomes: '6',
      totalOutcomes: '8',
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.numerator).toBe(3)
      expect(result.denominator).toBe(4)
      expect(result.decimal).toBe('0.75')
      expect(result.percent).toBe('75%')
    }
  })

  it('rejects zero total outcomes', () => {
    expect(
      analyzeProbability({
        version: 1,
        favorableOutcomes: '0',
        totalOutcomes: '0',
      }),
    ).toEqual({
      message: 'Total outcomes must be greater than zero.',
      ok: false,
    })
  })

  it('rejects favorable outcomes greater than total outcomes', () => {
    expect(
      analyzeProbability({
        version: 1,
        favorableOutcomes: '9',
        totalOutcomes: '8',
      }),
    ).toEqual({
      message: 'Favorable outcomes cannot be greater than total outcomes.',
      ok: false,
    })
  })
})
