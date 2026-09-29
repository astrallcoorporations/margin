import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, CircleAlert, RotateCcw, Sparkles, X } from 'lucide-react'
import { getTest, testQuestions } from '@/data/english/tests'
import { ensureDictionary, gradeAttempt, type QuestionResult } from '@/lib/grading'
import { useStore } from '@/lib/storage'
import { buildMarkingPrompt } from '@/lib/prompts'
import { getResource } from '@/lib/data'
import { cn, timeAgo } from '@/lib/utils'
import type { TestQuestion } from '@/types/tests'
import { Breadcrumbs, Page } from '@/components/blocks'
import { PassageCard, marksLabel } from '@/components/TestBits'
import { CopyButton } from '@/components/CopyButton'
import { AiLinks } from '@/components/AiLinks'
import { ButtonLink, Pill } from '@/components/ui'
import NotFound from './NotFound'

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

export default function TestResult() {
  const { testId = '', attemptId = '' } = useParams()
  const test = getTest(testId)
  const attempt = useStore((s) => s.attempts.find((a) => a.id === attemptId))
  const [dictReady, setDictReady] = useState(false)
  useEffect(() => {
    ensureDictionary().then(() => setDictReady(true))
  }, [])
  const result = useMemo(() => (test && attempt ? gradeAttempt(test, attempt.answers) : null), [test, attempt, dictReady])
  if (!test || !attempt || !result) return <NotFound what="result" />

  const all = testQuestions(test)
  const numbers = new Map(all.map((q, i) => [q.id, i + 1]))
  const pct = Math.round((result.score / result.total) * 100)
  const hasWritten = result.estTotal > 0
  const minutes = Math.max(1, Math.round((attempt.submittedAt - attempt.startedAt) / 60000))

  // Weakest topics: written questions with low scores, grouped by resource.
  const weak = new Map<string, number>()
  all.forEach((q) => {
    const r = result.questions[q.id]
    if (q.resourceId && r.answered && r.score < q.marks * 0.5) weak.set(q.resourceId, (weak.get(q.resourceId) ?? 0) + 1)
  })

  return (
    <Page wide>
      <div className="pt-8 sm:pt-10">
        <Breadcrumbs items={[{ label: 'Tests', to: '/tests' }, { label: test.title, to: `/tests/${test.id}` }, { label: 'Results' }]} />
      </div>

      {/* Score header */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-none border border-[#232323] bg-[linear-gradient(145deg,rgba(17,17,17,0.92),rgba(12,12,12,0.94))] p-6">
          <div className="eyebrow">{test.title}</div>
          <div className="mt-4 flex items-end gap-3">
            <span className="text-[64px] leading-[0.9] font-bold tracking-[-0.05em] text-fg tabular-nums">{fmt(result.score)}</span>
            <span className="pb-1.5 text-[20px] text-fg-3 tabular-nums">/ {result.total}</span>
            <span className={cn('mb-2 ml-auto px-2.5 py-1 text-[13px] font-semibold tabular-nums', pct >= 80 ? 'bg-good/10 text-good' : pct >= 50 ? 'bg-ink-3 text-fg-2' : 'bg-warn/10 text-warn')}>
              {pct}%
            </span>
          </div>
          <p className="mt-3 text-[12.5px] text-fg-3">
            Submitted {timeAgo(attempt.submittedAt)} · {minutes} min
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-[#232323] pt-4 text-[12.5px]">
            <div>
              <dt className="text-fg-3">Marked exactly</dt>
              <dd className="mt-1 text-[15px] font-semibold text-fg tabular-nums">
                {fmt(result.autoScore)} / {result.autoTotal}
              </dd>
            </div>
            {hasWritten && (
              <div>
                <dt className="text-fg-3">Written — estimate</dt>
                <dd className="mt-1 text-[15px] font-semibold text-fg tabular-nums">
                  {fmt(result.estScore)} / {result.estTotal}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="flex flex-col gap-4">
          {hasWritten && (
            <div className="rounded-none border border-accent/25 bg-[linear-gradient(135deg,rgba(255,213,0,0.06),transparent_60%)] p-5">
              <div className="flex items-center gap-2 text-[14px] font-semibold text-fg">
                <Sparkles size={15} className="text-accent" /> Get your written answers properly marked
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-fg-2">
                The estimate only checks key points, format, length and spelling. Copy the whole paper — questions, your answers and the marking scheme — into any AI and it’ll mark it like a teacher.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <CopyButton variant="primary" getText={() => buildMarkingPrompt(test, attempt.answers, result)} icon={<Sparkles size={14} />} toast="Marking prompt copied — paste it into your AI">
                  Copy for AI marking
                </CopyButton>
                <AiLinks />
              </div>
            </div>
          )}
          <div className="rounded-none border border-line bg-ink-1 p-5">
            <div className="eyebrow mb-3">By section</div>
            <ul className="space-y-2.5">
              {test.sections.map((s) => {
                const got = s.questions.reduce((a, q) => a + result.questions[q.id].score, 0)
                const max = s.questions.reduce((a, q) => a + q.marks, 0)
                return (
                  <li key={s.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1">
                    <span className="truncate text-[13px] text-fg-2">{s.title.replace(/^Section [ABC] · /, '')}</span>
                    <span className="text-[12.5px] text-fg tabular-nums">
                      {fmt(got)}/{max}
                    </span>
                    <div className="col-span-2 h-1 overflow-hidden rounded-full bg-line">
                      <div className={cn('h-full rounded-full', got / max >= 0.8 ? 'bg-good/80' : got / max >= 0.5 ? 'bg-accent' : 'bg-warn/80')} style={{ width: `${(got / max) * 100}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
            {weak.size > 0 && (
              <p className="mt-4 border-t border-line pt-3 text-[12.5px] text-fg-3">
                Revise:{' '}
                {[...weak.keys()].map((id, i) => {
                  const r = getResource(id)
                  return r ? (
                    <span key={id}>
                      {i > 0 && ', '}
                      <Link to={`/learn/${id}`} className="text-fg-2 underline decoration-line-2 underline-offset-2 hover:text-fg">
                        {r.title}
                      </Link>
                    </span>
                  ) : null
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <ButtonLink to={`/tests/${test.id}`}>
          <RotateCcw size={14} /> Sit again
        </ButtonLink>
        <ButtonLink to="/tests" variant="ghost">
          All tests
        </ButtonLink>
      </div>

      {/* Question review */}
      <div className="mt-12 space-y-12">
        {test.sections.map((s) => (
          <section key={s.id}>
            <div className="mb-5 flex items-baseline justify-between border-b border-line pb-3">
              <h2 className="text-[16px] font-semibold tracking-[-0.015em] text-fg">{s.title}</h2>
            </div>
            {(s.passage || s.extract) && (
              <details className="group mb-6">
                <summary className="cursor-pointer text-[12.5px] text-fg-3 hover:text-fg-2">{s.extract ? 'Show extract' : 'Show passage'}</summary>
                <div className="mt-3">
                  <PassageCard passage={s.passage} extract={s.extract} />
                </div>
              </details>
            )}
            <ol className="space-y-4">
              {s.questions.map((q) => (
                <ReviewItem key={q.id} n={numbers.get(q.id)!} q={q} r={result.questions[q.id]} value={attempt.answers[q.id] ?? ''} />
              ))}
            </ol>
          </section>
        ))}
      </div>
    </Page>
  )
}

function ReviewItem({ n, q, r, value }: { n: number; q: TestQuestion; r: QuestionResult; value: string }) {
  const full = r.score >= q.marks
  const none = r.score === 0
  const tone = full ? 'good' : none ? 'warn' : 'default'
  return (
    <li className="rounded-xl border border-line bg-ink-1 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className={cn('mt-0.5 grid size-6 shrink-0 place-items-center rounded-full', full ? 'bg-good/15 text-good' : none ? 'bg-warn/15 text-warn' : 'bg-ink-3 text-fg-2')}>
          {full ? <Check size={13} /> : none ? <X size={13} /> : <span className="font-mono text-[10px]">½</span>}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <p className="text-[14px] leading-relaxed text-fg">
              <span className="mr-2 font-mono text-[12px] text-fg-3">{n}.</span>
              {q.prompt}
            </p>
            <Pill tone={tone as 'good' | 'warn' | 'default'} className="shrink-0 tabular-nums">
              {fmt(r.score)}/{q.marks}
              {q.kind === 'written' && <span className="opacity-60">est.</span>}
            </Pill>
          </div>

          {q.kind === 'mcq' && (
            <div className="mt-3 space-y-1 text-[13px]">
              {q.options.map((o, i) => {
                const picked = value === String(i)
                const right = i === q.answer
                if (!picked && !right) return null
                return (
                  <div key={i} className={cn('flex items-center gap-2', right ? 'text-good' : 'text-warn')}>
                    {right ? <Check size={13} /> : <X size={13} />}
                    <span>
                      ({String.fromCharCode(97 + i)}) {o}
                    </span>
                    <span className="text-[11.5px] text-fg-3">{picked && right ? 'your answer' : picked ? 'your answer' : 'correct answer'}</span>
                  </div>
                )
              })}
              {!r.answered && <div className="text-[12.5px] text-fg-3">Not answered</div>}
              {q.explain && !r.correct && <p className="pt-1 text-[12.5px] text-fg-3">{q.explain}</p>}
            </div>
          )}

          {q.kind === 'fill' && (
            <div className="mt-3 space-y-1 text-[13px]">
              <div className={r.correct ? 'text-good' : 'text-fg-2'}>Your answer: {value.trim() || <span className="text-fg-3">not answered</span>}</div>
              {!r.correct && <div className="text-good">Correct: {q.accept[0]}</div>}
            </div>
          )}

          {q.kind === 'written' && (
            <div className="mt-3 space-y-3">
              {value.trim() ? (
                <p className="rounded-lg border border-line bg-ink-0 px-3.5 py-3 text-[13.5px] leading-relaxed whitespace-pre-wrap text-fg-2">{value}</p>
              ) : (
                <p className="text-[12.5px] text-fg-3">Not answered</p>
              )}
              {r.points && r.points.length > 0 && (
                <div>
                  <div className="mb-1.5 text-[11.5px] font-medium text-fg-3">Key points</div>
                  <ul className="flex flex-wrap gap-1.5">
                    {r.points.map((p) => (
                      <li key={p.label} className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12px]', p.hit ? 'border-good/30 text-good' : 'border-line-2 text-fg-3')}>
                        {p.hit ? <Check size={11} /> : <X size={11} />} {p.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {r.answered && r.checks && r.checks.length > 0 && (
                <div>
                  <div className="mb-1.5 text-[11.5px] font-medium text-fg-3">Format & mechanics</div>
                  <ul className="grid gap-x-6 gap-y-1 text-[12.5px] sm:grid-cols-2">
                    {r.checks.map((c) => (
                      <li key={c.label} className={cn('flex items-start gap-1.5', c.ok ? 'text-fg-2' : 'text-warn')}>
                        {c.ok ? <Check size={12} className="mt-0.5 shrink-0 text-good" /> : <CircleAlert size={12} className="mt-0.5 shrink-0" />}
                        <span>
                          {c.label}
                          {c.detail && <span className="text-fg-3"> — {c.detail}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {r.spelling && r.spelling.length > 0 && (
                <div className="text-[12.5px]">
                  <span className="font-medium text-fg-3">Check spelling: </span>
                  <span className="text-warn">{r.spelling.join(', ')}</span>
                </div>
              )}
              {q.model && (
                <div className="text-[12.5px]">
                  <span className="font-medium text-fg-3">Model: </span>
                  <span className="text-fg-2">{q.model}</span>
                </div>
              )}
              {!r.answered && <span className="text-[11.5px] text-fg-3">{marksLabel(q.marks)}</span>}
            </div>
          )}
        </div>
      </div>
    </li>
  )
}
