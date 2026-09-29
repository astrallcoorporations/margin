import { useEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Fixed background: a low-resolution mosaic drawn twice — once crisp (the pixels),
 * once heavily blurred underneath (the glow). A few cells slowly twinkle.
 */
export function PixelField() {
  const crisp = useRef<HTMLCanvasElement>(null)
  const soft = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const COLS = 48
    const ROWS = 27
    const cells = new Float32Array(COLS * ROWS)
    const hot = new Uint8Array(COLS * ROWS)
    // Density falls off from the top-right corner, with value noise so it isn't a smooth gradient.
    const seed = (x: number, y: number) => {
      const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
      return s - Math.floor(s)
    }
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        const dx = (COLS - x) / COLS
        const dy = y / ROWS
        const d = Math.sqrt(dx * dx * 0.9 + dy * dy * 1.6)
        const base = Math.max(0, 1 - d * 1.05)
        const n = seed(Math.floor(x / 3), Math.floor(y / 3)) * 0.55 + seed(x, y) * 0.45
        const v = base * n
        cells[y * COLS + x] = v
        hot[y * COLS + x] = v > 0.34 && seed(y, x) > 0.66 ? 1 : 0
      }

    const draw = () => {
      for (const c of [crisp.current, soft.current]) {
        if (!c) continue
        c.width = COLS
        c.height = ROWS
        const ctx = c.getContext('2d')!
        ctx.clearRect(0, 0, COLS, ROWS)
        for (let i = 0; i < cells.length; i++) {
          const v = cells[i]
          if (v < 0.06) continue
          const x = i % COLS
          const y = (i / COLS) | 0
          ctx.fillStyle = hot[i] ? `rgba(255,213,0,${Math.min(0.9, v * 1.4)})` : `rgba(255,255,255,${v * 0.22})`
          ctx.fillRect(x, y, 1, 1)
        }
      }
    }
    draw()
    if (reduced()) return
    const t = window.setInterval(() => {
      // Twinkle: nudge a handful of lit cells.
      for (let k = 0; k < 14; k++) {
        const i = (Math.random() * cells.length) | 0
        if (cells[i] < 0.08) continue
        cells[i] = Math.max(0.06, Math.min(0.9, cells[i] + (Math.random() - 0.5) * 0.25))
        if (cells[i] > 0.45 && Math.random() > 0.85) hot[i] = hot[i] ? 0 : 1
      }
      draw()
    }, 220)
    return () => window.clearInterval(t)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <canvas ref={soft} className="absolute inset-0 h-full w-full opacity-90 blur-[40px] [image-rendering:pixelated]" />
      <canvas ref={crisp} className="absolute inset-0 h-full w-full opacity-80 [image-rendering:pixelated]" />
      {/* keep the reading area calm */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(10,10,10,0.35)_40%,rgba(10,10,10,0.9)_80%)]" />
    </div>
  )
}

/** Route transition: a grid of squares that dissolves in random order when the page changes. */
export function PixelWipe() {
  const { pathname } = useLocation()
  const cells = useMemo(() => {
    const out: { delay: number; hot: boolean }[] = []
    for (let i = 0; i < 12 * 8; i++) out.push({ delay: Math.random() * 260, hot: Math.random() > 0.94 })
    return out
    // New random order on every navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])
  const first = useRef(true)
  useEffect(() => {
    first.current = false
  }, [])
  if (first.current || reduced()) return null
  return (
    <div key={pathname} className="pointer-events-none absolute inset-0 z-10 grid grid-cols-12 grid-rows-8 overflow-hidden" aria-hidden="true">
      {cells.map((c, i) => (
        <span
          key={i}
          className={c.hot ? 'bg-accent' : 'bg-ink-0'}
          style={{ animation: `pixel-out 220ms steps(3, end) ${c.delay}ms both` }}
        />
      ))}
    </div>
  )
}
