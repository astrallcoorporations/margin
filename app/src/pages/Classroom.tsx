import { useCallback, useEffect, useMemo, useState } from 'react'
import { ExternalLink, LogIn, RefreshCw } from 'lucide-react'
import { attachedText, connectClassroomUrl, fetchClassroom, signInUrl, VexError, type Attached, type ClassroomData, type ClassroomItem, type StreamPost } from '@/lib/vex'
import { timeAgo } from '@/lib/utils'
import { Page, PageHeader } from '@/components/blocks'
import { useVex, VexButton } from '@/components/Vex'
import { Button, buttonClass, Code, Empty } from '@/components/ui'

const KIND: Record<StreamPost['kind'], string> = { announcement: 'Announcement', assignment: 'New assignment', material: 'Material' }

const withFiles = async (base: string, files?: Attached[]) => {
  if (!files?.length) return base
  const extra = await attachedText(files)
  return extra ? `${base}\n\n${extra}` : base
}
const workPrompt = (w: ClassroomItem) =>
  withFiles(`I’m a Class 8 student. Help me with this assignment from Google Classroom. Explain it step by step so I understand it.\n\n${w.text}`, w.files)
const postPrompt = (p: StreamPost) =>
  withFiles(`I’m a Class 8 student. Here is a post from my teacher on Google Classroom. Tell me what it means and what I need to do.\n\nCourse: ${p.course}\n${KIND[p.kind]}: ${p.title}\n\n${p.full || p.text}`, p.files)

/** Due work and the class stream, read from Google Classroom through Vex. Read-only. */
export default function Classroom() {
  const { session } = useVex()
  const [data, setData] = useState<ClassroomData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (fresh = false) => {
    setLoading(true)
    setError('')
    try {
      setData(await fetchClassroom(fresh))
    } catch (e) {
      setError(e instanceof VexError ? e.message : 'Couldn’t load Classroom.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session.state === 'signedin') load()
  }, [session.state, load])

  let body
  if (session.state === 'loading') body = <p className="text-[13.5px] text-fg-3">Checking with Vex…</p>
  else if (session.state === 'offline')
    body = (
      <Empty title="Vex isn’t running">
        Open the <span className="font-mono">nova</span> folder and run <span className="font-mono">node server.js</span>, then reload this page.
      </Empty>
    )
  else if (session.state === 'signedout')
    body = (
      <Empty
        title="Sign in to see Classroom"
        action={
          session.unavailable ? undefined : (
            <a href={signInUrl()} className={buttonClass('primary')}>
              <LogIn size={14} /> Sign up / Sign in with Google
            </a>
          )
        }
      >
        {session.unavailable ? 'Sign-in isn’t set up on Vex yet. The owner needs to add the Google keys.' : 'Only ked.edu.in school accounts and a short approved list can sign in.'}
      </Empty>
    )
  else if (error)
    body = (
      <Empty title="Couldn’t reach Classroom" action={<Button onClick={() => load(true)}>Try again</Button>}>
        {error}
      </Empty>
    )
  else if (!data) body = <p className="text-[13.5px] text-fg-3">Loading your classes…</p>
  else if (!data.configured)
    body = <Empty title="Classroom isn’t set up on Vex yet">The owner needs to add the Google keys to Vex. The steps are in the Vex README.</Empty>
  else if (!data.connected || data.needsReconnect)
    body = (
      <Empty
        title={data.needsReconnect ? 'Classroom needs one more permission' : 'Connect Google Classroom'}
        action={
          <a href={connectClassroomUrl()} className={buttonClass('primary')}>
            {data.needsReconnect ? 'Connect again' : 'Connect Classroom'}
          </a>
        }
      >
        Vex reads your assignments, due dates and class posts. It cannot hand anything in.
      </Empty>
    )
  else body = <Board data={data} loading={loading} onRefresh={() => load(true)} />

  return (
    <Page wide>
      <PageHeader
        eyebrow="Classroom"
        title="What’s due"
        lede="Pulled from your Google Classroom through Vex. Read-only: Margin can’t hand anything in for you."
      />
      {body}
    </Page>
  )
}

type Tab = 'due' | StreamPost['kind']
const TABS: { id: Tab; label: string }[] = [
  { id: 'due', label: 'Due soon' },
  { id: 'announcement', label: 'Announcements' },
  { id: 'assignment', label: 'New assignments' },
  { id: 'material', label: 'Materials' }
]
const PAGE = 6

const chip = (on: boolean) =>
  `shrink-0 border px-3 py-1.5 font-mono text-[11px] tracking-[0.08em] uppercase whitespace-nowrap transition-colors ${on ? 'border-accent bg-ink-2 text-fg' : 'border-line-2 text-fg-3 hover:text-fg'}`

/** The class stream split by class and by kind, so nothing scrolls on forever. */
function Board({ data, loading, onRefresh }: { data: ClassroomData; loading: boolean; onRefresh: () => void }) {
  const [course, setCourse] = useState('all')
  const [tab, setTab] = useState<Tab | null>(null)
  const [shown, setShown] = useState(PAGE)

  const courses = useMemo(() => {
    const m = new Map<string, number>()
    data.items.forEach((w) => m.set(w.course, (m.get(w.course) || 0) + 1))
    data.stream.forEach((p) => m.set(p.course, (m.get(p.course) || 0) + 1))
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [data])

  const inCourse = (name: string) => course === 'all' || name === course
  const due = data.items.filter((w) => inCourse(w.course))
  const posts = data.stream.filter((p) => inCourse(p.course))
  const count = (t: Tab) => (t === 'due' ? due.length : posts.filter((p) => p.kind === t).length)
  const active: Tab = tab && count(tab) > 0 ? tab : (TABS.find((t) => count(t.id) > 0)?.id ?? 'due')
  const list = active === 'due' ? [] : posts.filter((p) => p.kind === active)

  const pick = (c: string) => {
    setCourse(c)
    setShown(PAGE)
  }
  const pickTab = (t: Tab) => {
    setTab(t)
    setShown(PAGE)
  }

  return (
    <>
      <div className="flex items-start gap-3">
        <div className="-mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 pb-2" role="tablist" aria-label="Class">
          <button role="tab" aria-selected={course === 'all'} onClick={() => pick('all')} className={chip(course === 'all')}>
            All classes
          </button>
          {courses.map(([name, n]) => (
            <button key={name} role="tab" aria-selected={course === name} onClick={() => pick(name)} className={chip(course === name)}>
              {name} <span className="text-fg-3">{n}</span>
            </button>
          ))}
        </div>
        <Button size="sm" variant="ghost" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> {loading ? 'Refreshing' : 'Refresh'}
        </Button>
      </div>

      <div className="mt-4 flex gap-6 overflow-x-auto border-b border-line" role="tablist" aria-label="Section">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={active === t.id}
            onClick={() => pickTab(t.id)}
            className={`-mb-px shrink-0 border-b-2 pb-3 font-mono text-[11.5px] tracking-[0.08em] uppercase whitespace-nowrap transition-colors ${active === t.id ? 'border-accent text-fg' : 'border-transparent text-fg-3 hover:text-fg'}`}
          >
            {t.label} <span className="text-fg-3">{count(t.id)}</span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {active === 'due' ? (
          due.length === 0 ? (
            <Empty title="Nothing due">No assignments with a due date in the next 30 days.{data.hidden ? ` ${data.hidden} already handed in.` : ''}</Empty>
          ) : (
            <>
              <ul className="grid gap-3 sm:grid-cols-2">
                {due.slice(0, shown).map((w) => (
                  <li key={w.id} className="flex flex-col border border-line-2 bg-ink-1 p-4">
                    <div className="flex items-center gap-2 text-[12px] text-fg-3">
                      <Code>{w.code}</Code>
                      <span className="truncate">{w.course}</span>
                      <span className={`ml-auto font-mono whitespace-nowrap tabular-nums ${w.hot ? 'text-warn' : 'text-fg-2'}`}>
                        {w.n} {w.unit}
                      </span>
                    </div>
                    <h3 className="mt-3 text-[16px] leading-snug font-semibold text-fg">{w.title}</h3>
                    <p className="mt-1 text-[13px] text-fg-3">{w.detail}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <VexButton label={`Help with: ${w.title}`} getText={() => workPrompt(w)}>
                        Ask Vex
                      </VexButton>
                      {w.link && (
                        <a href={w.link} target="_blank" rel="noreferrer" className={buttonClass('ghost')}>
                          <ExternalLink size={13} /> Open in Classroom
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <More total={due.length} shown={shown} onMore={() => setShown(shown + PAGE)} />
              {data.hidden > 0 && (
                <p className="mt-3 text-[12px] text-fg-3">
                  {data.hidden} already handed in {data.hidden === 1 ? 'is' : 'are'} hidden.
                </p>
              )}
            </>
          )
        ) : list.length === 0 ? (
          <Empty title="Nothing new">No recent posts of this kind.</Empty>
        ) : (
          <>
            <ul className="space-y-3">
              {list.slice(0, shown).map((p) => (
                <li key={p.id} className="border border-line bg-ink-1 p-4">
                  <div className="flex items-baseline gap-2 text-[12px] text-fg-3">
                    <span className="font-medium text-fg-2">{p.course}</span>
                    <span className="ml-auto whitespace-nowrap">{timeAgo(p.at)}</span>
                  </div>
                  <h3 className="mt-2 text-[15px] leading-snug font-semibold text-fg">{p.title}</h3>
                  {p.text && p.text !== p.title && <p className="mt-1 line-clamp-3 text-[13.5px] leading-relaxed text-fg-2">{p.text}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <VexButton size="sm" variant="secondary" label={`Explain: ${p.title}`} getText={() => postPrompt(p)}>
                      Ask Vex
                    </VexButton>
                    {p.link && (
                      <a href={p.link} target="_blank" rel="noreferrer" className={buttonClass('ghost', 'sm')}>
                        <ExternalLink size={12} /> Open in Classroom
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <More total={list.length} shown={shown} onMore={() => setShown(shown + PAGE)} />
          </>
        )}
        {data.partial && <p className="mt-3 text-[12px] text-fg-3">Some classes keep their posts private from apps.</p>}
      </div>
    </>
  )
}

function More({ total, shown, onMore }: { total: number; shown: number; onMore: () => void }) {
  if (total <= shown) return null
  return (
    <div className="mt-4">
      <Button variant="secondary" onClick={onMore}>
        Show {Math.min(PAGE, total - shown)} more <span className="text-fg-3">({total - shown} left)</span>
      </Button>
    </div>
  )
}
