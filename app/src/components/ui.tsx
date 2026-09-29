import { forwardRef, useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, type LinkProps } from 'react-router-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'quiet'
type Size = 'sm' | 'md'

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background,border-color,color,transform,box-shadow] duration-150 disabled:pointer-events-none disabled:opacity-40 select-none'

const variants: Record<Variant, string> = {
  primary: 'btn btn-primary bg-accent text-black border border-transparent font-pixel !text-[11px] tracking-[0.08em] uppercase',
  secondary: 'btn btn-secondary border border-line-2 bg-ink-2 text-fg hover:border-fg-3',
  ghost: 'btn btn-ghost border border-transparent text-fg-2 hover:text-fg',
  quiet: 'border border-transparent text-fg-3 hover:text-fg-2',
}

const sizes: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-[12.5px] rounded-none',
  md: 'h-8.5 px-3.5 text-[13px] rounded-none',
}

export function buttonClass(variant: Variant = 'secondary', size: Size = 'md', extra?: string) {
  return cn(base, variants[variant], sizes[size], extra)
}

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(function Button({ variant = 'secondary', size = 'md', className, type = 'button', ...props }, ref) {
  return <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...props} />
})

export function ButtonLink({ variant = 'secondary', size = 'md', className, ...props }: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />
}

export const Kbd = ({ children }: { children: ReactNode }) => <kbd className="kbd">{children}</kbd>

export const Code = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cn('code-chip', className)} aria-hidden="true">
    {children}
  </span>
)

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('eyebrow', className)}>{children}</div>
}

export function Pill({ children, tone = 'default', className }: { children: ReactNode; tone?: 'default' | 'accent' | 'good' | 'warn'; className?: string }) {
  const tones = {
    default: 'text-fg-2 border-line-2',
    accent: 'text-accent border-accent/30 bg-accent/[0.06]',
    good: 'text-good border-good/30 bg-good/[0.06]',
    warn: 'text-warn border-warn/30 bg-warn/[0.06]',
  }
  return (
    <span className={cn('inline-flex h-5 items-center gap-1 rounded-[4px] border px-1.5 text-[11px] font-medium', tones[tone], className)}>
      {children}
    </span>
  )
}

export function Section({ id, title, aside, children, className }: { id?: string; title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={cn('scroll-mt-32 border-t border-line pt-7 pb-10', className)} aria-labelledby={id ? `${id}-h` : undefined}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id={id ? `${id}-h` : undefined} className="eyebrow">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

export function Empty({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-line-2 px-5 py-6">
      {icon && <div className="mb-1 text-fg-3">{icon}</div>}
      <p className="text-[13.5px] font-medium text-fg">{title}</p>
      {children && <p className="max-w-md text-[13px] leading-relaxed text-fg-3">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function Progress({ value, max, className, label }: { value: number; max: number; className?: string; label?: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0
  return (
    <div
      className={cn('h-1 w-full overflow-hidden rounded-full bg-line', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
    >
      <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  )
}

/** Accessible modal: portal, focus trap, Esc/overlay to close, restores focus. */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  labelledBy,
  hideHeader,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
  labelledBy?: string
  hideHeader?: boolean
}) {
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const node = panel.current
    const focusables = () =>
      Array.from(node?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,textarea,select,[tabindex]:not([tabindex="-1"])') ?? [])
    const first = node?.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0]
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'Tab') {
        const f = focusables()
        if (!f.length) return
        const [a, z] = [f[0], f[f.length - 1]]
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault()
          z.focus()
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault()
          a.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      prev?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : title}
        aria-labelledby={labelledBy}
        className={cn(
          'relative w-full max-w-lg animate-pop overflow-hidden rounded-lg border border-line-2 bg-ink-1 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.7)]',
          className,
        )}
      >
        {!hideHeader && (
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-[13.5px] font-medium text-fg">{title}</h2>
            <button onClick={onClose} className="grid size-7 place-items-center rounded-md text-fg-3 hover:bg-ink-3 hover:text-fg" aria-label="Close">
              <X size={15} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}
