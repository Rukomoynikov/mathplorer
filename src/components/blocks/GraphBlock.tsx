import {
  useEffect,
  useId,
  useMemo,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import BlockEditorShell from './BlockEditorShell'
import type { NotebookViewMode } from '../../types'
import {
  createPlot,
  formatGraphTick,
  PADDING,
  SVG_HEIGHT,
  SVG_WIDTH,
  type PlotPoint,
  type PlotResult,
  type PlotSeries,
  type PlotViewport,
  type PlotWarning,
} from '../../lib/graphPlot'

type GraphBlockProps = {
  content: string
  mode: NotebookViewMode
  onChange: (content: string) => void
}

type DragState = {
  pointerId: number
  startClientX: number
  startClientY: number
  viewport: PlotViewport
}

type NearestPoint = PlotPoint & {
  color: string
  distance: number
  label: string
}

type HoverState = {
  nearest: NearestPoint | null
  svgX: number
  svgY: number
  x: number
  y: number
}

type ViewportDraft = Record<keyof PlotViewport, string>

const VIEWPORT_KEYS: Array<keyof PlotViewport> = [
  'xMin',
  'xMax',
  'yMin',
  'yMax',
]

const VIEWPORT_LABELS: Record<keyof PlotViewport, string> = {
  xMax: 'x max',
  xMin: 'x min',
  yMax: 'y max',
  yMin: 'y min',
}

function GraphMessage({
  mode,
  plot,
}: {
  mode: NotebookViewMode
  plot: Extract<PlotResult, { kind: 'empty' | 'error' }>
}) {
  const isError = plot.kind === 'error'

  return (
    <div
      className={`rounded-md border p-4 ${mode === 'edit' ? 'mt-3' : ''} ${
        isError ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'
      }`}
    >
      <p
        className={`text-sm font-semibold ${
          isError ? 'text-amber-950' : 'text-slate-800'
        }`}
      >
        {isError ? 'Cannot graph yet' : 'Ready for a function'}
      </p>
      <p
        className={`mt-1 text-sm leading-6 ${
          isError ? 'text-amber-900' : 'text-slate-600'
        }`}
      >
        {isError ? plot.error : plot.message}
      </p>
      {isError && plot.expression && (
        <code className="mt-3 inline-flex rounded bg-white px-2 py-1 font-mono text-xs text-amber-950">
          {plot.expression}
        </code>
      )}
      <GraphWarnings warnings={plot.warnings} />
    </div>
  )
}

function GraphWarnings({ warnings }: { warnings: PlotWarning[] }) {
  if (warnings.length === 0) {
    return null
  }

  return (
    <div className="mt-3 space-y-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950">
      {warnings.slice(0, 4).map((warning) => (
        <p key={`${warning.line}-${warning.message}`}>
          Line {warning.line}: {warning.message}
        </p>
      ))}
      {warnings.length > 4 && <p>{warnings.length - 4} more warnings</p>}
    </div>
  )
}

function formatBound(value: number) {
  return String(Number(value.toFixed(4)))
}

function viewportToDraft(viewport: PlotViewport): ViewportDraft {
  return {
    xMax: formatBound(viewport.xMax),
    xMin: formatBound(viewport.xMin),
    yMax: formatBound(viewport.yMax),
    yMin: formatBound(viewport.yMin),
  }
}

function isValidViewport(viewport: PlotViewport) {
  return (
    Number.isFinite(viewport.xMin) &&
    Number.isFinite(viewport.xMax) &&
    Number.isFinite(viewport.yMin) &&
    Number.isFinite(viewport.yMax) &&
    viewport.xMin < viewport.xMax &&
    viewport.yMin < viewport.yMax
  )
}

function constrainViewport(viewport: PlotViewport): PlotViewport {
  const minSpan = 0.001
  const xSpan = viewport.xMax - viewport.xMin
  const ySpan = viewport.yMax - viewport.yMin

  if (xSpan < minSpan || ySpan < minSpan || !isValidViewport(viewport)) {
    return viewport
  }

  return viewport
}

function formatViewportDirective(viewport: PlotViewport) {
  return `window: x=${formatBound(viewport.xMin)}..${formatBound(
    viewport.xMax,
  )}, y=${formatBound(viewport.yMin)}..${formatBound(viewport.yMax)}`
}

function upsertWindowDirective(content: string, viewport: PlotViewport) {
  const directive = formatViewportDirective(viewport)
  const lines = content.split(/\r?\n/)
  const windowLineIndex = lines.findIndex((line) => /^\s*window\s*:/i.test(line))

  if (windowLineIndex >= 0) {
    return lines
      .map((line, index) => (index === windowLineIndex ? directive : line))
      .join('\n')
  }

  return content.trim() ? `${content.trimEnd()}\n${directive}` : directive
}

function zoomViewport(viewport: PlotViewport, factor: number): PlotViewport {
  const centerX = (viewport.xMin + viewport.xMax) / 2
  const centerY = (viewport.yMin + viewport.yMax) / 2
  const nextXSpan = (viewport.xMax - viewport.xMin) * factor
  const nextYSpan = (viewport.yMax - viewport.yMin) * factor

  return constrainViewport({
    xMax: centerX + nextXSpan / 2,
    xMin: centerX - nextXSpan / 2,
    yMax: centerY + nextYSpan / 2,
    yMin: centerY - nextYSpan / 2,
  })
}

function panViewport(
  viewport: PlotViewport,
  deltaX: number,
  deltaY: number,
  graphWidth: number,
  graphHeight: number,
): PlotViewport {
  const xUnits = (deltaX / graphWidth) * (viewport.xMax - viewport.xMin)
  const yUnits = (deltaY / graphHeight) * (viewport.yMax - viewport.yMin)

  return {
    xMax: viewport.xMax - xUnits,
    xMin: viewport.xMin - xUnits,
    yMax: viewport.yMax + yUnits,
    yMin: viewport.yMin + yUnits,
  }
}

function getSeriesPoints(series: PlotSeries) {
  if (series.kind === 'points') {
    return series.points
  }

  return series.segments.flat()
}

function findNearestPoint({
  plot,
  scaleX,
  scaleY,
  svgX,
  svgY,
}: {
  plot: Extract<PlotResult, { kind: 'plot' }>
  scaleX: (x: number) => number
  scaleY: (y: number) => number
  svgX: number
  svgY: number
}) {
  let nearest: NearestPoint | null = null

  for (const series of plot.series) {
    for (const point of getSeriesPoints(series)) {
      const distance = Math.hypot(scaleX(point.x) - svgX, scaleY(point.y) - svgY)

      if (distance <= 28 && (!nearest || distance < nearest.distance)) {
        nearest = {
          ...point,
          color: series.color,
          distance,
          label: series.label,
        }
      }
    }
  }

  return nearest
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100"
    >
      {children}
    </button>
  )
}

function ViewportEditor({
  onApply,
  viewport,
}: {
  onApply: (viewport: PlotViewport) => void
  viewport: PlotViewport
}) {
  const [draft, setDraft] = useState<ViewportDraft>(() => viewportToDraft(viewport))

  useEffect(() => {
    setDraft(viewportToDraft(viewport))
  }, [viewport.xMax, viewport.xMin, viewport.yMax, viewport.yMin])

  function commitDraft(nextDraft = draft) {
    const nextViewport = {
      xMax: Number(nextDraft.xMax),
      xMin: Number(nextDraft.xMin),
      yMax: Number(nextDraft.yMax),
      yMin: Number(nextDraft.yMin),
    }

    if (isValidViewport(nextViewport)) {
      onApply(nextViewport)
    } else {
      setDraft(viewportToDraft(viewport))
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.currentTarget.blur()
    }

    if (event.key === 'Escape') {
      setDraft(viewportToDraft(viewport))
      event.currentTarget.blur()
    }
  }

  return (
    <div className="grid gap-2 border-t border-slate-100 bg-slate-50/70 px-3 py-3 sm:grid-cols-4">
      {VIEWPORT_KEYS.map((key) => (
        <label key={key} className="flex min-w-0 flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {VIEWPORT_LABELS[key]}
          </span>
          <input
            value={draft[key]}
            inputMode="decimal"
            onBlur={() => commitDraft()}
            onChange={(event) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                [key]: event.target.value,
              }))
            }
            onKeyDown={handleKeyDown}
            className="h-9 min-w-0 rounded-md border border-slate-200 bg-white px-2 font-mono text-xs text-slate-900 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
          />
        </label>
      ))}
    </div>
  )
}

function GraphPreview({
  content,
  mode,
  onPersistViewport,
  onResetViewport,
  onViewportChange,
  plot,
}: {
  content: string
  mode: NotebookViewMode
  onPersistViewport: (viewport: PlotViewport) => void
  onResetViewport: () => void
  onViewportChange: (viewport: PlotViewport) => void
  plot: PlotResult
}) {
  const clipPathId = `graph-clip-${useId().replace(/:/g, '')}`
  const [drag, setDrag] = useState<DragState | null>(null)
  const [hover, setHover] = useState<HoverState | null>(null)

  if (plot.kind !== 'plot') {
    return <GraphMessage mode={mode} plot={plot} />
  }

  const plottedGraph = plot
  const graphWidth = SVG_WIDTH - PADDING * 2
  const graphHeight = SVG_HEIGHT - PADDING * 2
  const { viewport } = plot
  const xSpan = viewport.xMax - viewport.xMin
  const ySpan = viewport.yMax - viewport.yMin
  const scaleX = (x: number) => PADDING + ((x - viewport.xMin) / xSpan) * graphWidth
  const scaleY = (y: number) =>
    PADDING + ((viewport.yMax - y) / ySpan) * graphHeight
  const unscaleX = (svgX: number) =>
    viewport.xMin + ((svgX - PADDING) / graphWidth) * xSpan
  const unscaleY = (svgY: number) =>
    viewport.yMax - ((svgY - PADDING) / graphHeight) * ySpan
  const xAxisY = viewport.yMin <= 0 && viewport.yMax >= 0 ? scaleY(0) : null
  const yAxisX = viewport.xMin <= 0 && viewport.xMax >= 0 ? scaleX(0) : null

  function getPointerPosition(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    const svgX = ((event.clientX - bounds.left) / bounds.width) * SVG_WIDTH
    const svgY = ((event.clientY - bounds.top) / bounds.height) * SVG_HEIGHT
    const isInsidePlot =
      svgX >= PADDING &&
      svgX <= SVG_WIDTH - PADDING &&
      svgY >= PADDING &&
      svgY <= SVG_HEIGHT - PADDING

    return {
      isInsidePlot,
      svgX,
      svgY,
      x: unscaleX(svgX),
      y: unscaleY(svgY),
    }
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0) {
      return
    }

    const pointerPosition = getPointerPosition(event)

    if (!pointerPosition.isInsidePlot) {
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
    setDrag({
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      viewport,
    })
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (drag) {
      const nextViewport = panViewport(
        drag.viewport,
        event.clientX - drag.startClientX,
        event.clientY - drag.startClientY,
        graphWidth,
        graphHeight,
      )
      onViewportChange(nextViewport)
      return
    }

    const pointerPosition = getPointerPosition(event)

    if (!pointerPosition.isInsidePlot) {
      setHover(null)
      return
    }

    setHover({
      ...pointerPosition,
      nearest: findNearestPoint({
        plot: plottedGraph,
        scaleX,
        scaleY,
        svgX: pointerPosition.svgX,
        svgY: pointerPosition.svgY,
      }),
    })
  }

  function handlePointerEnd(event: PointerEvent<SVGSVGElement>) {
    if (drag?.pointerId === event.pointerId) {
      event.currentTarget.releasePointerCapture(event.pointerId)
      setDrag(null)
    }
  }

  const tooltipWidth = 172
  const tooltipHeight = hover?.nearest ? 56 : 36
  const tooltipX = hover
    ? Math.min(Math.max(hover.svgX + 12, 8), SVG_WIDTH - tooltipWidth - 8)
    : 0
  const tooltipY = hover
    ? Math.min(Math.max(hover.svgY - tooltipHeight - 12, 8), SVG_HEIGHT - tooltipHeight - 8)
    : 0

  return (
    <figure
      className={`overflow-hidden rounded-md border border-slate-200 bg-white ${
        mode === 'edit' ? 'mt-3' : ''
      }`}
    >
      <div className="flex flex-col gap-2 border-b border-slate-100 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {plot.series.map((series) => (
            <span
              key={series.id}
              className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
              title={series.label}
            >
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: series.color }}
              />
              <span className="truncate font-mono">{series.label}</span>
            </span>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <IconButton label="Zoom in" onClick={() => onViewportChange(zoomViewport(viewport, 0.72))}>
            <ZoomIn aria-hidden="true" size={16} strokeWidth={2.2} />
          </IconButton>
          <IconButton label="Zoom out" onClick={() => onViewportChange(zoomViewport(viewport, 1.35))}>
            <ZoomOut aria-hidden="true" size={16} strokeWidth={2.2} />
          </IconButton>
          <IconButton label="Reset view" onClick={onResetViewport}>
            <RotateCcw aria-hidden="true" size={16} strokeWidth={2.2} />
          </IconButton>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        role="img"
        aria-label={`Graph with ${plot.series.length} plotted ${
          plot.series.length === 1 ? 'series' : 'series'
        }`}
        className={`h-auto w-full touch-none select-none ${
          drag ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onPointerCancel={handlePointerEnd}
        onPointerDown={handlePointerDown}
        onPointerLeave={() => {
          if (!drag) {
            setHover(null)
          }
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
      >
        <defs>
          <clipPath id={clipPathId}>
            <rect
              x={PADDING}
              y={PADDING}
              width={graphWidth}
              height={graphHeight}
            />
          </clipPath>
        </defs>
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
              {formatGraphTick(tick)}
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
              {formatGraphTick(tick)}
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

        <g clipPath={`url(#${clipPathId})`}>
          {plot.series.map((series) => {
            if (series.kind === 'points') {
              return (
                <g key={series.id}>
                  {series.points.map((point, index) => (
                    <circle
                      key={`${series.id}-${index}`}
                      cx={scaleX(point.x)}
                      cy={scaleY(point.y)}
                      r="4.5"
                      fill={series.color}
                      fillOpacity="0.9"
                    />
                  ))}
                </g>
              )
            }

            return series.segments.map((segment, segmentIndex) => (
              <path
                key={`${series.id}-${segmentIndex}`}
                d={segment
                  .map((point, index) => {
                    const command = index === 0 ? 'M' : 'L'
                    return `${command} ${scaleX(point.x).toFixed(2)} ${scaleY(
                      point.y,
                    ).toFixed(2)}`
                  })
                  .join(' ')}
                fill="none"
                stroke={series.color}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={series.kind === 'parametric' ? '2.5' : '3'}
              />
            ))
          })}
        </g>

        {hover && (
          <g pointerEvents="none">
            <line
              x1={hover.svgX}
              x2={hover.svgX}
              y1={PADDING}
              y2={SVG_HEIGHT - PADDING}
              stroke="#94a3b8"
              strokeDasharray="4 4"
            />
            <line
              x1={PADDING}
              x2={SVG_WIDTH - PADDING}
              y1={hover.svgY}
              y2={hover.svgY}
              stroke="#94a3b8"
              strokeDasharray="4 4"
            />
            {hover.nearest && (
              <circle
                cx={scaleX(hover.nearest.x)}
                cy={scaleY(hover.nearest.y)}
                r="6"
                fill="#ffffff"
                stroke={hover.nearest.color}
                strokeWidth="3"
              />
            )}
            <g transform={`translate(${tooltipX} ${tooltipY})`}>
              <rect
                width={tooltipWidth}
                height={tooltipHeight}
                rx="6"
                fill="#0f172a"
                opacity="0.94"
              />
              <text x="10" y="20" fill="#ffffff" fontFamily="monospace" fontSize="12">
                x={formatGraphTick(hover.nearest?.x ?? hover.x)}, y=
                {formatGraphTick(hover.nearest?.y ?? hover.y)}
              </text>
              {hover.nearest && (
                <text
                  x="10"
                  y="40"
                  fill="#cbd5e1"
                  fontFamily="monospace"
                  fontSize="11"
                >
                  {hover.nearest.label.slice(0, 24)}
                </text>
              )}
            </g>
          </g>
        )}
      </svg>

      <div className="border-t border-slate-100 px-3 py-2">
        <code className="font-mono text-xs text-slate-600">
          {content
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line && !/^window\s*:/i.test(line))
            .join('  |  ')}
        </code>
      </div>
      <GraphWarnings warnings={plot.warnings} />
      {mode === 'edit' && (
        <ViewportEditor viewport={viewport} onApply={onPersistViewport} />
      )}
    </figure>
  )
}

export default function GraphBlock({ content, mode, onChange }: GraphBlockProps) {
  const [viewportOverride, setViewportOverride] = useState<PlotViewport | null>(null)

  useEffect(() => {
    setViewportOverride(null)
  }, [content])

  const plot = useMemo(
    () => createPlot(content, viewportOverride ? { viewport: viewportOverride } : {}),
    [content, viewportOverride],
  )

  function handlePersistViewport(viewport: PlotViewport) {
    onChange(upsertWindowDirective(content, viewport))
    setViewportOverride(null)
  }

  return (
    <BlockEditorShell
      label="Graph"
      helperText="Use one line per function, points: (-2, 4), (0, 0), or parametric: x = cos(t); y = sin(t); t = 0..2*pi."
      mode={mode}
      output={
        <div>
          {mode === 'edit' && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Graph preview
            </p>
          )}
          <GraphPreview
            content={content}
            mode={mode}
            onPersistViewport={handlePersistViewport}
            onResetViewport={() => setViewportOverride(null)}
            onViewportChange={setViewportOverride}
            plot={plot}
          />
        </div>
      }
    >
      <textarea
        value={content}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        placeholder="y = x^2 - 4*x + 3"
        className="min-h-32 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm leading-6 text-slate-900 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
      />
    </BlockEditorShell>
  )
}
