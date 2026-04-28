import { useEffect, useRef, useState } from 'react'

type NotebookTitleControlProps = {
  onRename: (title: string) => void
  title: string
}

export default function NotebookTitleControl({
  onRename,
  title,
}: NotebookTitleControlProps) {
  const [draftTitle, setDraftTitle] = useState(title)
  const shouldSkipCommitRef = useRef(false)

  useEffect(() => {
    setDraftTitle(title)
  }, [title])

  function commitTitle() {
    if (shouldSkipCommitRef.current) {
      shouldSkipCommitRef.current = false
      return
    }

    onRename(draftTitle)
  }

  return (
    <input
      id="current-notebook-title"
      aria-label="Notebook title"
      value={draftTitle}
      onBlur={commitTitle}
      onChange={(event) => setDraftTitle(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.currentTarget.blur()
        }

        if (event.key === 'Escape') {
          shouldSkipCommitRef.current = true
          setDraftTitle(title)
          event.currentTarget.blur()
        }
      }}
      className="w-full rounded-md border border-transparent bg-transparent px-0 py-1 text-2xl font-semibold text-slate-950 outline-none transition focus:border-teal-400 focus:bg-white focus:px-3 focus:ring-4 focus:ring-teal-100 sm:text-3xl"
    />
  )
}
