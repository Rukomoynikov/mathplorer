import { differentiateExpression, evaluateExpression } from './mathEngine'

export type GraphAnalysisPoint = {
  x: number
  y: number
}

export type GraphAnalysisViewport = {
  xMax: number
  xMin: number
  yMax: number
  yMin: number
}

export type GraphAnalysisFunctionInput = {
  color: string
  evaluate: (x: number) => number | null
  expression: string
  id: string
  label: string
  line: number
  samples: Array<GraphAnalysisPoint | null>
}

type ApproximateFeature = {
  approximate: true
  color: string
  id: string
  line: number
  point: GraphAnalysisPoint
  seriesId: string
  seriesLabel: string
}

export type GraphInterceptFeature = ApproximateFeature & {
  kind: 'x-intercept' | 'y-intercept'
}

export type GraphExtremumFeature = ApproximateFeature & {
  kind: 'maximum' | 'minimum'
}

export type GraphIntersectionFeature = ApproximateFeature & {
  kind: 'intersection'
  otherSeriesId: string
  otherSeriesLabel: string
}

export type GraphAnalysisWarning = {
  approximate: true
  color: string
  id: string
  kind: 'discontinuity'
  line: number
  message: string
  seriesId: string
  seriesLabel: string
  x: number
}

export type GraphAnalysisResult = {
  extrema: GraphExtremumFeature[]
  intersections: GraphIntersectionFeature[]
  warnings: GraphAnalysisWarning[]
  xIntercepts: GraphInterceptFeature[]
  yIntercepts: GraphInterceptFeature[]
}

const BISECTION_STEPS = 48
const MAX_FEATURES_PER_GROUP = 16

function createEmptyAnalysis(): GraphAnalysisResult {
  return {
    extrema: [],
    intersections: [],
    warnings: [],
    xIntercepts: [],
    yIntercepts: [],
  }
}

function getXSpan(viewport: GraphAnalysisViewport) {
  return Math.max(viewport.xMax - viewport.xMin, Number.EPSILON)
}

function getYSpan(viewport: GraphAnalysisViewport) {
  return Math.max(viewport.yMax - viewport.yMin, Number.EPSILON)
}

function getZeroTolerance(viewport: GraphAnalysisViewport) {
  return Math.max(1e-7, getYSpan(viewport) * 1e-9)
}

function getXMergeTolerance(viewport: GraphAnalysisViewport) {
  return Math.max(1e-5, getXSpan(viewport) * 1e-4)
}

function isNearlyZero(value: number, tolerance: number) {
  return Math.abs(value) <= tolerance
}

function getSign(value: number, tolerance: number) {
  if (isNearlyZero(value, tolerance)) {
    return 0
  }

  return value < 0 ? -1 : 1
}

function isFiniteNumber(value: number | null): value is number {
  return value !== null && Number.isFinite(value)
}

function evaluateAt(
  definition: GraphAnalysisFunctionInput,
  x: number,
): number | null {
  const y = definition.evaluate(x)

  return isFiniteNumber(y) ? y : null
}

function formatApproxNumber(value: number) {
  const absoluteValue = Math.abs(value)

  if (absoluteValue >= 100_000 || (absoluteValue > 0 && absoluteValue < 0.001)) {
    return value.toExponential(1)
  }

  if (absoluteValue >= 100 || Number.isInteger(value)) {
    return String(Math.round(value))
  }

  return value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
}

function isDuplicateX(
  points: Array<{ point: GraphAnalysisPoint }>,
  x: number,
  viewport: GraphAnalysisViewport,
) {
  const tolerance = getXMergeTolerance(viewport)

  return points.some((feature) => Math.abs(feature.point.x - x) <= tolerance)
}

function isDuplicateWarning(
  warnings: GraphAnalysisWarning[],
  x: number,
  viewport: GraphAnalysisViewport,
) {
  const tolerance = getXMergeTolerance(viewport)

  return warnings.some((warning) => Math.abs(warning.x - x) <= tolerance)
}

function isLikelyJump(
  left: GraphAnalysisPoint,
  right: GraphAnalysisPoint,
  viewport: GraphAnalysisViewport,
) {
  const ySpan = getYSpan(viewport)
  const yJump = Math.abs(right.y - left.y)
  const jumpThreshold = Math.max(8, ySpan * 0.85)
  const hasLargeValue = Math.max(Math.abs(left.y), Math.abs(right.y)) > ySpan * 0.45
  const changesSign = left.y * right.y < 0

  return yJump > jumpThreshold && (changesSign || hasLargeValue)
}

function refineBisection(
  evaluateDifference: (x: number) => number | null,
  leftX: number,
  rightX: number,
  tolerance: number,
) {
  let left = leftX
  let right = rightX
  let leftValue = evaluateDifference(left)
  let rightValue = evaluateDifference(right)

  if (!isFiniteNumber(leftValue) || !isFiniteNumber(rightValue)) {
    return null
  }

  if (isNearlyZero(leftValue, tolerance)) {
    return left
  }

  if (isNearlyZero(rightValue, tolerance)) {
    return right
  }

  if (leftValue * rightValue > 0) {
    return null
  }

  for (let step = 0; step < BISECTION_STEPS; step += 1) {
    const midpoint = (left + right) / 2
    const midpointValue = evaluateDifference(midpoint)

    if (!isFiniteNumber(midpointValue)) {
      return null
    }

    if (isNearlyZero(midpointValue, tolerance)) {
      return midpoint
    }

    if (leftValue * midpointValue <= 0) {
      right = midpoint
      rightValue = midpointValue
    } else {
      left = midpoint
      leftValue = midpointValue
    }
  }

  return (left + right) / 2
}

function findXIntercepts(
  definition: GraphAnalysisFunctionInput,
  viewport: GraphAnalysisViewport,
): GraphInterceptFeature[] {
  const features: GraphInterceptFeature[] = []
  const tolerance = getZeroTolerance(viewport)

  function addIntercept(x: number) {
    if (
      features.length >= MAX_FEATURES_PER_GROUP ||
      x < viewport.xMin ||
      x > viewport.xMax ||
      isDuplicateX(features, x, viewport)
    ) {
      return
    }

    const y = evaluateAt(definition, x)

    if (!isFiniteNumber(y) || !isNearlyZero(y, tolerance * 10)) {
      return
    }

    features.push({
      approximate: true,
      color: definition.color,
      id: `${definition.id}-x-intercept-${features.length}`,
      kind: 'x-intercept',
      line: definition.line,
      point: { x, y: 0 },
      seriesId: definition.id,
      seriesLabel: definition.label,
    })
  }

  for (let index = 0; index < definition.samples.length; index += 1) {
    const point = definition.samples[index]

    if (!point) {
      continue
    }

    if (isNearlyZero(point.y, tolerance)) {
      addIntercept(point.x)
    }

    const nextPoint = definition.samples[index + 1]

    if (!nextPoint || isLikelyJump(point, nextPoint, viewport)) {
      continue
    }

    const leftSign = getSign(point.y, tolerance)
    const rightSign = getSign(nextPoint.y, tolerance)

    if (leftSign !== 0 && rightSign !== 0 && leftSign !== rightSign) {
      const root = refineBisection(
        (x) => evaluateAt(definition, x),
        point.x,
        nextPoint.x,
        tolerance,
      )

      if (root !== null) {
        addIntercept(root)
      }
    }
  }

  return features.sort((left, right) => left.point.x - right.point.x)
}

function findYIntercept(
  definition: GraphAnalysisFunctionInput,
  viewport: GraphAnalysisViewport,
): GraphInterceptFeature[] {
  if (viewport.xMin > 0 || viewport.xMax < 0) {
    return []
  }

  const y = evaluateAt(definition, 0)

  if (!isFiniteNumber(y)) {
    return []
  }

  return [
    {
      approximate: true,
      color: definition.color,
      id: `${definition.id}-y-intercept`,
      kind: 'y-intercept',
      line: definition.line,
      point: { x: 0, y },
      seriesId: definition.id,
      seriesLabel: definition.label,
    },
  ]
}

function createDerivativeEvaluator(definition: GraphAnalysisFunctionInput) {
  const derivative = differentiateExpression(definition.expression, 'x')

  if (!derivative.ok) {
    return null
  }

  return (x: number) => {
    const value = evaluateExpression(derivative.value, { x })

    return value.ok ? value.value : null
  }
}

function findNearestDerivativeSign(
  values: Array<number | null>,
  startIndex: number,
  direction: -1 | 1,
  tolerance: number,
) {
  for (
    let index = startIndex + direction;
    index >= 0 && index < values.length;
    index += direction
  ) {
    const value = values[index]

    if (!isFiniteNumber(value)) {
      return 0
    }

    const sign = getSign(value, tolerance)

    if (sign !== 0) {
      return sign
    }
  }

  return 0
}

function findExtrema(
  definition: GraphAnalysisFunctionInput,
  viewport: GraphAnalysisViewport,
): GraphExtremumFeature[] {
  const evaluateDerivative = createDerivativeEvaluator(definition)

  if (!evaluateDerivative) {
    return []
  }

  const features: GraphExtremumFeature[] = []
  const tolerance = getZeroTolerance(viewport)
  const derivativeValues = definition.samples.map((point) =>
    point ? evaluateDerivative(point.x) : null,
  )

  function addExtremum(x: number, kind: GraphExtremumFeature['kind']) {
    if (
      features.length >= MAX_FEATURES_PER_GROUP ||
      x < viewport.xMin ||
      x > viewport.xMax ||
      isDuplicateX(features, x, viewport)
    ) {
      return
    }

    const y = evaluateAt(definition, x)

    if (!isFiniteNumber(y)) {
      return
    }

    features.push({
      approximate: true,
      color: definition.color,
      id: `${definition.id}-${kind}-${features.length}`,
      kind,
      line: definition.line,
      point: { x, y },
      seriesId: definition.id,
      seriesLabel: definition.label,
    })
  }

  for (let index = 0; index < definition.samples.length - 1; index += 1) {
    const point = definition.samples[index]
    const nextPoint = definition.samples[index + 1]
    const derivativeValue = derivativeValues[index]
    const nextDerivativeValue = derivativeValues[index + 1]

    if (
      !point ||
      !nextPoint ||
      !isFiniteNumber(derivativeValue) ||
      !isFiniteNumber(nextDerivativeValue) ||
      isLikelyJump(point, nextPoint, viewport)
    ) {
      continue
    }

    const leftSign = getSign(derivativeValue, tolerance)
    const rightSign = getSign(nextDerivativeValue, tolerance)

    if (leftSign !== 0 && rightSign !== 0 && leftSign !== rightSign) {
      const root = refineBisection(evaluateDerivative, point.x, nextPoint.x, tolerance)

      if (root !== null) {
        addExtremum(root, leftSign < rightSign ? 'minimum' : 'maximum')
      }
    }
  }

  for (let index = 1; index < definition.samples.length - 1; index += 1) {
    const point = definition.samples[index]
    const derivativeValue = derivativeValues[index]

    if (!point || !isFiniteNumber(derivativeValue)) {
      continue
    }

    if (!isNearlyZero(derivativeValue, tolerance)) {
      continue
    }

    const leftSign = findNearestDerivativeSign(
      derivativeValues,
      index,
      -1,
      tolerance,
    )
    const rightSign = findNearestDerivativeSign(
      derivativeValues,
      index,
      1,
      tolerance,
    )

    if (leftSign !== 0 && rightSign !== 0 && leftSign !== rightSign) {
      addExtremum(point.x, leftSign < rightSign ? 'minimum' : 'maximum')
    }
  }

  return features.sort((left, right) => left.point.x - right.point.x)
}

function findIntersections(
  definitions: GraphAnalysisFunctionInput[],
  viewport: GraphAnalysisViewport,
): GraphIntersectionFeature[] {
  const features: GraphIntersectionFeature[] = []
  const tolerance = getZeroTolerance(viewport)

  function addIntersection(
    leftDefinition: GraphAnalysisFunctionInput,
    rightDefinition: GraphAnalysisFunctionInput,
    x: number,
  ) {
    if (
      features.length >= MAX_FEATURES_PER_GROUP ||
      x < viewport.xMin ||
      x > viewport.xMax ||
      features.some(
        (feature) =>
          feature.seriesId === leftDefinition.id &&
          feature.otherSeriesId === rightDefinition.id &&
          Math.abs(feature.point.x - x) <= getXMergeTolerance(viewport),
      )
    ) {
      return
    }

    const leftY = evaluateAt(leftDefinition, x)
    const rightY = evaluateAt(rightDefinition, x)

    if (!isFiniteNumber(leftY) || !isFiniteNumber(rightY)) {
      return
    }

    features.push({
      approximate: true,
      color: leftDefinition.color,
      id: `${leftDefinition.id}-${rightDefinition.id}-intersection-${features.length}`,
      kind: 'intersection',
      line: leftDefinition.line,
      otherSeriesId: rightDefinition.id,
      otherSeriesLabel: rightDefinition.label,
      point: { x, y: (leftY + rightY) / 2 },
      seriesId: leftDefinition.id,
      seriesLabel: leftDefinition.label,
    })
  }

  for (let leftIndex = 0; leftIndex < definitions.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < definitions.length;
      rightIndex += 1
    ) {
      const leftDefinition = definitions[leftIndex]
      const rightDefinition = definitions[rightIndex]
      const sampleCount = Math.min(
        leftDefinition.samples.length,
        rightDefinition.samples.length,
      )
      const evaluateDifference = (x: number) => {
        const leftY = evaluateAt(leftDefinition, x)
        const rightY = evaluateAt(rightDefinition, x)

        return isFiniteNumber(leftY) && isFiniteNumber(rightY) ? leftY - rightY : null
      }

      for (let index = 0; index < sampleCount - 1; index += 1) {
        const leftPoint = leftDefinition.samples[index]
        const nextLeftPoint = leftDefinition.samples[index + 1]
        const rightPoint = rightDefinition.samples[index]
        const nextRightPoint = rightDefinition.samples[index + 1]

        if (
          !leftPoint ||
          !nextLeftPoint ||
          !rightPoint ||
          !nextRightPoint ||
          isLikelyJump(leftPoint, nextLeftPoint, viewport) ||
          isLikelyJump(rightPoint, nextRightPoint, viewport)
        ) {
          continue
        }

        const difference = leftPoint.y - rightPoint.y
        const nextDifference = nextLeftPoint.y - nextRightPoint.y

        if (
          isNearlyZero(difference, tolerance) &&
          isNearlyZero(nextDifference, tolerance)
        ) {
          continue
        }

        if (isNearlyZero(difference, tolerance)) {
          addIntersection(leftDefinition, rightDefinition, leftPoint.x)
        }

        if (
          getSign(difference, tolerance) !== 0 &&
          getSign(nextDifference, tolerance) !== 0 &&
          getSign(difference, tolerance) !== getSign(nextDifference, tolerance)
        ) {
          const intersection = refineBisection(
            evaluateDifference,
            leftPoint.x,
            nextLeftPoint.x,
            tolerance,
          )

          if (intersection !== null) {
            addIntersection(leftDefinition, rightDefinition, intersection)
          }
        }

        if (isNearlyZero(nextDifference, tolerance)) {
          addIntersection(leftDefinition, rightDefinition, nextLeftPoint.x)
        }
      }
    }
  }

  return features.sort((left, right) => left.point.x - right.point.x)
}

function findDiscontinuities(
  definition: GraphAnalysisFunctionInput,
  viewport: GraphAnalysisViewport,
): GraphAnalysisWarning[] {
  const warnings: GraphAnalysisWarning[] = []

  function addWarning(x: number) {
    if (
      warnings.length >= MAX_FEATURES_PER_GROUP ||
      x < viewport.xMin ||
      x > viewport.xMax ||
      isDuplicateWarning(warnings, x, viewport)
    ) {
      return
    }

    warnings.push({
      approximate: true,
      color: definition.color,
      id: `${definition.id}-discontinuity-${warnings.length}`,
      kind: 'discontinuity',
      line: definition.line,
      message: `Possible discontinuity or vertical asymptote near x = ${formatApproxNumber(
        x,
      )}.`,
      seriesId: definition.id,
      seriesLabel: definition.label,
      x,
    })
  }

  for (let index = 0; index < definition.samples.length - 1; index += 1) {
    const point = definition.samples[index]
    const nextPoint = definition.samples[index + 1]

    if (point && nextPoint) {
      if (isLikelyJump(point, nextPoint, viewport)) {
        addWarning((point.x + nextPoint.x) / 2)
      }

      continue
    }

    if (!point || nextPoint) {
      continue
    }

    let nextValidIndex = index + 1

    while (
      nextValidIndex < definition.samples.length &&
      !definition.samples[nextValidIndex]
    ) {
      nextValidIndex += 1
    }

    const nextValidPoint = definition.samples[nextValidIndex]

    if (nextValidPoint) {
      addWarning((point.x + nextValidPoint.x) / 2)
      index = nextValidIndex - 1
    }
  }

  return warnings
}

export function analyzeGraphFunctions(
  definitions: GraphAnalysisFunctionInput[],
  viewport: GraphAnalysisViewport,
): GraphAnalysisResult {
  if (definitions.length === 0) {
    return createEmptyAnalysis()
  }

  return {
    extrema: definitions.flatMap((definition) => findExtrema(definition, viewport)),
    intersections: findIntersections(definitions, viewport),
    warnings: definitions.flatMap((definition) =>
      findDiscontinuities(definition, viewport),
    ),
    xIntercepts: definitions.flatMap((definition) =>
      findXIntercepts(definition, viewport),
    ),
    yIntercepts: definitions.flatMap((definition) =>
      findYIntercept(definition, viewport),
    ),
  }
}
