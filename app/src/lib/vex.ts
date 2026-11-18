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

export type VexPart = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }
export type VexMessage = { role: 'user' | 'assistant'; content: string | VexPart[] }
export type VexModel = { id: string; name: string; short?: string; what?: string; cost: number; vision?: boolean; web?: boolean }
export type VexCredits = { left: number; max: number }

export type Attached = { id: string; title: string }
export type CourseInfo = { id: string; name: string; section: string; link: string }
export type ClassroomItem = { courseId?: string; topic?: string; id: string; code: string; course: string; title: string; detail: string; n: string; unit: string; hot: boolean; link: string; text: string; c: string; files?: Attached[] }
export type StreamPost = { courseId?: string; topic?: string; id: string; kind: 'announcement' | 'assignment' | 'material'; course: string; title: string; text: string; at: number; link: string; full: string; files?: Attached[] }
export type ClassroomData = {
  configured: boolean
  connected: boolean
  needsReconnect: boolean
  items: ClassroomItem[]
  stream: StreamPost[]
  hidden: number
  partial: boolean
  at: number
  courses: CourseInfo[]
}

export type VexSession =
  | { state: 'loading' }
  | { state: 'offline' }
  | { state: 'signedout'; unavailable: boolean }
  | { state: 'signedin'; email: string; credits: VexCredits; model: string; models: VexModel[]; hasKey: boolean; canSearchWeb: boolean; open: boolean }

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
    return { state: 'signedin', email: j.email || j.name || '', credits: j.credits, model: j.models?.[0]?.name ?? 'Vex', models: (j.models ?? []) as VexModel[], hasKey: Boolean(j.hasKey), canSearchWeb: Boolean(j.canSearchWeb), open: Boolean(j.open) }
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
  return { configured: !!j.configured, connected: !!j.connected, needsReconnect: !!j.needsReconnect, items: j.items ?? [], stream: j.stream ?? [], hidden: j.hidden ?? 0, partial: !!j.partial, at: j.at ?? 0, courses: j.courses ?? [] }
}

export class VexError extends Error {
  constructor(
    message: string,
    public kind: 'offline' | 'signin' | 'server',
    public wait = 0,
  ) {
    super(message)
  }
}

type VexEvent = { start?: boolean; model?: string; sample?: boolean; switched?: boolean; searched?: boolean; t?: string; done?: boolean; charged?: number; credits?: VexCredits; error?: string }

/** Streams one answer. Calls on.text with each piece as it arrives; resolves when the answer is complete. */
export async function askVex(
  messages: VexMessage[],
  on: { text: (piece: string) => void; meta?: (m: { model?: string; sample?: boolean; switched?: boolean; searched?: boolean }) => void },
  signal?: AbortSignal,
  model?: string,
  web?: boolean,
): Promise<{ charged: number; credits?: VexCredits }> {
  let res: Response
  try {
    res = await call('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'plain', model, web: !!web, messages: messages.slice(-12) }), signal })
  } catch (e) {
    if (signal?.aborted) throw e
    throw new VexError('Vex isn�?Tt running. Start it, then try again.', 'offline')
  }
  if (res.status === 401) throw new VexError('Sign in with Google to use Vex.', 'signin')
  if (!res.ok || !res.body) {
    let msg = `Vex didn’t answer (${res.status}).`
    let wait = 0
    try {
      const j = await res.json()
      if (j.error) msg = j.error
      if (typeof j.wait === 'number') wait = j.wait
    } catch {
      /* not JSON — keep the default */
    }
    throw new VexError(msg, 'server', wait)
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
      if (ev.start) on.meta?.({ model: ev.model, sample: ev.sample, switched: ev.switched, searched: ev.searched })
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

/* ---------------- attaching files to a message ---------------- */
export type Attachment = { id: string; name: string; kind: 'image' | 'text'; text?: string; url?: string; images?: string[] }
const TEXT_EXT = /\.(txt|md|csv|json|js|ts|tsx|jsx|py|html|css|java|c|cpp|cs|go|rs|rb|php|sql|xml|yml|yaml|log)$/i
export const ATTACH_ACCEPT = 'image/*,.pdf,.docx,.pptx,.txt,.md,.csv,.json,.js,.ts,.py,.html,.css,.java,.c,.cpp,.sql,.xml,.yml'
export const MAX_ATTACH = 3
// (PDF reading itself is done on Vex's server)

function shrinkImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, 1000 / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.max(1, Math.round(img.width * scale))
      c.height = Math.max(1, Math.round(img.height * scale))
      c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', 0.75))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new VexError(`“${file.name}” isn’t an image Vex can open.`, 'server'))
    }
    img.src = url
  })
}

/** Turns a picked file into something Vex can read: a shrunken photo, or its words. Throws a VexError with a plain reason. */
export async function readAttachment(file: File): Promise<Attachment> {
  const id = `${file.name}-${file.size}-${file.lastModified}`
  if (file.type.startsWith('image/')) return { id, name: file.name, kind: 'image', url: await shrinkImage(file) }
  if (/\.(docx|pptx|pdf)$/i.test(file.name)) {
    if (file.size > 6 * 1024 * 1024) throw new VexError(`“${file.name}” is over 6 MB.`, 'server')
    const buf = new Uint8Array(await file.arrayBuffer())
    let bin = ''
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000))
    const r = await call('/api/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: file.name, data: btoa(bin) }) })
    const j: { text?: string; readable?: boolean; error?: string; images?: string[] } = await r.json().catch(() => ({}))
    if (!r.ok) throw new VexError(j.error || `Couldn’t read “${file.name}”.`, 'server')
    if (j.images?.length) return { id, name: file.name, kind: 'text', text: `(“${file.name}” is a scan; its first ${j.images.length} page${j.images.length === 1 ? ' is' : 's are'} attached as photos.)`, images: j.images }
    if (!j.readable || !j.text?.trim()) throw new VexError(`“${file.name}” has no text Vex can read.`, 'server')
    return { id, name: file.name, kind: 'text', text: j.text }
  }
  if (TEXT_EXT.test(file.name) || file.type.startsWith('text/')) {
    if (file.size > 400 * 1024) throw new VexError(`“${file.name}” is too big (400 KB limit for text files).`, 'server')
    return { id, name: file.name, kind: 'text', text: (await file.text()).slice(0, 20000) }
  }
  throw new VexError(`Vex can’t read “${file.name}”. Try a photo, PDF, Word, PowerPoint or text file.`, 'server')
}

/** The words inside the files a teacher attached to a post (Word, PowerPoint, Google Docs/Slides/Sheets, text), read live through Vex. */
let attachedImages: string[] = []
/** Page photos of scanned files found by the last attachedText call. Taken once by the panel and sent along as photos. */
export const takeAttachedImages = () => {
  const out = attachedImages
  attachedImages = []
  return out
}
export async function attachedText(files: Attached[] = []): Promise<string> {
  attachedImages = []
  const parts = await Promise.all(
    files.slice(0, 4).map(async (f) => {
      try {
        const r = await call(`/api/classroom/file-text?id=${encodeURIComponent(f.id)}`)
        if (!r.ok) return `Attached file “${f.title}”: couldn’t be opened.`
        const j: { text: string; readable: boolean; truncated?: boolean; images?: string[] } = await r.json()
        if (j.images?.length) {
          attachedImages.push(...j.images)
          return `Attached file “${f.title}”: it is a scan, so its first ${j.images.length} page${j.images.length === 1 ? ' is' : 's are'} attached as photos. Read them and use them.`
        }
        if (!j.readable || !j.text.trim()) return `Attached file “${f.title}”: its words can’t be read here (it may be a scan or an image).`
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

/* ---------------- Announcements: the school's mail, read and sent through the person's own Gmail ---------------- */
export type MailThread = { id: string; subject: string; from: string; date: number; snippet: string; unread: boolean; count: number }
export type MailMessage = { id: string; from: string; to: string; cc: string; subject: string; date: number; messageId: string; references: string; body: string; attachments: string[] }
export type MailList = { configured: boolean; connected: boolean; threads: MailThread[]; next: string; domain: string }
export const connectMailUrl = (back: string = here()) => `${VEX_URL}/auth/google?service=mail&return=${encodeURIComponent(back)}`

export async function mailList(box: 'school' | 'all', q = '', page = ''): Promise<MailList> {
  const r = await call(`/api/mail/list?box=${box}${q ? `&q=${encodeURIComponent(q)}` : ''}${page ? `&page=${encodeURIComponent(page)}` : ''}`)
  if (r.status === 401) throw new VexError('Sign in to see your messages.', 'signin')
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new VexError(j.error || `Mail didn’t answer (${r.status}).`, 'server')
  return { configured: !!j.configured, connected: !!j.connected, threads: j.threads ?? [], next: j.next ?? '', domain: j.domain ?? 'ked.edu.in' }
}
export async function mailThread(id: string): Promise<MailMessage[]> {
  const r = await call(`/api/mail/thread?id=${encodeURIComponent(id)}`)
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new VexError(j.error || `Couldn’t open that message (${r.status}).`, 'server')
  return j.messages ?? []
}
export async function mailSend(p: { to: string; cc?: string; subject: string; body: string; threadId?: string; inReplyTo?: string; references?: string }): Promise<{ threadId: string }> {
  const r = await call('/api/mail/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new VexError(j.error || `Couldn’t send (${r.status}).`, 'server', typeof j.wait === 'number' ? j.wait : 0)
  return { threadId: j.threadId ?? '' }
}
