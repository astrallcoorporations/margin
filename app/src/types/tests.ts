/** Mock papers and worksheets. */

export type WrittenFormat = 'peel' | 'letter' | 'article' | 'narrative' | 'diary' | 'sentences'

export interface KeywordPoint {
  /** What the point is, shown in feedback */
  label: string
  /** Any of these (lower-case, substring match) counts as making the point */
  any: string[]
}

interface Base {
  id: string
  prompt: string
  marks: number
  resourceId?: string
}

export interface McqQuestion extends Base {
  kind: 'mcq'
  options: string[]
  answer: number
  explain?: string
}

export interface FillQuestion extends Base {
  kind: 'fill'
  /** Accepted answers, compared case/punctuation-insensitively */
  accept: string[]
}

export interface WrittenQuestion extends Base {
  kind: 'written'
  words?: [number, number]
  points?: KeywordPoint[]
  /** How many points earn full content credit (default: all) */
  need?: number
  format?: WrittenFormat
  /** Title/author the first sentence should name (PEEL answers) */
  mention?: string[]
  /** Model answer or key ideas, shown after marking */
  model?: string
}

export type TestQuestion = McqQuestion | FillQuestion | WrittenQuestion

export interface Passage {
  title?: string
  body: string
  table?: { head: string[]; rows: string[][] }
}

export interface TestSection {
  id: string
  title: string
  note?: string
  passage?: Passage
  /** Extract printed above the questions */
  extract?: string
  questions: TestQuestion[]
}

export interface MockTest {
  id: string
  title: string
  kind: 'paper' | 'worksheet'
  description: string
  minutes: number
  sections: TestSection[]
}
