import { categories } from '@/data/catalog'
import { getResource, getStep, orderedSteps, subject, TYPE_LABEL, TASK_TYPE_LABEL } from './data'

export type SearchGroup = 'Resources' | 'Tasks' | 'Topics'

export interface SearchItem {
  group: SearchGroup
  id: string
  title: string
  meta: string
  code: string
  href: string
  /** Lower-cased haystack fields in priority order */
  fields: string[]
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'`]/g, '')

const items: SearchItem[] = [
  ...subject.resources.map<SearchItem>((r) => ({
    group: 'Resources',
    id: r.id,
    title: r.title,
    meta: [getStep(r.stepId)?.label, TYPE_LABEL[r.type], r.author].filter(Boolean).join(' · '),
    code: r.code,
    href: `/learn/${r.id}`,
    fields: [r.title, r.author ?? '', r.tags.join(' '), TYPE_LABEL[r.type], getStep(r.stepId)?.label ?? '', r.description].map(norm),
  })),
  ...subject.tasks.map<SearchItem>((t) => {
    const r = getResource(t.resourceId)
    return {
      group: 'Tasks',
      id: t.id,
      title: t.title,
      meta: [r?.title, TASK_TYPE_LABEL[t.type]].filter(Boolean).join(' · '),
      code: 'TASK',
      href: `/practice/${t.id}`,
      fields: [t.title, r?.title ?? '', t.tags.join(' '), TASK_TYPE_LABEL[t.type], t.prompt].map(norm),
    }
  }),
  ...orderedSteps.map<SearchItem>((s) => ({
    group: 'Topics',
    id: s.id,
    title: s.note ? `${s.label} — ${s.note}` : s.label,
    meta: `${subject.resources.filter((r) => r.stepId === s.id).length} resources`,
    code: s.id === 'sa1-review' ? 'SA1' : String(s.order),
    href: `/learn#${s.id}`,
    fields: [s.label, s.note ?? '', 'step'].map(norm),
  })),
  ...categories.map<SearchItem>((c) => ({
    group: 'Topics',
    id: c.id,
    title: c.label,
    meta: c.description,
    code: c.label.slice(0, 3).toUpperCase(),
    href: `/library/${c.id}`,
    fields: [c.label, c.description].map(norm),
  })),
]

/**
 * Token search with field weighting. Every query token must appear somewhere;
 * earlier fields (titles) score higher, and prefix matches beat substring matches.
 */
export function search(query: string, limit = 24): SearchItem[] {
  const tokens = norm(query).split(/\s+/).filter(Boolean)
  if (!tokens.length) return []
  const scored: { item: SearchItem; score: number }[] = []
  for (const item of items) {
    let score = 0
    let ok = true
    for (const tok of tokens) {
      let best = 0
      item.fields.forEach((field, i) => {
        const at = field.indexOf(tok)
        if (at === -1) return
        const weight = 10 / (i + 1)
        const boundary = at === 0 || /\W/.test(field[at - 1])
        best = Math.max(best, weight * (boundary ? 2 : 1))
      })
      if (!best) {
        ok = false
        break
      }
      score += best
    }
    if (ok) {
      if (item.fields[0].startsWith(tokens.join(' '))) score += 20
      if (item.group === 'Topics') score += 2
      scored.push({ item, score })
    }
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.item)
}

export const GROUP_ORDER: SearchGroup[] = ['Resources', 'Tasks', 'Topics']
