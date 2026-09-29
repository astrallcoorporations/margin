import type { Passage } from '@/types/tests'

export function PassageCard({ passage, extract }: { passage?: Passage; extract?: string }) {
  if (extract)
    return (
      <blockquote className="rounded-xl border border-line bg-ink-1 px-5 py-4 text-[15px] leading-[1.75] text-fg-2 italic">
        <div className="eyebrow mb-2 !text-[10px] not-italic">Extract</div>
        {extract}
      </blockquote>
    )
  if (!passage) return null
  return (
    <article className="rounded-xl border border-line bg-ink-1 px-5 py-5 sm:px-7">
      <div className="eyebrow mb-3 !text-[10px]">Read the passage</div>
      {passage.title && <h3 className="mb-3 text-[17px] font-semibold tracking-[-0.015em] text-fg">{passage.title}</h3>}
      <div className="space-y-3.5 text-[14.5px] leading-[1.75] text-fg-2">
        {passage.body.split('\n\n').map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {passage.table && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {passage.table.head.map((h) => (
                  <th key={h} className="border border-line bg-ink-2 px-3 py-2 text-left font-medium text-fg">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {passage.table.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j} className={j ? 'border border-line px-3 py-2 text-fg-2 tabular-nums' : 'border border-line px-3 py-2 text-fg-2'}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  )
}

export const marksLabel = (m: number) => `${m} mark${m === 1 ? '' : 's'}`
