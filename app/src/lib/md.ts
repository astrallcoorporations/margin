/**
 * Tiny Markdown → HTML for AI answers. Everything is escaped first, so the output is safe to inject.
 * Covers what tutoring answers use: headings, lists, bold/italic, inline code, code blocks, tables, rules.
 */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const fmt = (s: string) =>
  s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)"'<>]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

function inline(s: string) {
  const parts = s.split('`')
  let out = ''
  parts.forEach((part, i) => {
    if (i % 2 === 1 && i < parts.length - 1) out += `<code>${esc(part)}</code>`
    else out += fmt(esc((i % 2 === 1 ? '`' : '') + part))
  })
  return out
}

const RX = {
  fence: /^\s*```+\s*([\w+#.-]*)\s*$/,
  head: /^(#{1,4})\s+(.*)$/,
  num: /^\s*(\d{1,2})[.)]\s+(.*)$/,
  bul: /^\s*[-*•]\s+(.*)$/,
  row: /^\s*\|(.*)\|\s*$/,
  sep: /^\s*\|[\s:|-]+\|\s*$/,
  rule: /^\s*([-*_])\1{2,}\s*$/,
}

export function renderMarkdown(src: string): string {
  const lines = src.replace(/\r/g, '').split('\n')
  let html = ''
  let para: string[] = []
  let i = 0
  const flush = () => {
    if (!para.length) return
    html += `<p>${inline(para.join('\n')).replace(/\n/g, '<br>')}</p>`
    para = []
  }
  while (i < lines.length) {
    const line = lines[i]
    let m: RegExpMatchArray | null
    if (RX.fence.test(line)) {
      flush()
      const buf: string[] = []
      i++
      while (i < lines.length && !/^\s*```+\s*$/.test(lines[i])) buf.push(lines[i++])
      i++
      html += `<pre><code>${esc(buf.join('\n'))}</code></pre>`
      continue
    }
    if (RX.rule.test(line)) {
      flush()
      html += '<hr>'
      i++
      continue
    }
    if ((m = line.match(RX.head))) {
      flush()
      const level = Math.min(4, m[1].length + 1)
      html += `<h${level}>${inline(m[2])}</h${level}>`
      i++
      continue
    }
    if (RX.num.test(line) || RX.bul.test(line)) {
      flush()
      const ordered = RX.num.test(line)
      const rx = ordered ? RX.num : RX.bul
      html += ordered ? '<ol>' : '<ul>'
      while (i < lines.length && (m = lines[i].match(rx))) {
        const body = [m[ordered ? 2 : 1]]
        i++
        // continuation lines belong to the same item
        while (i < lines.length && lines[i].trim() !== '' && /^\s{2,}\S/.test(lines[i]) && !RX.num.test(lines[i]) && !RX.bul.test(lines[i])) body.push(lines[i++].trim())
        html += `<li>${body.map(inline).join('<br>')}</li>`
        if (i < lines.length && lines[i].trim() === '' && i + 1 < lines.length && rx.test(lines[i + 1])) i++
      }
      html += ordered ? '</ol>' : '</ul>'
      continue
    }
    if (RX.row.test(line) && i + 1 < lines.length && RX.sep.test(lines[i + 1])) {
      flush()
      const cells = (l: string) => l.match(RX.row)![1].split('|').map((c) => inline(c.trim()))
      html += `<table><thead><tr>${cells(line).map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>`
      i += 2
      while (i < lines.length && RX.row.test(lines[i])) html += `<tr>${cells(lines[i++]).map((c) => `<td>${c}</td>`).join('')}</tr>`
      html += '</tbody></table>'
      continue
    }
    if (line.trim() === '') {
      flush()
      i++
      continue
    }
    para.push(line)
    i++
  }
  flush()
  return html
}
