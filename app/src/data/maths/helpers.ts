import type { Flashcard, Resource, Task } from '@/types'
import type { KeywordPoint, McqQuestion, TestQuestion, WrittenQuestion } from '@/types/tests'

/** Shared builders for the Maths data files. */

export const S = 'maths'

export const f = (path: string, role?: Resource['files'][number]['role'], label?: string) => ({ path: `maths/${path}`, role, label })

export type Card = [front: string, back: string]
export const deck = (resourceId: string, cards: Card[]): Flashcard[] => cards.map(([front, back], i) => ({ id: `${resourceId}:${i + 1}`, resourceId, front, back }))

/** Question builders with ids that cannot clash between test files (each file passes its own prefix). */
export function builders(prefix: string) {
  let n = 0
  const id = () => `${prefix}-${++n}`
  const mcq = (prompt: string, options: string[], answer: number, marks = 1, extra: Partial<McqQuestion> = {}): McqQuestion => ({ id: id(), kind: 'mcq', prompt, options, answer, marks, ...extra })
  const fill = (prompt: string, accept: string[], marks = 1): TestQuestion => ({ id: id(), kind: 'fill', prompt, accept, marks })
  const kw = (label: string, ...any: string[]): KeywordPoint => ({ label, any })
  const written = (prompt: string, marks: number, rest: Omit<WrittenQuestion, 'id' | 'kind' | 'prompt' | 'marks'>): WrittenQuestion => ({ id: id(), kind: 'written', prompt, marks, ...rest })
  return { mcq, fill, kw, written }
}

/** Short task builder: id, resource, title, prompt, type, difficulty, optional extra instruction. */
type TT = Task['type']
type DD = Task['difficulty']
export const T = (id: string, resourceId: string, title: string, prompt: string, type: TT, difficulty: DD, extra?: string, tags: string[] = []): Task => ({
  id,
  resourceId,
  title,
  prompt,
  type,
  difficulty,
  instructions: extra ? [...WORK, extra] : WORK,
  tags,
  ...(difficulty === 'hard' ? { llmReviewPrompt: REVIEW } : {}),
})

/** Short resource builder: key points as [label, text] pairs. */
export const R = (id: string, title: string, code: string, type: Resource['type'], stepId: string, description: string, files: Resource['files'], keyPoints: [string, string][], tags: string[] = [], related: string[] = []): Resource => ({
  id,
  title,
  code,
  type,
  stepId,
  subjectId: S,
  description,
  files,
  tags,
  related,
  keyPoints: keyPoints.map(([label, text]) => ({ label, text })),
})

export const WORK = ['Show every step of the working, not just the answer.', 'Write the formula or rule first, then put the numbers in.', 'Check the answer by putting it back into the question.']
export const CLAIM = ['Test the claim with numbers or a counter-example.', 'State clearly whether it is true or false.', 'Give the reason in one sentence.']
export const REVIEW = ['Check every step, not only the final answer.', 'Point out the first step that goes wrong, if any.', 'Do not give the full solution; give a hint for the next step.']
