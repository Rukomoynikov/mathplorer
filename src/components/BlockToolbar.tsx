import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, Copy, Trash2 } from 'lucide-react'
import { BLOCK_TYPE_LABELS, type Block, type NotebookViewMode } from '../types'

type BlockToolbarProps = {
  block: Block
  blockNumber: number
  canMoveDown: boolean
  canMoveUp: boolean
  mode: NotebookViewMode
  onDelete: () => void
  onDuplicate: () => void
  onMoveDown: () => void
  onMoveUp: () => void
}

type ToolbarIconButtonProps = {
  children: ReactNode
  disabled?: boolean
  label: string
  onClick: () => void
  tone?: 'danger' | 'neutral'
}

function ToolbarIconButton({
  children,
  disabled = false,
  label,
  onClick,
  tone = 'neutral',
}: ToolbarIconButtonProps) {
  const toneClasses =
    tone === 'danger'
      ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
      : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border transition disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-transparent ${toneClasses}`}
    >
      {children}
    </button>
  )
}

export default function BlockToolbar({
  block,
  blockNumber,
  canMoveDown,
  canMoveUp,
  mode,
  onDelete,
  onDuplicate,
  onMoveDown,
  onMoveUp,
}: BlockToolbarProps) {
  const isEditing = mode === 'edit'

  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-white px-2 text-xs font-semibold text-teal-700 ring-1 ring-slate-200">
          {blockNumber}
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">
              {BLOCK_TYPE_LABELS[block.type]}
            </p>
            <span className="rounded bg-white px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
              block
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Updated {new Date(block.updatedAt).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      {isEditing && (
        <div className="flex flex-wrap gap-2">
          <ToolbarIconButton
            label="Move block up"
            onClick={onMoveUp}
            disabled={!canMoveUp}
          >
            <ArrowUp size={15} aria-hidden="true" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label="Move block down"
            onClick={onMoveDown}
            disabled={!canMoveDown}
          >
            <ArrowDown size={15} aria-hidden="true" />
          </ToolbarIconButton>
          <ToolbarIconButton label="Duplicate block" onClick={onDuplicate}>
            <Copy size={15} aria-hidden="true" />
          </ToolbarIconButton>
          <ToolbarIconButton label="Delete block" onClick={onDelete} tone="danger">
            <Trash2 size={15} aria-hidden="true" />
          </ToolbarIconButton>
        </div>
      )}
    </div>
  )
}
