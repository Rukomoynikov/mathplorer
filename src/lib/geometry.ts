export type GeometryCoordinates = {
  x: number
  y: number
}

export type GeometryPoint = GeometryCoordinates & {
  id: string
  label: string
  type: 'point'
}

export type GeometrySegment = {
  id: string
  pointIds: [string, string]
  type: 'segment'
}

export type GeometryCircle = {
  centerId: string
  id: string
  radiusPointId: string
  type: 'circle'
}

export type GeometryPolygon = {
  id: string
  pointIds: string[]
  type: 'polygon'
}

export type GeometryObject =
  | GeometryCircle
  | GeometryPoint
  | GeometryPolygon
  | GeometrySegment

export type GeometryBlockContent = {
  objects: GeometryObject[]
  showGrid: boolean
  snapToGrid: boolean
  version: 1
}

export type GeometryViewport = {
  xMax: number
  xMin: number
  yMax: number
  yMin: number
}

export type GeometrySvgPoint = {
  x: number
  y: number
}

export const GEOMETRY_VERSION = 1
export const GEOMETRY_SVG_SIZE = 520
export const GEOMETRY_PADDING = 36
export const GEOMETRY_VIEWPORT: GeometryViewport = {
  xMax: 10,
  xMin: -10,
  yMax: 10,
  yMin: -10,
}

export const DEFAULT_GEOMETRY_BLOCK_CONTENT: GeometryBlockContent = {
  objects: [],
  showGrid: true,
  snapToGrid: true,
  version: GEOMETRY_VERSION,
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isGeometryPoint(value: unknown): value is GeometryPoint {
  if (!value || typeof value !== 'object') {
    return false
  }

  const point = value as Record<string, unknown>

  return (
    point.type === 'point' &&
    typeof point.id === 'string' &&
    isFiniteNumber(point.x) &&
    isFiniteNumber(point.y) &&
    typeof point.label === 'string'
  )
}

function isGeometrySegment(value: unknown): value is GeometrySegment {
  if (!value || typeof value !== 'object') {
    return false
  }

  const segment = value as Record<string, unknown>

  return (
    segment.type === 'segment' &&
    typeof segment.id === 'string' &&
    Array.isArray(segment.pointIds) &&
    segment.pointIds.length === 2 &&
    segment.pointIds.every((pointId) => typeof pointId === 'string')
  )
}

function isGeometryCircle(value: unknown): value is GeometryCircle {
  if (!value || typeof value !== 'object') {
    return false
  }

  const circle = value as Record<string, unknown>

  return (
    circle.type === 'circle' &&
    typeof circle.id === 'string' &&
    typeof circle.centerId === 'string' &&
    typeof circle.radiusPointId === 'string'
  )
}

function isGeometryPolygon(value: unknown): value is GeometryPolygon {
  if (!value || typeof value !== 'object') {
    return false
  }

  const polygon = value as Record<string, unknown>

  return (
    polygon.type === 'polygon' &&
    typeof polygon.id === 'string' &&
    isStringArray(polygon.pointIds) &&
    polygon.pointIds.length >= 3
  )
}

function isGeometryObject(value: unknown): value is GeometryObject {
  return (
    isGeometryPoint(value) ||
    isGeometrySegment(value) ||
    isGeometryCircle(value) ||
    isGeometryPolygon(value)
  )
}

function isGeometryObjectArray(value: unknown): value is GeometryObject[] {
  return Array.isArray(value) && value.every(isGeometryObject)
}

function normalizeGeometryContent(value: unknown): GeometryBlockContent | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const content = value as Record<string, unknown>

  if (
    (content.version === GEOMETRY_VERSION || content.version === undefined) &&
    isGeometryObjectArray(content.objects) &&
    typeof content.showGrid === 'boolean' &&
    typeof content.snapToGrid === 'boolean'
  ) {
    return {
      objects: content.objects.map(cloneGeometryObject),
      showGrid: content.showGrid,
      snapToGrid: content.snapToGrid,
      version: GEOMETRY_VERSION,
    }
  }

  return null
}

function cloneGeometryObject(object: GeometryObject): GeometryObject {
  if (object.type === 'segment') {
    return {
      ...object,
      pointIds: [...object.pointIds],
    }
  }

  if (object.type === 'polygon') {
    return {
      ...object,
      pointIds: [...object.pointIds],
    }
  }

  return { ...object }
}

function cloneGeometryBlockContent(
  content: GeometryBlockContent,
): GeometryBlockContent {
  return {
    objects: content.objects.map(cloneGeometryObject),
    showGrid: content.showGrid,
    snapToGrid: content.snapToGrid,
    version: GEOMETRY_VERSION,
  }
}

export function serializeGeometryBlockContent(content: GeometryBlockContent) {
  return JSON.stringify(content, null, 2)
}

export function parseGeometryBlockContent(content: string): GeometryBlockContent {
  try {
    const parsed = JSON.parse(content) as unknown
    const normalized = normalizeGeometryContent(parsed)

    if (normalized) {
      return normalized
    }
  } catch {
    // Invalid JSON falls through to an empty construction.
  }

  return cloneGeometryBlockContent(DEFAULT_GEOMETRY_BLOCK_CONTENT)
}

export function distanceBetweenPoints(
  firstPoint: GeometryCoordinates,
  secondPoint: GeometryCoordinates,
) {
  return Math.hypot(secondPoint.x - firstPoint.x, secondPoint.y - firstPoint.y)
}

export function midpoint(
  firstPoint: GeometryCoordinates,
  secondPoint: GeometryCoordinates,
): GeometryCoordinates {
  return {
    x: (firstPoint.x + secondPoint.x) / 2,
    y: (firstPoint.y + secondPoint.y) / 2,
  }
}

export function slope(
  firstPoint: GeometryCoordinates,
  secondPoint: GeometryCoordinates,
) {
  const run = secondPoint.x - firstPoint.x

  if (run === 0) {
    return null
  }

  return (secondPoint.y - firstPoint.y) / run
}

export function angleBetweenPoints(
  firstPoint: GeometryCoordinates,
  vertexPoint: GeometryCoordinates,
  thirdPoint: GeometryCoordinates,
) {
  const firstVector = {
    x: firstPoint.x - vertexPoint.x,
    y: firstPoint.y - vertexPoint.y,
  }
  const secondVector = {
    x: thirdPoint.x - vertexPoint.x,
    y: thirdPoint.y - vertexPoint.y,
  }
  const firstLength = Math.hypot(firstVector.x, firstVector.y)
  const secondLength = Math.hypot(secondVector.x, secondVector.y)

  if (firstLength === 0 || secondLength === 0) {
    return null
  }

  const cosine =
    (firstVector.x * secondVector.x + firstVector.y * secondVector.y) /
    (firstLength * secondLength)
  const clampedCosine = Math.min(1, Math.max(-1, cosine))

  return (Math.acos(clampedCosine) * 180) / Math.PI
}

export function polygonPerimeter(points: GeometryCoordinates[]) {
  if (points.length < 2) {
    return 0
  }

  return points.reduce((total, point, index) => {
    const nextPoint = points[(index + 1) % points.length]

    return total + distanceBetweenPoints(point, nextPoint)
  }, 0)
}

export function polygonArea(points: GeometryCoordinates[]) {
  if (points.length < 3) {
    return 0
  }

  const signedDoubleArea = points.reduce((total, point, index) => {
    const nextPoint = points[(index + 1) % points.length]

    return total + point.x * nextPoint.y - nextPoint.x * point.y
  }, 0)

  return Math.abs(signedDoubleArea) / 2
}

export function circleRadius(
  centerPoint: GeometryCoordinates,
  radiusPoint: GeometryCoordinates,
) {
  return distanceBetweenPoints(centerPoint, radiusPoint)
}

export function circleDiameter(
  centerPoint: GeometryCoordinates,
  radiusPoint: GeometryCoordinates,
) {
  return circleRadius(centerPoint, radiusPoint) * 2
}

export function circleCircumference(
  centerPoint: GeometryCoordinates,
  radiusPoint: GeometryCoordinates,
) {
  return circleRadius(centerPoint, radiusPoint) * 2 * Math.PI
}

export function circleArea(
  centerPoint: GeometryCoordinates,
  radiusPoint: GeometryCoordinates,
) {
  const radius = circleRadius(centerPoint, radiusPoint)

  return Math.PI * radius * radius
}

export function snapCoordinateToGrid(value: number, gridSize = 1) {
  if (gridSize <= 0) {
    return value
  }

  return Math.round(value / gridSize) * gridSize
}

export function snapPointToGrid(
  point: GeometryCoordinates,
  gridSize = 1,
): GeometryCoordinates {
  return {
    x: snapCoordinateToGrid(point.x, gridSize),
    y: snapCoordinateToGrid(point.y, gridSize),
  }
}

export function clampPointToViewport(
  point: GeometryCoordinates,
  viewport = GEOMETRY_VIEWPORT,
): GeometryCoordinates {
  return {
    x: Math.min(Math.max(point.x, viewport.xMin), viewport.xMax),
    y: Math.min(Math.max(point.y, viewport.yMin), viewport.yMax),
  }
}

export function geometryPointToSvg(
  point: GeometryCoordinates,
  viewport = GEOMETRY_VIEWPORT,
  svgSize = GEOMETRY_SVG_SIZE,
  padding = GEOMETRY_PADDING,
): GeometrySvgPoint {
  const graphSize = svgSize - padding * 2
  const xSpan = viewport.xMax - viewport.xMin
  const ySpan = viewport.yMax - viewport.yMin

  return {
    x: padding + ((point.x - viewport.xMin) / xSpan) * graphSize,
    y: padding + ((viewport.yMax - point.y) / ySpan) * graphSize,
  }
}

export function svgPointToGeometry(
  point: GeometrySvgPoint,
  viewport = GEOMETRY_VIEWPORT,
  svgSize = GEOMETRY_SVG_SIZE,
  padding = GEOMETRY_PADDING,
): GeometryCoordinates {
  const graphSize = svgSize - padding * 2
  const xSpan = viewport.xMax - viewport.xMin
  const ySpan = viewport.yMax - viewport.yMin

  return {
    x: viewport.xMin + ((point.x - padding) / graphSize) * xSpan,
    y: viewport.yMax - ((point.y - padding) / graphSize) * ySpan,
  }
}

export function createPointLookup(objects: GeometryObject[]) {
  return new Map(
    objects
      .filter((object): object is GeometryPoint => object.type === 'point')
      .map((point) => [point.id, point]),
  )
}

export function getGeometryPoints(objects: GeometryObject[]) {
  return objects.filter((object): object is GeometryPoint => object.type === 'point')
}

export function getGeometrySegments(objects: GeometryObject[]) {
  return objects.filter(
    (object): object is GeometrySegment => object.type === 'segment',
  )
}

export function getGeometryCircles(objects: GeometryObject[]) {
  return objects.filter(
    (object): object is GeometryCircle => object.type === 'circle',
  )
}

export function getGeometryPolygons(objects: GeometryObject[]) {
  return objects.filter(
    (object): object is GeometryPolygon => object.type === 'polygon',
  )
}

export function doesObjectDependOnPoint(
  object: GeometryObject,
  pointId: string,
) {
  if (object.type === 'segment') {
    return object.pointIds.includes(pointId)
  }

  if (object.type === 'circle') {
    return object.centerId === pointId || object.radiusPointId === pointId
  }

  if (object.type === 'polygon') {
    return object.pointIds.includes(pointId)
  }

  return false
}

export function removeGeometryObjectById(
  objects: GeometryObject[],
  objectId: string,
) {
  const target = objects.find((object) => object.id === objectId)

  if (!target) {
    return objects
  }

  if (target.type !== 'point') {
    return objects.filter((object) => object.id !== objectId)
  }

  return objects.filter(
    (object) =>
      object.id !== objectId && !doesObjectDependOnPoint(object, target.id),
  )
}

export function indexToPointLabel(index: number) {
  let remaining = Math.max(0, Math.floor(index))
  let label = ''

  do {
    label = String.fromCharCode(65 + (remaining % 26)) + label
    remaining = Math.floor(remaining / 26) - 1
  } while (remaining >= 0)

  return label
}

export function getNextPointLabel(objects: GeometryObject[]) {
  const usedLabels = new Set(
    getGeometryPoints(objects).map((point) => point.label.trim()).filter(Boolean),
  )
  let index = 0

  while (usedLabels.has(indexToPointLabel(index))) {
    index += 1
  }

  return indexToPointLabel(index)
}

export function formatGeometryNumber(value: number, precision = 2) {
  if (!Number.isFinite(value)) {
    return 'n/a'
  }

  return Number(value.toFixed(precision)).toString()
}

export function formatGeometrySlope(value: number | null) {
  return value === null ? 'undefined' : formatGeometryNumber(value)
}
