import { useEffect, useRef, useState } from 'react'
import { BookOpen, Download, RotateCcw, Upload } from 'lucide-react'
import Notebook from './components/Notebook'
import { createBlock } from './data/blockFactory'
import { createSampleNotebook } from './data/sampleNotebook'
import type { Block, BlockType } from './types'

const STORAGE_KEY = 'math-notebook-lab:v1'

type AppNotice = {
  message: string
  tone: 'error' | 'success'
}

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

function getImportBlocks(parsedNotebook: unknown): Block[] | null {
  if (Array.isArray(parsedNotebook) && parsedNotebook.every(isStoredBlock)) {
    return parsedNotebook
  }

  if (parsedNotebook && typeof parsedNotebook === 'object') {
    const blocks = (parsedNotebook as Record<string, unknown>).blocks

    if (Array.isArray(blocks) && blocks.every(isStoredBlock)) {
      return blocks
    }
  }

  return null
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
  const [notice, setNotice] = useState<AppNotice | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks))
  }, [blocks])

  function handleAddBlock(type: BlockType) {
    setBlocks((currentBlocks) => [...currentBlocks, createBlock(type)])
    setNotice(null)
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
    setNotice({
      tone: 'success',
      message: 'Notebook cleared.',
    })
  }

  function handleLoadSampleNotebook() {
    setBlocks(createSampleNotebook())
    setNotice({
      tone: 'success',
      message: 'Sample notebook loaded.',
    })
  }

  function handleExportNotebook() {
    const exportedNotebook = {
      app: 'Math Notebook Lab',
      version: 1,
      exportedAt: new Date().toISOString(),
      blocks,
    }
    const json = JSON.stringify(exportedNotebook, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const downloadUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const dateStamp = new Date().toISOString().slice(0, 10)

    anchor.href = downloadUrl
    anchor.download = `math-notebook-lab-${dateStamp}.json`
    anchor.click()
    URL.revokeObjectURL(downloadUrl)

    setNotice({
      tone: 'success',
      message: 'Notebook exported as JSON.',
    })
  }

  function handleImportClick() {
    importInputRef.current?.click()
  }

  async function handleImportNotebook(file: File | undefined) {
    if (!file) {
      return
    }

    try {
      const parsedNotebook = JSON.parse(await file.text())
      const importedBlocks = getImportBlocks(parsedNotebook)

      if (!importedBlocks) {
        throw new Error('Invalid notebook file.')
      }

      setBlocks(importedBlocks)
      setNotice({
        tone: 'success',
        message: `Imported ${importedBlocks.length} ${
          importedBlocks.length === 1 ? 'block' : 'blocks'
        }.`,
      })
    } catch {
      setNotice({
        tone: 'error',
        message:
          'Import failed. Choose a JSON file exported from Math Notebook Lab.',
      })
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
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

          <div className="flex w-full flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:w-80">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {blocks.length} {blocks.length === 1 ? 'block' : 'blocks'}
              </p>
              <p className="text-xs text-slate-500">Saved locally in this browser</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleLoadSampleNotebook}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <BookOpen size={16} aria-hidden="true" />
                Sample
              </button>
              <button
                type="button"
                onClick={handleExportNotebook}
                disabled={blocks.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                <Download size={16} aria-hidden="true" />
                Export
              </button>
              <button
                type="button"
                onClick={handleImportClick}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Upload size={16} aria-hidden="true" />
                Import
              </button>
              <button
                type="button"
                onClick={handleClearNotebook}
                disabled={blocks.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-transparent"
              >
                <RotateCcw size={16} aria-hidden="true" />
                Clear
              </button>
            </div>

            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                void handleImportNotebook(event.target.files?.[0])
                event.target.value = ''
              }}
            />

            {notice && (
              <p
                className={`rounded-md px-3 py-2 text-sm ${
                  notice.tone === 'error'
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-teal-50 text-teal-800'
                }`}
              >
                {notice.message}
              </p>
            )}
          </div>
        </header>

        <Notebook
          blocks={blocks}
          onAddBlock={handleAddBlock}
          onLoadSampleNotebook={handleLoadSampleNotebook}
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
