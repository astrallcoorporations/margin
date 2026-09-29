import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { subject } from '@/lib/data'
import { actions, useStore } from '@/lib/storage'
import { cn } from '@/lib/utils'

export function daysUntil(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}

export function countdownLabel(days: number) {
  if (days < 0) return 'Done'
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `In ${days} days`
}

export const examItems = () =>
  (subject.exam?.syllabus ?? []).flatMap((g) => g.items.map((i) => ({ ...i, key: `${g.label}:${i.label}`, group: g.label })))

/** The exam syllabus as a grouped checklist; every item has a Go button to its page. */
export function ExamPanel() {
  const exam = subject.exam
  const revised = useStore((s) => s.revised)
  if (!exam) return null
  const days = daysUntil(exam.date)
  const items = examItems()
  const done = items.filter((i) => revised[i.key]).length
  const date = new Date(exam.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <section
      aria-labelledby="exam-h"
      className="overflow-hidden rounded-none border border-[#2e2e2e] bg-[linear-gradient(145deg,rgba(17,17,17,0.95),rgba(12,12,12,0.96))]"
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 border-b border-[#232323] bg-[linear-gradient(90deg,rgba(255,213,0,0.05),transparent_70%)] px-5 py-5 sm:px-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span className={cn('px-2.5 py-1 text-[11.5px] font-semibold', days <= 1 && days >= 0 ? 'bg-warn/15 text-warn' : 'bg-accent/15 text-accent')}>
              {countdownLabel(days)}
            </span>
            <span className="text-[12.5px] text-fg-3">{date}</span>
          </div>
          <h2 id="exam-h" className="mt-2 text-[20px] font-bold tracking-[-0.025em] text-fg">
            What’s in the exam
          </h2>
        </div>
        <div className="w-full sm:w-52">
          <div className="flex justify-between text-[11.5px] text-fg-3">
            <span>Revised</span>
            <span className="tabular-nums">
              {done}/{items.length}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${(done / items.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="grid gap-x-8 gap-y-7 px-4 py-6 sm:px-5 md:grid-cols-2">
        {exam.syllabus.map((g) => (
          <div key={g.label}>
            <h3 className="mb-1.5 px-2 text-[12px] font-semibold tracking-[0.02em] text-fg-3">{g.label}</h3>
            <ul>
              {g.items.map((i) => {
                const key = `${g.label}:${i.label}`
                const on = Boolean(revised[key])
                return (
                  <li key={key} className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-[#171717]">
                    <button
                      onClick={() => actions.toggleRevised(key)}
                      role="checkbox"
                      aria-checked={on}
                      aria-label={`Mark ${i.label} as revised`}
                      className={cn(
                        'grid size-[18px] shrink-0 place-items-center rounded-none border transition-colors',
                        on ? 'border-accent bg-accent text-ink-0' : 'border-line-2 hover:border-fg-3',
                      )}
                    >
                      {on && <Check size={12} strokeWidth={3} />}
                    </button>
                    <span className={cn('min-w-0 flex-1 truncate text-[14px]', on ? 'text-fg-3 line-through decoration-fg-3/40' : 'text-fg')}>
                      {i.label}
                      {!i.resourceId && <span className="ml-1.5 text-[11px] text-fg-3 no-underline">no notes yet</span>}
                    </span>
                    {i.resourceId && (
                      <Link
                        to={`/learn/${i.resourceId}`}
                        className="flex shrink-0 items-center gap-1 rounded-md border border-[#2a2a2a] bg-[#161616] px-2.5 py-1 text-[12px] font-medium text-fg-2 transition-colors hover:border-accent/40 hover:text-fg"
                        aria-label={`Go to ${i.label}`}
                      >
                        Go <ArrowRight size={12} />
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
