import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Layers, NotebookPen, RotateCcw } from 'lucide-react'
import { getResource, getTask, subject, TASK_TYPE_LABEL } from '@/lib/data'
import { useStore } from '@/lib/storage'
import { useAllCards } from '@/lib/hooks'
import { timeAgo } from '@/lib/utils'
import { Stat } from './blocks'
import { Code, Empty, Section } from './ui'

/** Progress, weak spots, recent activity and a suggested task — shown under the curriculum on Learn. */
export function StudyDashboard() {
  const activity = useStore((s) => s.activity)
  const answers = useStore((s) => s.answers)
  const cardState = useStore((s) => s.cards)
  const allCards = useAllCards()

  const done = Object.values(answers).filter((a) => a.status === 'done').length
  const drafts = Object.entries(answers).filter(([, a]) => a.status === 'draft' && a.text.trim())
  const reviewCards = allCards.filter((c) => cardState[c.id]?.status === 'review')
  const needsWork = Object.entries(answers).filter(([, a]) => a.rating === 'needs-work')

  const weak = useMemo(() => {
    const count = new Map<string, number>()
    reviewCards.forEach((c) => count.set(c.resourceId, (count.get(c.resourceId) ?? 0) + 1))
    needsWork.forEach(([id]) => {
      const t = getTask(id)
      if (t) count.set(t.resourceId, (count.get(t.resourceId) ?? 0) + 1)
    })
    return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
  }, [reviewCards, needsWork])

  const recent = activity.filter((a) => a.kind === 'resource' || a.kind === 'task').slice(0, 6)

  return (
    <div className="mt-16">
      <h2 className="mb-5 text-[20px] font-bold tracking-[-0.025em] text-fg">Your study</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Tasks completed" value={done} hint={`of ${subject.tasks.length}`} to="/practice" />
        <Stat label="Cards to review" value={reviewCards.length} hint={reviewCards.length ? 'Marked “need review”' : 'None marked yet'} to="/flashcards/review" />
        <Stat label="Drafts" value={drafts.length} hint={drafts.length ? 'Answers in progress' : 'No drafts'} to="/review#drafts" />
        <Stat label="Needs work" value={needsWork.length} hint="Your self-ratings" to="/review#weak" />
      </div>

      <div className="mt-4 grid gap-x-10 lg:grid-cols-3">
        <Section title="Needs review">
          {weak.length ? (
            <ul className="space-y-1">
              {weak.map(([id, n]) => {
                const r = getResource(id)!
                return (
                  <li key={id}>
                    <Link to={`/learn/${id}`} className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-ink-3">
                      <Code>{r.code}</Code>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-fg">{r.title}</span>
                      <span className="font-mono text-[11px] text-warn tabular-nums">{n}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <Empty icon={<RotateCcw size={16} />} title="Nothing flagged yet">
              Mark flashcards “need review” or rate a task “needs work”, and the topic appears here.
            </Empty>
          )}
        </Section>

        <Section title="Recent activity">
          {recent.length ? (
            <ul className="space-y-0.5">
              {recent.map((a) => {
                if (a.kind === 'resource') {
                  const r = getResource(a.id)
                  if (!r) return null
                  return (
                    <li key={`r-${a.id}`}>
                      <Link to={`/learn/${r.id}`} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] hover:bg-ink-3">
                        <Layers size={13} className="shrink-0 text-fg-3" />
                        <span className="min-w-0 flex-1 truncate text-fg-2">{r.title}</span>
                        <span className="shrink-0 text-[11px] text-fg-3">{timeAgo(a.at)}</span>
                      </Link>
                    </li>
                  )
                }
                const t = getTask(a.id)
                if (!t) return null
                return (
                  <li key={`t-${a.id}`}>
                    <Link to={`/practice/${t.id}`} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] hover:bg-ink-3">
                      <NotebookPen size={13} className="shrink-0 text-fg-3" />
                      <span className="min-w-0 flex-1 truncate text-fg-2">{t.title}</span>
                      <span className="shrink-0 text-[11px] text-fg-3">{timeAgo(a.at)}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-[13px] text-fg-3">Your recently opened resources and tasks will show here.</p>
          )}
        </Section>

        <Section title="Try a task">
          <SuggestedTask />
        </Section>
      </div>
    </div>
  )
}

function SuggestedTask() {
  const answers = useStore((s) => s.answers)
  const task = subject.tasks.find((t) => !answers[t.id]) ?? subject.tasks[0]
  const r = getResource(task.resourceId)
  return (
    <Link to={`/practice/${task.id}`} className="group block rounded-lg border border-line bg-ink-1 p-4 transition-colors hover:border-line-2 hover:bg-ink-2">
      <div className="flex items-center gap-2 text-[11.5px] text-fg-3">
        <NotebookPen size={13} />
        {TASK_TYPE_LABEL[task.type]} · {r?.title}
      </div>
      <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-fg">{task.prompt.split('\n')[0]}</p>
      <div className="mt-3 flex items-center gap-1 text-[12.5px] text-accent">
        Start task <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}
