import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import { BookOpen, Check, ChevronDown, ClipboardList, Megaphone, FileCheck2, GraduationCap, Layers, LayoutGrid, Menu, NotebookPen, RotateCcw, School, Search, Settings, Sparkles, X } from 'lucide-react'
import { orderedSteps, resourcesInStep, subject } from '@/lib/data'
import { subjects, switchSubject } from '@/data/catalog'
import { useStore } from '@/lib/storage'
import { cn, isTyping } from '@/lib/utils'
import { Kbd } from '@/components/ui'
import { CommandPalette } from '@/components/CommandPalette'
import { AskDialog } from '@/components/AskDialog'
import { ShortcutsDialog } from '@/components/ShortcutsDialog'
import { ReviseDialog } from '@/components/ReviseDialog'
import { useVex, VexAccount, VexNavButton, VexProvider } from '@/components/Vex'
import { UIContext } from './ui-context'
import { PixelField } from '@/components/Pixels'

const sectionNav = [
  { to: '/', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/learn', label: 'Learn', icon: BookOpen },
  { to: '/practice', label: 'Practice', icon: NotebookPen },
  { to: '/flashcards', label: 'Flashcards', icon: Layers },
  { to: '/tests', label: 'Tests', icon: FileCheck2 },
  { to: '/classroom', label: 'Classroom', icon: School },
  { to: '/review', label: 'Review', icon: RotateCcw },
  { to: '/logbook', label: 'Logbook', icon: ClipboardList },
  { to: '/announcements', label: 'Announcements', icon: Megaphone },
]

const GO: Record<string, string> = { h: '/', l: '/learn', p: '/practice', f: '/flashcards', r: '/review', t: '/tests', c: '/classroom', s: '/settings' }

export function AppShell() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [askFor, setAskFor] = useState<string | null | undefined>(undefined)
  const [helpOpen, setHelpOpen] = useState(false)
  const [reviseOpen, setReviseOpen] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => setDrawer(false), [location.pathname])

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1))
      if (el) {
        el.scrollIntoView({ block: 'start' })
        return
      }
    }
    window.scrollTo(0, 0)
  }, [location.pathname, location.hash])

  // Global shortcuts. Sequences (G then X) time out after a second; never fire while typing.
  useEffect(() => {
    let pendingG = 0
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
        return
      }
      if (isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return
      if (document.querySelector('[role="dialog"]')) return
      const k = e.key.toLowerCase()
      if (pendingG && Date.now() - pendingG < 1000 && GO[k]) {
        e.preventDefault()
        pendingG = 0
        navigate(GO[k])
        return
      }
      pendingG = k === 'g' ? Date.now() : 0
      if (e.key === '/') {
        e.preventDefault()
        setPaletteOpen(true)
      } else if (e.key === '?') {
        e.preventDefault()
        setHelpOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  const controls = useMemo(
    () => ({
      openSearch: () => setPaletteOpen(true),
      openAsk: (resourceId?: string) => setAskFor(resourceId ?? null),
      openShortcuts: () => setHelpOpen(true),
      openRevise: () => setReviseOpen(true),
    }),
    [],
  )

  const closePalette = useCallback(() => setPaletteOpen(false), [])
  const closeAsk = useCallback(() => setAskFor(undefined), [])
  const closeHelp = useCallback(() => setHelpOpen(false), [])
  const closeRevise = useCallback(() => setReviseOpen(false), [])

  return (
    <UIContext.Provider value={controls}>
     <VexProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-md focus:bg-fg focus:px-3 focus:py-2 focus:text-ink-0">
        Skip to content
      </a>
      <PixelField />
      <Topbar onMenu={() => setDrawer(true)} onSearch={() => setPaletteOpen(true)} onAsk={() => setAskFor(null)} onRevise={() => setReviseOpen(true)} />
      <div className="mx-auto flex w-full max-w-[1440px]">
        <aside className="sticky top-[104px] hidden h-[calc(100dvh-104px)] w-[268px] shrink-0 lg:block">
          <SidebarNav />
        </aside>

        {drawer && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
            <div className="absolute inset-0 animate-fade-in bg-black/60" onClick={() => setDrawer(false)} />
            <div className="absolute inset-y-0 left-0 flex w-[292px] max-w-[86vw] animate-[rise_200ms_var(--ease-out)] flex-col border-r border-line bg-ink-0">
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
                <Brand />
                <button onClick={() => setDrawer(false)} className="grid size-8 place-items-center rounded-md text-fg-3 hover:bg-ink-3 hover:text-fg" aria-label="Close navigation">
                  <X size={16} />
                </button>
              </div>
              <SidebarNav />
            </div>
          </div>
        )}

        <main id="main" className="relative min-w-0 flex-1 lg:border-l lg:border-line" tabIndex={-1}>
          <div key={location.pathname}>
            <div className="route-bar" aria-hidden="true" />
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={closePalette} />
      <AskDialog open={askFor !== undefined} resourceId={askFor ?? undefined} onClose={closeAsk} />
      <ShortcutsDialog open={helpOpen} onClose={closeHelp} />
      <ReviseDialog open={reviseOpen} onClose={closeRevise} />
     </VexProvider>
    </UIContext.Provider>
  )
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-md">
      <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="7" fill="#111111" stroke="#2a2a2a" />
        {/* ruled page with a margin line */}
        <path d="M10 7v18" stroke="#ffd500" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M14 11h9M14 16h9M14 21h6" stroke="#a8a8a8" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="text-[15px] font-bold tracking-[-0.03em] whitespace-nowrap text-fg">Margin</span>
    </Link>
  )
}

function Topbar({ onMenu, onSearch, onAsk, onRevise }: { onMenu: () => void; onSearch: () => void; onAsk: () => void; onRevise: () => void }) {
  const name = useStore((s) => s.profile.name)
  const initials = name.trim() ? name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() : null
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink-0/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4 lg:px-6">
        <button onClick={onMenu} className="grid size-8 place-items-center rounded-md text-fg-2 hover:bg-ink-3 hover:text-fg lg:hidden" aria-label="Open navigation">
          <Menu size={17} />
        </button>
        <div className="flex shrink-0 items-center gap-4 lg:w-[244px]">
          <Brand />
          <SubjectMenu />
        </div>

        <button
          onClick={onSearch}
          className="group ml-auto flex h-9 max-w-[380px] min-w-0 flex-1 items-center gap-2.5 border border-line-2 bg-ink-1/80 px-3 text-left text-[13px] text-fg-3 transition-colors hover:border-[#3a3a3a] hover:text-fg-2 md:ml-4"
          aria-label="Search resources, tasks and topics"
        >
          <Search size={14} />
          <span className="flex-1 truncate">Search…</span>
          <span className="hidden items-center gap-1 sm:flex">
            <Kbd>{mac ? '⌘' : 'Ctrl'}</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
        <button
          onClick={onAsk}
          className="btn btn-secondary hidden h-9 items-center gap-2 border border-line-2 px-3 font-pixel text-[11px] tracking-[0.08em] text-fg uppercase transition-colors hover:border-fg-3 hover:bg-ink-2 sm:flex"
          title="Ask AI about the page you’re on"
        >
          <Sparkles size={13} />
          Ask AI
        </button>
        <button
          onClick={onRevise}
          className="btn btn-primary hidden h-11 items-center gap-2 bg-accent px-4 font-pixel text-[11px] tracking-[0.08em] text-black uppercase md:flex"
          title="Copy one prompt with your whole syllabus for any AI"
        >
          <GraduationCap size={14} />
          Revise with AI
        </button>

        <div className="flex items-center gap-1 md:ml-auto">
          <button onClick={onRevise} className="grid size-8 place-items-center rounded-md text-fg-2 hover:bg-ink-3 md:hidden" aria-label="Revise with AI">
            <GraduationCap size={15} />
          </button>
          <button onClick={onAsk} className="grid size-8 place-items-center rounded-md text-fg-2 hover:bg-ink-3 sm:hidden" aria-label="Ask AI">
            <Sparkles size={15} className="text-accent" />
          </button>
          <Link
            to="/settings"
            className="grid size-8 place-items-center border border-line-2 bg-ink-2 font-mono text-[10.5px] font-semibold text-fg-2 transition-colors hover:border-[#3a3a3a] hover:text-fg"
            aria-label={name ? `${name} — settings` : 'Settings'}
            title={name || 'Settings'}
          >
            {initials ?? <Settings size={14} />}
          </Link>
        </div>
      </div>

    </header>
  )
}

/** Which subject the app shows: a dropdown instead of a row of tabs. Margin's own subjects, Classroom, and any downloaded Classroom subject. */
function SubjectMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const { library } = useVex()
  const downloaded = (library?.index?.subjects ?? []).filter((c) => !subjects.some((x) => x.name.toLowerCase() === c.name.toLowerCase()))
  const inClassroom = location.pathname.startsWith('/classroom')
  const inLib = location.pathname.startsWith('/subjects/')
  const current = inClassroom ? 'Classroom' : inLib ? (downloaded.find((c) => location.pathname === `/subjects/${c.id}`)?.name ?? 'Subject') : subject.name
  useEffect(() => {
    if (!open) return
    const down = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', down)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('mousedown', down)
      document.removeEventListener('keydown', key)
    }
  }, [open])
  useEffect(() => setOpen(false), [location.pathname])
  const row = 'flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-[13.5px] transition-colors hover:bg-ink-3'
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-9 max-w-[200px] items-center gap-2 border border-line-2 bg-ink-1/80 px-3 text-left transition-colors hover:border-fg-3 focus-visible:border-accent focus-visible:outline-none"
      >
        <span className="size-1.5 shrink-0 bg-accent" aria-hidden="true" />
        <span className="min-w-0 truncate font-pixel text-[11px] tracking-[0.08em] text-fg uppercase">{current}</span>
        <ChevronDown size={13} className={cn('shrink-0 text-fg-3 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <ul role="listbox" aria-label="Choose a subject" className="absolute top-full left-0 z-40 mt-1 max-h-[70vh] min-w-[230px] overflow-y-auto border border-line-2 bg-ink-1 py-1 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.85)]">
          {subjects.map((s) => {
            const on = !inClassroom && !inLib && s.id === subject.id
            return (
              <li key={s.id} role="option" aria-selected={on}>
                {s.id === subject.id ? (
                  <Link to="/" className={cn(row, on ? 'text-fg' : 'text-fg-2')}>
                    <span className="min-w-0 flex-1 truncate">{s.name}</span>
                    {on && <Check size={14} className="shrink-0 text-accent" />}
                  </Link>
                ) : (
                  <button onClick={() => switchSubject(s.id)} className={cn(row, 'text-fg-2')}>
                    <span className="min-w-0 flex-1 truncate">{s.name}</span>
                  </button>
                )}
              </li>
            )
          })}
          <li role="option" aria-selected={inClassroom} className="border-t border-line">
            <Link to="/classroom" className={cn(row, inClassroom ? 'text-fg' : 'text-fg-2')}>
              <span className="min-w-0 flex-1 truncate">Classroom</span>
              <span className="shrink-0 font-mono text-[10.5px] text-fg-3">all classes</span>
              {inClassroom && <Check size={14} className="shrink-0 text-accent" />}
            </Link>
          </li>
          {downloaded.length > 0 && (
            <>
              <li className="border-t border-line px-3.5 pt-2.5 pb-1 font-mono text-[10.5px] tracking-[0.08em] text-fg-3 uppercase" aria-hidden="true">From Google Classroom</li>
              {downloaded.map((c) => (
                <li key={c.id} role="option" aria-selected={location.pathname === `/subjects/${c.id}`}>
                  <Link to={`/subjects/${c.id}`} className={cn(row, 'text-fg-2')}>
                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  </Link>
                </li>
              ))}
            </>
          )}
        </ul>
      )}
    </div>
  )
}

/** Every Google Classroom course Vex has downloaded, as a short list in the sidebar. */
function ClassroomSubjects() {
  const { library } = useVex()
  const list = library?.index?.subjects ?? []
  if (list.length === 0) return null
  return (
    <div className="mt-7">
      <div className="mb-1.5 border-b border-line px-2.5 pb-2 font-pixel text-[11px] tracking-[0.08em] text-fg uppercase">Classroom subjects</div>
      <ul className="space-y-0.5">
        {list.map((s) => (
          <li key={s.id}>
            <NavLink
              to={`/subjects/${s.id}`}
              className={({ isActive }) => cn('flex h-[30px] items-center gap-2.5 px-2.5 text-[13.5px] transition-colors duration-200', isActive ? 'bg-accent font-medium text-black' : 'sweep text-fg-2 hover:text-fg')}
            >
              <span className="truncate">{s.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SidebarNav() {
  const location = useLocation()
  const sectionClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'group flex h-[30px] items-center gap-2.5 px-2.5 text-[13.5px] transition-colors duration-200',
      isActive ? 'bg-accent font-medium text-black' : 'sweep text-fg-2 hover:text-fg',
    )
  return (
    <nav className="flex h-full flex-col overflow-y-auto px-4 pt-6 pb-4" aria-label={subject.name}>
      <VexAccount />
      <div className="mb-2 border-b border-line px-2.5 pb-2.5 font-pixel text-[11px] tracking-[0.08em] text-fg uppercase">{subject.name}</div>
      <ul className="space-y-0.5">
        {sectionNav.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink to={to} end={end} className={sectionClass}>
              {({ isActive }) => (
                <>
                  <Icon size={15} className={isActive ? 'text-black' : 'text-fg-3 group-hover:text-fg-2'} />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
        <li>
          <VexNavButton className="group flex h-[30px] w-full items-center gap-2.5 px-2.5 text-left text-[13.5px] text-fg-2 transition-colors duration-200 hover:text-fg" />
        </li>
      </ul>

      <ClassroomSubjects />

      {orderedSteps.map((step) => (
        <div key={step.id} className="mt-7">
          <Link to={`/learn#${step.id}`} className="mb-1.5 block border-b border-line px-2.5 pb-2 font-pixel text-[11px] tracking-[0.08em] text-fg uppercase hover:text-accent">
            {step.label}
            {step.note && <span className="text-fg-3"> · {step.note}</span>}
          </Link>
          <ul className="space-y-px">
            {resourcesInStep(step.id).map((r) => {
              const active = location.pathname === `/learn/${r.id}`
              return (
                <li key={r.id}>
                  <Link
                    to={`/learn/${r.id}`}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'block px-2.5 py-[6px] text-[13px] leading-snug transition-colors duration-200',
                      active ? 'bg-accent font-medium text-black' : 'sweep text-fg-3 hover:text-fg',
                    )}
                  >
                    {r.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}

      <div className="mt-8 border-t border-line pt-4">
        <NavLink to="/settings" className={sectionClass}>
          {({ isActive }) => (
            <>
              <Settings size={15} className={isActive ? 'text-black' : 'text-fg-3'} />
              Settings
            </>
          )}
        </NavLink>
      </div>
    </nav>
  )
}
