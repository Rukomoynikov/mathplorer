import { useEffect, useRef, useState } from 'react'
import { BookOpen, Download, RotateCcw, Upload } from 'lucide-react'
import Notebook from './components/Notebook'
import { createBlock } from './data/blockFactory'
import { createSampleNotebook } from './data/sampleNotebook'
import {
  formulaToGraphContent,
  normalizeFormulaContent,
} from './lib/formulaTransforms'
import {
  createNotebookExport,
  loadBlocksFromStorage,
  NOTEBOOK_STORAGE_KEY,
  parseNotebookJson,
} from './lib/notebookSerialization'
import type { Block, BlockType } from './types'

type AppNotice = {
  message: string
  tone: 'error' | 'success'
}

function loadNotebook(): Block[] {
  if (typeof window === 'undefined') {
    return []
  }

  return loadBlocksFromStorage(window.localStorage.getItem(NOTEBOOK_STORAGE_KEY))
}

function App() {
  const [blocks, setBlocks] = useState<Block[]>(loadNotebook)
  const [notice, setNotice] = useState<AppNotice | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      window.localStorage.setItem(NOTEBOOK_STORAGE_KEY, JSON.stringify(blocks))
    } catch (error) {
      console.error('Unable to save notebook to localStorage.', error)
    }
  }, [blocks])

  function confirmNotebookReplacement(message: string) {
    return blocks.length === 0 || window.confirm(message)
  }

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
    setNotice(null)
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
    if (
      !confirmNotebookReplacement(
        'Clear this notebook? This removes all blocks saved on this device.',
      )
    ) {
      return
    }

    setBlocks([])
    setNotice({
      tone: 'success',
      message: 'Notebook cleared.',
    })
  }

  function handleLoadSampleNotebook() {
    if (
      !confirmNotebookReplacement(
        'Load the sample notebook? This will replace the current notebook.',
      )
    ) {
      return
    }

    setBlocks(createSampleNotebook())
    setNotice({
      tone: 'success',
      message: 'Sample notebook loaded.',
    })
  }

  function handleExportNotebook() {
    try {
      const json = JSON.stringify(createNotebookExport(blocks), null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const downloadUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      const dateStamp = new Date().toISOString().slice(0, 10)

      anchor.href = downloadUrl
      anchor.download = `math-notebook-lab-${dateStamp}.json`
      anchor.style.display = 'none'
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(downloadUrl)

      setNotice({
        tone: 'success',
        message: 'Notebook exported as JSON.',
      })
    } catch {
      setNotice({
        tone: 'error',
        message: 'Export failed. Try again after saving or refreshing the app.',
      })
    }
  }

  function handleImportClick() {
    importInputRef.current?.click()
  }

  async function handleImportNotebook(file: File | undefined) {
    if (!file) {
      return
    }

    try {
      const parsedNotebook = parseNotebookJson(await file.text())

      if (!parsedNotebook.ok) {
        setNotice({
          tone: 'error',
          message: parsedNotebook.message,
        })
        return
      }

      if (
        !confirmNotebookReplacement(
          'Import this notebook? This will replace the current notebook.',
        )
      ) {
        return
      }

      const importedBlocks = parsedNotebook.blocks

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
        message: 'Import failed. Choose a JSON file exported from Math Notebook Lab.',
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
              <p className="text-xs text-slate-500">Saved locally on this device</p>
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
                aria-live="polite"
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
