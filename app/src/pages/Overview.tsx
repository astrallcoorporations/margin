import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, FileCheck2, FileText, GraduationCap, Layers, NotebookPen, RotateCcw } from 'lucide-react'
import { cardsForResource, getResource, getTask, subject, tasksForResource, TYPE_LABEL } from '@/lib/data'
import { actions, useStore } from '@/lib/storage'
import { useAllCards } from '@/lib/hooks'
import { getTest } from '@/data/english/tests'
import { Page } from '@/components/blocks'
import { ExamPanel, countdownLabel, daysUntil, examItems } from '@/components/ExamPanel'
import { buttonClass, ButtonLink, Code } from '@/components/ui'
import { useUI } from '@/app/ui-context'

/** Home: what to do next, what needs attention, and the exam checklist. Everything else lives in Learn. */
export default function Overview() {
  const revised = useStore((s) => s.revised)
  const answers = useStore((s) => s.answers)
  const cardState = useStore((s) => s.cards)
  const attempts = useStore((s) => s.attempts)
  const name = useStore((s) => s.profile.name)
  const allCards = useAllCards()
  const { openRevise } = useUI()
  const exam = subject.exam

  const items = examItems()
  const done = items.filter((i) => revised[i.key]).length
  const days = exam ? daysUntil(exam.date) : null
  const next = items.find((i) => !revised[i.key] && i.resourceId)
  const nextRes = next?.resourceId ? getResource(next.resourceId) : undefined

  const reviewCards = allCards.filter((c) => cardState[c.id]?.status === 'review')
  const weak = useMemo(() => {
    const m = new Map<string, number>()
    reviewCards.forEach((c) => m.set(c.resourceId, (m.get(c.resourceId) ?? 0) + 1))
    Object.entries(answers).forEach(([id, a]) => {
      const t = a.rating === 'needs-work' ? getTask(id) : undefined
      if (t) m.set(t.resourceId, (m.get(t.resourceId) ?? 0) + 2)
    })
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => getResource(id)).filter(Boolean)
  }, [reviewCards, answers])
  const lastTest = attempts[0]
  const lastTestInfo = lastTest ? getTest(lastTest.testId) : undefined

  return (
    <Page>

      <header className="pt-12 pb-10 sm:pt-16">
        <div className="eyebrow mb-4">
          {subject.classLabel} · {subject.name}
        </div>
        <h1 className="text-[56px] leading-[0.92] font-semibold tracking-[-0.055em] text-fg sm:text-[72px]">{subject.term}</h1>
        <div className="mosaic-rule mt-5" aria-hidden="true" />
        <p className="mt-4 text-[15.5px] text-fg-2">
          {exam && days !== null ? (
            <>
              Exam <span className="font-medium text-fg">{countdownLabel(days).toLowerCase()}</span>
              {name ? `, ${name.split(' ')[0]}` : ''} · <span className="text-fg-3">{done} of {items.length} topics revised</span>
            </>
          ) : (
            subject.tagline
          )}
        </p>
      </header>

      {/* Up next — the single most useful thing to do */}
      {nextRes ? (
        <section aria-labelledby="next-h" className="rounded-none border border-accent/25 bg-[linear-gradient(135deg,rgba(255,213,0,0.06),rgba(12,12,12,0.6)_55%)] p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="eyebrow !text-accent">Up next</div>
            <span className="text-[12px] text-fg-3">{next!.group}</span>
          </div>
          <div className="mt-4 flex items-start gap-4">
            <Code className="!h-9 !min-w-12 !text-[10.5px] max-sm:hidden">{nextRes.code}</Code>
            <div className="min-w-0 flex-1">
              <h2 id="next-h" className="text-[22px] leading-tight font-semibold tracking-[-0.025em] text-fg">
                {nextRes.title}
              </h2>
              <p className="mt-1 text-[13px] text-fg-3">{[TYPE_LABEL[nextRes.type], nextRes.author].filter(Boolean).join(' · ')}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <ButtonLink to={`/learn/${nextRes.id}`} variant="primary">
              <FileText size={14} /> Open notes
            </ButtonLink>
            {cardsForResource(nextRes.id).length > 0 && (
              <ButtonLink to={`/flashcards/${nextRes.id}`}>
                <Layers size={14} /> Flashcards
              </ButtonLink>
            )}
            {tasksForResource(nextRes.id)[0] && (
              <ButtonLink to={`/practice/${tasksForResource(nextRes.id)[0].id}`}>
                <NotebookPen size={14} /> Practise a question
              </ButtonLink>
            )}
            <button onClick={() => actions.toggleRevised(next!.key)} className={buttonClass('ghost', 'md', 'sm:ml-auto')}>
              <Check size={14} /> Mark revised
            </button>
          </div>
        </section>
      ) : (
        exam && (
          <section className="rounded-none border border-good/25 bg-good/[0.05] p-6">
            <div className="text-[18px] font-semibold text-fg">Every topic ticked off.</div>
            <p className="mt-1 text-[13.5px] text-fg-2">Best use of time now: sit a mock paper and fix what it shows up.</p>
            <ButtonLink to="/tests" variant="primary" className="mt-4">
              <FileCheck2 size={14} /> Take a mock test
            </ButtonLink>
          </section>
        )
      )}

      {/* Needs attention */}
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Tile
          to={reviewCards.length ? '/flashcards/review' : '/flashcards'}
          icon={<RotateCcw size={15} />}
          label={reviewCards.length ? `${reviewCards.length} cards to review` : 'Flashcards'}
          hint={reviewCards.length ? 'The ones you got wrong' : 'Quick recall practice'}
          warn={reviewCards.length > 0}
        />
        <Tile
          to={lastTest ? `/tests/${lastTest.testId}/results/${lastTest.id}` : '/tests'}
          icon={<FileCheck2 size={15} />}
          label={lastTest ? `Last test ${Math.round((lastTest.score / lastTest.total) * 100)}%` : 'Take a mock test'}
          hint={lastTest ? lastTestInfo?.title ?? 'Review your answers' : 'SA1 pattern, marked instantly'}
        />
        <Tile onClick={openRevise} icon={<GraduationCap size={15} />} label="Revise with AI" hint="One prompt, whole syllabus" />
      </div>

      {weak.length > 0 && (
        <p className="mt-4 text-[13px] text-fg-3">
          Weak spots:{' '}
          {weak.map((r, i) => (
            <span key={r!.id}>
              {i > 0 && ', '}
              <Link to={`/learn/${r!.id}`} className="text-warn underline decoration-warn/30 underline-offset-2 hover:decoration-warn">
                {r!.title}
              </Link>
            </span>
          ))}
        </p>
      )}

      <div className="mt-12">
        <ExamPanel />
      </div>
    </Page>
  )
}

function Tile({ to, onClick, icon, label, hint, warn }: { to?: string; onClick?: () => void; icon: ReactNode; label: string; hint: string; warn?: boolean }) {
  const cls =
    'group flex items-center gap-3.5 rounded-none border border-[#232323] bg-[linear-gradient(145deg,rgba(17,17,17,0.92),rgba(12,12,12,0.94))] px-4 py-3.5 text-left card-hover'
  const body = (
    <>
      <span className={`grid size-9 shrink-0 place-items-center rounded-none border border-[#2a2a2a] bg-[#161616] ${warn ? 'text-warn' : 'text-accent'}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium text-fg">{label}</span>
        <span className="block truncate text-[12px] text-fg-3">{hint}</span>
      </span>
      <ArrowRight size={14} className="shrink-0 text-fg-3 transition-transform group-hover:translate-x-0.5" />
    </>
  )
  return to ? (
    <Link to={to} className={cls}>
      {body}
    </Link>
  ) : (
    <button onClick={onClick} className={cls}>
      {body}
    </button>
  )
}
