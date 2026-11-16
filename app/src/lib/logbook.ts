import { useSyncExternalStore } from 'react'
import { readLocal, writeLocal } from './persist'

/**
 * The logbook: what to do this week, three working goals per step, and reflections.
 * Kept on this device like the rest of Margin's progress (localStorage, one versioned key).
 */

export interface Goal {
  id: string
  subject: string
  step: string
  text: string
  done: boolean
  at: number
}
export interface PlanItem {
  id: string
  text: string
  done: boolean
}
export interface Reflection {
  id: string
  at: number
  week: string
  subject: string
  step: string
  good: string
  hard: string
  next: string
}
export interface LogbookState {
  goals: Goal[]
  /** Week (Monday as yyyy-mm-dd) -> what to do that week */
  weeks: Record<string, PlanItem[]>
  reflections: Reflection[]
}

export const GOALS_PER_STEP = 3
const KEY = 'margin-logbook-v1'
const empty: LogbookState = { goals: [], weeks: {}, reflections: [] }

function load(): LogbookState {
  try {
    const raw = readLocal(KEY)
    if (raw) return { ...empty, ...JSON.parse(raw) }
  } catch {
    /* damaged copy: start clean rather than crash */
  }
  return empty
}

let state: LogbookState = load()
const subs = new Set<() => void>()
const set = (next: LogbookState) => {
  state = next
  writeLocal(KEY, JSON.stringify(state))
  subs.forEach((f) => f())
}
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export const useLogbook = () =>
  useSyncExternalStore(
    (f) => {
      subs.add(f)
      return () => subs.delete(f)
    },
    () => state,
  )

/** Monday of the week that contains d, as yyyy-mm-dd in local time. */
export function weekKey(d: Date = new Date()): string {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
export function shiftWeek(key: string, by: number): string {
  const [y, m, d] = key.split('-').map(Number)
  return weekKey(new Date(y, m - 1, d + by * 7))
}
export function weekLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  const a = new Date(y, m - 1, d)
  const b = new Date(y, m - 1, d + 6)
  const f = (x: Date) => x.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${f(a)} to ${f(b)}`
}

export const goalsFor = (s: LogbookState, subject: string, step: string) => s.goals.filter((g) => g.subject === subject && g.step === step)

export const logbook = {
  /** Returns false when the step already has its three goals. */
  addGoal(subject: string, step: string, text: string): boolean {
    const t = text.trim()
    if (!t || !subject || !step) return false
    if (goalsFor(state, subject, step).length >= GOALS_PER_STEP) return false
    set({ ...state, goals: [...state.goals, { id: uid(), subject, step, text: t.slice(0, 300), done: false, at: Date.now() }] })
    return true
  },
  toggleGoal: (id: string) => set({ ...state, goals: state.goals.map((g) => (g.id === id ? { ...g, done: !g.done } : g)) }),
  editGoal: (id: string, text: string) => set({ ...state, goals: state.goals.map((g) => (g.id === id ? { ...g, text: text.trim().slice(0, 300) || g.text } : g)) }),
  removeGoal: (id: string) => set({ ...state, goals: state.goals.filter((g) => g.id !== id) }),

  addPlan(week: string, text: string) {
    const t = text.trim()
    if (!t) return
    set({ ...state, weeks: { ...state.weeks, [week]: [...(state.weeks[week] ?? []), { id: uid(), text: t.slice(0, 300), done: false }] } })
  },
  togglePlan: (week: string, id: string) => set({ ...state, weeks: { ...state.weeks, [week]: (state.weeks[week] ?? []).map((p) => (p.id === id ? { ...p, done: !p.done } : p)) } }),
  removePlan: (week: string, id: string) => set({ ...state, weeks: { ...state.weeks, [week]: (state.weeks[week] ?? []).filter((p) => p.id !== id) } }),

  addReflection(r: Omit<Reflection, 'id' | 'at'>) {
    if (!r.good.trim() && !r.hard.trim() && !r.next.trim()) return false
    set({ ...state, reflections: [{ ...r, id: uid(), at: Date.now() }, ...state.reflections] })
    return true
  },
  removeReflection: (id: string) => set({ ...state, reflections: state.reflections.filter((r) => r.id !== id) }),
}

/** The whole logbook as plain text, to paste into a document or an email to a teacher. */
export function logbookText(s: LogbookState, week: string): string {
  const out: string[] = ['LOGBOOK', '']
  const plan = s.weeks[week] ?? []
  out.push(`EVALUATION: week of ${weekLabel(week)}`, 'What I will do this week:')
  out.push(...(plan.length ? plan.map((p) => `  [${p.done ? 'x' : ' '}] ${p.text}`) : ['  (nothing added)']), '')
  out.push('Working goals')
  const groups = new Map<string, Goal[]>()
  s.goals.forEach((g) => groups.set(`${g.subject} | ${g.step}`, [...(groups.get(`${g.subject} | ${g.step}`) ?? []), g]))
  if (!groups.size) out.push('  (none yet)')
  groups.forEach((list, k) => {
    out.push(`  ${k.replace(' | ', ', ')}`)
    list.forEach((g, i) => out.push(`    ${i + 1}. [${g.done ? 'x' : ' '}] ${g.text}`))
  })
  out.push('', 'REFLECTION')
  const refl = s.reflections.filter((r) => r.week === week)
  if (!refl.length) out.push('  (none this week)')
  refl.forEach((r) => {
    out.push(`  ${r.subject}${r.step ? `, ${r.step}` : ''}`)
    if (r.good.trim()) out.push(`    What went well: ${r.good.trim()}`)
    if (r.hard.trim()) out.push(`    What was hard: ${r.hard.trim()}`)
    if (r.next.trim()) out.push(`    What I will do differently: ${r.next.trim()}`)
  })
  return out.join('\n')
}
