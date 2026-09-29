import { Link, useParams } from 'react-router-dom'
import { getCategory, getStep, resourcesInCategory, TYPE_LABEL } from '@/lib/data'
import { categories } from '@/data/catalog'
import type { ResourceType } from '@/types'
import { Page, PageHeader, ResourceRow } from '@/components/blocks'
import NotFound from './NotFound'

const PLURAL: Record<ResourceType, string> = {
  story: 'Stories',
  poem: 'Poems',
  play: 'Plays',
  prose: 'Prose',
  grammar: 'Grammar',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
  exam: 'Exam skills',
}

export default function Library() {
  const { category = '' } = useParams()
  const cat = getCategory(category)
  if (!cat) return <NotFound what="category" />
  const list = resourcesInCategory(cat.id)
  const groups = cat.types.map((t) => ({ type: t, items: list.filter((r) => r.type === t) })).filter((g) => g.items.length)

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: 'Resources' }, { label: cat.label }]}
        eyebrow={`${list.length} resources`}
        title={cat.label}
        lede={cat.description}
      />
      <div className="space-y-10">
        {groups.map((g) => (
          <section key={g.type} aria-labelledby={`lib-${g.type}`}>
            <div className="mb-2 flex items-baseline justify-between border-b border-line pb-2">
              <h2 id={`lib-${g.type}`} className="text-[14px] font-semibold tracking-[-0.01em] text-fg">
                {groups.length > 1 ? PLURAL[g.type] : TYPE_LABEL[g.type]}
              </h2>
              <span className="font-mono text-[11px] text-fg-3 tabular-nums">{g.items.length}</span>
            </div>
            <div className="-mx-2.5">
              {g.items.map((r) => (
                <ResourceRow key={r.id} resource={r} showStep={getStep(r.stepId)?.label} />
              ))}
            </div>
          </section>
        ))}
      </div>
      <nav className="mt-14 flex gap-4 border-t border-line pt-5 text-[12.5px]" aria-label="Other categories">
        {categories
          .filter((c) => c.id !== cat.id)
          .map((c) => (
            <Link key={c.id} to={`/library/${c.id}`} className="text-fg-3 hover:text-fg">
              {c.label} →
            </Link>
          ))}
      </nav>
    </Page>
  )
}
