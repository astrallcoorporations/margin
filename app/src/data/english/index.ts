import type { Subject } from '@/types'
import { resources, steps } from './resources'
import { tasks } from './tasks'
import { flashcards } from './flashcards'

export const english: Subject = {
  id: 'english',
  name: 'English',
  classLabel: 'Class 8',
  term: 'SA1',
  tagline: 'Everything you need, in one place.',
  // From the SA1 exam timetable.
  exam: {
    name: 'SA1 English',
    date: '2026-09-30',
    syllabus: [
      {
        label: 'Step 21',
        items: [
          { label: 'The Tale of Custard the Dragon', resourceId: 'the-tale-of-custard-the-dragon' },
          { label: 'Sick', resourceId: 'sick' },
          { label: 'The Last Leaf', resourceId: 'the-last-leaf' },
        ],
      },
      {
        label: 'Step 22',
        items: [
          { label: 'The Day Anka Saw Her Friend', resourceId: 'day-anka-saw-her-friend' },
          { label: 'Mother to Son', resourceId: 'mother-to-son' },
        ],
      },
      {
        label: 'Step 23',
        items: [
          { label: 'Becoming Gutenberg Part 1 & 2', resourceId: 'becoming-gutenberg' },
          { label: 'The Charge of the Light Brigade', resourceId: 'the-charge-of-the-light-brigade' },
        ],
      },
      {
        label: 'Step 24',
        items: [
          { label: 'Terri and the Turkey', resourceId: 'terri-and-the-turkey' },
          { label: 'Australia is a Tree Growing in a Garden in Chennai', resourceId: 'australia-tree-chennai' },
        ],
      },
      {
        label: 'Unseen comprehension',
        items: [
          { label: 'Discursive passages', resourceId: 'rc3-discursive' },
          { label: 'Case-based passages', resourceId: 'rc4-case-based' },
        ],
      },
      {
        label: 'Creative writing',
        items: [
          { label: 'Diary entry', resourceId: 'creative-writing' },
          { label: 'Formal letter — letter to the editor', resourceId: 'formal-letter' },
          { label: 'Article writing', resourceId: 'article-writing' },
          { label: 'Narrative essay', resourceId: 'narrative-essay' },
        ],
      },
      {
        label: 'Grammar',
        items: [
          { label: 'Adverbs and types of adverbs', resourceId: 'adverbs' },
          { label: 'Modals', resourceId: 'modals' },
          { label: 'Determiners', resourceId: 'determiners' },
          { label: 'Tenses', resourceId: 'tenses' },
          { label: 'Punctuation' },
        ],
      },
    ],
  },
  steps,
  resources,
  tasks,
  flashcards,
}
