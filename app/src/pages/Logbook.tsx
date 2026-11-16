import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Copy, Plus, Printer, Trash2, X } from 'lucide-react'
import { subjects } from '@/data/catalog'
import { fetchClassroom } from '@/lib/vex'
import { GOALS_PER_STEP, goalsFor, logbook, logbookText, shiftWeek, useLogbook, weekKey, weekLabel } from '@/lib/logbook'
import { copyText } from '@/lib/clipboard'
import { cn } from '@/lib/utils'
import { Page, PageHeader } from '@/components/blocks'
import { useVex } from '@/components/Vex'
import { useToast } from '@/components/toast'
import { Button } from '@/components/ui'

type Tab = 'evaluation' | 'reflection'
const OTHER = '__other'

const field =
  'h-10 w-full min-w-0 border border-line-2 bg-ink-1 px-3 text-[14px] text-fg placeholder:text-fg-3 focus:border-accent/60 focus:outline-none'

/** Subjects and their steps for the quick-add: Margin's own subjects, then every Classroom course with its topics. */
function useChoices() {
  const { session } = useVex()
  const [classroom, setClassroom] = useState<{ name: string; steps: string[] }[]>([])
  useEffect(() => {
    if (session.state !== 'signedin') return
    fetchClassroom()
      .then((d) => {
        const by = new Map<string, Map<string, number>>()
        d.courses.forEach((c) => by.set(c.name, new Map()))
        ;[...d.stream, ...d.items].forEach((p) => {
          if (p.topic && by.has(p.course)) by.get(p.course)!.set(p.topic, (by.get(p.course)!.get(p.topic) || 0) + 1)
        })
        setClassroom([...by.entries()].map(([name, t]) => ({ name, steps: [...t.keys()].sort((a, b) => b.localeCompare(a, undefined, { numeric: true })) })))
      })
      .catch(() => setClassroom([]))
  }, [session.state])
  return useMemo(() => {
    const out: { name: string; steps: string[] }[] = []
    const used = new Set<string>()
    classroom.forEach((c) => {
      out.push(c)
      subjects.forEach((s) => c.name.toLowerCase().includes(s.name.toLowerCase().replace(/s$/, '')) && used.add(s.id))
    })
    subjects.filter((s) => !used.has(s.id)).forEach((s) => out.unshift({ name: s.name, steps: [...s.steps].sort((a, b) => b.order - a.order).map((x) => x.label) }))
    return out
  }, [classroom])
}

export default function Logbook() {
  const [tab, setTab] = useState<Tab>('evaluation')
  const [week, setWeek] = useState(weekKey())
  const s = useLogbook()
  const notify = useToast()
  const thisWeek = weekKey()

  return (
    <Page wide>
      <PageHeader
        eyebrow="Logbook"
        title="Evaluation and reflection"
        lede="Add what you will do this week and three working goals per step without opening each subject. Kept on this device."
        aside={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                const ok = await copyText(logbookText(s, week))
                notify(ok ? 'Logbook copied as text' : 'Couldn’t copy', ok ? undefined : 'error')
              }}
            >
              <Copy size={12} /> Copy as text
            </Button>
            <Button size="sm" variant="ghost" onClick={() => window.print()}>
              <Printer size={12} /> Print
            </Button>
          </div>
        }
      />

      <div className="mb-8 flex flex-wrap items-center gap-4 border-b border-line print:hidden" role="tablist">
        {(['evaluation', 'reflection'] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn('-mb-px border-b-2 pr-2 pb-3 font-mono text-[11.5px] tracking-[0.08em] uppercase transition-colors', tab === t ? 'border-accent text-fg' : 'border-transparent text-fg-3 hover:text-fg')}
          >
            {t === 'evaluation' ? 'Evaluation' : 'Reflection'}
          </button>
        ))}
        <div className="mr-1 mb-2 ml-auto flex items-center gap-1">
          <button onClick={() => setWeek(shiftWeek(week, -1))} className="grid size-8 place-items-center text-fg-3 hover:text-fg" aria-label="Previous week">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setWeek(thisWeek)} className="min-w-[150px] px-2 text-center font-mono text-[12px] text-fg-2 hover:text-fg" title="Go to this week">
            {week === thisWeek ? 'This week · ' : ''}
            {weekLabel(week)}
          </button>
          <button onClick={() => setWeek(shiftWeek(week, 1))} className="grid size-8 place-items-center text-fg-3 hover:text-fg" aria-label="Next week">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {tab === 'evaluation' ? <Evaluation week={week} /> : <Reflection week={week} />}
    </Page>
  )
}

/* ---------------- evaluation: the week's plan and three goals per step ---------------- */
function Evaluation({ week }: { week: string }) {
  const s = useLogbook()
  const plan = s.weeks[week] ?? []
  const [text, setText] = useState('')
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <section>
        <h2 className="mb-1 font-pixel text-[12px] tracking-[0.08em] text-fg uppercase">What I will do this week</h2>
        <p className="mb-4 text-[13px] text-fg-3">Short, specific things. Tick them off as you go.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            logbook.addPlan(week, text)
            setText('')
          }}
          className="mb-4 flex gap-2 print:hidden"
        >
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="For example: finish the Step 26 learning check" className={field} aria-label="Add something to do this week" />
          <Button type="submit" variant="primary" disabled={!text.trim()}>
            <Plus size={14} /> Add
          </Button>
        </form>
        {plan.length === 0 ? (
          <p className="border border-dashed border-line-2 px-4 py-6 text-[13px] text-fg-3">Nothing planned for this week yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {plan.map((p) => (
              <li key={p.id} className="group flex items-start gap-3 border border-line bg-ink-1 px-3.5 py-2.5">
                <Tick on={p.done} onClick={() => logbook.togglePlan(week, p.id)} label={p.text} />
                <span className={cn('min-w-0 flex-1 text-[14px] leading-snug', p.done ? 'text-fg-3 line-through' : 'text-fg')}>{p.text}</span>
                <button onClick={() => logbook.removePlan(week, p.id)} className="text-fg-3 opacity-0 transition-opacity group-hover:opacity-100 hover:text-fg focus:opacity-100 print:hidden" aria-label={`Remove ${p.text}`}>
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Goals />
    </div>
  )
}

function Goals() {
  const s = useLogbook()
  const choices = useChoices()
  const [subject, setSubject] = useState('')
  const [step, setStep] = useState('')
  const [custom, setCustom] = useState('')
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  const chosen = choices.find((c) => c.name === subject) ?? choices[0]
  const subj = chosen?.name ?? ''
  const stepName = step === OTHER ? custom.trim() : step || chosen?.steps[0] || ''
  const used = subj && stepName ? goalsFor(s, subj, stepName).length : 0

  const groups = useMemo(() => {
    const m = new Map<string, typeof s.goals>()
    s.goals.forEach((g) => m.set(`${g.subject}\u0000${g.step}`, [...(m.get(`${g.subject}\u0000${g.step}`) ?? []), g]))
    return [...m.entries()]
  }, [s.goals])

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    if (!logbook.addGoal(subj, stepName, text)) {
      setError(used >= GOALS_PER_STEP ? `That step already has ${GOALS_PER_STEP} goals. Finish or delete one first.` : 'Pick a subject and step, then write the goal.')
      return
    }
    setError('')
    setText('')
  }

  return (
    <section>
      <h2 className="mb-1 font-pixel text-[12px] tracking-[0.08em] text-fg uppercase">Working goals</h2>
      <p className="mb-4 text-[13px] text-fg-3">Three for each step: what you want to achieve in it.</p>

      <form onSubmit={add} className="mb-6 space-y-2 border border-line-2 bg-ink-1 p-3 print:hidden">
        <div className="grid gap-2 sm:grid-cols-2">
          <select value={subj} onChange={(e) => { setSubject(e.target.value); setStep('') }} className={field} aria-label="Subject">
            {choices.length === 0 && <option value="">Loading subjects…</option>}
            {choices.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <select value={step === OTHER ? OTHER : stepName} onChange={(e) => setStep(e.target.value)} className={field} aria-label="Step">
            {(chosen?.steps ?? []).map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
            <option value={OTHER}>Another step…</option>
          </select>
        </div>
        {step === OTHER && <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Step name, for example Step 27" className={field} aria-label="Step name" />}
        <div className="flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="A specific goal, for example: get 8 of 10 right on percentage change" className={field} aria-label="Working goal" />
          <Button type="submit" variant="primary" disabled={!text.trim() || used >= GOALS_PER_STEP}>
            <Plus size={14} /> Add
          </Button>
        </div>
        <p className={cn('text-[12px]', error ? 'text-warn' : 'text-fg-3')} aria-live="polite">
          {error || (subj && stepName ? `${subj}, ${stepName}: ${used} of ${GOALS_PER_STEP} goals` : 'Choose a subject and step.')}
        </p>
      </form>

      {groups.length === 0 ? (
        <p className="border border-dashed border-line-2 px-4 py-6 text-[13px] text-fg-3">No working goals yet. Add up to three for any step above.</p>
      ) : (
        <ul className="space-y-4">
          {groups.map(([k, list]) => {
            const [sj, st] = k.split('\u0000')
            return (
              <li key={k} className="border border-line bg-ink-1">
                <div className="flex items-baseline gap-2 border-b border-line px-3.5 py-2.5">
                  <span className="text-[14px] font-medium text-fg">{sj}</span>
                  <span className="font-mono text-[11.5px] text-fg-3">{st}</span>
                  <span className="ml-auto font-mono text-[11px] text-fg-3 tabular-nums">
                    {list.filter((g) => g.done).length}/{list.length} done
                  </span>
                </div>
                <ol className="divide-y divide-line">
                  {list.map((g, i) => (
                    <li key={g.id} className="group flex items-start gap-3 px-3.5 py-2.5">
                      <span className="w-4 shrink-0 pt-0.5 font-mono text-[11px] text-fg-3">{i + 1}</span>
                      <Tick on={g.done} onClick={() => logbook.toggleGoal(g.id)} label={g.text} />
                      <GoalText id={g.id} text={g.text} done={g.done} />
                      <button onClick={() => logbook.removeGoal(g.id)} className="text-fg-3 opacity-0 transition-opacity group-hover:opacity-100 hover:text-fg focus:opacity-100 print:hidden" aria-label={`Delete goal: ${g.text}`}>
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ol>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function GoalText({ id, text, done }: { id: string; text: string; done: boolean }) {
  const [edit, setEdit] = useState(false)
  const [v, setV] = useState(text)
  if (edit)
    return (
      <input
        autoFocus
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          logbook.editGoal(id, v)
          setEdit(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          if (e.key === 'Escape') {
            setV(text)
            setEdit(false)
          }
        }}
        className="min-w-0 flex-1 border-b border-accent/60 bg-transparent text-[14px] text-fg focus:outline-none"
      />
    )
  return (
    <button onClick={() => { setV(text); setEdit(true) }} className={cn('min-w-0 flex-1 text-left text-[14px] leading-snug', done ? 'text-fg-3 line-through' : 'text-fg')} title="Click to edit">
      {text}
    </button>
  )
}

function Tick({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      role="checkbox"
      aria-checked={on}
      aria-label={`Mark done: ${label}`}
      className={cn('mt-0.5 grid size-[18px] shrink-0 place-items-center border transition-colors', on ? 'border-accent bg-accent text-black' : 'border-line-2 hover:border-fg-3')}
    >
      {on && <Check size={12} strokeWidth={3} />}
    </button>
  )
}

/* ---------------- reflection ---------------- */
function Reflection({ week }: { week: string }) {
  const s = useLogbook()
  const choices = useChoices()
  const [subject, setSubject] = useState('')
  const [step, setStep] = useState('')
  const [good, setGood] = useState('')
  const [hard, setHard] = useState('')
  const [next, setNext] = useState('')
  const chosen = choices.find((c) => c.name === subject) ?? choices[0]
  const list = s.reflections.filter((r) => r.week === week)
  const area = 'min-h-[84px] w-full resize-y border border-line-2 bg-ink-1 px-3 py-2.5 text-[14px] leading-relaxed text-fg placeholder:text-fg-3 focus:border-accent/60 focus:outline-none'

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)]">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (logbook.addReflection({ week, subject: chosen?.name ?? 'General', step, good, hard, next })) {
            setGood('')
            setHard('')
            setNext('')
          }
        }}
        className="space-y-3 print:hidden"
      >
        <h2 className="font-pixel text-[12px] tracking-[0.08em] text-fg uppercase">Reflect on {weekLabel(week)}</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <select value={chosen?.name ?? ''} onChange={(e) => { setSubject(e.target.value); setStep('') }} className={field} aria-label="Subject">
            {choices.map((c) => (
              <option key={c.name}>{c.name}</option>
            ))}
          </select>
          <select value={step} onChange={(e) => setStep(e.target.value)} className={field} aria-label="Step">
            <option value="">Whole subject</option>
            {(chosen?.steps ?? []).map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
        <label className="block text-[13px] text-fg-2">
          What went well
          <textarea value={good} onChange={(e) => setGood(e.target.value)} className={cn(area, 'mt-1')} placeholder="Something you understood or finished" />
        </label>
        <label className="block text-[13px] text-fg-2">
          What was hard
          <textarea value={hard} onChange={(e) => setHard(e.target.value)} className={cn(area, 'mt-1')} placeholder="Where you got stuck, and why" />
        </label>
        <label className="block text-[13px] text-fg-2">
          What I will do differently
          <textarea value={next} onChange={(e) => setNext(e.target.value)} className={cn(area, 'mt-1')} placeholder="One change for next week" />
        </label>
        <Button type="submit" variant="primary" disabled={!good.trim() && !hard.trim() && !next.trim()}>
          <Plus size={14} /> Save reflection
        </Button>
      </form>

      <section>
        <h2 className="mb-4 font-pixel text-[12px] tracking-[0.08em] text-fg uppercase">This week’s reflections</h2>
        {list.length === 0 ? (
          <p className="border border-dashed border-line-2 px-4 py-6 text-[13px] text-fg-3">No reflections for this week yet.</p>
        ) : (
          <ul className="space-y-3">
            {list.map((r) => (
              <li key={r.id} className="group border border-line bg-ink-1 p-4">
                <div className="flex items-baseline gap-2 text-[12px] text-fg-3">
                  <span className="text-[14px] font-medium text-fg">{r.subject}</span>
                  {r.step && <span className="font-mono">{r.step}</span>}
                  <button onClick={() => logbook.removeReflection(r.id)} className="ml-auto text-fg-3 opacity-0 transition-opacity group-hover:opacity-100 hover:text-fg focus:opacity-100 print:hidden" aria-label="Delete reflection">
                    <Trash2 size={14} />
                  </button>
                </div>
                {[['What went well', r.good], ['What was hard', r.hard], ['What I will do differently', r.next]].map(([h, t]) =>
                  t ? (
                    <p key={h} className="mt-2.5 text-[13.5px] leading-relaxed text-fg-2">
                      <span className="mr-2 font-mono text-[10.5px] tracking-[0.06em] text-fg-3 uppercase">{h}</span>
                      {t}
                    </p>
                  ) : null,
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
