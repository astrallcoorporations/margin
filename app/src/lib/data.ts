import { categories, subjects } from '@/data/catalog'
import type { CategoryId, Difficulty, Resource, ResourceType, Step, TaskType } from '@/types'

/** The active subject. Single-subject for now; the rest of the app reads everything through here. */
export const subject = subjects[0]

const resourceById = new Map(subject.resources.map((r) => [r.id, r]))
const stepById = new Map(subject.steps.map((s) => [s.id, s]))
const taskById = new Map(subject.tasks.map((t) => [t.id, t]))

export const getResource = (id: string) => resourceById.get(id)
export const getStep = (id: string) => stepById.get(id)
export const getTask = (id: string) => taskById.get(id)

export const orderedSteps = [...subject.steps].sort((a, b) => a.order - b.order)

export const resourcesInStep = (stepId: string) => subject.resources.filter((r) => r.stepId === stepId)
export const tasksForResource = (resourceId: string) => subject.tasks.filter((t) => t.resourceId === resourceId)
export const cardsForResource = (resourceId: string) => subject.flashcards.filter((c) => c.resourceId === resourceId)

export const relatedResources = (r: Resource) =>
  r.related.map((id) => resourceById.get(id)).filter((x): x is Resource => Boolean(x))

export const categoryOf = (type: ResourceType): CategoryId =>
  categories.find((c) => c.types.includes(type))?.id ?? 'language'

export const getCategory = (id: string) => categories.find((c) => c.id === id)

export const resourcesInCategory = (id: CategoryId) => subject.resources.filter((r) => categoryOf(r.type) === id)

export const TYPE_LABEL: Record<ResourceType, string> = {
  story: 'Story',
  poem: 'Poem',
  play: 'Play',
  prose: 'Prose',
  grammar: 'Grammar',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
  exam: 'Exam skills',
}

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  literature: 'Literature analysis',
  grammar: 'Grammar',
  reading: 'Reading comprehension',
  writing: 'Writing',
  speaking: 'Speaking',
  vocabulary: 'Vocabulary',
  short: 'Short answer',
  long: 'Long answer',
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }

export const stepLabel = (step: Step | undefined) => (step ? step.label : '')

/** Position of a task within its resource — used for "Task 01" style labels. */
export const taskNumber = (taskId: string) => {
  const t = taskById.get(taskId)
  if (!t) return 0
  return tasksForResource(t.resourceId).findIndex((x) => x.id === taskId) + 1
}

/** Resources named in the exam syllabus, plus the step set aside for exam revision. */
const examIds = new Set((subject.exam?.syllabus ?? []).flatMap((g) => g.items.map((i) => i.resourceId).filter(Boolean) as string[]))
export const inExam = (r: { id: string; stepId: string }) => !subject.exam || examIds.has(r.id) || r.stepId === 'sa1-review' || r.id === 'reading-comprehension'
