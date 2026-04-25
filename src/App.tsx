import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Eye,
  PencilLine,
  Plus,
  Upload,
  X,
} from 'lucide-react'
import Notebook from './components/Notebook'
import NotebookTitleControl from './components/NotebookTitleControl'
import WorkspaceSidebar from './components/WorkspaceSidebar'
import { createBlock } from './data/blockFactory'
import { createSampleNotebook } from './data/sampleNotebook'
import {
  formulaToGraphContent,
  normalizeFormulaContent,
} from './lib/formulaTransforms'
import {
  createNotebook,
  createNotebookExport,
  createWorkspaceExport,
  createWorkspace,
  duplicateNotebook,
  loadWorkspaceFromStorage,
  NOTEBOOK_STORAGE_KEY,
  parseNotebookJson,
  parseWorkspaceJson,
  renameNotebook,
  touchNotebook,
  WORKSPACE_STORAGE_KEY,
} from './lib/notebookSerialization'
import type {
  BlockType,
  Notebook as NotebookModel,
  NotebookViewMode,
  NotebookWorkspace,
} from './types'

type AppNotice = {
  message: string
  tone: 'error' | 'success'
}

type NoNotebookStateProps = {
  onCreateNotebook: () => void
  onCreateSampleNotebook: () => void
  onImportNotebook: () => void
}

type NotebookViewModeToggleProps = {
  mode: NotebookViewMode
  onModeChange: (mode: NotebookViewMode) => void
}

function NotebookViewModeToggle({
  mode,
  onModeChange,
}: NotebookViewModeToggleProps) {
  const options: Array<{
    icon: typeof Eye
    label: string
    value: NotebookViewMode
  }> = [
    { icon: Eye, label: 'Preview', value: 'preview' },
    { icon: PencilLine, label: 'Edit', value: 'edit' },
  ]

  return (
    <div
      aria-label="Notebook view mode"
      className="inline-flex rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm backdrop-blur"
      role="group"
    >
      {options.map(({ icon: Icon, label, value }) => {
        const isSelected = mode === value

        return (
          <button
            key={value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onModeChange(value)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              isSelected
                ? 'bg-gradient-to-br from-teal-600 to-cyan-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Icon size={15} aria-hidden="true" />
            {label}
          </button>
        )
      })}
    </div>
  )
}

type NoticeToastProps = {
  notice: AppNotice
  onDismiss: () => void
}

function NoticeToast({ notice, onDismiss }: NoticeToastProps) {
  const isError = notice.tone === 'error'
  const Icon = isError ? AlertCircle : CheckCircle2

  useEffect(() => {
    const timeoutId = window.setTimeout(onDismiss, isError ? 6000 : 3500)
    return () => window.clearTimeout(timeoutId)
  }, [notice, isError, onDismiss])

  return (
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 sm:bottom-8 sm:right-8 sm:left-auto sm:justify-end sm:px-0"
    >
      <div
        className={`animate-fade-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white/95 px-4 py-3 text-sm shadow-[0_8px_28px_-8px_rgba(15,23,42,0.25)] backdrop-blur ${
          isError ? 'border-rose-200' : 'border-slate-200'
        }`}
      >
        <span
          className={`flex h-8 w-8 flex-none items-center justify-center rounded-full ${
            isError ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-600'
          }`}
        >
          <Icon size={16} aria-hidden="true" />
        </span>
        <div className="flex-1 pt-0.5">
          <p className="font-semibold text-slate-900">
            {isError ? 'Something went wrong' : 'Done'}
          </p>
          <p className="mt-0.5 leading-5 text-slate-600">{notice.message}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notice"
          className="-mr-1 -mt-1 flex h-7 w-7 flex-none items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function loadWorkspace(): NotebookWorkspace {
  if (typeof window === 'undefined') {
    return createWorkspace([createNotebook()])
  }

  return loadWorkspaceFromStorage(
    window.localStorage.getItem(WORKSPACE_STORAGE_KEY),
    window.localStorage.getItem(NOTEBOOK_STORAGE_KEY),
  )
}

function downloadJsonFile(filename: string, value: unknown) {
  const json = JSON.stringify(value, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const downloadUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = downloadUrl
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(downloadUrl)
}

function toFileSlug(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'notebook'
  )
}

function NoNotebookState({
  onCreateNotebook,
  onCreateSampleNotebook,
  onImportNotebook,
}: NoNotebookStateProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 px-6 py-16 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04),0_24px_48px_-24px_rgba(15,23,42,0.18)] backdrop-blur">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-gradient-to-b from-teal-100/60 via-cyan-50/40 to-transparent blur-2xl"
      />
      <div className="relative">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-700 text-2xl font-semibold text-white shadow-md ring-1 ring-teal-700/30">
          ∑
        </div>
        <p className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">
          Start a workspace notebook
        </p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Create a blank notebook, start from a sample, or import a notebook JSON
          file. Everything is saved locally on this device.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onCreateNotebook}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-teal-600 to-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-teal-700 hover:to-cyan-800"
          >
            <Plus size={16} aria-hidden="true" />
            New notebook
          </button>
          <button
            type="button"
            onClick={onCreateSampleNotebook}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <BookOpen size={16} aria-hidden="true" />
            Create sample
          </button>
          <button
            type="button"
            onClick={onImportNotebook}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Upload size={16} aria-hidden="true" />
            Import notebook
          </button>
        </div>
      </div>
    </section>
  )
}

function App() {
  const [workspace, setWorkspace] = useState<NotebookWorkspace>(loadWorkspace)
  const [notebookViewMode, setNotebookViewMode] =
    useState<NotebookViewMode>('preview')
  const [notice, setNotice] = useState<AppNotice | null>(null)
  const notebookImportInputRef = useRef<HTMLInputElement>(null)
  const workspaceImportInputRef = useRef<HTMLInputElement>(null)

  const currentNotebook =
    workspace.notebooks.find(
      (notebook) => notebook.id === workspace.currentNotebookId,
    ) ?? null

  useEffect(() => {
    setNotebookViewMode('preview')
  }, [currentNotebook?.id])

  useEffect(() => {
    try {
      window.localStorage.setItem(
        WORKSPACE_STORAGE_KEY,
        JSON.stringify(workspace),
      )
    } catch (error) {
      console.error('Unable to save workspace to localStorage.', error)
    }
  }, [workspace])

  function updateCurrentNotebook(
    updater: (notebook: NotebookModel) => NotebookModel,
  ) {
    setWorkspace((currentWorkspace) => {
      const currentNotebookId = currentWorkspace.currentNotebookId

      if (!currentNotebookId) {
        return currentWorkspace
      }

      const notebookIndex = currentWorkspace.notebooks.findIndex(
        (notebook) => notebook.id === currentNotebookId,
      )

      if (notebookIndex === -1) {
        return currentWorkspace
      }

      const notebooks = [...currentWorkspace.notebooks]
      const updatedNotebook = updater(notebooks[notebookIndex])

      if (updatedNotebook === notebooks[notebookIndex]) {
        return currentWorkspace
      }

      notebooks[notebookIndex] = updatedNotebook

      return {
        ...currentWorkspace,
        notebooks,
      }
    })
  }

  function handleSelectNotebook(id: string) {
    setWorkspace((currentWorkspace) => ({
      ...currentWorkspace,
      currentNotebookId: id,
    }))
    setNotice(null)
  }

  function handleCreateNotebook() {
    const notebook = createNotebook()

    setWorkspace((currentWorkspace) => ({
      ...currentWorkspace,
      notebooks: [...currentWorkspace.notebooks, notebook],
      currentNotebookId: notebook.id,
    }))
    setNotice({
      tone: 'success',
      message: 'Notebook created.',
    })
  }

  function handleCreateSampleNotebook() {
    const notebook = createNotebook('Quadratic exploration', createSampleNotebook())

    setWorkspace((currentWorkspace) => ({
      ...currentWorkspace,
      notebooks: [...currentWorkspace.notebooks, notebook],
      currentNotebookId: notebook.id,
    }))
    setNotice({
      tone: 'success',
      message: 'Sample notebook created.',
    })
  }

  function handleRenameNotebook(title: string) {
    updateCurrentNotebook((notebook) => renameNotebook(notebook, title))
  }

  function handleDeleteNotebook(id: string) {
    const notebook = workspace.notebooks.find((candidate) => candidate.id === id)

    if (!notebook) {
      return
    }

    if (
      !window.confirm(
        `Delete "${notebook.title}"? This removes the notebook saved on this device.`,
      )
    ) {
      return
    }

    setWorkspace((currentWorkspace) => {
      const notebookIndex = currentWorkspace.notebooks.findIndex(
        (candidate) => candidate.id === id,
      )

      if (notebookIndex === -1) {
        return currentWorkspace
      }

      const notebooks = currentWorkspace.notebooks.filter(
        (candidate) => candidate.id !== id,
      )
      const shouldChooseNext = currentWorkspace.currentNotebookId === id
      const currentNotebookId = shouldChooseNext
        ? (notebooks[notebookIndex]?.id ??
          notebooks[notebookIndex - 1]?.id ??
          notebooks[0]?.id ??
          null)
        : currentWorkspace.currentNotebookId

      return {
        ...currentWorkspace,
        notebooks,
        currentNotebookId,
      }
    })
    setNotice({
      tone: 'success',
      message: 'Notebook deleted.',
    })
  }

  function handleDuplicateNotebook(id: string) {
    setWorkspace((currentWorkspace) => {
      const notebookIndex = currentWorkspace.notebooks.findIndex(
        (notebook) => notebook.id === id,
      )

      if (notebookIndex === -1) {
        return currentWorkspace
      }

      const copiedNotebook = duplicateNotebook(
        currentWorkspace.notebooks[notebookIndex],
      )
      const notebooks = [
        ...currentWorkspace.notebooks.slice(0, notebookIndex + 1),
        copiedNotebook,
        ...currentWorkspace.notebooks.slice(notebookIndex + 1),
      ]

      return {
        ...currentWorkspace,
        notebooks,
        currentNotebookId: copiedNotebook.id,
      }
    })
    setNotice({
      tone: 'success',
      message: 'Notebook duplicated.',
    })
  }

  function handleAddBlock(type: BlockType) {
    updateCurrentNotebook((notebook) =>
      touchNotebook(notebook, [...notebook.blocks, createBlock(type)]),
    )
    setNotice(null)
  }

  function handleInsertBlockAfter(
    sourceId: string,
    type: BlockType,
    content: string,
  ) {
    updateCurrentNotebook((notebook) => {
      const sourceIndex = notebook.blocks.findIndex((block) => block.id === sourceId)

      if (sourceIndex === -1) {
        return notebook
      }

      const derivedBlock = createBlock(type, content)
      const blocks = [
        ...notebook.blocks.slice(0, sourceIndex + 1),
        derivedBlock,
        ...notebook.blocks.slice(sourceIndex + 1),
      ]

      return touchNotebook(notebook, blocks)
    })
  }

  function handleUpdateBlock(id: string, content: string) {
    updateCurrentNotebook((notebook) => {
      const timestamp = Date.now()
      const blocks = notebook.blocks.map((block) =>
        block.id === id ? { ...block, content, updatedAt: timestamp } : block,
      )

      return touchNotebook(notebook, blocks)
    })
  }

  function handleDeleteBlock(id: string) {
    updateCurrentNotebook((notebook) => {
      const blocks = notebook.blocks.filter((block) => block.id !== id)

      return blocks.length === notebook.blocks.length
        ? notebook
        : touchNotebook(notebook, blocks)
    })
    setNotice(null)
  }

  function handleDuplicateBlock(id: string) {
    updateCurrentNotebook((notebook) => {
      const sourceIndex = notebook.blocks.findIndex((block) => block.id === id)

      if (sourceIndex === -1) {
        return notebook
      }

      const sourceBlock = notebook.blocks[sourceIndex]
      const duplicatedBlock = createBlock(sourceBlock.type, sourceBlock.content)
      const blocks = [
        ...notebook.blocks.slice(0, sourceIndex + 1),
        duplicatedBlock,
        ...notebook.blocks.slice(sourceIndex + 1),
      ]

      return touchNotebook(notebook, blocks)
    })
  }

  function handleCreateGraphFromFormula(id: string) {
    const sourceBlock = currentNotebook?.blocks.find((block) => block.id === id)

    if (!sourceBlock) {
      return
    }

    handleInsertBlockAfter(id, 'graph', formulaToGraphContent(sourceBlock.content))
  }

  function handleCreateExplanationFromFormula(id: string) {
    const sourceBlock = currentNotebook?.blocks.find((block) => block.id === id)

    if (!sourceBlock) {
      return
    }

    const normalized = normalizeFormulaContent(sourceBlock.content)
    handleInsertBlockAfter(id, 'explanation', `Explain this formula: ${normalized}`)
  }

  function handleMoveBlock(id: string, direction: 'up' | 'down') {
    updateCurrentNotebook((notebook) => {
      const sourceIndex = notebook.blocks.findIndex((block) => block.id === id)
      const targetIndex = direction === 'up' ? sourceIndex - 1 : sourceIndex + 1

      if (
        sourceIndex === -1 ||
        targetIndex < 0 ||
        targetIndex >= notebook.blocks.length
      ) {
        return notebook
      }

      const blocks = [...notebook.blocks]
      const [movedBlock] = blocks.splice(sourceIndex, 1)
      blocks.splice(targetIndex, 0, movedBlock)

      return touchNotebook(notebook, blocks)
    })
  }

  function handleLoadSampleIntoCurrentNotebook() {
    if (!currentNotebook) {
      handleCreateSampleNotebook()
      return
    }

    if (
      currentNotebook.blocks.length > 0 &&
      !window.confirm(
        'Load the sample into this notebook? This will replace its current blocks.',
      )
    ) {
      return
    }

    updateCurrentNotebook((notebook) =>
      touchNotebook(notebook, createSampleNotebook()),
    )
    setNotice({
      tone: 'success',
      message: 'Sample loaded into current notebook.',
    })
  }

  function handleExportNotebook() {
    if (!currentNotebook) {
      return
    }

    try {
      const dateStamp = new Date().toISOString().slice(0, 10)
      const slug = toFileSlug(currentNotebook.title)

      downloadJsonFile(
        `math-notebook-lab-${slug}-${dateStamp}.json`,
        createNotebookExport(currentNotebook),
      )
      setNotice({
        tone: 'success',
        message: 'Current notebook exported as JSON.',
      })
    } catch {
      setNotice({
        tone: 'error',
        message: 'Export failed. Try again after saving or refreshing the app.',
      })
    }
  }

  function handleExportWorkspace() {
    try {
      const dateStamp = new Date().toISOString().slice(0, 10)

      downloadJsonFile(
        `math-notebook-lab-workspace-${dateStamp}.json`,
        createWorkspaceExport(workspace),
      )
      setNotice({
        tone: 'success',
        message: 'Workspace exported as JSON.',
      })
    } catch {
      setNotice({
        tone: 'error',
        message: 'Workspace export failed. Try again after refreshing the app.',
      })
    }
  }

  function handleImportNotebookClick() {
    notebookImportInputRef.current?.click()
  }

  function handleImportWorkspaceClick() {
    workspaceImportInputRef.current?.click()
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

      const importedNotebook = parsedNotebook.notebook

      setWorkspace((currentWorkspace) => ({
        ...currentWorkspace,
        notebooks: [...currentWorkspace.notebooks, importedNotebook],
        currentNotebookId: importedNotebook.id,
      }))
      setNotice({
        tone: 'success',
        message: `Imported "${importedNotebook.title}" as a new notebook.`,
      })
    } catch {
      setNotice({
        tone: 'error',
        message: 'Import failed. Choose a JSON file exported from Math Notebook Lab.',
      })
    }
  }

  async function handleImportWorkspace(file: File | undefined) {
    if (!file) {
      return
    }

    try {
      const parsedWorkspace = parseWorkspaceJson(await file.text())

      if (!parsedWorkspace.ok) {
        setNotice({
          tone: 'error',
          message: parsedWorkspace.message,
        })
        return
      }

      if (
        !window.confirm(
          'Import this workspace? This will replace all notebooks saved on this device.',
        )
      ) {
        return
      }

      setWorkspace(parsedWorkspace.workspace)
      setNotice({
        tone: 'success',
        message: 'Workspace imported.',
      })
    } catch {
      setNotice({
        tone: 'error',
        message:
          'Workspace import failed. Choose a workspace JSON file exported from Math Notebook Lab.',
      })
    }
  }

  const totalBlockCount = workspace.notebooks.reduce(
    (count, notebook) => count + notebook.blocks.length,
    0,
  )

  return (
    <main className="min-h-screen text-slate-900">
      <div className="flex flex-col lg:flex-row">
        <WorkspaceSidebar
          notebooks={workspace.notebooks}
          currentNotebookId={workspace.currentNotebookId}
          onCreateNotebook={handleCreateNotebook}
          onCreateSampleNotebook={handleCreateSampleNotebook}
          onSelectNotebook={handleSelectNotebook}
          onDuplicateNotebook={handleDuplicateNotebook}
          onDeleteNotebook={handleDeleteNotebook}
          onExportNotebook={handleExportNotebook}
          onImportNotebook={handleImportNotebookClick}
          onExportWorkspace={handleExportWorkspace}
          onImportWorkspace={handleImportWorkspaceClick}
        />

        <div className="mx-auto flex min-w-0 max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {currentNotebook ? (
            <>
              <header className="rounded-2xl border border-slate-200/70 bg-white/70 px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.16)] backdrop-blur sm:px-6 sm:py-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-teal-700">
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-teal-500"
                      />
                      Current notebook
                    </div>
                    {notebookViewMode === 'edit' ? (
                      <div className="mt-2">
                        <NotebookTitleControl
                          title={currentNotebook.title}
                          onRename={handleRenameNotebook}
                        />
                      </div>
                    ) : (
                      <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                        {currentNotebook.title}
                      </h1>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">
                        {currentNotebook.blocks.length}{' '}
                        {currentNotebook.blocks.length === 1 ? 'block' : 'blocks'}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Saved locally
                      </span>
                      <span className="text-slate-400">
                        Updated{' '}
                        {new Date(currentNotebook.updatedAt).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                  </div>

                  <NotebookViewModeToggle
                    mode={notebookViewMode}
                    onModeChange={setNotebookViewMode}
                  />
                </div>
              </header>

              <Notebook
                key={currentNotebook.id}
                blocks={currentNotebook.blocks}
                mode={notebookViewMode}
                onAddBlock={handleAddBlock}
                onLoadSampleNotebook={handleLoadSampleIntoCurrentNotebook}
                onUpdateBlock={handleUpdateBlock}
                onDeleteBlock={handleDeleteBlock}
                onDuplicateBlock={handleDuplicateBlock}
                onCreateExplanationFromFormula={handleCreateExplanationFromFormula}
                onCreateGraphFromFormula={handleCreateGraphFromFormula}
                onMoveBlock={handleMoveBlock}
              />

              {totalBlockCount > 0 && (
                <p className="text-center text-xs text-slate-400">
                  {totalBlockCount} total{' '}
                  {totalBlockCount === 1 ? 'block' : 'blocks'} across{' '}
                  {workspace.notebooks.length}{' '}
                  {workspace.notebooks.length === 1 ? 'notebook' : 'notebooks'}
                </p>
              )}
            </>
          ) : (
            <NoNotebookState
              onCreateNotebook={handleCreateNotebook}
              onCreateSampleNotebook={handleCreateSampleNotebook}
              onImportNotebook={handleImportNotebookClick}
            />
          )}
        </div>
      </div>

      <input
        ref={notebookImportInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          void handleImportNotebook(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      <input
        ref={workspaceImportInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          void handleImportWorkspace(event.target.files?.[0])
          event.target.value = ''
        }}
      />

      {notice && (
        <NoticeToast notice={notice} onDismiss={() => setNotice(null)} />
      )}
    </main>
  )
}

export default App
