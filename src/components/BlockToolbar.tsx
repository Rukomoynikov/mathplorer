import { BLOCK_TYPE_LABELS, type Block } from '../types'

type BlockToolbarProps = {
  block: Block
  blockNumber: number
  canMoveDown: boolean
  canMoveUp: boolean
  onDelete: () => void
  onDuplicate: () => void
  onMoveDown: () => void
  onMoveUp: () => void
}

export default function BlockToolbar({
  block,
  blockNumber,
  canMoveDown,
  canMoveUp,
  onDelete,
  onDuplicate,
  onMoveDown,
  onMoveUp,
}: BlockToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-cyan-50 px-2 text-xs font-semibold text-cyan-800">
          {blockNumber}
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {BLOCK_TYPE_LABELS[block.type]} block
          </p>
          <p className="text-xs text-slate-500">
            Updated {new Date(block.updatedAt).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          Up
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          Down
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Duplicate
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
