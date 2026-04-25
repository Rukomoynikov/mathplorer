import { useMemo } from 'react'
import { compile } from 'mathjs'
import BlockEditorShell from './BlockEditorShell'

type GraphBlockProps = {
  content: string
  onChange: (content: string) => void
}

type PlotPoint = {
  x: number
  y: number
}

type PlotResult =
  | {
      expression: string
      segments: PlotPoint[][]
      xTicks: number[]
      yMax: number
      yMin: number
      yTicks: number[]
    }
  | {
      error: string
      expression?: string
    }

type ExtractExpressionResult =
  | {
      expression: string
    }
  | {
      error: string
    }

type CompiledExpression = {
  evaluate: (scope: { x: number }) => unknown
}

const X_MIN = -10
const X_MAX = 10
const SAMPLE_COUNT = 401
const SVG_HEIGHT = 360
const SVG_WIDTH = 640
const PADDING = 42
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
    return {
      error: 'Type a function like y = x^2 - 4*x + 3 to see its graph.',
    }
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

function createPlot(rawInput: string): PlotResult {
  const extracted = extractExpression(rawInput)

  if ('error' in extracted) {
    return extracted
  }

  const expression = extracted.expression

  if (!expression) {
    return {
      error: 'Type a function like y = x^2 - 4*x + 3 to see its graph.',
    }
  }

  let compiledExpression: CompiledExpression

  try {
    compiledExpression = compile(expression) as CompiledExpression
  } catch {
    return {
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
      error: 'The function is valid, but its visible points are outside the graph window.',
      expression,
    }
  }

  return {
    expression,
    segments,
    xTicks: [-10, -5, 0, 5, 10],
    yMax,
    yMin,
    yTicks: buildYTicks(yMin, yMax),
  }
}

function formatTick(value: number) {
  if (Math.abs(value) >= 100 || Number.isInteger(value)) {
    return String(Math.round(value))
  }

  return value.toFixed(1)
}

function GraphPreview({ plot }: { plot: PlotResult }) {
  if ('error' in plot) {
    return (
      <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-950">Cannot graph yet</p>
        <p className="mt-1 text-sm leading-6 text-amber-900">{plot.error}</p>
        {plot.expression && (
          <code className="mt-3 inline-flex rounded bg-white px-2 py-1 font-mono text-xs text-amber-950">
            {plot.expression}
          </code>
        )}
      </div>
    )
  }

  const graphWidth = SVG_WIDTH - PADDING * 2
  const graphHeight = SVG_HEIGHT - PADDING * 2
  const ySpan = plot.yMax - plot.yMin
  const scaleX = (x: number) => PADDING + ((x - X_MIN) / (X_MAX - X_MIN)) * graphWidth
  const scaleY = (y: number) =>
    PADDING + ((plot.yMax - y) / ySpan) * graphHeight
  const xAxisY = plot.yMin <= 0 && plot.yMax >= 0 ? scaleY(0) : null
  const yAxisX = X_MIN <= 0 && X_MAX >= 0 ? scaleX(0) : null
  const segmentPaths = plot.segments.map((segment) =>
    segment
      .map((point, index) => {
        const command = index === 0 ? 'M' : 'L'
        return `${command} ${scaleX(point.x).toFixed(2)} ${scaleY(point.y).toFixed(2)}`
      })
      .join(' '),
  )

  return (
    <div className="mt-3 overflow-hidden rounded-md border border-slate-200 bg-white">
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        role="img"
        aria-label={`Graph of y = ${plot.expression} from x equals -10 to 10`}
        className="h-auto w-full"
      >
        <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="#ffffff" />

        {plot.xTicks.map((tick) => (
          <g key={`x-${tick}`}>
            <line
              x1={scaleX(tick)}
              x2={scaleX(tick)}
              y1={PADDING}
              y2={SVG_HEIGHT - PADDING}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
            <text
              x={scaleX(tick)}
              y={SVG_HEIGHT - 14}
              fill="#64748b"
              fontSize="12"
              textAnchor="middle"
            >
              {tick}
            </text>
          </g>
        ))}

        {plot.yTicks.map((tick) => (
          <g key={`y-${tick}`}>
            <line
              x1={PADDING}
              x2={SVG_WIDTH - PADDING}
              y1={scaleY(tick)}
              y2={scaleY(tick)}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
            <text
              x={PADDING - 10}
              y={scaleY(tick) + 4}
              fill="#64748b"
              fontSize="12"
              textAnchor="end"
            >
              {formatTick(tick)}
            </text>
          </g>
        ))}

        {xAxisY !== null && (
          <line
            x1={PADDING}
            x2={SVG_WIDTH - PADDING}
            y1={xAxisY}
            y2={xAxisY}
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
        )}

        {yAxisX !== null && (
          <line
            x1={yAxisX}
            x2={yAxisX}
            y1={PADDING}
            y2={SVG_HEIGHT - PADDING}
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
        )}

        {segmentPaths.map((path, index) => (
          <path
            key={`${path.slice(0, 24)}-${index}`}
            d={path}
            fill="none"
            stroke="#0f766e"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
        ))}
      </svg>
      <div className="border-t border-slate-100 px-3 py-2">
        <code className="font-mono text-xs text-slate-600">
          y = {plot.expression}
        </code>
      </div>
    </div>
  )
}

export default function GraphBlock({ content, onChange }: GraphBlockProps) {
  const plot = useMemo(() => createPlot(content), [content])

  return (
    <BlockEditorShell
      label="Function"
      helperText="Graph blocks support functions of x over -10 <= x <= 10, including sin, cos, tan, sqrt, abs, and log."
      output={
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            Graph preview
          </p>
          <GraphPreview plot={plot} />
        </div>
      }
    >
      <textarea
        value={content}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        placeholder="y = x^2 - 4x + 3"
        className="min-h-28 rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm leading-6 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
      />
    </BlockEditorShell>
  )
}
