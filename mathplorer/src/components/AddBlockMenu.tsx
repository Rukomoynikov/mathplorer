import { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  BLOCK_TYPE_DESCRIPTIONS,
  BLOCK_TYPE_LABELS,
  type BlockType,
} from '../types'

const BLOCK_TYPES: BlockType[] = ['text', 'formula', 'graph', 'solver', 'explanation']

type AddBlockMenuProps = {
  onAddBlock: (type: BlockType) => void
}

export default function AddBlockMenu({ onAddBlock }: AddBlockMenuProps) {
  const [selectedType, setSelectedType] = useState<BlockType>('text')

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-slate-300 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-800">New block</p>
        <p className="text-sm text-slate-500">
          {BLOCK_TYPE_DESCRIPTIONS[selectedType]}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="block-type">
          Block type
        </label>
        <select
          id="block-type"
          value={selectedType}
          onChange={(event) => setSelectedType(event.target.value as BlockType)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
        >
          {BLOCK_TYPES.map((type) => (
            <option key={type} value={type}>
              {BLOCK_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onAddBlock(selectedType)}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-200"
        >
          <Plus size={16} aria-hidden="true" />
          Add block
        </button>
      </div>
    </div>
  )
}
