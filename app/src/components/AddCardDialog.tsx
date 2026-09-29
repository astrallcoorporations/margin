import { useEffect, useState } from 'react'
import type { Resource } from '@/types'
import { actions } from '@/lib/storage'
import { Button, Modal } from './ui'
import { useToast } from './toast'

export function AddCardDialog({ open, onClose, resource }: { open: boolean; onClose: () => void; resource: Resource }) {
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [count, setCount] = useState(0)
  const notify = useToast()

  useEffect(() => {
    if (open) {
      setFront('')
      setBack('')
      setCount(0)
    }
  }, [open])

  const valid = front.trim() && back.trim()
  const save = (keepOpen: boolean) => {
    if (!valid) return
    actions.addCustomCard(resource.id, front.trim(), back.trim())
    notify('Card added')
    setCount((n) => n + 1)
    setFront('')
    setBack('')
    if (!keepOpen) onClose()
  }

  const field = 'w-full resize-none rounded-md border border-line-2 bg-ink-2 px-3 py-2.5 text-[13.5px] leading-relaxed text-fg placeholder:text-fg-3 focus:border-accent/60 focus:outline-none'

  return (
    <Modal open={open} onClose={onClose} title={`New card — ${resource.title}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save(true)
        }}
      >
        <div className="space-y-4 p-5">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-fg-2">Front</span>
            <textarea data-autofocus rows={2} value={front} onChange={(e) => setFront(e.target.value)} placeholder="Question or term" className={field} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-fg-2">Back</span>
            <textarea
              rows={3}
              value={back}
              onChange={(e) => setBack(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault()
                  save(true)
                }
              }}
              placeholder="Answer"
              className={field}
            />
          </label>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-line px-5 py-3">
          <span className="text-[12px] text-fg-3">{count ? `${count} added` : 'Saved on this device'}</span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              {count ? 'Done' : 'Cancel'}
            </Button>
            <Button type="submit" variant="primary" disabled={!valid}>
              Add card
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
