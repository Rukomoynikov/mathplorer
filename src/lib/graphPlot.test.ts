import { describe, expect, it } from 'vitest'
import { createPlot, type PlotResult } from './graphPlot'

type Plot = Extract<PlotResult, { kind: 'plot' }>

function expectPlot(input: string): Plot {
  const plot = createPlot(input)

  expect(plot.kind).toBe('plot')

  if (plot.kind !== 'plot') {
    throw new Error('Expected graph input to produce a plot.')
  }

  return plot
}

function hasPointNear(
  points: Array<{ point: { x: number; y: number } }>,
  x: number,
  y: number,
  tolerance = 0.01,
) {
  return points.some(
    (feature) =>
      Math.abs(feature.point.x - x) <= tolerance &&
      Math.abs(feature.point.y - y) <= tolerance,
  )
}

describe('graphPlot analysis', () => {
  it('finds approximate intercepts for x^2 - 4', () => {
    const plot = expectPlot('y = x^2 - 4')

    expect(hasPointNear(plot.analysis.xIntercepts, -2, 0)).toBe(true)
    expect(hasPointNear(plot.analysis.xIntercepts, 2, 0)).toBe(true)
    expect(hasPointNear(plot.analysis.yIntercepts, 0, -4)).toBe(true)
  })

  it('finds approximate intersections between x and x^2', () => {
    const plot = expectPlot('y = x\ny = x^2')

    expect(hasPointNear(plot.analysis.intersections, 0, 0)).toBe(true)
    expect(hasPointNear(plot.analysis.intersections, 1, 1)).toBe(true)
  })

  it('finds an approximate minimum for x^2', () => {
    const plot = expectPlot('y = x^2')

    expect(
      plot.analysis.extrema.some(
        (feature) =>
          feature.kind === 'minimum' &&
          Math.abs(feature.point.x) <= 0.01 &&
          Math.abs(feature.point.y) <= 0.01,
      ),
    ).toBe(true)
  })

  it('warns about a discontinuity in 1/x', () => {
    const plot = expectPlot('y = 1 / x')

    expect(
      plot.analysis.warnings.some((warning) => Math.abs(warning.x) <= 0.05),
    ).toBe(true)
    expect(
      plot.warnings.some((warning) =>
        /discontinuity|vertical asymptote/i.test(warning.message),
      ),
    ).toBe(true)
  })
})
