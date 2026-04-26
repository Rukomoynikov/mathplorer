import { invoke, isTauri } from '@tauri-apps/api/core'
import {
  createWorkspaceExport,
  parseWorkspaceJson,
} from './notebookSerialization'
import type { NotebookWorkspace } from '../types'

export const WORKSPACE_FILE_NAME = 'math-notebook-lab-workspace.json'

export function isNativeStorageAvailable() {
  return typeof window !== 'undefined' && isTauri()
}

export async function getNotebookStorageFolder() {
  return invoke<string | null>('get_notebook_storage_folder')
}

export async function chooseNotebookStorageFolder() {
  return invoke<string | null>('choose_notebook_storage_folder')
}

export async function setNotebookStorageFolder(folderPath: string) {
  await invoke('set_notebook_storage_folder', { folderPath })
}

export async function readWorkspaceFromFolder(folderPath: string) {
  return invoke<string | null>('read_workspace_from_folder', { folderPath })
}

export async function saveWorkspaceToFolder(
  folderPath: string,
  workspace: NotebookWorkspace,
) {
  const workspaceJson = JSON.stringify(createWorkspaceExport(workspace), null, 2)

  await invoke('write_workspace_to_folder', {
    folderPath,
    workspaceJson,
  })
}

export async function loadWorkspaceFromFolder(folderPath: string) {
  const workspaceJson = await readWorkspaceFromFolder(folderPath)

  if (!workspaceJson) {
    return null
  }

  const parsedWorkspace = parseWorkspaceJson(workspaceJson)

  if (!parsedWorkspace.ok) {
    throw new Error(parsedWorkspace.message)
  }

  return parsedWorkspace.workspace
}
