import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Layers, NotebookPen } from 'lucide-react'
import { getResource, getTask, subject, TASK_TYPE_LABEL } from '@/lib/data'
import { useAllCards } from '@/lib/hooks'
import { useStore } from '@/lib/storage'
import { timeAgo, words } from '@/lib/utils'
import { Page, PageHeader } from '@/components/blocks'
import { ButtonLink, Code, Empty, Pill, Section } from '@/components/ui'

export default function Review() {
  const visits = useStore((s) => s.visits)
  const answers = useStore((s) => s.answers)
  const cardState = useStore((s) => s.cards)
  const cards = useAllCards()

  const recent = useMemo(
    () =>
      Object.entries(visits)
        .sort((a, b) => b[1].last - a[1].last)
        .slice(0, 8)
        .map(([id, v]) => ({ r: getResource(id), v }))
        .filter((x) => x.r),
    [visits],
  )

  const reviewCards = cards.filter((c) => cardState[c.id]?.status === 'review')
  const completed = Object.entries(answers)
    .filter(([, a]) => a.status === 'done')
    .sort((a, b) => b[1].updatedAt - a[1].updatedAt)
  const drafts = Object.entries(answers)
    .filter(([, a]) => a.status === 'draft' && a.text.trim())
    .sort((a, b) => b[1].updatedAt - a[1].updatedAt)

  // Weak areas: per resource, count missed cards and tasks self-rated "needs work".
  const weak = useMemo(() => {
    const m = new Map<string, { cards: number; tasks: number }>()
    reviewCards.forEach((c) => {
      const e = m.get(c.resourceId) ?? { cards: 0, tasks: 0 }
      m.set(c.resourceId, { ...e, cards: e.cards + 1 })
    })
    Object.entries(answers).forEach(([id, a]) => {
      if (a.rating !== 'needs-work') return
      const t = getTask(id)
      if (!t) return
      const e = m.get(t.resourceId) ?? { cards: 0, tasks: 0 }
      m.set(t.resourceId, { ...e, tasks: e.tasks + 1 })
    })
    return [...m.entries()].sort((a, b) => b[1].cards + b[1].tasks * 2 - (a[1].cards + a[1].tasks * 2))
  }, [reviewCards, answers])

  const nothing = !recent.length && !completed.length && !drafts.length && !reviewCards.length

  return (
    <Page wide>
      <PageHeader
        eyebrow="Review"
        title="Your progress"
        lede="Built only from what you’ve actually done here — resources opened, answers written, cards marked. Stored on this device."
      />

      {nothing && (
        <div className="mb-10">
          <Empty
            title="Nothing to review yet"
            action={
              <div className="flex gap-2">
                <ButtonLink to="/learn" variant="primary">
                  Open the curriculum
                </ButtonLink>
                <ButtonLink to="/flashcards">Study flashcards</ButtonLink>
              </div>
            }
          >
            As you open resources, answer tasks and mark flashcards, this page fills in with where you’re strong and what to revisit.
          </Empty>
        </div>
      )}

      <div className="grid gap-x-12 lg:grid-cols-2">
        <Section id="weak" title="Weak areas">
          {weak.length ? (
            <ul className="-mx-2">
              {weak.map(([id, w]) => {
                const r = getResource(id)
                if (!r) return null
                return (
                  <li key={id}>
                    <Link to={`/learn/${id}`} className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-ink-3">
                      <Code>{r.code}</Code>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] text-fg">{r.title}</span>
                        <span className="block text-[11.5px] text-fg-3">
                          {[w.cards && `${w.cards} card${w.cards > 1 ? 's' : ''} to review`, w.tasks && `${w.tasks} task${w.tasks > 1 ? 's' : ''} need work`].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <ChevronRight size={14} className="text-fg-3 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-[13px] text-fg-3">No weak areas flagged. They appear when you mark cards “Need review” or rate a task “Needs work”.</p>
          )}
        </Section>

        <Section
          id="cards"
          title="Flashcards needing review"
          aside={reviewCards.length ? <Link to="/flashcards/review" className="text-[12px] text-accent hover:underline">Study {reviewCards.length} →</Link> : undefined}
        >
          {reviewCards.length ? (
            <ul className="space-y-1.5">
              {reviewCards.slice(0, 8).map((c) => (
                <li key={c.id} className="flex items-start gap-3 rounded-md border border-line bg-ink-1 px-3 py-2.5">
                  <Layers size={13} className="mt-0.5 shrink-0 text-warn" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] text-fg">{c.front}</span>
                    <span className="block truncate text-[11.5px] text-fg-3">{getResource(c.resourceId)?.title}</span>
                  </span>
                </li>
              ))}
              {reviewCards.length > 8 && <li className="px-1 text-[12px] text-fg-3">+ {reviewCards.length - 8} more</li>}
            </ul>
          ) : (
            <p className="text-[13px] text-fg-3">No cards marked for review.</p>
          )}
        </Section>

        <Section id="drafts" title="In progress">
          {drafts.length ? <TaskLines entries={drafts} /> : <p className="text-[13px] text-fg-3">No unfinished answers.</p>}
        </Section>

        <Section id="completed" title={`Tasks completed · ${completed.length}/${subject.tasks.length}`}>
          {completed.length ? <TaskLines entries={completed} /> : <p className="text-[13px] text-fg-3">Mark a task “done” after reviewing it and it’s listed here.</p>}
        </Section>

        <Section id="recent" title="Recently studied" className="lg:col-span-2">
          {recent.length ? (
            <ul className="-mx-2 grid sm:grid-cols-2">
              {recent.map(({ r, v }) => (
                <li key={r!.id}>
                  <Link to={`/learn/${r!.id}`} className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-ink-3">
                    <Code>{r!.code}</Code>
                    <span className="min-w-0 flex-1 truncate text-[13.5px] text-fg">{r!.title}</span>
                    <span className="shrink-0 text-[11.5px] text-fg-3">
                      {timeAgo(v.last)} · {v.count}×
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-fg-3">Resources you open appear here.</p>
          )}
        </Section>
      </div>
    </Page>
  )
}

function TaskLines({ entries }: { entries: [string, { text: string; updatedAt: number; rating?: string }][] }) {
  return (
    <ul className="-mx-2">
      {entries.slice(0, 8).map(([id, a]) => {
        const t = getTask(id)
        if (!t) return null
        return (
          <li key={id}>
            <Link to={`/practice/${id}`} className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-ink-3">
              <NotebookPen size={14} className="shrink-0 text-fg-3" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] text-fg">{t.title}</span>
                <span className="block truncate text-[11.5px] text-fg-3">
                  {TASK_TYPE_LABEL[t.type]} · {words(a.text)} words · {timeAgo(a.updatedAt)}
                </span>
              </span>
              {a.rating === 'needs-work' && <Pill tone="warn">Needs work</Pill>}
              {a.rating === 'solid' && <Pill tone="good">Solid</Pill>}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
