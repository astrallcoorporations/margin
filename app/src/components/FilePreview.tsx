import { useEffect, useState } from 'react'
import { Download, ExternalLink, FileWarning, Presentation, RefreshCw } from 'lucide-react'
import { docxToHtml, fileExists, fileName, fileUrl, kindOf } from '@/lib/files'
import { Button, buttonClass } from './ui'
import { VideoPlayer } from './VideoPlayer'

type Load = { state: 'loading' } | { state: 'ready'; content: string } | { state: 'error'; message: string }

/** In-app viewer. Renders PDF, DOCX, TXT and Markdown; anything else gets a clear open/download card. */
export function FilePreview({ path, cloudUrl, height = '72vh' }: { path: string; cloudUrl?: string; height?: string }) {
  const kind = kindOf(path)
  if (!fileExists(path)) return <Unavailable path={path} cloudUrl={cloudUrl} />
  if (kind === 'pdf') return <PdfFrame path={path} height={height} />
  if (kind === 'video') return <VideoPlayer path={path} />
  if (kind === 'docx' || kind === 'text' || kind === 'markdown') return <TextDoc path={path} />
  return <NoPreview path={path} cloudUrl={cloudUrl} />
}

function PdfFrame({ path, height }: { path: string; height: string }) {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => setLoaded(false), [path])
  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-ink-1" style={{ height }}>
      {!loaded && (
        <div className="absolute inset-0 space-y-3 p-8" aria-hidden="true">
          <div className="skeleton h-5 w-1/3" />
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-11/12" />
          <div className="skeleton h-3 w-4/5" />
          <div className="skeleton mt-6 h-3 w-full" />
          <div className="skeleton h-3 w-10/12" />
        </div>
      )}
      <iframe
        key={path}
        src={`${fileUrl(path)}#view=FitH&toolbar=1`}
        title={fileName(path)}
        onLoad={() => setLoaded(true)}
        className="relative h-full w-full bg-ink-1 transition-opacity duration-300"
        style={{ opacity: loaded ? 1 : 0, colorScheme: 'normal' }}
      />
    </div>
  )
}

function TextDoc({ path }: { path: string }) {
  const [load, setLoad] = useState<Load>({ state: 'loading' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let alive = true
    setLoad({ state: 'loading' })
    const kind = kindOf(path)
    const task =
      kind === 'docx'
        ? docxToHtml(path)
        : fetch(fileUrl(path)).then((r) => {
            if (!r.ok) throw new Error('The file couldn’t be loaded.')
            return r.text()
          })
    task
      .then((content) => alive && setLoad({ state: 'ready', content }))
      .catch((e: unknown) => alive && setLoad({ state: 'error', message: e instanceof Error ? e.message : 'The file couldn’t be read.' }))
    return () => {
      alive = false
    }
  }, [path, attempt])

  if (load.state === 'loading')
    return (
      <div className="space-y-3 rounded-lg border border-line bg-ink-1 p-6 sm:p-8" aria-busy="true" aria-label="Loading document">
        <div className="skeleton h-5 w-2/5" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-11/12" />
        <div className="skeleton h-3 w-3/4" />
        <div className="skeleton mt-5 h-4 w-1/4" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-5/6" />
      </div>
    )
  if (load.state === 'error')
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-line bg-ink-1 p-6">
        <div className="flex items-center gap-2 text-[13.5px] text-fg">
          <FileWarning size={15} className="text-warn" /> Couldn’t display this file
        </div>
        <p className="text-[13px] text-fg-3">{load.message}</p>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setAttempt((n) => n + 1)}>
            <RefreshCw size={13} /> Try again
          </Button>
          <a className={buttonClass('ghost', 'sm')} href={fileUrl(path, true)}>
            <Download size={13} /> Download
          </a>
        </div>
      </div>
    )
  return (
    <article className="rounded-lg border border-line bg-ink-1 px-5 py-6 sm:px-9 sm:py-8">
      {kindOf(path) === 'docx' ? (
        <div className="doc max-w-[72ch]" dangerouslySetInnerHTML={{ __html: load.content }} />
      ) : (
        <pre className="max-w-[72ch] font-sans text-[14px] leading-relaxed whitespace-pre-wrap text-fg-2">{load.content}</pre>
      )}
    </article>
  )
}

function NoPreview({ path, cloudUrl }: { path: string; cloudUrl?: string }) {
  const kind = kindOf(path)
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-line bg-ink-1 p-6">
      <div className="flex items-center gap-2 text-[13.5px] text-fg">
        <Presentation size={15} className="text-fg-3" />
        {kind === 'pptx' ? 'Browsers can’t display PowerPoint files' : 'This file type can’t be previewed here'}
      </div>
      <p className="max-w-md text-[13px] leading-relaxed text-fg-3">
        Download it to open in {kind === 'pptx' ? 'PowerPoint, Keynote or Google Slides' : 'the right app'}
        {cloudUrl ? ', or view the class copy on Google Classroom.' : '.'}
      </p>
      <div className="flex flex-wrap gap-2">
        <a className={buttonClass('secondary', 'sm')} href={fileUrl(path, true)}>
          <Download size={13} /> Download {fileName(path).split('.').pop()?.toUpperCase()}
        </a>
        {cloudUrl && (
          <a className={buttonClass('ghost', 'sm')} href={cloudUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={13} /> Open cloud resource
          </a>
        )}
      </div>
    </div>
  )
}

export function Unavailable({ path, cloudUrl }: { path: string; cloudUrl?: string }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-line-2 p-6">
      <div className="flex items-center gap-2 text-[13.5px] text-fg">
        <FileWarning size={15} className="text-warn" /> Local file unavailable
      </div>
      <p className="max-w-md text-[13px] leading-relaxed text-fg-3">
        <span className="font-mono text-[12px] break-all text-fg-2">{path}</span> isn’t in the study folder any more. Put it back and refresh
        {cloudUrl ? ' — or use the cloud copy.' : '.'}
      </p>
      {cloudUrl && (
        <a className={buttonClass('secondary', 'sm', 'mt-1')} href={cloudUrl} target="_blank" rel="noreferrer">
          <ExternalLink size={13} /> Open cloud resource
        </a>
      )}
    </div>
  )
}
