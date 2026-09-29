/**
 * Belt-and-braces persistence for the progress store.
 *
 * 1. localStorage — fast, synchronous, the main copy.
 * 2. IndexedDB    — a second copy that survives if localStorage is cleared or blocked
 *                   (some browsers / private modes / embedded previews).
 * 3. Cookie       — a tiny copy of the essentials (checklist + name), the last fallback.
 *
 * Everything stays in this browser on this device; nothing is sent anywhere.
 */

const DB = 'margin'
const STORE = 'kv'
const COOKIE = 'margin_essentials'

// ───────────────────────────── localStorage

export function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeLocal(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

// ───────────────────────────── IndexedDB

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('no indexedDB'))
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function readIdb(key: string): Promise<string | null> {
  try {
    const db = await openDb()
    return await new Promise((resolve) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
      req.onsuccess = () => resolve(typeof req.result === 'string' ? req.result : null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function writeIdb(key: string, value: string) {
  try {
    const db = await openDb()
    db.transaction(STORE, 'readwrite').objectStore(STORE).put(value, key)
  } catch {
    /* unavailable — the other copies still work */
  }
}

// ───────────────────────────── Cookie (essentials only — cookies hold ~4 KB)

export function readCookie(): Record<string, unknown> | null {
  try {
    const hit = document.cookie.split('; ').find((c) => c.startsWith(COOKIE + '='))
    return hit ? JSON.parse(decodeURIComponent(hit.slice(COOKIE.length + 1))) : null
  } catch {
    return null
  }
}

export function writeCookie(value: Record<string, unknown>) {
  try {
    const encoded = encodeURIComponent(JSON.stringify(value))
    if (encoded.length > 3800) return
    document.cookie = `${COOKIE}=${encoded}; Max-Age=31536000; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
  } catch {
    /* cookies blocked */
  }
}

/** Ask the browser not to evict our storage under pressure (supported in most browsers). */
export function requestPersistence() {
  try {
    navigator.storage?.persist?.()
  } catch {
    /* ignore */
  }
}
