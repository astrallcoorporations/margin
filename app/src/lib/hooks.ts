import { useMemo } from 'react'
import type { Flashcard } from '@/types'
import { subject } from './data'
import { useStore } from './storage'

/** Built-in flashcards plus the ones the student added themselves. */
export function useAllCards(): Flashcard[] {
  const custom = useStore((s) => s.customCards)
  return useMemo(() => [...subject.flashcards, ...custom], [custom])
}

export function useCardsFor(resourceId: string): Flashcard[] {
  const all = useAllCards()
  return useMemo(() => all.filter((c) => c.resourceId === resourceId), [all, resourceId])
}
