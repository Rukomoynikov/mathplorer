import {
  BookOpen,
  Copy,
  Download,
  Files,
  FolderOpen,
  NotebookPen,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { BLOCK_META } from './blockMeta'
import type { Block, Notebook } from '../types'

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
  tone?: 'danger' | 'neutral' | 'primary'
}

function SidebarButton({
  children,
  disabled = false,
  onClick,
  tone = 'neutral',
}: SidebarButtonProps) {
  const toneClasses =
    tone === 'danger'
      ? 'border border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300'
      : tone === 'primary'
        ? 'border border-transparent bg-teal-700 text-white shadow-sm hover:bg-teal-800'
        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:bg-white ${toneClasses}`}
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

function NotebookTypeDots({ blocks }: { blocks: Block[] }) {
  const uniqueTypes = Array.from(new Set(blocks.map((block) => block.type))).slice(
    0,
    5,
  )

  if (uniqueTypes.length === 0) {
    return (
      <span className="text-[11px] font-medium text-slate-400">empty</span>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {uniqueTypes.map((type) => (
        <span
          key={type}
          aria-hidden="true"
          className={`h-1.5 w-1.5 rounded-full ${BLOCK_META[type].accentBar}`}
        />
      ))}
    </div>
  )
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
    <aside className="flex flex-col gap-5 border-b border-slate-200/70 bg-white/85 px-4 py-5 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:max-h-screen lg:w-72 lg:flex-none lg:overflow-y-auto lg:border-b-0 lg:border-r lg:border-slate-200/70 lg:px-5 lg:py-6 lg:shadow-[1px_0_0_rgba(15,23,42,0.02)]">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-700 text-white shadow-sm ring-1 ring-teal-700/20"
        >
          <NotebookPen size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">
            Math Notebook Lab
          </p>
          <h1 className="text-base font-semibold text-slate-900">Workspace</h1>
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Notebooks
          </p>
          <span className="text-xs font-medium text-slate-400">
            {notebooks.length}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <SidebarButton onClick={onCreateNotebook} tone="primary">
            <Plus size={14} aria-hidden="true" />
            New
          </SidebarButton>
          <SidebarButton onClick={onCreateSampleNotebook}>
            <BookOpen size={14} aria-hidden="true" />
            Sample
          </SidebarButton>
        </div>
      </div>

      <nav className="flex flex-col gap-1.5" aria-label="Notebooks">
        {notebooks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white/60 px-3 py-6 text-center text-sm leading-6 text-slate-500">
            No notebooks yet.
            <br />
            Create one to begin.
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
                className={`group relative rounded-lg border px-3 py-2.5 text-left transition ${
                  isSelected
                    ? 'border-teal-200 bg-teal-50/80 shadow-[inset_2px_0_0_0_rgb(13_148_136)]'
                    : 'border-transparent bg-white/60 hover:border-slate-200 hover:bg-white'
                }`}
              >
                <span
                  className={`block truncate text-sm font-semibold ${
                    isSelected ? 'text-teal-950' : 'text-slate-800'
                  }`}
                >
                  {notebook.title}
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-500">
                    {notebook.blocks.length}{' '}
                    {notebook.blocks.length === 1 ? 'block' : 'blocks'}
                  </span>
                  <span className="text-[11px] text-slate-300">·</span>
                  <span className="text-[11px] font-medium text-slate-500">
                    {formatUpdatedAt(notebook.updatedAt)}
                  </span>
                  <span className="ml-auto">
                    <NotebookTypeDots blocks={notebook.blocks} />
                  </span>
                </div>
              </button>
            )
          })
        )}
      </nav>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Notebook actions
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <SidebarButton
            onClick={() => currentNotebook && onDuplicateNotebook(currentNotebook.id)}
            disabled={!currentNotebook}
          >
            <Copy size={14} aria-hidden="true" />
            Duplicate
          </SidebarButton>
          <SidebarButton
            onClick={() => currentNotebook && onDeleteNotebook(currentNotebook.id)}
            disabled={!currentNotebook}
            tone="danger"
          >
            <Trash2 size={14} aria-hidden="true" />
            Delete
          </SidebarButton>
        </div>
      </div>

      <div className="border-t border-slate-200/70 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Import &amp; export
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2">
          <SidebarButton onClick={onExportNotebook} disabled={!currentNotebook}>
            <Download size={14} aria-hidden="true" />
            Export notebook
          </SidebarButton>
          <SidebarButton onClick={onImportNotebook}>
            <Upload size={14} aria-hidden="true" />
            Import notebook
          </SidebarButton>
          <SidebarButton onClick={onExportWorkspace}>
            <Files size={14} aria-hidden="true" />
            Export workspace
          </SidebarButton>
          <SidebarButton onClick={onImportWorkspace}>
            <FolderOpen size={14} aria-hidden="true" />
            Import workspace
          </SidebarButton>
        </div>
      </div>
    </aside>
  )
}
