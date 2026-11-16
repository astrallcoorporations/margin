import type { Category, Subject } from '@/types'
import { english } from './english'
import { maths } from './maths'

/**
 * Registry of subjects. To add Mathematics or Science, create src/data/<subject>/
 * with the same shape as ./english and append it here.
 */
export const subjects: Subject[] = [english, maths]

const englishCategories: Category[] = [
  {
    id: 'literature',
    label: 'Literature',
    description: 'Stories, poems, plays and prose from the syllabus.',
    types: ['story', 'poem', 'play', 'prose'],
  },
  {
    id: 'language',
    label: 'Language',
    description: 'Reading skills, writing formats, speaking and exam technique.',
    types: ['reading', 'writing', 'speaking', 'exam'],
  },
  {
    id: 'grammar',
    label: 'Grammar',
    description: 'Adverbs, modals, determiners, tenses and sentence structure.',
    types: ['grammar'],
  },
]

/** Which subject the whole app is showing. Switching reloads the page, so every page simply reads the one active subject. */
const KEY = 'margin-subject'
const stored = (() => {
  try {
    return localStorage.getItem(KEY) || ''
  } catch {
    return ''
  }
})()
export const activeSubject: Subject = subjects.find((s) => s.id === stored) ?? subjects[0]
export const switchSubject = (id: string) => {
  try {
    localStorage.setItem(KEY, id)
  } catch {
    /* private mode: the choice is just not remembered */
  }
  window.location.assign('/')
}
export const categories: Category[] = activeSubject.categories ?? englishCategories
