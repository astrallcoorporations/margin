import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Copy, ExternalLink, LogIn, LogOut, Plus, RotateCcw, Send, Square, X } from 'lucide-react'
import { askVex, captureToken, fetchLibrary, signInUrl, signOut, startSync, vexSession, VexError, VEX_URL, type LibraryData, type VexCredits, type VexMessage, type VexSession } from '@/lib/vex'
import { renderMarkdown } from '@/lib/md'
import { copyText } from '@/lib/clipboard'
import { buttonClass } from './ui'
import { cn } from '@/lib/utils'
import { Button } from './ui'
import { useToast } from './toast'

type Item =
  | { role: 'user'; content: string; label?: string }
  | { role: 'assistant'; content: string; error?: { text: string; kind: VexError['kind'] }; charged?: number }

type Ask = (getText: () => string | Promise<string>, label: string) => void
type VexCtx = {
  ask: Ask
  open: () => void
  session: VexSession
  refresh: () => void
  leave: () => void
  /** Classroom courses and their downloaded files, as Vex has them. Null until loaded. */
  library: LibraryData | null
  libraryError: string
  refreshLibrary: () => void
  syncLibrary: () => Promise<void>
}
const Ctx = createContext<VexCtx>({ ask: () => {}, open: () => {}, session: { state: 'loading' }, refresh: () => {}, leave: () => {}, library: null, libraryError: '', refreshLibrary: () => {}, syncLibrary: async () => {} })
export const useVex = () => useContext(Ctx)

const MAX_PROMPT = 24000

const FLAGS: Record<string, string> = {
  denied: 'That account can’t use Vex. Sign in with your ked.edu.in school account.',
  unavailable: 'Sign-in isn’t set up yet. The owner needs to add the Google keys to Vex.',
  expired: 'That sign-in took too long. Try again.',
  cancelled: 'Sign-in was cancelled.',
  failed: 'Google didn’t finish the sign-in. Try again.',
}

/** Vex lives in a side panel so the page you asked about stays where it was. */
export function VexProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<VexSession>({ state: 'loading' })
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [busy, setBusy] = useState(false)
  const [credits, setCredits] = useState<VexCredits | null>(null)
  const [model, setModel] = useState('')
  const [draft, setDraft] = useState('')
  const ctl = useRef<AbortController | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const notify = useToast()
  const signedIn = session.state === 'signedin'

  // Only the newest answer about "who am I" counts; an older one arriving late must not undo a sign-out.
  const seq = useRef(0)
  const refresh = useCallback(() => {
    const mine = ++seq.current
    vexSession().then((s) => {
      if (mine !== seq.current) return
      setSession(s)
      if (s.state === 'signedin') {
        setCredits(s.credits)
        setModel((m) => m || s.model)
      }
    })
  }, [])

  // On first load: pick up a fresh sign-in, show why a sign-in or Classroom connect didn't work, then ask Vex who we are.
  useEffect(() => {
    captureToken()
    const q = new URLSearchParams(window.location.search)
    const why = q.get('signin')
    const cls = q.get('classroom')
    if (why || cls) {
      q.delete('signin')
      q.delete('classroom')
      const rest = q.toString()
      window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : '') + window.location.hash)
      if (why && FLAGS[why]) notify(FLAGS[why], 'error')
      if (cls) notify(cls === 'failed' ? 'Google didn’t finish connecting Classroom.' : cls === 'cancelled' ? 'Classroom was not connected.' : 'Classroom isn’t set up on Vex yet.', 'error')
    }
    refresh()
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [notify, refresh])

  // The library (every Classroom course as a subject). Loaded once signed in; checked again every few seconds while Vex is still downloading.
  const [library, setLibrary] = useState<LibraryData | null>(null)
  const [libraryError, setLibraryError] = useState('')
  const refreshLibrary = useCallback(() => {
    fetchLibrary()
      .then((l) => {
        setLibrary(l)
        setLibraryError('')
      })
      .catch((e) => setLibraryError(e instanceof Error ? e.message : 'Couldn’t load your subjects.'))
  }, [])
  useEffect(() => {
    if (!signedIn) {
      setLibrary(null)
      return
    }
    refreshLibrary()
  }, [signedIn, refreshLibrary])
  const syncing = library?.sync?.running
  useEffect(() => {
    if (!syncing) return
    const t = window.setInterval(refreshLibrary, 2500)
    return () => window.clearInterval(t)
  }, [syncing, refreshLibrary])
  const syncLibrary = useCallback(async () => {
    await startSync()
    refreshLibrary()
  }, [refreshLibrary])

  const patchLast = (fn: (a: Extract<Item, { role: 'assistant' }>) => Item) =>
    setItems((list) => {
      const last = list[list.length - 1]
      return last?.role === 'assistant' ? [...list.slice(0, -1), fn(last)] : list
    })

  const run = useCallback(
    async (history: Item[]) => {
      ctl.current?.abort()
      const mine = new AbortController()
      ctl.current = mine
      setItems([...history, { role: 'assistant', content: '' }])
      setBusy(true)
      const wire: VexMessage[] = history.filter((m) => m.content).map((m) => ({ role: m.role, content: m.content }))
      try {
        const r = await askVex(
          wire,
          { text: (piece) => patchLast((a) => ({ ...a, content: a.content + piece })), meta: (m) => m.model && setModel(m.model) },
          mine.signal,
        )
        if (r.credits) setCredits(r.credits)
        patchLast((a) => (a.content ? { ...a, charged: r.charged } : { ...a, error: { text: 'No answer came back.', kind: 'server' } }))
      } catch (e) {
        if (mine.signal.aborted) return
        const err = e instanceof VexError ? { text: e.message, kind: e.kind } : { text: 'Something went wrong talking to Vex.', kind: 'server' as const }
        if (err.kind === 'signin') refresh()
        patchLast((a) => ({ ...a, error: err }))
      } finally {
        if (ctl.current === mine) setBusy(false)
      }
    },
    [refresh],
  )

  const ask = useCallback<Ask>(
    async (getText, label) => {
      setOpen(true)
      if (!signedIn) return // the panel explains: sign in first
      try {
        const text = (await getText()).trim()
        if (!text) return notify('Nothing to send yet', 'error')
        // Groq's free plan allows only a few thousand tokens a minute. A prompt bigger than this would be refused or cut off.
        if (text.length > MAX_PROMPT) {
          setOpen(false)
          return notify(`That prompt is ${Math.round(text.length / 1000)}k characters, too long for Vex on the free Groq plan (limit ${MAX_PROMPT / 1000}k). Choose less, or use Copy and paste it into another AI.`, 'error')
        }
        // A new Margin prompt starts a fresh conversation: each one carries its own full context.
        run([{ role: 'user', content: text, label }])
      } catch (e) {
        notify(e instanceof Error ? e.message : 'Couldn’t build the prompt', 'error')
      }
    },
    [notify, run, signedIn],
  )

  const followUp = () => {
    const text = draft.trim()
    if (!text || busy || !signedIn) return
    setDraft('')
    run([...items.filter((m) => !(m.role === 'assistant' && m.error)), { role: 'user', content: text }])
  }
  const retry = () => run(items.slice(0, -1))
  const stop = () => {
    ctl.current?.abort()
    setBusy(false)
  }
  const reset = () => {
    stop()
    setItems([])
    setDraft('')
  }
  const leave = useCallback(async () => {
    stop()
    setItems([])
    seq.current++
    await signOut()
    seq.current++
    setSession({ state: 'signedout', unavailable: false })
    setCredits(null)
    notify('Signed out')
  }, [notify])

  // Esc closes; keep the page behind from scrolling; put the cursor in the box.
  useEffect(() => {
    if (!open) return
    refresh()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    input.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [open, refresh])

  // Follow the answer as it streams, unless the reader has scrolled up.
  const last = items[items.length - 1]
  useEffect(() => {
    const el = scroller.current
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 140) el.scrollTop = el.scrollHeight
  }, [last?.content, items.length])

  const api = useMemo(
    () => ({ ask, open: () => setOpen(true), session, refresh, leave, library, libraryError, refreshLibrary, syncLibrary }),
    [ask, session, refresh, leave, library, libraryError, refreshLibrary, syncLibrary],
  )

  return (
    <Ctx.Provider value={api}>
      {children}
      {!open && items.length > 0 && signedIn && (
        <button
          onClick={() => setOpen(true)}
          className="btn btn-primary fixed right-0 bottom-6 z-30 flex h-10 items-center gap-2 bg-accent px-3.5 font-pixel text-[11px] tracking-[0.08em] text-black uppercase"
          aria-label="Open Vex"
        >
          <VexMark dark />
          Vex{busy ? ' is writing' : ''}
        </button>
      )}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Vex">
            <div className="absolute inset-0 animate-fade-in bg-black/55" onClick={() => setOpen(false)} aria-hidden="true" />
            <aside className="vex-panel absolute inset-y-0 right-0 flex w-[560px] max-w-full flex-col border-l border-line-2 bg-ink-1 shadow-[-24px_0_80px_-20px_rgba(0,0,0,0.8)]">
              <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4">
                <VexMark />
                <span className="font-pixel text-[12px] tracking-[0.08em] text-fg uppercase">Vex</span>
                {signedIn && model && <span className="truncate font-mono text-[11.5px] text-fg-3">{model}</span>}
                <span className="ml-auto font-mono text-[11.5px] whitespace-nowrap text-fg-2 tabular-nums" aria-live="polite">
                  {signedIn && credits ? `${credits.left} credits left` : ''}
                </span>
                {signedIn && items.length > 0 && (
                  <button onClick={reset} className="grid size-8 place-items-center rounded-md text-fg-3 hover:bg-ink-3 hover:text-fg" aria-label="Clear this conversation" title="Clear">
                    <Plus size={16} />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-md text-fg-3 hover:bg-ink-3 hover:text-fg" aria-label="Close Vex">
                  <X size={16} />
                </button>
              </header>

              {signedIn ? (
                <>
                  <div ref={scroller} className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
                    {items.length === 0 && (
                      <div className="rounded-lg border border-dashed border-line-2 px-5 py-6">
                        <p className="text-[13.5px] font-medium text-fg">Ask Vex anything</p>
                        <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-fg-3">
                          Or use an “Ask Vex” button on a task, a test result, a topic or a Classroom post. Margin sends the question with the right notes attached, and the answer shows up here.
                        </p>
                      </div>
                    )}
                    {items.map((m, i) =>
                      m.role === 'user' ? (
                        <Sent key={i} item={m} />
                      ) : (
                        <Answer key={i} item={m} live={busy && i === items.length - 1} onRetry={retry} onCopyPrompt={() => copyPrompt(items, notify)} />
                      ),
                    )}
                  </div>
                  <footer className="shrink-0 border-t border-line p-3">
                    <div className="flex items-end gap-2 border border-line-2 bg-ink-2 p-2 transition-colors focus-within:border-accent/50">
                      <label htmlFor="vex-input" className="sr-only">
                        Message Vex
                      </label>
                      <textarea
                        id="vex-input"
                        ref={input}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            followUp()
                          }
                        }}
                        rows={2}
                        placeholder={items.length ? 'Ask a follow-up' : 'Ask Vex'}
                        className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-1.5 py-1 text-[14px] leading-relaxed text-fg placeholder:text-fg-3 focus:outline-none"
                      />
                      {busy ? (
                        <Button variant="secondary" onClick={stop} aria-label="Stop the answer">
                          <Square size={12} /> Stop
                        </Button>
                      ) : (
                        <Button variant="primary" onClick={followUp} disabled={!draft.trim()}>
                          <Send size={13} /> Send
                        </Button>
                      )}
                    </div>
                  </footer>
                </>
              ) : (
                <Locked session={session} onRetry={refresh} />
              )}
            </aside>
          </div>,
          document.body,
        )}
    </Ctx.Provider>
  )
}

/** Shown instead of the chat until someone has signed in. */
function Locked({ session, onRetry }: { session: VexSession; onRetry: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-start justify-center gap-4 px-6 py-8">
      {session.state === 'offline' ? (
        <>
          <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-fg">Vex isn’t running</h2>
          <p className="max-w-sm text-[13.5px] leading-relaxed text-fg-2">
            Open the <span className="font-mono">nova</span> folder and run <span className="font-mono">node server.js</span>. Margin looks for it at <span className="font-mono">{VEX_URL}</span>.
          </p>
          <Button onClick={onRetry}>
            <RotateCcw size={13} /> Check again
          </Button>
        </>
      ) : session.state === 'signedout' && session.unavailable ? (
        <>
          <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-fg">Sign-in isn’t set up yet</h2>
          <p className="max-w-sm text-[13.5px] leading-relaxed text-fg-2">The owner needs to add the Google keys to Vex. The steps are in the Vex README.</p>
        </>
      ) : session.state === 'signedout' ? (
        <>
          <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-fg">Sign in to use Vex</h2>
          <p className="max-w-sm text-[13.5px] leading-relaxed text-fg-2">
            The AI and Classroom unlock once you sign in with Google. Only <span className="font-mono">ked.edu.in</span> school accounts and a short approved list can sign in.
          </p>
          <a href={signInUrl()} className={buttonClass('primary')}>
            <LogIn size={14} /> Sign up / Sign in with Google
          </a>
        </>
      ) : (
        <p className="text-[13.5px] text-fg-3">Checking with Vex…</p>
      )}
    </div>
  )
}

/** A sidebar row that opens the Vex panel, so Vex sits in the same list as Learn, Practice and Tests. */
export function VexNavButton({ className }: { className?: string }) {
  const { open, session } = useVex()
  return (
    <button onClick={open} className={className}>
      <VexMark />
      Vex
      {session.state === 'signedin' && <span className="ml-auto font-mono text-[11px] text-fg-3 tabular-nums">{session.credits.left}</span>}
    </button>
  )
}

/** Sidebar block: the one place to sign in, see credits, and jump to Vex. */
export function VexAccount() {
  const { session, leave, refresh } = useVex()
  return (
    <div className="mb-5 border border-line-2 bg-ink-1 p-3">
      <div className="mb-2 flex items-center gap-2 font-pixel text-[11px] tracking-[0.08em] text-fg uppercase">
        <VexMark />
        Vex
      </div>
      {session.state === 'signedin' ? (
        <>
          <p className="truncate text-[12.5px] text-fg" title={session.email}>
            {session.email || 'Signed in'}
          </p>
          <p className="mt-0.5 font-mono text-[11.5px] text-fg-3 tabular-nums">{session.credits.left} credits left today</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={VEX_URL} target="_blank" rel="noreferrer" className={buttonClass('secondary', 'sm')}>
              <ExternalLink size={12} /> Open Vex
            </a>
            {!session.open && (
              <Button size="sm" variant="ghost" onClick={leave}>
                <LogOut size={12} /> Sign out
              </Button>
            )}
          </div>
        </>
      ) : session.state === 'signedout' ? (
        <>
          <p className="text-[12.5px] leading-relaxed text-fg-2">
            {session.unavailable ? 'Sign-in isn’t set up on Vex yet.' : 'AI and Classroom unlock after you sign in with your ked.edu.in Google account.'}
          </p>
          {!session.unavailable && (
            <a href={signInUrl()} className={buttonClass('primary', 'md', 'mt-3 w-full')}>
              <LogIn size={13} /> Sign up / Sign in
            </a>
          )}
        </>
      ) : session.state === 'offline' ? (
        <>
          <p className="text-[12.5px] leading-relaxed text-fg-2">Vex isn’t running. Start it with <span className="font-mono">node server.js</span>.</p>
          <Button size="sm" className="mt-3" onClick={refresh}>
            <RotateCcw size={12} /> Check again
          </Button>
        </>
      ) : (
        <p className="text-[12.5px] text-fg-3">Checking…</p>
      )}
    </div>
  )
}

async function copyPrompt(items: Item[], notify: ReturnType<typeof useToast>) {
  const prompt = [...items].reverse().find((m) => m.role === 'user')?.content ?? ''
  const ok = await copyText(prompt)
  notify(ok ? 'Prompt copied — paste it into any AI' : 'Couldn’t copy', ok ? 'ok' : 'error')
}

/** The same mark as Margin's own logo, so Vex and Margin read as one product. */
function VexMark(_: { dark?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <rect width="32" height="32" rx="7" fill="#111111" stroke="#2a2a2a" />
      <path d="M10 7v18" stroke="#ffd500" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14 11h9M14 16h9M14 21h6" stroke="#a8a8a8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/** What Margin sent. Long prompts fold away: the student wants the answer, not the plumbing. */
function Sent({ item }: { item: Extract<Item, { role: 'user' }> }) {
  const [show, setShow] = useState(false)
  if (!item.label) {
    return (
      <div>
        <div className="mb-1 font-pixel text-[10.5px] tracking-[0.08em] text-fg-3 uppercase">You</div>
        <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap text-fg">{item.content}</p>
      </div>
    )
  }
  return (
    <div className="border border-line bg-ink-2">
      <button onClick={() => setShow((s) => !s)} className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left" aria-expanded={show}>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-medium text-fg">{item.label}</span>
          <span className="block font-mono text-[11.5px] text-fg-3">Sent from Margin · {item.content.length.toLocaleString()} characters</span>
        </span>
        <ChevronDown size={15} className={cn('shrink-0 text-fg-3 transition-transform', show && 'rotate-180')} />
      </button>
      {show && <pre className="max-h-72 overflow-auto border-t border-line px-3.5 py-3 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-fg-2">{item.content}</pre>}
    </div>
  )
}

function Answer({ item, live, onRetry, onCopyPrompt }: { item: Extract<Item, { role: 'assistant' }>; live: boolean; onRetry: () => void; onCopyPrompt: () => void }) {
  const notify = useToast()
  const html = useMemo(() => renderMarkdown(item.content), [item.content])
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2 font-pixel text-[10.5px] tracking-[0.08em] text-fg-3 uppercase">
        Vex
        {live && <span className="vex-caret" aria-label="writing" />}
      </div>
      {item.content ? (
        // renderMarkdown escapes all input before adding tags
        <div className="vex-md" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        live && <p className="text-[13.5px] text-fg-3">Thinking…</p>
      )}
      {item.error && (
        <div className="mt-3 border border-warn/40 bg-warn/[0.06] px-3.5 py-3">
          <p className="text-[13.5px] leading-relaxed text-fg">{item.error.text}</p>
          {item.error.kind === 'offline' && (
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-fg-2">
              Open the <span className="font-mono">nova</span> folder and run <span className="font-mono">node server.js</span>. Vex is expected at <span className="font-mono">{VEX_URL}</span>.
            </p>
          )}
          {item.error.kind === 'signin' && (
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-fg-2">
              <a href={signInUrl()} className="text-accent underline underline-offset-2">
                Sign in with Google
              </a>{' '}
              and try again.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={onRetry}>
              <RotateCcw size={12} /> Try again
            </Button>
            <Button size="sm" variant="ghost" onClick={onCopyPrompt}>
              <Copy size={12} /> Copy the prompt instead
            </Button>
          </div>
        </div>
      )}
      {!live && item.content && !item.error && (
        <div className="mt-2.5 flex items-center gap-3 text-[11.5px] text-fg-3">
          <button
            onClick={async () => {
              const ok = await copyText(item.content)
              notify(ok ? 'Answer copied' : 'Couldn’t copy', ok ? 'ok' : 'error')
            }}
            className="inline-flex items-center gap-1.5 rounded px-1 py-1 text-fg-2 hover:bg-ink-3 hover:text-fg"
          >
            <Copy size={12} /> Copy answer
          </button>
          {item.charged ? (
            <span className="font-mono tabular-nums">
              {item.charged} credit{item.charged === 1 ? '' : 's'}
            </span>
          ) : null}
        </div>
      )}
    </div>
  )
}

/** Sends a Margin-built prompt to Vex and opens the panel. Same getText contract as CopyButton. */
export function VexButton({
  getText,
  label,
  children,
  variant = 'primary',
  size = 'md',
  className,
  title,
  onSent,
}: {
  getText: () => string | Promise<string>
  /** Short plain name for what is being sent, shown in the panel */
  label: string
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'quiet'
  size?: 'sm' | 'md'
  className?: string
  title?: string
  onSent?: () => void
}) {
  const vex = useVex()
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      title={title ?? (vex.session.state === 'signedin' ? 'Send this to Vex and read the answer here' : 'Sign in to use Vex')}
      onClick={() => {
        vex.ask(getText, label)
        onSent?.()
      }}
    >
      <VexMark dark={variant === 'primary'} />
      {children}
    </Button>
  )
}
