import { Plus } from 'lucide-react'
import { BLOCK_META } from './blockMeta'
import {
  BLOCK_TYPE_DESCRIPTIONS,
  BLOCK_TYPE_LABELS,
  type BlockType,
} from '../types'

const BLOCK_TYPES: BlockType[] = [
  'text',
  'formula',
  'graph',
  'solver',
  'explanation',
  'set',
  'combinatorics',
  'probability',
]

type AddBlockMenuProps = {
  onAddBlock: (type: BlockType) => void
}

export default function AddBlockMenu({ onAddBlock }: AddBlockMenuProps) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] backdrop-blur sm:p-5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        <Plus size={13} aria-hidden="true" className="text-teal-700" />
        Add a block
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {BLOCK_TYPES.map((type) => {
          const meta = BLOCK_META[type]
          const Icon = meta.icon

          return (
            <button
              key={type}
              type="button"
              onClick={() => onAddBlock(type)}
              className="group relative flex flex-col items-start gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-3 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${meta.iconBg} ${meta.iconColor} ring-1 ${meta.ringColor}`}
              >
                <Icon size={16} aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {BLOCK_TYPE_LABELS[type]}
              </span>
              <span className="text-[11px] leading-4 text-slate-500">
                {BLOCK_TYPE_DESCRIPTIONS[type]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
