import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowUpRight, ChevronRight, Download, ExternalLink, FileText, Layers, MessageSquareText, NotebookPen, Plus, Sparkles, Wand2 } from 'lucide-react'
import {
  categoryOf,
  DIFFICULTY_LABEL,
  getCategory,
  getResource,
  getStep,
  relatedResources,
  subject,
  TASK_TYPE_LABEL,
  tasksForResource,
  TYPE_LABEL,
} from '@/lib/data'
import { fileExists, fileInfo, fileLabel, fileUrl, formatBytes, kindOf, KIND_LABEL, previewable } from '@/lib/files'
import { actions, useStore } from '@/lib/storage'
import { useCardsFor } from '@/lib/hooks'
import { buildFlashcardPrompt, buildGenerateTasksPrompt } from '@/lib/prompts'
import { cn, pad2 } from '@/lib/utils'
import type { FileRef, Resource } from '@/types'
import { Breadcrumbs, Page, ResourceRow, Toc } from '@/components/blocks'
import { FilePreview } from '@/components/FilePreview'
import { CopyButton } from '@/components/CopyButton'
import { AddCardDialog } from '@/components/AddCardDialog'
import { Button, ButtonLink, buttonClass, Code, Empty, Pill } from '@/components/ui'
import { useUI } from '@/app/ui-context'
import NotFound from './NotFound'

export default function ResourcePage() {
  const { id = '' } = useParams()
  const resource = getResource(id)
  useEffect(() => {
    if (resource) actions.visitResource(resource.id)
  }, [resource])
  if (!resource) return <NotFound what="resource" />
  return <ResourceView key={resource.id} resource={resource} />
}

/** Section with its label in the left margin — the page's structural device. */
function Marginal({ id, label, children, aside }: { id: string; label: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-32 border-t border-line py-8 lg:grid lg:grid-cols-[120px_minmax(0,1fr)] lg:gap-8">
      <div className="mb-4 flex items-center justify-between lg:mb-0 lg:block">
        <h2 id={`${id}-h`} className="eyebrow lg:sticky lg:top-[128px] lg:pt-1">
          {label}
        </h2>
        {aside && <div className="lg:hidden">{aside}</div>}
      </div>
      <div className="min-w-0">
        {aside && <div className="mb-4 hidden justify-end lg:flex">{aside}</div>}
        {children}
      </div>
    </section>
  )
}

function ResourceView({ resource: r }: { resource: Resource }) {
  const step = getStep(r.stepId)
  const category = getCategory(categoryOf(r.type))
  const tasks = tasksForResource(r.id)
  const cards = useCardsFor(r.id)
  const cardState = useStore((s) => s.cards)
  const answers = useStore((s) => s.answers)
  const related = relatedResources(r)
  const { openAsk } = useUI()
  const [addOpen, setAddOpen] = useState(false)

  const stepFiles: FileRef[] = r.type === 'reading' && step?.files ? step.files : []
  const files = [...r.files, ...stepFiles]
  const primary = r.files.find((f) => f.role === 'text' && fileExists(f.path)) ?? r.files.find((f) => fileExists(f.path))
  const previewables = files.filter((f) => previewable(f.path) && fileExists(f.path))
  const [selected, setSelected] = useState<string | undefined>(
    (r.files.find((f) => f.role === 'notes' && fileExists(f.path)) ?? previewables[0])?.path,
  )

  const known = cards.filter((c) => cardState[c.id]?.status === 'known').length
  const review = cards.filter((c) => cardState[c.id]?.status === 'review').length
  const writing = tasks.filter((t) => t.type === 'writing')
  const otherTasks = tasks.filter((t) => t.type !== 'writing')

  const toc = useMemo(
    () =>
      [
        { id: 'about', label: 'About' },
        r.keyPoints?.length ? { id: 'concepts', label: 'Key concepts' } : null,
        { id: 'source', label: 'Source' },
        { id: 'practice', label: 'Practice' },
        related.length ? { id: 'related', label: 'Related' } : null,
        { id: 'actions', label: 'Actions' },
      ].filter((x): x is { id: string; label: string } => Boolean(x)),
    [r, related.length],
  )

  return (
    <Page wide>
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_190px] xl:gap-12">
        <div className="min-w-0">
          <header className="pt-8 pb-8 sm:pt-10">
            <Breadcrumbs
              items={[
                { label: 'Learn', to: '/learn' },
                { label: step?.label ?? '', to: `/learn#${r.stepId}` },
                { label: r.title },
              ]}
            />
            <div className="flex items-start gap-4">
              <Code className="mt-1.5 !h-8 !min-w-12 !text-[10.5px] max-sm:hidden">{r.code}</Code>
              <div className="min-w-0">
                <h1 className="text-[30px] leading-[1.08] font-semibold tracking-[-0.035em] text-balance text-fg sm:text-[38px]">{r.title}</h1>
                <p className="mt-2.5 text-[13.5px] text-fg-3">
                  {[step?.label, TYPE_LABEL[r.type], r.author].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {primary ? (
                <ButtonLink
                  variant="primary"
                  to={`/view?path=${encodeURIComponent(primary.path)}&r=${r.id}`}
                  onClick={() => actions.openFile(primary.path)}
                >
                  <FileText size={14} /> Open local resource
                </ButtonLink>
              ) : null}
              {r.cloudUrl && (
                <a href={r.cloudUrl} target="_blank" rel="noreferrer" className={buttonClass(primary ? 'secondary' : 'primary')}>
                  <ExternalLink size={14} /> Open cloud resource
                </a>
              )}
              {tasks[0] && (
                <ButtonLink variant="ghost" to={`/practice/${tasks[0].id}`}>
                  <NotebookPen size={14} /> Practise
                </ButtonLink>
              )}
              {cards.length > 0 && (
                <ButtonLink variant="ghost" to={`/flashcards/${r.id}`}>
                  <Layers size={14} /> Flashcards
                </ButtonLink>
              )}
            </div>
          </header>

          <Marginal id="about" label="About">
            <p className="max-w-[64ch] text-[15px] leading-relaxed text-fg-2 text-pretty">{r.description}</p>
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-[13px] sm:grid-cols-4">
              <Meta label="Step">
                <Link to={`/learn#${r.stepId}`} className="hover:text-accent">
                  {step?.label}
                </Link>
              </Meta>
              <Meta label="Type">
                <Link to={`/library/${category?.id}`} className="hover:text-accent">
                  {TYPE_LABEL[r.type]}
                </Link>
              </Meta>
              {r.author && <Meta label="Author">{r.author}</Meta>}
              <Meta label="Files">{r.files.length ? `${r.files.length} local` : 'Cloud only'}</Meta>
            </dl>
            {r.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {r.tags.map((t) => (
                  <Pill key={t}>{t}</Pill>
                ))}
              </div>
            )}
          </Marginal>

          {r.keyPoints && r.keyPoints.length > 0 && (
            <Marginal id="concepts" label="Key concepts">
              <dl className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-ink-1">
                {r.keyPoints.map((k, i) => (
                  <div key={i} className="grid gap-1 px-4 py-3 sm:grid-cols-[150px_1fr] sm:gap-4">
                    <dt className="text-[12.5px] font-medium text-fg">{k.label}</dt>
                    <dd className="text-[13.5px] leading-relaxed text-fg-2">{k.text}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2.5 text-[11.5px] text-fg-3">Summarised from the notes in this resource’s folder.</p>
            </Marginal>
          )}

          <Marginal id="source" label="Source">
            {files.length === 0 ? (
              <Empty
                icon={<ExternalLink size={16} />}
                title="No local files for this resource"
                action={
                  r.cloudUrl && (
                    <a href={r.cloudUrl} target="_blank" rel="noreferrer" className={buttonClass('secondary', 'sm')}>
                      <ExternalLink size={13} /> Open on Google Classroom
                    </a>
                  )
                }
              >
                The material for this one lives on Google Classroom.
              </Empty>
            ) : (
              <>
                <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
                  {files.map((f) => (
                    <FileRowItem
                      key={f.path}
                      file={f}
                      resourceId={r.id}
                      isStep={stepFiles.includes(f)}
                      selected={selected === f.path}
                      onPreview={() => setSelected(f.path)}
                    />
                  ))}
                </ul>
                {selected && (
                  <div className="mt-5">
                    <div className="mb-2.5 flex items-center justify-between gap-3">
                      <div className="truncate text-[12.5px] text-fg-3">
                        Previewing <span className="text-fg-2">{fileLabel(files.find((f) => f.path === selected)!)}</span>
                      </div>
                      <Link to={`/view?path=${encodeURIComponent(selected)}&r=${r.id}`} className="flex shrink-0 items-center gap-1 text-[12px] text-fg-3 hover:text-fg">
                        Full screen <ArrowUpRight size={12} />
                      </Link>
                    </div>
                    <FilePreview path={selected} cloudUrl={r.cloudUrl} height="64vh" />
                  </div>
                )}
              </>
            )}
          </Marginal>

          <Marginal id="practice" label="Practice">
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                to={cards.length ? `/flashcards/${r.id}` : '#'}
                onClick={(e) => {
                  if (!cards.length) {
                    e.preventDefault()
                    setAddOpen(true)
                  }
                }}
                className="group rounded-lg border border-line bg-ink-1 p-4 transition-colors hover:border-line-2 hover:bg-ink-2"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[13.5px] font-medium text-fg">
                    <Layers size={14} className="text-fg-3" /> Flashcards
                  </span>
                  <ChevronRight size={14} className="text-fg-3 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="mt-2 text-[12.5px] text-fg-3">
                  {cards.length ? `${cards.length} cards · ${known} known · ${review} to review` : 'No cards yet — add your own.'}
                </p>
              </Link>
              <div className="rounded-lg border border-line bg-ink-1 p-4">
                <span className="flex items-center gap-2 text-[13.5px] font-medium text-fg">
                  <NotebookPen size={14} className="text-fg-3" /> Tasks
                </span>
                <p className="mt-2 text-[12.5px] text-fg-3">
                  {tasks.length
                    ? `${tasks.length} task${tasks.length > 1 ? 's' : ''} · ${tasks.filter((t) => answers[t.id]?.status === 'done').length} completed`
                    : 'No tasks for this resource yet.'}
                </p>
              </div>
            </div>

            {otherTasks.length > 0 && <TaskList title="Tasks" tasks={otherTasks} />}
            {writing.length > 0 && <TaskList title="Writing prompts" tasks={writing} />}
            {tasks.length === 0 && (
              <div className="mt-4">
                <Empty title="No tasks written for this resource" action={<CopyButton size="sm" getText={() => buildGenerateTasksPrompt(r)} icon={<Wand2 size={13} />} toast="Prompt copied — paste it into your AI">Generate tasks with AI</CopyButton>}>
                  Ask an AI to write practice questions from this topic.
                </Empty>
              </div>
            )}
          </Marginal>

          {related.length > 0 && (
            <Marginal id="related" label="Related">
              <div className="-mx-2.5 grid sm:grid-cols-2">
                {related.map((x) => (
                  <ResourceRow key={x.id} resource={x} showStep={getStep(x.stepId)?.label} />
                ))}
              </div>
            </Marginal>
          )}

          <Marginal id="actions" label="Actions">
            <div className="grid gap-2 sm:grid-cols-3">
              <ActionTile
                icon={<Wand2 size={15} />}
                title="Generate tasks"
                text="Copy a prompt asking an AI for 5 new exam-style questions."
                action={<CopyButton size="sm" getText={() => buildGenerateTasksPrompt(r)} toast="Prompt copied — paste it into your AI">Copy prompt</CopyButton>}
              />
              <ActionTile
                icon={<Plus size={15} />}
                title="Create flashcards"
                text="Add your own card, or copy a prompt that asks an AI for a set."
                action={
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" onClick={() => setAddOpen(true)}>
                      Add card
                    </Button>
                    <CopyButton size="sm" variant="ghost" getText={() => buildFlashcardPrompt(r)} toast="Flashcard prompt copied">
                      AI prompt
                    </CopyButton>
                  </div>
                }
              />
              <ActionTile
                icon={<MessageSquareText size={15} />}
                title="Ask about this"
                text={`Write a question about “${r.title}” with context included.`}
                action={
                  <Button size="sm" onClick={() => openAsk(r.id)}>
                    <Sparkles size={13} className="text-accent" /> Ask AI
                  </Button>
                }
              />
            </div>
          </Marginal>
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-[104px] pt-10">
            <Toc items={toc} />
            <div className="mt-8 border-t border-line pt-5 text-[12px] text-fg-3">
              <div className="eyebrow mb-2">{subject.name}</div>
              <Link to={`/learn#${r.stepId}`} className="hover:text-fg">
                ← {step?.label}
              </Link>
            </div>
          </div>
        </aside>
      </div>
      <AddCardDialog open={addOpen} onClose={() => setAddOpen(false)} resource={r} />
    </Page>
  )
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[11.5px] text-fg-3">{label}</dt>
      <dd className="mt-1 text-fg">{children}</dd>
    </div>
  )
}

function FileRowItem({ file, resourceId, isStep, selected, onPreview }: { file: FileRef; resourceId: string; isStep: boolean; selected: boolean; onPreview: () => void }) {
  const exists = fileExists(file.path)
  const info = fileInfo(file.path)
  const kind = kindOf(file.path)
  const canPreview = exists && previewable(file.path)
  return (
    <li className={cn('flex items-center gap-3 bg-ink-1 px-3 py-2.5 transition-colors', selected && 'bg-ink-2')}>
      <span className={cn('code-chip !min-w-11', selected && '!border-accent/40 !text-accent')}>{KIND_LABEL[kind]}</span>
      <div className="min-w-0 flex-1">
        <div className={cn('truncate text-[13.5px]', exists ? 'text-fg' : 'text-fg-3 line-through decoration-fg-3/50')}>{fileLabel(file)}</div>
        <div className="truncate text-[11.5px] text-fg-3">
          {exists ? (
            <>
              {info && formatBytes(info.size)}
              {isStep && ' · shared step material'}
            </>
          ) : (
            <span className="text-warn">Local file unavailable</span>
          )}
        </div>
      </div>
      {exists && (
        <div className="flex shrink-0 items-center gap-1">
          {canPreview && (
            <Button size="sm" variant={selected ? 'secondary' : 'ghost'} onClick={onPreview} aria-pressed={selected} className="max-sm:hidden">
              Preview
            </Button>
          )}
          {canPreview ? (
            <ButtonLink size="sm" variant="ghost" to={`/view?path=${encodeURIComponent(file.path)}&r=${resourceId}`} onClick={() => actions.openFile(file.path)} aria-label={`Open ${fileLabel(file)}`}>
              Open
            </ButtonLink>
          ) : null}
          <a href={fileUrl(file.path, true)} className={buttonClass('ghost', 'sm', '!px-2')} aria-label={`Download ${fileLabel(file)}`} title="Download">
            <Download size={14} />
          </a>
        </div>
      )}
    </li>
  )
}

function TaskList({ title, tasks }: { title: string; tasks: ReturnType<typeof tasksForResource> }) {
  const answers = useStore((s) => s.answers)
  const all = tasksForResource(tasks[0].resourceId)
  return (
    <div className="mt-6">
      <div className="mb-2 text-[12px] font-medium text-fg-2">{title}</div>
      <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
        {tasks.map((t) => {
          const a = answers[t.id]
          return (
            <li key={t.id}>
              <Link to={`/practice/${t.id}`} className="group flex items-center gap-3 bg-ink-1 px-3 py-3 transition-colors hover:bg-ink-2">
                <span className="w-12 shrink-0 font-mono text-[10.5px] text-fg-3">TASK {pad2(all.indexOf(t) + 1)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] text-fg">{t.title}</span>
                  <span className="block truncate text-[11.5px] text-fg-3">
                    {TASK_TYPE_LABEL[t.type]} · {DIFFICULTY_LABEL[t.difficulty]}
                  </span>
                </span>
                {a?.status === 'done' ? <Pill tone="good">Done</Pill> : a?.text ? <Pill>Draft</Pill> : null}
                <ChevronRight size={14} className="shrink-0 text-fg-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ActionTile({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action: ReactNode }) {
  return (
    <div className="flex flex-col rounded-lg border border-line bg-ink-1 p-4">
      <div className="flex items-center gap-2 text-[13.5px] font-medium text-fg">
        <span className="text-fg-3">{icon}</span>
        {title}
      </div>
      <p className="mt-1.5 mb-4 flex-1 text-[12.5px] leading-relaxed text-fg-3">{text}</p>
      {action}
    </div>
  )
}
