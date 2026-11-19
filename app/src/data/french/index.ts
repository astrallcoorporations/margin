import type { Category, Flashcard, Resource, Step, Subject, Task } from '@/types'
import type { KeywordPoint, McqQuestion, MockTest, TestQuestion, WrittenQuestion } from '@/types/tests'

/**
 * French, Class 8. Step 26 only for now: the imperative, letter writing, and useful phrases.
 * Everything here comes from the teacher's Step 26 files (Devenez un expert, Lisez, Letter writing,
 * Les bases de la correspondance, Les phrases utiles pour dialoguer).
 */

const S = 'french'
const f = (path: string, role?: Resource['files'][number]['role'], label?: string) => ({ path: `french/${path}`, role, label })

const steps: Step[] = [{ id: 'step-26', label: 'Step 26', note: 'imperative and letter writing', order: 26 }]

const resources: Resource[] = [
  {
    id: 'fr-imperatif',
    title: 'L’impératif',
    code: 'IMP',
    type: 'concept',
    stepId: 'step-26',
    subjectId: S,
    description: 'Giving orders, advice and instructions: the three forms (tu, nous, vous), the irregular verbs, the negative and the pronominal verbs.',
    files: [f('step 26/Devenez un expert - L\'imperatif.pdf', 'reference', 'Devenez un expert'), f('step 26/Lisez - Dialogue et imperatif.pdf', 'worksheet', 'Lisez (dialogue)')],
    tags: ['impératif', 'conjugaison', 'verbes'],
    related: ['fr-lettre'],
    keyPoints: [
      { label: 'What it is', text: 'The imperative gives an order, advice or an instruction. It has only three forms: tu, nous and vous, and no subject pronoun is written: Mangez des fruits !' },
      { label: 'How to form it', text: 'Take the present tense of tu, nous or vous and drop the pronoun: finir → finis, finissons, finissez. Comprendre → comprends, comprenons, comprenez.' },
      { label: '-er verbs and aller', text: 'For tu, -er verbs and aller lose the final s: ferme, nage, va. The nous and vous forms stay regular: nageons, nagez; allons, allez.' },
      { label: 'Other verbs from the sheet', text: 'recevoir → reçois, recevons, recevez. Dire → dis, disons, dites.' },
      { label: 'Four irregular verbs', text: 'être: sois, soyons, soyez. Avoir: aie, ayons, ayez. Savoir: sache, sachons, sachez. Vouloir: veuille, veuillons, veuillez.' },
      { label: 'Negative', text: 'Put ne before the verb and pas after it: Ne mets pas le sel dans le plat ! Ne parlons pas si vite !' },
      { label: 'Pronominal verbs', text: 'Affirmative: the pronoun goes after the verb with a hyphen: brosse-toi, brossons-nous, brossez-vous. Negative: ne te brosse pas, ne nous brossons pas, ne vous brossez pas.' },
      { label: 'Finding the infinitive', text: 'Venez → venir, ajoute → ajouter, mets → mettre, va → aller, achète → acheter, prends → prendre, sois → être.' },
    ],
  },
  {
    id: 'fr-lettre',
    title: 'La lettre informelle',
    code: 'LET',
    type: 'writing',
    stepId: 'step-26',
    subjectId: S,
    description: 'Writing a letter to a French friend: layout, opening and closing, useful sentences, and two 80-word model letters.',
    files: [f('step 26/Letter writing.pdf', 'worksheet', 'Letter writing (format and models)'), f('step 26/Les bases de la correspondance.pdf', 'reference', 'Les bases de la correspondance')],
    tags: ['lettre', 'écriture', 'correspondance'],
    related: ['fr-imperatif', 'fr-phrases'],
    keyPoints: [
      { label: 'Layout', text: 'Place and date at the top (Bengaluru, le 6 novembre 2026), then Cher / Chère + first name, the body, a closing, and your name.' },
      { label: 'Cher or Chère', text: 'Cher for a boy (Cher Thomas), chère for a girl (Chère Claire).' },
      { label: 'Opening', text: 'Start friendly: Comment vas-tu ? or J’espère que tu vas bien.' },
      { label: 'Closing', text: 'Between friends: Amicalement or Amitiés, then your name. Add À bientôt ! if you will meet again.' },
      { label: 'Length', text: 'The Step 26 tasks ask for about 80 words. Keep to the point: who you are with, where, what you do, and one question or invitation at the end.' },
      { label: 'Tenses to use', text: 'Present for what is happening now (je me promène, il fait froid), passé composé for what you did (nous avons nettoyé, j’ai porté, nous avons mangé), and the near future for plans.' },
      { label: 'Invite and reply', text: 'Je vous invite à passer le weekend chez nous. Répondez-moi vite. J’attends votre réponse. Nous vous attendons. Venez avec nous.' },
    ],
  },
  {
    id: 'fr-phrases',
    title: 'Phrases utiles: chez le médecin',
    code: 'DIA',
    type: 'concept',
    stepId: 'step-26',
    subjectId: S,
    description: 'Useful sentences, with their meaning, for writing a dialogue at the doctor’s.',
    files: [f('step 26/Les phrases utiles pour dialoguer.pdf', 'reference', 'Les phrases utiles pour dialoguer')],
    tags: ['dialogue', 'médecin', 'vocabulaire'],
    related: ['fr-imperatif'],
    keyPoints: [
      { label: 'The doctor asks', text: 'Comment puis-je vous aider ? Quels sont vos symptômes ? Qu’est-ce qui se passe ? Tu ne te sens pas bien ?' },
      { label: 'The patient says', text: 'J’ai un rendez-vous chez le médecin parce que j’ai de la fièvre. Je suis allergique. Est-ce que je peux continuer à prendre le médicament ? Quel est votre conseil ?' },
      { label: 'The doctor advises', text: 'Vous devez vous reposer. Il faut prendre des médicaments pour soulager les symptômes. Vous avez besoin de beaucoup de liquides. Suivez les instructions de prise des médicaments.' },
      { label: 'Polite ending', text: 'Prenez soin de vous. N’hésitez pas à me contacter encore, si besoin.' },
    ],
  },
]

const WORK = ['Write in French.', 'Check each verb form against the table before you finish.']
const LETTER = ['About 80 words, in French.', 'Layout: place and date, Cher / Chère, body, Amicalement / Amitiés, your name.', 'Use the present for now and the passé composé for what you did.']

const tasks: Task[] = [
  { id: 'fr-t-conjugue', resourceId: 'fr-imperatif', title: 'Conjugate at the imperative', prompt: 'Write the imperative (tu, nous, vous) of: finir, comprendre, aller, nager, recevoir, fermer, dire.', type: 'grammar', difficulty: 'easy', instructions: WORK, tags: ['conjugaison'] },
  { id: 'fr-t-irreguliers', resourceId: 'fr-imperatif', title: 'The four irregular verbs', prompt: 'Write the imperative (tu, nous, vous) of être, avoir, savoir and vouloir, then use two of them in a sentence each.', type: 'grammar', difficulty: 'medium', instructions: WORK, tags: ['irréguliers'] },
  { id: 'fr-t-negatif', resourceId: 'fr-imperatif', title: 'Say it in the negative', prompt: 'Put these in the negative: Mets le sel dans le plat ! · Parlons vite ! · Mangez des bonbons ! · Va à l’école en retard !', type: 'grammar', difficulty: 'easy', instructions: WORK, tags: ['négation'] },
  { id: 'fr-t-pronominal', resourceId: 'fr-imperatif', title: 'Pronominal verbs', prompt: 'Write the affirmative and the negative imperative (tu, nous, vous) of se brosser and se lever.', type: 'grammar', difficulty: 'medium', instructions: WORK, tags: ['pronominaux'] },
  { id: 'fr-t-infinitifs', resourceId: 'fr-imperatif', title: 'Find the infinitive', prompt: 'Give the infinitive of each imperative: Venez · Ajoute · Mets · Va · Achète · Prends · Sois.', type: 'short', difficulty: 'easy', instructions: ['Write the infinitive next to each form.'], tags: ['infinitif'] },
  { id: 'fr-t-conseils', resourceId: 'fr-imperatif', title: 'Advice to a friend', prompt: 'Your friend is going to the mountains for a week. Give five pieces of advice using the imperative (at least one in the negative).', type: 'writing', difficulty: 'medium', instructions: ['Use tu or vous consistently.', 'Five sentences, each with an imperative verb.'], tags: ['conseils'] },
  { id: 'fr-t-vacances', resourceId: 'fr-lettre', title: 'A letter from your holidays', prompt: 'Vous êtes en vacances chez vos grands-parents. Rédigez une lettre à votre ami(e) français(e). (80 mots)', type: 'writing', difficulty: 'medium', instructions: LETTER, tags: ['lettre', 'vacances'] },
  { id: 'fr-t-diwali', resourceId: 'fr-lettre', title: 'A letter about Diwali', prompt: 'Vous avez fêté Diwali avec votre famille. Écrivez une lettre à votre ami(e) français(e) pour lui décrire cette fête. (80 mots)', type: 'writing', difficulty: 'medium', instructions: LETTER, tags: ['lettre', 'fête'] },
  { id: 'fr-t-invitation', resourceId: 'fr-lettre', title: 'Invite a friend', prompt: 'Écrivez une courte lettre pour inviter un ami à passer le weekend chez vous. Utilisez au moins trois phrases de « Les bases de la correspondance ».', type: 'writing', difficulty: 'easy', instructions: ['Start with Cher / Chère and end with Amicalement.', 'Use the useful sentences from the sheet.'], tags: ['invitation'] },
  { id: 'fr-t-medecin', resourceId: 'fr-phrases', title: 'At the doctor’s', prompt: 'Écrivez un dialogue de 8 répliques entre un médecin et un patient qui a de la fièvre. Utilisez au moins cinq phrases utiles de la fiche.', type: 'writing', difficulty: 'medium', instructions: ['Alternate doctor and patient.', 'Use the imperative at least twice (for example Suivez, Prenez).'], tags: ['dialogue'] },
]

type Card = [front: string, back: string]
const deck = (resourceId: string, cards: Card[]): Flashcard[] => cards.map(([front, back], i) => ({ id: `${resourceId}:${i + 1}`, resourceId, front, back }))

const flashcards: Flashcard[] = [
  ...deck('fr-imperatif', [
    ['À quelles personnes se conjugue l’impératif ?', 'tu, nous, vous, sans pronom sujet : Mangez !'],
    ['Impératif de finir (tu / nous / vous) ?', 'finis · finissons · finissez'],
    ['Impératif de comprendre ?', 'comprends · comprenons · comprenez'],
    ['Impératif de aller ?', 'va · allons · allez'],
    ['Impératif de nager ?', 'nage · nageons · nagez'],
    ['Impératif de recevoir ?', 'reçois · recevons · recevez'],
    ['Impératif de fermer ?', 'ferme · fermons · fermez'],
    ['Impératif de dire ?', 'dis · disons · dites'],
    ['Impératif de être ?', 'sois · soyons · soyez'],
    ['Impératif de avoir ?', 'aie · ayons · ayez'],
    ['Impératif de savoir ?', 'sache · sachons · sachez'],
    ['Impératif de vouloir ?', 'veuille · veuillons · veuillez'],
    ['Pourquoi dit-on « Va » et « Ferme » sans s ?', 'Pour tu, les verbes en -er et aller perdent le s final de la forme du présent.'],
    ['Comment met-on l’impératif au négatif ?', 'ne + verbe + pas : Ne mets pas le sel dans le plat !'],
    ['Impératif affirmatif de se brosser ?', 'brosse-toi · brossons-nous · brossez-vous'],
    ['Impératif négatif de se brosser ?', 'ne te brosse pas · ne nous brossons pas · ne vous brossez pas'],
    ['Infinitif de « Prends » ?', 'prendre'],
    ['Infinitif de « Mets » ?', 'mettre'],
    ['Infinitif de « Sois » ?', 'être'],
  ]),
  ...deck('fr-lettre', [
    ['Que met-on en haut d’une lettre ?', 'Le lieu et la date : Bengaluru, le 6 novembre 2026.'],
    ['Cher ou Chère ?', 'Cher + prénom masculin (Cher Thomas), chère + prénom féminin (Chère Claire).'],
    ['Une formule finale entre amis ?', 'Amicalement ou Amitiés, puis ton prénom.'],
    ['J’espère que tout va bien.', 'I hope all is well.'],
    ['Je vous écris pour décrire mes vacances.', 'I am writing to tell you about my vacations.'],
    ['Je vous invite à passer le weekend chez nous.', 'I invite you to spend the weekend at our place.'],
    ['Nous vous attendons.', 'We are waiting for you.'],
    ['Répondez-moi vite.', 'Reply back soon.'],
    ['Venez avec nous.', 'Come with us.'],
    ['J’attends votre réponse.', 'I await your reply.'],
    ['À bientôt !', 'See you soon!'],
    ['Nous nous amusons beaucoup.', 'We enjoy ourselves a lot.'],
    ['Combien de mots dans les lettres de l’étape 26 ?', 'Environ 80 mots.'],
  ]),
  ...deck('fr-phrases', [
    ['Comment puis-je vous aider ?', 'How can I help you?'],
    ['Quels sont vos symptômes ?', 'What symptoms do you have?'],
    ['Vous avez de la fièvre.', 'You have a fever.'],
    ['Je vais vous ausculter.', 'I am going to examine you.'],
    ['Vous devez vous reposer.', 'You must rest.'],
    ['Suivez les instructions de prise des médicaments.', 'Follow the instructions for taking the medicines.'],
    ['Je suis allergique.', 'I am allergic.'],
    ['Quel est votre conseil ?', 'What is your advice?'],
    ['Prenez soin de vous.', 'Take care.'],
    ['N’hésitez pas à me contacter encore, si besoin.', 'Do not hesitate to contact me again, if needed.'],
  ]),
]

let n = 0
const id = (p: string) => `${p}-${++n}`
const mcq = (prompt: string, options: string[], answer: number, explain?: string): McqQuestion => ({ id: id('fq'), kind: 'mcq', prompt, options, answer, marks: 1, explain })
const fill = (prompt: string, accept: string[], marks = 1): TestQuestion => ({ id: id('fq'), kind: 'fill', prompt, accept, marks })
const kw = (label: string, ...any: string[]): KeywordPoint => ({ label, any })
const written = (prompt: string, marks: number, rest: Omit<WrittenQuestion, 'id' | 'kind' | 'prompt' | 'marks'>): WrittenQuestion => ({ id: id('fq'), kind: 'written', prompt, marks, ...rest })

const tests: MockTest[] = [
  {
    id: 'fr-imperatif-worksheet',
    title: 'L’impératif: worksheet',
    kind: 'worksheet',
    description: 'Forms, irregular verbs, the negative and pronominal verbs, from the Step 26 sheets.',
    minutes: 15,
    sections: [
      {
        id: 's1',
        title: 'Les formes',
        note: 'Write one word. Accents help but are not needed.',
        questions: [
          mcq('L’impératif se conjugue à quelles personnes ?', ['je, tu, il', 'tu, nous, vous', 'il, elle, ils', 'je, nous, ils'], 1),
          fill('Impératif de finir (tu) :', ['finis']),
          fill('Impératif de comprendre (nous) :', ['comprenons']),
          fill('Impératif de aller (tu) :', ['va']),
          fill('Impératif de nager (vous) :', ['nagez']),
          fill('Impératif de dire (vous) :', ['dites']),
          fill('Impératif de recevoir (tu) :', ['reçois', 'recois']),
          mcq('Quelle phrase est correcte ?', ['Tu mange des fruits !', 'Mange des fruits !', 'Manges des fruits !', 'Mangent des fruits !'], 1, 'For tu, -er verbs lose the final s: Mange des fruits !'),
        ],
      },
      {
        id: 's2',
        title: 'Les verbes irréguliers',
        questions: [
          fill('Impératif de être (tu) :', ['sois']),
          fill('Impératif de avoir (vous) :', ['ayez']),
          fill('Impératif de savoir (nous) :', ['sachons']),
          fill('Impératif de vouloir (vous) :', ['veuillez']),
        ],
      },
      {
        id: 's3',
        title: 'Négation, pronominaux, infinitif',
        questions: [
          mcq('Mets à la forme négative : « Mets le sel dans le plat ! »', ['Ne mets pas le sel dans le plat !', 'Mets ne pas le sel dans le plat !', 'Ne mets le sel pas dans le plat !', 'Pas mets le sel dans le plat !'], 0),
          fill('Impératif affirmatif de se brosser (vous) :', ['brossez-vous', 'brossez vous', 'brossezvous']),
          mcq('Impératif négatif de se brosser (tu) :', ['Brosse-toi pas.', 'Ne te brosse pas.', 'Ne brosse pas te.', 'Te brosse pas.'], 1),
          fill('Infinitif de « Prends » :', ['prendre']),
          fill('Infinitif de « Va » :', ['aller']),
          fill('Infinitif de « Sois » :', ['être', 'etre']),
        ],
      },
    ],
  },
  {
    id: 'fr-lettre-worksheet',
    title: 'La lettre informelle: worksheet',
    kind: 'worksheet',
    description: 'Layout, phrases and a short invitation, from the Step 26 letter-writing files.',
    minutes: 15,
    sections: [
      {
        id: 's1',
        title: 'Le format et les phrases',
        questions: [
          mcq('Une lettre informelle commence par :', ['Monsieur,', 'Cher / Chère + prénom', 'Veuillez agréer', 'Bonjour Madame le directeur'], 1),
          mcq('Pour une amie qui s’appelle Claire, on écrit :', ['Cher Claire,', 'Chère Claire,', 'Chers Claire,', 'Chère Claires,'], 1),
          mcq('Une formule finale entre amis :', ['Amicalement', 'Cordialement vôtre', 'Sincères salutations', 'Je vous prie d’agréer'], 0),
          mcq('« J’espère que tout va bien » signifie :', ['I hope all is well.', 'I invite you.', 'Reply soon.', 'See you soon.'], 0),
          mcq('« À bientôt ! » signifie :', ['Goodbye forever', 'See you soon!', 'Good morning', 'Thank you'], 1),
          mcq('Où écrit-on le lieu et la date ?', ['En haut de la lettre', 'À la fin', 'Dans le corps de la lettre', 'Nulle part'], 0),
          mcq('Les lettres de l’étape 26 ont environ combien de mots ?', ['40', '80', '150', '200'], 1),
          fill('« Reply back soon » : ______-moi vite.', ['répondez', 'repondez']),
          fill('Je vous écris pour décrire mes ______. (holidays)', ['vacances']),
        ],
      },
      {
        id: 's2',
        title: 'Écrire',
        note: 'Write 3 to 4 sentences in French.',
        questions: [
          written('Écris trois ou quatre phrases pour inviter un ami à passer le weekend chez toi.', 4, {
            need: 3,
            points: [
              kw('An invitation', 'invite', 'viens', 'venez', 'passer le weekend', 'week-end', 'weekend'),
              kw('Where: at your place', 'chez nous', 'chez moi'),
              kw('A friendly opening or closing', 'cher', 'chère', 'amicalement', 'amitiés', 'à bientôt', 'a bientot'),
              kw('Ask for a reply', 'réponds', 'réponds-moi', 'repondez', 'répondez', 'j’attends', 'j\'attends', 'nous t’attendons', 'nous vous attendons'),
            ],
            model: 'Bengaluru, le 10 novembre 2026. Cher Thomas, j’espère que tu vas bien. Je t’invite à passer le weekend chez nous. Viens avec ta famille ! Réponds-moi vite. Amicalement, Ananya',
          }),
        ],
      },
    ],
  },
]

const categories: Category[] = [{ id: 'concepts', label: 'Grammar and writing', description: 'The imperative, letters and useful phrases.', types: ['concept', 'writing'] }]

export const french: Subject = {
  id: 'french',
  name: 'French',
  classLabel: 'Class 8',
  term: 'SA1',
  tagline: 'The imperative, letters and useful phrases.',
  steps,
  resources,
  tasks,
  flashcards,
  categories,
  tests,
  exam: { name: 'SA1 French', syllabus: [] },
}
french.exam!.syllabus = [...french.steps]
  .sort((a, b) => a.order - b.order)
  .map((st) => ({ label: st.label, items: french.resources.filter((r) => r.stepId === st.id).map((r) => ({ label: r.title, resourceId: r.id })) }))
  .filter((g) => g.items.length > 0)
