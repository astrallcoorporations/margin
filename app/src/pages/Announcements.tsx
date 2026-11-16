import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ExternalLink, LogIn, Paperclip, PenSquare, RefreshCw, Search, Send, X } from 'lucide-react'
import { connectMailUrl, mailList, mailSend, mailThread, signInUrl, VexError, type MailList, type MailMessage, type MailThread } from '@/lib/vex'
import { cn, timeAgo } from '@/lib/utils'
import { Page, PageHeader } from '@/components/blocks'
import { useVex, VexButton } from '@/components/Vex'
import { useToast } from '@/components/toast'
import { Button, buttonClass, Empty } from '@/components/ui'

type Box = 'school' | 'all'

const nameOf = (from: string) => (from.match(/^\s*"?([^"<]*?)"?\s*</)?.[1] || from.replace(/<.*>/, '') || from).trim() || from
const emailOf = (from: string) => (from.match(/<([^>]+)>/)?.[1] || from).trim().toLowerCase()
const field = 'h-10 w-full min-w-0 border border-line-2 bg-ink-1 px-3 text-[14px] text-fg placeholder:text-fg-3 focus:border-accent/60 focus:outline-none'

/** The school's messages: every @ked.edu.in email in one list, with reply and compose. Read through the person's own Gmail; nothing is kept by Margin. */
export default function Announcements() {
  const { session } = useVex()
  const notify = useToast()
  const [box, setBox] = useState<Box>('school')
  const [q, setQ] = useState('')
  const [query, setQuery] = useState('')
  const [data, setData] = useState<MailList | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const [composing, setComposing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await mailList(box, query))
    } catch (e) {
      setError(e instanceof VexError ? e.message : 'Couldn’t load your messages.')
    } finally {
      setLoading(false)
    }
  }, [box, query])

  useEffect(() => {
    if (session.state === 'signedin') load()
  }, [session.state, load])

  const unread = data?.threads.filter((t) => t.unread).length ?? 0

  let body
  if (session.state === 'loading') body = <p className="text-[13.5px] text-fg-3">Checking with Vex…</p>
  else if (session.state === 'offline') body = <Empty title="Vex isn’t running">Start Vex, then reload this page.</Empty>
  else if (session.state === 'signedout')
    body = (
      <Empty
        title="Sign in to see announcements"
        action={
          session.unavailable ? undefined : (
            <a href={signInUrl()} className={buttonClass('primary')}>
              <LogIn size={14} /> Sign up / Sign in with Google
            </a>
          )
        }
      >
        Only ked.edu.in school accounts and a short approved list can sign in.
      </Empty>
    )
  else if (error) body = <Empty title="Couldn’t reach your mail" action={<Button onClick={load}>Try again</Button>}>{error}</Empty>
  else if (!data) body = <p className="text-[13.5px] text-fg-3">Loading your messages…</p>
  else if (!data.configured) body = <Empty title="Mail isn’t set up on Vex yet">The owner needs to add the Google keys to Vex.</Empty>
  else if (!data.connected)
    body = (
      <Empty title="Connect your school mail" action={<a href={connectMailUrl()} className={buttonClass('primary')}>Connect mail</a>}>
        Margin will show every email from {data.domain} in one place, and let you reply and write to teachers. It reads and sends through your own Google account. Margin does not keep your mail, and it only sends to {data.domain} addresses or replies to people already in a conversation.
      </Empty>
    )
  else
    body = (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className={cn(open && 'hidden lg:block')}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setQuery(q.trim())
            }}
            className="mb-3 flex gap-2"
          >
            <div className="relative min-w-0 flex-1">
              <Search size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages" className={cn(field, 'pl-9')} aria-label="Search messages" />
            </div>
          </form>
          {data.threads.length === 0 ? (
            <Empty title={query ? 'No matches' : 'Nothing here yet'}>{box === 'school' ? `No messages from ${data.domain} in your inbox.` : 'Your inbox is empty.'}</Empty>
          ) : (
            <ul className="divide-y divide-line border border-line">
              {data.threads.map((t) => (
                <Row key={t.id} t={t} active={open === t.id} onOpen={() => setOpen(t.id)} />
              ))}
            </ul>
          )}
        </div>
        <div className={cn(!open && 'hidden lg:block')}>
          {open ? <Thread id={open} onBack={() => setOpen(null)} onSent={load} /> : <div className="grid h-full min-h-[240px] place-items-center border border-dashed border-line-2 px-6 text-center text-[13.5px] text-fg-3">Choose a message to read it and reply.</div>}
        </div>
      </div>
    )

  return (
    <Page wide>
      <PageHeader
        eyebrow="Announcements"
        title="School messages"
        lede={`Every email from ${data?.domain ?? 'ked.edu.in'} in one place. Reply here, or write to a teacher. Read-only until you press send.`}
        aside={
          data?.connected ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="primary" onClick={() => setComposing(true)}>
                <PenSquare size={13} /> Write
              </Button>
              <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> {loading ? 'Refreshing' : 'Refresh'}
              </Button>
            </div>
          ) : undefined
        }
      />
      {data?.connected && (
        <div className="mb-6 flex gap-5 border-b border-line" role="tablist">
          {(
            [
              ['school', `From ${data.domain}`],
              ['all', 'Whole inbox'],
            ] as [Box, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={box === id}
              onClick={() => {
                setBox(id)
                setOpen(null)
              }}
              className={cn('-mb-px border-b-2 pb-3 font-mono text-[11.5px] tracking-[0.08em] uppercase transition-colors', box === id ? 'border-accent text-fg' : 'border-transparent text-fg-3 hover:text-fg')}
            >
              {label} {id === box && unread > 0 && <span className="ml-1 text-accent">{unread} new</span>}
            </button>
          ))}
        </div>
      )}
      {body}
      {composing && data && (
        <Compose
          domain={data.domain}
          onClose={() => setComposing(false)}
          onSent={() => {
            setComposing(false)
            notify('Sent')
            load()
          }}
        />
      )}
    </Page>
  )
}

function Row({ t, active, onOpen }: { t: MailThread; active: boolean; onOpen: () => void }) {
  return (
    <li>
      <button onClick={onOpen} className={cn('block w-full px-4 py-3 text-left transition-colors hover:bg-ink-2', active && 'bg-ink-2')}>
        <div className="flex items-baseline gap-2">
          {t.unread && <span className="size-1.5 shrink-0 translate-y-[-1px] bg-accent" aria-label="Unread" />}
          <span className={cn('min-w-0 flex-1 truncate text-[13.5px]', t.unread ? 'font-semibold text-fg' : 'text-fg-2')}>{nameOf(t.from)}</span>
          <span className="shrink-0 text-[11.5px] text-fg-3">{t.date ? timeAgo(t.date) : ''}</span>
        </div>
        <p className={cn('mt-0.5 truncate text-[13.5px]', t.unread ? 'font-medium text-fg' : 'text-fg-2')}>
          {t.subject}
          {t.count > 1 && <span className="ml-2 font-mono text-[11px] text-fg-3">{t.count}</span>}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[12.5px] text-fg-3">{t.snippet}</p>
      </button>
    </li>
  )
}

function Thread({ id, onBack, onSent }: { id: string; onBack: () => void; onSent: () => void }) {
  const notify = useToast()
  const [messages, setMessages] = useState<MailMessage[] | null>(null)
  const [error, setError] = useState('')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const load = useCallback(() => {
    setMessages(null)
    setError('')
    mailThread(id).then(setMessages).catch((e) => setError(e instanceof Error ? e.message : 'Couldn’t open it.'))
  }, [id])
  useEffect(load, [load])

  const last = messages?.[messages.length - 1]
  const to = useMemo(() => (last ? emailOf(last.from) : ''), [last])
  const subject = messages?.[0]?.subject ?? ''

  const send = async () => {
    if (!last || !reply.trim() || sending) return
    setSending(true)
    try {
      await mailSend({
        to,
        subject: /^re:/i.test(subject) ? subject : `Re: ${subject}`,
        body: reply,
        threadId: id,
        inReplyTo: last.messageId,
        references: last.references,
      })
      notify('Reply sent')
      setReply('')
      load()
      onSent()
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Couldn’t send', 'error')
    } finally {
      setSending(false)
    }
  }

  if (error) return <Empty title="Couldn’t open that message" action={<Button onClick={load}>Try again</Button>}>{error}</Empty>
  if (!messages) return <p className="text-[13.5px] text-fg-3">Opening…</p>

  return (
    <div className="border border-line bg-ink-1">
      <div className="flex items-start gap-3 border-b border-line px-4 py-3.5">
        <button onClick={onBack} className="grid size-8 shrink-0 place-items-center text-fg-3 hover:text-fg lg:hidden" aria-label="Back to the list">
          <ArrowLeft size={16} />
        </button>
        <h2 className="min-w-0 flex-1 text-[17px] leading-snug font-semibold text-fg">{subject || '(no subject)'}</h2>
        <a href={`https://mail.google.com/mail/u/0/#inbox/${id}`} target="_blank" rel="noreferrer" className="shrink-0 text-fg-3 hover:text-fg" aria-label="Open in Gmail" title="Open in Gmail">
          <ExternalLink size={15} />
        </a>
      </div>
      <ul className="divide-y divide-line">
        {messages.map((m) => (
          <li key={m.id} className="px-4 py-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[14px] font-medium text-fg">{nameOf(m.from)}</span>
              <span className="font-mono text-[11.5px] text-fg-3">{emailOf(m.from)}</span>
              <span className="ml-auto text-[12px] text-fg-3">{m.date ? new Date(m.date).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</span>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed break-words whitespace-pre-wrap text-fg-2">{m.body || '(no text)'}</p>
            {m.attachments.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {m.attachments.map((a) => (
                  <li key={a} className="inline-flex items-center gap-1.5 border border-line-2 bg-ink-2 px-2 py-1 text-[12px] text-fg-2">
                    <Paperclip size={11} className="text-fg-3" /> {a}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3">
              <VexButton size="sm" variant="secondary" label={`Explain: ${m.subject}`} getText={() => `I’m a Class 8 student. Here is a message from my school. Tell me what it means and what I need to do, in short steps.\n\nFrom: ${nameOf(m.from)}\nSubject: ${m.subject}\n\n${m.body}`}>
                Ask Vex
              </VexButton>
            </div>
          </li>
        ))}
      </ul>
      <div className="border-t border-line p-4">
        <label htmlFor="reply" className="mb-1.5 block font-mono text-[11px] tracking-[0.06em] text-fg-3 uppercase">
          Reply to {nameOf(last?.from ?? '')}
        </label>
        <textarea id="reply" value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder="Write your reply" className="w-full resize-y border border-line-2 bg-ink-2 px-3 py-2.5 text-[14px] leading-relaxed text-fg placeholder:text-fg-3 focus:border-accent/60 focus:outline-none" />
        <div className="mt-2 flex items-center gap-3">
          <span className="min-w-0 flex-1 truncate text-[12px] text-fg-3">Goes to {to}</span>
          <Button variant="primary" onClick={send} disabled={!reply.trim() || sending}>
            <Send size={13} /> {sending ? 'Sending' : 'Send reply'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Compose({ domain, onClose, onSent }: { domain: string; onClose: () => void; onSent: () => void }) {
  const notify = useToast()
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [onClose])

  const send = async () => {
    setSending(true)
    try {
      await mailSend({ to, subject, body: text })
      onSent()
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Couldn’t send', 'error')
      setSending(false)
    }
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center" role="dialog" aria-modal="true" aria-label="Write a message">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-[560px] border border-line-2 bg-ink-1 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.9)]">
        <div className="flex items-center border-b border-line px-4 py-3">
          <h2 className="font-pixel text-[12px] tracking-[0.08em] text-fg uppercase">New message</h2>
          <button onClick={onClose} className="ml-auto grid size-8 place-items-center text-fg-3 hover:text-fg" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-2.5 p-4">
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder={`To (a @${domain} address; separate several with commas)`} className={field} aria-label="To" autoFocus />
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className={field} aria-label="Subject" />
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder="Message" className="w-full resize-y border border-line-2 bg-ink-2 px-3 py-2.5 text-[14px] leading-relaxed text-fg placeholder:text-fg-3 focus:border-accent/60 focus:outline-none" aria-label="Message" />
          <p className="text-[12px] text-fg-3">From Margin you can write to @{domain} addresses. It sends from your own school account, so be polite and clear.</p>
          <div className="flex justify-end">
            <Button variant="primary" onClick={send} disabled={sending || !to.trim() || !subject.trim() || !text.trim()}>
              <Send size={13} /> {sending ? 'Sending' : 'Send'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
