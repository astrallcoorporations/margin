import type { MockTest } from '@/types/tests'
import { activeSubject } from './catalog'

/** Mock papers and worksheets of the subject that is showing. */
export const tests: MockTest[] = activeSubject.tests ?? []
export const getTest = (testId: string) => tests.find((t) => t.id === testId)
export const testMarks = (t: MockTest) => t.sections.reduce((a, s) => a + s.questions.reduce((b, q) => b + q.marks, 0), 0)
export const testQuestions = (t: MockTest) => t.sections.flatMap((s) => s.questions)
