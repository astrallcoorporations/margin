import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CornerDownLeft, Search } from 'lucide-react'
import { GROUP_ORDER, search, type SearchItem } from '@/lib/search'
import { getResource, getTask } from '@/lib/data'
import { useStore } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { Code, Kbd, Modal } from './ui'

const JUMP: SearchItem[] = [
  { group: 'Topics', id: 'go-home', title: 'Overview', meta: 'G H', code: 'GO', href: '/', fields: [] },
  { group: 'Topics', id: 'go-learn', title: 'Learn — curriculum', meta: 'G L', code: 'GO', href: '/learn', fields: [] },
  { group: 'Topics', id: 'go-practice', title: 'Practice — tasks', meta: 'G P', code: 'GO', href: '/practice', fields: [] },
  { group: 'Topics', id: 'go-cards', title: 'Flashcards', meta: 'G F', code: 'GO', href: '/flashcards', fields: [] },
  { group: 'Topics', id: 'go-review', title: 'Review', meta: 'G R', code: 'GO', href: '/review', fields: [] },
]

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const listRef = useRef<HTMLDivElement>(null)
  const activity = useStore((s) => s.activity)

  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
    }
  }, [open])

  const recent = useMemo<SearchItem[]>(() => {
    const out: SearchItem[] = []
    for (const a of activity) {
      if (a.kind === 'resource') {
        const r = getResource(a.id)
        if (r) out.push({ group: 'Resources', id: r.id, title: r.title, meta: 'Recently opened', code: r.code, href: `/learn/${r.id}`, fields: [] })
      } else if (a.kind === 'task') {
        const t = getTask(a.id)
        if (t) out.push({ group: 'Tasks', id: t.id, title: t.title, meta: 'Recently worked on', code: 'TASK', href: `/practice/${t.id}`, fields: [] })
      }
      if (out.length >= 4) break
    }
    return out
  }, [activity])

  const results = useMemo(() => search(q), [q])
  const sections = useMemo(() => {
    if (!q.trim()) {
      return [
        ...(recent.length ? [{ label: 'Recent', items: recent }] : []),
        { label: 'Jump to', items: JUMP },
      ]
    }
    return GROUP_ORDER.map((g) => ({ label: g, items: results.filter((r) => r.group === g) })).filter((s) => s.items.length)
  }, [q, results, recent])
  const flat = sections.flatMap((s) => s.items)

  useEffect(() => setActive(0), [q])
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const go = (item: SearchItem | undefined) => {
    if (!item) return
    onClose()
    navigate(item.href)
  }

  let idx = -1
  return (
    <Modal open={open} onClose={onClose} hideHeader title="Search" className="max-w-[600px]">
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search size={16} className="shrink-0 text-fg-3" />
        <input
          data-autofocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((a) => Math.min(a + 1, flat.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => Math.max(a - 1, 0))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              go(flat[active])
            }
          }}
          placeholder="Search resources, tasks, steps, tags…"
          className="h-13 flex-1 bg-transparent text-[14.5px] text-fg placeholder:text-fg-3 focus:outline-none"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-activedescendant={flat[active] ? `pal-${active}` : undefined}
          aria-label="Search"
        />
        <Kbd>Esc</Kbd>
      </div>

      <div ref={listRef} id="palette-list" role="listbox" className="max-h-[min(60vh,440px)] overflow-y-auto p-2">
        {sections.length === 0 && (
          <div className="px-3 py-10 text-center">
            <p className="text-[13.5px] text-fg">No matches for “{q}”</p>
            <p className="mt-1 text-[12.5px] text-fg-3">Try a title, an author, a step number or a tag like “irony”.</p>
          </div>
        )}
        {sections.map((section) => (
          <div key={section.label} className="mb-1" role="group" aria-label={section.label}>
            <div className="eyebrow px-2.5 pt-2.5 pb-1.5 !text-[10px]">{section.label}</div>
            {section.items.map((item) => {
              idx++
              const i = idx
              const isActive = i === active
              return (
                <button
                  key={`${item.group}-${item.id}`}
                  id={`pal-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={isActive}
                  onMouseMove={() => setActive(i)}
                  onClick={() => go(item)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors',
                    isActive ? 'bg-ink-3' : 'hover:bg-ink-2',
                  )}
                >
                  <Code className={isActive ? '!border-accent/40 !text-accent' : ''}>{item.code}</Code>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] text-fg">{item.title}</span>
                    <span className="block truncate text-[11.5px] text-fg-3">{item.meta}</span>
                  </span>
                  {isActive ? <CornerDownLeft size={13} className="text-fg-3" /> : <ArrowRight size={13} className="text-transparent" />}
                </button>
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-[11.5px] text-fg-3">
        <span className="flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
        <span className="flex items-center gap-1.5"><Kbd>↵</Kbd> open</span>
        <span className="ml-auto">{q.trim() ? `${flat.length} result${flat.length === 1 ? '' : 's'}` : 'Type to search'}</span>
      </div>
    </Modal>
  )
}
