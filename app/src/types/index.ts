/** Curriculum + content model. Subjects are data — nothing here is English-specific. */

export type ResourceType =
  | 'story'
  | 'poem'
  | 'play'
  | 'prose'
  | 'grammar'
  | 'reading'
  | 'writing'
  | 'speaking'
  | 'exam'

export type CategoryId = 'literature' | 'language' | 'grammar'

export interface Category {
  id: CategoryId
  label: string
  description: string
  types: ResourceType[]
}

export interface FileRef {
  /** Path relative to the served roots, e.g. "english/step 21/sick/Sick.pdf" */
  path: string
  /** Human label; defaults to the filename without extension */
  label?: string
  /** What the file is for — helps order and label files on the resource page */
  role?: 'text' | 'notes' | 'questions' | 'answers' | 'worksheet' | 'slides' | 'reference' | 'video'
}

export interface Resource {
  id: string
  title: string
  /** Short catalogue code shown in the type chip (LIT, POEM, ADV…) */
  code: string
  type: ResourceType
  stepId: string
  subjectId: string
  author?: string
  description: string
  cloudUrl?: string
  files: FileRef[]
  tags: string[]
  related: string[]
  /** Short revision notes shown under "Key concepts" — taken from the notes in the resource folder */
  keyPoints?: { label: string; text: string }[]
}

export interface Step {
  id: string
  label: string
  /** Optional qualifier ("final revision") */
  note?: string
  order: number
  /** Materials that belong to the whole step rather than one resource */
  files?: FileRef[]
}

export interface ExamSyllabusGroup {
  label: string
  items: { label: string; resourceId?: string }[]
}

export interface Exam {
  name: string
  /** ISO date, e.g. 2026-09-30 */
  date: string
  /** Syllabus as given in the exam timetable */
  syllabus: ExamSyllabusGroup[]
}

export interface Subject {
  id: string
  name: string
  classLabel: string
  term: string
  tagline: string
  exam?: Exam
  steps: Step[]
  resources: Resource[]
  tasks: Task[]
  flashcards: Flashcard[]
}

export type TaskType =
  | 'literature'
  | 'grammar'
  | 'reading'
  | 'writing'
  | 'speaking'
  | 'vocabulary'
  | 'short'
  | 'long'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Task {
  id: string
  resourceId: string
  title: string
  prompt: string
  type: TaskType
  difficulty: Difficulty
  /** Answer guidance: length, method, what to include */
  instructions: string[]
  tags: string[]
  /** Optional extract the question is based on */
  extract?: string
  /** Extra checks appended to the external LLM review prompt */
  llmReviewPrompt?: string[]
}

export interface Flashcard {
  id: string
  resourceId: string
  front: string
  back: string
  tags?: string[]
}
