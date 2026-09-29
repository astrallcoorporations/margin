import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { Resource, Step } from '@/types'
import { cardsForResource, inExam, resourcesInStep, tasksForResource, TYPE_LABEL } from '@/lib/data'
import { useStore } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { Code } from './ui'

export function PageHeader({
  eyebrow,
  title,
  lede,
  aside,
  crumbs,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  lede?: ReactNode
  aside?: ReactNode
  crumbs?: { label: string; to?: string }[]
}) {
  return (
    <header className="pt-8 pb-8 sm:pt-10">
      {crumbs && <Breadcrumbs items={crumbs} />}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          {eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}
          <h1 className="text-[30px] leading-[1.08] font-semibold tracking-[-0.035em] text-fg text-balance sm:text-[38px]">{title}</h1>
          {lede && <p className="mt-3 max-w-[60ch] text-[14.5px] leading-relaxed text-fg-2 text-pretty">{lede}</p>}
        </div>
        {aside}
      </div>
    </header>
  )
}

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-fg-3">
        {items.map((c, i) => (
          <li key={i} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && <ChevronRight size={12} className="shrink-0 opacity-60" aria-hidden="true" />}
            {c.to ? (
              <Link to={c.to} className="truncate rounded-sm transition-colors hover:text-fg">
                {c.label}
              </Link>
            ) : (
              <span className="truncate text-fg-2" aria-current="page">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function Page({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return <div className={cn('stagger relative isolate mx-auto w-full px-4 pb-24 sm:px-6 lg:px-10', wide ? 'max-w-[1180px]' : 'max-w-[960px]')}>{children}</div>
}

/** One resource line — code chip, title, metadata, chevron. Used everywhere resources are listed. */
export function ResourceRow({ resource, showStep, hideMeta }: { resource: Resource; showStep?: string; hideMeta?: boolean }) {
  const visited = useStore((s) => s.visits[resource.id])
  const tasks = tasksForResource(resource.id).length
  const cards = cardsForResource(resource.id).length
  const meta = [
    showStep,
    resource.author,
    tasks ? `${tasks} task${tasks > 1 ? 's' : ''}` : null,
    cards ? `${cards} cards` : null,
  ].filter(Boolean)
  return (
    <Link
      to={`/learn/${resource.id}`}
      className="row-bar group relative flex items-center gap-3 rounded-md px-2.5 py-2.5 transition-colors hover:bg-ink-3 focus-visible:bg-ink-3"
    >
      <Code className="group-hover:border-[#474747] group-hover:text-fg">{resource.code}</Code>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] leading-snug text-fg">{resource.title}</span>
        {!hideMeta && meta.length > 0 && <span className="mt-0.5 block truncate text-[11.5px] text-fg-3">{meta.join(' · ')}</span>}
      </span>
      {visited && <span className="size-1.5 shrink-0 rounded-full bg-accent/70" title="Opened before" aria-label="Opened before" />}
      <ChevronRight size={15} className="shrink-0 text-fg-3 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-fg-2" aria-hidden="true" />
      <span className="sr-only">{TYPE_LABEL[resource.type]}</span>
    </Link>
  )
}

export function StepPanel({ step, filter, full }: { step: Step; filter?: (r: Resource) => boolean; full?: boolean }) {
  const all = resourcesInStep(step.id)
  const items = filter ? all.filter(filter) : all
  if (!items.length) return null
  const isReview = step.id === 'sa1-review'
  return (
    <section
      id={step.id}
      aria-labelledby={`${step.id}-title`}
      className={cn(
        'scroll-mt-32 overflow-hidden rounded-none border bg-[linear-gradient(145deg,rgba(17,17,17,0.92),rgba(12,12,12,0.94))] card-hover',
        isReview ? 'border-[#2e2e2e]' : 'border-[#232323]',
        full && 'md:col-span-2',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between border-b border-[#232323] px-5 py-[18px]',
          isReview && 'bg-[linear-gradient(90deg,rgba(255,213,0,0.05),transparent)]',
        )}
      >
        <h2 id={`${step.id}-title`} className="text-[18px] font-bold tracking-[-0.025em] text-fg">
          {step.label}
          {step.note && <span className="text-[#ffd500]"> · {step.note}</span>}
        </h2>
        <span className="border border-[#2a2a2a] px-2.5 py-1 text-[11px] text-[#999999] tabular-nums" aria-label={`${items.length} resources`}>
          {filter ? `${items.length}/${all.length}` : items.length}
        </span>
      </div>
      <div className="p-[7px]">
        {items.map((r) => (
          <IndexRow key={r.id} resource={r} />
        ))}
      </div>
    </section>
  )
}

/** Row styled after the original index page: square code icon, title, › arrow. */
function IndexRow({ resource: r }: { resource: Resource }) {
  const visited = useStore((s) => s.visits[r.id])
  return (
    <Link
      to={`/learn/${r.id}`}
      className="row-bar group flex items-center gap-[13px] rounded-xl px-3 py-3 text-fg transition-colors duration-150 hover:bg-[#171717] focus-visible:bg-[#171717]"
    >
      <span
        className="grid size-[34px] shrink-0 place-items-center rounded-none border border-[#2a2a2a] bg-[#161616] text-[9.5px] font-bold tracking-[0.02em] text-[#b5b5b5] transition-colors group-hover:border-[#474747] group-hover:text-fg"
        aria-hidden="true"
      >
        {r.code}
      </span>
      <span className="min-w-0 flex-1 text-[14px] leading-[1.3]">
        {r.title}
        {(r.author || !inExam(r)) && (
          <span className="mt-0.5 block text-[11.5px] text-fg-3">
            {r.author}
            {!inExam(r) && <span className="text-[#6e6e6e]">{r.author ? ' · ' : ''}not listed for SA1</span>}
          </span>
        )}
      </span>
      {visited && <span className="size-1.5 shrink-0 rounded-full bg-accent/70" title="Opened before" aria-label="Opened before" />}
      <span className="text-[20px] leading-none text-[#555555] transition-[color,transform] duration-150 group-hover:translate-x-[3px] group-hover:text-[#bdbdbd]" aria-hidden="true">
        ›
      </span>
      <span className="sr-only">{TYPE_LABEL[r.type]}</span>
    </Link>
  )
}

/** Right-hand "On this page" navigation with scroll-spy. */
export function Toc({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id)
  useEffect(() => {
    // Active = the last section whose top has scrolled past the header line.
    const update = () => {
      const els = items.map((i) => document.getElementById(i.id)).filter((x): x is HTMLElement => Boolean(x))
      if (!els.length) return
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
      let current = els[0].id
      for (const el of els) if (el.getBoundingClientRect().top <= 170) current = el.id
      setActive(atBottom ? els[els.length - 1].id : current)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [items])
  return (
    <nav aria-label="On this page" className="text-[12.5px]">
      <div className="eyebrow mb-3">On this page</div>
      <ul className="space-y-0.5 border-l border-line">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(i.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                history.replaceState(null, '', `#${i.id}`)
                setActive(i.id)
              }}
              className={cn(
                '-ml-px block border-l py-1 pl-3 transition-colors',
                active === i.id ? 'border-accent text-fg' : 'border-transparent text-fg-3 hover:text-fg-2',
              )}
            >
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function Stat({ label, value, hint, to }: { label: string; value: ReactNode; hint?: ReactNode; to?: string }) {
  const body = (
    <>
      <div className="text-[11.5px] text-fg-3">{label}</div>
      <div className="mt-1.5 text-[22px] font-semibold tracking-[-0.03em] text-fg tabular-nums">{value}</div>
      {hint && <div className="mt-1 truncate text-[11.5px] text-fg-3">{hint}</div>}
    </>
  )
  const cls = 'block rounded-lg border border-line bg-ink-1 px-4 py-3.5 transition-colors'
  return to ? (
    <Link to={to} className={cn(cls, 'hover:border-line-2 hover:bg-ink-2')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}
