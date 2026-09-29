import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Check, ChevronLeft, ChevronRight, FileText, Sparkles, Trash2 } from 'lucide-react'
import { DIFFICULTY_LABEL, getResource, getStep, getTask, TASK_TYPE_LABEL, tasksForResource } from '@/lib/data'
import { actions, useStore, type SelfRating } from '@/lib/storage'
import { buildReviewPrompt, buildTaskOnlyPrompt, notesText } from '@/lib/prompts'
import { copyText } from '@/lib/clipboard'
import { cn, pad2, words } from '@/lib/utils'
import type { Task } from '@/types'
import { Breadcrumbs, Page } from '@/components/blocks'
import { CopyButton } from '@/components/CopyButton'
import { useToast } from '@/components/toast'
import { Button, Kbd, Pill } from '@/components/ui'
import NotFound from './NotFound'

export default function TaskPage() {
  const { id = '' } = useParams()
  const task = getTask(id)
  if (!task) return <NotFound what="task" />
  return <TaskView key={task.id} task={task} />
}

/** Class notes for the task's resource, as plain text — attached to "prompt + source context". */
async function sourceContext(task: Task) {
  const r = getResource(task.resourceId)
  const text = r ? await notesText(r) : null
  if (!text) throw new Error('No class notes available for this topic — copied without source context instead.')
  return text
}

function TaskView({ task }: { task: Task }) {
  const resource = getResource(task.resourceId)!
  const step = getStep(resource.stepId)
  const siblings = tasksForResource(resource.id)
  const n = siblings.indexOf(task)
  const saved = useStore((s) => s.answers[task.id])
  const [started, setStarted] = useState(Boolean(saved?.text))
  const [text, setText] = useState(saved?.text ?? '')
  const [savedAt, setSavedAt] = useState<number | null>(saved?.updatedAt ?? null)
  const editor = useRef<HTMLTextAreaElement>(null)
  const notify = useToast()
  const navigate = useNavigate()

  // Debounced autosave.
  useEffect(() => {
    if (!started) return
    if (text === (saved?.text ?? '')) return
    const t = window.setTimeout(() => {
      actions.saveAnswer(task.id, text)
      setSavedAt(Date.now())
    }, 450)
    return () => window.clearTimeout(t)
  }, [text, started, task.id, saved?.text])

  const start = () => {
    setStarted(true)
    requestAnimationFrame(() => editor.current?.focus())
  }

  const copyForLLM = async () => {
    const ok = await copyText(buildReviewPrompt(task, text))
    notify(ok ? 'Review prompt copied — paste it into ChatGPT, Claude or any AI' : 'Couldn’t copy — your browser blocked clipboard access', ok ? 'ok' : 'error')
  }

  const done = saved?.status === 'done'
  const count = words(text)
  const next = siblings[n + 1]
  const prev = siblings[n - 1]

  return (
    <Page>
      <div className="pt-8 sm:pt-10">
        <Breadcrumbs
          items={[
            { label: 'Practice', to: '/practice' },
            { label: resource.title, to: `/learn/${resource.id}#practice` },
            { label: `Task ${pad2(n + 1)}` },
          ]}
        />
        <div className="flex items-center gap-3">
          <span className="font-mono text-[12px] tracking-[0.12em] text-accent">TASK {pad2(n + 1)}</span>
          {done && <Pill tone={saved?.rating === 'needs-work' ? 'warn' : 'good'}>{saved?.rating === 'needs-work' ? 'Needs work' : 'Completed'}</Pill>}
        </div>
        <h1 className="mt-3 text-[26px] leading-[1.15] font-semibold tracking-[-0.03em] text-balance text-fg sm:text-[32px]">{task.title}</h1>

        <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-line py-5 sm:grid-cols-4">
          <div>
            <dt className="eyebrow !text-[10px]">Source</dt>
            <dd className="mt-2 text-[13.5px]">
              <Link to={`/learn/${resource.id}`} className="text-fg hover:text-accent">
                {resource.title}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="eyebrow !text-[10px]">Step</dt>
            <dd className="mt-2 text-[13.5px] text-fg">{step?.label}</dd>
          </div>
          <div>
            <dt className="eyebrow !text-[10px]">Type</dt>
            <dd className="mt-2 text-[13.5px] text-fg">{TASK_TYPE_LABEL[task.type]}</dd>
          </div>
          <div>
            <dt className="eyebrow !text-[10px]">Difficulty</dt>
            <dd className="mt-2 flex items-center gap-2 text-[13.5px] text-fg">
              <span className="flex gap-0.5" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={cn('h-2.5 w-1 rounded-full', i <= ['easy', 'medium', 'hard'].indexOf(task.difficulty) ? 'bg-accent' : 'bg-line-2')} />
                ))}
              </span>
              {DIFFICULTY_LABEL[task.difficulty]}
            </dd>
          </div>
        </dl>
      </div>

      <section className="py-8" aria-label="Question">
        {task.extract && (
          <blockquote className="mb-6 border-l-2 border-accent/50 py-1 pl-5 text-[15px] leading-relaxed text-fg-2 italic">{task.extract}</blockquote>
        )}
        <div className="text-[17px] leading-[1.65] tracking-[-0.005em] whitespace-pre-line text-fg">{task.prompt}</div>
        {task.instructions.length > 0 && (
          <ul className="mt-6 space-y-1.5">
            {task.instructions.map((i) => (
              <li key={i} className="flex gap-2.5 text-[13.5px] text-fg-2">
                <span className="mt-[9px] size-1 shrink-0 rounded-full bg-fg-3" aria-hidden="true" />
                {i}
              </li>
            ))}
          </ul>
        )}
      </section>

      {!started ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-6">
          <Button variant="primary" onClick={start}>
            Start task <ArrowRight size={14} />
          </Button>
          <CopyButton variant="ghost" getText={() => buildTaskOnlyPrompt(task)} toast="Question copied — ask your AI to help you plan">
            Copy prompt
          </CopyButton>
          <span className="text-[12px] text-fg-3">Your answer saves automatically on this device.</span>
        </div>
      ) : (
        <section aria-label="Your answer" className="animate-rise">
          <div className="overflow-hidden rounded-lg border border-line-2 bg-ink-1 transition-colors focus-within:border-accent/50">
            <div className="flex items-center justify-between border-b border-line px-4 py-2">
              <label htmlFor="answer" className="text-[12px] font-medium text-fg-2">
                Your answer
              </label>
              <span className="text-[11.5px] text-fg-3" aria-live="polite">
                {savedAt ? (text === (saved?.text ?? '') ? 'Saved' : 'Saving…') : 'Not saved yet'}
              </span>
            </div>
            <textarea
              id="answer"
              ref={editor}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault()
                  copyForLLM()
                }
              }}
              rows={12}
              spellCheck
              placeholder="Write your answer here…"
              className="block min-h-[260px] w-full resize-y bg-transparent px-4 py-4 text-[15px] leading-[1.75] text-fg placeholder:text-fg-3 focus:outline-none"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2 text-[11.5px] text-fg-3">
              <span className="tabular-nums">
                {count} word{count === 1 ? '' : 's'}
              </span>
              <span className="hidden items-center gap-1 sm:flex">
                <Kbd>Ctrl</Kbd>
                <Kbd>↵</Kbd> copy for AI review
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <CopyButton variant="primary" getText={() => buildReviewPrompt(task, text)} icon={<Sparkles size={14} />} toast="Review prompt copied — paste it into ChatGPT, Claude or any AI">
              Copy for AI review
            </CopyButton>
            <CopyButton
              getText={async () => {
                try {
                  return buildReviewPrompt(task, text, await sourceContext(task))
                } catch (e) {
                  notify(e instanceof Error ? e.message : 'Couldn’t read the notes', 'error')
                  return buildReviewPrompt(task, text)
                }
              }}
              icon={<FileText size={14} />}
              toast="Prompt + class notes copied"
              title="Includes the text of your class notes for this topic"
            >
              Copy prompt + source context
            </CopyButton>
            <CopyButton variant="ghost" getText={() => buildTaskOnlyPrompt(task)} toast="Question copied">
              Copy prompt
            </CopyButton>
          </div>

          <div className="mt-8 rounded-lg border border-line bg-ink-1 p-4">
            {!done ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[13px] text-fg-2">Reviewed it with your AI? Mark it done and rate yourself — it feeds your Review page.</p>
                <Button
                  onClick={() => {
                    actions.saveAnswer(task.id, text)
                    actions.setAnswerStatus(task.id, 'done')
                    notify('Marked as completed')
                  }}
                  disabled={!text.trim()}
                >
                  <Check size={14} /> Mark as done
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-[13px] text-fg-2">How did it go?</div>
                <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Self rating">
                  {(
                    [
                      ['solid', 'Solid'],
                      ['needs-work', 'Needs work'],
                    ] as [SelfRating, string][]
                  ).map(([v, l]) => (
                    <button
                      key={v}
                      role="radio"
                      aria-checked={saved?.rating === v}
                      onClick={() => actions.rateAnswer(task.id, saved?.rating === v ? undefined : v)}
                      className={cn(
                        'h-7 rounded-none border px-2.5 text-[12.5px] transition-colors',
                        saved?.rating === v
                          ? v === 'solid'
                            ? 'border-good/40 bg-good/10 text-good'
                            : 'border-warn/40 bg-warn/10 text-warn'
                          : 'border-line-2 text-fg-2 hover:text-fg',
                      )}
                    >
                      {l}
                    </button>
                  ))}
                  <Button size="sm" variant="ghost" onClick={() => actions.setAnswerStatus(task.id, 'draft')}>
                    Reopen
                  </Button>
                </div>
              </div>
            )}
          </div>

          {text.trim() && (
            <button
              onClick={() => {
                if (window.confirm('Delete your answer to this task? This can’t be undone.')) {
                  actions.clearAnswer(task.id)
                  setText('')
                  setSavedAt(null)
                  setStarted(false)
                  notify('Answer deleted')
                }
              }}
              className="mt-4 flex items-center gap-1.5 text-[12px] text-fg-3 hover:text-fg-2"
            >
              <Trash2 size={12} /> Delete answer
            </button>
          )}
        </section>
      )}

      <nav className="mt-14 grid grid-cols-2 gap-3 border-t border-line pt-6" aria-label="Other tasks">
        {prev ? (
          <button onClick={() => navigate(`/practice/${prev.id}`)} className="rounded-lg border border-line px-4 py-3 text-left transition-colors hover:border-line-2 hover:bg-ink-2">
            <div className="flex items-center gap-1 text-[11.5px] text-fg-3">
              <ChevronLeft size={12} /> Task {pad2(n)}
            </div>
            <div className="mt-1 truncate text-[13.5px] text-fg">{prev.title}</div>
          </button>
        ) : (
          <span />
        )}
        {next ? (
          <button onClick={() => navigate(`/practice/${next.id}`)} className="rounded-lg border border-line px-4 py-3 text-right transition-colors hover:border-line-2 hover:bg-ink-2">
            <div className="flex items-center justify-end gap-1 text-[11.5px] text-fg-3">
              Task {pad2(n + 2)} <ChevronRight size={12} />
            </div>
            <div className="mt-1 truncate text-[13.5px] text-fg">{next.title}</div>
          </button>
        ) : (
          <Link to="/practice" className="rounded-lg border border-line px-4 py-3 text-right transition-colors hover:border-line-2 hover:bg-ink-2">
            <div className="flex items-center justify-end gap-1 text-[11.5px] text-fg-3">
              All tasks <ChevronRight size={12} />
            </div>
            <div className="mt-1 truncate text-[13.5px] text-fg">Back to Practice</div>
          </Link>
        )}
      </nav>
    </Page>
  )
}
