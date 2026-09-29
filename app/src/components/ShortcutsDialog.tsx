import { Kbd, Modal } from './ui'

const groups: { title: string; rows: [string[], string][] }[] = [
  {
    title: 'Anywhere',
    rows: [
      [['Ctrl', 'K'], 'Search'],
      [['/'], 'Search'],
      [['G', 'H'], 'Overview'],
      [['G', 'L'], 'Learn'],
      [['G', 'P'], 'Practice'],
      [['G', 'F'], 'Flashcards'],
      [['G', 'R'], 'Review'],
      [['G', 'T'], 'Tests'],
      [['?'], 'This list'],
      [['Esc'], 'Close dialogs'],
    ],
  },
  {
    title: 'Flashcards',
    rows: [
      [['Space'], 'Flip card'],
      [['←', '→'], 'Previous / next'],
      [['1'], 'Need review'],
      [['2'], 'Know it'],
      [['S'], 'Shuffle'],
      [['R'], 'Restart'],
    ],
  },
  {
    title: 'Task editor',
    rows: [[['Ctrl', 'Enter'], 'Copy for AI review']],
  },
]

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts" className="max-w-[560px]">
      <div className="grid gap-x-8 gap-y-6 p-5 sm:grid-cols-2">
        {groups.map((g) => (
          <div key={g.title} className={g.title === 'Anywhere' ? 'sm:row-span-2' : ''}>
            <div className="eyebrow mb-3">{g.title}</div>
            <dl className="space-y-2">
              {g.rows.map(([keys, label]) => (
                <div key={label + keys.join()} className="flex items-center justify-between gap-4 text-[13px]">
                  <dt className="text-fg-2">{label}</dt>
                  <dd className="flex items-center gap-1">
                    {keys.map((k, i) => (
                      <span key={k} className="flex items-center gap-1">
                        {i > 0 && keys[0] === 'G' && <span className="text-[10px] text-fg-3">then</span>}
                        <Kbd>{k}</Kbd>
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <p className="border-t border-line px-5 py-3 text-[12px] text-fg-3">Shortcuts pause while you’re typing, so they never get in the way of an answer.</p>
    </Modal>
  )
}
