import type { Category, Subject } from '@/types'
import { resources, steps } from './resources'
import { tasks } from './tasks'
import { flashcards } from './flashcards'
import { tests } from './tests'

const categories: Category[] = [
  { id: 'concepts', label: 'Concepts', description: 'Percentages, profit and loss, discount, and squares and cubes.', types: ['concept'] },
  { id: 'revision', label: 'Revision', description: 'Mixed questions across the whole step.', types: ['revision', 'worksheet'] },
]

export const maths: Subject = {
  id: 'maths',
  name: 'Maths',
  classLabel: 'Class 8',
  term: 'SA1',
  tagline: 'Formulas, worked steps and practice in one place.',
  steps,
  resources,
  tasks,
  flashcards,
  categories,
  tests,
}
