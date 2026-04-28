import type { ReactNode } from 'react'
import type { NotebookViewMode } from '../../types'

type BlockEditorShellProps = {
  children: ReactNode
  helperText: string
  label: string
  mode: NotebookViewMode
  output: ReactNode
}

export default function BlockEditorShell({
  children,
  helperText,
  label,
  mode,
  output,
}: BlockEditorShellProps) {
  if (mode === 'preview') {
    return <div className="min-w-0">{output}</div>
  }

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.9fr)]">
      <div className="flex min-w-0 flex-col gap-2 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200/70">
        <label className="text-[11px] font-semibold uppercase text-slate-500">
          {label}
        </label>
        {children}
        <p className="text-xs leading-5 text-slate-500">{helperText}</p>
      </div>

      <div className="min-w-0 border-t border-slate-200 pt-4 xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0">
        {output}
      </div>
    </div>
  )
}
