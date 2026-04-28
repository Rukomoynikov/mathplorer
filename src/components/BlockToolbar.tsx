import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, Copy, Trash2 } from 'lucide-react'
import { BLOCK_META } from './blockMeta'
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
      ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent ${toneClasses}`}
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
  const meta = BLOCK_META[block.type]
  const Icon = meta.icon

  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-md ${meta.iconBg} ${meta.iconColor} ring-1 ${meta.ringColor}`}
        >
          <Icon size={15} aria-hidden="true" />
        </span>
        <div className="leading-tight">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">
              {BLOCK_TYPE_LABELS[block.type]}
            </p>
            <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500 ring-1 ring-slate-200">
              #{blockNumber}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Updated{' '}
            {new Date(block.updatedAt).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      {isEditing && (
        <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm">
          <ToolbarIconButton
            label="Move block up"
            onClick={onMoveUp}
            disabled={!canMoveUp}
          >
            <ArrowUp size={14} aria-hidden="true" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label="Move block down"
            onClick={onMoveDown}
            disabled={!canMoveDown}
          >
            <ArrowDown size={14} aria-hidden="true" />
          </ToolbarIconButton>
          <span className="mx-0.5 h-4 w-px bg-slate-200" aria-hidden="true" />
          <ToolbarIconButton label="Duplicate block" onClick={onDuplicate}>
            <Copy size={14} aria-hidden="true" />
          </ToolbarIconButton>
          <ToolbarIconButton label="Delete block" onClick={onDelete} tone="danger">
            <Trash2 size={14} aria-hidden="true" />
          </ToolbarIconButton>
        </div>
      )}
    </div>
  )
}
