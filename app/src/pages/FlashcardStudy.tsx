import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Plus, RotateCcw, Shuffle, Trash2 } from 'lucide-react'
import { getResource } from '@/lib/data'
import { useAllCards } from '@/lib/hooks'
import { actions, getState, useStore, type CardStatus } from '@/lib/storage'
import { cn, isTyping, shuffle } from '@/lib/utils'
import type { Flashcard } from '@/types'
import { Breadcrumbs, Page } from '@/components/blocks'
import { AddCardDialog } from '@/components/AddCardDialog'
import { Button, ButtonLink, Empty, Kbd } from '@/components/ui'
import NotFound from './NotFound'

export default function FlashcardStudy() {
  const { deckId = '' } = useParams()
  const all = useAllCards()
  const resource = getResource(deckId)
  const special = deckId === 'review' || deckId === 'all'

  // The deck is fixed when the session starts so marking cards doesn't reshuffle it mid-run.
  const deck = useMemo<Flashcard[]>(() => {
    if (deckId === 'all') return shuffle(all)
    if (deckId === 'review') return all.filter((c) => getState().cards[c.id]?.status === 'review')
    return all.filter((c) => c.resourceId === deckId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId, all.length])

  useEffect(() => {
    if (resource || special) actions.studiedDeck(deckId)
  }, [deckId, resource, special])

  if (!resource && !special) return <NotFound what="deck" />
  const title = deckId === 'review' ? 'Review deck' : deckId === 'all' ? 'Mixed revision' : resource!.title
  return <Session key={deckId + deck.length} deckId={deckId} title={title} initial={deck} />
}

function Session({ deckId, title, initial }: { deckId: string; title: string; initial: Flashcard[] }) {
  const [order, setOrder] = useState(initial)
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [results, setResults] = useState<Record<string, CardStatus>>({})
  const [addOpen, setAddOpen] = useState(false)
  const saved = useStore((s) => s.cards)
  const resource = getResource(deckId)
  const finished = order.length > 0 && i >= order.length
  const card = order[Math.min(i, order.length - 1)]

  const go = useCallback((d: number) => {
    setFlipped(false)
    setI((x) => Math.max(0, Math.min(order.length, x + d)))
  }, [order.length])

  const mark = useCallback(
    (status: CardStatus) => {
      if (!card || finished) return
      actions.markCard(card.id, status)
      setResults((r) => ({ ...r, [card.id]: status }))
      setFlipped(false)
      setI((x) => x + 1)
    },
    [card, finished],
  )

  const restart = useCallback((cards?: Flashcard[]) => {
    setOrder(cards ?? initial)
    setI(0)
    setFlipped(false)
    setResults({})
  }, [initial])

  const doShuffle = useCallback(() => {
    setOrder((o) => shuffle(o))
    setI(0)
    setFlipped(false)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e) || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('[role="dialog"]')) return
      if (e.key === ' ' || e.key === 'Enter') {
        if (finished) return
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === '1') mark('review')
      else if (e.key === '2') mark('known')
      else if (e.key.toLowerCase() === 's') doShuffle()
      else if (e.key.toLowerCase() === 'r') restart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, mark, doShuffle, restart, finished])

  const crumbs = [{ label: 'Flashcards', to: '/flashcards' }, ...(resource ? [{ label: resource.title, to: `/learn/${resource.id}` }] : []), { label: 'Study' }]

  if (!order.length) {
    return (
      <Page>
        <div className="pt-10">
          <Breadcrumbs items={crumbs} />
          <h1 className="mb-8 text-[28px] font-semibold tracking-[-0.03em]">{title}</h1>
          <Empty
            icon={<RotateCcw size={16} />}
            title={deckId === 'review' ? 'Your review deck is empty' : 'No cards in this deck yet'}
            action={
              deckId === 'review' ? (
                <ButtonLink to="/flashcards/all">Study all cards</ButtonLink>
              ) : resource ? (
                <Button onClick={() => setAddOpen(true)}>
                  <Plus size={14} /> Add a card
                </Button>
              ) : undefined
            }
          >
            {deckId === 'review' ? 'Cards you mark “Need review” collect here so you can drill just the ones you missed.' : 'Add your own cards and they’ll appear here.'}
          </Empty>
        </div>
        {resource && <AddCardDialog open={addOpen} onClose={() => setAddOpen(false)} resource={resource} />}
      </Page>
    )
  }

  const knownN = Object.values(results).filter((s) => s === 'known').length
  const reviewN = Object.values(results).filter((s) => s === 'review').length
  const missed = order.filter((c) => results[c.id] === 'review')

  return (
    <Page>
      <div className="pt-8 sm:pt-10">
        <Breadcrumbs items={crumbs} />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-[26px] font-semibold tracking-[-0.03em] text-fg sm:text-[30px]">{title}</h1>
          <div className="flex items-center gap-1">
            {resource && (
              <Button size="sm" variant="ghost" onClick={() => setAddOpen(true)}>
                <Plus size={13} /> Add card
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={doShuffle} title="Shuffle (S)">
              <Shuffle size={13} /> Shuffle
            </Button>
            <Button size="sm" variant="ghost" onClick={() => restart()} title="Restart (R)">
              <RotateCcw size={13} /> Restart
            </Button>
          </div>
        </div>

        {/* progress segments */}
        <div className="mt-6 flex gap-[3px]" aria-hidden="true">
          {order.map((c, idx) => (
            <button
              key={c.id + idx}
              tabIndex={-1}
              onClick={() => {
                setI(idx)
                setFlipped(false)
              }}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                results[c.id] === 'known' ? 'bg-good/70' : results[c.id] === 'review' ? 'bg-warn/70' : idx === i ? 'bg-fg-2' : 'bg-line-2 hover:bg-fg-3',
              )}
            />
          ))}
        </div>
      </div>

      {finished ? (
        <div className="mt-8 animate-rise rounded-lg border border-line bg-ink-1 p-8 text-center">
          <div className="eyebrow">Deck complete</div>
          <div className="mt-5 flex justify-center gap-10">
            <div>
              <div className="text-[34px] font-semibold tracking-[-0.04em] text-good tabular-nums">{knownN}</div>
              <div className="text-[12px] text-fg-3">Know</div>
            </div>
            <div>
              <div className="text-[34px] font-semibold tracking-[-0.04em] text-warn tabular-nums">{reviewN}</div>
              <div className="text-[12px] text-fg-3">Need review</div>
            </div>
            <div>
              <div className="text-[34px] font-semibold tracking-[-0.04em] text-fg-3 tabular-nums">{order.length - knownN - reviewN}</div>
              <div className="text-[12px] text-fg-3">Skipped</div>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {missed.length > 0 && (
              <Button variant="primary" onClick={() => restart(missed)}>
                Drill the {missed.length} I missed
              </Button>
            )}
            <Button onClick={() => restart()}>
              <RotateCcw size={14} /> Start again
            </Button>
            <ButtonLink variant="ghost" to="/flashcards">
              All decks
            </ButtonLink>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center justify-between text-[12px] text-fg-3">
            <span className="font-mono tabular-nums">
              {i + 1} / {order.length}
            </span>
            {card && saved[card.id] && (
              <span className={saved[card.id].status === 'known' ? 'text-good' : 'text-warn'}>
                Last time: {saved[card.id].status === 'known' ? 'known' : 'needed review'}
              </span>
            )}
          </div>

          <div className="flip mt-3">
            <button
              onClick={() => setFlipped((f) => !f)}
              className="flip-inner block h-[300px] w-full text-left sm:h-[340px]"
              data-flipped={flipped}
              aria-label={flipped ? 'Show question' : 'Reveal answer'}
              aria-live="polite"
            >
              <div className="flip-face flex flex-col rounded-lg border border-line-2 bg-ink-1 p-6 sm:p-10">
                <div className="flex items-center justify-between">
                  <span className="eyebrow !text-[10px]">Question</span>
                  {getResource(card.resourceId) && deckId !== card.resourceId && (
                    <span className="truncate text-[11px] text-fg-3">{getResource(card.resourceId)!.title}</span>
                  )}
                </div>
                <div className="flex flex-1 items-center justify-center">
                  <p className="max-w-[34ch] text-center text-[20px] leading-snug font-medium tracking-[-0.015em] text-balance text-fg sm:text-[24px]">{card.front}</p>
                </div>
                <div className="text-center text-[12px] text-fg-3">
                  Click or press <Kbd>Space</Kbd> to reveal
                </div>
              </div>
              <div className="flip-face flip-back flex flex-col rounded-lg border border-accent/30 bg-ink-2 p-6 sm:p-10">
                <span className="eyebrow !text-[10px] !text-accent">Answer</span>
                <div className="flex flex-1 items-center justify-center">
                  <p className="max-w-[46ch] text-center text-[16px] leading-relaxed text-pretty text-fg sm:text-[18px]">{card.back}</p>
                </div>
                <div className="truncate text-center text-[12px] text-fg-3">{card.front}</div>
              </div>
            </button>
          </div>

          <div className="mt-5 grid grid-cols-[auto_1fr_1fr_auto] gap-2">
            <Button onClick={() => go(-1)} disabled={i === 0} aria-label="Previous card" className="!px-3">
              <ArrowLeft size={15} />
            </Button>
            <Button onClick={() => mark('review')} className="hover:!border-warn/50 hover:!text-warn">
              <RotateCcw size={14} /> Need review <span className="kbd ml-1 max-sm:hidden">1</span>
            </Button>
            <Button onClick={() => mark('known')} className="hover:!border-good/50 hover:!text-good">
              <Check size={14} /> Know <span className="kbd ml-1 max-sm:hidden">2</span>
            </Button>
            <Button onClick={() => go(1)} aria-label="Next card" className="!px-3">
              <ArrowRight size={15} />
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11.5px] text-fg-3 max-sm:hidden">
            <span className="flex items-center gap-1.5"><Kbd>Space</Kbd> flip</span>
            <span className="flex items-center gap-1.5"><Kbd>←</Kbd><Kbd>→</Kbd> move</span>
            <span className="flex items-center gap-1.5"><Kbd>S</Kbd> shuffle</span>
            <span className="flex items-center gap-1.5"><Kbd>R</Kbd> restart</span>
          </div>

          {card.id.startsWith('custom:') && (
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  actions.removeCustomCard(card.id)
                  setOrder((o) => o.filter((c) => c.id !== card.id))
                }}
                className="inline-flex items-center gap-1.5 text-[12px] text-fg-3 hover:text-fg-2"
              >
                <Trash2 size={12} /> Delete this card (yours)
              </button>
            </div>
          )}
        </>
      )}
      {resource && <AddCardDialog open={addOpen} onClose={() => setAddOpen(false)} resource={resource} />}
    </Page>
  )
}
