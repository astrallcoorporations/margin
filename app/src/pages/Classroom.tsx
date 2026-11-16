import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, ChevronDown, ExternalLink, FileText, LogIn, RefreshCw } from 'lucide-react'
import { attachedText, connectClassroomUrl, fetchClassroom, signInUrl, VexError, type Attached, type ClassroomData, type ClassroomItem, type CourseInfo, type StreamPost } from '@/lib/vex'
import { cn, timeAgo } from '@/lib/utils'
import { Page, PageHeader } from '@/components/blocks'
import { useVex, VexButton } from '@/components/Vex'
import { Button, buttonClass, Code, Empty } from '@/components/ui'

const KIND: Record<StreamPost['kind'], string> = { announcement: 'Announcement', assignment: 'Assignment', material: 'Material' }
const PAGE = 6

const withFiles = async (base: string, files?: Attached[]) => {
  if (!files?.length) return base
  const extra = await attachedText(files)
  return extra ? `${base}\n\n${extra}` : base
}
const workPrompt = (w: ClassroomItem) =>
  withFiles(`I’m a Class 8 student. Help me with this assignment from Google Classroom. Explain it step by step so I understand it.\n\n${w.text}`, w.files)
const postPrompt = (p: StreamPost) =>
  withFiles(`I’m a Class 8 student. Here is a post from my teacher on Google Classroom. Tell me what it means and what I need to do.\n\nCourse: ${p.course}\n${KIND[p.kind]}: ${p.title}\n\n${p.full || p.text}`, p.files)

/** Classroom, read through Vex. All classes at /classroom, one class at /classroom/:courseId. Read-only. */
export default function Classroom() {
  const { session } = useVex()
  const { courseId } = useParams()
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
  else if (!data.configured) body = <Empty title="Classroom isn’t set up on Vex yet">The owner needs to add the Google keys to Vex. The steps are in the Vex README.</Empty>
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
  else {
    const course = courseId ? data.courses.find((c) => c.id === courseId) : undefined
    body =
      courseId && !course ? (
        <Empty title="That class isn’t in your Classroom" action={<Link to="/classroom" className={buttonClass('primary')}>All classes</Link>}>
          It may have been archived.
        </Empty>
      ) : course ? (
        <ClassPage data={data} course={course} loading={loading} onRefresh={() => load(true)} />
      ) : (
        <AllClasses data={data} loading={loading} onRefresh={() => load(true)} />
      )
  }

  const heading = courseId && data ? (data.courses.find((c) => c.id === courseId)?.name ?? 'Classroom') : 'Classroom'
  return (
    <Page wide>
      {!(courseId && data) && <PageHeader eyebrow="Classroom" title={heading === 'Classroom' ? 'Your classes' : heading} lede="Pulled from your Google Classroom through Vex. Read-only: Margin can’t hand anything in for you." />}
      {body}
    </Page>
  )
}

/* ---------------- the class dropdown ---------------- */
function ClassPicker({ courses, value }: { courses: CourseInfo[]; value?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const nav = useNavigate()
  const current = courses.find((c) => c.id === value)
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
  const go = (to: string) => {
    setOpen(false)
    nav(to)
  }
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-10 min-w-[220px] items-center gap-3 border border-line-2 bg-ink-1 px-3.5 text-left text-[14px] text-fg transition-colors hover:border-fg-3 focus-visible:border-accent focus-visible:outline-none"
      >
        <span className="font-mono text-[10.5px] tracking-[0.08em] text-fg-3 uppercase">Class</span>
        <span className="min-w-0 flex-1 truncate font-medium">{current ? current.name : 'All classes'}</span>
        <ChevronDown size={15} className={cn('shrink-0 text-fg-3 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <ul role="listbox" className="absolute top-full left-0 z-20 mt-1 max-h-80 min-w-full overflow-y-auto border border-line-2 bg-ink-1 py-1 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.8)]">
          {[{ id: '', name: 'All classes', section: '' } as CourseInfo, ...courses].map((c) => {
            const on = (c.id || undefined) === value
            return (
              <li key={c.id || 'all'} role="option" aria-selected={on}>
                <button onClick={() => go(c.id ? `/classroom/${c.id}` : '/classroom')} className={cn('flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-[13.5px] transition-colors hover:bg-ink-3', on ? 'text-fg' : 'text-fg-2')}>
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  {c.section && <span className="shrink-0 text-[11.5px] text-fg-3">{c.section}</span>}
                  {on && <Check size={14} className="shrink-0 text-accent" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Bar({ data, value, loading, onRefresh }: { data: ClassroomData; value?: string; loading: boolean; onRefresh: () => void }) {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-3">
      <ClassPicker courses={data.courses} value={value} />
      <Button size="sm" variant="ghost" onClick={onRefresh} disabled={loading} className="ml-auto">
        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> {loading ? 'Refreshing' : 'Refresh'}
      </Button>
    </div>
  )
}

/* ---------------- all classes: a card per class, then what is due ---------------- */
function AllClasses({ data, loading, onRefresh }: { data: ClassroomData; loading: boolean; onRefresh: () => void }) {
  const [shown, setShown] = useState(PAGE)
  const stats = useMemo(
    () =>
      data.courses.map((c) => {
        const due = data.items.filter((w) => w.courseId === c.id)
        const posts = data.stream.filter((p) => p.courseId === c.id)
        return { c, due, posts, next: due[0] }
      }),
    [data],
  )
  return (
    <>
      <Bar data={data} loading={loading} onRefresh={onRefresh} />
      {data.courses.length === 0 ? (
        <Empty title="No classes yet">Classroom didn’t return any active classes.</Empty>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map(({ c, due, posts, next }) => (
            <li key={c.id}>
              <Link to={`/classroom/${c.id}`} className="group flex h-full flex-col border border-line-2 bg-ink-1 p-5 transition-colors hover:border-fg-3">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[17px] font-semibold tracking-[-0.01em] text-fg">{c.name}</h3>
                    {c.section && <p className="mt-0.5 text-[12.5px] text-fg-3">{c.section}</p>}
                  </div>
                  <span className={cn('shrink-0 border px-2 py-0.5 font-mono text-[11px] tabular-nums', due.length ? 'border-accent/60 text-accent' : 'border-line-2 text-fg-3')}>{due.length} due</span>
                </div>
                <p className="mt-5 text-[13px] text-fg-2">
                  {next ? (
                    <>
                      <span className="text-fg-3">Next: </span>
                      {next.title}
                      <span className={cn('ml-2 font-mono text-[11.5px]', next.hot ? 'text-warn' : 'text-fg-3')}>
                        {next.n} {next.unit}
                      </span>
                    </>
                  ) : (
                    <span className="text-fg-3">Nothing due</span>
                  )}
                </p>
                <p className="mt-auto pt-5 font-mono text-[11px] tracking-[0.06em] text-fg-3 uppercase">
                  {posts.length} post{posts.length === 1 ? '' : 's'} <span className="ml-2 text-fg-2 transition-transform group-hover:translate-x-0.5">Open →</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-12 mb-4 font-pixel text-[12px] tracking-[0.08em] text-fg uppercase">Due soon, all classes</h2>
      {data.items.length === 0 ? (
        <Empty title="Nothing due">No assignments with a due date in the next 30 days.{data.hidden ? ` ${data.hidden} already handed in.` : ''}</Empty>
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2">
            {data.items.slice(0, shown).map((w) => (
              <DueCard key={w.id} w={w} />
            ))}
          </ul>
          <More total={data.items.length} shown={shown} onMore={() => setShown(shown + PAGE)} />
          {data.hidden > 0 && <p className="mt-3 text-[12px] text-fg-3">{data.hidden} already handed in {data.hidden === 1 ? 'is' : 'are'} hidden.</p>}
        </>
      )}
      {data.partial && <p className="mt-4 text-[12px] text-fg-3">Some classes keep their posts private from apps.</p>}
    </>
  )
}

function DueCard({ w }: { w: ClassroomItem }) {
  return (
    <li className="flex flex-col border border-line-2 bg-ink-1 p-4">
      <div className="flex items-center gap-2 text-[12px] text-fg-3">
        <Code>{w.code}</Code>
        <span className="truncate">{w.course}</span>
        <span className={`ml-auto font-mono whitespace-nowrap tabular-nums ${w.hot ? 'text-warn' : 'text-fg-2'}`}>
          {w.n} {w.unit}
        </span>
      </div>
      <h3 className="mt-3 text-[16px] leading-snug font-semibold text-fg">{w.title}</h3>
      <p className="mt-1 text-[13px] text-fg-3">{w.detail}</p>
      {w.files && w.files.length > 0 && <Files files={w.files} />}
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
  )
}

function Files({ files }: { files: Attached[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5">
      {files.map((f) => (
        <li key={f.id} className="inline-flex max-w-full items-center gap-1.5 border border-line-2 bg-ink-2 px-2 py-1 text-[12px] text-fg-2">
          <FileText size={12} className="shrink-0 text-fg-3" />
          <span className="truncate">{f.title}</span>
        </li>
      ))}
    </ul>
  )
}

/* ---------------- one class: its own layout, sections down the side ---------------- */
type Section = { id: string; label: string; kind?: StreamPost['kind']; topic?: string }

function ClassPage({ data, course, loading, onRefresh }: { data: ClassroomData; course: CourseInfo; loading: boolean; onRefresh: () => void }) {
  const [sec, setSec] = useState('all')
  const [shown, setShown] = useState(PAGE)
  const due = useMemo(() => new Map(data.items.filter((w) => w.courseId === course.id).map((w) => ['w' + w.id, w])), [data, course.id])
  const posts = useMemo(() => data.stream.filter((p) => p.courseId === course.id), [data, course.id])

  const sections = useMemo<Section[]>(() => {
    const topics = new Map<string, number>()
    posts.forEach((p) => p.topic && topics.set(p.topic, (topics.get(p.topic) || 0) + 1))
    const list: Section[] = [{ id: 'all', label: 'Everything' }]
    if (due.size) list.push({ id: 'due', label: 'Due soon' })
    if (posts.some((p) => p.kind === 'announcement')) list.push({ id: 'k:announcement', label: 'Announcements', kind: 'announcement' })
    ;[...topics.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).forEach((t) => list.push({ id: 't:' + t, label: t, topic: t }))
    if (posts.some((p) => p.kind === 'material' && !p.topic)) list.push({ id: 'k:material', label: 'Other materials', kind: 'material' })
    return list
  }, [posts, due])

  const active = sections.find((s) => s.id === sec) ?? sections[0]
  const count = (s: Section) => (s.id === 'all' ? posts.length : s.id === 'due' ? due.size : s.topic ? posts.filter((p) => p.topic === s.topic).length : posts.filter((p) => p.kind === s.kind && (s.kind !== 'material' || !p.topic)).length)
  const list = posts.filter((p) => (active.id === 'all' ? true : active.id === 'due' ? due.has(p.id) : active.topic ? p.topic === active.topic : p.kind === active.kind && (active.kind !== 'material' || !p.topic)))
  const pick = (id: string) => {
    setSec(id)
    setShown(PAGE)
  }

  return (
    <>
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <Link to="/classroom" className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.08em] text-fg-3 uppercase hover:text-fg">
          <ArrowLeft size={13} /> All classes
        </Link>
        <Button size="sm" variant="ghost" onClick={onRefresh} disabled={loading} className="ml-auto">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> {loading ? 'Refreshing' : 'Refresh'}
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-4 border-b border-line pb-6">
        <div className="min-w-0 flex-1">
          {course.section && <p className="font-mono text-[11px] tracking-[0.08em] text-fg-3 uppercase">{course.section}</p>}
          <h1 className="font-pixel text-[28px] leading-tight tracking-[-0.01em] text-fg sm:text-[34px]">{course.name}</h1>
        </div>
        <dl className="flex gap-6">
          <Stat n={due.size} label="Due" hot={Array.from(due.values()).some((w) => w.hot)} />
          <Stat n={posts.length} label="Posts" />
          <Stat n={posts.filter((p) => p.files?.length).length} label="With files" />
        </dl>
        <div className="flex items-center gap-2">
          <ClassPicker courses={data.courses} value={course.id} />
          {course.link && (
            <a href={course.link} target="_blank" rel="noreferrer" className={buttonClass('ghost')}>
              <ExternalLink size={13} /> Classroom
            </a>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Sections" className="lg:sticky lg:top-32 lg:self-start">
          <ul className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2 lg:block lg:space-y-0.5 lg:overflow-visible lg:pb-0">
            {sections.map((s) => (
              <li key={s.id} className="shrink-0">
                <button
                  onClick={() => pick(s.id)}
                  aria-current={active.id === s.id ? 'true' : undefined}
                  className={cn(
                    'flex w-full items-center gap-3 border px-3 py-2 text-left text-[13px] whitespace-nowrap transition-colors lg:border-transparent lg:whitespace-normal',
                    active.id === s.id ? 'border-accent bg-ink-2 text-fg lg:border-l-accent' : 'border-line-2 text-fg-3 hover:text-fg lg:border-transparent',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{s.label}</span>
                  <span className="font-mono text-[11px] text-fg-3 tabular-nums">{count(s)}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          {list.length === 0 ? (
            <Empty title="Nothing here">No posts in this section.</Empty>
          ) : (
            <>
              <ul className="space-y-3">
                {list.slice(0, shown).map((p) => (
                  <PostCard key={p.id} p={p} d={due.get(p.id)} />
                ))}
              </ul>
              <More total={list.length} shown={shown} onMore={() => setShown(shown + PAGE)} />
            </>
          )}
          {data.partial && <p className="mt-4 text-[12px] text-fg-3">Some classes keep their posts private from apps.</p>}
        </div>
      </div>
    </>
  )
}

function Stat({ n, label, hot }: { n: number; label: string; hot?: boolean }) {
  return (
    <div>
      <dd className={cn('font-pixel text-[26px] leading-none tabular-nums', hot ? 'text-warn' : 'text-fg')}>{n}</dd>
      <dt className="mt-1.5 font-mono text-[10.5px] tracking-[0.08em] text-fg-3 uppercase">{label}</dt>
    </div>
  )
}

function PostCard({ p, d }: { p: StreamPost; d?: ClassroomItem }) {
  return (
    <li className="border border-line-2 bg-ink-1 p-4">
      <div className="flex flex-wrap items-center gap-2 text-[12px] text-fg-3">
        <span className={cn('border px-1.5 py-0.5 font-mono text-[10.5px] tracking-[0.06em] uppercase', p.kind === 'assignment' ? 'border-accent/60 text-accent' : 'border-line-2')}>{KIND[p.kind]}</span>
        {p.topic && <span>{p.topic}</span>}
        {d && (
          <span className={cn('font-mono tabular-nums', d.hot ? 'text-warn' : 'text-fg-2')}>
            {d.n} {d.unit}
          </span>
        )}
        <span className="ml-auto whitespace-nowrap">{p.at ? timeAgo(p.at) : ''}</span>
      </div>
      <h3 className="mt-2 text-[16px] leading-snug font-semibold text-fg">{p.title}</h3>
      {p.text && p.text !== p.title && <p className="mt-1.5 line-clamp-4 text-[13.5px] leading-relaxed whitespace-pre-line text-fg-2">{p.text}</p>}
      {p.files && p.files.length > 0 && <Files files={p.files} />}
      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <VexButton size="sm" variant="secondary" label={`${p.course}: ${p.title}`} getText={() => (d ? workPrompt({ ...d, files: p.files }) : postPrompt(p))}>
          Ask Vex
        </VexButton>
        {p.link && (
          <a href={p.link} target="_blank" rel="noreferrer" className={buttonClass('ghost', 'sm')}>
            <ExternalLink size={12} /> Open in Classroom
          </a>
        )}
      </div>
    </li>
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
