import { useMemo, useState } from 'react'
import { GraduationCap } from 'lucide-react'
import { orderedSteps, subject } from '@/lib/data'
import { buildRevisePrompt, reviseResources, type ReviseOptions } from '@/lib/prompts'
import { useAllCards } from '@/lib/hooks'
import { getState, useStore } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { CopyButton } from './CopyButton'
import { AiLinks } from './AiLinks'
import { Modal } from './ui'

const MODES: { id: ReviseOptions['mode']; label: string; hint: string }[] = [
  { id: 'tutor', label: 'Tutor me', hint: 'Recap a topic, ask one question, mark it, move on' },
  { id: 'quiz', label: 'Quiz me', hint: 'Rapid questions across topics with a running score' },
  { id: 'plan', label: 'Plan my revision', hint: 'Day-by-day plan up to the exam' },
]

/**
 * "Revise with AI" — one prompt that catches any assistant up on the whole syllabus,
 * the exam format and the student's real progress, then sets it up as a tutor.
 */
export function ReviseDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [opts, setOpts] = useState<ReviseOptions>({ scope: subject.exam ? 'sa1' : 'all', keyPoints: true, progress: true, mode: 'tutor' })
  const cards = useAllCards()
  const touched = useStore((s) => Object.keys(s.cards).length + Object.keys(s.answers).length + Object.keys(s.visits).length)
  const count = new Set(reviseResources(opts.scope).flatMap((g) => g.resources.map((r) => r.id))).size
  const size = useMemo(() => (open ? buildRevisePrompt(opts, getState(), cards).length : 0), [open, opts, cards])

  const chip = (active: boolean) =>
    cn(
      'h-7 rounded-none border px-2.5 text-[12.5px] transition-colors',
      active ? 'border-accent/40 bg-accent/[0.08] text-fg' : 'border-line-2 text-fg-2 hover:border-[#3a3a3a] hover:text-fg',
    )

  return (
    <Modal open={open} onClose={onClose} title="Revise with AI" className="max-w-[600px]">
      <div className="space-y-5 p-5">
        <p className="text-[13px] leading-relaxed text-fg-3">
          Copies one prompt that gives any AI assistant your whole {subject.name} syllabus, the exam format and your progress — so it’s caught up in a single message. Paste it into ChatGPT, Claude, Gemini or whichever you use.
        </p>

        <fieldset>
          <legend className="mb-2 text-[12px] font-medium text-fg-2">Session</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {MODES.map((m) => (
              <button
                key={m.id}
                data-autofocus={m.id === opts.mode ? true : undefined}
                onClick={() => setOpts((o) => ({ ...o, mode: m.id }))}
                aria-pressed={opts.mode === m.id}
                className={cn(
                  'rounded-lg border px-3 py-2.5 text-left transition-colors',
                  opts.mode === m.id ? 'border-accent/40 bg-accent/[0.07]' : 'border-line-2 hover:border-[#3a3a3a] hover:bg-ink-2',
                )}
              >
                <div className="text-[13px] font-medium text-fg">{m.label}</div>
                <div className="mt-0.5 text-[11.5px] leading-snug text-fg-3">{m.hint}</div>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-[12px] font-medium text-fg-2">Cover</legend>
          <div className="flex flex-wrap gap-1.5">
            {subject.exam && (
              <button className={chip(opts.scope === 'sa1')} onClick={() => setOpts((o) => ({ ...o, scope: 'sa1' }))}>
                SA1 exam syllabus
              </button>
            )}
            <button className={chip(opts.scope === 'all')} onClick={() => setOpts((o) => ({ ...o, scope: 'all' }))}>
              Everything
            </button>
            {orderedSteps.map((s) => (
              <button key={s.id} className={chip(opts.scope === s.id)} onClick={() => setOpts((o) => ({ ...o, scope: s.id }))}>
                {s.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2 text-[13px] text-fg-2">
          <label className="flex cursor-pointer items-center gap-2.5">
            <input type="checkbox" className="accent-[#ffd500]" checked={opts.keyPoints} onChange={(e) => setOpts((o) => ({ ...o, keyPoints: e.target.checked }))} />
            Include full topic facts — key points, themes, devices, quotes, vocabulary
          </label>
          <label className="flex cursor-pointer items-center gap-2.5">
            <input type="checkbox" className="accent-[#ffd500]" checked={opts.progress} onChange={(e) => setOpts((o) => ({ ...o, progress: e.target.checked }))} />
            Include my progress — weak topics, missed flashcards, tasks done
            {!touched && <span className="text-fg-3">(nothing yet)</span>}
          </label>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
        <div className="flex flex-col gap-1">
          <span className="text-[11.5px] text-fg-3">
            {count} topics · ~{Math.round(size / 1000)}k characters
          </span>
          <AiLinks />
        </div>
        <CopyButton variant="primary" getText={() => buildRevisePrompt(opts, getState(), cards)} icon={<GraduationCap size={14} />} toast="Revision prompt copied — paste it into your AI">
          Copy revision prompt
        </CopyButton>
      </div>
    </Modal>
  )
}
