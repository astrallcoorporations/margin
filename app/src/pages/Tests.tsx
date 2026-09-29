import { Link } from 'react-router-dom'
import { ArrowRight, Clock, FileCheck2, History } from 'lucide-react'
import { tests, testMarks, testQuestions, getTest } from '@/data/english/tests'
import { useStore } from '@/lib/storage'
import { timeAgo } from '@/lib/utils'
import { Page, PageHeader } from '@/components/blocks'
import { Empty, Pill } from '@/components/ui'

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)

export default function Tests() {
  const attempts = useStore((s) => s.attempts)
  const drafts = useStore((s) => s.testDrafts)
  const papers = tests.filter((t) => t.kind === 'paper')
  const sheets = tests.filter((t) => t.kind === 'worksheet')

  const best = (testId: string) => attempts.filter((a) => a.testId === testId).sort((a, b) => b.score / b.total - a.score / a.total)[0]

  return (
    <Page wide>
      <PageHeader
        eyebrow="Tests"
        title="Mock papers & worksheets"
        lede="Sit a full paper on the SA1 pattern or a quick grammar worksheet. Multiple-choice and one-word answers are marked exactly; written answers get an estimate from key points, format, word count and spelling — then you can send them to an AI for a proper mark."
      />

      <section aria-labelledby="papers-h" className="mb-12">
        <h2 id="papers-h" className="eyebrow mb-4">SA1 mock papers</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {papers.map((t) => {
            const b = best(t.id)
            const draft = drafts[t.id]
            const sections = t.sections.length
            return (
              <Link
                key={t.id}
                to={`/tests/${t.id}`}
                className="group relative overflow-hidden rounded-none border border-[#232323] bg-[linear-gradient(145deg,rgba(17,17,17,0.92),rgba(12,12,12,0.94))] p-6 card-hover"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[19px] font-bold tracking-[-0.025em] text-fg">{t.title}</div>
                    <p className="mt-1.5 max-w-[42ch] text-[13px] leading-relaxed text-fg-3">{t.description}</p>
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center rounded-none border border-[#2a2a2a] bg-[#161616] text-accent">
                    <FileCheck2 size={17} />
                  </span>
                </div>
                <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-[#232323] pt-4 text-[12px]">
                  <div>
                    <dt className="text-fg-3">Marks</dt>
                    <dd className="mt-1 text-[15px] font-semibold text-fg tabular-nums">{testMarks(t)}</dd>
                  </div>
                  <div>
                    <dt className="text-fg-3">Questions</dt>
                    <dd className="mt-1 text-[15px] font-semibold text-fg tabular-nums">
                      {testQuestions(t).length}
                      <span className="ml-1 text-[11px] font-normal text-fg-3">in {sections} parts</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-fg-3">{b ? 'Best' : 'Time'}</dt>
                    <dd className="mt-1 text-[15px] font-semibold text-fg tabular-nums">{b ? `${pct(b.score, b.total)}%` : `${t.minutes / 60} h`}</dd>
                  </div>
                </dl>
                <div className="mt-5 flex items-center gap-1.5 text-[13px] font-medium text-accent">
                  {draft ? 'Continue where you left off' : b ? 'Sit again' : 'Start paper'}
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="ws-h" className="mb-12">
        <h2 id="ws-h" className="eyebrow mb-4">Grammar worksheets · auto-marked</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sheets.map((t) => {
            const b = best(t.id)
            return (
              <Link key={t.id} to={`/tests/${t.id}`} className="group rounded-xl border border-line bg-ink-1 p-4 transition-colors hover:border-line-2 hover:bg-ink-2">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-semibold tracking-[-0.015em] text-fg">{t.title}</span>
                  {b && <Pill tone={b.score / b.total >= 0.8 ? 'good' : b.score / b.total >= 0.5 ? 'default' : 'warn'}>{pct(b.score, b.total)}%</Pill>}
                </div>
                <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-fg-3">{t.description}</p>
                <div className="mt-3 flex items-center gap-3 text-[11.5px] text-fg-3">
                  <span>{testQuestions(t).length} questions</span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {t.minutes} min
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="hist-h">
        <h2 id="hist-h" className="eyebrow mb-4">Your attempts</h2>
        {attempts.length ? (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {attempts.slice(0, 12).map((a) => {
              const t = getTest(a.testId)
              if (!t) return null
              const p = pct(a.score, a.total)
              return (
                <li key={a.id}>
                  <Link to={`/tests/${a.testId}/results/${a.id}`} className="flex items-center gap-4 bg-ink-1 px-4 py-3 transition-colors hover:bg-ink-2">
                    <History size={14} className="shrink-0 text-fg-3" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] text-fg">{t.title}</span>
                      <span className="block text-[11.5px] text-fg-3">{timeAgo(a.submittedAt)}</span>
                    </span>
                    <span className="text-right">
                      <span className="block text-[14px] font-semibold text-fg tabular-nums">
                        {a.score}/{a.total}
                      </span>
                      <span className={p >= 80 ? 'text-[11.5px] text-good' : p >= 50 ? 'text-[11.5px] text-fg-3' : 'text-[11.5px] text-warn'}>{p}%</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <Empty title="No attempts yet">Your marked papers and worksheets appear here, so you can come back and review them.</Empty>
        )}
      </section>
    </Page>
  )
}
