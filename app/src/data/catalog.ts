import type { Category, Subject } from '@/types'
import { english } from './english'

/**
 * Registry of subjects. To add Mathematics or Science, create src/data/<subject>/
 * with the same shape as ./english and append it here.
 */
export const subjects: Subject[] = [english]

export const categories: Category[] = [
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
