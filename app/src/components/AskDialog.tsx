import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { getResource, getTask, orderedSteps, resourcesInStep, subject } from '@/lib/data'
import { buildAskPrompt, notesText, type PageContext } from '@/lib/prompts'
import { useAllCards } from '@/lib/hooks'
import { useStore } from '@/lib/storage'
import { CopyButton } from './CopyButton'
import { AiLinks } from './AiLinks'
import { Modal } from './ui'

const PAGE_NAMES: Record<string, string> = {
  '/': 'Overview',
  '/learn': 'Curriculum',
  '/practice': 'Practice',
  '/flashcards': 'Flashcards',
  '/review': 'Review',
  '/settings': 'Settings',
}

/** Works out what the student is looking at so the prompt carries the exact page data. */
function usePageContext(override?: string): PageContext {
  const { pathname, search } = useLocation()
  const answers = useStore((s) => s.answers)
  const cards = useAllCards()
  return useMemo(() => {
    if (override) {
      const r = getResource(override)
      if (r) return { kind: 'resource', resource: r }
    }
    const [, section, id] = pathname.split('/')
    if (section === 'learn' && id) {
      const r = getResource(id)
      if (r) return { kind: 'resource', resource: r }
    }
    if (section === 'view') {
      const r = getResource(new URLSearchParams(search).get('r') ?? '')
      if (r) return { kind: 'resource', resource: r }
    }
    if (section === 'practice' && id) {
      const t = getTask(id)
      if (t) return { kind: 'task', task: t, answer: answers[t.id]?.text }
    }
    if (section === 'flashcards' && id) {
      const r = getResource(id)
      const deck = r ? cards.filter((c) => c.resourceId === r.id) : []
      if (r) return { kind: 'deck', resource: r, cards: deck, title: r.title }
    }
    return { kind: 'general', label: PAGE_NAMES[pathname] ?? 'study' }
  }, [override, pathname, search, answers, cards])
}

function describe(ctx: PageContext) {
  switch (ctx.kind) {
    case 'resource':
      return `${ctx.resource.title} — summary and key points`
    case 'task':
      return `This task${ctx.answer?.trim() ? ' and your answer so far' : ''}`
    case 'deck':
      return `The ${ctx.title} flashcards (${ctx.cards.length})`
    default:
      return 'Your class, subject and exam format'
  }
}

export function AskDialog({ open, onClose, resourceId }: { open: boolean; onClose: () => void; resourceId?: string }) {
  const [question, setQuestion] = useState('')
  const [withNotes, setWithNotes] = useState(true)
  const pageCtx = usePageContext(resourceId)
  const pageTopic = pageCtx.kind === 'resource' || pageCtx.kind === 'deck' ? pageCtx.resource : pageCtx.kind === 'task' ? getResource(pageCtx.task.resourceId) : undefined
  // Topic defaults to the page being viewed; picking another topic swaps the page data for that topic's.
  const [topicId, setTopicId] = useState('')
  useEffect(() => {
    if (open) {
      setQuestion('')
      setTopicId(pageTopic?.id ?? '')
    }
  }, [open, pageTopic?.id])

  const topic = topicId ? getResource(topicId) : undefined
  const ctx: PageContext =
    topicId && topicId === pageTopic?.id ? pageCtx : topic ? { kind: 'resource', resource: topic } : { kind: 'general', label: pageCtx.kind === 'general' ? pageCtx.label : 'study' }
  const hasNotes = Boolean(topic?.files.some((f) => f.role === 'notes' && f.path.endsWith('.docx')))

  return (
    <Modal open={open} onClose={onClose} title="Ask AI about this page" className="max-w-[580px]">
      <div className="space-y-4 p-5">
        <label className="block">
          <span className="mb-1.5 flex items-center justify-between text-[12px] font-medium text-fg-2">
            Topic
            {topicId && topicId === pageTopic?.id && <span className="font-normal text-fg-3">From this page</span>}
          </span>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="h-9 w-full rounded-md border border-line-2 bg-ink-2 px-2.5 text-[13px] text-fg focus:border-accent/60 focus:outline-none"
          >
            <option value="">General — {subject.name}</option>
            {orderedSteps.map((s) => (
              <optgroup key={s.id} label={s.label}>
                {resourcesInStep(s.id).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="rounded-lg border border-line bg-ink-2 px-3.5 py-3">
          <div className="eyebrow !text-[10px]">Included automatically</div>
          <ul className="mt-2 space-y-1 text-[13px] text-fg-2">
            <li>· Your class, subject, syllabus steps and exam format</li>
            <li>· {describe(ctx)}</li>
            {hasNotes && (
              <li>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={withNotes} onChange={(e) => setWithNotes(e.target.checked)} className="accent-[#ffd500]" />
                  Your class notes for {topic?.title}
                </label>
              </li>
            )}
          </ul>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-fg-2">Your question</span>
          <textarea
            data-autofocus
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            placeholder={topic ? `e.g. What is the difference between the theme and the message of “${topic.title}”?` : 'e.g. When do I use the past perfect instead of the simple past?'}
            className="w-full resize-y rounded-md border border-line-2 bg-ink-2 px-3 py-2.5 text-[13.5px] leading-relaxed text-fg placeholder:text-fg-3 focus:border-accent/60 focus:outline-none"
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
        <AiLinks />
        <CopyButton
          variant="primary"
          getText={async () => buildAskPrompt(question, ctx, withNotes && topic ? await notesText(topic) : null)}
          icon={<Sparkles size={14} />}
          toast="Copied — paste it into your AI"
        >
          Copy prompt
        </CopyButton>
      </div>
    </Modal>
  )
}
