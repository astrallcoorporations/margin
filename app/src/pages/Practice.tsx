import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { DIFFICULTY_LABEL, getResource, orderedSteps, subject, TASK_TYPE_LABEL } from '@/lib/data'
import { useStore } from '@/lib/storage'
import { cn } from '@/lib/utils'
import type { TaskType } from '@/types'
import { Page, PageHeader } from '@/components/blocks'
import { Code, Empty, Pill } from '@/components/ui'

const STATUS = ['all', 'todo', 'draft', 'done'] as const
type Status = (typeof STATUS)[number]
const STATUS_LABEL: Record<Status, string> = { all: 'All', todo: 'Not started', draft: 'In progress', done: 'Completed' }

export default function Practice() {
  const [params, setParams] = useSearchParams()
  const type = (params.get('type') ?? 'all') as TaskType | 'all'
  const status = (params.get('status') ?? 'all') as Status
  const step = params.get('step') ?? 'all'
  const answers = useStore((s) => s.answers)

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params)
    if (v === 'all') next.delete(k)
    else next.set(k, v)
    setParams(next, { replace: true })
  }

  const types = useMemo(() => {
    const seen = new Set(subject.tasks.map((t) => t.type))
    return (Object.keys(TASK_TYPE_LABEL) as TaskType[]).filter((t) => seen.has(t))
  }, [])

  const filtered = subject.tasks.filter((t) => {
    const a = answers[t.id]
    const st: Status = a?.status === 'done' ? 'done' : a?.text?.trim() ? 'draft' : 'todo'
    const r = getResource(t.resourceId)
    return (type === 'all' || t.type === type) && (status === 'all' || st === status) && (step === 'all' || r?.stepId === step)
  })

  const groups = orderedSteps
    .map((s) => ({ step: s, tasks: filtered.filter((t) => getResource(t.resourceId)?.stepId === s.id) }))
    .filter((g) => g.tasks.length)

  const done = subject.tasks.filter((t) => answers[t.id]?.status === 'done').length

  return (
    <Page wide>
      <PageHeader
        eyebrow="Practice"
        title="Tasks"
        lede="Questions from your worksheets and sample papers. Write your answer, then copy it with the question into any AI (ChatGPT, Claude, Gemini…) for review."
        aside={
          <div className="text-right">
            <div className="font-mono text-[11px] tracking-wide text-fg-3 uppercase">Completed</div>
            <div className="mt-1 text-[22px] font-semibold tracking-[-0.03em] tabular-nums">
              {done}
              <span className="text-fg-3">/{subject.tasks.length}</span>
            </div>
          </div>
        }
      />

      <div className="mb-8 space-y-3">
        <FilterRow label="Type" value={type} options={[['all', 'All'], ...types.map((t) => [t, TASK_TYPE_LABEL[t]] as [string, string])]} onChange={(v) => setParam('type', v)} />
        <FilterRow label="Step" value={step} options={[['all', 'All'], ...orderedSteps.map((s) => [s.id, s.label] as [string, string])]} onChange={(v) => setParam('step', v)} />
        <FilterRow label="Status" value={status} options={STATUS.map((s) => [s, STATUS_LABEL[s]] as [string, string])} onChange={(v) => setParam('status', v)} />
      </div>

      {groups.length === 0 ? (
        <Empty
          title="No tasks match these filters"
          action={
            <button className="text-[13px] text-accent hover:underline" onClick={() => setParams({}, { replace: true })}>
              Clear filters
            </button>
          }
        />
      ) : (
        <div className="space-y-10">
          {groups.map(({ step: s, tasks }) => (
            <section key={s.id} aria-labelledby={`p-${s.id}`}>
              <div className="mb-3 flex items-baseline justify-between border-b border-line pb-2">
                <h2 id={`p-${s.id}`} className="text-[14px] font-semibold tracking-[-0.01em] text-fg">
                  {s.label}
                  {s.note && <span className="font-normal text-accent"> · {s.note}</span>}
                </h2>
                <span className="font-mono text-[11px] text-fg-3 tabular-nums">{tasks.length}</span>
              </div>
              <ul className="-mx-2.5">
                {tasks.map((t) => {
                  const r = getResource(t.resourceId)!
                  const a = answers[t.id]
                  return (
                    <li key={t.id}>
                      <Link to={`/practice/${t.id}`} className="group flex items-center gap-3 rounded-md px-2.5 py-2.5 transition-colors hover:bg-ink-3">
                        <Code>{r.code}</Code>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] text-fg">{t.title}</span>
                          <span className="block truncate text-[11.5px] text-fg-3">
                            {r.title} · {TASK_TYPE_LABEL[t.type]}
                          </span>
                        </span>
                        <span className={cn('hidden w-14 text-right text-[11.5px] sm:block', t.difficulty === 'hard' ? 'text-fg-2' : 'text-fg-3')}>
                          {DIFFICULTY_LABEL[t.difficulty]}
                        </span>
                        <span className="w-20 text-right">
                          {a?.status === 'done' ? (
                            <Pill tone={a.rating === 'needs-work' ? 'warn' : 'good'}>{a.rating === 'needs-work' ? 'Needs work' : 'Done'}</Pill>
                          ) : a?.text?.trim() ? (
                            <Pill>Draft</Pill>
                          ) : null}
                        </span>
                        <ChevronRight size={14} className="shrink-0 text-fg-3 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Page>
  )
}

function FilterRow({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-12 shrink-0 pt-1.5 text-[11.5px] text-fg-3">{label}</span>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {options.map(([v, l]) => (
          <button
            key={v}
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className={cn(
              'h-7 rounded-none border px-2.5 text-[12.5px] transition-colors',
              value === v ? 'border-accent/40 bg-accent/[0.08] text-fg' : 'border-line-2 text-fg-2 hover:border-[#3a3a3a] hover:text-fg',
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}
