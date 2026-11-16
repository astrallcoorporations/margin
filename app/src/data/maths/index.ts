import type { Category, Subject } from '@/types'
import { resources as r26, steps } from './resources'
import { tasks as t26 } from './tasks'
import { flashcards as c26 } from './flashcards'
import { tests as x26 } from './tests'
import * as s21 from './s21'
import * as s22 from './s22'
import * as s23 from './s23'
import * as s24 from './s24'
import { tests as mock } from './mock'

const categories: Category[] = [
  { id: 'concepts', label: 'Concepts', description: 'Rational numbers, exponents, polygons, equations, proportion, roots, percentages and profit and loss.', types: ['concept'] },
  { id: 'revision', label: 'Revision', description: 'Learning checks and mixed practice across the steps.', types: ['revision', 'worksheet'] },
]

export const maths: Subject = {
  id: 'maths',
  name: 'Maths',
  classLabel: 'Class 8',
  term: 'SA1',
  tagline: 'Formulas, worked steps and practice in one place.',
  steps,
  resources: [...s21.resources, ...s22.resources, ...s23.resources, ...r26.filter((r) => r.stepId === 'step-24'), ...s24.resources, ...r26.filter((r) => r.stepId === 'step-26'), ...r26.filter((r) => r.stepId === 'maths-revision')]
    .filter((r, i, a) => a.findIndex((x) => x.id === r.id) === i),
  tasks: [...s21.tasks, ...s22.tasks, ...s23.tasks, ...t26, ...s24.tasks],
  flashcards: [...s21.flashcards, ...s22.flashcards, ...s23.flashcards, ...c26, ...s24.flashcards],
  // The checklist on the overview: every step and its notes pages. No date yet: it shows once an exam date is known.
  exam: { name: 'SA1 Maths', syllabus: [] },
  categories,
  tests: [...s21.tests, ...s22.tests, ...s23.tests, ...x26, ...s24.tests, ...mock],
}

// The overview checklist: every step with its notes pages, built from the data so new steps appear by themselves.
maths.exam!.syllabus = [...maths.steps]
  .sort((a, b) => a.order - b.order)
  .map((st) => ({ label: st.label, items: maths.resources.filter((r) => r.stepId === st.id).map((r) => ({ label: r.title, resourceId: r.id })) }))
  .filter((g) => g.items.length > 0)
