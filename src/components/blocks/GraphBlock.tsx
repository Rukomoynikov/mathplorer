import { useMemo } from 'react'
import BlockEditorShell from './BlockEditorShell'
import {
  createPlot,
  formatGraphTick,
  PADDING,
  SVG_HEIGHT,
  SVG_WIDTH,
  X_MAX,
  X_MIN,
  type PlotResult,
} from '../../lib/graphPlot'

type GraphBlockProps = {
  content: string
  onChange: (content: string) => void
}

function GraphMessage({ plot }: { plot: Extract<PlotResult, { kind: 'empty' | 'error' }> }) {
  const isError = plot.kind === 'error'

  return (
    <div
      className={`mt-3 rounded-md border p-4 ${
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
    </div>
  )
}

function GraphPreview({ plot }: { plot: PlotResult }) {
  if (plot.kind !== 'plot') {
    return <GraphMessage plot={plot} />
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
      helperText="Graph functions of x from -10 to 10. Try sin(x), sqrt(x), abs(x), or x^2 - 4*x + 3."
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
        placeholder="y = x^2 - 4*x + 3"
        className="min-h-28 rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm leading-6 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
      />
    </BlockEditorShell>
  )
}
