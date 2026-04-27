export type BlockType =
  | 'text'
  | 'formula'
  | 'graph'
  | 'solver'
  | 'explanation'
  | 'set'
  | 'combinatorics'
  | 'probability'
export type NotebookViewMode = 'preview' | 'edit'

export type Block = {
  id: string
  type: BlockType
  content: string
  createdAt: number
  updatedAt: number
}

export type Notebook = {
  id: string
  title: string
  blocks: Block[]
  createdAt: number
  updatedAt: number
}

export type NotebookWorkspace = {
  version: 2
  notebooks: Notebook[]
  currentNotebookId: string | null
}

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  text: 'Text',
  formula: 'Formula',
  graph: 'Graph',
  solver: 'Solver',
  explanation: 'Explanation',
  set: 'Set',
  combinatorics: 'Combinatorics',
  probability: 'Probability',
}

export const BLOCK_TYPE_DESCRIPTIONS: Record<BlockType, string> = {
  text: 'Write notes and rough thinking.',
  formula: 'Capture a formula for later rendering.',
  graph: 'Plot functions, point sets, and parametric curves.',
  solver: 'Enter an equation to solve in steps.',
  explanation: 'Ask for a concept explanation.',
  set: 'Compare two finite sets.',
  combinatorics: 'Count arrangements and choices.',
  probability: 'Turn outcomes into probability.',
}
