import { useSyncExternalStore } from 'react'
import { readCookie, readIdb, readLocal, requestPersistence, writeCookie, writeIdb, writeLocal } from './persist'
import type { Flashcard } from '@/types'

/**
 * Local progress store. Everything the user does is kept in localStorage under one
 * versioned key — no account, no server. The shape is plain JSON so it can be exported,
 * imported, or later synced to a backend without changing callers.
 */

export type AnswerStatus = 'draft' | 'done'
export type SelfRating = 'solid' | 'needs-work'
export type CardStatus = 'known' | 'review'

export interface AnswerState {
  text: string
  status: AnswerStatus
  rating?: SelfRating
  updatedAt: number
}

export interface CardState {
  status: CardStatus
  seen: number
  updatedAt: number
}

export type ActivityKind = 'resource' | 'task' | 'deck' | 'file' | 'test'

export interface TestAttempt {
  id: string
  testId: string
  answers: Record<string, string>
  startedAt: number
  submittedAt: number
  score: number
  total: number
  autoScore: number
  autoTotal: number
}

export interface Activity {
  kind: ActivityKind
  id: string
  at: number
}

export interface State {
  version: 1
  profile: { name: string }
  visits: Record<string, { count: number; last: number }>
  answers: Record<string, AnswerState>
  cards: Record<string, CardState>
  customCards: Flashcard[]
  activity: Activity[]
  /** In-progress test answers, keyed by test id */
  testDrafts: Record<string, { answers: Record<string, string>; startedAt: number }>
  attempts: TestAttempt[]
  /** Exam syllabus items the student has ticked as revised */
  revised: Record<string, boolean>
  /** Last write time — used to pick the newest copy across storage layers */
  savedAt: number
}

const KEY = 'margin:v1'

const empty = (): State => ({
  version: 1,
  profile: { name: '' },
  visits: {},
  answers: {},
  cards: {},
  customCards: [],
  activity: [],
  testDrafts: {},
  attempts: [],
  revised: {},
  savedAt: 0,
})

function parse(raw: string | null): State | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<State>
    return { ...empty(), ...parsed, version: 1 }
  } catch {
    return null
  }
}

function load(): State {
  const local = parse(readLocal(KEY))
  if (local) return local
  // localStorage empty or blocked: start from the cookie essentials, IndexedDB fills in the rest below.
  const c = readCookie() as { revised?: Record<string, boolean>; name?: string; savedAt?: number } | null
  return c ? { ...empty(), revised: c.revised ?? {}, profile: { name: c.name ?? '' }, savedAt: 0 } : empty()
}

let state: State = load()
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

let idbTimer = 0
function persist() {
  const raw = JSON.stringify(state)
  writeLocal(KEY, raw)
  writeCookie({ revised: state.revised, name: state.profile.name, savedAt: state.savedAt })
  window.clearTimeout(idbTimer)
  idbTimer = window.setTimeout(() => writeIdb(KEY, raw), 300)
}

// Restore from IndexedDB if it holds a newer copy (e.g. localStorage was cleared).
if (typeof window !== 'undefined') {
  requestPersistence()
  readIdb(KEY).then((raw) => {
    const idb = parse(raw)
    if (idb && idb.savedAt > state.savedAt) {
      state = idb
      writeLocal(KEY, JSON.stringify(state))
      notify()
    } else if (!raw && state.savedAt) {
      writeIdb(KEY, JSON.stringify(state))
    }
  })
}

function set(update: (s: State) => State) {
  const next = update(state)
  if (next === state) return
  state = { ...next, savedAt: Date.now() }
  persist()
  notify()
}

// Keep tabs in sync.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      state = load()
      notify()
    }
  })
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => select(state))
}

export const getState = () => state

const logActivity = (s: State, kind: ActivityKind, id: string): Activity[] => {
  const rest = s.activity.filter((a) => !(a.kind === kind && a.id === id))
  return [{ kind, id, at: Date.now() }, ...rest].slice(0, 60)
}

export const actions = {
  visitResource(id: string) {
    // Ignore repeat visits within a few seconds (re-renders, quick back/forward).
    if (Date.now() - (state.visits[id]?.last ?? 0) < 5000) return
    set((s) => ({
      ...s,
      visits: { ...s.visits, [id]: { count: (s.visits[id]?.count ?? 0) + 1, last: Date.now() } },
      activity: logActivity(s, 'resource', id),
    }))
  },
  openFile(path: string) {
    set((s) => ({ ...s, activity: logActivity(s, 'file', path) }))
  },
  saveAnswer(taskId: string, text: string) {
    set((s) => {
      const prev = s.answers[taskId]
      return {
        ...s,
        answers: {
          ...s.answers,
          [taskId]: { ...prev, status: prev?.status ?? 'draft', text, updatedAt: Date.now() },
        },
        activity: logActivity(s, 'task', taskId),
      }
    })
  },
  setAnswerStatus(taskId: string, status: AnswerStatus) {
    set((s) => {
      const prev = s.answers[taskId] ?? { text: '', status: 'draft', updatedAt: Date.now() }
      return { ...s, answers: { ...s.answers, [taskId]: { ...prev, status, updatedAt: Date.now() } }, activity: logActivity(s, 'task', taskId) }
    })
  },
  rateAnswer(taskId: string, rating: SelfRating | undefined) {
    set((s) => {
      const prev = s.answers[taskId]
      if (!prev) return s
      return { ...s, answers: { ...s.answers, [taskId]: { ...prev, rating, updatedAt: Date.now() } } }
    })
  },
  clearAnswer(taskId: string) {
    set((s) => {
      const answers = { ...s.answers }
      delete answers[taskId]
      return { ...s, answers }
    })
  },
  markCard(cardId: string, status: CardStatus) {
    set((s) => ({
      ...s,
      cards: { ...s.cards, [cardId]: { status, seen: (s.cards[cardId]?.seen ?? 0) + 1, updatedAt: Date.now() } },
    }))
  },
  resetCards(ids: string[]) {
    set((s) => {
      const cards = { ...s.cards }
      ids.forEach((id) => delete cards[id])
      return { ...s, cards }
    })
  },
  studiedDeck(deckId: string) {
    set((s) => ({ ...s, activity: logActivity(s, 'deck', deckId) }))
  },
  addCustomCard(resourceId: string, front: string, back: string) {
    const card: Flashcard = { id: `custom:${resourceId}:${Date.now().toString(36)}`, resourceId, front, back, tags: ['mine'] }
    set((s) => ({ ...s, customCards: [...s.customCards, card] }))
    return card
  },
  removeCustomCard(id: string) {
    set((s) => {
      const cards = { ...s.cards }
      delete cards[id]
      return { ...s, customCards: s.customCards.filter((c) => c.id !== id), cards }
    })
  },
  saveTestAnswer(testId: string, questionId: string, value: string) {
    set((s) => {
      const d = s.testDrafts[testId] ?? { answers: {}, startedAt: Date.now() }
      return { ...s, testDrafts: { ...s.testDrafts, [testId]: { ...d, answers: { ...d.answers, [questionId]: value } } } }
    })
  },
  discardTestDraft(testId: string) {
    set((s) => {
      const testDrafts = { ...s.testDrafts }
      delete testDrafts[testId]
      return { ...s, testDrafts }
    })
  },
  submitTest(attempt: Omit<TestAttempt, 'id'>) {
    const full: TestAttempt = { ...attempt, id: Date.now().toString(36) }
    set((s) => {
      const testDrafts = { ...s.testDrafts }
      delete testDrafts[attempt.testId]
      return { ...s, testDrafts, attempts: [full, ...s.attempts].slice(0, 50), activity: logActivity(s, 'test', attempt.testId) }
    })
    return full
  },
  deleteAttempt(attemptId: string) {
    set((s) => ({ ...s, attempts: s.attempts.filter((a) => a.id !== attemptId) }))
  },
  toggleRevised(key: string) {
    set((s) => ({ ...s, revised: { ...s.revised, [key]: !s.revised[key] } }))
  },
  setName(name: string) {
    set((s) => ({ ...s, profile: { ...s.profile, name } }))
  },
  replace(next: State) {
    set(() => ({ ...empty(), ...next, version: 1 }))
  },
  reset() {
    set(() => empty())
  },
}

export function exportState() {
  return JSON.stringify(state, null, 2)
}

export function parseImport(raw: string): State {
  const parsed = JSON.parse(raw)
  if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) throw new Error('This file isn’t a Margin backup.')
  return parsed as State
}
