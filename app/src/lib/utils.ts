export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export function timeAgo(ts: number) {
  const diff = (ts - Date.now()) / 1000
  const abs = Math.abs(diff)
  if (abs < 60) return 'just now'
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), 'day')
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export const pad2 = (n: number) => String(n).padStart(2, '0')

export const words = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0)

/** True when a keyboard event target is somewhere the user is typing. */
export function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null
  if (!t) return false
  return t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)
}

export function shuffle<T>(list: T[]): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
