import {
  BookOpen,
  Files,
  Library,
  NotebookPen,
  Plus,
  Settings,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { BLOCK_META } from './blockMeta'
import type { CoursePack, CoursePackId } from '../data/coursePacks'
import type { Block, Notebook } from '../types'

type WorkspaceSidebarProps = {
  activeView: 'notebook' | 'settings'
  coursePacks: CoursePack[]
  currentNotebookId: string | null
  notebooks: Notebook[]
  onCreateCourseNotebook: (id: string) => void
  onCreateCoursePack: (id: CoursePackId) => void
  onCreateNotebook: () => void
  onCreateSampleNotebook: () => void
  onOpenNotebook: () => void
  onOpenSettings: () => void
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
      ? 'border-rose-200 bg-white text-rose-700 hover:border-rose-300 hover:bg-rose-50'
      : tone === 'primary'
        ? 'border-teal-700 bg-teal-700 text-white shadow-sm hover:border-teal-800 hover:bg-teal-800'
        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClasses}`}
    >
      {children}
    </button>
  )
}

function SidebarSection({
  children,
  count,
  title,
}: {
  children: ReactNode
  count?: number
  title: string
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase text-slate-500">
          {title}
        </p>
        {typeof count === 'number' && (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
            {count}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}

function SidebarSelect({
  children,
  disabled = false,
  label,
  onChange,
  value,
}: {
  children: ReactNode
  disabled?: boolean
  label: string
  onChange: (value: string) => void
  value: string
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-9 min-w-0 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      >
        {children}
      </select>
    </label>
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
    return <span className="text-[11px] font-medium text-slate-400">empty</span>
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
  activeView,
  coursePacks,
  currentNotebookId,
  notebooks,
  onCreateCourseNotebook,
  onCreateCoursePack,
  onCreateNotebook,
  onCreateSampleNotebook,
  onOpenNotebook,
  onOpenSettings,
  onSelectNotebook,
}: WorkspaceSidebarProps) {
  const defaultCourse = coursePacks[0] ?? null
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    defaultCourse?.id ?? '',
  )
  const [selectedNotebookId, setSelectedNotebookId] = useState(
    defaultCourse?.notebooks[0]?.id ?? '',
  )
  const selectedCourse = useMemo(
    () =>
      coursePacks.find((coursePack) => coursePack.id === selectedCourseId) ??
      defaultCourse,
    [coursePacks, defaultCourse, selectedCourseId],
  )
  const selectedNotebook = useMemo(
    () =>
      selectedCourse?.notebooks.find(
        (notebook) => notebook.id === selectedNotebookId,
      ) ??
      selectedCourse?.notebooks[0] ??
      null,
    [selectedCourse, selectedNotebookId],
  )

  function handleCourseChange(courseId: string) {
    const nextCourse = coursePacks.find((coursePack) => coursePack.id === courseId)

    setSelectedCourseId(courseId)
    setSelectedNotebookId(nextCourse?.notebooks[0]?.id ?? '')
  }

  return (
    <aside className="flex max-h-[72vh] flex-col border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:max-h-screen lg:w-80 lg:flex-none lg:border-b-0 lg:border-r">
      <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 lg:px-5">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white shadow-sm"
        >
          <NotebookPen size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase text-teal-700">
            Math Notebook Lab
          </p>
          <h1 className="truncate text-base font-semibold text-slate-950">
            Workspace
          </h1>
        </div>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 lg:px-5">
        <SidebarSection title="App">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-current={activeView === 'notebook' ? 'page' : undefined}
              onClick={onOpenNotebook}
              className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                activeView === 'notebook'
                  ? 'border-teal-200 bg-teal-50 text-teal-950'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <NotebookPen size={14} aria-hidden="true" />
              Notebook
            </button>
            <button
              type="button"
              aria-current={activeView === 'settings' ? 'page' : undefined}
              onClick={onOpenSettings}
              className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                activeView === 'settings'
                  ? 'border-teal-200 bg-teal-50 text-teal-950'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Settings size={14} aria-hidden="true" />
              Settings
            </button>
          </div>
        </SidebarSection>

        <SidebarSection title="Notebooks" count={notebooks.length}>
          <div className="grid grid-cols-2 gap-2">
            <SidebarButton onClick={onCreateNotebook} tone="primary">
              <Plus size={14} aria-hidden="true" />
              New
            </SidebarButton>
            <SidebarButton onClick={onCreateSampleNotebook}>
              <BookOpen size={14} aria-hidden="true" />
              Sample
            </SidebarButton>
          </div>

          <nav className="space-y-1.5" aria-label="Notebooks">
            {notebooks.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-sm leading-6 text-slate-500">
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
                    aria-current={
                      isSelected && activeView === 'notebook' ? 'page' : undefined
                    }
                    className={`group w-full rounded-lg border px-3 py-2.5 text-left transition ${
                      isSelected
                        ? 'border-teal-200 bg-teal-50 text-teal-950 shadow-[inset_3px_0_0_0_rgb(15_118_110)]'
                        : 'border-transparent bg-white text-slate-800 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block truncate text-sm font-semibold">
                      {notebook.title}
                    </span>
                    <div className="mt-1 flex min-w-0 items-center gap-2">
                      <span className="shrink-0 text-[11px] font-medium text-slate-500">
                        {notebook.blocks.length}{' '}
                        {notebook.blocks.length === 1 ? 'block' : 'blocks'}
                      </span>
                      <span className="text-[11px] text-slate-300">/</span>
                      <span className="truncate text-[11px] font-medium text-slate-500">
                        {formatUpdatedAt(notebook.updatedAt)}
                      </span>
                      <span className="ml-auto shrink-0">
                        <NotebookTypeDots blocks={notebook.blocks} />
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </nav>
        </SidebarSection>

        {coursePacks.length > 0 && (
          <SidebarSection title="Course packs">
            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                  <Library size={15} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {selectedCourse?.title ?? 'Examples'}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {selectedCourse?.description ??
                      'Load a built-in lesson as a local notebook.'}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid gap-2">
                <SidebarSelect
                  label="Course"
                  value={selectedCourse?.id ?? ''}
                  onChange={handleCourseChange}
                >
                  {coursePacks.map((coursePack) => (
                    <option key={coursePack.id} value={coursePack.id}>
                      {coursePack.title}
                    </option>
                  ))}
                </SidebarSelect>

                <SidebarSelect
                  label="Lesson"
                  value={selectedNotebook?.id ?? ''}
                  onChange={setSelectedNotebookId}
                  disabled={!selectedCourse}
                >
                  {selectedCourse?.notebooks.map((notebook) => (
                    <option key={notebook.id} value={notebook.id}>
                      {notebook.title.replace(`${selectedCourse.title}: `, '')}
                    </option>
                  ))}
                </SidebarSelect>
              </div>

              {selectedNotebook && (
                <p className="mt-3 rounded-md bg-slate-50 px-2.5 py-2 text-xs leading-5 text-slate-600">
                  {selectedNotebook.summary}
                </p>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2">
                <SidebarButton
                  onClick={() =>
                    selectedNotebook && onCreateCourseNotebook(selectedNotebook.id)
                  }
                  disabled={!selectedNotebook}
                >
                  <BookOpen size={14} aria-hidden="true" />
                  Lesson
                </SidebarButton>
                <SidebarButton
                  onClick={() => selectedCourse && onCreateCoursePack(selectedCourse.id)}
                  disabled={!selectedCourse}
                >
                  <Files size={14} aria-hidden="true" />
                  Full pack
                </SidebarButton>
              </div>
            </div>
          </SidebarSection>
        )}
      </div>
    </aside>
  )
}
