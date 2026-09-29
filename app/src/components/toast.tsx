import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { Check, CircleAlert } from 'lucide-react'

type Toast = { id: number; text: string; tone: 'ok' | 'error' }

const Ctx = createContext<(text: string, tone?: Toast['tone']) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const seq = useRef(0)
  const push = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = ++seq.current
    setToasts((t) => [...t.slice(-2), { id, text, tone }])
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2400)
  }, [])
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex animate-rise items-center gap-2 rounded-md border border-line-2 bg-ink-2 px-3 py-2 text-[12.5px] text-fg shadow-[0_12px_40px_-8px_rgba(0,0,0,0.7)]"
          >
            {t.tone === 'ok' ? <Check size={14} className="text-good" /> : <CircleAlert size={14} className="text-warn" />}
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)
