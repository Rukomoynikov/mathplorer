import type { Block, BlockType } from '../types'

export const NOTEBOOK_FILE_VERSION = 1
export const NOTEBOOK_STORAGE_KEY = 'math-notebook-lab:v1'

type NotebookFile = {
  app: 'Math Notebook Lab'
  blocks: Block[]
  exportedAt: string
  version: typeof NOTEBOOK_FILE_VERSION
}

type ParseNotebookResult =
  | {
      blocks: Block[]
      ok: true
    }
  | {
      message: string
      ok: false
    }

function isBlockType(value: unknown): value is BlockType {
  return (
    value === 'text' ||
    value === 'formula' ||
    value === 'graph' ||
    value === 'solver' ||
    value === 'explanation'
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

function hasUniqueBlockIds(blocks: Block[]) {
  return new Set(blocks.map((block) => block.id)).size === blocks.length
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

export function parseNotebookJson(json: string): ParseNotebookResult {
  let parsedValue: unknown

  try {
    parsedValue = JSON.parse(json)
  } catch {
    return {
      ok: false,
      message: 'That file is not valid JSON.',
    }
  }

  const blocks = getBlocksFromParsedValue(parsedValue)

  if (!blocks || !blocks.every(isStoredBlock)) {
    return {
      ok: false,
      message: 'That JSON does not look like a Math Notebook Lab notebook.',
    }
  }

  if (!hasUniqueBlockIds(blocks)) {
    return {
      ok: false,
      message: 'That notebook has duplicate block IDs and could not be imported.',
    }
  }

  return {
    ok: true,
    blocks,
  }
}

export function loadBlocksFromStorage(storageValue: string | null) {
  if (!storageValue) {
    return []
  }

  const result = parseNotebookJson(storageValue)

  return result.ok ? result.blocks : []
}

export function createNotebookExport(blocks: Block[]): NotebookFile {
  return {
    app: 'Math Notebook Lab',
    version: NOTEBOOK_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    blocks,
  }
}
