import { compile } from 'mathjs'

export type PlotPoint = {
  x: number
  y: number
}

export type PlotResult =
  | {
      kind: 'empty'
      message: string
    }
  | {
      error: string
      expression?: string
      kind: 'error'
    }
  | {
      expression: string
      kind: 'plot'
      segments: PlotPoint[][]
      xTicks: number[]
      yMax: number
      yMin: number
      yTicks: number[]
    }

type ExtractExpressionResult =
  | {
      expression: string
    }
  | {
      error: string
    }
  | {
      empty: true
    }

type CompiledExpression = {
  evaluate: (scope: { x: number }) => unknown
}

export const X_MIN = -10
export const X_MAX = 10
export const SVG_HEIGHT = 360
export const SVG_WIDTH = 640
export const PADDING = 42

const SAMPLE_COUNT = 401
const MAX_ABSOLUTE_Y = 10_000

function normalizeInput(rawInput: string) {
  const trimmed = rawInput.trim()

  if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
    return trimmed.slice(2, -2).trim()
  }

  if (trimmed.startsWith('\\[') && trimmed.endsWith('\\]')) {
    return trimmed.slice(2, -2).trim()
  }

  return trimmed
}

function extractExpression(rawInput: string): ExtractExpressionResult {
  const normalized = normalizeInput(rawInput)

  if (!normalized) {
    return { empty: true }
  }

  const yMatch = normalized.match(/^y\s*=\s*(.+)$/i)

  if (yMatch?.[1]) {
    return { expression: yMatch[1].trim() }
  }

  const functionMatch = normalized.match(/^[a-z]\s*\(\s*x\s*\)\s*=\s*(.+)$/i)

  if (functionMatch?.[1]) {
    return { expression: functionMatch[1].trim() }
  }

  if (normalized.includes('=')) {
    return {
      error: 'Graph blocks support functions of x. Try y = x^2 - 4*x + 3.',
    }
  }

  return { expression: normalized }
}

function percentile(sortedValues: number[], percent: number) {
  const index = Math.round((sortedValues.length - 1) * percent)
  return sortedValues[Math.min(sortedValues.length - 1, Math.max(0, index))]
}

function getYDomain(values: number[]) {
  const sortedValues = [...values].sort((left, right) => left - right)
  const fullMin = Math.min(0, sortedValues[0])
  const fullMax = Math.max(0, sortedValues[sortedValues.length - 1])
  const fullSpan = fullMax - fullMin
  const lowPercentile = percentile(sortedValues, 0.02)
  const highPercentile = percentile(sortedValues, 0.98)
  const percentileSpan = highPercentile - lowPercentile

  let yMin = fullMin
  let yMax = fullMax

  if (fullSpan > 1_000 && percentileSpan > 0 && percentileSpan < fullSpan / 2) {
    yMin = Math.min(0, lowPercentile)
    yMax = Math.max(0, highPercentile)
  }

  if (yMin === yMax) {
    yMin -= 1
    yMax += 1
  }

  const padding = (yMax - yMin) * 0.08

  return {
    yMax: yMax + padding,
    yMin: yMin - padding,
  }
}

function niceStep(span: number) {
  const roughStep = span / 4
  const magnitude = 10 ** Math.floor(Math.log10(roughStep))
  const normalized = roughStep / magnitude

  if (normalized >= 5) {
    return 5 * magnitude
  }

  if (normalized >= 2) {
    return 2 * magnitude
  }

  return magnitude
}

function buildYTicks(yMin: number, yMax: number) {
  const step = niceStep(yMax - yMin)
  const ticks: number[] = []
  const firstTick = Math.ceil(yMin / step) * step

  for (let tick = firstTick; tick <= yMax; tick += step) {
    ticks.push(Number(tick.toFixed(8)))
  }

  return ticks.slice(0, 7)
}

export function createPlot(rawInput: string): PlotResult {
  const extracted = extractExpression(rawInput)

  if ('empty' in extracted) {
    return {
      kind: 'empty',
      message: 'Type a function like y = x^2 - 4*x + 3 to see its graph.',
    }
  }

  if ('error' in extracted) {
    return {
      kind: 'error',
      error: extracted.error,
    }
  }

  const expression = extracted.expression

  if (!expression) {
    return {
      kind: 'empty',
      message: 'Type a function like y = x^2 - 4*x + 3 to see its graph.',
    }
  }

  let compiledExpression: CompiledExpression

  try {
    compiledExpression = compile(expression) as CompiledExpression
  } catch {
    return {
      kind: 'error',
      error: 'I could not parse that function. Try y = x^2 - 4*x + 3.',
      expression,
    }
  }

  const sampledPoints: Array<PlotPoint | null> = []

  for (let index = 0; index < SAMPLE_COUNT; index += 1) {
    const x = X_MIN + ((X_MAX - X_MIN) * index) / (SAMPLE_COUNT - 1)

    try {
      const value = compiledExpression.evaluate({ x })

      if (
        typeof value === 'number' &&
        Number.isFinite(value) &&
        Math.abs(value) <= MAX_ABSOLUTE_Y
      ) {
        sampledPoints.push({ x, y: value })
      } else {
        sampledPoints.push(null)
      }
    } catch {
      sampledPoints.push(null)
    }
  }

  const validPoints = sampledPoints.filter((point): point is PlotPoint =>
    Boolean(point),
  )

  if (validPoints.length < 2) {
    return {
      kind: 'error',
      error:
        'I could not find enough real y-values to plot. Check that the function uses x and supported functions like sin, cos, sqrt, abs, or log.',
      expression,
    }
  }

  const { yMin, yMax } = getYDomain(validPoints.map((point) => point.y))
  const ySpan = yMax - yMin
  const segments: PlotPoint[][] = []
  let currentSegment: PlotPoint[] = []
  let previousPoint: PlotPoint | null = null

  for (const point of sampledPoints) {
    const pointIsInView =
      point && point.y >= yMin - ySpan * 0.05 && point.y <= yMax + ySpan * 0.05
    const pointJumpsTooFar =
      point && previousPoint && Math.abs(point.y - previousPoint.y) > ySpan * 0.65

    if (!point || !pointIsInView || pointJumpsTooFar) {
      if (currentSegment.length > 1) {
        segments.push(currentSegment)
      }

      currentSegment = []
      previousPoint = null
      continue
    }

    currentSegment.push(point)
    previousPoint = point
  }

  if (currentSegment.length > 1) {
    segments.push(currentSegment)
  }

  if (segments.length === 0) {
    return {
      kind: 'error',
      error: 'The function is valid, but its visible points are outside the graph window.',
      expression,
    }
  }

  return {
    kind: 'plot',
    expression,
    segments,
    xTicks: [-10, -5, 0, 5, 10],
    yMax,
    yMin,
    yTicks: buildYTicks(yMin, yMax),
  }
}

export function formatGraphTick(value: number) {
  if (Math.abs(value) >= 100 || Number.isInteger(value)) {
    return String(Math.round(value))
  }

  return value.toFixed(1)
}
