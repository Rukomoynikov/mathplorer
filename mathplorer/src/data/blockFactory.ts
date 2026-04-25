import type { Block, BlockType } from '../types'

const DEFAULT_BLOCK_CONTENT: Record<BlockType, string> = {
  text: '## Notes\n\nWrite **key ideas** here, and use inline math like $x^2 + 1$.',
  formula: 'f(x) = x^2 - 4x + 3',
  graph: 'y = x^2 - 4x + 3',
  solver: '2x + 5 = 17',
  explanation: 'Explain why changing a in y = ax^2 changes the parabola.',
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `block-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createBlock(type: BlockType, content = DEFAULT_BLOCK_CONTENT[type]): Block {
  const now = Date.now()

  return {
    id: createId(),
    type,
    content,
    createdAt: now,
    updatedAt: now,
  }
}
