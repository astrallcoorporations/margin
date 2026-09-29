import { useState, type ReactNode } from 'react'
import { Check, Copy, Loader2 } from 'lucide-react'
import { copyText } from '@/lib/clipboard'
import { Button } from './ui'
import { useToast } from './toast'

/** Copies text (sync or async) with inline "Copied" feedback and a toast. */
export function CopyButton({
  getText,
  children,
  toast = 'Copied to clipboard',
  variant = 'secondary',
  size = 'md',
  icon,
  className,
  title,
}: {
  getText: () => string | Promise<string>
  children: ReactNode
  toast?: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'quiet'
  size?: 'sm' | 'md'
  icon?: ReactNode
  className?: string
  title?: string
}) {
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle')
  const notify = useToast()
  const run = async () => {
    setState('busy')
    try {
      const text = await getText()
      const ok = await copyText(text)
      if (!ok) throw new Error('copy failed')
      setState('done')
      notify(toast)
      window.setTimeout(() => setState('idle'), 1600)
    } catch (e) {
      setState('idle')
      notify(e instanceof Error && e.message !== 'copy failed' ? e.message : 'Couldn’t copy — your browser blocked clipboard access', 'error')
    }
  }
  return (
    <Button variant={variant} size={size} onClick={run} className={className} title={title} aria-live="polite">
      {state === 'busy' ? (
        <Loader2 size={14} className="animate-spin" />
      ) : state === 'done' ? (
        <Check size={14} className={variant === 'primary' ? '' : 'text-good'} />
      ) : (
        (icon ?? <Copy size={14} />)
      )}
      {state === 'done' ? 'Copied' : children}
    </Button>
  )
}
