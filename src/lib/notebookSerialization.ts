import type { Block, BlockType, Notebook, NotebookWorkspace } from '../types'

export const APP_NAME = 'Math Notebook Lab'
export const NOTEBOOK_FILE_VERSION = 2
export const WORKSPACE_SCHEMA_VERSION = 2
export const WORKSPACE_STORAGE_KEY = 'math-notebook-lab:workspace:v2'
export const NOTEBOOK_STORAGE_KEY = 'math-notebook-lab:v1'
export const UNTITLED_NOTEBOOK_TITLE = 'Untitled notebook'

type NotebookFile = {
  app: typeof APP_NAME
  exportedAt: string
  kind: 'notebook'
  notebook: Notebook
  version: typeof NOTEBOOK_FILE_VERSION
}

type WorkspaceFile = {
  app: typeof APP_NAME
  exportedAt: string
  kind: 'workspace'
  version: typeof NOTEBOOK_FILE_VERSION
  workspace: NotebookWorkspace
}

type ParseNotebookResult =
  | {
      notebook: Notebook
      ok: true
    }
  | {
      message: string
      ok: false
    }

type ParseWorkspaceResult =
  | {
      ok: true
      workspace: NotebookWorkspace
    }
  | {
      message: string
      ok: false
    }

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function now() {
  return Date.now()
}

function isBlockType(value: unknown): value is BlockType {
  return (
    value === 'text' ||
    value === 'formula' ||
    value === 'graph' ||
    value === 'geometry' ||
    value === 'solver' ||
    value === 'explanation' ||
    value === 'set' ||
    value === 'combinatorics' ||
    value === 'probability'
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
    Number.isFinite(block.createdAt) &&
    typeof block.updatedAt === 'number' &&
    Number.isFinite(block.updatedAt)
  )
}

function isStoredNotebook(value: unknown): value is Notebook {
  if (!value || typeof value !== 'object') {
    return false
  }

  const notebook = value as Record<string, unknown>

  return (
    typeof notebook.id === 'string' &&
    typeof notebook.title === 'string' &&
    Array.isArray(notebook.blocks) &&
    notebook.blocks.every(isStoredBlock) &&
    typeof notebook.createdAt === 'number' &&
    Number.isFinite(notebook.createdAt) &&
    typeof notebook.updatedAt === 'number' &&
    Number.isFinite(notebook.updatedAt)
  )
}

function hasUniqueIds(values: { id: string }[]) {
  return new Set(values.map((value) => value.id)).size === values.length
}

function normalizeTitle(title: string) {
  const trimmedTitle = title.trim()

  return trimmedTitle || UNTITLED_NOTEBOOK_TITLE
}

function cloneBlocksWithNewIds(blocks: Block[]) {
  const timestamp = now()

  return blocks.map((block) => ({
    ...block,
    id: createId('block'),
    createdAt: timestamp,
    updatedAt: timestamp,
  }))
}

function getBlocksFromParsedValue(parsedValue: unknown) {
  if (Array.isArray(parsedValue)) {
    return parsedValue
  }

  if (parsedValue && typeof parsedValue === 'object') {
    const blocks = (parsedValue as Record<string, unknown>).blocks

    if (Array.isArray(blocks)) {
      return blocks
    }
  }

  return null
}

function parseJson(json: string) {
  try {
    return {
      ok: true as const,
      value: JSON.parse(json) as unknown,
    }
  } catch {
    return {
      ok: false as const,
      message: 'That file is not valid JSON.',
    }
  }
}

function validateBlocks(blocks: unknown) {
  if (!Array.isArray(blocks) || !blocks.every(isStoredBlock)) {
    return {
      ok: false as const,
      message: 'That JSON does not look like a Math Notebook Lab notebook.',
    }
  }

  if (!hasUniqueIds(blocks)) {
    return {
      ok: false as const,
      message: 'That notebook has duplicate block IDs and could not be imported.',
    }
  }

  return {
    blocks,
    ok: true as const,
  }
}

function validateNotebook(notebook: unknown) {
  if (!isStoredNotebook(notebook)) {
    return {
      ok: false as const,
      message: 'That JSON does not look like a Math Notebook Lab notebook.',
    }
  }

  if (!hasUniqueIds(notebook.blocks)) {
    return {
      ok: false as const,
      message: 'That notebook has duplicate block IDs and could not be imported.',
    }
  }

  return {
    notebook: {
      ...notebook,
      title: normalizeTitle(notebook.title),
    },
    ok: true as const,
  }
}

function validateWorkspace(workspace: unknown): ParseWorkspaceResult {
  if (!workspace || typeof workspace !== 'object') {
    return {
      ok: false,
      message: 'That JSON does not look like a Math Notebook Lab workspace.',
    }
  }

  const candidate = workspace as Record<string, unknown>

  if (
    candidate.version !== WORKSPACE_SCHEMA_VERSION ||
    !Array.isArray(candidate.notebooks) ||
    !candidate.notebooks.every(isStoredNotebook) ||
    !(
      typeof candidate.currentNotebookId === 'string' ||
      candidate.currentNotebookId === null
    )
  ) {
    return {
      ok: false,
      message: 'That JSON does not look like a Math Notebook Lab workspace.',
    }
  }

  const notebooks = candidate.notebooks.map((notebook) => ({
    ...notebook,
    title: normalizeTitle(notebook.title),
  }))

  if (!hasUniqueIds(notebooks)) {
    return {
      ok: false,
      message: 'That workspace has duplicate notebook IDs and could not be imported.',
    }
  }

  const hasDuplicateBlockIds = notebooks.some(
    (notebook) => !hasUniqueIds(notebook.blocks),
  )

  if (hasDuplicateBlockIds) {
    return {
      ok: false,
      message: 'A notebook in that workspace has duplicate block IDs.',
    }
  }

  const currentNotebookExists = notebooks.some(
    (notebook) => notebook.id === candidate.currentNotebookId,
  )
  const currentNotebookId = currentNotebookExists
    ? candidate.currentNotebookId
    : (notebooks[0]?.id ?? null)

  return {
    ok: true,
    workspace: {
      version: WORKSPACE_SCHEMA_VERSION,
      notebooks,
      currentNotebookId,
    },
  }
}

export function createNotebook(title = UNTITLED_NOTEBOOK_TITLE, blocks: Block[] = []) {
  const timestamp = now()

  return {
    id: createId('notebook'),
    title: normalizeTitle(title),
    blocks,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function createWorkspace(notebooks: Notebook[] = []): NotebookWorkspace {
  return {
    version: WORKSPACE_SCHEMA_VERSION,
    notebooks,
    currentNotebookId: notebooks[0]?.id ?? null,
  }
}

export function renameNotebook(notebook: Notebook, title: string): Notebook {
  return {
    ...notebook,
    title: normalizeTitle(title),
    updatedAt: now(),
  }
}

export function touchNotebook(notebook: Notebook, blocks: Block[]): Notebook {
  return {
    ...notebook,
    blocks,
    updatedAt: now(),
  }
}

export function duplicateNotebook(notebook: Notebook): Notebook {
  const timestamp = now()

  return {
    id: createId('notebook'),
    title: `${normalizeTitle(notebook.title)} Copy`,
    blocks: cloneBlocksWithNewIds(notebook.blocks),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function createNotebookFromImport(notebook: Notebook): Notebook {
  const timestamp = now()

  return {
    id: createId('notebook'),
    title: normalizeTitle(notebook.title),
    blocks: cloneBlocksWithNewIds(notebook.blocks),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function createNotebookFromBlocks(
  title: string,
  blocks: Block[],
): Notebook {
  const timestamp = now()

  return {
    id: createId('notebook'),
    title: normalizeTitle(title),
    blocks: cloneBlocksWithNewIds(blocks),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function parseNotebookJson(json: string): ParseNotebookResult {
  const parsed = parseJson(json)

  if (!parsed.ok) {
    return parsed
  }

  const parsedValue = parsed.value

  if (parsedValue && typeof parsedValue === 'object') {
    const candidate = parsedValue as Record<string, unknown>

    if (candidate.kind === 'notebook') {
      const result = validateNotebook(candidate.notebook)

      return result.ok
        ? { ok: true, notebook: createNotebookFromImport(result.notebook) }
        : result
    }
  }

  const legacyBlocks = getBlocksFromParsedValue(parsedValue)
  const blocksResult = validateBlocks(legacyBlocks)

  if (!blocksResult.ok) {
    return blocksResult
  }

  return {
    ok: true,
    notebook: createNotebookFromBlocks('Imported notebook', blocksResult.blocks),
  }
}

export function parseWorkspaceJson(json: string): ParseWorkspaceResult {
  const parsed = parseJson(json)

  if (!parsed.ok) {
    return parsed
  }

  const parsedValue = parsed.value

  if (parsedValue && typeof parsedValue === 'object') {
    const candidate = parsedValue as Record<string, unknown>

    if (candidate.kind === 'workspace') {
      return validateWorkspace(candidate.workspace)
    }
  }

  return validateWorkspace(parsedValue)
}

export function loadWorkspaceFromStorage(
  workspaceStorageValue: string | null,
  legacyNotebookStorageValue: string | null,
) {
  if (workspaceStorageValue) {
    const workspace = parseWorkspaceJson(workspaceStorageValue)

    if (workspace.ok) {
      return workspace.workspace
    }
  }

  if (legacyNotebookStorageValue) {
    const legacyNotebook = parseNotebookJson(legacyNotebookStorageValue)

    if (legacyNotebook.ok) {
      const migratedNotebook = {
        ...legacyNotebook.notebook,
        title: 'Migrated notebook',
      }

      return createWorkspace([migratedNotebook])
    }
  }

  return createWorkspace([createNotebook()])
}

export function createNotebookExport(notebook: Notebook): NotebookFile {
  return {
    app: APP_NAME,
    version: NOTEBOOK_FILE_VERSION,
    kind: 'notebook',
    exportedAt: new Date().toISOString(),
    notebook,
  }
}

export function createWorkspaceExport(workspace: NotebookWorkspace): WorkspaceFile {
  return {
    app: APP_NAME,
    version: NOTEBOOK_FILE_VERSION,
    kind: 'workspace',
    exportedAt: new Date().toISOString(),
    workspace,
  }
}
