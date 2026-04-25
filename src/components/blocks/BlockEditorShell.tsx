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
    return <div>{output}</div>
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.85fr)]">
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </label>
        {children}
        <p className="text-[11px] leading-5 text-slate-500">{helperText}</p>
      </div>

      <div className="border-t border-slate-200 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
        {output}
      </div>
    </div>
  )
}
