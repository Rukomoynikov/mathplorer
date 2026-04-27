import { describe, expect, it } from 'vitest'
import {
  APP_NAME,
  NOTEBOOK_FILE_VERSION,
  parseNotebookJson,
} from './notebookSerialization'
import type { Block, Notebook } from '../types'

function createStoredBlock(type: Block['type']): Block {
  return {
    id: `block-${type}`,
    type,
    content: '{}',
    createdAt: 1,
    updatedAt: 1,
  }
}

describe('notebookSerialization', () => {
  it('imports notebooks that contain discrete math block types', () => {
    const notebook: Notebook = {
      id: 'notebook-discrete',
      title: 'Discrete Math Foundations',
      blocks: [
        createStoredBlock('set'),
        createStoredBlock('combinatorics'),
        createStoredBlock('probability'),
        createStoredBlock('geometry'),
      ],
      createdAt: 1,
      updatedAt: 1,
    }
    const result = parseNotebookJson(
      JSON.stringify({
        app: APP_NAME,
        exportedAt: '2026-04-27T00:00:00.000Z',
        kind: 'notebook',
        notebook,
        version: NOTEBOOK_FILE_VERSION,
      }),
    )

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.notebook.blocks.map((block) => block.type)).toEqual([
        'set',
        'combinatorics',
        'probability',
        'geometry',
      ])
    }
  })
})
