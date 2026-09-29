import corpusWords from 'virtual:corpus'
import { subject } from './data'
import type { FillQuestion, McqQuestion, MockTest, TestQuestion, WrittenFormat, WrittenQuestion } from '@/types/tests'

/**
 * Offline marking.
 * MCQ and fill-in answers are exact. Written answers get an ESTIMATE from four things a
 * computer can check honestly: key points mentioned, word count, required format, and
 * mechanics (spelling, capitals, full stops). It can't judge quality of argument — that's
 * what "Copy for AI marking" is for.
 */

export interface Check {
  ok: boolean
  label: string
  detail?: string
}

export interface QuestionResult {
  id: string
  kind: TestQuestion['kind']
  marks: number
  score: number
  answered: boolean
  /** Written answers only */
  words?: number
  points?: { label: string; hit: boolean; matched?: string }[]
  checks?: Check[]
  spelling?: string[]
  correct?: boolean
}

export interface AttemptResult {
  score: number
  total: number
  autoScore: number
  autoTotal: number
  estScore: number
  estTotal: number
  questions: Record<string, QuestionResult>
}

// ───────────────────────────────────────────── Spelling

// Everyday words that may not appear in the notes.
const BASE =
  'a about above across act actually add after afternoon again against ago all almost alone along already also although always am among an and angry animal another answer any anyone anything are area around as ask asked at away back bad be beautiful became because become been before began begin behind being believe best better between big book both boy brave bring brother brought but by call called came can cannot car care carefully carry case cause change child children city class clean close come coming could country course cried cry dad day days dear decided did didn\'t different do does doesn\'t doing don\'t done door down during each early earth easy eat else end enough even evening ever every everyone everything example eyes face fact family far fast father feel feeling felt few find fine first five food for forever found four friend friends from front full fun gave get gets getting girl give given go goes going gone good got great grew ground group grow had half hand happen happened happy hard has have having he head hear heard heart held help her here herself high him himself his hold home hope hour hours house how however i idea if important in inside instead into is it it\'s its itself just keep kept kind knew know known last late later learn least left less let life light like little live lived long look looked looking lot loud love made make makes making man many may me mean means might mind minute minutes moment money more morning most mother move much mum must my myself name near need needed never new next nice night no none nothing now number of off often oh ok old on once one only open or other others our ourselves out outside over own parents part people perhaps person place plan play please point power problem put quickly quite ran rather read ready real really reason remember rest right room run said same sat saw say saying school second see seemed seen sense set she should show side since sister sit small so some someone something sometimes soon sorry sound speak stand start started stay still stood stop story street strong such suddenly sure take taken talk tell than thank thanks that that\'s the their them themselves then there these they thing things think this those though thought three through time times to today together told too took top toward towards tried true try trying turn turned two under understand until up upon us use used very wait walk walked want wanted was wasn\'t watch water way we week well went were what when where whether which while who whole why will with without woke woman won\'t word words work world would wouldn\'t write wrong year years yes yet you young your yourself yesterday tomorrow tonight weekend okay excited nervous stage audience applause clapped cheered diary suitcase editor sincerely faithfully locality residents authorities kindly regards pincode birthday surprise'

const COMMON_MISSPELLINGS: Record<string, string> = {
  recieve: 'receive', recieved: 'received', beleive: 'believe', belive: 'believe', definately: 'definitely', definatly: 'definitely', seperate: 'separate', untill: 'until', tommorow: 'tomorrow', tomorow: 'tomorrow', occured: 'occurred', begining: 'beginning', beautifull: 'beautiful', freind: 'friend', freinds: 'friends', wierd: 'weird', thier: 'their', becuase: 'because', becasue: 'because', alot: 'a lot', truely: 'truly', goverment: 'government', enviroment: 'environment', enviornment: 'environment', neccessary: 'necessary', necesary: 'necessary', accomodate: 'accommodate', acheive: 'achieve', arguement: 'argument', embarass: 'embarrass', existance: 'existence', finaly: 'finally', happend: 'happened', immediatly: 'immediately', independant: 'independent', occassion: 'occasion', persue: 'pursue', posession: 'possession', prefered: 'preferred', realy: 'really', reccomend: 'recommend', resistence: 'resistance', responsibilty: 'responsibility', succesful: 'successful', sucessful: 'successful', suprise: 'surprise', suprised: 'surprised', tounge: 'tongue', wich: 'which', writting: 'writing', excercise: 'exercise', sincerly: 'sincerely', sincerley: 'sincerely', grammer: 'grammar', knowlege: 'knowledge', libary: 'library', probaly: 'probably', dissapointed: 'disappointed', dissapoint: 'disappoint', courageus: 'courageous', persistance: 'persistence', perseverence: 'perseverance', sacrafice: 'sacrifice', sacrifise: 'sacrifice', pnuemonia: 'pneumonia', neumonia: 'pneumonia', metaphore: 'metaphor', similie: 'simile', }

const dictionary = new Set<string>([...corpusWords.split(' '), ...BASE.split(' '), ...allAppWords()])
let fullDictionary = false

/** Loads a full English word list (≈275k words) on demand — only when marking. */
export async function ensureDictionary() {
  if (fullDictionary) return
  try {
    const mod = await import('an-array-of-english-words')
    for (const w of mod.default as string[]) dictionary.add(w)
    fullDictionary = true
  } catch {
    /* offline or failed — fall back to the notes vocabulary, and only flag definite misspellings */
  }
}

function allAppWords() {
  const text = [
    ...subject.resources.flatMap((r) => [r.title, r.description, r.author ?? '', ...r.tags, ...(r.keyPoints ?? []).flatMap((k) => [k.label, k.text])]),
    ...subject.tasks.flatMap((t) => [t.prompt, t.extract ?? '']),
    ...subject.flashcards.flatMap((c) => [c.front, c.back]),
  ].join(' ')
  return text.toLowerCase().match(/[a-z]+/g) ?? []
}

function known(word: string) {
  if (dictionary.has(word)) return true
  // Accept common inflections of known words.
  const stems = [
    word.replace(/'s$/, ''),
    word.replace(/s$/, ''),
    word.replace(/es$/, ''),
    word.replace(/ies$/, 'y'),
    word.replace(/ed$/, ''),
    word.replace(/ed$/, 'e'),
    word.replace(/d$/, ''),
    word.replace(/ing$/, ''),
    word.replace(/ing$/, 'e'),
    word.replace(/ly$/, ''),
    word.replace(/ily$/, 'y'),
    word.replace(/er$/, ''),
    word.replace(/est$/, ''),
    word.replace(/ness$/, ''),
    word.replace(/ful$/, ''),
    word.replace(/n't$/, ''),
  ]
  return stems.some((s) => s.length > 1 && dictionary.has(s))
}

/** Returns words that are definitely misspelled or not found anywhere in the notes. */
export function spellingIssues(text: string) {
  const out = new Map<string, string | undefined>()
  // Skip capitalised words that aren't sentence-initial (probably names).
  const tokens = text.match(/[A-Za-z]+(?:['’][A-Za-z]+)?/g) ?? []
  for (const raw of tokens) {
    const w = raw.toLowerCase().replace('’', "'")
    if (COMMON_MISSPELLINGS[w] && COMMON_MISSPELLINGS[w] !== w) out.set(raw, COMMON_MISSPELLINGS[w])
    else if (fullDictionary && w.length > 3 && !/^[A-Z]/.test(raw) && !known(w)) out.set(raw, undefined)
  }
  return [...out.entries()].map(([word, fix]) => (fix ? `${word} → ${fix}` : word))
}

// ───────────────────────────────────────────── Helpers

export const countWords = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0)

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^a-z0-9%' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const paragraphs = (t: string) => t.split(/\n\s*\n|\n(?=\s*\S)/).map((p) => p.trim()).filter((p) => p.length > 0)

function mechanics(text: string): Check[] {
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim())
  const lowerStarts = sentences.filter((s) => /^[a-z]/.test(s.trim())).length
  const lonelyI = (text.match(/(^|\s)i(\s|'|’)/g) ?? []).length
  const endsWell = /[.!?"”')]\s*$/.test(text.trim())
  return [
    { ok: lowerStarts === 0, label: 'Sentences start with capitals', detail: lowerStarts ? `${lowerStarts} sentence${lowerStarts > 1 ? 's' : ''} start${lowerStarts > 1 ? '' : 's'} lower-case` : undefined },
    { ok: lonelyI === 0, label: '“I” is capitalised', detail: lonelyI ? `“i” written lower-case ${lonelyI}×` : undefined },
    { ok: endsWell, label: 'Ends with a full stop' },
  ]
}

function formatChecks(format: WrittenFormat, text: string, q: WrittenQuestion): Check[] {
  const paras = paragraphs(text)
  const first = text.trim().split(/(?<=[.!?])\s+/)[0]?.toLowerCase() ?? ''
  const lower = text.toLowerCase()
  const firstLine = text.trim().split('\n')[0]?.trim() ?? ''
  const quotes = (text.match(/["“][^"”]{2,}["”]/g) ?? []).length
  switch (format) {
    case 'peel':
      return [
        { ok: paras.length >= 2, label: 'Two developed paragraphs', detail: `${paras.length} paragraph${paras.length === 1 ? '' : 's'} found` },
        { ok: (q.mention ?? []).some((m) => first.includes(m)), label: 'First sentence names the text / author' },
        { ok: /\b(this (shows|suggests|reveals)|therefore|thus|hence|this means|highlights|which shows)\b/i.test(text), label: 'Explains evidence (“this shows…”, “therefore…”)' },
        { ok: /["“‘'][^"”’']{3,}["”’']/.test(text), label: 'Uses a short quotation or reference' },
      ]
    case 'letter':
      return [
        { ok: /\b\d{6}\b/.test(text), label: 'Address with 6-digit PIN code' },
        { ok: /\b\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*,?\s+\d{4}\b|\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/i.test(text), label: 'Date' },
        { ok: /the editor/i.test(text), label: 'Receiver: The Editor + newspaper' },
        { ok: /subject\s*[:\-–]/i.test(text), label: 'Subject line' },
        { ok: /sir\s*\/?\s*madam|dear (sir|madam|editor)|respected (sir|madam)/i.test(text), label: 'Salutation (Sir/Madam)' },
        { ok: /yours (sincerely|faithfully|truly)/i.test(text), label: 'Yours sincerely + name' },
      ]
    case 'article':
      return [
        { ok: firstLine.length > 0 && countWords(firstLine) <= 8 && !/[.]$/.test(firstLine), label: 'Short heading on its own line' },
        { ok: /(^|\n)\s*by\s*[-–—:]?\s*\w+/i.test(text), label: 'Byline (By – Name)' },
        { ok: paras.length >= 4, label: 'Intro + body + conclusion (4+ paragraphs)', detail: `${paras.length} paragraph${paras.length === 1 ? '' : 's'}` },
        { ok: /\?|["“]/.test(paras[1] ?? paras[0] ?? ''), label: 'Hook — question or quotation to open' },
      ]
    case 'narrative':
      return [
        { ok: firstLine.length > 0 && countWords(firstLine) <= 5 && !/[.]$/.test(firstLine), label: 'Title of 5 words or fewer' },
        { ok: paras.length >= 4, label: 'Title + at least 3 paragraphs', detail: `${paras.length} block${paras.length === 1 ? '' : 's'}` },
        { ok: quotes >= 3, label: '3–4 lines of dialogue', detail: `${quotes} found` },
        { ok: /\b(suddenly|moments later|soon|meanwhile|eventually|finally|afterwards)\b/i.test(text), label: 'Sequence words (suddenly, eventually…)' },
      ]
    case 'diary':
      return [
        { ok: /\b\d{1,2}(st|nd|rd|th)?\s+[a-z]+,?\s+\d{4}\b|\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/i.test(text), label: 'Date' },
        { ok: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(text), label: 'Day' },
        { ok: /\b\d{1,2}(:\d{2})?\s*(a\.?m|p\.?m)/i.test(text), label: 'Time' },
        { ok: /dear diary/i.test(text), label: '“Dear Diary”' },
        { ok: (lower.match(/\bi\b/g) ?? []).length >= 3, label: 'Personal, first-person voice' },
      ]
    default:
      return []
  }
}

function matchPoint(text: string, any: string[]) {
  const t = ' ' + text.toLowerCase().replace(/[’]/g, "'") + ' '
  return any.find((k) => t.includes(k.toLowerCase()))
}

const roundHalf = (n: number) => Math.round(n * 2) / 2

// ───────────────────────────────────────────── Marking

export function gradeMcq(q: McqQuestion, value: string | undefined): QuestionResult {
  const answered = value !== undefined && value !== ''
  const correct = answered && Number(value) === q.answer
  return { id: q.id, kind: 'mcq', marks: q.marks, score: correct ? q.marks : 0, answered, correct }
}

export function gradeFill(q: FillQuestion, value: string | undefined): QuestionResult {
  const v = norm(value ?? '')
  const correct = Boolean(v) && q.accept.some((a) => norm(a) === v)
  return { id: q.id, kind: 'fill', marks: q.marks, score: correct ? q.marks : 0, answered: Boolean(v), correct }
}

export function gradeWritten(q: WrittenQuestion, value: string | undefined): QuestionResult {
  const text = (value ?? '').trim()
  const words = countWords(text)
  if (!text) return { id: q.id, kind: 'written', marks: q.marks, score: 0, answered: false, words: 0 }

  const points = (q.points ?? []).map((p) => {
    const m = matchPoint(text, p.any)
    return { label: p.label, hit: Boolean(m), matched: m }
  })
  const need = Math.min(q.need ?? points.length, points.length)
  const content = points.length ? Math.min(1, points.filter((p) => p.hit).length / Math.max(1, need)) : 1

  let length = 1
  if (q.words) {
    const [lo, hi] = q.words
    if (words < lo) length = Math.max(0, words / lo)
    else if (words > hi * 1.25) length = 0.6
    else if (words > hi) length = 0.85
  }

  const fmt = q.format ? formatChecks(q.format, text, q) : []
  const format = fmt.length ? fmt.filter((c) => c.ok).length / fmt.length : 1

  const mech = mechanics(text)
  const spelling = spellingIssues(text)
  const definite = spelling.filter((s) => s.includes('→')).length
  const mechScore = Math.max(0, mech.filter((c) => c.ok).length / mech.length - Math.min(0.6, definite * 0.2 + (spelling.length - definite) * 0.05))

  const w = q.format && q.format !== 'peel' ? { c: 0.45, l: 0.15, f: 0.3, m: 0.1 } : q.format === 'peel' ? { c: 0.6, l: 0.15, f: 0.15, m: 0.1 } : { c: 0.75, l: 0.1, f: 0, m: 0.15 }
  const fraction = w.c * content + w.l * length + w.f * format + w.m * mechScore
  // One-mark questions: content decides; half marks allowed.
  const score = q.marks <= 1 ? roundHalf(q.marks * Math.min(1, content * (length >= 0.5 ? 1 : 0.5))) : roundHalf(q.marks * fraction)

  const checks: Check[] = [
    ...(q.words ? [{ ok: words >= q.words[0] && words <= q.words[1], label: `${q.words[0]}–${q.words[1]} words`, detail: `${words} words` }] : []),
    ...fmt,
    ...mech,
  ]
  return { id: q.id, kind: 'written', marks: q.marks, score: Math.min(q.marks, score), answered: true, words, points, checks, spelling }
}

export function gradeQuestion(q: TestQuestion, value: string | undefined): QuestionResult {
  if (q.kind === 'mcq') return gradeMcq(q, value)
  if (q.kind === 'fill') return gradeFill(q, value)
  return gradeWritten(q, value)
}

export function gradeAttempt(test: MockTest, answers: Record<string, string>): AttemptResult {
  const questions: Record<string, QuestionResult> = {}
  let autoScore = 0
  let autoTotal = 0
  let estScore = 0
  let estTotal = 0
  for (const s of test.sections)
    for (const q of s.questions) {
      const r = gradeQuestion(q, answers[q.id])
      questions[q.id] = r
      if (q.kind === 'written') {
        estScore += r.score
        estTotal += q.marks
      } else {
        autoScore += r.score
        autoTotal += q.marks
      }
    }
  return { score: autoScore + estScore, total: autoTotal + estTotal, autoScore, autoTotal, estScore, estTotal, questions }
}
