import {
  BookOpen,
  Copy,
  Download,
  Files,
  FolderOpen,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { Notebook } from '../types'

type WorkspaceSidebarProps = {
  currentNotebookId: string | null
  notebooks: Notebook[]
  onCreateNotebook: () => void
  onCreateSampleNotebook: () => void
  onDeleteNotebook: (id: string) => void
  onDuplicateNotebook: (id: string) => void
  onExportNotebook: () => void
  onExportWorkspace: () => void
  onImportNotebook: () => void
  onImportWorkspace: () => void
  onSelectNotebook: (id: string) => void
}

type SidebarButtonProps = {
  children: ReactNode
  disabled?: boolean
  onClick: () => void
  tone?: 'danger' | 'neutral'
}

function SidebarButton({
  children,
  disabled = false,
  onClick,
  tone = 'neutral',
}: SidebarButtonProps) {
  const toneClasses =
    tone === 'danger'
      ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
      : 'border-slate-200 text-slate-700 hover:bg-slate-50'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-transparent ${toneClasses}`}
    >
      {children}
    </button>
  )
}

function formatUpdatedAt(updatedAt: number) {
  return new Date(updatedAt).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })
}

export default function WorkspaceSidebar({
  currentNotebookId,
  notebooks,
  onCreateNotebook,
  onCreateSampleNotebook,
  onDeleteNotebook,
  onDuplicateNotebook,
  onExportNotebook,
  onExportWorkspace,
  onImportNotebook,
  onImportWorkspace,
  onSelectNotebook,
}: WorkspaceSidebarProps) {
  const currentNotebook = notebooks.find(
    (notebook) => notebook.id === currentNotebookId,
  )

  return (
    <aside className="flex flex-col gap-5 border-b border-slate-200 bg-white/80 pb-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:rounded-lg lg:border lg:p-4 lg:shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase text-teal-700">
          Math Notebook Lab
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Workspace</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {notebooks.length} {notebooks.length === 1 ? 'notebook' : 'notebooks'} saved locally
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <SidebarButton onClick={onCreateNotebook}>
          <Plus size={16} aria-hidden="true" />
          New
        </SidebarButton>
        <SidebarButton onClick={onCreateSampleNotebook}>
          <BookOpen size={16} aria-hidden="true" />
          Sample
        </SidebarButton>
      </div>

      <nav className="flex flex-col gap-2" aria-label="Notebooks">
        {notebooks.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-sm leading-6 text-slate-500">
            No notebooks yet.
          </p>
        ) : (
          notebooks.map((notebook) => {
            const isSelected = notebook.id === currentNotebookId

            return (
              <button
                key={notebook.id}
                type="button"
                onClick={() => onSelectNotebook(notebook.id)}
                aria-current={isSelected ? 'page' : undefined}
                className={`min-h-20 rounded-md border px-3 py-3 text-left transition ${
                  isSelected
                    ? 'border-teal-300 bg-teal-50 text-teal-950'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="block truncate text-sm font-semibold">
                  {notebook.title}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {notebook.blocks.length}{' '}
                  {notebook.blocks.length === 1 ? 'block' : 'blocks'} · Updated{' '}
                  {formatUpdatedAt(notebook.updatedAt)}
                </span>
              </button>
            )
          })
        )}
      </nav>

      <div className="grid grid-cols-2 gap-2">
        <SidebarButton
          onClick={() => currentNotebook && onDuplicateNotebook(currentNotebook.id)}
          disabled={!currentNotebook}
        >
          <Copy size={16} aria-hidden="true" />
          Duplicate
        </SidebarButton>
        <SidebarButton
          onClick={() => currentNotebook && onDeleteNotebook(currentNotebook.id)}
          disabled={!currentNotebook}
          tone="danger"
        >
          <Trash2 size={16} aria-hidden="true" />
          Delete
        </SidebarButton>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase text-slate-400">JSON</p>
        <div className="grid grid-cols-1 gap-2">
          <SidebarButton onClick={onExportNotebook} disabled={!currentNotebook}>
            <Download size={16} aria-hidden="true" />
            Export notebook
          </SidebarButton>
          <SidebarButton onClick={onImportNotebook}>
            <Upload size={16} aria-hidden="true" />
            Import notebook
          </SidebarButton>
          <SidebarButton onClick={onExportWorkspace}>
            <Files size={16} aria-hidden="true" />
            Export workspace
          </SidebarButton>
          <SidebarButton onClick={onImportWorkspace}>
            <FolderOpen size={16} aria-hidden="true" />
            Import workspace
          </SidebarButton>
        </div>
      </div>
    </aside>
  )
}
