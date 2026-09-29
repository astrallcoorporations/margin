import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Download, ExternalLink } from 'lucide-react'
import { getResource, getStep, subject } from '@/lib/data'
import { fileExists, fileLabel, fileName, fileUrl, kindOf, KIND_LABEL, previewable } from '@/lib/files'
import { actions } from '@/lib/storage'
import type { FileRef } from '@/types'
import { Breadcrumbs, Page } from '@/components/blocks'
import { FilePreview } from '@/components/FilePreview'
import { buttonClass } from '@/components/ui'
import NotFound from './NotFound'

/** Full-width reader for a single local file. */
export default function Viewer() {
  const [params] = useSearchParams()
  const path = params.get('path') ?? ''
  const resource = getResource(params.get('r') ?? '')

  // A path is only viewable if it appears in the manifest — never an arbitrary URL.
  const known: FileRef | undefined =
    subject.resources.flatMap((r) => r.files).find((f) => f.path === path) ??
    subject.steps.flatMap((s) => s.files ?? []).find((f) => f.path === path)

  useEffect(() => {
    if (known) actions.openFile(known.path)
  }, [known])

  if (!known) return <NotFound what="file" />

  const siblings = resource ? [...resource.files, ...(resource.type === 'reading' ? getStep(resource.stepId)?.files ?? [] : [])].filter((f) => previewable(f.path) && fileExists(f.path)) : []
  const i = siblings.findIndex((f) => f.path === path)
  const prev = i > 0 ? siblings[i - 1] : undefined
  const next = i >= 0 && i < siblings.length - 1 ? siblings[i + 1] : undefined
  const href = (f: FileRef) => `/view?path=${encodeURIComponent(f.path)}${resource ? `&r=${resource.id}` : ''}`

  return (
    <Page wide>
      <div className="pt-8 pb-5">
        <Breadcrumbs
          items={[
            { label: 'Learn', to: '/learn' },
            ...(resource ? [{ label: resource.title, to: `/learn/${resource.id}#source` }] : []),
            { label: fileLabel(known) },
          ]}
        />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="code-chip">{KIND_LABEL[kindOf(path)]}</span>
            <h1 className="truncate font-sans text-[20px] font-semibold tracking-[-0.02em] text-fg">{fileLabel(known)}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {kindOf(path) === 'pdf' && fileExists(path) && (
              <a href={fileUrl(path)} target="_blank" rel="noreferrer" className={buttonClass('ghost', 'sm')}>
                <ExternalLink size={13} /> New tab
              </a>
            )}
            {fileExists(path) && (
              <a href={fileUrl(path, true)} className={buttonClass('ghost', 'sm')}>
                <Download size={13} /> Download
              </a>
            )}
            {resource?.cloudUrl && (
              <a href={resource.cloudUrl} target="_blank" rel="noreferrer" className={buttonClass('secondary', 'sm')}>
                <ExternalLink size={13} /> Cloud
              </a>
            )}
          </div>
        </div>
        <p className="mt-1.5 truncate font-mono text-[11px] text-fg-3" title={path}>
          {fileName(path)}
        </p>
      </div>

      <FilePreview path={path} cloudUrl={resource?.cloudUrl} height="calc(100dvh - 15rem)" />

      {(prev || next) && (
        <nav className="mt-5 grid grid-cols-2 gap-3" aria-label="Other files in this resource">
          {prev ? (
            <Link to={href(prev)} className="group rounded-lg border border-line px-4 py-3 transition-colors hover:border-line-2 hover:bg-ink-2">
              <div className="flex items-center gap-1 text-[11.5px] text-fg-3">
                <ChevronLeft size={12} /> Previous
              </div>
              <div className="mt-1 truncate text-[13.5px] text-fg">{fileLabel(prev)}</div>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link to={href(next)} className="group rounded-lg border border-line px-4 py-3 text-right transition-colors hover:border-line-2 hover:bg-ink-2">
              <div className="flex items-center justify-end gap-1 text-[11.5px] text-fg-3">
                Next <ChevronRight size={12} />
              </div>
              <div className="mt-1 truncate text-[13.5px] text-fg">{fileLabel(next)}</div>
            </Link>
          )}
        </nav>
      )}
    </Page>
  )
}
