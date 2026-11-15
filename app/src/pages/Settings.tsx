import { useRef, useState } from 'react'
import { Download, Keyboard, Upload } from 'lucide-react'
import { subject } from '@/lib/data'
import index from 'virtual:local-files'
import { actions, exportState, parseImport, useStore } from '@/lib/storage'
import { fileExists } from '@/lib/files'
import { Page, PageHeader } from '@/components/blocks'
import { useToast } from '@/components/toast'
import { Button, buttonClass, Section } from '@/components/ui'
import { useVex } from '@/components/Vex'
import { signInUrl, VEX_URL } from '@/lib/vex'
import { useUI } from '@/app/ui-context'

export default function Settings() {
  const name = useStore((s) => s.profile.name)
  const answers = useStore((s) => s.answers)
  const cards = useStore((s) => s.cards)
  const custom = useStore((s) => s.customCards)
  const [draft, setDraft] = useState(name)
  const fileInput = useRef<HTMLInputElement>(null)
  const notify = useToast()
  const { openShortcuts } = useUI()
  const { session, refresh, leave } = useVex()

  const manifest = [...subject.resources.flatMap((r) => r.files), ...subject.steps.flatMap((s) => s.files ?? [])]
  const missing = manifest.filter((f) => !fileExists(f.path))

  const download = () => {
    const blob = new Blob([exportState()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `margin-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    notify('Backup downloaded')
  }

  const upload = async (file: File) => {
    try {
      const next = parseImport(await file.text())
      if (!window.confirm('Replace your current progress with this backup?')) return
      actions.replace(next)
      setDraft(next.profile?.name ?? '')
      notify('Backup restored')
    } catch (e) {
      notify(e instanceof Error ? e.message : 'That file couldn’t be read', 'error')
    }
  }

  return (
    <Page>
      <PageHeader eyebrow="Settings" title="Settings" lede="No account needed. Everything is saved in this browser on this device." />

      <Section title="Your name">
        <form
          className="flex max-w-md gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            actions.setName(draft.trim())
            notify(draft.trim() ? 'Name saved' : 'Name cleared')
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Optional — used for the greeting and avatar"
            aria-label="Your name"
            className="h-8.5 flex-1 rounded-md border border-line-2 bg-ink-1 px-3 text-[13.5px] text-fg placeholder:text-fg-3 focus:border-accent/50 focus:outline-none"
          />
          <Button type="submit">Save name</Button>
        </form>
      </Section>

      <Section title="Your data">
        <dl className="mb-5 grid max-w-md grid-cols-3 gap-4 text-[13px]">
          <div>
            <dt className="text-[11.5px] text-fg-3">Answers</dt>
            <dd className="mt-1 text-fg tabular-nums">{Object.keys(answers).length}</dd>
          </div>
          <div>
            <dt className="text-[11.5px] text-fg-3">Cards marked</dt>
            <dd className="mt-1 text-fg tabular-nums">{Object.keys(cards).length}</dd>
          </div>
          <div>
            <dt className="text-[11.5px] text-fg-3">Your cards</dt>
            <dd className="mt-1 text-fg tabular-nums">{custom.length}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <Button onClick={download}>
            <Download size={14} /> Download backup
          </Button>
          <Button variant="ghost" onClick={() => fileInput.current?.click()}>
            <Upload size={14} /> Restore from backup
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) upload(f)
              e.target.value = ''
            }}
          />
        </div>
        <p className="mt-3 max-w-lg text-[12.5px] leading-relaxed text-fg-3">Use a backup to move your progress to another browser or computer.</p>
      </Section>

      <Section title="Vex (AI and Classroom)">
        <dl className="mb-4 grid max-w-lg grid-cols-[110px_1fr] gap-x-4 gap-y-2 text-[13px]">
          <dt className="text-fg-3">Status</dt>
          <dd className="text-fg">
            {session.state === 'signedin' && 'Connected'}
            {session.state === 'signedout' && (session.unavailable ? 'Running, but Google sign-in isn’t set up yet' : 'Running, not signed in')}
            {session.state === 'offline' && 'Not running'}
            {session.state === 'loading' && 'Checking…'}
          </dd>
          <dt className="text-fg-3">Address</dt>
          <dd className="font-mono text-[12px] break-all text-fg">{VEX_URL}</dd>
          {session.state === 'signedin' && (
            <>
              <dt className="text-fg-3">Signed in as</dt>
              <dd className="text-fg">{session.email || 'Local test user'}</dd>
              <dt className="text-fg-3">Credits</dt>
              <dd className="text-fg tabular-nums">
                {session.credits.left} of {session.credits.max} left today
              </dd>
            </>
          )}
        </dl>
        <div className="flex flex-wrap gap-2">
          {session.state === 'signedout' && !session.unavailable && (
            <a href={signInUrl()} className={buttonClass('primary')}>
              Sign up / Sign in with Google
            </a>
          )}
          {session.state === 'signedin' && !session.open && (
            <Button variant="ghost" onClick={leave}>
              Sign out
            </Button>
          )}
          <Button variant="ghost" onClick={refresh}>
            Check again
          </Button>
        </div>
        <p className="mt-3 max-w-lg text-[12.5px] leading-relaxed text-fg-3">
          Margin asks Vex to answer prompts and to read Google Classroom. Only ked.edu.in school accounts and a short approved list can sign in. To point Margin at a different Vex, set <span className="font-mono">VITE_VEX_URL</span> in <span className="font-mono">app/.env</span>.
        </p>
      </Section>

      <Section title="Study folder">
        <p className="max-w-lg text-[13px] leading-relaxed text-fg-2">
          Margin reads your files straight from the <span className="font-mono text-[12px] text-fg">english</span> folder next to the app — nothing is copied. {index.length} files found;{' '}
          {manifest.length - missing.length} of {manifest.length} linked files are available.
        </p>
        {missing.length > 0 && (
          <ul className="mt-3 space-y-1 text-[12px] text-warn">
            {missing.map((f) => (
              <li key={f.path} className="font-mono break-all">
                Missing: {f.path}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Keyboard">
        <Button variant="ghost" onClick={openShortcuts}>
          <Keyboard size={14} /> Show shortcuts <span className="kbd ml-1">?</span>
        </Button>
      </Section>

      <Section title="Reset">
        <p className="mb-3 max-w-lg text-[13px] text-fg-3">Clears answers, card progress, your cards and history on this device. Your study files are not touched.</p>
        <Button
          variant="ghost"
          className="!text-warn hover:!bg-warn/10"
          onClick={() => {
            if (window.confirm('Delete all progress on this device? Download a backup first if you might want it back.')) {
              actions.reset()
              setDraft('')
              notify('Progress cleared')
            }
          }}
        >
          Reset all progress
        </Button>
      </Section>
    </Page>
  )
}
