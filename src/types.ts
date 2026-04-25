export type BlockType = 'text' | 'formula' | 'graph' | 'solver' | 'explanation'

export type Block = {
  id: string
  type: BlockType
  content: string
  createdAt: number
  updatedAt: number
}

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  text: 'Text',
  formula: 'Formula',
  graph: 'Graph',
  solver: 'Solver',
  explanation: 'Explanation',
}

export const BLOCK_TYPE_DESCRIPTIONS: Record<BlockType, string> = {
  text: 'Write notes and rough thinking.',
  formula: 'Capture a formula for later rendering.',
  graph: 'Describe a function to plot soon.',
  solver: 'Enter an equation to solve in steps.',
  explanation: 'Ask for a concept explanation.',
}
