import { useEffect, useState } from 'react'
import Notebook from './components/Notebook'
import { createBlock } from './data/blockFactory'
import type { Block, BlockType } from './types'

const STORAGE_KEY = 'math-notebook-lab:v1'

function isBlockType(value: unknown): value is BlockType {
  return (
    value === 'text' ||
    value === 'formula' ||
    value === 'graph' ||
    value === 'solver' ||
    value === 'explanation'
  )
}

function isStoredBlock(value: unknown): value is Block {
  if (!value || typeof value !== 'object') {
    return false
  }

  const block = value as Record<string, unknown>

  return (
    typeof block.id === 'string' &&
    isBlockType(block.type) &&
    typeof block.content === 'string' &&
    typeof block.createdAt === 'number' &&
    typeof block.updatedAt === 'number'
  )
}

function loadNotebook(): Block[] {
  if (typeof window === 'undefined') {
    return []
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY)

  if (!storedValue) {
    return []
  }

  try {
    const parsed = JSON.parse(storedValue)

    if (Array.isArray(parsed) && parsed.every(isStoredBlock)) {
      return parsed
    }
  } catch {
    return []
  }

  return []
}

function normalizeFormulaContent(content: string) {
  const trimmed = content.trim()

  if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
    return trimmed.slice(2, -2).trim()
  }

  if (trimmed.startsWith('\\[') && trimmed.endsWith('\\]')) {
    return trimmed.slice(2, -2).trim()
  }

  return trimmed
}

function formulaToGraphContent(content: string) {
  const normalized = normalizeFormulaContent(content)

  if (!normalized) {
    return 'y = '
  }

  if (/^y\s*=/.test(normalized)) {
    return normalized
  }

  const functionMatch = normalized.match(/^[a-z]\s*\(\s*x\s*\)\s*=\s*(.+)$/i)

  if (functionMatch?.[1]) {
    return `y = ${functionMatch[1].trim()}`
  }

  return `y = ${normalized}`
}

function App() {
  const [blocks, setBlocks] = useState<Block[]>(loadNotebook)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks))
  }, [blocks])

  function handleAddBlock(type: BlockType) {
    setBlocks((currentBlocks) => [...currentBlocks, createBlock(type)])
  }

  function handleInsertBlockAfter(
    sourceId: string,
    type: BlockType,
    content: string,
  ) {
    setBlocks((currentBlocks) => {
      const sourceIndex = currentBlocks.findIndex((block) => block.id === sourceId)

      if (sourceIndex === -1) {
        return currentBlocks
      }

      const derivedBlock = createBlock(type, content)

      return [
        ...currentBlocks.slice(0, sourceIndex + 1),
        derivedBlock,
        ...currentBlocks.slice(sourceIndex + 1),
      ]
    })
  }

  function handleUpdateBlock(id: string, content: string) {
    setBlocks((currentBlocks) =>
      currentBlocks.map((block) =>
        block.id === id ? { ...block, content, updatedAt: Date.now() } : block,
      ),
    )
  }

  function handleDeleteBlock(id: string) {
    setBlocks((currentBlocks) => currentBlocks.filter((block) => block.id !== id))
  }

  function handleDuplicateBlock(id: string) {
    setBlocks((currentBlocks) => {
      const sourceIndex = currentBlocks.findIndex((block) => block.id === id)

      if (sourceIndex === -1) {
        return currentBlocks
      }

      const sourceBlock = currentBlocks[sourceIndex]
      const duplicatedBlock = createBlock(sourceBlock.type, sourceBlock.content)

      return [
        ...currentBlocks.slice(0, sourceIndex + 1),
        duplicatedBlock,
        ...currentBlocks.slice(sourceIndex + 1),
      ]
    })
  }

  function handleCreateGraphFromFormula(id: string) {
    const sourceBlock = blocks.find((block) => block.id === id)

    if (!sourceBlock) {
      return
    }

    handleInsertBlockAfter(id, 'graph', formulaToGraphContent(sourceBlock.content))
  }

  function handleCreateExplanationFromFormula(id: string) {
    const sourceBlock = blocks.find((block) => block.id === id)

    if (!sourceBlock) {
      return
    }

    const normalized = normalizeFormulaContent(sourceBlock.content)
    handleInsertBlockAfter(id, 'explanation', `Explain this formula: ${normalized}`)
  }

  function handleMoveBlock(id: string, direction: 'up' | 'down') {
    setBlocks((currentBlocks) => {
      const sourceIndex = currentBlocks.findIndex((block) => block.id === id)
      const targetIndex = direction === 'up' ? sourceIndex - 1 : sourceIndex + 1

      if (
        sourceIndex === -1 ||
        targetIndex < 0 ||
        targetIndex >= currentBlocks.length
      ) {
        return currentBlocks
      }

      const nextBlocks = [...currentBlocks]
      const [movedBlock] = nextBlocks.splice(sourceIndex, 1)
      nextBlocks.splice(targetIndex, 0, movedBlock)

      return nextBlocks
    })
  }

  function handleClearNotebook() {
    setBlocks([])
  }

  return (
    <main className="min-h-screen px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-teal-700">
              Math Notebook Lab
            </p>
            <h1 className="mt-2 text-4xl font-semibold text-slate-950">
              Interactive math notes, one block at a time.
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Build a local notebook of notes, formulas, graphs, solvers, and
              explanations while exploring a concept.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:min-w-64">
            <p className="text-sm font-medium text-slate-700">
              Saved locally in this browser
            </p>
            <p className="text-sm text-slate-500">
              {blocks.length} {blocks.length === 1 ? 'block' : 'blocks'} in this
              notebook.
            </p>
            <button
              type="button"
              onClick={handleClearNotebook}
              disabled={blocks.length === 0}
              className="rounded-md border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent"
            >
              Clear notebook
            </button>
          </div>
        </header>

        <Notebook
          blocks={blocks}
          onAddBlock={handleAddBlock}
          onUpdateBlock={handleUpdateBlock}
          onDeleteBlock={handleDeleteBlock}
          onDuplicateBlock={handleDuplicateBlock}
          onCreateExplanationFromFormula={handleCreateExplanationFromFormula}
          onCreateGraphFromFormula={handleCreateGraphFromFormula}
          onMoveBlock={handleMoveBlock}
        />
      </div>
    </main>
  )
}

export default App
