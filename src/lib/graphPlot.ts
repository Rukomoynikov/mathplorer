import { compile } from 'mathjs'

export type PlotPoint = {
  x: number
  y: number
}

export type PlotViewport = {
  xMax: number
  xMin: number
  yMax: number
  yMin: number
}

export type PlotWarning = {
  content: string
  line: number
  message: string
}

export type FunctionPlotSeries = {
  color: string
  expression: string
  id: string
  kind: 'function'
  label: string
  segments: PlotPoint[][]
}

export type ParametricPlotSeries = {
  color: string
  id: string
  kind: 'parametric'
  label: string
  segments: PlotPoint[][]
}

export type PointsPlotSeries = {
  color: string
  id: string
  kind: 'points'
  label: string
  points: PlotPoint[]
}

export type PlotSeries =
  | FunctionPlotSeries
  | ParametricPlotSeries
  | PointsPlotSeries

export type PlotResult =
  | {
      kind: 'empty'
      message: string
      warnings: PlotWarning[]
    }
  | {
      error: string
      expression?: string
      kind: 'error'
      warnings: PlotWarning[]
    }
  | {
      kind: 'plot'
      series: PlotSeries[]
      viewport: PlotViewport
      warnings: PlotWarning[]
      xTicks: number[]
      yTicks: number[]
    }

type CreatePlotOptions = {
  viewport?: PlotViewport
}

type ExtractFunctionResult =
  | {
      expression: string
      label: string
    }
  | {
      error: string
    }

type CompiledExpression = {
  evaluate: (scope?: Record<string, number>) => unknown
}

type ParsedSeries =
  | {
      color: string
      expression: string
      evaluate: (scope: { x: number }) => number | null
      id: string
      kind: 'function'
      label: string
      line: number
    }
  | {
      color: string
      id: string
      kind: 'points'
      label: string
      line: number
      points: PlotPoint[]
    }
  | {
      color: string
      evaluate: (scope: { t: number }) => PlotPoint | null
      id: string
      kind: 'parametric'
      label: string
      line: number
      tMax: number
      tMin: number
    }

type SampledSeries =
  | {
      definition: Extract<ParsedSeries, { kind: 'function' }>
      points: Array<PlotPoint | null>
      validPoints: PlotPoint[]
    }
  | {
      definition: Extract<ParsedSeries, { kind: 'points' }>
      points: PlotPoint[]
      validPoints: PlotPoint[]
    }
  | {
      definition: Extract<ParsedSeries, { kind: 'parametric' }>
      points: Array<PlotPoint | null>
      validPoints: PlotPoint[]
    }

export const X_MIN = -10
export const X_MAX = 10
export const SVG_HEIGHT = 360
export const SVG_WIDTH = 640
export const PADDING = 42
export const DEFAULT_VIEWPORT: PlotViewport = {
  xMax: X_MAX,
  xMin: X_MIN,
  yMax: 10,
  yMin: -10,
}

const SAMPLE_COUNT = 501
const PARAMETRIC_SAMPLE_COUNT = 721
const MAX_ABSOLUTE_COORDINATE = 100_000
const SERIES_COLORS = [
  '#0f766e',
  '#2563eb',
  '#db2777',
  '#d97706',
  '#7c3aed',
  '#0891b2',
  '#65a30d',
  '#be123c',
]

function normalizeInput(rawInput: string) {
  const trimmed = rawInput.trim()

  if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
    return trimmed.slice(2, -2).trim()
  }

  if (trimmed.startsWith('\\[') && trimmed.endsWith('\\]')) {
    return trimmed.slice(2, -2).trim()
  }

  return rawInput
}

function createWarning(line: number, content: string, message: string): PlotWarning {
  return {
    content,
    line,
    message,
  }
}

function compileNumeric(expression: string) {
  const compiledExpression = compile(expression) as CompiledExpression

  return (scope: Record<string, number> = {}) => {
    const value = compiledExpression.evaluate({
      e: Math.E,
      pi: Math.PI,
      ...scope,
    })

    return typeof value === 'number' && Number.isFinite(value) ? value : null
  }
}

function evaluateNumericExpression(expression: string) {
  try {
    return compileNumeric(expression)()
  } catch {
    return null
  }
}

function isFiniteCoordinate(value: number) {
  return Number.isFinite(value) && Math.abs(value) <= MAX_ABSOLUTE_COORDINATE
}

function isFinitePoint(point: PlotPoint) {
  return isFiniteCoordinate(point.x) && isFiniteCoordinate(point.y)
}

function getSeriesColor(index: number) {
  return SERIES_COLORS[index % SERIES_COLORS.length]
}

function extractFunction(rawLine: string): ExtractFunctionResult {
  const normalized = rawLine.trim()
  const yMatch = normalized.match(/^y\s*=\s*(.+)$/i)

  if (yMatch?.[1]) {
    const expression = yMatch[1].trim()
    return {
      expression,
      label: `y = ${expression}`,
    }
  }

  const functionMatch = normalized.match(/^([a-z])\s*\(\s*x\s*\)\s*=\s*(.+)$/i)

  if (functionMatch?.[1] && functionMatch[2]) {
    const name = functionMatch[1]
    const expression = functionMatch[2].trim()

    return {
      expression,
      label: `${name}(x) = ${expression}`,
    }
  }

  if (normalized.includes('=')) {
    return {
      error:
        'Use y = ..., points: ..., parametric: ..., or window: ... for graph lines.',
    }
  }

  return {
    expression: normalized,
    label: `y = ${normalized}`,
  }
}

function parsePointPairs(rawPoints: string) {
  const points: PlotPoint[] = []
  const pairPattern = /\(\s*([^,()]+)\s*,\s*([^,()]+)\s*\)/g
  let match: RegExpExecArray | null

  while ((match = pairPattern.exec(rawPoints))) {
    const x = evaluateNumericExpression(match[1])
    const y = evaluateNumericExpression(match[2])

    if (x !== null && y !== null && isFinitePoint({ x, y })) {
      points.push({ x, y })
    }
  }

  return points
}

function parseViewportLine(rawLine: string): PlotViewport | null {
  const body = rawLine.replace(/^\s*window\s*:/i, '')
  const ranges: Partial<PlotViewport> = {}
  const rangePattern = /([xy])\s*=\s*([^,]+?)\s*\.\.\s*([^,]+)/gi
  let match: RegExpExecArray | null

  while ((match = rangePattern.exec(body))) {
    const axis = match[1].toLowerCase()
    const min = evaluateNumericExpression(match[2].trim())
    const max = evaluateNumericExpression(match[3].trim())

    if (min === null || max === null || min >= max) {
      return null
    }

    if (axis === 'x') {
      ranges.xMin = min
      ranges.xMax = max
    } else {
      ranges.yMin = min
      ranges.yMax = max
    }
  }

  if (
    typeof ranges.xMin === 'number' &&
    typeof ranges.xMax === 'number' &&
    typeof ranges.yMin === 'number' &&
    typeof ranges.yMax === 'number'
  ) {
    return {
      xMax: ranges.xMax,
      xMin: ranges.xMin,
      yMax: ranges.yMax,
      yMin: ranges.yMin,
    }
  }

  return null
}

function parseParametricLine(
  rawLine: string,
  line: number,
  color: string,
  id: string,
): ParsedSeries | PlotWarning {
  const body = rawLine.replace(/^\s*parametric\s*:/i, '')
  const assignments = body
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
  let xExpression: string | null = null
  let yExpression: string | null = null
  let tMin: number | null = null
  let tMax: number | null = null

  for (const assignment of assignments) {
    const rangeMatch = assignment.match(/^t\s*=\s*(.+?)\s*\.\.\s*(.+)$/i)

    if (rangeMatch?.[1] && rangeMatch[2]) {
      tMin = evaluateNumericExpression(rangeMatch[1].trim())
      tMax = evaluateNumericExpression(rangeMatch[2].trim())
      continue
    }

    const expressionMatch = assignment.match(/^([xy])\s*=\s*(.+)$/i)

    if (expressionMatch?.[1] && expressionMatch[2]) {
      if (expressionMatch[1].toLowerCase() === 'x') {
        xExpression = expressionMatch[2].trim()
      } else {
        yExpression = expressionMatch[2].trim()
      }
    }
  }

  if (!xExpression || !yExpression || tMin === null || tMax === null || tMin >= tMax) {
    return createWarning(
      line,
      rawLine,
      'Parametric graphs need x = ..., y = ..., and t = start..end.',
    )
  }

  let evaluateX: (scope: { t: number }) => number | null
  let evaluateY: (scope: { t: number }) => number | null

  try {
    evaluateX = compileNumeric(xExpression)
    evaluateY = compileNumeric(yExpression)
  } catch {
    return createWarning(line, rawLine, 'I could not parse that parametric curve.')
  }

  return {
    color,
    evaluate: (scope) => {
      const x = evaluateX(scope)
      const y = evaluateY(scope)

      if (x === null || y === null || !isFinitePoint({ x, y })) {
        return null
      }

      return { x, y }
    },
    id,
    kind: 'parametric',
    label: `x = ${xExpression}, y = ${yExpression}`,
    line,
    tMax,
    tMin,
  }
}

function parseSeriesLines(rawInput: string) {
  const warnings: PlotWarning[] = []
  const series: ParsedSeries[] = []
  let viewport: PlotViewport | null = null

  normalizeInput(rawInput)
    .split(/\r?\n/)
    .forEach((rawLine, lineIndex) => {
      const line = lineIndex + 1
      const trimmedLine = rawLine.trim()

      if (
        !trimmedLine ||
        trimmedLine.startsWith('#') ||
        trimmedLine.startsWith('//')
      ) {
        return
      }

      if (/^window\s*:/i.test(trimmedLine)) {
        const parsedViewport = parseViewportLine(trimmedLine)

        if (parsedViewport) {
          viewport = parsedViewport
        } else {
          warnings.push(
            createWarning(
              line,
              rawLine,
              'Window lines need x=min..max and y=min..max ranges.',
            ),
          )
        }

        return
      }

      const color = getSeriesColor(series.length)
      const id = `series-${line}-${series.length}`

      if (/^points?\s*:/i.test(trimmedLine)) {
        const points = parsePointPairs(trimmedLine.replace(/^points?\s*:/i, ''))

        if (points.length === 0) {
          warnings.push(
            createWarning(
              line,
              rawLine,
              'Point sets need pairs such as points: (-2, 4), (0, 0).',
            ),
          )
          return
        }

        series.push({
          color,
          id,
          kind: 'points',
          label: `points (${points.length})`,
          line,
          points,
        })
        return
      }

      if (/^parametric\s*:/i.test(trimmedLine)) {
        const parsedSeries = parseParametricLine(trimmedLine, line, color, id)

        if ('message' in parsedSeries) {
          warnings.push(parsedSeries)
          return
        }

        series.push(parsedSeries)
        return
      }

      const extracted = extractFunction(trimmedLine)

      if ('error' in extracted) {
        warnings.push(createWarning(line, rawLine, extracted.error))
        return
      }

      try {
        const evaluate = compileNumeric(extracted.expression)

        series.push({
          color,
          evaluate: (scope) => evaluate(scope),
          expression: extracted.expression,
          id,
          kind: 'function',
          label: extracted.label,
          line,
        })
      } catch {
        warnings.push(
          createWarning(
            line,
            rawLine,
            'I could not parse that function. Try y = x^2 - 4*x + 3.',
          ),
        )
      }
    })

  return {
    series,
    viewport,
    warnings,
  }
}

function percentile(sortedValues: number[], percent: number) {
  const index = Math.round((sortedValues.length - 1) * percent)
  return sortedValues[Math.min(sortedValues.length - 1, Math.max(0, index))]
}

function getYDomain(values: number[]) {
  if (values.length === 0) {
    return {
      yMax: DEFAULT_VIEWPORT.yMax,
      yMin: DEFAULT_VIEWPORT.yMin,
    }
  }

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
  if (!Number.isFinite(span) || span <= 0) {
    return 1
  }

  const roughStep = span / 5
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

function buildTicks(min: number, max: number) {
  const step = niceStep(max - min)
  const ticks: number[] = []
  const firstTick = Math.ceil(min / step) * step

  for (
    let tick = firstTick, count = 0;
    tick <= max + step * 0.001 && count < 8;
    tick += step, count += 1
  ) {
    ticks.push(Number(tick.toFixed(10)))
  }

  return ticks
}

function sampleFunction(
  definition: Extract<ParsedSeries, { kind: 'function' }>,
  viewport: Pick<PlotViewport, 'xMax' | 'xMin'>,
): SampledSeries {
  const points: Array<PlotPoint | null> = []
  const validPoints: PlotPoint[] = []

  for (let index = 0; index < SAMPLE_COUNT; index += 1) {
    const x =
      viewport.xMin + ((viewport.xMax - viewport.xMin) * index) / (SAMPLE_COUNT - 1)
    const y = definition.evaluate({ x })
    const point = y !== null && isFiniteCoordinate(y) ? { x, y } : null

    points.push(point)

    if (point) {
      validPoints.push(point)
    }
  }

  return {
    definition,
    points,
    validPoints,
  }
}

function sampleParametric(
  definition: Extract<ParsedSeries, { kind: 'parametric' }>,
): SampledSeries {
  const points: Array<PlotPoint | null> = []
  const validPoints: PlotPoint[] = []

  for (let index = 0; index < PARAMETRIC_SAMPLE_COUNT; index += 1) {
    const t =
      definition.tMin +
      ((definition.tMax - definition.tMin) * index) / (PARAMETRIC_SAMPLE_COUNT - 1)
    const point = definition.evaluate({ t })

    points.push(point)

    if (point) {
      validPoints.push(point)
    }
  }

  return {
    definition,
    points,
    validPoints,
  }
}

function isPointInViewport(point: PlotPoint, viewport: PlotViewport) {
  return (
    point.x >= viewport.xMin &&
    point.x <= viewport.xMax &&
    point.y >= viewport.yMin &&
    point.y <= viewport.yMax
  )
}

function isPointNearViewport(point: PlotPoint, viewport: PlotViewport) {
  const xSpan = viewport.xMax - viewport.xMin
  const ySpan = viewport.yMax - viewport.yMin

  return (
    point.x >= viewport.xMin - xSpan * 0.05 &&
    point.x <= viewport.xMax + xSpan * 0.05 &&
    point.y >= viewport.yMin - ySpan * 0.05 &&
    point.y <= viewport.yMax + ySpan * 0.05
  )
}

function buildSegments(
  sampledPoints: Array<PlotPoint | null>,
  viewport: PlotViewport,
) {
  const xSpan = viewport.xMax - viewport.xMin
  const ySpan = viewport.yMax - viewport.yMin
  const segments: PlotPoint[][] = []
  let currentSegment: PlotPoint[] = []
  let previousPoint: PlotPoint | null = null

  for (const point of sampledPoints) {
    const pointIsInView = point && isPointNearViewport(point, viewport)
    const pointJumpsTooFar =
      point &&
      previousPoint &&
      (Math.abs(point.x - previousPoint.x) > xSpan * 0.25 ||
        Math.abs(point.y - previousPoint.y) > ySpan * 0.65)

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

  return segments
}

function getVisibleYValues(sampledSeries: SampledSeries[], viewport: PlotViewport) {
  return sampledSeries.flatMap((sampled) =>
    sampled.validPoints
      .filter(
        (point) =>
          point.x >= viewport.xMin &&
          point.x <= viewport.xMax &&
          isFiniteCoordinate(point.y),
      )
      .map((point) => point.y),
  )
}

function getErrorMessage(warnings: PlotWarning[]) {
  return (
    warnings[0]?.message ??
    'I could not find enough real values to plot. Check the graph content.'
  )
}

export function createPlot(rawInput: string, options: CreatePlotOptions = {}): PlotResult {
  const normalizedInput = normalizeInput(rawInput)

  if (!normalizedInput.trim()) {
    return {
      kind: 'empty',
      message: 'Type a function like y = x^2 - 4*x + 3 to see its graph.',
      warnings: [],
    }
  }

  const parsed = parseSeriesLines(normalizedInput)

  if (parsed.series.length === 0) {
    return {
      kind: 'error',
      error: getErrorMessage(parsed.warnings),
      warnings: parsed.warnings,
    }
  }

  const baseViewport = options.viewport ?? parsed.viewport ?? DEFAULT_VIEWPORT
  const sampledSeries = parsed.series.map((definition) => {
    if (definition.kind === 'function') {
      return sampleFunction(definition, baseViewport)
    }

    if (definition.kind === 'parametric') {
      return sampleParametric(definition)
    }

    return {
      definition,
      points: definition.points,
      validPoints: definition.points,
    }
  })
  const autoYDomain =
    options.viewport || parsed.viewport
      ? { yMax: baseViewport.yMax, yMin: baseViewport.yMin }
      : getYDomain(getVisibleYValues(sampledSeries, baseViewport))
  const viewport: PlotViewport = {
    xMax: baseViewport.xMax,
    xMin: baseViewport.xMin,
    yMax: autoYDomain.yMax,
    yMin: autoYDomain.yMin,
  }
  const warnings = [...parsed.warnings]
  const series: PlotSeries[] = []

  for (const sampled of sampledSeries) {
    if (sampled.definition.kind === 'points') {
      const visiblePoints = sampled.validPoints.filter((point) =>
        isPointInViewport(point, viewport),
      )

      if (visiblePoints.length === 0) {
        warnings.push(
          createWarning(
            sampled.definition.line,
            sampled.definition.label,
            'This point set has no points in the current window.',
          ),
        )
        continue
      }

      series.push({
        color: sampled.definition.color,
        id: sampled.definition.id,
        kind: 'points',
        label: sampled.definition.label,
        points: sampled.validPoints,
      })
      continue
    }

    if (sampled.validPoints.length < 2) {
      warnings.push(
        createWarning(
          sampled.definition.line,
          sampled.definition.label,
          sampled.definition.kind === 'function'
            ? 'This function did not produce enough real y-values.'
            : 'This parametric curve did not produce enough real points.',
        ),
      )
      continue
    }

    const segments = buildSegments(sampled.points, viewport)

    if (segments.length === 0) {
      warnings.push(
        createWarning(
          sampled.definition.line,
          sampled.definition.label,
          'This series has no visible points in the current window.',
        ),
      )
      continue
    }

    if (sampled.definition.kind === 'function') {
      series.push({
        color: sampled.definition.color,
        expression: sampled.definition.expression,
        id: sampled.definition.id,
        kind: 'function',
        label: sampled.definition.label,
        segments,
      })
    } else {
      series.push({
        color: sampled.definition.color,
        id: sampled.definition.id,
        kind: 'parametric',
        label: sampled.definition.label,
        segments,
      })
    }
  }

  if (series.length === 0) {
    return {
      kind: 'error',
      error: getErrorMessage(warnings),
      warnings,
    }
  }

  return {
    kind: 'plot',
    series,
    viewport,
    warnings,
    xTicks: buildTicks(viewport.xMin, viewport.xMax),
    yTicks: buildTicks(viewport.yMin, viewport.yMax),
  }
}

export function formatGraphTick(value: number) {
  const absoluteValue = Math.abs(value)

  if (absoluteValue >= 100_000 || (absoluteValue > 0 && absoluteValue < 0.001)) {
    return value.toExponential(1)
  }

  if (absoluteValue >= 100 || Number.isInteger(value)) {
    return String(Math.round(value))
  }

  return value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}
