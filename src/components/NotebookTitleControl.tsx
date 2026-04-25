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
    <div>
      <label
        htmlFor="current-notebook-title"
        className="text-xs font-semibold uppercase text-teal-700"
      >
        Current notebook
      </label>
      <input
        id="current-notebook-title"
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
        className="mt-2 w-full rounded-md border border-transparent bg-transparent px-0 py-1 text-3xl font-semibold text-slate-950 outline-none transition focus:border-teal-200 focus:bg-white focus:px-3 focus:ring-4 focus:ring-teal-50 sm:text-4xl"
      />
    </div>
  )
}
