import type { Flashcard, Resource, Task } from '@/types'
import type { MockTest } from '@/types/tests'
import type { AttemptResult } from './grading'
import { DIFFICULTY_LABEL, getResource, getStep, getTask, orderedSteps, resourcesInStep, subject, TASK_TYPE_LABEL, TYPE_LABEL } from './data'
import { docxToText, fileExists } from './files'
import type { State } from './storage'

/**
 * Prompt builders for an external AI assistant (ChatGPT, Claude, Gemini…).
 * The app never calls a model itself — the student copies a prompt and pastes it.
 * Every prompt opens with a context block so the assistant is caught up in one message.
 */

const rule = '────────────────────────────────'
const NL = String.fromCharCode(10)

const words = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0)

const stepName = (stepId: string) => {
  const s = getStep(stepId)
  return s ? (s.note ? `${s.label} (${s.note})` : s.label) : ''
}

const examDay = () => {
  if (!subject.exam) return null
  const d = new Date(subject.exam.date + 'T09:00:00')
  const days = Math.ceil((d.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000)
  const label = new Date(subject.exam.date + 'T09:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  return days > 1 ? `${label} — ${days} days away` : days === 1 ? `${label} — that’s tomorrow` : days === 0 ? `${label} — that’s today` : label
}

/** Who the student is and what they're studying. Shared by every prompt. */
function contextBlock() {
  const exam = subject.resources.find((r) => r.type === 'exam' && r.keyPoints?.some((k) => /section/i.test(k.label)))
  const when = examDay()
  return [
    '## ABOUT ME (so you’re caught up)',
    `I’m in ${subject.classLabel}, revising ${subject.name} for my ${subject.term} exam${when ? ` on ${when}` : ''}.`,
    ...(subject.exam
      ? ['', 'What’s coming in the exam:', ...subject.exam.syllabus.map((g) => `- ${g.label}: ${g.items.map((i) => i.label).join(', ')}`)]
      : []),
    ...(exam?.keyPoints ? ['', 'How the paper is set out:', ...exam.keyPoints.map((k) => `- ${k.label}: ${k.text}`)] : []),
    '',
    'How my teachers mark:',
    '- Long literature answers use PEEL (Point → Evidence → Explanation → Link) in two developed paragraphs, 100–150 words.',
    '- The first sentence names the text and author — “In The Last Leaf by O. Henry…”.',
    '- Analysis (how/why) scores; retelling the story doesn’t. Short quotations and specific moments count as evidence.',
    '- Short answers are 40–60 words. Writing tasks lose marks for missing format parts or going over the word limit.',
    '',
    'How I learn best: talk to me like a friendly, sharp older student — plain words, short paragraphs, real examples from the texts. Tell me straight when I’m wrong, then show me how to fix it.',
  ].join(NL)
}

function resourceBlock(r: Resource, withKeyPoints = true) {
  return [
    `### ${r.title}${r.author ? ` — ${r.author}` : ''}`,
    `${TYPE_LABEL[r.type]} · ${stepName(r.stepId)}`,
    r.description,
    ...(withKeyPoints && r.keyPoints?.length ? r.keyPoints.map((k) => `- ${k.label}: ${k.text}`) : []),
  ].join(NL)
}

/**
 * Everything the app knows about a topic, as a compact fact sheet: summary, key points,
 * every flashcard fact (vocabulary, devices, quotes), and the practice questions set on it.
 */
export function topicDossier(r: Resource, opts: { cards?: boolean; tasks?: boolean } = { cards: true, tasks: true }) {
  const cards = subject.flashcards.filter((c) => c.resourceId === r.id)
  const tasks = subject.tasks.filter((t) => t.resourceId === r.id)
  return [
    resourceBlock(r),
    ...(opts.cards && cards.length ? ['', 'Facts I’m expected to know:', ...cards.map((c) => `- ${c.front.replace(/\?$/, '')} → ${c.back}`)] : []),
    ...(opts.tasks && tasks.length ? ['', 'Questions my school has set on it:', ...tasks.map((t) => `- ${t.prompt.split(NL)[0]}`)] : []),
  ].join(NL)
}

/** Plain text of the class notes (.docx) for a resource, trimmed to a sensible size. */
export async function notesText(r: Resource, limit = 7000): Promise<string | null> {
  const notes = r.files.filter((f) => f.role === 'notes' && f.path.endsWith('.docx') && fileExists(f.path))
  if (!notes.length) return null
  const texts = await Promise.all(notes.map((f) => docxToText(f.path).catch(() => '')))
  const joined = texts.filter(Boolean).join('\n\n')
  if (!joined) return null
  return joined.length > limit ? joined.slice(0, limit) + '\n[…notes truncated]' : joined
}

const notesSection = (text: string | null | undefined) =>
  text ? ['', '## MY CLASS NOTES FOR THIS TOPIC', '"""', text, '"""'] : []

// ───────────────────────────────────────────── Task review

const TYPE_RUBRIC: Partial<Record<Task['type'], string[]>> = {
  literature: ['Does each paragraph follow PEEL?', 'Is every point backed by a specific event, image or short quotation?', 'Is it analysis (why/how) rather than retelling (what happened)?'],
  long: ['Two developed PEEL paragraphs?', 'For across-text questions: are BOTH texts discussed and compared within the answer?', 'For extrapolation: does it move from the text to the new situation without inventing events?'],
  grammar: ['Is each answer grammatically correct? For every mistake, name the rule.'],
  reading: ['Is the answer supported by evidence from the passage?', 'Does it answer the exact command word (identify / infer / evaluate)?'],
  writing: ['Is every part of the required format present and in order?', 'Is it within the word limit?', 'Is the tone right for the audience?'],
  short: ['Is each part answered in a complete sentence?'],
}

export function buildReviewPrompt(task: Task, answer: string, notes?: string | null) {
  const r = getResource(task.resourceId)
  const trimmed = answer.trim()
  const checks = ['Did I answer the actual question (the command word)?', 'Is my evidence relevant and specific?', 'Is my explanation clear?', 'Any factual errors about the text?', 'Any grammar, spelling or punctuation errors?', 'Important ideas I missed?', ...(TYPE_RUBRIC[task.type] ?? []), ...(task.llmReviewPrompt ?? [])]
  return [
    'Can you mark this practice answer like a strict-but-kind English teacher? I want to improve it myself — please don’t rewrite it for me.',
    '',
    contextBlock(),
    '',
    rule,
    '## THE TASK',
    r ? `Topic: ${r.title}${r.author ? ` by ${r.author}` : ''} (${TYPE_LABEL[r.type]}, ${stepName(r.stepId)})` : '',
    ...(r ? ['', 'What I’ve been taught about it:', topicDossier(r, { cards: true })] : []),
    `Task type: ${TASK_TYPE_LABEL[task.type]} · Difficulty: ${DIFFICULTY_LABEL[task.difficulty]}`,
    ...(task.extract ? ['', 'Extract:', `> ${task.extract}`] : []),
    '',
    'Question:',
    task.prompt,
    '',
    'Instructions I was given:',
    ...task.instructions.map((i) => `- ${i}`),
    '',
    rule,
    `## MY ANSWER (${words(trimmed)} words)`,
    trimmed || '[I haven’t written anything yet — instead of reviewing, help me plan: what the question wants, which evidence to use, and a bullet outline. Don’t write the answer.]',
    ...notesSection(notes),
    '',
    rule,
    '## WHAT I WANT FROM YOU',
    'Check:',
    ...checks.map((c, i) => `${i + 1}. ${c}`),
    '',
    'Reply in exactly this format:',
    '1. **Estimated mark** — out of the marks this type of question usually gets, with one line saying why.',
    '2. **What works** — 2 specific things, quoting my words.',
    '3. **What to fix** — the biggest weaknesses, simplest first. Quote the exact part of my answer each time.',
    '4. **2–3 improvements** — concrete steps, e.g. “add the quotation ‘…’ after your second sentence and explain what it shows”.',
    '5. **One upgraded sentence** — take ONE of my sentences and show a stronger version, so I can see the difference.',
    '6. **Your turn** — one short question that makes me think harder about the text.',
    '',
    'Rules: do NOT rewrite my whole answer. Don’t invent facts about the text — if unsure, say so. Keep it under 300 words.',
  ]
    .filter((l) => l !== undefined)
    .join('\n')
}

export function buildTaskOnlyPrompt(task: Task) {
  const r = getResource(task.resourceId)
  return [
    'Can you coach me through planning an answer to this question? Don’t write it for me — help me think.',
    '',
    contextBlock(),
    '',
    rule,
    '## THE QUESTION',
    r ? `Topic: ${r.title}${r.author ? ` by ${r.author}` : ''} (${stepName(r.stepId)})` : '',
    ...(task.extract ? ['', 'Extract:', `> ${task.extract}`] : []),
    '',
    task.prompt,
    '',
    'Instructions:',
    ...task.instructions.map((i) => `- ${i}`),
    '',
    rule,
    '## WHAT I WANT',
    '1. What the question is really asking, in one sentence (explain the command word).',
    '2. The 2–3 best pieces of evidence from the text to use, and why.',
    '3. A bullet outline I can write from (PEEL if it’s a long answer).',
    '4. One common mistake students make on this kind of question.',
    'Then stop and wait — I’ll write the answer and send it back for feedback.',
  ].join('\n')
}

// ───────────────────────────────────────────── Resource-level prompts

export function buildGenerateTasksPrompt(r: Resource) {
  return [
    'Can you set me some fresh, exam-style practice questions on this topic?',
    '',
    contextBlock(),
    '',
    rule,
    '## TOPIC',
    topicDossier(r),
    '',
    rule,
    '## WHAT I WANT',
    'Write 5 new exam-style questions on this topic, matching my exam format:',
    '- 2 short-answer questions (40–60 words)',
    '- 1 extract-based (reference to context) question with 3–4 parts, using a short extract you are SURE is accurate — otherwise skip the extract',
    '- 1 analytical question (100–120 words, PEEL)',
    '- 1 extended question connecting the topic to real life or another text from my syllabus',
    '',
    'For each: the question, marks, and a checklist of what a full-mark answer must include. Don’t write model answers. Then offer to mark my answers one at a time.',
  ].join('\n')
}

export function buildFlashcardPrompt(r: Resource) {
  return [
    'Can you make me a set of revision flashcards for this topic?',
    '',
    contextBlock(),
    '',
    rule,
    '## TOPIC',
    topicDossier(r, { cards: true }),
    '',
    rule,
    '## WHAT I WANT',
    '12 flashcards, one per line, formatted exactly as:  Front | Back',
    'Mix: key facts, themes, literary devices with an example, vocabulary, and at least two “why/how” questions.',
    'Backs under 25 words. Only include facts you are confident are correct for this text.',
  ].join('\n')
}

// ───────────────────────────────────────────── Ask about the current page

export type PageContext =
  | { kind: 'resource'; resource: Resource }
  | { kind: 'task'; task: Task; answer?: string }
  | { kind: 'deck'; resource?: Resource; cards: Flashcard[]; title: string }
  | { kind: 'general'; label: string }

export function buildAskPrompt(question: string, ctx: PageContext, notes?: string | null) {
  const page: string[] = []
  if (ctx.kind === 'resource') {
    const r = ctx.resource
    page.push(`I’m on the page for this topic:`, '', topicDossier(r))
    const related = r.related.map((id) => getResource(id)?.title).filter(Boolean)
    if (related.length) page.push('', `Related topics in my syllabus: ${related.join(', ')}.`)
  } else if (ctx.kind === 'task') {
    const t = ctx.task
    const r = getResource(t.resourceId)
    page.push(
      `I’m working on a practice task${r ? ` about ${r.title}${r.author ? ` by ${r.author}` : ''}` : ''}:`,
      '',
      ...(t.extract ? ['Extract:', `> ${t.extract}`, ''] : []),
      'Question:',
      t.prompt,
      '',
      'Instructions:',
      ...t.instructions.map((i) => `- ${i}`),
      '',
      ctx.answer?.trim() ? `My answer so far (${words(ctx.answer)} words):\n${ctx.answer.trim()}` : 'I haven’t written my answer yet.',
    )
    if (r) page.push('', 'About this topic:', topicDossier(r, { cards: true }))
  } else if (ctx.kind === 'deck') {
    page.push(`I’m revising the flashcard deck “${ctx.title}”. The cards:`, '', ...ctx.cards.slice(0, 40).map((c) => `- ${c.front} → ${c.back}`))
    if (ctx.resource) page.push('', resourceBlock(ctx.resource))
  } else {
    page.push(`I’m on the “${ctx.label}” page of my study app.`)
  }

  return [
    'I’ve got a question about what I’m studying — can you help?',
    '',
    contextBlock(),
    '',
    rule,
    '## WHAT I’M LOOKING AT',
    ...page,
    ...notesSection(notes),
    '',
    rule,
    '## MY QUESTION',
    question.trim() || '[type your question here]',
    '',
    'Answer simply, with an example from the text where it helps. If my question shows a misunderstanding, point it out gently. If it’s about the exam, tie your answer to the format above. End with one quick check question for me.',
  ].join('\n')
}

// ───────────────────────────────────────────── Revise everything

export interface ReviseOptions {
  /** 'sa1' = what's coming in the exam, 'all' = every resource, or a step id */
  scope: 'sa1' | 'all' | string
  keyPoints: boolean
  progress: boolean
  mode: 'tutor' | 'quiz' | 'plan'
}

export function progressSummary(state: State, cards: Flashcard[]) {
  const lines: string[] = []
  const review = cards.filter((c) => state.cards[c.id]?.status === 'review')
  const known = cards.filter((c) => state.cards[c.id]?.status === 'known')
  const byRes = new Map<string, number>()
  review.forEach((c) => byRes.set(c.resourceId, (byRes.get(c.resourceId) ?? 0) + 1))
  const needsWork = Object.entries(state.answers).filter(([, a]) => a.rating === 'needs-work').map(([id]) => getTask(id)).filter(Boolean) as Task[]
  const done = Object.values(state.answers).filter((a) => a.status === 'done').length
  const visited = Object.keys(state.visits).map((id) => getResource(id)?.title).filter(Boolean)

  lines.push(`- Flashcards: ${known.length} known, ${review.length} marked “need review” (of ${cards.length}).`)
  if (byRes.size)
    lines.push(`- Topics where I keep missing cards: ${[...byRes.entries()].sort((a, b) => b[1] - a[1]).map(([id, n]) => `${getResource(id)?.title} (${n})`).join(', ')}.`)
  if (review.length) lines.push(`- Cards I got wrong: ${review.slice(0, 15).map((c) => `“${c.front}”`).join('; ')}.`)
  lines.push(`- Practice tasks completed: ${done} of ${subject.tasks.length}.`)
  if (needsWork.length) lines.push(`- Answers I rated “needs work”: ${needsWork.map((t) => `${t.title} (${getResource(t.resourceId)?.title})`).join('; ')}.`)
  if (visited.length) lines.push(`- Topics I’ve opened: ${visited.join(', ')}.`)
  else lines.push('- I haven’t opened any topics in the app yet.')
  return lines
}

const MODE_BRIEF: Record<ReviseOptions['mode'], string[]> = {
  tutor: [
    'Be my revision tutor for this session.',
    '1. Start by giving me a 5-line overview of what’s in scope and suggesting where to begin (use my progress if given).',
    '2. Then teach one topic at a time: a short recap → ONE question → wait for my answer → mark it → move on.',
    '3. Mix question types like my exam: extract questions, 40–60-word answers, PEEL answers, grammar do-as-directed.',
    '4. Keep track of what I get wrong and come back to it later in the session.',
  ],
  quiz: [
    'Quiz me.',
    '- Ask ONE question at a time across the topics in scope, mixing easy and hard, and wait for my reply.',
    '- After each answer: correct / partly correct / wrong, the right answer in one or two lines, then the next question.',
    '- Every 10 questions, give me a score and my weakest topic.',
  ],
  plan: [
    'Make me a revision plan.',
    '- Ask me first how many days I have until the exam and how long I can study each day.',
    '- Then give a day-by-day plan covering every topic in scope, weighted towards my weak areas and the high-mark sections of the paper.',
    '- For each day: which topics, what to do (read notes / flashcards / practise a PEEL answer / grammar worksheet), and a 5-minute self-test.',
  ],
}

export function reviseResources(scope: ReviseOptions['scope']): { group: string; resources: Resource[] }[] {
  if (scope === 'sa1' && subject.exam) {
    return subject.exam.syllabus.map((g) => ({
      group: g.label,
      resources: g.items.map((i) => (i.resourceId ? getResource(i.resourceId) : undefined)).filter((r): r is Resource => Boolean(r)),
    }))
  }
  const steps = scope === 'all' || scope === 'sa1' ? orderedSteps : orderedSteps.filter((s) => s.id === scope)
  return steps.map((s) => ({ group: s.label + (s.note ? ` — ${s.note}` : ''), resources: resourcesInStep(s.id) }))
}

export function buildRevisePrompt(opts: ReviseOptions, state: State, cards: Flashcard[]) {
  const syllabus: string[] = []
  const seen = new Set<string>()
  for (const g of reviseResources(opts.scope)) {
    syllabus.push('', `### ${g.group}`)
    for (const r of g.resources) {
      if (seen.has(r.id)) {
        syllabus.push(`- ${r.title} (see above)`)
        continue
      }
      seen.add(r.id)
      if (opts.keyPoints) syllabus.push('', topicDossier(r, { cards: true }).replace(/^### /, '#### '))
      else syllabus.push(`- ${r.title}${r.author ? ` — ${r.author}` : ''} (${TYPE_LABEL[r.type]})`)
    }
    if (opts.scope === 'sa1' && g.group === 'Grammar') syllabus.push('- Punctuation (no notes in my folder — use standard Class 8 rules)')
  }
  return [
    'I’d like you to be my English revision tutor for this session. Everything about my course is below — read all of it, then we’ll start.',
    '',
    contextBlock(),
    '',
    rule,
    `## ${opts.scope === 'sa1' ? 'EVERYTHING IN MY SA1 EXAM' : opts.scope === 'all' ? 'MY WHOLE SYLLABUS' : `MY SYLLABUS — ${stepName(opts.scope)} only`}`,
    ...syllabus,
    ...(opts.progress ? ['', rule, '## MY PROGRESS SO FAR (from my study app)', ...progressSummary(state, cards)] : []),
    '',
    rule,
    '## WHAT I WANT',
    ...MODE_BRIEF[opts.mode],
    '',
    'Rules: only use facts you’re confident about for these specific texts — if unsure, say so rather than guessing. Never write full answers for me before I’ve tried. Keep each message short.',
  ].join('\n')
}

// ───────────────────────────────────────────── Mark a mock paper

export function buildMarkingPrompt(test: MockTest, answers: Record<string, string>, result: AttemptResult) {
  const lines: string[] = []
  let n = 0
  for (const s of test.sections) {
    lines.push('', `### ${s.title}${s.note ? ` (${s.note})` : ''}`)
    if (s.passage) lines.push('', `Passage — ${s.passage.title ?? ''}`, s.passage.body, ...(s.passage.table ? ['', [s.passage.table.head, ...s.passage.table.rows].map((r) => r.join(' | ')).join('\n')] : []))
    if (s.extract) lines.push('', `Extract: ${s.extract}`)
    for (const q of s.questions) {
      n++
      const r = result.questions[q.id]
      const a = (answers[q.id] ?? '').trim()
      lines.push('', `**Q${n}. (${q.marks} mark${q.marks === 1 ? '' : 's'})** ${q.prompt}`)
      if (q.kind === 'mcq') {
        lines.push(`My answer: ${a ? q.options[Number(a)] : '(blank)'} — ${r.correct ? 'correct' : `wrong (answer: ${q.options[q.answer]})`}`)
      } else if (q.kind === 'fill') {
        lines.push(`My answer: ${a || '(blank)'} — ${r.correct ? 'correct' : `wrong (answer: ${q.accept[0]})`}`)
      } else {
        const missed = r.points?.filter((p) => !p.hit).map((p) => p.label) ?? []
        lines.push(
          ...(q.words ? [`Expected length: ${q.words[0]}–${q.words[1]} words. Format: ${q.format ?? 'answer'}.`] : []),
          ...(q.points?.length ? [`Marking points: ${q.points.map((p) => p.label).join('; ')}.`] : []),
          'My answer:',
          a ? `"""\n${a}\n"""` : '(blank)',
          `App’s rough estimate: ${r.score}/${q.marks}${missed.length ? ` — it thinks I missed: ${missed.join('; ')}` : ''}.`,
        )
      }
    }
  }
  return [
    'Can you mark my mock exam paper like my English teacher would? The multiple-choice parts are already marked — please focus on the written answers.',
    '',
    contextBlock(),
    '',
    rule,
    `## THE PAPER — ${test.title}`,
    ...lines,
    '',
    rule,
    '## WHAT I WANT',
    '1. For every written answer: your mark out of the marks shown, and one line on why.',
    '2. For the long answers and writing tasks: what would have got the missing marks (quote my words when pointing out a problem).',
    '3. A final total out of the paper’s marks, and my 3 biggest weaknesses across the whole paper.',
    '4. A short “fix list” for the night before the exam: what to revise and one practice task for each weakness.',
    '',
    'Be fair and specific. Don’t rewrite my answers — show me one improved sentence where it helps.',
  ].join('\n')
}
