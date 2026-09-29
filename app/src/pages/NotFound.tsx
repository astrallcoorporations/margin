import { Page } from '@/components/blocks'
import { ButtonLink } from '@/components/ui'
import { useUI } from '@/app/ui-context'

export default function NotFound({ what = 'page' }: { what?: string }) {
  const { openSearch } = useUI()
  return (
    <Page>
      <div className="flex min-h-[60vh] flex-col items-start justify-center">
        <div className="eyebrow mb-4">404</div>
        <h1 className="text-[32px] font-semibold tracking-[-0.035em] text-fg">This {what} doesn’t exist</h1>
        <p className="mt-3 max-w-md text-[14px] text-fg-2">The link may be old, or the item was renamed. Search for it, or go back to the curriculum.</p>
        <div className="mt-6 flex gap-2">
          <ButtonLink to="/learn" variant="primary">
            Open the curriculum
          </ButtonLink>
          <button onClick={openSearch} className="h-8.5 rounded-md px-3.5 text-[13px] text-fg-2 hover:bg-ink-3 hover:text-fg">
            Search
          </button>
        </div>
      </div>
    </Page>
  )
}
