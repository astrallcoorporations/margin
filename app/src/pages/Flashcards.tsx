import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, RotateCcw, Shuffle } from 'lucide-react'
import { getResource, orderedSteps } from '@/lib/data'
import { useAllCards } from '@/lib/hooks'
import { useStore } from '@/lib/storage'
import type { Flashcard } from '@/types'
import { Page, PageHeader } from '@/components/blocks'
import { Code, Progress } from '@/components/ui'

export default function Flashcards() {
  const cards = useAllCards()
  const state = useStore((s) => s.cards)

  const byResource = useMemo(() => {
    const m = new Map<string, Flashcard[]>()
    cards.forEach((c) => m.set(c.resourceId, [...(m.get(c.resourceId) ?? []), c]))
    return m
  }, [cards])

  const reviewCount = cards.filter((c) => state[c.id]?.status === 'review').length
  const knownCount = cards.filter((c) => state[c.id]?.status === 'known').length

  return (
    <Page wide>
      <PageHeader
        eyebrow="Flashcards"
        title="Decks"
        lede="One deck per topic, written from your notes. Mark each card “Know” or “Need review” — the ones you miss come back in your review deck."
        aside={
          <div className="w-48">
            <div className="flex justify-between text-[11.5px] text-fg-3">
              <span>Known</span>
              <span className="tabular-nums">
                {knownCount}/{cards.length}
              </span>
            </div>
            <Progress value={knownCount} max={cards.length} className="mt-2" label="Cards known" />
          </div>
        }
      />

      <div className="mb-10 grid gap-3 sm:grid-cols-2">
        <Link
          to="/flashcards/review"
          className="group flex items-center gap-4 rounded-lg border border-line bg-ink-1 p-4 transition-colors hover:border-line-2 hover:bg-ink-2"
        >
          <span className="grid size-9 place-items-center rounded-md border border-line-2 text-warn">
            <RotateCcw size={15} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-medium text-fg">Review deck</span>
            <span className="block text-[12.5px] text-fg-3">{reviewCount ? `${reviewCount} cards marked “need review”` : 'Empty — nothing marked yet'}</span>
          </span>
          <ChevronRight size={15} className="text-fg-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          to="/flashcards/all"
          className="group flex items-center gap-4 rounded-lg border border-line bg-ink-1 p-4 transition-colors hover:border-line-2 hover:bg-ink-2"
        >
          <span className="grid size-9 place-items-center rounded-md border border-line-2 text-accent">
            <Shuffle size={15} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-medium text-fg">Mixed revision</span>
            <span className="block text-[12.5px] text-fg-3">All {cards.length} cards, shuffled</span>
          </span>
          <ChevronRight size={15} className="text-fg-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="space-y-10">
        {orderedSteps.map((step) => {
          const decks = [...byResource.entries()].filter(([rid]) => getResource(rid)?.stepId === step.id)
          if (!decks.length) return null
          return (
            <section key={step.id} aria-labelledby={`fc-${step.id}`}>
              <div className="mb-3 flex items-baseline justify-between border-b border-line pb-2">
                <h2 id={`fc-${step.id}`} className="text-[14px] font-semibold tracking-[-0.01em] text-fg">
                  {step.label}
                  {step.note && <span className="font-normal text-accent"> · {step.note}</span>}
                </h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {decks.map(([rid, list]) => {
                  const r = getResource(rid)!
                  const known = list.filter((c) => state[c.id]?.status === 'known').length
                  const review = list.filter((c) => state[c.id]?.status === 'review').length
                  return (
                    <Link key={rid} to={`/flashcards/${rid}`} className="group rounded-lg border border-line bg-ink-1 p-4 transition-colors hover:border-line-2 hover:bg-ink-2">
                      <div className="flex items-start gap-3">
                        <Code>{r.code}</Code>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13.5px] font-medium text-fg">{r.title}</div>
                          <div className="mt-0.5 text-[11.5px] text-fg-3">
                            {list.length} cards{review ? <span className="text-warn"> · {review} to review</span> : null}
                          </div>
                        </div>
                      </div>
                      <Progress value={known} max={list.length} className="mt-4" label={`${r.title} cards known`} />
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </Page>
  )
}
