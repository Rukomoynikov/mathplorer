import { Plus } from 'lucide-react'
import { BLOCK_META } from './blockMeta'
import {
  BLOCK_TYPE_DESCRIPTIONS,
  BLOCK_TYPE_LABELS,
  type BlockType,
} from '../types'

const BLOCK_GROUPS: Array<{
  label: string
  types: BlockType[]
}> = [
  { label: 'Write', types: ['text', 'explanation'] },
  { label: 'Model', types: ['formula', 'solver', 'set'] },
  { label: 'Visualize', types: ['graph', 'geometry'] },
  { label: 'Count', types: ['combinatorics', 'probability'] },
]

type AddBlockMenuProps = {
  onAddBlock: (type: BlockType) => void
}

export default function AddBlockMenu({ onAddBlock }: AddBlockMenuProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        <div className="flex min-w-40 items-center gap-2 pt-1 text-sm font-semibold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-50 text-teal-700 ring-1 ring-teal-100">
            <Plus size={16} aria-hidden="true" />
          </span>
          Add block
        </div>

        <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {BLOCK_GROUPS.map((group) => (
            <section key={group.label} className="min-w-0">
              <p className="mb-2 text-[11px] font-semibold uppercase text-slate-500">
                {group.label}
              </p>
              <div className="grid gap-1.5">
                {group.types.map((type) => {
                  const meta = BLOCK_META[type]
                  const Icon = meta.icon

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => onAddBlock(type)}
                      className="group flex min-h-12 min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-left transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-100"
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${meta.iconBg} ${meta.iconColor} ring-1 ${meta.ringColor}`}
                      >
                        <Icon size={15} aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-900">
                          {BLOCK_TYPE_LABELS[type]}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {BLOCK_TYPE_DESCRIPTIONS[type]}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
