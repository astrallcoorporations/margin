import { ArrowUpRight } from 'lucide-react'

const AIS = [
  { name: 'ChatGPT', href: 'https://chatgpt.com/' },
  { name: 'Claude', href: 'https://claude.ai/new' },
  { name: 'Gemini', href: 'https://gemini.google.com/app' },
]

/** Quick links to open an assistant after copying. Nothing is sent — the student pastes. */
export function AiLinks() {
  return (
    <div className="flex items-center gap-1 text-[12px] text-fg-3">
      <span className="mr-1">Open</span>
      {AIS.map((a) => (
        <a
          key={a.name}
          href={a.href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-0.5 rounded px-1.5 py-1 text-fg-2 transition-colors hover:bg-ink-3 hover:text-fg"
        >
          {a.name}
          <ArrowUpRight size={11} className="opacity-60" />
        </a>
      ))}
    </div>
  )
}
