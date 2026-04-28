import {
  Circle,
  Grid2X2,
  Magnet,
  Minus,
  MousePointer2,
  Pentagon,
  Plus,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import {
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import type { NotebookViewMode } from '../../types'
import {
  GEOMETRY_PADDING,
  GEOMETRY_SVG_SIZE,
  GEOMETRY_VIEWPORT,
  circleArea,
  circleCircumference,
  circleDiameter,
  circleRadius,
  clampPointToViewport,
  createPointLookup,
  distanceBetweenPoints,
  formatGeometryNumber,
  formatGeometrySlope,
  geometryPointToSvg,
  getGeometryCircles,
  getGeometryPoints,
  getGeometryPolygons,
  getGeometrySegments,
  getNextPointLabel,
  parseGeometryBlockContent,
  polygonArea,
  polygonPerimeter,
  removeGeometryObjectById,
  serializeGeometryBlockContent,
  slope,
  snapPointToGrid,
  svgPointToGeometry,
  type GeometryBlockContent,
  type GeometryCoordinates,
  type GeometryObject,
  type GeometryPoint,
} from '../../lib/geometry'

type GeometryBlockProps = {
  content: string
  mode: NotebookViewMode
  onChange: (content: string) => void
}

type GeometryTool = 'select' | 'point' | 'segment' | 'circle' | 'polygon' | 'delete'

type DragState = {
  pointId: string
  pointerId: number
}

type ToolDefinition = {
  icon: LucideIcon
  label: string
  tool: GeometryTool
}

type MeasurementRow = {
  detail?: string
  id: string
  label: string
  value: string
}

const TOOL_DEFINITIONS: ToolDefinition[] = [
  { icon: MousePointer2, label: 'Select', tool: 'select' },
  { icon: Plus, label: 'Point', tool: 'point' },
  { icon: Minus, label: 'Segment', tool: 'segment' },
  { icon: Circle, label: 'Circle', tool: 'circle' },
  { icon: Pentagon, label: 'Polygon', tool: 'polygon' },
  { icon: Trash2, label: 'Delete', tool: 'delete' },
]

const GRID_TICKS = Array.from(
  { length: GEOMETRY_VIEWPORT.xMax - GEOMETRY_VIEWPORT.xMin + 1 },
  (_, index) => GEOMETRY_VIEWPORT.xMin + index,
)
const LABELED_TICKS = new Set([-10, -5, 0, 5, 10])
const GRAPH_SIZE = GEOMETRY_SVG_SIZE - GEOMETRY_PADDING * 2

function createGeometryId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getPointerSvgPoint(event: PointerEvent<SVGSVGElement>) {
  const bounds = event.currentTarget.getBoundingClientRect()

  return {
    x: ((event.clientX - bounds.left) / bounds.width) * GEOMETRY_SVG_SIZE,
    y: ((event.clientY - bounds.top) / bounds.height) * GEOMETRY_SVG_SIZE,
  }
}

function isInsideConstructionArea(point: GeometryCoordinates) {
  return (
    point.x >= GEOMETRY_PADDING &&
    point.x <= GEOMETRY_SVG_SIZE - GEOMETRY_PADDING &&
    point.y >= GEOMETRY_PADDING &&
    point.y <= GEOMETRY_SVG_SIZE - GEOMETRY_PADDING
  )
}

function normalizeCanvasPoint(
  svgPoint: GeometryCoordinates,
  snapToGrid: boolean,
) {
  const geometryPoint = clampPointToViewport(svgPointToGeometry(svgPoint))
  const nextPoint = snapToGrid ? snapPointToGrid(geometryPoint) : geometryPoint

  return clampPointToViewport(nextPoint)
}

function getPointsForIds(
  pointLookup: Map<string, GeometryPoint>,
  pointIds: string[],
) {
  const points = pointIds.map((pointId) => pointLookup.get(pointId))

  if (points.some((point) => !point)) {
    return null
  }

  return points as GeometryPoint[]
}

function getPointLabel(pointLookup: Map<string, GeometryPoint>, pointId: string) {
  return pointLookup.get(pointId)?.label ?? '?'
}

function getSegmentLabel(
  pointLookup: Map<string, GeometryPoint>,
  pointIds: [string, string],
) {
  return pointIds.map((pointId) => getPointLabel(pointLookup, pointId)).join('')
}

function ToolButton({
  activeTool,
  definition,
  onSelect,
}: {
  activeTool: GeometryTool
  definition: ToolDefinition
  onSelect: (tool: GeometryTool) => void
}) {
  const Icon = definition.icon
  const isActive = activeTool === definition.tool

  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={() => onSelect(definition.tool)}
      title={definition.label}
      className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold transition ${
        isActive
          ? 'border-teal-200 bg-teal-50 text-teal-800 shadow-sm'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <Icon size={15} aria-hidden="true" strokeWidth={2.2} />
      <span>{definition.label}</span>
    </button>
  )
}

function ToggleButton({
  active,
  icon: Icon,
  label,
  onToggle,
}: {
  active: boolean
  icon: LucideIcon
  label: string
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      title={label}
      className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold transition ${
        active
          ? 'border-cyan-200 bg-cyan-50 text-cyan-800'
          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <Icon size={15} aria-hidden="true" strokeWidth={2.2} />
      <span>{label}</span>
    </button>
  )
}

function MeasurementSection({
  rows,
  title,
}: {
  rows: MeasurementRow[]
  title: string
}) {
  if (rows.length === 0) {
    return null
  }

  return (
    <section>
      <p className="text-[11px] font-semibold uppercase text-slate-500">
        {title}
      </p>
      <div className="mt-2 grid gap-2">
        {rows.map((row) => (
          <div
            key={row.id}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold text-slate-800">
                {row.label}
              </span>
              <span className="font-mono text-sm text-slate-950">
                {row.value}
              </span>
            </div>
            {row.detail && (
              <p className="mt-1 font-mono text-xs text-slate-500">{row.detail}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function MeasurementsPanel({
  objects,
  pointLookup,
}: {
  objects: GeometryObject[]
  pointLookup: Map<string, GeometryPoint>
}) {
  const points = getGeometryPoints(objects)
  const segments = getGeometrySegments(objects)
  const circles = getGeometryCircles(objects)
  const polygons = getGeometryPolygons(objects)

  const pointRows = points.map((point) => ({
    id: point.id,
    label: point.label,
    value: `(${formatGeometryNumber(point.x)}, ${formatGeometryNumber(point.y)})`,
  }))

  const segmentRows = segments.flatMap((segment) => {
    const segmentPoints = getPointsForIds(pointLookup, segment.pointIds)

    if (!segmentPoints) {
      return []
    }

    const [firstPoint, secondPoint] = segmentPoints

    return [
      {
        detail: `slope ${formatGeometrySlope(slope(firstPoint, secondPoint))}`,
        id: segment.id,
        label: getSegmentLabel(pointLookup, segment.pointIds),
        value: `length ${formatGeometryNumber(
          distanceBetweenPoints(firstPoint, secondPoint),
        )}`,
      },
    ]
  })

  const circleRows = circles.flatMap((circle) => {
    const centerPoint = pointLookup.get(circle.centerId)
    const radiusPoint = pointLookup.get(circle.radiusPointId)

    if (!centerPoint || !radiusPoint) {
      return []
    }

    return [
      {
        detail: `d ${formatGeometryNumber(
          circleDiameter(centerPoint, radiusPoint),
        )} | C ${formatGeometryNumber(
          circleCircumference(centerPoint, radiusPoint),
        )} | A ${formatGeometryNumber(circleArea(centerPoint, radiusPoint))}`,
        id: circle.id,
        label: `${centerPoint.label} circle`,
        value: `r ${formatGeometryNumber(circleRadius(centerPoint, radiusPoint))}`,
      },
    ]
  })

  const polygonRows = polygons.flatMap((polygon) => {
    const polygonPoints = getPointsForIds(pointLookup, polygon.pointIds)

    if (!polygonPoints) {
      return []
    }

    return [
      {
        detail: `area ${formatGeometryNumber(polygonArea(polygonPoints))}`,
        id: polygon.id,
        label: polygon.pointIds.map((pointId) => getPointLabel(pointLookup, pointId)).join(''),
        value: `perimeter ${formatGeometryNumber(
          polygonPerimeter(polygonPoints),
        )}`,
      },
    ]
  })
  const hasMeasurements =
    pointRows.length + segmentRows.length + circleRows.length + polygonRows.length > 0

  return (
    <aside className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">Measurements</p>
        <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
          {objects.length} objects
        </span>
      </div>

      {hasMeasurements ? (
        <div className="mt-3 grid gap-4">
          <MeasurementSection rows={pointRows} title="Points" />
          <MeasurementSection rows={segmentRows} title="Segments" />
          <MeasurementSection rows={circleRows} title="Circles" />
          <MeasurementSection rows={polygonRows} title="Polygons" />
        </div>
      ) : (
        <p className="mt-3 rounded-md border border-dashed border-slate-200 bg-white px-3 py-6 text-center text-sm text-slate-500">
          No measurements yet.
        </p>
      )}
    </aside>
  )
}

export default function GeometryBlock({
  content,
  mode,
  onChange,
}: GeometryBlockProps) {
  const parsedContent = useMemo(() => parseGeometryBlockContent(content), [content])
  const [activeTool, setActiveTool] = useState<GeometryTool>('select')
  const [pendingPointIds, setPendingPointIds] = useState<string[]>([])
  const [drag, setDrag] = useState<DragState | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const isEditing = mode === 'edit'
  const pointLookup = useMemo(
    () => createPointLookup(parsedContent.objects),
    [parsedContent.objects],
  )
  const points = getGeometryPoints(parsedContent.objects)
  const segments = getGeometrySegments(parsedContent.objects)
  const circles = getGeometryCircles(parsedContent.objects)
  const polygons = getGeometryPolygons(parsedContent.objects)

  function commitContent(nextContent: GeometryBlockContent) {
    onChange(serializeGeometryBlockContent(nextContent))
  }

  function commitObjects(objects: GeometryObject[]) {
    commitContent({
      ...parsedContent,
      objects,
    })
  }

  function focusEditor() {
    rootRef.current?.focus()
  }

  function handleToolSelect(tool: GeometryTool) {
    setActiveTool(tool)
    setPendingPointIds([])
    focusEditor()
  }

  function handleToggle(key: 'showGrid' | 'snapToGrid') {
    commitContent({
      ...parsedContent,
      [key]: !parsedContent[key],
    })
  }

  function addPoint(point: GeometryCoordinates) {
    const nextPoint: GeometryPoint = {
      id: createGeometryId('point'),
      label: getNextPointLabel(parsedContent.objects),
      type: 'point',
      x: point.x,
      y: point.y,
    }

    commitObjects([...parsedContent.objects, nextPoint])
  }

  function addSegment(firstPointId: string, secondPointId: string) {
    if (firstPointId === secondPointId) {
      return
    }

    commitObjects([
      ...parsedContent.objects,
      {
        id: createGeometryId('segment'),
        pointIds: [firstPointId, secondPointId],
        type: 'segment',
      },
    ])
  }

  function addCircle(centerId: string, radiusPointId: string) {
    if (centerId === radiusPointId) {
      return
    }

    commitObjects([
      ...parsedContent.objects,
      {
        centerId,
        id: createGeometryId('circle'),
        radiusPointId,
        type: 'circle',
      },
    ])
  }

  function addPolygon(pointIds: string[]) {
    if (pointIds.length < 3) {
      return
    }

    commitObjects([
      ...parsedContent.objects,
      {
        id: createGeometryId('polygon'),
        pointIds,
        type: 'polygon',
      },
    ])
  }

  function deleteObject(objectId: string) {
    commitObjects(removeGeometryObjectById(parsedContent.objects, objectId))
    setPendingPointIds([])
  }

  function handleConstructionPoint(pointId: string) {
    if (activeTool === 'segment') {
      if (pendingPointIds.length === 0) {
        setPendingPointIds([pointId])
        return
      }

      addSegment(pendingPointIds[0], pointId)
      setPendingPointIds([])
      return
    }

    if (activeTool === 'circle') {
      if (pendingPointIds.length === 0) {
        setPendingPointIds([pointId])
        return
      }

      addCircle(pendingPointIds[0], pointId)
      setPendingPointIds([])
      return
    }

    if (activeTool === 'polygon') {
      const isClosingPolygon =
        pendingPointIds.length >= 3 && pendingPointIds[0] === pointId

      if (isClosingPolygon) {
        addPolygon(pendingPointIds)
        setPendingPointIds([])
        return
      }

      if (pendingPointIds.includes(pointId)) {
        return
      }

      setPendingPointIds([...pendingPointIds, pointId])
    }
  }

  function handleCanvasPointerDown(event: PointerEvent<SVGSVGElement>) {
    if (!isEditing || event.button !== 0) {
      return
    }

    focusEditor()

    if (activeTool !== 'point') {
      return
    }

    const svgPoint = getPointerSvgPoint(event)

    if (!isInsideConstructionArea(svgPoint)) {
      return
    }

    event.preventDefault()
    addPoint(normalizeCanvasPoint(svgPoint, parsedContent.snapToGrid))
  }

  function handlePointPointerDown(
    event: PointerEvent<SVGGElement>,
    pointId: string,
  ) {
    if (!isEditing || event.button !== 0) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    focusEditor()

    if (activeTool === 'select') {
      svgRef.current?.setPointerCapture(event.pointerId)
      setDrag({
        pointId,
        pointerId: event.pointerId,
      })
      return
    }

    if (
      activeTool === 'segment' ||
      activeTool === 'circle' ||
      activeTool === 'polygon'
    ) {
      handleConstructionPoint(pointId)
      return
    }

    if (activeTool === 'delete') {
      deleteObject(pointId)
    }
  }

  function handleObjectPointerDown(
    event: PointerEvent<SVGElement>,
    objectId: string,
  ) {
    if (!isEditing || event.button !== 0 || activeTool !== 'delete') {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    focusEditor()
    deleteObject(objectId)
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!drag || !isEditing) {
      return
    }

    const svgPoint = getPointerSvgPoint(event)
    const point = normalizeCanvasPoint(svgPoint, parsedContent.snapToGrid)

    event.preventDefault()
    commitObjects(
      parsedContent.objects.map((object) =>
        object.type === 'point' && object.id === drag.pointId
          ? {
              ...object,
              x: point.x,
              y: point.y,
            }
          : object,
      ),
    )
  }

  function handlePointerEnd(event: PointerEvent<SVGSVGElement>) {
    if (drag?.pointerId === event.pointerId) {
      svgRef.current?.releasePointerCapture(event.pointerId)
      setDrag(null)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement | null

    if (target?.closest('button,input,select,textarea')) {
      return
    }

    if (event.key === 'Enter' && activeTool === 'polygon') {
      if (pendingPointIds.length >= 3) {
        event.preventDefault()
        addPolygon(pendingPointIds)
        setPendingPointIds([])
      }
      return
    }

    if (event.key === 'Escape') {
      setPendingPointIds([])
    }
  }

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="rounded-lg border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-4 focus:ring-teal-100"
    >
      {isEditing && (
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {TOOL_DEFINITIONS.map((definition) => (
              <ToolButton
                key={definition.tool}
                activeTool={activeTool}
                definition={definition}
                onSelect={handleToolSelect}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ToggleButton
              active={parsedContent.showGrid}
              icon={Grid2X2}
              label="Grid"
              onToggle={() => handleToggle('showGrid')}
            />
            <ToggleButton
              active={parsedContent.snapToGrid}
              icon={Magnet}
              label="Snap"
              onToggle={() => handleToggle('snapToGrid')}
            />
          </div>
        </div>
      )}

      <div className="grid gap-4 p-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <figure className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${GEOMETRY_SVG_SIZE} ${GEOMETRY_SVG_SIZE}`}
            role="img"
            aria-label="Coordinate-plane geometry construction"
            className={`h-auto w-full touch-none select-none ${
              isEditing && activeTool === 'select'
                ? drag
                  ? 'cursor-grabbing'
                  : 'cursor-grab'
                : ''
            } ${isEditing && activeTool === 'point' ? 'cursor-crosshair' : ''}`}
            onPointerCancel={handlePointerEnd}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
          >
            <rect width={GEOMETRY_SVG_SIZE} height={GEOMETRY_SVG_SIZE} fill="#ffffff" />

            {parsedContent.showGrid &&
              GRID_TICKS.map((tick) => {
                const verticalStart = geometryPointToSvg({
                  x: tick,
                  y: GEOMETRY_VIEWPORT.yMin,
                })
                const verticalEnd = geometryPointToSvg({
                  x: tick,
                  y: GEOMETRY_VIEWPORT.yMax,
                })
                const horizontalStart = geometryPointToSvg({
                  x: GEOMETRY_VIEWPORT.xMin,
                  y: tick,
                })
                const horizontalEnd = geometryPointToSvg({
                  x: GEOMETRY_VIEWPORT.xMax,
                  y: tick,
                })

                return (
                  <g key={`grid-${tick}`}>
                    <line
                      x1={verticalStart.x}
                      x2={verticalEnd.x}
                      y1={verticalStart.y}
                      y2={verticalEnd.y}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                    <line
                      x1={horizontalStart.x}
                      x2={horizontalEnd.x}
                      y1={horizontalStart.y}
                      y2={horizontalEnd.y}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                  </g>
                )
              })}

            <line
              x1={GEOMETRY_PADDING}
              x2={GEOMETRY_SVG_SIZE - GEOMETRY_PADDING}
              y1={geometryPointToSvg({ x: 0, y: 0 }).y}
              y2={geometryPointToSvg({ x: 0, y: 0 }).y}
              stroke="#94a3b8"
              strokeWidth="1.6"
            />
            <line
              x1={geometryPointToSvg({ x: 0, y: 0 }).x}
              x2={geometryPointToSvg({ x: 0, y: 0 }).x}
              y1={GEOMETRY_PADDING}
              y2={GEOMETRY_SVG_SIZE - GEOMETRY_PADDING}
              stroke="#94a3b8"
              strokeWidth="1.6"
            />

            {GRID_TICKS.filter((tick) => LABELED_TICKS.has(tick)).map((tick) => {
              const xTick = geometryPointToSvg({ x: tick, y: 0 })
              const yTick = geometryPointToSvg({ x: 0, y: tick })

              return (
                <g key={`label-${tick}`} pointerEvents="none">
                  <text
                    x={xTick.x}
                    y={GEOMETRY_SVG_SIZE - 12}
                    fill="#64748b"
                    fontSize="11"
                    textAnchor="middle"
                  >
                    {tick}
                  </text>
                  {tick !== 0 && (
                    <text
                      x={14}
                      y={yTick.y + 4}
                      fill="#64748b"
                      fontSize="11"
                      textAnchor="middle"
                    >
                      {tick}
                    </text>
                  )}
                </g>
              )
            })}

            <g>
              {polygons.map((polygon) => {
                const polygonPoints = getPointsForIds(pointLookup, polygon.pointIds)

                if (!polygonPoints) {
                  return null
                }

                const pointsAttribute = polygonPoints
                  .map((point) => {
                    const svgPoint = geometryPointToSvg(point)

                    return `${svgPoint.x},${svgPoint.y}`
                  })
                  .join(' ')

                return (
                  <polygon
                    key={polygon.id}
                    points={pointsAttribute}
                    fill="#14b8a6"
                    fillOpacity="0.16"
                    stroke="#0f766e"
                    strokeOpacity="0.7"
                    strokeWidth="2"
                    className={
                      isEditing && activeTool === 'delete'
                        ? 'cursor-pointer'
                        : ''
                    }
                    pointerEvents={
                      isEditing && activeTool === 'delete' ? 'visiblePainted' : 'none'
                    }
                    onPointerDown={(event) =>
                      handleObjectPointerDown(event, polygon.id)
                    }
                  />
                )
              })}

              {circles.map((circle) => {
                const centerPoint = pointLookup.get(circle.centerId)
                const radiusPoint = pointLookup.get(circle.radiusPointId)

                if (!centerPoint || !radiusPoint) {
                  return null
                }

                const centerSvgPoint = geometryPointToSvg(centerPoint)
                const radiusSvgPoint = geometryPointToSvg(radiusPoint)
                const radius = Math.hypot(
                  radiusSvgPoint.x - centerSvgPoint.x,
                  radiusSvgPoint.y - centerSvgPoint.y,
                )

                return (
                  <g key={circle.id}>
                    {isEditing && activeTool === 'delete' && (
                      <circle
                        cx={centerSvgPoint.x}
                        cy={centerSvgPoint.y}
                        r={radius}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="14"
                        className="cursor-pointer"
                        onPointerDown={(event) =>
                          handleObjectPointerDown(event, circle.id)
                        }
                      />
                    )}
                    <circle
                      cx={centerSvgPoint.x}
                      cy={centerSvgPoint.y}
                      r={radius}
                      fill="none"
                      stroke="#0891b2"
                      strokeWidth="2.5"
                    />
                  </g>
                )
              })}

              {segments.map((segment) => {
                const segmentPoints = getPointsForIds(pointLookup, segment.pointIds)

                if (!segmentPoints) {
                  return null
                }

                const [firstPoint, secondPoint] = segmentPoints
                const firstSvgPoint = geometryPointToSvg(firstPoint)
                const secondSvgPoint = geometryPointToSvg(secondPoint)

                return (
                  <g key={segment.id}>
                    {isEditing && activeTool === 'delete' && (
                      <line
                        x1={firstSvgPoint.x}
                        x2={secondSvgPoint.x}
                        y1={firstSvgPoint.y}
                        y2={secondSvgPoint.y}
                        stroke="transparent"
                        strokeLinecap="round"
                        strokeWidth="14"
                        className="cursor-pointer"
                        onPointerDown={(event) =>
                          handleObjectPointerDown(event, segment.id)
                        }
                      />
                    )}
                    <line
                      x1={firstSvgPoint.x}
                      x2={secondSvgPoint.x}
                      y1={firstSvgPoint.y}
                      y2={secondSvgPoint.y}
                      stroke="#0f766e"
                      strokeLinecap="round"
                      strokeWidth="3"
                    />
                  </g>
                )
              })}

              {pendingPointIds.length > 0 && (
                <polyline
                  points={pendingPointIds
                    .map((pointId) => pointLookup.get(pointId))
                    .filter((point): point is GeometryPoint => Boolean(point))
                    .map((point) => {
                      const svgPoint = geometryPointToSvg(point)

                      return `${svgPoint.x},${svgPoint.y}`
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#f59e0b"
                  strokeDasharray="5 5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  pointerEvents="none"
                />
              )}

              {points.map((point) => {
                const svgPoint = geometryPointToSvg(point)
                const isPending = pendingPointIds.includes(point.id)

                return (
                  <g
                    key={point.id}
                    className={isEditing ? 'cursor-pointer' : ''}
                    onPointerDown={(event) =>
                      handlePointPointerDown(event, point.id)
                    }
                  >
                    <circle
                      cx={svgPoint.x}
                      cy={svgPoint.y}
                      r="12"
                      fill="transparent"
                    />
                    {isPending && (
                      <circle
                        cx={svgPoint.x}
                        cy={svgPoint.y}
                        r="10"
                        fill="#fef3c7"
                        stroke="#f59e0b"
                        strokeWidth="2"
                      />
                    )}
                    <circle
                      cx={svgPoint.x}
                      cy={svgPoint.y}
                      r="5.5"
                      fill="#0f172a"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                    />
                    <text
                      x={Math.min(svgPoint.x + 12, GEOMETRY_SVG_SIZE - 12)}
                      y={Math.max(svgPoint.y - 10, 18)}
                      fill="#0f172a"
                      fontSize="14"
                      fontWeight="700"
                      paintOrder="stroke"
                      pointerEvents="none"
                      stroke="#ffffff"
                      strokeLinejoin="round"
                      strokeWidth="4"
                    >
                      {point.label}
                    </text>
                  </g>
                )
              })}
            </g>

            <rect
              x={GEOMETRY_PADDING}
              y={GEOMETRY_PADDING}
              width={GRAPH_SIZE}
              height={GRAPH_SIZE}
              fill="none"
              pointerEvents="none"
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          </svg>
        </figure>

        <MeasurementsPanel
          objects={parsedContent.objects}
          pointLookup={pointLookup}
        />
      </div>
    </div>
  )
}
