import { describe, expect, it } from 'vitest'
import { solveLinearEquation } from './linearSolver'

describe('linearSolver', () => {
  it('solves simple implicit-multiplication equations through the math engine', () => {
    const result = solveLinearEquation('2x + 5 = 17')

    expect(result.kind).toBe('solved')

    if (result.kind === 'solved') {
      expect(result.steps[result.steps.length - 1].equation).toBe('x = 6')
    }
  })

  it('rejects malformed and nonlinear equations', () => {
    expect(solveLinearEquation('2x + = 17').kind).toBe('unsupported')
    expect(solveLinearEquation('x^2 = 4').kind).toBe('unsupported')
  })
})
