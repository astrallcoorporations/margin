import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { orderedSteps, subject, TYPE_LABEL } from '@/lib/data'
import type { Resource } from '@/types'
import { Page, StepPanel } from '@/components/blocks'
import { StudyDashboard } from '@/components/StudyDashboard'
import { Empty, Kbd } from '@/components/ui'
import { useUI } from '@/app/ui-context'

const norm = (s: string) => s.toLowerCase().replace(/[’']/g, '')

export default function Learn() {
  const [q, setQ] = useState('')
  const { openSearch } = useUI()
  const filter = useMemo(() => {
    const tokens = norm(q).split(/\s+/).filter(Boolean)
    if (!tokens.length) return undefined
    return (r: Resource) => {
      const hay = norm([r.title, r.author, r.tags.join(' '), TYPE_LABEL[r.type], r.code, r.description].join(' '))
      return tokens.every((t) => hay.includes(t))
    }
  }, [q])
  const matches = filter ? subject.resources.filter(filter).length : subject.resources.length
  const numbered = orderedSteps.filter((s) => s.id !== 'sa1-review')
  const review = orderedSteps.find((s) => s.id === 'sa1-review')

  return (
    <Page wide>
      <header className="flex items-start justify-between gap-6 pt-10 pb-10 sm:pt-12">
        <div>
          <div className="mb-3 text-[12px] font-bold tracking-[0.18em] text-[#7a7a7a] uppercase">
            {subject.classLabel} · {subject.name}
          </div>
          <h1 className="text-[44px] leading-[0.98] font-[760] tracking-[-0.055em] text-fg sm:text-[52px]">{subject.term}</h1>
        <div className="mosaic-rule mt-5" aria-hidden="true" />
          <p className="mt-3.5 text-[15px] text-[#8a8a8a]">{subject.tagline}</p>
        </div>
        <div className="min-w-[120px] rounded-none border border-[#232323] bg-[rgba(17,17,17,0.7)] px-5 py-4 backdrop-blur-xl sm:min-w-[145px]">
          <b className="block text-[25px] tracking-[-0.04em] tabular-nums">{subject.resources.length}</b>
          <span className="text-[12px] text-fg-3">resources</span>
        </div>
      </header>

      <div className="relative mb-7">
        <Search size={15} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-fg-3" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && setQ('')}
          placeholder="Search resources…"
          aria-label="Filter resources"
          className="h-[50px] w-full rounded-none border border-[#232323] bg-[rgba(14,14,14,0.8)] pr-24 pl-11 text-[14px] text-fg placeholder:text-fg-3 transition-[border-color,box-shadow] focus:border-[#555555] focus:shadow-[0_0_0_4px_rgba(255,213,0,0.08)] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        <div className="absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center gap-2">
          {q ? (
            <>
              <span className="font-mono text-[11px] text-fg-3 tabular-nums">{matches} match{matches === 1 ? '' : 'es'}</span>
              <button onClick={() => setQ('')} className="grid size-6 place-items-center rounded text-fg-3 hover:bg-ink-3 hover:text-fg" aria-label="Clear filter">
                <X size={13} />
              </button>
            </>
          ) : (
            <button onClick={openSearch} className="hidden items-center gap-1 text-[11px] text-fg-3 hover:text-fg-2 sm:flex" aria-label="Open global search">
              <span>Global</span> <Kbd>/</Kbd>
            </button>
          )}
        </div>
      </div>

      {filter && matches === 0 ? (
        <Empty title={`Nothing matches “${q}”`} action={<button className="text-[13px] text-accent hover:underline" onClick={() => setQ('')}>Clear filter</button>}>
          Try an author (“Tennyson”), a type (“poem”) or a skill (“inference”).
        </Empty>
      ) : (
        <div className="grid gap-[15px] md:grid-cols-2">
          {numbered.map((s) => (
            <StepPanel key={s.id} step={s} filter={filter} />
          ))}
          {review && <StepPanel step={review} filter={filter} full />}
        </div>
      )}
      <StudyDashboard />

      <p className="mt-10 text-center font-mono text-[10.5px] tracking-wide text-fg-3 uppercase">
        {subject.name} {subject.term} · resource index
      </p>
    </Page>
  )
}
