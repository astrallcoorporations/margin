import index from 'virtual:local-files'
import type { FileRef } from '@/types'

export type FileKind = 'pdf' | 'docx' | 'pptx' | 'text' | 'markdown' | 'image' | 'video' | 'other'

const byPath = new Map(index.map((f) => [f.path, f]))

export const ext = (path: string) => path.slice(path.lastIndexOf('.') + 1).toLowerCase()

export function kindOf(path: string): FileKind {
  switch (ext(path)) {
    case 'pdf':
      return 'pdf'
    case 'docx':
      return 'docx'
    case 'pptx':
      return 'pptx'
    case 'txt':
      return 'text'
    case 'md':
      return 'markdown'
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'webp':
      return 'image'
    case 'mp4':
    case 'webm':
      return 'video'
    default:
      return 'other'
  }
}

/** Can the browser show this file inside the app? */
export const previewable = (path: string) => ['pdf', 'docx', 'text', 'markdown', 'video'].includes(kindOf(path))

export const fileExists = (path: string) => byPath.has(path)
export const fileInfo = (path: string) => byPath.get(path)

export const fileUrl = (path: string, download = false) =>
  '/files/' + path.split('/').map(encodeURIComponent).join('/') + (download ? '?download' : '')

export const fileName = (path: string) => path.slice(path.lastIndexOf('/') + 1)

export const fileLabel = (f: FileRef) => f.label ?? fileName(f.path).replace(/\.[^.]+$/, '')

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export const KIND_LABEL: Record<FileKind, string> = {
  pdf: 'PDF',
  docx: 'DOCX',
  pptx: 'PPTX',
  text: 'TXT',
  markdown: 'MD',
  image: 'IMG',
  video: 'MP4',
  other: 'FILE',
}

/** Load a DOCX via mammoth (lazy-loaded so it stays out of the main bundle). */
export async function docxToHtml(path: string): Promise<string> {
  const [{ default: mammoth }, buf] = await Promise.all([
    import('mammoth/mammoth.browser.js'),
    fetchFile(path),
  ])
  const result = await mammoth.convertToHtml({ arrayBuffer: buf })
  return sanitize(result.value)
}

/** Mammoth escapes text, but hyperlinks come from the document — keep only safe URLs and attributes. */
function sanitize(html: string) {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  doc.querySelectorAll('script,style,iframe,object,embed').forEach((n) => n.remove())
  doc.querySelectorAll('*').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase()
      if (name.startsWith('on')) el.removeAttribute(attr.name)
      if ((name === 'href' || name === 'src') && !/^(https?:|mailto:|#|data:image\/)/i.test(attr.value.trim())) el.removeAttribute(attr.name)
    }
    if (el.tagName === 'A' && el.getAttribute('href')?.startsWith('http')) {
      el.setAttribute('target', '_blank')
      el.setAttribute('rel', 'noreferrer')
    }
  })
  return doc.body.firstElementChild?.innerHTML ?? ''
}

export async function docxToText(path: string): Promise<string> {
  const [{ default: mammoth }, buf] = await Promise.all([
    import('mammoth/mammoth.browser.js'),
    fetchFile(path),
  ])
  const result = await mammoth.extractRawText({ arrayBuffer: buf })
  return result.value.replace(/\n{3,}/g, '\n\n').trim()
}

async function fetchFile(path: string) {
  const res = await fetch(fileUrl(path))
  if (!res.ok) throw new Error(res.status === 404 ? 'The file is no longer in the study folder.' : `Couldn’t load the file (HTTP ${res.status}).`)
  return res.arrayBuffer()
}
