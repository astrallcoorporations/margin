import { defineConfig, type Plugin, type Connect } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

/**
 * Local resource roots. Each subject folder is served read-only at /files/<mount>/...
 * Files are never copied into the app — the organised study folder stays the source of truth.
 */
const ROOTS: Record<string, string> = {
  english: path.resolve(here, '../english'),
}

// Fail loudly in CI if the study folder isn't there (e.g. deployed without the repo root).
if (process.env.VERCEL && !fs.existsSync(ROOTS.english)) {
  throw new Error(
    `Study files not found at ${ROOTS.english}. In Vercel → Settings → Build and Deployment, set Root Directory to the repository root (empty), or enable "Include files outside the root directory".`,
  )
}

const MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp4': 'video/mp4',
}

type IndexedFile = { path: string; size: number; modified: number }

function scan(mount: string, root: string): IndexedFile[] {
  const out: IndexedFile[] = []
  if (!fs.existsSync(root)) return out
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(abs)
      else if (!entry.name.startsWith('~$')) {
        const stat = fs.statSync(abs)
        const rel = path.relative(root, abs).split(path.sep).join('/')
        out.push({ path: `${mount}/${rel}`, size: stat.size, modified: stat.mtimeMs })
      }
    }
  }
  walk(root)
  return out
}

function serveFiles(): Connect.NextHandleFunction {
  return (req, res, next) => {
    if (!req.url) return next()
    const [rawPath] = req.url.split('?')
    let rel: string
    try {
      rel = decodeURIComponent(rawPath.replace(/^\/+/, ''))
    } catch {
      res.statusCode = 400
      return res.end('Bad path')
    }
    const [mount, ...rest] = rel.split('/')
    const root = ROOTS[mount]
    if (!root) return next()
    const abs = path.resolve(root, rest.join('/'))
    if (!abs.startsWith(root + path.sep) || !fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
      res.statusCode = 404
      return res.end('File not found')
    }
    const ext = path.extname(abs).toLowerCase()
    const size = fs.statSync(abs).size
    res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream')
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Cache-Control', 'no-cache')
    const disposition = new URL(req.url, 'http://x').searchParams.has('download') ? 'attachment' : 'inline'
    res.setHeader('Content-Disposition', `${disposition}; filename*=UTF-8''${encodeURIComponent(path.basename(abs))}`)
    // Byte ranges let video players seek without downloading the whole file.
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '')
    if (range) {
      const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]))
      const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1
      if (start >= size || start > end) {
        res.statusCode = 416
        res.setHeader('Content-Range', `bytes */${size}`)
        return res.end()
      }
      res.statusCode = 206
      res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`)
      res.setHeader('Content-Length', end - start + 1)
      return fs.createReadStream(abs, { start, end }).pipe(res)
    }
    res.setHeader('Content-Length', size)
    fs.createReadStream(abs).pipe(res)
  }
}

/**
 * Word list for the mock-test spelling check: every word in the study notes (.docx),
 * so topic vocabulary and names aren't flagged. Exposed as virtual:corpus.
 */
function corpus(): Plugin {
  const id = 'virtual:corpus'
  const resolved = '\0' + id
  return {
    name: 'margin-corpus',
    resolveId(source) {
      if (source === id) return resolved
    },
    async load(source) {
      if (source !== resolved) return
      const mammoth = (await import('mammoth')).default
      const words = new Set<string>()
      for (const [mount, root] of Object.entries(ROOTS)) {
        for (const f of scan(mount, root)) {
          if (!f.path.endsWith('.docx')) continue
          try {
            const { value } = await mammoth.extractRawText({ path: path.join(root, f.path.slice(mount.length + 1)) })
            for (const w of value.toLowerCase().match(/[a-z]+(?:['’][a-z]+)?/g) ?? []) words.add(w.replace('’', "'"))
          } catch {
            /* unreadable file — skip */
          }
        }
      }
      return `export default ${JSON.stringify([...words].sort().join(' '))}`
    },
  }
}

function localFiles(): Plugin {
  const id = 'virtual:local-files'
  const resolved = '\0' + id
  return {
    name: 'margin-local-files',
    resolveId(source) {
      if (source === id) return resolved
    },
    load(source) {
      if (source !== resolved) return
      const files = Object.entries(ROOTS).flatMap(([mount, root]) => scan(mount, root))
      return `export default ${JSON.stringify(files)}`
    },
    configureServer(server) {
      server.middlewares.use('/files', serveFiles())
      for (const root of Object.values(ROOTS)) server.watcher.add(root)
      const refresh = (file: string) => {
        if (!Object.values(ROOTS).some((r) => file.startsWith(r))) return
        const mod = server.moduleGraph.getModuleById(resolved)
        if (mod) {
          server.moduleGraph.invalidateModule(mod)
          server.ws.send({ type: 'full-reload' })
        }
      }
      server.watcher.on('add', refresh)
      server.watcher.on('unlink', refresh)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/files', serveFiles())
    },
    // Static hosting (Vercel etc.): copy study files into dist/files so /files/... resolves without a server.
    // Images are skipped — the app doesn’t link them.
    writeBundle(options) {
      const outDir = options.dir ?? path.resolve(here, 'dist')
      for (const [mount, root] of Object.entries(ROOTS)) {
        for (const f of scan(mount, root)) {
          if (/\.(png|jpe?g|webp)$/i.test(f.path)) continue
          const src = path.join(root, f.path.slice(mount.length + 1))
          const dest = path.join(outDir, 'files', f.path)
          fs.mkdirSync(path.dirname(dest), { recursive: true })
          fs.copyFileSync(src, dest)
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localFiles(), corpus()],
  resolve: { alias: { '@': path.resolve(here, 'src') } },
  server: { port: 5173 },
})
