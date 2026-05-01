import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import {
  COURSE_PACKS,
  NOTEBOOK_STORAGE_KEY,
  SAMPLE_NOTEBOOK_TITLE,
  WORKSPACE_STORAGE_KEY,
  createBlock,
  createNotebook,
  createNotebookExport,
  createNotebookFromImport,
  createWorkspace,
  createWorkspaceExport,
  createSampleNotebook,
  createTangentLineFormula,
  differentiateCalculusFormula,
  duplicateNotebook,
  evaluateDerivativeAtPointFormula,
  expandFormula,
  formulaToGraphContent,
  getCourseNotebookTemplate,
  integrateDefiniteFormula,
  loadWorkspaceFromStorage,
  normalizeFormulaContent,
  parseNotebookJson,
  parseWorkspaceJson,
  renameNotebook,
  simplifyFormula,
  substituteFormula,
  touchNotebook,
  type BlockType,
  type CoursePackId,
  type MathEngineResult,
  type Notebook as NotebookModel,
  type NotebookViewMode,
  type NotebookWorkspace,
} from '@mathplorer/notebook'
import {
  Notebook,
  NotebookActionsMenu,
  NotebookTitleControl,
  NotebookViewModeToggle,
  NoNotebookState,
  NoticeToast,
  SettingsPage,
  StorageSetupOverlay,
  WorkspaceSidebar,
  type AppNotice,
} from '@mathplorer/notebook/react'
import AuthDialog, { type AuthDialogMode } from './components/AuthDialog'
import {
  ApiError,
  deleteSyncedNotebook,
  getCurrentUser,
  getSyncedNotebook,
  listSyncedNotebooks,
  putSyncedNotebook,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  signIn,
  signOut,
  signUp,
  type AuthUser,
  type SyncedNotebook,
  type SyncedNotebookSummary,
} from './lib/cloudSync'
import {
  chooseNotebookStorageFolder,
  getNotebookStorageFolder,
  isNativeStorageAvailable,
  loadWorkspaceFromFolder,
  saveWorkspaceToFolder,
  setNotebookStorageFolder,
  WORKSPACE_FILE_NAME,
} from './lib/nativeStorage'
import {
  clearSessionToken,
  loadSessionToken,
  saveSessionToken,
} from './lib/secureSession'

type DerivedFormulaResult = {
  content: string
}

type AppView = 'notebook' | 'settings'

type NotebookSyncState = {
  cloudId: string
  revision: number
  syncedAt: string
}

const SYNC_STATE_STORAGE_KEY = 'mathplorer:manual-sync:v1'

type StorageState =
  | { status: 'browser' }
  | { status: 'error'; message: string }
  | { status: 'loading' }
  | { status: 'needs-folder'; message?: string }
  | { folderPath: string; status: 'ready' }

function loadWorkspace(): NotebookWorkspace {
  if (typeof window === 'undefined') {
    return createWorkspace([createNotebook()])
  }

  return loadWorkspaceFromStorage(
    window.localStorage.getItem(WORKSPACE_STORAGE_KEY),
    window.localStorage.getItem(NOTEBOOK_STORAGE_KEY),
  )
}

function loadSyncState(): Record<string, NotebookSyncState> {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const storedValue = window.localStorage.getItem(SYNC_STATE_STORAGE_KEY)

    if (!storedValue) {
      return {}
    }

    const parsedValue = JSON.parse(storedValue) as unknown

    if (!parsedValue || typeof parsedValue !== 'object') {
      return {}
    }

    return Object.fromEntries(
      Object.entries(parsedValue as Record<string, unknown>).filter(
        (entry): entry is [string, NotebookSyncState] => {
          const value = entry[1]

          return (
            Boolean(value) &&
            typeof value === 'object' &&
            typeof (value as NotebookSyncState).cloudId === 'string' &&
            typeof (value as NotebookSyncState).revision === 'number' &&
            typeof (value as NotebookSyncState).syncedAt === 'string'
          )
        },
      ),
    )
  } catch {
    return {}
  }
}

function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'EMAIL_ALREADY_REGISTERED':
        return 'That email is already registered.'
      case 'EMAIL_NOT_VERIFIED':
        return 'Verify your email before syncing notebooks.'
      case 'INVALID_LOGIN':
        return 'Email or password is incorrect.'
      case 'RATE_LIMITED':
        return 'Too many attempts. Try again later.'
      case 'SYNC_CONFLICT':
        return 'The cloud copy changed since your last sync.'
      default:
        return error.code
    }
  }

  return error instanceof Error ? error.message : 'Request failed.'
}

function downloadJsonFile(filename: string, value: unknown) {
  const json = JSON.stringify(value, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const downloadUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = downloadUrl
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(downloadUrl)
}

function toFileSlug(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'notebook'
  )
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function createInitialStorageState(): StorageState {
  return isNativeStorageAvailable() ? { status: 'loading' } : { status: 'browser' }
}

function getStorageStatusLabel(storageState: StorageState) {
  switch (storageState.status) {
    case 'browser':
      return 'Browser preview storage'
    case 'error':
      return 'Storage folder needs attention'
    case 'loading':
      return 'Checking notebook folder...'
    case 'needs-folder':
      return 'Choose a notebook folder'
    case 'ready':
      return `${storageState.folderPath}/${WORKSPACE_FILE_NAME}`
  }
}

function App() {
  const [workspace, setWorkspace] = useState<NotebookWorkspace>(loadWorkspace)
  const [appView, setAppView] = useState<AppView>('notebook')
  const [storageState, setStorageState] = useState<StorageState>(
    createInitialStorageState,
  )
  const [notebookViewMode, setNotebookViewMode] =
    useState<NotebookViewMode>('preview')
  const [notice, setNotice] = useState<AppNotice | null>(null)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [authDialogMode, setAuthDialogMode] =
    useState<AuthDialogMode>('sign-in')
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [passwordResetToken, setPasswordResetToken] = useState<string | null>(
    null,
  )
  const [syncedNotebooks, setSyncedNotebooks] = useState<
    SyncedNotebookSummary[]
  >([])
  const [syncState, setSyncState] =
    useState<Record<string, NotebookSyncState>>(loadSyncState)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isManagingSyncedNotebooks, setIsManagingSyncedNotebooks] =
    useState(false)
  const [isChoosingStorageFolder, setIsChoosingStorageFolder] = useState(false)
  const notebookImportInputRef = useRef<HTMLInputElement>(null)
  const workspaceImportInputRef = useRef<HTMLInputElement>(null)
  const nativeWorkspaceLoadedRef = useRef(!isNativeStorageAvailable())

  const currentNotebook =
    workspace.notebooks.find(
      (notebook) => notebook.id === workspace.currentNotebookId,
    ) ?? null

  useEffect(() => {
    setNotebookViewMode('preview')
  }, [currentNotebook?.id])

  useEffect(() => {
    const resetToken = new URLSearchParams(window.location.search).get(
      'resetToken',
    )

    if (resetToken) {
      setPasswordResetToken(resetToken)
      setAuthDialogMode('reset')
      setIsAuthDialogOpen(true)
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    let isCancelled = false

    async function loadAuthUser() {
      try {
        const token = await loadSessionToken()

        if (isCancelled) {
          return
        }

        setSessionToken(token)

        if (!token) {
          return
        }

        const result = await getCurrentUser(token)

        if (!isCancelled) {
          setAuthUser(result.user)
        }
      } catch (error) {
        console.error('Unable to load account session.', error)
      } finally {
        if (!isCancelled) {
          setIsAuthLoading(false)
        }
      }
    }

    void loadAuthUser()

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(
        SYNC_STATE_STORAGE_KEY,
        JSON.stringify(syncState),
      )
    } catch (error) {
      console.error('Unable to save sync metadata.', error)
    }
  }, [syncState])

  useEffect(() => {
    if (!authUser?.emailVerified || !sessionToken) {
      setSyncedNotebooks([])
      return
    }

    let isCancelled = false

    async function loadSyncedNotebooks() {
      try {
        const result = await listSyncedNotebooks(sessionToken)

        if (!isCancelled) {
          setSyncedNotebooks(result.notebooks)
        }
      } catch (error) {
        if (!isCancelled) {
          setNotice({
            tone: 'error',
            message: getApiErrorMessage(error),
          })
        }
      }
    }

    void loadSyncedNotebooks()

    return () => {
      isCancelled = true
    }
  }, [authUser?.id, authUser?.emailVerified, sessionToken])

  useEffect(() => {
    if (!isNativeStorageAvailable()) {
      return
    }

    let isCancelled = false

    async function initializeNativeStorage() {
      try {
        const folderPath = await getNotebookStorageFolder()

        if (isCancelled) {
          return
        }

        if (!folderPath) {
          nativeWorkspaceLoadedRef.current = false
          setStorageState({ status: 'needs-folder' })
          return
        }

        const storedWorkspace = await loadWorkspaceFromFolder(folderPath)

        if (isCancelled) {
          return
        }

        if (storedWorkspace) {
          setWorkspace(storedWorkspace)
        } else {
          await saveWorkspaceToFolder(folderPath, workspace)
        }

        if (isCancelled) {
          return
        }

        nativeWorkspaceLoadedRef.current = true
        setStorageState({ folderPath, status: 'ready' })
      } catch (error) {
        if (isCancelled) {
          return
        }

        nativeWorkspaceLoadedRef.current = false
        setStorageState({
          status: 'error',
          message: getErrorMessage(error),
        })
      }
    }

    void initializeNativeStorage()

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(
        WORKSPACE_STORAGE_KEY,
        JSON.stringify(workspace),
      )
    } catch (error) {
      console.error('Unable to save workspace to localStorage.', error)
    }
  }, [workspace])

  useEffect(() => {
    if (
      storageState.status !== 'ready' ||
      !nativeWorkspaceLoadedRef.current ||
      !isNativeStorageAvailable()
    ) {
      return
    }

    let isCancelled = false
    const timeoutId = window.setTimeout(() => {
      void saveWorkspaceToFolder(storageState.folderPath, workspace).catch(
        (error) => {
          if (isCancelled) {
            return
          }

          setNotice({
            tone: 'error',
            message: getErrorMessage(error),
          })
        },
      )
    }, 250)

    return () => {
      isCancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [storageState, workspace])

  function updateCurrentNotebook(
    updater: (notebook: NotebookModel) => NotebookModel,
  ) {
    setWorkspace((currentWorkspace) => {
      const currentNotebookId = currentWorkspace.currentNotebookId

      if (!currentNotebookId) {
        return currentWorkspace
      }

      const notebookIndex = currentWorkspace.notebooks.findIndex(
        (notebook) => notebook.id === currentNotebookId,
      )

      if (notebookIndex === -1) {
        return currentWorkspace
      }

      const notebooks = [...currentWorkspace.notebooks]
      const updatedNotebook = updater(notebooks[notebookIndex])

      if (updatedNotebook === notebooks[notebookIndex]) {
        return currentWorkspace
      }

      notebooks[notebookIndex] = updatedNotebook

      return {
        ...currentWorkspace,
        notebooks,
      }
    })
  }

  async function refreshSyncedNotebooks() {
    if (!authUser?.emailVerified || !sessionToken) {
      setSyncedNotebooks([])
      return
    }

    const result = await listSyncedNotebooks(sessionToken)
    setSyncedNotebooks(result.notebooks)
  }

  function openAuthDialog(mode: AuthDialogMode = 'sign-in') {
    setAuthDialogMode(mode)
    setIsAuthDialogOpen(true)
  }

  async function handleSignIn(email: string, password: string) {
    try {
      const result = await signIn(email, password)

      await saveSessionToken(result.sessionToken)
      setSessionToken(result.sessionToken)
      setAuthUser(result.user)
      setIsAuthDialogOpen(false)
      setNotice({
        tone: 'success',
        message: result.user.emailVerified
          ? 'Signed in.'
          : 'Signed in. Verify your email before syncing.',
      })
    } catch (error) {
      throw new Error(getApiErrorMessage(error))
    }
  }

  async function handleSignUp(email: string, password: string) {
    try {
      const result = await signUp(email, password)

      await saveSessionToken(result.sessionToken)
      setSessionToken(result.sessionToken)
      setAuthUser(result.user)
      setIsAuthDialogOpen(false)
      setNotice({
        tone: 'success',
        message: 'Account created. Check your email to verify it before syncing.',
      })
    } catch (error) {
      throw new Error(getApiErrorMessage(error))
    }
  }

  async function handleForgotPassword(email: string) {
    try {
      await requestPasswordReset(email)
    } catch (error) {
      throw new Error(getApiErrorMessage(error))
    }
  }

  async function handleResetPassword(token: string, password: string) {
    try {
      await resetPassword(token, password)
      setPasswordResetToken(null)
    } catch (error) {
      throw new Error(getApiErrorMessage(error))
    }
  }

  async function handleSignOut() {
    try {
      await signOut(sessionToken)
    } catch (error) {
      console.error('Sign out failed.', error)
    }

    await clearSessionToken()
    setSessionToken(null)
    setAuthUser(null)
    setSyncedNotebooks([])
    setNotice({
      tone: 'success',
      message: 'Signed out.',
    })
  }

  async function handleSyncConflict(
    cloudId: string,
    localNotebook: NotebookModel,
    conflict: SyncedNotebook,
  ) {
    const choice = window
      .prompt(
        'Cloud copy changed. Type "download" to save the cloud copy locally, "overwrite" to replace the cloud copy, or "cancel".',
        'download',
      )
      ?.trim()
      .toLowerCase()

    if (choice === 'download') {
      const importedNotebook = createNotebookFromImport(conflict.notebook)

      setWorkspace((currentWorkspace) => ({
        ...currentWorkspace,
        notebooks: [...currentWorkspace.notebooks, importedNotebook],
        currentNotebookId: importedNotebook.id,
      }))
      setSyncState((currentSyncState) => {
        const remainingSyncState = { ...currentSyncState }
        delete remainingSyncState[localNotebook.id]

        return {
          ...remainingSyncState,
          [importedNotebook.id]: {
            cloudId,
            revision: conflict.revision,
            syncedAt: conflict.updatedAt,
          },
        }
      })
      setNotice({
        tone: 'success',
        message: 'Cloud copy opened as a new local notebook.',
      })
      return
    }

    if (choice === 'overwrite') {
      const result = await putSyncedNotebook(
        cloudId,
        localNotebook,
        conflict.revision,
        sessionToken,
        true,
      )

      setSyncState((currentSyncState) => ({
        ...currentSyncState,
        [localNotebook.id]: {
          cloudId,
          revision: result.revision,
          syncedAt: result.updatedAt,
        },
      }))
      await refreshSyncedNotebooks()
      setNotice({
        tone: 'success',
        message: 'Cloud copy overwritten.',
      })
      return
    }

    setNotice({
      tone: 'success',
      message: 'Sync cancelled.',
    })
  }

  async function handleSyncCurrentNotebook() {
    if (!currentNotebook) {
      return
    }

    if (!authUser || !sessionToken) {
      openAuthDialog('sign-in')
      return
    }

    let activeUser = authUser

    if (!activeUser.emailVerified) {
      const refreshedUser = await getCurrentUser(sessionToken).catch(() => ({
        user: null,
      }))

      if (refreshedUser.user) {
        setAuthUser(refreshedUser.user)
        activeUser = refreshedUser.user
      }
    }

    if (!activeUser.emailVerified) {
      try {
        await resendVerification(sessionToken)
        setNotice({
          tone: 'success',
          message: 'Verification email sent. Verify your email before syncing.',
        })
      } catch (error) {
        setNotice({
          tone: 'error',
          message: getApiErrorMessage(error),
        })
      }
      return
    }

    const currentSyncState = syncState[currentNotebook.id]
    const cloudId = currentSyncState?.cloudId ?? currentNotebook.id

    setIsSyncing(true)

    try {
      const result = await putSyncedNotebook(
        cloudId,
        currentNotebook,
        currentSyncState?.revision ?? null,
        sessionToken,
      )

      setSyncState((nextSyncState) => ({
        ...nextSyncState,
        [currentNotebook.id]: {
          cloudId,
          revision: result.revision,
          syncedAt: result.updatedAt,
        },
      }))
      await refreshSyncedNotebooks()
      setNotice({
        tone: 'success',
        message: 'Notebook synced.',
      })
    } catch (error) {
      if (error instanceof ApiError && error.code === 'SYNC_CONFLICT') {
        await handleSyncConflict(
          cloudId,
          currentNotebook,
          error.payload as SyncedNotebook,
        )
      } else {
        setNotice({
          tone: 'error',
          message: getApiErrorMessage(error),
        })
      }
    } finally {
      setIsSyncing(false)
    }
  }

  async function handleOpenSyncedNotebook(id: string) {
    setIsManagingSyncedNotebooks(true)

    try {
      const result = await getSyncedNotebook(id, sessionToken)
      const existingIndex = workspace.notebooks.findIndex(
        (notebook) => syncState[notebook.id]?.cloudId === id,
      )

      if (
        existingIndex !== -1 &&
        !window.confirm('Replace the local copy of this synced notebook?')
      ) {
        return
      }

      const notebookToOpen =
        existingIndex === -1
          ? workspace.notebooks.some(
              (notebook) => notebook.id === result.notebook.id,
            )
            ? createNotebookFromImport(result.notebook)
            : result.notebook
          : {
              ...result.notebook,
              id: workspace.notebooks[existingIndex].id,
            }

      setWorkspace((currentWorkspace) => {
        if (existingIndex === -1) {
          return {
            ...currentWorkspace,
            notebooks: [...currentWorkspace.notebooks, notebookToOpen],
            currentNotebookId: notebookToOpen.id,
          }
        }

        const notebooks = [...currentWorkspace.notebooks]
        notebooks[existingIndex] = notebookToOpen

        return {
          ...currentWorkspace,
          notebooks,
          currentNotebookId: notebookToOpen.id,
        }
      })
      setSyncState((currentSyncState) => ({
        ...currentSyncState,
        [notebookToOpen.id]: {
          cloudId: id,
          revision: result.revision,
          syncedAt: result.updatedAt,
        },
      }))
      setAppView('notebook')
      setNotice({
        tone: 'success',
        message: 'Synced notebook opened locally.',
      })
    } catch (error) {
      setNotice({
        tone: 'error',
        message: getApiErrorMessage(error),
      })
    } finally {
      setIsManagingSyncedNotebooks(false)
    }
  }

  async function handleDeleteSyncedNotebook(id: string) {
    if (!window.confirm('Delete this cloud copy? Local notebooks stay on this device.')) {
      return
    }

    setIsManagingSyncedNotebooks(true)

    try {
      await deleteSyncedNotebook(id, sessionToken)
      setSyncedNotebooks((currentSyncedNotebooks) =>
        currentSyncedNotebooks.filter((notebook) => notebook.id !== id),
      )
      setSyncState((currentSyncState) =>
        Object.fromEntries(
          Object.entries(currentSyncState).filter(
            ([, value]) => value.cloudId !== id,
          ),
        ),
      )
      setNotice({
        tone: 'success',
        message: 'Cloud copy deleted.',
      })
    } catch (error) {
      setNotice({
        tone: 'error',
        message: getApiErrorMessage(error),
      })
    } finally {
      setIsManagingSyncedNotebooks(false)
    }
  }

  async function handleChooseStorageFolder() {
    setIsChoosingStorageFolder(true)
    const wasReady = storageState.status === 'ready'

    if (wasReady) {
      nativeWorkspaceLoadedRef.current = false
    }

    try {
      const folderPath = await chooseNotebookStorageFolder()
      let workspaceToOpen: NotebookWorkspace | null = null

      if (!folderPath) {
        if (wasReady) {
          nativeWorkspaceLoadedRef.current = true
        }

        if (storageState.status !== 'ready') {
          setStorageState({
            status: 'needs-folder',
            message: 'Choose a folder to start using Math Notebook Lab.',
          })
        }

        return
      }

      const isCurrentFolder =
        storageState.status === 'ready' &&
        storageState.folderPath === folderPath

      if (isCurrentFolder) {
        await saveWorkspaceToFolder(folderPath, workspace)
      } else {
        const storedWorkspace = await loadWorkspaceFromFolder(folderPath)

        if (storedWorkspace) {
          const shouldOpenExisting =
            storageState.status !== 'ready' ||
            window.confirm(
              'This folder already has a Math Notebook Lab workspace. Open it now?',
            )

          if (!shouldOpenExisting) {
            if (wasReady) {
              nativeWorkspaceLoadedRef.current = true
            }

            return
          }

          workspaceToOpen = storedWorkspace
        } else {
          await saveWorkspaceToFolder(folderPath, workspace)
        }
      }

      await setNotebookStorageFolder(folderPath)
      if (workspaceToOpen) {
        setWorkspace(workspaceToOpen)
      }
      nativeWorkspaceLoadedRef.current = true
      setStorageState({ folderPath, status: 'ready' })
      setNotice({
        tone: 'success',
        message: 'Notebook folder updated.',
      })
    } catch (error) {
      const message = getErrorMessage(error)

      if (storageState.status === 'ready') {
        nativeWorkspaceLoadedRef.current = true
        setNotice({
          tone: 'error',
          message,
        })
      } else {
        nativeWorkspaceLoadedRef.current = false
        setStorageState({ status: 'error', message })
      }
    } finally {
      setIsChoosingStorageFolder(false)
    }
  }

  function handleSelectNotebook(id: string) {
    setWorkspace((currentWorkspace) => ({
      ...currentWorkspace,
      currentNotebookId: id,
    }))
    setAppView('notebook')
    setNotice(null)
  }

  function handleCreateNotebook() {
    const notebook = createNotebook()

    setWorkspace((currentWorkspace) => ({
      ...currentWorkspace,
      notebooks: [...currentWorkspace.notebooks, notebook],
      currentNotebookId: notebook.id,
    }))
    setAppView('notebook')
    setNotice({
      tone: 'success',
      message: 'Notebook created.',
    })
  }

  function handleCreateSampleNotebook() {
    const notebook = createNotebook(SAMPLE_NOTEBOOK_TITLE, createSampleNotebook())

    setWorkspace((currentWorkspace) => ({
      ...currentWorkspace,
      notebooks: [...currentWorkspace.notebooks, notebook],
      currentNotebookId: notebook.id,
    }))
    setAppView('notebook')
    setNotice({
      tone: 'success',
      message: 'Sample notebook created.',
    })
  }

  function handleCreateCourseNotebook(templateId: string) {
    const template = getCourseNotebookTemplate(templateId)

    if (!template) {
      setNotice({
        tone: 'error',
        message: 'That example notebook could not be found.',
      })
      return
    }

    const notebook = createNotebook(template.title, template.createBlocks())

    setWorkspace((currentWorkspace) => ({
      ...currentWorkspace,
      notebooks: [...currentWorkspace.notebooks, notebook],
      currentNotebookId: notebook.id,
    }))
    setAppView('notebook')
    setNotice({
      tone: 'success',
      message: `Loaded "${template.title}".`,
    })
  }

  function handleCreateCoursePack(coursePackId: CoursePackId) {
    const coursePack = COURSE_PACKS.find((pack) => pack.id === coursePackId)

    if (!coursePack) {
      setNotice({
        tone: 'error',
        message: 'That course pack could not be found.',
      })
      return
    }

    const notebooks = coursePack.notebooks.map((template) =>
      createNotebook(template.title, template.createBlocks()),
    )

    if (notebooks.length === 0) {
      return
    }

    setWorkspace((currentWorkspace) => ({
      ...currentWorkspace,
      notebooks: [...currentWorkspace.notebooks, ...notebooks],
      currentNotebookId: notebooks[0].id,
    }))
    setAppView('notebook')
    setNotice({
      tone: 'success',
      message: `${coursePack.title} added as ${notebooks.length} notebooks.`,
    })
  }

  function handleRenameNotebook(title: string) {
    updateCurrentNotebook((notebook) => renameNotebook(notebook, title))
  }

  function handleDeleteNotebook(id: string) {
    const notebook = workspace.notebooks.find((candidate) => candidate.id === id)

    if (!notebook) {
      return
    }

    if (
      !window.confirm(
        `Delete "${notebook.title}"? This removes the notebook saved on this device.`,
      )
    ) {
      return
    }

    setWorkspace((currentWorkspace) => {
      const notebookIndex = currentWorkspace.notebooks.findIndex(
        (candidate) => candidate.id === id,
      )

      if (notebookIndex === -1) {
        return currentWorkspace
      }

      const notebooks = currentWorkspace.notebooks.filter(
        (candidate) => candidate.id !== id,
      )
      const shouldChooseNext = currentWorkspace.currentNotebookId === id
      const currentNotebookId = shouldChooseNext
        ? (notebooks[notebookIndex]?.id ??
          notebooks[notebookIndex - 1]?.id ??
          notebooks[0]?.id ??
          null)
        : currentWorkspace.currentNotebookId

      return {
        ...currentWorkspace,
        notebooks,
        currentNotebookId,
      }
    })
    setSyncState((currentSyncState) => {
      const nextSyncState = { ...currentSyncState }
      delete nextSyncState[id]

      return nextSyncState
    })
    setNotice({
      tone: 'success',
      message: 'Notebook deleted.',
    })
  }

  function handleDuplicateNotebook(id: string) {
    setWorkspace((currentWorkspace) => {
      const notebookIndex = currentWorkspace.notebooks.findIndex(
        (notebook) => notebook.id === id,
      )

      if (notebookIndex === -1) {
        return currentWorkspace
      }

      const copiedNotebook = duplicateNotebook(
        currentWorkspace.notebooks[notebookIndex],
      )
      const notebooks = [
        ...currentWorkspace.notebooks.slice(0, notebookIndex + 1),
        copiedNotebook,
        ...currentWorkspace.notebooks.slice(notebookIndex + 1),
      ]

      return {
        ...currentWorkspace,
        notebooks,
        currentNotebookId: copiedNotebook.id,
      }
    })
    setAppView('notebook')
    setNotice({
      tone: 'success',
      message: 'Notebook duplicated.',
    })
  }

  function handleAddBlock(type: BlockType) {
    updateCurrentNotebook((notebook) =>
      touchNotebook(notebook, [...notebook.blocks, createBlock(type)]),
    )
    setNotice(null)
  }

  function handleInsertBlockAfter(
    sourceId: string,
    type: BlockType,
    content: string,
  ) {
    updateCurrentNotebook((notebook) => {
      const sourceIndex = notebook.blocks.findIndex((block) => block.id === sourceId)

      if (sourceIndex === -1) {
        return notebook
      }

      const derivedBlock = createBlock(type, content)
      const blocks = [
        ...notebook.blocks.slice(0, sourceIndex + 1),
        derivedBlock,
        ...notebook.blocks.slice(sourceIndex + 1),
      ]

      return touchNotebook(notebook, blocks)
    })
  }

  function handleUpdateBlock(id: string, content: string) {
    updateCurrentNotebook((notebook) => {
      const timestamp = Date.now()
      const blocks = notebook.blocks.map((block) =>
        block.id === id ? { ...block, content, updatedAt: timestamp } : block,
      )

      return touchNotebook(notebook, blocks)
    })
  }

  function handleDeleteBlock(id: string) {
    updateCurrentNotebook((notebook) => {
      const blocks = notebook.blocks.filter((block) => block.id !== id)

      return blocks.length === notebook.blocks.length
        ? notebook
        : touchNotebook(notebook, blocks)
    })
    setNotice(null)
  }

  function handleDuplicateBlock(id: string) {
    updateCurrentNotebook((notebook) => {
      const sourceIndex = notebook.blocks.findIndex((block) => block.id === id)

      if (sourceIndex === -1) {
        return notebook
      }

      const sourceBlock = notebook.blocks[sourceIndex]
      const duplicatedBlock = createBlock(sourceBlock.type, sourceBlock.content)
      const blocks = [
        ...notebook.blocks.slice(0, sourceIndex + 1),
        duplicatedBlock,
        ...notebook.blocks.slice(sourceIndex + 1),
      ]

      return touchNotebook(notebook, blocks)
    })
  }

  function handleCreateGraphFromFormula(id: string) {
    const sourceBlock = currentNotebook?.blocks.find((block) => block.id === id)

    if (!sourceBlock) {
      return
    }

    handleInsertBlockAfter(id, 'graph', formulaToGraphContent(sourceBlock.content))
  }

  function handleCreateExplanationFromFormula(id: string) {
    const sourceBlock = currentNotebook?.blocks.find((block) => block.id === id)

    if (!sourceBlock) {
      return
    }

    const normalized = normalizeFormulaContent(sourceBlock.content)
    handleInsertBlockAfter(id, 'explanation', `Explain this formula: ${normalized}`)
  }

  function handleCreateAlgebraFormula(
    id: string,
    transform: (content: string) => MathEngineResult<DerivedFormulaResult>,
    successMessage: string,
  ) {
    const sourceBlock = currentNotebook?.blocks.find((block) => block.id === id)

    if (!sourceBlock) {
      return
    }

    const result = transform(sourceBlock.content)

    if (!result.ok) {
      setNotice({
        tone: 'error',
        message: result.error.message,
      })
      return
    }

    handleInsertBlockAfter(id, 'formula', result.value.content)
    setNotice({
      tone: 'success',
      message: successMessage,
    })
  }

  function handleSimplifyFormula(id: string) {
    handleCreateAlgebraFormula(id, simplifyFormula, 'Simplified formula created.')
  }

  function handleExpandFormula(id: string) {
    handleCreateAlgebraFormula(
      id,
      expandFormula,
      'Expanded formula created.',
    )
  }

  function handleDifferentiateFormula(id: string, variable: string) {
    handleCreateAlgebraFormula(
      id,
      (content) => differentiateCalculusFormula(content, variable),
      'Derivative formula created.',
    )
  }

  function handleEvaluateDerivativeFormula(
    id: string,
    variable: string,
    point: string,
  ) {
    handleCreateAlgebraFormula(
      id,
      (content) => evaluateDerivativeAtPointFormula(content, variable, point),
      'Derivative value created.',
    )
  }

  function handleTangentLineFormula(
    id: string,
    variable: string,
    point: string,
  ) {
    handleCreateAlgebraFormula(
      id,
      (content) => createTangentLineFormula(content, variable, point),
      'Tangent line created.',
    )
  }

  function handleIntegrateDefiniteFormula(
    id: string,
    variable: string,
    lowerBound: string,
    upperBound: string,
  ) {
    handleCreateAlgebraFormula(
      id,
      (content) =>
        integrateDefiniteFormula(content, variable, lowerBound, upperBound),
      'Definite integral created.',
    )
  }

  function handleSubstituteFormula(id: string, substitution: string) {
    handleCreateAlgebraFormula(
      id,
      (content) => substituteFormula(content, substitution),
      'Substituted formula created.',
    )
  }

  function handleMoveBlock(id: string, direction: 'up' | 'down') {
    updateCurrentNotebook((notebook) => {
      const sourceIndex = notebook.blocks.findIndex((block) => block.id === id)
      const targetIndex = direction === 'up' ? sourceIndex - 1 : sourceIndex + 1

      if (
        sourceIndex === -1 ||
        targetIndex < 0 ||
        targetIndex >= notebook.blocks.length
      ) {
        return notebook
      }

      const blocks = [...notebook.blocks]
      const [movedBlock] = blocks.splice(sourceIndex, 1)
      blocks.splice(targetIndex, 0, movedBlock)

      return touchNotebook(notebook, blocks)
    })
  }

  function handleLoadSampleIntoCurrentNotebook() {
    if (!currentNotebook) {
      handleCreateSampleNotebook()
      return
    }

    if (
      currentNotebook.blocks.length > 0 &&
      !window.confirm(
        'Load the sample into this notebook? This will replace its current blocks.',
      )
    ) {
      return
    }

    updateCurrentNotebook((notebook) =>
      touchNotebook(notebook, createSampleNotebook()),
    )
    setNotice({
      tone: 'success',
      message: 'Sample loaded into current notebook.',
    })
  }

  function handleExportNotebook() {
    if (!currentNotebook) {
      return
    }

    try {
      const dateStamp = new Date().toISOString().slice(0, 10)
      const slug = toFileSlug(currentNotebook.title)

      downloadJsonFile(
        `math-notebook-lab-${slug}-${dateStamp}.json`,
        createNotebookExport(currentNotebook),
      )
      setNotice({
        tone: 'success',
        message: 'Current notebook exported as JSON.',
      })
    } catch {
      setNotice({
        tone: 'error',
        message: 'Export failed. Try again after saving or refreshing the app.',
      })
    }
  }

  function handleExportWorkspace() {
    try {
      const dateStamp = new Date().toISOString().slice(0, 10)

      downloadJsonFile(
        `math-notebook-lab-workspace-${dateStamp}.json`,
        createWorkspaceExport(workspace),
      )
      setNotice({
        tone: 'success',
        message: 'Workspace exported as JSON.',
      })
    } catch {
      setNotice({
        tone: 'error',
        message: 'Workspace export failed. Try again after refreshing the app.',
      })
    }
  }

  function handleImportNotebookClick() {
    notebookImportInputRef.current?.click()
  }

  function handleImportWorkspaceClick() {
    workspaceImportInputRef.current?.click()
  }

  async function handleImportNotebook(file: File | undefined) {
    if (!file) {
      return
    }

    try {
      const parsedNotebook = parseNotebookJson(await file.text())

      if (!parsedNotebook.ok) {
        setNotice({
          tone: 'error',
          message: parsedNotebook.message,
        })
        return
      }

      const importedNotebook = parsedNotebook.notebook

      setWorkspace((currentWorkspace) => ({
        ...currentWorkspace,
        notebooks: [...currentWorkspace.notebooks, importedNotebook],
        currentNotebookId: importedNotebook.id,
      }))
      setAppView('notebook')
      setNotice({
        tone: 'success',
        message: `Imported "${importedNotebook.title}" as a new notebook.`,
      })
    } catch {
      setNotice({
        tone: 'error',
        message: 'Import failed. Choose a JSON file exported from Math Notebook Lab.',
      })
    }
  }

  async function handleImportWorkspace(file: File | undefined) {
    if (!file) {
      return
    }

    try {
      const parsedWorkspace = parseWorkspaceJson(await file.text())

      if (!parsedWorkspace.ok) {
        setNotice({
          tone: 'error',
          message: parsedWorkspace.message,
        })
        return
      }

      if (
        !window.confirm(
          'Import this workspace? This will replace all notebooks saved on this device.',
        )
      ) {
        return
      }

      setWorkspace(parsedWorkspace.workspace)
      setAppView('notebook')
      setNotice({
        tone: 'success',
        message: 'Workspace imported.',
      })
    } catch {
      setNotice({
        tone: 'error',
        message:
          'Workspace import failed. Choose a workspace JSON file exported from Math Notebook Lab.',
      })
    }
  }

  const totalBlockCount = workspace.notebooks.reduce(
    (count, notebook) => count + notebook.blocks.length,
    0,
  )
  const currentSyncState = currentNotebook ? syncState[currentNotebook.id] : null
  const accountStatusLabel = isAuthLoading
    ? 'Checking account...'
    : authUser
      ? authUser.emailVerified
        ? 'Signed in'
        : 'Email verification required'
      : 'Offline only'
  const syncStatusLabel = currentNotebook
    ? currentSyncState
      ? `Synced revision ${currentSyncState.revision}`
      : 'Offline only'
    : undefined
  const storageFolderPath =
    storageState.status === 'ready' ? storageState.folderPath : null
  const storageStatusLabel = getStorageStatusLabel(storageState)
  const storageChangeDisabled =
    storageState.status === 'loading' ||
    storageState.status === 'browser' ||
    isChoosingStorageFolder
  const shouldShowStorageSetup =
    storageState.status === 'loading' ||
    storageState.status === 'needs-folder' ||
    storageState.status === 'error'

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex flex-col lg:flex-row">
        <WorkspaceSidebar
          activeView={appView}
          notebooks={workspace.notebooks}
          currentNotebookId={workspace.currentNotebookId}
          coursePacks={COURSE_PACKS}
          onCreateNotebook={handleCreateNotebook}
          onCreateSampleNotebook={handleCreateSampleNotebook}
          onCreateCourseNotebook={handleCreateCourseNotebook}
          onCreateCoursePack={handleCreateCoursePack}
          onSelectNotebook={handleSelectNotebook}
          onOpenNotebook={() => setAppView('notebook')}
          onOpenSettings={() => setAppView('settings')}
        />

        <div className="mx-auto flex min-w-0 flex-1 flex-col gap-5 px-4 py-4 sm:px-6 lg:max-w-6xl lg:px-8 lg:py-6">
          {appView === 'settings' ? (
            <SettingsPage
              accountEmail={authUser?.email ?? null}
              accountStatusLabel={accountStatusLabel}
              blockCount={totalBlockCount}
              notebookCount={workspace.notebooks.length}
              onDeleteSyncedNotebook={handleDeleteSyncedNotebook}
              onChangeStorageFolder={() => void handleChooseStorageFolder()}
              onExportWorkspace={handleExportWorkspace}
              onImportWorkspace={handleImportWorkspaceClick}
              onOpenAuth={() => openAuthDialog('sign-in')}
              onOpenSyncedNotebook={handleOpenSyncedNotebook}
              onSignOut={authUser ? handleSignOut : undefined}
              onSyncCurrentNotebook={handleSyncCurrentNotebook}
              storageChangeDisabled={storageChangeDisabled}
              storageFolderPath={storageFolderPath}
              storageStatusLabel={storageStatusLabel}
              syncCurrentDisabled={isSyncing || !currentNotebook}
              syncStatusLabel={syncStatusLabel}
              syncedNotebookActionDisabled={isManagingSyncedNotebooks}
              syncedNotebooks={authUser?.emailVerified ? syncedNotebooks : []}
            />
          ) : currentNotebook ? (
            <>
              <header className="mnl-panel px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase text-teal-700">
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-teal-500"
                      />
                      Current notebook
                    </div>
                    {notebookViewMode === 'edit' ? (
                      <div className="mt-2">
                        <NotebookTitleControl
                          title={currentNotebook.title}
                          onRename={handleRenameNotebook}
                        />
                      </div>
                    ) : (
                      <h1 className="mt-1 break-words text-2xl font-semibold text-slate-950 sm:text-3xl">
                        {currentNotebook.title}
                      </h1>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-medium">
                        {currentNotebook.blocks.length}{' '}
                        {currentNotebook.blocks.length === 1 ? 'block' : 'blocks'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {storageState.status === 'ready'
                          ? 'Saved to notebook folder'
                          : 'Saved locally'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-medium">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            currentSyncState ? 'bg-sky-500' : 'bg-slate-400'
                          }`}
                        />
                        {currentSyncState
                          ? `Synced r${currentSyncState.revision}`
                          : 'Offline only'}
                      </span>
                      <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-500">
                        Updated{' '}
                        {new Date(currentNotebook.updatedAt).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleSyncCurrentNotebook()}
                      disabled={isSyncing}
                      className="mnl-button-secondary"
                    >
                      <RefreshCw
                        size={15}
                        className={isSyncing ? 'animate-spin' : undefined}
                        aria-hidden="true"
                      />
                      Sync
                    </button>
                    <NotebookViewModeToggle
                      mode={notebookViewMode}
                      onModeChange={setNotebookViewMode}
                    />
                    <NotebookActionsMenu
                      onDelete={() => handleDeleteNotebook(currentNotebook.id)}
                      onDuplicate={() =>
                        handleDuplicateNotebook(currentNotebook.id)
                      }
                      onExport={handleExportNotebook}
                      onImport={handleImportNotebookClick}
                    />
                  </div>
                </div>
              </header>

              <Notebook
                key={currentNotebook.id}
                blocks={currentNotebook.blocks}
                mode={notebookViewMode}
                onAddBlock={handleAddBlock}
                onLoadSampleNotebook={handleLoadSampleIntoCurrentNotebook}
                onUpdateBlock={handleUpdateBlock}
                onDeleteBlock={handleDeleteBlock}
                onDuplicateBlock={handleDuplicateBlock}
                onCreateExplanationFromFormula={handleCreateExplanationFromFormula}
                onCreateGraphFromFormula={handleCreateGraphFromFormula}
                onDifferentiateFormula={handleDifferentiateFormula}
                onEvaluateDerivativeFormula={handleEvaluateDerivativeFormula}
                onExpandFormula={handleExpandFormula}
                onIntegrateDefiniteFormula={handleIntegrateDefiniteFormula}
                onMoveBlock={handleMoveBlock}
                onSimplifyFormula={handleSimplifyFormula}
                onSubstituteFormula={handleSubstituteFormula}
                onTangentLineFormula={handleTangentLineFormula}
              />

              {totalBlockCount > 0 && (
                <p className="text-center text-xs text-slate-400">
                  {totalBlockCount} total{' '}
                  {totalBlockCount === 1 ? 'block' : 'blocks'} across{' '}
                  {workspace.notebooks.length}{' '}
                  {workspace.notebooks.length === 1 ? 'notebook' : 'notebooks'}
                </p>
              )}
            </>
          ) : (
            <NoNotebookState
              onCreateNotebook={handleCreateNotebook}
              onCreateSampleNotebook={handleCreateSampleNotebook}
              onImportNotebook={handleImportNotebookClick}
            />
          )}
        </div>
      </div>

      <input
        ref={notebookImportInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          void handleImportNotebook(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      <input
        ref={workspaceImportInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          void handleImportWorkspace(event.target.files?.[0])
          event.target.value = ''
        }}
      />

      {isAuthDialogOpen && (
        <AuthDialog
          initialMode={authDialogMode}
          onClose={() => setIsAuthDialogOpen(false)}
          onForgotPassword={handleForgotPassword}
          onResetPassword={handleResetPassword}
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          resetToken={passwordResetToken}
        />
      )}

      {shouldShowStorageSetup && (
        <StorageSetupOverlay
          mode={
            storageState.status === 'loading'
              ? 'loading'
              : storageState.status === 'error'
                ? 'error'
                : 'needs-folder'
          }
          message={
            storageState.status === 'error' ||
            storageState.status === 'needs-folder'
              ? storageState.message
              : undefined
          }
          isChoosing={isChoosingStorageFolder}
          onChooseFolder={() => void handleChooseStorageFolder()}
        />
      )}

      {notice && (
        <NoticeToast notice={notice} onDismiss={() => setNotice(null)} />
      )}
    </main>
  )
}

export default App
