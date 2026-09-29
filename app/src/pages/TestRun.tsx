import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, Clock, RotateCcw } from 'lucide-react'
import { getTest, testMarks, testQuestions } from '@/data/english/tests'
import { actions, getState, useStore } from '@/lib/storage'
import { countWords, ensureDictionary, gradeAttempt } from '@/lib/grading'
import { cn } from '@/lib/utils'
import type { MockTest, TestQuestion } from '@/types/tests'
import { Breadcrumbs, Page } from '@/components/blocks'
import { PassageCard, marksLabel } from '@/components/TestBits'
import { Button } from '@/components/ui'
import { useToast } from '@/components/toast'
import NotFound from './NotFound'

export default function TestRun() {
  const { testId = '' } = useParams()
  const test = getTest(testId)
  if (!test) return <NotFound what="test" />
  return <Runner key={test.id} test={test} />
}

function useElapsed(since: number) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])
  const s = Math.max(0, Math.floor((now - since) / 1000))
  return `${Math.floor(s / 3600) ? Math.floor(s / 3600) + ':' : ''}${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function Runner({ test }: { test: MockTest }) {
  const draft = useStore((s) => s.testDrafts[test.id])
  const [startedAt] = useState(() => getState().testDrafts[test.id]?.startedAt ?? Date.now())
  const answers = draft?.answers ?? {}
  const elapsed = useElapsed(startedAt)
  const navigate = useNavigate()
  const notify = useToast()
  const all = testQuestions(test)
  const answered = all.filter((q) => (answers[q.id] ?? '').trim() !== '').length

  // Number questions continuously across sections, like a printed paper.
  const numbers = useMemo(() => new Map(all.map((q, i) => [q.id, i + 1])), [all])

  const set = (qid: string, v: string) => actions.saveTestAnswer(test.id, qid, v)

  useEffect(() => {
    ensureDictionary()
  }, [])

  const submit = async () => {
    await ensureDictionary()
    const left = all.length - answered
    if (left > 0 && !window.confirm(`${left} question${left > 1 ? 's are' : ' is'} unanswered. Submit and mark anyway?`)) return
    const r = gradeAttempt(test, answers)
    const a = actions.submitTest({ testId: test.id, answers, startedAt, submittedAt: Date.now(), score: r.score, total: r.total, autoScore: r.autoScore, autoTotal: r.autoTotal })
    notify('Marked')
    navigate(`/tests/${test.id}/results/${a.id}`)
  }

  return (
    <Page wide>
      <div className="pt-8 sm:pt-10">
        <Breadcrumbs items={[{ label: 'Tests', to: '/tests' }, { label: test.title }]} />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[30px] leading-tight font-bold tracking-[-0.035em] text-fg sm:text-[36px]">{test.title}</h1>
            <p className="mt-2 text-[13.5px] text-fg-3">
              {testMarks(test)} marks · {all.length} questions · suggested {test.minutes >= 60 ? `${test.minutes / 60} hours` : `${test.minutes} minutes`}
            </p>
          </div>
          {draft && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (window.confirm('Clear all answers and start this test again?')) actions.discardTestDraft(test.id)
              }}
            >
              <RotateCcw size={13} /> Start over
            </Button>
          )}
        </div>
      </div>

      <div className="mt-8 space-y-14">
        {test.sections.map((s) => {
          const hasPassage = Boolean(s.passage)
          return (
            <section key={s.id} aria-labelledby={`sec-${s.id}`}>
              <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-line pb-3">
                <h2 id={`sec-${s.id}`} className="text-[16px] font-semibold tracking-[-0.015em] text-fg">
                  {s.title}
                </h2>
                {s.note && <span className="shrink-0 text-[12px] text-fg-3">{s.note}</span>}
              </div>
              <div className={cn(hasPassage && 'xl:grid xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] xl:gap-8')}>
                {(s.passage || s.extract) && (
                  <div className={cn('mb-6', hasPassage && 'xl:sticky xl:top-[120px] xl:mb-0 xl:max-h-[calc(100dvh-140px)] xl:self-start xl:overflow-y-auto')}>
                    <PassageCard passage={s.passage} extract={s.extract} />
                  </div>
                )}
                <ol className="space-y-6">
                  {s.questions.map((q) => (
                    <QuestionField key={q.id} n={numbers.get(q.id)!} q={q} value={answers[q.id] ?? ''} onChange={(v) => set(q.id, v)} />
                  ))}
                </ol>
              </div>
            </section>
          )
        })}
      </div>

      {/* Submit bar */}
      <div className="sticky bottom-0 z-20 -mx-4 mt-14 border-t border-line bg-ink-0/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-mono text-[12px] text-fg-3 tabular-nums" title="Time since you started">
            <Clock size={12} /> {elapsed}
          </span>
          <div className="hidden flex-1 items-center gap-3 sm:flex">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${(answered / all.length) * 100}%` }} />
            </div>
          </div>
          <span className="ml-auto text-[12.5px] text-fg-2 tabular-nums sm:ml-0">
            {answered}/{all.length} answered
          </span>
          <Button variant="primary" onClick={submit} disabled={answered === 0}>
            <Check size={14} /> Submit & mark
          </Button>
        </div>
      </div>
    </Page>
  )
}

function QuestionField({ n, q, value, onChange }: { n: number; q: TestQuestion; value: string; onChange: (v: string) => void }) {
  const head = (
    <div className="mb-3 flex items-start gap-3">
      <span className="mt-0.5 w-7 shrink-0 font-mono text-[12px] text-fg-3 tabular-nums">{n}.</span>
      <p className="flex-1 text-[15px] leading-relaxed text-fg">{q.prompt}</p>
      <span className="shrink-0 pt-0.5 text-[11px] text-fg-3">{marksLabel(q.marks)}</span>
    </div>
  )
  if (q.kind === 'mcq')
    return (
      <li>
        {head}
        <div className="ml-10 grid gap-1.5 sm:grid-cols-2" role="radiogroup" aria-label={`Question ${n}`}>
          {q.options.map((o, i) => {
            const on = value === String(i)
            return (
              <button
                key={i}
                role="radio"
                aria-checked={on}
                onClick={() => onChange(on ? '' : String(i))}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-[13.5px] transition-colors',
                  on ? 'border-accent/50 bg-accent/[0.08] text-fg' : 'border-line-2 text-fg-2 hover:border-[#3a3a3a] hover:bg-ink-2 hover:text-fg',
                )}
              >
                <span className={cn('grid size-5 shrink-0 place-items-center border font-mono text-[10px]', on ? 'border-accent bg-accent text-ink-0' : 'border-line-2 text-fg-3')}>
                  {String.fromCharCode(97 + i)}
                </span>
                {o}
              </button>
            )
          })}
        </div>
      </li>
    )
  if (q.kind === 'fill')
    return (
      <li>
        {head}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`Answer to question ${n}`}
          placeholder="Your answer"
          className="ml-10 h-10 w-[calc(100%-2.5rem)] rounded-lg border border-line-2 bg-ink-1 px-3 text-[14px] text-fg placeholder:text-fg-3 focus:border-accent/60 focus:outline-none"
        />
      </li>
    )
  const words = countWords(value)
  const [lo, hi] = q.words ?? [0, 0]
  const long = (q.words?.[1] ?? 40) > 60
  return (
    <li>
      {head}
      <div className="ml-10 overflow-hidden rounded-lg border border-line-2 bg-ink-1 transition-colors focus-within:border-accent/50">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`Answer to question ${n}`}
          rows={long ? 9 : 3}
          spellCheck
          placeholder={q.format === 'letter' ? 'Sender’s address…' : q.format === 'article' ? 'Heading\nBy – Name\n\n…' : q.format === 'diary' ? 'Date, day, time\nDear Diary,…' : 'Write your answer…'}
          className="block w-full resize-y bg-transparent px-3.5 py-3 text-[14.5px] leading-[1.7] text-fg placeholder:text-fg-3 focus:outline-none"
        />
        {q.words && (
          <div className="flex justify-between border-t border-line px-3.5 py-1.5 text-[11px] text-fg-3 tabular-nums">
            <span>
              Aim for {lo}–{hi} words
            </span>
            <span className={words > hi ? 'text-warn' : words >= lo ? 'text-good' : ''}>{words} words</span>
          </div>
        )}
      </div>
    </li>
  )
}
