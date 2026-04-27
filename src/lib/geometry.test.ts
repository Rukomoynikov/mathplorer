import { describe, expect, it } from 'vitest'
import {
  angleBetweenPoints,
  circleArea,
  circleCircumference,
  circleDiameter,
  circleRadius,
  distanceBetweenPoints,
  formatGeometrySlope,
  geometryPointToSvg,
  midpoint,
  parseGeometryBlockContent,
  polygonArea,
  polygonPerimeter,
  serializeGeometryBlockContent,
  slope,
  snapPointToGrid,
  svgPointToGeometry,
  type GeometryBlockContent,
} from './geometry'

describe('geometry helpers', () => {
  it('calculates distance, midpoint, slope, and angle', () => {
    const origin = { x: 0, y: 0 }
    const point = { x: 3, y: 4 }

    expect(distanceBetweenPoints(origin, point)).toBe(5)
    expect(midpoint(origin, point)).toEqual({ x: 1.5, y: 2 })
    expect(slope(origin, point)).toBe(4 / 3)
    expect(formatGeometrySlope(slope(origin, point))).toBe('1.33')
    expect(formatGeometrySlope(slope({ x: 2, y: -1 }, { x: 2, y: 5 }))).toBe(
      'undefined',
    )
    expect(
      angleBetweenPoints({ x: 1, y: 0 }, origin, { x: 0, y: 1 }),
    ).toBeCloseTo(90)
  })

  it('calculates polygon measurements', () => {
    const triangle = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 0, y: 3 },
    ]

    expect(polygonPerimeter(triangle)).toBe(12)
    expect(polygonArea(triangle)).toBe(6)
  })

  it('calculates circle measurements', () => {
    const center = { x: 0, y: 0 }
    const radiusPoint = { x: 3, y: 4 }

    expect(circleRadius(center, radiusPoint)).toBe(5)
    expect(circleDiameter(center, radiusPoint)).toBe(10)
    expect(circleCircumference(center, radiusPoint)).toBeCloseTo(10 * Math.PI)
    expect(circleArea(center, radiusPoint)).toBeCloseTo(25 * Math.PI)
  })

  it('snaps points and converts between geometry and svg coordinates', () => {
    const point = { x: 2.24, y: -3.76 }
    const snappedPoint = snapPointToGrid(point, 0.5)
    const svgPoint = geometryPointToSvg(point)
    const convertedPoint = svgPointToGeometry(svgPoint)

    expect(snappedPoint).toEqual({ x: 2, y: -4 })
    expect(convertedPoint.x).toBeCloseTo(point.x)
    expect(convertedPoint.y).toBeCloseTo(point.y)
  })

  it('parses versioned and unversioned JSON content', () => {
    const versionedContent: GeometryBlockContent = {
      objects: [
        { id: 'a', label: 'A', type: 'point', x: 0, y: 0 },
        { id: 'b', label: 'B', type: 'point', x: 3, y: 4 },
        { id: 'ab', pointIds: ['a', 'b'], type: 'segment' },
      ],
      showGrid: true,
      snapToGrid: false,
      version: 1,
    }
    const unversionedContent = {
      objects: versionedContent.objects,
      showGrid: false,
      snapToGrid: true,
    }

    expect(
      parseGeometryBlockContent(serializeGeometryBlockContent(versionedContent)),
    ).toEqual(versionedContent)
    expect(
      parseGeometryBlockContent(JSON.stringify(unversionedContent)),
    ).toEqual({
      ...unversionedContent,
      version: 1,
    })
  })

  it('falls back to the default draft for invalid JSON', () => {
    expect(parseGeometryBlockContent('not json')).toEqual({
      objects: [],
      showGrid: true,
      snapToGrid: true,
      version: 1,
    })
  })
})
