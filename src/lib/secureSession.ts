import { isTauri } from '@tauri-apps/api/core'
import { appDataDir } from '@tauri-apps/api/path'
import { Stronghold } from '@tauri-apps/plugin-stronghold'

const SESSION_STORAGE_KEY = 'mathplorer:session-token'
const STRONGHOLD_CLIENT_NAME = 'mathplorer'
const STRONGHOLD_RECORD_KEY = 'session-token'
const STRONGHOLD_VAULT_PASSWORD = 'mathplorer-session-vault-v1'

async function getStrongholdStore() {
  const vaultPath = `${await appDataDir()}/mathplorer-session.hold`
  const stronghold = await Stronghold.load(vaultPath, STRONGHOLD_VAULT_PASSWORD)
  let client

  try {
    client = await stronghold.loadClient(STRONGHOLD_CLIENT_NAME)
  } catch {
    client = await stronghold.createClient(STRONGHOLD_CLIENT_NAME)
  }

  return {
    store: client.getStore(),
    stronghold,
  }
}

export async function loadSessionToken() {
  if (!isTauri()) {
    return window.localStorage.getItem(SESSION_STORAGE_KEY)
  }

  try {
    const { store } = await getStrongholdStore()
    const storedValue = await store.get(STRONGHOLD_RECORD_KEY)

    return storedValue
      ? new TextDecoder().decode(new Uint8Array(storedValue))
      : null
  } catch (error) {
    console.error('Unable to load session token from Stronghold.', error)
    return null
  }
}

export async function saveSessionToken(token: string) {
  if (!isTauri()) {
    window.localStorage.setItem(SESSION_STORAGE_KEY, token)
    return
  }

  const { store, stronghold } = await getStrongholdStore()
  const encodedToken = Array.from(new TextEncoder().encode(token))

  await store.insert(STRONGHOLD_RECORD_KEY, encodedToken)
  await stronghold.save()
}

export async function clearSessionToken() {
  if (!isTauri()) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
    return
  }

  const { store, stronghold } = await getStrongholdStore()

  await store.remove(STRONGHOLD_RECORD_KEY)
  await stronghold.save()
}
