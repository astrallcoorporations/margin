import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Download, ExternalLink, FileText, Link2, RefreshCw } from 'lucide-react'
import { connectClassroomUrl, fetchFileText, openLibFile, signInUrl, type LibFile, type LibItem, type LibSubject } from '@/lib/vex'
import { timeAgo } from '@/lib/utils'
import { Page, PageHeader } from '@/components/blocks'
import { useVex, VexButton } from '@/components/Vex'
import { useToast } from '@/components/toast'
import { Button, buttonClass, Empty, Pill, Section } from '@/components/ui'
import NotFound from './NotFound'

const KIND = { assignment: 'Assignment', material: 'Material', announcement: 'Announcement' } as const
const sizeLabel = (n?: number) => (n ? (n > 1_000_000 ? `${(n / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1000))} KB`) : '')

/** One Classroom course as a subject. Everything here arrives by itself: new steps and files show up after a sync. */
export default function Subject() {
  const { id = '' } = useParams()
  const { session, library, libraryError, refreshLibrary, syncLibrary } = useVex()
  const notify = useToast()

  if (session.state === 'loading') return <Shell title="Subject">Checking with Vex…</Shell>
  if (session.state === 'offline')
    return (
      <Shell title="Subject">
        <Empty title="Vex isn’t running">Start Vex, then reload this page. Your subjects come from Google Classroom through Vex.</Empty>
      </Shell>
    )
  if (session.state === 'signedout')
    return (
      <Shell title="Subject">
        <Empty title="Sign in to see your subjects" action={<a href={signInUrl()} className={buttonClass('primary')}>Sign up / Sign in with Google</a>}>
          Each of your Google Classroom courses becomes a subject here, with its files downloaded.
        </Empty>
      </Shell>
    )
  if (libraryError) return <Shell title="Subject"><Empty title="Couldn’t load your subjects" action={<Button onClick={refreshLibrary}>Try again</Button>}>{libraryError}</Empty></Shell>
  if (!library) return <Shell title="Subject">Loading your subjects…</Shell>
  if (!library.supported) return <Shell title="Subject"><Empty title="Downloading isn’t available on this Vex">Vex keeps the files on its own disk, so this only works when Vex runs on your computer.</Empty></Shell>
  if (!library.connected || library.needsReconnect)
    return (
      <Shell title="Subject">
        <Empty
          title={library.needsReconnect ? 'Classroom needs one more permission' : 'Connect Google Classroom'}
          action={<a href={connectClassroomUrl()} className={buttonClass('primary')}>{library.needsReconnect ? 'Connect again' : 'Connect Classroom'}</a>}
        >
          {library.needsReconnect ? 'Vex now also downloads the files teachers attach. Connect again to allow it.' : 'Vex reads your courses and downloads what is in them. It never changes anything in Classroom.'}
        </Empty>
      </Shell>
    )

  const subject = library.index?.subjects.find((s) => s.id === id)
  if (!library.index) return <Shell title="Subject">{library.sync?.running ? 'Downloading your courses from Classroom… this takes a minute.' : 'Nothing downloaded yet.'}{library.sync?.error && <p className="mt-2 text-warn">{library.sync.error}</p>}</Shell>
  if (!subject) return <NotFound what="subject" />

  const sync = library.sync
  const items = subject.topics.reduce((n, t) => n + t.items.length, 0)
  const files = subject.topics.reduce((n, t) => n + t.items.reduce((m, i) => m + i.files.filter((f) => f.ok).length, 0), 0)

  return (
    <Page wide>
      <PageHeader
        eyebrow={`Classroom${subject.section ? ` · ${subject.section}` : ''}`}
        title={subject.name}
        lede={`${items} post${items === 1 ? '' : 's'} and ${files} downloaded file${files === 1 ? '' : 's'}. New steps and files appear here by themselves after a sync.`}
        aside={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] text-fg-3" aria-live="polite">
              {sync?.running ? `Syncing… ${sync.done} of ${sync.courses} courses` : `Synced ${timeAgo(library.index.syncedAt)}`}
            </span>
            <Button
              size="sm"
              variant="secondary"
              disabled={Boolean(sync?.running)}
              onClick={() => syncLibrary().catch((e) => notify(e instanceof Error ? e.message : 'Couldn’t start the sync', 'error'))}
            >
              <RefreshCw size={12} className={sync?.running ? 'animate-spin' : ''} /> Sync now
            </Button>
            {subject.link && (
              <a href={subject.link} target="_blank" rel="noreferrer" className={buttonClass('ghost', 'sm')}>
                <ExternalLink size={12} /> Open in Classroom
              </a>
            )}
          </div>
        }
      />
      {sync?.error && <p className="mb-4 text-[13px] text-warn">The last sync stopped: {sync.error}</p>}
      {sync && !sync.running && sync.problems > 0 && <p className="mb-4 text-[12.5px] text-fg-3">{sync.problems} file{sync.problems === 1 ? '' : 's'} couldn’t be downloaded. They are listed below with a reason.</p>}

      {subject.topics.length === 0 && <Empty title="Nothing here yet">This course has no posts yet.</Empty>}
      {subject.topics.map((t) => (
        <Section key={t.id} title={t.name} aside={<span className="text-[12px] text-fg-3">{t.items.length} post{t.items.length === 1 ? '' : 's'}</span>}>
          <ul className="space-y-3">
            {t.items.map((it) => (
              <Post key={it.id} item={it} subject={subject} />
            ))}
          </ul>
        </Section>
      ))}
    </Page>
  )
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Page wide>
      <PageHeader eyebrow="Classroom" title={title} />
      <div className="text-[13.5px] text-fg-3">{children}</div>
    </Page>
  )
}

function Post({ item, subject }: { item: LibItem; subject: LibSubject }) {
  const notify = useToast()
  const [busy, setBusy] = useState('')
  const open = async (f: LibFile, download: boolean) => {
    setBusy(f.id)
    try {
      await openLibFile(f, download)
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Couldn’t open the file', 'error')
    } finally {
      setBusy('')
    }
  }
  // What goes to Vex: the post itself, plus the words inside any Word or slide files attached to it.
  const prompt = async () => {
    let attached = ''
    for (const f of item.files.filter((x) => x.ok)) {
      if (attached.length > 14000) break
      const t = await fetchFileText(f.id)
      if (t.readable && t.text.trim()) attached += `\n\n--- File: ${f.name} ---\n${t.text.slice(0, 14000 - attached.length)}`
    }
    const unread = item.files.filter((f) => f.ok).length - (attached.match(/--- File:/g)?.length ?? 0)
    return (
      `I’m a Class 8 student. Here is ${item.kind === 'assignment' || item.kind === 'announcement' ? 'an' : 'a'} ${KIND[item.kind].toLowerCase()} from my teacher on Google Classroom. Help me understand it${item.kind === 'assignment' ? ' and do it properly' : ''}, step by step.\n\n` +
      `Subject: ${subject.name}\nTitle: ${item.title}\n${item.due ? `Due: ${new Date(item.due).toDateString()}\n` : ''}${item.text ? `\n${item.text}` : ''}${attached}` +
      (unread > 0 ? `\n\n(${unread} attached file${unread === 1 ? ' is a PDF or another format' : 's are PDFs or other formats'} that I can’t paste in. If you need ${unread === 1 ? 'it' : 'them'}, ask me to type out the questions.)` : '')
    )
  }
  const late = item.due && item.due < Date.now()
  return (
    <li className="border border-line-2 bg-ink-1 p-4">
      <div className="flex flex-wrap items-center gap-2 text-[12px] text-fg-3">
        <Pill tone={item.kind === 'assignment' ? 'accent' : 'default'}>{KIND[item.kind]}</Pill>
        {item.due > 0 && <span className={late ? 'text-warn' : 'text-fg-2'}>Due {new Date(item.due).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
        <span className="ml-auto whitespace-nowrap">{item.updated ? timeAgo(item.updated) : ''}</span>
      </div>
      <h3 className="mt-2 text-[16px] leading-snug font-semibold text-fg">{item.title}</h3>
      {item.text && item.text !== item.title && <p className="mt-1.5 line-clamp-4 text-[13.5px] leading-relaxed whitespace-pre-line text-fg-2">{item.text}</p>}

      {(item.files.length > 0 || item.links.length > 0) && (
        <ul className="mt-3 space-y-1.5">
          {item.files.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center gap-2 text-[13px]">
              <FileText size={14} className="shrink-0 text-fg-3" aria-hidden="true" />
              {f.ok ? (
                <>
                  <button onClick={() => open(f, false)} className="min-w-0 truncate text-left text-fg underline decoration-line-2 underline-offset-2 hover:decoration-fg" disabled={busy === f.id}>
                    {f.name}
                  </button>
                  <span className="text-[11.5px] text-fg-3">{sizeLabel(f.size)}</span>
                  <button onClick={() => open(f, true)} className="grid size-7 place-items-center rounded-md text-fg-3 hover:bg-ink-3 hover:text-fg" aria-label={`Download ${f.name}`} title="Download">
                    <Download size={13} />
                  </button>
                </>
              ) : (
                <>
                  <span className="min-w-0 truncate text-fg-2">{f.name}</span>
                  <span className="text-[11.5px] text-fg-3">{f.reason}</span>
                  {f.url && (
                    <a href={f.url} target="_blank" rel="noreferrer" className="text-[11.5px] text-accent underline underline-offset-2">
                      Open in Drive
                    </a>
                  )}
                </>
              )}
            </li>
          ))}
          {item.links.map((l, i) => (
            <li key={i} className="flex items-center gap-2 text-[13px]">
              <Link2 size={14} className="shrink-0 text-fg-3" aria-hidden="true" />
              <a href={l.url} target="_blank" rel="noreferrer" className="min-w-0 truncate text-fg underline decoration-line-2 underline-offset-2 hover:decoration-fg">
                {l.title}
              </a>
              <span className="text-[11.5px] text-fg-3">{l.type === 'video' ? 'Video' : l.type === 'form' ? 'Form' : 'Link'}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <VexButton size="sm" variant="secondary" label={`${subject.name}: ${item.title}`} getText={prompt}>
          Ask Vex
        </VexButton>
        {item.link && (
          <a href={item.link} target="_blank" rel="noreferrer" className={buttonClass('ghost', 'sm')}>
            <ExternalLink size={12} /> Classroom
          </a>
        )}
      </div>
    </li>
  )
}
