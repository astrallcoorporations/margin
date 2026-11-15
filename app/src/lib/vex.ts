/**
 * Vex: the AI server (the "nova" project) that sits behind Margin. Margin and Vex are ONE website: Margin calls Vex on its own
 * address ("/api/..." and "/auth/..."), and the dev server (or a Vercel rewrite) forwards those to Vex. So there is no
 * cross-site call, no token in a URL, and the sign-in lives in an ordinary cookie that Vex sets.
 *
 * Vex holds the Google keys and the saved sign-ins; Margin holds none. Sign-in is Google only (a school address or an
 * approved one).
 *
 * A separate Vex site (vex.vercel.app) can come later; this same API is what it serves.
 */
/** Where Margin's own requests go. Empty means "this same site", which is the normal setup. */
export const VEX_URL: string = (import.meta.env.VITE_VEX_URL as string | undefined)?.replace(/\/$/, '') ?? ''
/** Where Vex's own standalone page lives, for the "Open Vex" links. */
export const VEX_SITE: string = (import.meta.env.VITE_VEX_SITE as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:3000'

export type VexMessage = { role: 'user' | 'assistant'; content: string }
export type VexCredits = { left: number; max: number }

export type Attached = { id: string; title: string }
export type ClassroomItem = { id: string; code: string; course: string; title: string; detail: string; n: string; unit: string; hot: boolean; link: string; text: string; c: string; files?: Attached[] }
export type StreamPost = { id: string; kind: 'announcement' | 'assignment' | 'material'; course: string; title: string; text: string; at: number; link: string; full: string; files?: Attached[] }
export type ClassroomData = {
  configured: boolean
  connected: boolean
  needsReconnect: boolean
  items: ClassroomItem[]
  stream: StreamPost[]
  hidden: number
  partial: boolean
  at: number
}

export type VexSession =
  | { state: 'loading' }
  | { state: 'offline' }
  | { state: 'signedout'; unavailable: boolean }
  | { state: 'signedin'; email: string; credits: VexCredits; model: string; hasKey: boolean; open: boolean }

const call = (path: string, init: RequestInit = {}) => fetch(`${VEX_URL}${path}`, { ...init, credentials: 'include' })

/** After Google, Vex sends the person back to this exact page. Vex only accepts a path on its own site or an exact allowed origin. */
const here = () => window.location.href
export const signInUrl = (back: string = here()) => `${VEX_URL}/auth/google/signin?return=${encodeURIComponent(back)}`
export const connectClassroomUrl = (back: string = here()) => `${VEX_URL}/auth/google?return=${encodeURIComponent(back)}`

export async function vexSession(): Promise<VexSession> {
  try {
    const r = await call('/api/me')
    if (r.status === 401) {
      const j = await r.json().catch(() => ({}))
      return { state: 'signedout', unavailable: j.signin === false }
    }
    if (!r.ok) return { state: 'offline' }
    const j = await r.json()
    return { state: 'signedin', email: j.email || j.name || '', credits: j.credits, model: j.models?.[0]?.name ?? 'Vex', hasKey: Boolean(j.hasKey), open: Boolean(j.open) }
  } catch {
    return { state: 'offline' }
  }
}

export async function signOut() {
  try {
    await call('/api/logout', { method: 'POST' })
  } catch {
    /* server gone: forgetting the token is enough */
  }
}

export async function fetchClassroom(fresh = false): Promise<ClassroomData> {
  const r = await call(`/api/classroom/stream${fresh ? '?fresh=1' : ''}`)
  if (r.status === 401) throw new VexError('Sign in to see Classroom.', 'signin')
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new VexError(j.error || `Classroom didn’t answer (${r.status}).`, 'server')
  return { configured: !!j.configured, connected: !!j.connected, needsReconnect: !!j.needsReconnect, items: j.items ?? [], stream: j.stream ?? [], hidden: j.hidden ?? 0, partial: !!j.partial, at: j.at ?? 0 }
}

export class VexError extends Error {
  constructor(
    message: string,
    public kind: 'offline' | 'signin' | 'server',
  ) {
    super(message)
  }
}

type VexEvent = { start?: boolean; model?: string; sample?: boolean; t?: string; done?: boolean; charged?: number; credits?: VexCredits; error?: string }

/** Streams one answer. Calls on.text with each piece as it arrives; resolves when the answer is complete. */
export async function askVex(
  messages: VexMessage[],
  on: { text: (piece: string) => void; meta?: (m: { model?: string; sample?: boolean }) => void },
  signal?: AbortSignal,
): Promise<{ charged: number; credits?: VexCredits }> {
  let res: Response
  try {
    res = await call('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'plain', messages: messages.slice(-12) }), signal })
  } catch (e) {
    if (signal?.aborted) throw e
    throw new VexError('Vex isn’t running. Start it, then try again.', 'offline')
  }
  if (res.status === 401) throw new VexError('Sign in with Google to use Vex.', 'signin')
  if (!res.ok || !res.body) {
    let msg = `Vex didn’t answer (${res.status}).`
    try {
      const j = await res.json()
      if (j.error) msg = j.error
    } catch {
      /* not JSON — keep the default */
    }
    throw new VexError(msg, 'server')
  }

  const reader = res.body.getReader()
  const dec = new TextDecoder()
  let buf = ''
  let result: { charged: number; credits?: VexCredits } = { charged: 0 }
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    let i: number
    while ((i = buf.indexOf('\n\n')) >= 0) {
      const line = buf.slice(0, i)
      buf = buf.slice(i + 2)
      if (!line.startsWith('data: ')) continue
      let ev: VexEvent
      try {
        ev = JSON.parse(line.slice(6))
      } catch {
        continue
      }
      if (ev.start) on.meta?.({ model: ev.model, sample: ev.sample })
      if (ev.t) on.text(ev.t)
      if (ev.error) throw new VexError(ev.error, 'server')
      if (ev.done) result = { charged: ev.charged ?? 0, credits: ev.credits }
    }
  }
  return result
}

/* ---------------- the library: every Classroom course as a subject, files downloaded by Vex ---------------- */
export type LibFile = { id: string; name: string; mime?: string; size?: number; ok: boolean; reason?: string; url?: string }
export type LibLink = { type: 'link' | 'video' | 'form'; title: string; url: string }
export type LibItem = {
  id: string
  kind: 'assignment' | 'material' | 'announcement'
  topic: string
  title: string
  text: string
  link: string
  updated: number
  due: number
  points: number
  files: LibFile[]
  links: LibLink[]
}
export type LibTopic = { id: string; name: string; items: LibItem[]; newest: number }
export type LibSubject = { id: string; courseId: string; name: string; section: string; link: string; topics: LibTopic[] }
export type LibSync = { running: boolean; courses: number; done: number; files: number; reused: number; skipped: number; error: string; problems: number }
export type LibraryData = {
  supported: boolean
  configured: boolean
  connected: boolean
  needsReconnect: boolean
  index: { syncedAt: number; subjects: LibSubject[] } | null
  sync: LibSync | null
}

export async function fetchLibrary(): Promise<LibraryData> {
  const r = await call('/api/library')
  if (r.status === 401) throw new VexError('Sign in to see your subjects.', 'signin')
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new VexError(j.error || `Vex didn’t answer (${r.status}).`, 'server')
  return { supported: j.supported !== false, configured: !!j.configured, connected: !!j.connected, needsReconnect: !!j.needsReconnect, index: j.index ?? null, sync: j.sync ?? null }
}

export async function startSync(): Promise<void> {
  const r = await call('/api/library/sync', { method: 'POST' })
  if (!r.ok) {
    const j = await r.json().catch(() => ({}))
    throw new VexError(j.error || `Couldn’t start the sync (${r.status}).`, 'server')
  }
}

const SAFE_INLINE: Record<string, string> = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', txt: 'text/plain' }

/** Opens a downloaded file. The request carries the sign-in, so the file is fetched here and shown from memory. */
export async function openLibFile(f: LibFile, download = false): Promise<void> {
  const win = download ? null : window.open('', '_blank') // opened first: browsers only allow pop-ups straight after a tap
  try {
    const r = await call(`/api/library/file?id=${encodeURIComponent(f.id)}${download ? '&download=1' : ''}`)
    if (!r.ok) throw new VexError(r.status === 404 ? 'That file isn’t in your library yet. Try syncing.' : `Couldn’t open the file (${r.status}).`, 'server')
    // Files come from teachers, so they are untrusted. A blob: page runs on Margin's own origin, so its type must never be
    // taken from the response: rebuild it from a short allowlist keyed on the extension (no HTML, no SVG), and download anything else.
    const ext = (f.name.split('.').pop() ?? '').toLowerCase()
    const safeType = SAFE_INLINE[ext]
    const blob = new Blob([await r.arrayBuffer()], { type: safeType ?? 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const inline = !download && Boolean(safeType)
    if (inline && win) {
      win.location.href = url
    } else {
      win?.close()
      const a = document.createElement('a')
      a.href = url
      a.download = f.name
      document.body.appendChild(a)
      a.click()
      a.remove()
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (e) {
    win?.close()
    throw e
  }
}

/** The words inside the files a teacher attached to a post (Word, PowerPoint, Google Docs/Slides/Sheets, text), read live through Vex. */
export async function attachedText(files: Attached[] = []): Promise<string> {
  const parts = await Promise.all(
    files.slice(0, 4).map(async (f) => {
      try {
        const r = await call(`/api/classroom/file-text?id=${encodeURIComponent(f.id)}`)
        if (!r.ok) return `Attached file “${f.title}”: couldn’t be opened.`
        const j: { text: string; readable: boolean; truncated?: boolean } = await r.json()
        if (!j.readable || !j.text.trim()) return `Attached file “${f.title}”: its contents can’t be read here (PDFs and images aren’t read yet).`
        return `Attached file “${f.title}”${j.truncated ? ' (start of it)' : ''}:\n${j.text.slice(0, 8000)}`
      } catch {
        return `Attached file “${f.title}”: couldn’t be opened.`
      }
    })
  )
  return parts.join('\n\n')
}

export async function fetchFileText(id: string): Promise<{ text: string; readable: boolean; truncated?: boolean }> {
  const r = await call(`/api/library/text?id=${encodeURIComponent(id)}`)
  if (!r.ok) return { text: '', readable: false }
  return r.json()
}
