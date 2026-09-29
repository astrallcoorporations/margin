import type { KeywordPoint, McqQuestion, MockTest, TestQuestion, WrittenQuestion } from '@/types/tests'

/**
 * Mock papers (SA1 pattern) and worksheets.
 * Passages, questions and answer keys come from the documents in english/ —
 * reading comprehension sheets, worksheet answer keys and sample answers.
 * Keyword points for written answers are drawn from the notes and sample answers.
 */

let n = 0
const id = (p: string) => `${p}-${++n}`

const mcq = (prompt: string, options: string[], answer: number, marks = 1, extra: Partial<McqQuestion> = {}): McqQuestion => ({
  id: id('q'),
  kind: 'mcq',
  prompt,
  options,
  answer,
  marks,
  ...extra,
})
const fill = (prompt: string, accept: string[], marks = 1): TestQuestion => ({ id: id('q'), kind: 'fill', prompt, accept, marks })
const kw = (label: string, ...any: string[]): KeywordPoint => ({ label, any })
const written = (prompt: string, marks: number, rest: Omit<WrittenQuestion, 'id' | 'kind' | 'prompt' | 'marks'>): WrittenQuestion => ({
  id: id('q'),
  kind: 'written',
  prompt,
  marks,
  ...rest,
})

// ───────────────────────────────────────────── Passages (from sa1/Reading Comprehension *.docx)

const RC3 = {
  title: 'Should Cities Create More Car-Free Zones?',
  body: `As cities grow larger, roads become increasingly crowded with cars, buses, motorcycles and delivery vehicles. Traffic congestion not only wastes time but also contributes to air pollution and noise. One solution being considered by many cities is the creation of car-free zones, where private vehicles are restricted or completely banned in certain areas. While some people welcome this idea, others believe that it could create new problems.

Supporters of car-free zones argue that they can make cities cleaner and healthier. Fewer vehicles mean lower levels of exhaust fumes and less noise. Pedestrians can walk more safely, while cyclists may feel more comfortable using the roads. Car-free areas can also encourage people to spend more time outdoors. Streets that were once filled with traffic can become spaces for walking, small markets, public events and community activities.

There may also be economic benefits. When streets are pleasant and safe, people may be more likely to visit local shops, cafés and markets. Tourists may also enjoy exploring an area without worrying about heavy traffic. In some places, car-free streets have helped transform busy urban areas into attractive public spaces.

However, not everyone agrees that restricting cars is the best solution. People with disabilities, elderly citizens and families with young children may find it difficult to travel long distances on foot. Shop owners may worry that customers will stop visiting if they cannot drive close to their businesses. Workers who depend on vehicles may also face difficulties. If public transport is unreliable or overcrowded, removing cars without providing alternatives could create frustration rather than solve the problem.

Another concern is that traffic may simply move to nearby streets. If only one area becomes car-free, surrounding roads could become more crowded. Therefore, creating such zones requires careful planning. Cities need reliable public transport, safe walking paths, cycling facilities and convenient parking areas outside restricted zones.

Car-free zones are neither a perfect solution nor a problem in themselves. Their success depends on how thoughtfully they are planned and implemented. Instead of asking whether cars should disappear from city centres completely, perhaps a better question is: How can cities create spaces that are safe, healthy and accessible to everyone?`,
}

const RC4 = {
  title: 'How Do Teenagers Spend Their Free Time?',
  body: `A survey was conducted among 200 students aged 13–15 to understand how they preferred to spend their free time on a typical weekday. The students were asked to select the activity they spent the most time doing.

The results show that digital entertainment was the most popular choice, with 35% of the students spending most of their free time on social media or watching videos. Sports and exercise came next, with 25% of students choosing them.

Reading and spending time with family or friends were equally popular, with 15% each. Only 10% of students reported that hobbies such as music, art or gardening took up most of their free time.

The findings do not necessarily mean that students spend all their free time on one activity. Instead, they show which activity takes up the largest share of their free time. The results suggest that digital entertainment has become an important part of teenagers' daily lives. However, the data also shows that many students continue to participate in physical activities and spend time developing personal interests.

The survey raises an important question: Is the amount of time teenagers spend on screens balanced with other activities that support their physical, social and creative development?`,
  table: {
    head: ['Activity', 'Percentage of students'],
    rows: [
      ['Using social media / watching videos', '35%'],
      ['Playing sports or exercising', '25%'],
      ['Reading books', '15%'],
      ['Spending time with family and friends', '15%'],
      ['Hobbies such as music, art or gardening', '10%'],
    ],
  },
}

const RC2 = {
  title: 'Should School Days Begin Later',
  body: `For many students, waking up early is a difficult part of the school day. Some students believe that schools should begin later in the morning, while others argue that an early start helps students develop discipline and leaves more time for activities after school. The debate has become increasingly relevant as schools try to balance academic learning with students’ health and well-being.

One argument in favour of a later start is that teenagers need sufficient sleep for their physical and mental development. Students who do not get enough sleep may find it difficult to concentrate, remember information or participate actively in class. A later start could allow them to arrive at school feeling more alert and prepared to learn. It could also reduce morning stress for students who have long journeys to school.

However, changing school timings may create difficulties for families. Parents who begin work early may struggle to arrange supervision for younger children. Transport schedules would also need to be changed, and after-school activities could finish later in the day. Students involved in sports, clubs or coaching classes might have less time for these activities.

An early school start, on the other hand, has its own advantages. It allows students to finish their academic day earlier and gives them more time in the afternoon for hobbies, family responsibilities and extracurricular activities. Supporters of early starts also believe that students should learn to manage their routines and develop healthy habits such as going to bed on time.

Perhaps the best solution is not simply to choose between an early or late start. Schools could examine their students’ needs, transport arrangements and local circumstances before making a decision. The aim should be to create a timetable that supports both effective learning and students’ overall well-being.`,
}

const RC1 = {
  title: 'Museum Collections Survey',
  body: `Museums preserve objects that help people understand the history, art and culture of a region. They contain paintings, sculptures, coins, manuscripts, tools and other artefacts from different periods. A survey was conducted among 300 Grade 8 students to find out which type of museum collection interested them the most. The students were asked to choose one category they would most like to explore during a school museum visit.

The results showed that historical artefacts attracted the greatest interest, followed by paintings and sculptures. Ancient coins and manuscripts received moderate interest, while traditional tools and crafts received the fewest responses. The survey also suggested that students were curious about how objects from the past could help them understand the lives, occupations and traditions of earlier societies.`,
  table: {
    head: ['Museum collection', 'Students interested', 'Percentage'],
    rows: [
      ['Historical Artefacts', '81', '27%'],
      ['Paintings and Sculptures', '72', '24%'],
      ['Ancient Coins', '60', '20%'],
      ['Manuscripts', '51', '17%'],
      ['Traditional Tools and Crafts', '36', '12%'],
      ['Total', '300', '100%'],
    ],
  },
}

// ───────────────────────────────────────────── Grammar banks (from worksheet answer keys)

const tensesMcq = (): McqQuestion[] => [
  mcq('Choose the correct replacement for the underlined verb: “Riya go to school by bus every day.”', ['went', 'goes', 'is going', 'has gone'], 1),
  mcq('“The students was preparing for the competition when the teacher entered.”', ['were preparing', 'are preparing', 'had prepared', 'have prepared'], 0),
  mcq('“We have visited the museum last Saturday.”', ['had visited', 'visited', 'were visiting', 'visit'], 1, 1, { explain: 'A finished time (last Saturday) takes the simple past.' }),
  mcq('“By the time we reached the station, the train left.”', ['leaves', 'was leaving', 'had left', 'has left'], 2, 1, { explain: 'The train left before another past action → past perfect.' }),
  mcq('“Look! The children play in the rain.”', ['played', 'have played', 'are playing', 'had played'], 2),
  mcq('Which word should be omitted? “She does not likes spicy food.”', ['She', 'does', 'not', 'likes'], 3, 1, { explain: 'After “does not” use the base form: like.' }),
  mcq('Which word should be omitted? “He will can complete the task tomorrow.”', ['He', 'will', 'can', 'complete'], 2),
  mcq('When I reached the auditorium, the programme ______.', ['starts', 'was starting', 'had already started', 'has already started'], 2),
  mcq('I ______ for my friend for twenty minutes when she finally arrived.', ['waited', 'was waiting', 'had been waiting', 'have been waiting'], 2),
  mcq('By next Friday, we ______ our project.', ['complete', 'completed', 'will have completed', 'are completing'], 2),
  mcq('Rohan usually walks to school, but today he ______ the bus.', ['takes', 'took', 'is taking', 'had taken'], 2),
  mcq('Choose the sentence with correct tense consistency.', ['Yesterday, we visit the museum and learned about history.', 'Yesterday, we visited the museum and learn about history.', 'Yesterday, we visited the museum and learned about history.', 'Yesterday, we have visited the museum and learned about history.'], 2),
  mcq('Which word should be omitted or replaced? “She has been studying since three hours.”', ['has', 'been', 'since', 'studying'], 2, 1, { explain: '“For” + a period of time: for three hours.' }),
  mcq('Which word should be omitted? “They had already finished the work before the teacher arrived.”', ['had', 'already', 'before', 'No word should be omitted'], 3),
]

const modalsMcq = (): McqQuestion[] => [
  mcq('You ______ apologise for your mistake.', ['should', 'might', 'can'], 0),
  mcq('______ I use your mobile phone?', ['Must', 'May', 'Ought to'], 1),
  mcq('She ______ finish the work before leaving.', ['must', 'could', 'would'], 0),
  mcq('It ______ snow tonight.', ['may', 'should', 'ought to'], 0),
  mcq('______ you help me lift this box?', ['Could', 'Must', 'Shall'], 0),
  mcq('My father ______ run a marathon when he was younger.', ['can', 'could', 'shall'], 1, 1, { explain: 'Past ability → could.' }),
  mcq('You ______ eat too many chocolates.', ['shouldn’t', 'may', 'will'], 0),
  mcq('______ we go to the library after school?', ['Shall', 'Must', 'Could'], 0),
  mcq('I ______ probably attend the workshop tomorrow.', ['might', 'ought', 'shall'], 0),
]

const determinersMcq = (): McqQuestion[] => [
  mcq('She bought (a / an) umbrella.', ['a', 'an'], 1),
  mcq('(This / These) shoes are too small for me.', ['This', 'These'], 1),
  mcq('There are (much / many) birds in the garden.', ['much', 'many'], 1),
  mcq('I have (few / little) interest in video games.', ['few', 'little'], 1, 1, { explain: '“Interest” is uncountable → little.' }),
  mcq('(Every / All) student received a certificate.', ['Every', 'All'], 0),
  mcq('(Which / Whose) notebook is lying on the desk?', ['Which', 'Whose'], 1),
  mcq('There is (a little / a few) milk in the refrigerator.', ['a little', 'a few'], 0),
  mcq('(That / Those) mountain looks beautiful.', ['That', 'Those'], 0),
  mcq('We invited (some / any) friends for dinner.', ['some', 'any'], 0),
  mcq('(Neither / Many) of the answers is correct.', ['Neither', 'Many'], 0),
]

// ───────────────────────────────────────────── Literature keyword sets (from notes + sample answers)

const PEEL = { format: 'peel' as const, words: [100, 150] as [number, number] }

export const tests: MockTest[] = [
  // ════════════════════════════════════════ Paper 1
  {
    id: 'sa1-mock-1',
    title: 'SA1 Mock Paper 1',
    kind: 'paper',
    description: 'Full paper on the SA1 pattern — reading, grammar, writing and literature. 80 marks.',
    minutes: 180,
    sections: [
      {
        id: 'a1',
        title: 'Section A · Reading — Discursive passage',
        note: '10 marks',
        passage: RC3,
        questions: [
          mcq('The central issue discussed in the passage is:', ['The increasing cost of owning a car', 'The advantages and challenges of creating car-free zones', 'The importance of cycling in cities', 'The development of public transport'], 1),
          mcq('True or False: Car-free zones can encourage people to spend more time outdoors.', ['True', 'False'], 0),
          written('Mention any two benefits of car-free zones discussed in the passage.', 1, {
            words: [8, 40],
            need: 2,
            points: [
              kw('Cleaner air / less pollution', 'pollution', 'exhaust', 'fumes', 'cleaner', 'air'),
              kw('Less noise', 'noise'),
              kw('Safer for pedestrians / cyclists', 'pedestrian', 'safe', 'cyclist', 'walk'),
              kw('More time outdoors / community spaces', 'outdoor', 'market', 'community', 'events'),
              kw('Economic benefits / tourists', 'shop', 'economic', 'tourist', 'caf'),
            ],
          }),
          written('Complete the sentence: If public transport is unreliable or overcrowded, removing cars could ______.', 1, {
            words: [3, 25],
            points: [kw('create frustration', 'frustrat'), kw('rather than solve the problem', 'solve', 'problem')],
            need: 1,
            model: 'create frustration rather than solve the problem.',
          }),
          mcq('What does the word “frustration” mean in the context of the passage?', ['Satisfaction', 'Confusion caused by excitement', 'Annoyance caused by difficulties', 'Fear of travelling'], 2),
          written('Analyse why some shop owners may oppose the creation of car-free zones.', 1, {
            words: [10, 50],
            points: [kw('Customers may stop visiting', 'customer', 'stop visiting', 'fewer'), kw('Can’t drive close to the shop', 'drive', 'close', 'park')],
            need: 1,
          }),
          written('How could car-free zones affect roads surrounding the restricted area?', 1, {
            words: [8, 50],
            points: [kw('Traffic moves to nearby streets', 'nearby', 'surrounding', 'move', 'shift'), kw('Those roads become more crowded', 'crowd', 'congest', 'busier')],
            need: 1,
          }),
          written('Explain why the writer believes that car-free zones require “careful planning”.', 1, {
            words: [10, 60],
            need: 2,
            points: [
              kw('Traffic may shift elsewhere', 'nearby', 'surrounding', 'move'),
              kw('Need reliable public transport', 'public transport', 'transport'),
              kw('Walking paths / cycling facilities', 'walking', 'cycl', 'path'),
              kw('Parking outside the zone', 'parking'),
              kw('People who can’t walk far', 'elderly', 'disab', 'children'),
            ],
          }),
          written('Infer the writer’s viewpoint on car-free zones. Is the writer completely in favour of or against them? Support your answer with evidence.', 1, {
            words: [15, 70],
            points: [
              kw('Balanced — neither fully for nor against', 'balanced', 'neither', 'not completely', 'both', 'neutral'),
              kw('Evidence: success depends on planning / “neither a perfect solution nor a problem”', 'planning', 'perfect solution', 'depends', 'safe, healthy'),
            ],
          }),
          written('Evaluate the writer’s final suggestion that cities should focus on creating spaces that are “safe, healthy and accessible to everyone.” Is this better than simply banning cars? Give a reason.', 1, {
            words: [15, 70],
            points: [kw('Clear opinion', 'agree', 'better', 'i think', 'i believe', 'yes', 'no'), kw('Reason: includes everyone / avoids new problems', 'everyone', 'elderly', 'disab', 'access', 'problem', 'all people')],
          }),
        ],
      },
      {
        id: 'a2',
        title: 'Section A · Reading — Case-based passage',
        note: '10 marks',
        passage: RC4,
        questions: [
          mcq('Which activity was the most popular among the students surveyed?', ['Reading books', 'Playing sports', 'Using social media / watching videos', 'Pursuing hobbies'], 2),
          fill('What percentage of students preferred sports or exercise?', ['25', '25%', '25 percent', 'twenty five percent', 'twenty-five percent']),
          fill('Complete: Reading books and spending time with family or friends were equally popular, with ______ of students choosing each activity.', ['15', '15%', '15 percent', 'fifteen percent']),
          written('What does the data suggest about the role of digital entertainment in teenagers’ lives?', 1, {
            words: [8, 50],
            points: [kw('It is an important / major part of daily life', 'important', 'major', 'big part', 'daily', 'most popular'), kw('35% — the largest share', '35', 'largest', 'most')],
            need: 1,
          }),
          mcq('Which activity had the lowest percentage of participation?', ['Reading books', 'Hobbies', 'Sports', 'Family and friends'], 1),
          fill('Calculate the difference between the percentage of students using social media/watching videos and those pursuing hobbies.', ['25', '25%', '25 percent', 'twenty five percent', 'twenty-five percent']),
          written('Analyse the survey results and identify one positive feature of the students’ use of their free time.', 1, {
            words: [8, 50],
            points: [kw('Many still do physical activity / sports (25%)', 'sport', 'exercis', 'physical', '25'), kw('Or: reading / hobbies / family time', 'read', 'hobb', 'family', 'interest')],
            need: 1,
          }),
          written('Why does the passage clarify that students may not spend all their free time on only one activity?', 1, {
            words: [8, 50],
            points: [kw('Survey only shows the largest share', 'largest share', 'most time', 'largest', 'main'), kw('Avoids a wrong conclusion', 'not all', 'misunderstand', 'mislead', 'other activities')],
            need: 1,
          }),
          written('Based on the data, what concern about teenagers’ lifestyles does the survey raise?', 1, {
            words: [8, 50],
            points: [kw('Too much screen time / balance', 'screen', 'balance', 'digital'), kw('Effect on physical, social, creative development', 'physical', 'social', 'creative', 'development')],
            need: 1,
          }),
          written('If you were designing a weekly activity plan for these students, which two activities would you encourage them to spend more time on? Give a reason based on the data.', 1, {
            words: [15, 70],
            points: [kw('Names two activities', 'sport', 'read', 'hobb', 'family', 'exercis'), kw('Reason using data (e.g. only 10% / 15%)', '10', '15', 'only', 'less', 'low')],
          }),
        ],
      },
      {
        id: 'b1',
        title: 'Section B · Grammar — Do as directed',
        note: '10 marks',
        questions: [...tensesMcq().slice(0, 4), ...modalsMcq().slice(0, 3), ...determinersMcq().slice(0, 3)],
      },
      {
        id: 'b2',
        title: 'Section B · Creative writing',
        note: '20 marks — 5 each',
        questions: [
          written(
            'Letter to the editor: You are Kunal/Karuna of Ghaziabad. Write a letter in about 120 words to the Editor of ‘National Herald’, New Delhi, about the scarcity of water in your locality, suggesting ways to improve the position of water supply.',
            5,
            {
              format: 'letter',
              words: [100, 170],
              resourceId: 'formal-letter',
              points: [kw('States the problem: water scarcity', 'water', 'scarcity', 'shortage'), kw('Gives causes / effects', 'because', 'cause', 'suffer', 'residents', 'difficult'), kw('Suggests solutions', 'suggest', 'should', 'tanker', 'pipeline', 'harvest', 'authorit'), kw('Request / appeal to publish', 'publish', 'request', 'appeal', 'columns')],
            },
          ),
          written(
            'Article: You are Aarav Mehta, a student of Class VIII. Write an article in 120–150 words on “The Impact of Mobile Phones on Students.” Highlight both the advantages and disadvantages of mobile phone usage and suggest ways to use technology responsibly.',
            5,
            {
              format: 'article',
              words: [120, 170],
              resourceId: 'article-writing',
              points: [kw('Advantages', 'advantage', 'benefit', 'learn', 'information', 'connect', 'help'), kw('Disadvantages', 'disadvantage', 'addict', 'distract', 'health', 'eye', 'sleep'), kw('Responsible use / suggestions', 'responsib', 'limit', 'balance', 'should', 'screen time'), kw('Byline name', 'aarav')],
            },
          ),
          written('Narrative essay: “I knew something was wrong when I saw my name written on the abandoned suitcase.” Write a narrative essay of 150–180 words with a title of not more than 5 words.', 5, {
            format: 'narrative',
            words: [150, 200],
            resourceId: 'narrative-essay',
            points: [kw('Uses the prompt line', 'suitcase'), kw('Conflict / problem', 'suddenly', 'wrong', 'problem', 'worried', 'fear'), kw('Resolution', 'finally', 'eventually', 'relief', 'realised', 'realized', 'in the end')],
          }),
          written(
            'Diary entry: You are Kabir Roy. Today you performed on stage for the first time at your school’s annual talent showcase. Write a diary entry about your nervous excitement before going on stage, the shift in your emotions once the lights came up, and how you felt when the audience applauded.',
            5,
            {
              format: 'diary',
              words: [100, 160],
              resourceId: 'creative-writing',
              points: [kw('Nervousness before', 'nervous', 'butterflies', 'scared', 'anxious', 'trembl'), kw('Shift when the lights came up', 'lights', 'spotlight', 'confident', 'calm'), kw('Feelings at the applause', 'applau', 'clap', 'cheer', 'proud', 'happy', 'joy')],
            },
          ),
        ],
      },
      {
        id: 'c1',
        title: 'Section C · Literature — Extract (poetry)',
        note: '5 marks',
        extract:
          '“But presently up spoke little dog Mustard, I’d have been twice as brave if I hadn’t been flustered. And up spoke Ink and up spoke Blink, We’d have been three times as brave, we think.”',
        questions: [
          written('Name the poem and the poet.', 1, { words: [3, 20], points: [kw('The Tale of Custard the Dragon', 'custard'), kw('Ogden Nash', 'nash')], resourceId: 'the-tale-of-custard-the-dragon' }),
          written('What excuse does Mustard give for his behaviour?', 1, { words: [5, 40], points: [kw('He was flustered / nervous', 'fluster', 'nervous'), kw('Would have been twice as brave', 'twice', 'brave')], need: 1 }),
          written('What does this stanza reveal about Ink, Blink and Mustard?', 1.5, { words: [10, 50], points: [kw('They are boastful', 'boast', 'brag'), kw('They make excuses to hide their fear', 'excuse', 'fear', 'afraid', 'cowar')] }),
          written('How does the poet create humour in these lines?', 1.5, { words: [10, 50], points: [kw('Irony', 'iron'), kw('They boast only after Custard saved them', 'after', 'custard', 'already', 'saved'), kw('Exaggeration (“three times as brave”)', 'exaggerat', 'three times', 'twice')], need: 2 }),
        ],
      },
      {
        id: 'c2',
        title: 'Section C · Literature — Extract (prose)',
        note: '5 marks',
        extract:
          '"There are only five leaves on the vine now," said Johnsy. "The last leaf will fall soon and then I\'ll die. Didn\'t the doctor tell you about the leaves?"',
        questions: [
          written('Who is speaking these words and to whom?', 1, { words: [3, 25], points: [kw('Johnsy', 'johnsy'), kw('to Sue', 'sue')], resourceId: 'the-last-leaf' }),
          written('What is Johnsy counting?', 1, { words: [3, 25], points: [kw('The leaves on the ivy vine outside her window', 'leaves', 'leaf', 'vine', 'ivy')] }),
          written('Why does Johnsy believe she will die?', 1, { words: [5, 40], points: [kw('She links her life to the last leaf falling', 'last leaf', 'fall'), kw('She has pneumonia / has lost hope', 'pneumonia', 'hope', 'ill')], need: 1 }),
          written('What does this statement reveal about her state of mind? Which theme does it reflect?', 2, {
            words: [15, 60],
            points: [kw('Hopeless / despairing', 'hopeless', 'lost hope', 'despair', 'given up', 'negative'), kw('Theme: hope vs despair / power of belief', 'hope', 'belief', 'resilien', 'mind')],
          }),
        ],
      },
      {
        id: 'c3',
        title: 'Section C · Literature — Short answers',
        note: '10 marks — 40–50 words each',
        questions: [
          written('Why was Custard called a cowardly dragon? Was the description correct?', 2, {
            words: [40, 60],
            resourceId: 'the-tale-of-custard-the-dragon',
            points: [kw('He seemed nervous / wanted a safe cage', 'cage', 'nervous', 'safe', 'timid'), kw('Others mocked him', 'mock', 'teas', 'laugh'), kw('He alone fought the pirate', 'pirate', 'fought', 'fight'), kw('So the description was wrong — he was bravest', 'not', 'wrong', 'bravest', 'incorrect')],
            need: 3,
            model: 'Custard seemed nervous and always wanted a safe cage, so the others mocked him. But when the pirate came, the “brave” pets hid while Custard alone fought him — so the description was wrong; he was the bravest of all.',
          }),
          written('Describe the challenges the mother has faced in her life in “Mother to Son”.', 2, {
            words: [40, 60],
            resourceId: 'mother-to-son',
            points: [kw('Life not a crystal stair', 'crystal'), kw('Tacks, splinters, boards torn up', 'tack', 'splinter', 'boards'), kw('Dark places / no carpet', 'dark', 'carpet', 'bare'), kw('She keeps climbing', 'climb', 'give up', 'moving')],
            need: 3,
          }),
          written('Why was Suzie worried after coming out of the examination hall?', 2, {
            words: [40, 60],
            resourceId: 'day-anka-saw-her-friend',
            points: [kw('Forgot to turn the page', 'turn the page', 'page'), kw('Left questions unanswered', 'unanswered', 'questions', 'blank'), kw('Feared lower marks / disappointing parents', 'marks', 'parents', 'disappoint')],
            need: 2,
          }),
          written('Explain the challenges people faced in accessing books before the invention of the printing press.', 2, {
            words: [40, 60],
            resourceId: 'becoming-gutenberg',
            points: [kw('Books copied by hand by scribes', 'hand', 'scribe', 'copied'), kw('Slow / took months', 'slow', 'months', 'time'), kw('Expensive', 'expensive', 'costly'), kw('Only a few people had access', 'few', 'wealthy', 'rich', 'privileged', 'limited')],
            need: 3,
          }),
          written('Describe the bravery and sense of duty displayed by the soldiers of the Light Brigade.', 2, {
            words: [40, 60],
            resourceId: 'the-charge-of-the-light-brigade',
            points: [kw('Surrounded by cannons', 'cannon'), kw('Obeyed without question', 'obey', 'question', 'reason why', 'order'), kw('Charged forward / risked their lives', 'charg', 'risk', 'lives', 'died', 'death')],
            need: 2,
          }),
        ],
      },
      {
        id: 'c4',
        title: 'Section C · Literature — Long answers',
        note: '10 marks — 100–120 words each',
        questions: [
          written(
            'Evaluate how the idea of courage in The Tale of Custard the Dragon could be applied to a real-life situation in which a person must act despite fear. Compare this with the idea of courage in The Charge of the Light Brigade.',
            5,
            {
              ...PEEL,
              resourceId: 'long-answers',
              mention: ['custard', 'light brigade'],
              points: [
                kw('Custard acts despite fear when the pirate comes', 'pirate', 'despite', 'fear'),
                kw('Courage is action, not boasting', 'action', 'words', 'boast', 'deed'),
                kw('Real-life example (e.g. standing up to bullying)', 'real life', 'bully', 'student', 'today', 'example', 'situation'),
                kw('Light Brigade: duty / obeying orders despite danger', 'duty', 'order', 'obey', 'discipline'),
                kw('Comparison linking both texts', 'both', 'similarly', 'whereas', 'while', 'in contrast'),
              ],
              need: 4,
            },
          ),
          written('Analyse how Behrman’s actions in The Last Leaf transform him from a struggling artist into a heroic and selfless character. How does this contribute to the theme of sacrifice?', 5, {
            ...PEEL,
            resourceId: 'the-last-leaf',
            mention: ['last leaf', 'o. henry', 'o henry'],
            points: [
              kw('Struggling / failed artist, never painted his masterpiece', 'masterpiece', 'struggl', 'fail', 'artist'),
              kw('Paints the leaf during the storm', 'storm', 'paint'),
              kw('Gives Johnsy hope to live', 'hope', 'johnsy', 'recover'),
              kw('Catches pneumonia and dies', 'pneumonia', 'die', 'death', 'life'),
              kw('Sacrifice / selflessness is true greatness', 'sacrific', 'selfless', 'greatness', 'compassion'),
            ],
            need: 4,
          }),
        ],
      },
    ],
  },

  // ════════════════════════════════════════ Paper 2
  {
    id: 'sa1-mock-2',
    title: 'SA1 Mock Paper 2',
    kind: 'paper',
    description: 'A second full paper with different passages, texts and writing tasks. 80 marks.',
    minutes: 180,
    sections: [
      {
        id: 'a1',
        title: 'Section A · Reading — Discursive passage',
        note: '10 marks',
        passage: RC2,
        questions: [
          mcq('What is the central issue discussed in the passage?', ['The importance of extracurricular activities', 'Whether schools should begin later in the morning', 'The difficulties faced by working parents', 'The importance of school transport'], 1),
          written('Identify one reason why some people support a later school start.', 1, {
            words: [6, 40],
            points: [kw('Teenagers need enough sleep', 'sleep'), kw('Arrive alert / less morning stress', 'alert', 'stress', 'concentrat')],
            need: 1,
          }),
          written('Complete: Students who do not get enough sleep may find it difficult to ______.', 1, {
            words: [2, 25],
            points: [kw('concentrate / remember information / participate actively', 'concentrat', 'remember', 'participat')],
            model: 'concentrate, remember information or participate actively in class.',
          }),
          mcq('True or False: A later school start would have no effect on students’ after-school activities.', ['True', 'False'], 1),
          mcq('What does the word “alert” mean in the context of the passage?', ['Tired and sleepy', 'Active and attentive', 'Nervous and confused', 'Quiet and relaxed'], 1),
          written('Analyse two difficulties that families or schools might face if school timings were changed.', 1, {
            words: [12, 60],
            need: 2,
            points: [
              kw('Parents can’t arrange supervision', 'supervis', 'parent'),
              kw('Transport schedules must change', 'transport'),
              kw('After-school activities finish later / less time for them', 'after-school', 'activities', 'sport', 'club', 'coaching', 'later'),
            ],
          }),
          written('How does the writer present both advantages and disadvantages of an early school start?', 1, {
            words: [12, 60],
            points: [kw('Advantage: finish earlier, more afternoon time', 'earlier', 'afternoon', 'hobb', 'extracurricular'), kw('Disadvantage: less sleep / less alert', 'sleep', 'alert', 'stress'), kw('Balanced language (“on the other hand”)', 'other hand', 'however', 'both')],
            need: 2,
          }),
          written('Infer the writer’s viewpoint on the issue. Support your answer with evidence from the passage.', 1, {
            words: [15, 70],
            points: [kw('Balanced — not simply early or late', 'balanced', 'neither', 'not simply', 'both', 'middle'), kw('Evidence: consider students’ needs / local circumstances', 'local', 'needs', 'circumstances', 'best solution', 'well-being')],
          }),
          written('Evaluate the suggestion that schools should consider local circumstances before changing their timings. Why might this be more practical than the same timing for every school?', 1, {
            words: [15, 70],
            points: [kw('Every school’s needs differ', 'differ', 'different', 'each school', 'every school'), kw('Transport / distance / families vary', 'transport', 'distance', 'journey', 'famil')],
          }),
          written('The writer says the aim should be to balance effective learning with students’ well-being. Do you agree? Give one reason from the passage.', 1, {
            words: [15, 70],
            points: [kw('Clear opinion', 'agree', 'yes', 'no', 'i think', 'i believe'), kw('Reason from the passage (sleep, stress, time for activities)', 'sleep', 'stress', 'activit', 'health', 'learn')],
          }),
        ],
      },
      {
        id: 'a2',
        title: 'Section A · Reading — Case-based passage',
        note: '10 marks',
        passage: RC1,
        questions: [
          mcq('Which statement is best supported by the data?', ['Manuscripts received the highest preference.', 'Historical artefacts were the most popular collection.', 'Traditional tools and crafts were more popular than ancient coins.', 'Paintings and sculptures received fewer responses than manuscripts.'], 1),
          fill('Name the collection that was the second most preferred by the students.', ['paintings and sculptures', 'paintings & sculptures', 'paintings and sculpture']),
          fill('What percentage of students were interested in ancient coins?', ['20', '20%', '20 percent', 'twenty percent']),
          fill('Name the collection that received the fewest responses.', ['traditional tools and crafts', 'traditional tools & crafts', 'tools and crafts']),
          fill('How many students showed interest in manuscripts?', ['51', 'fifty one', 'fifty-one']),
          written('Arrange the museum collections in descending order of student preference.', 1, {
            words: [8, 40],
            points: [kw('Historical artefacts first', 'historical'), kw('Paintings and sculptures', 'painting'), kw('Ancient coins', 'coin'), kw('Manuscripts', 'manuscript'), kw('Traditional tools and crafts last', 'tools')],
            model: 'Historical artefacts → Paintings and sculptures → Ancient coins → Manuscripts → Traditional tools and crafts',
          }),
          written('What was the main purpose of conducting the survey?', 1, {
            words: [8, 40],
            points: [kw('To find which museum collection interested students most', 'which', 'interest', 'collection', 'most')],
          }),
          written('Why might students be interested in historical artefacts?', 1, {
            words: [8, 50],
            points: [kw('They help understand the past / earlier societies', 'past', 'history', 'earlier', 'societ'), kw('Lives, occupations, traditions', 'lives', 'occupation', 'tradition', 'culture')],
            need: 1,
          }),
          mcq('Which of the following statements is NOT supported by the data?', ['Historical artefacts were more popular than ancient coins.', 'Manuscripts received more responses than traditional tools and crafts.', 'Traditional tools and crafts were the second most preferred collection.', 'Paintings and sculptures attracted considerable student interest.'], 2),
          written('What can be inferred from the survey about the educational value of museums for school students?', 1, {
            words: [12, 60],
            points: [kw('Museums help students learn about history / culture', 'learn', 'history', 'culture', 'past'), kw('Students are curious / interested', 'curious', 'interest')],
            need: 1,
          }),
        ],
      },
      {
        id: 'b1',
        title: 'Section B · Grammar — Do as directed',
        note: '10 marks',
        questions: [...tensesMcq().slice(7, 11), ...modalsMcq().slice(3, 6), ...determinersMcq().slice(3, 6)],
      },
      {
        id: 'b2',
        title: 'Section B · Creative writing',
        note: '20 marks — 5 each',
        questions: [
          written('Letter to the editor: You are Rubal of Shakti Nagar, Delhi. Write a letter to the editor of Hindustan Times highlighting the importance of proper garbage disposal to create awareness among city residents.', 5, {
            format: 'letter',
            words: [100, 170],
            resourceId: 'formal-letter',
            points: [kw('The problem: garbage / waste', 'garbage', 'waste', 'litter', 'dump'), kw('Effects: disease, smell, pollution', 'disease', 'smell', 'pollut', 'health', 'mosquito'), kw('Suggestions', 'dustbin', 'segregat', 'should', 'suggest', 'recycl'), kw('Appeal to publish / create awareness', 'publish', 'aware', 'request', 'appeal')],
          }),
          written('Article: You are Riya Sharma, Head Girl of Green Valley Public School. Write an article in 120–150 words on “The Importance of Protecting Our Environment.” Discuss the need for conservation, the role of students, and ways young people can contribute.', 5, {
            format: 'article',
            words: [120, 170],
            resourceId: 'article-writing',
            points: [kw('Need for conservation', 'conserv', 'protect', 'environment', 'pollution'), kw('Role of students', 'student', 'young', 'youth'), kw('Ways to contribute', 'plant', 'tree', 'recycl', 'save', 'reduce', 'should'), kw('Byline name', 'riya')],
          }),
          written('Narrative essay: “I never expected that a small act of kindness would lead to such an unforgettable experience.” Write a narrative essay of 150–180 words with a title of not more than 5 words.', 5, {
            format: 'narrative',
            words: [150, 200],
            resourceId: 'narrative-essay',
            points: [kw('Act of kindness', 'kind', 'help'), kw('Conflict / turning point', 'suddenly', 'problem', 'surpris', 'worried'), kw('Resolution / realisation', 'finally', 'realised', 'realized', 'learnt', 'learned', 'in the end')],
          }),
          written('Diary entry: You are Ananya Deshmukh. You overheard your parents planning a surprise birthday celebration for you next weekend. Write a diary entry about pretending you know nothing, the warmth you feel at their effort, and how you plan to act surprised.', 5, {
            format: 'diary',
            words: [100, 160],
            resourceId: 'creative-writing',
            points: [kw('Overheard the plan', 'overheard', 'heard', 'surprise'), kw('Struggle to pretend', 'pretend', 'secret', 'act'), kw('Warmth / gratitude', 'warm', 'grateful', 'love', 'touched', 'happy'), kw('Plan to act surprised', 'surprised', 'plan', 'will')],
            need: 3,
          }),
        ],
      },
      {
        id: 'c1',
        title: 'Section C · Literature — Extract (poetry)',
        note: '5 marks',
        extract:
          '"So boy, don\'t you turn back. Don\'t you set down on the steps \'Cause you finds it\'s kinder hard. Don\'t you fall now— For I\'se still goin\', honey, I\'se still climbin\', And life for me ain\'t been no crystal stair."',
        questions: [
          written('What advice does the mother give her son in this extract?', 1, { words: [8, 40], resourceId: 'mother-to-son', points: [kw('Don’t turn back / give up', 'turn back', 'give up', 'stop', 'quit'), kw('Keep going even when it’s hard', 'keep', 'hard', 'going', 'climb')], need: 1 }),
          written('What does “I’se still climbin’” reveal about the mother’s character?', 1, { words: [8, 40], points: [kw('Determined / perseverant / resilient', 'determin', 'persever', 'resilien', 'strong', 'never give')] }),
          written('Why does the mother repeat that her life has not been “a crystal stair”?', 1.5, { words: [10, 50], points: [kw('To emphasise her hardship', 'emphasi', 'hard', 'difficult', 'struggle'), kw('Repetition / refrain frames the message', 'repeti', 'refrain', 'stress', 'message')] }),
          written('Vocabulary: What does the phrase “turn back” mean in the poem?', 1.5, { words: [3, 30], points: [kw('Give up / stop trying / retreat', 'give up', 'quit', 'stop', 'retreat', 'go back')] }),
        ],
      },
      {
        id: 'c2',
        title: 'Section C · Literature — Extract (poetry)',
        note: '5 marks',
        extract: '“What’s that? What’s that you say? You say today is. . .Saturday? G’bye, I’m going out to play!”',
        questions: [
          written('What suddenly changes Peggy’s mood?', 1, { words: [4, 30], resourceId: 'sick', points: [kw('Learning it is Saturday — no school', 'saturday', 'no school')] }),
          written('What does Peggy decide to do at the end of the poem?', 1, { words: [4, 30], points: [kw('Go out to play', 'play', 'go out')] }),
          written('What does this reveal about her illness?', 1.5, { words: [8, 40], points: [kw('She was pretending / never ill', 'pretend', 'fake', 'not sick', 'never', 'lying', 'excuse')] }),
          written('Which poetic device creates humour in this stanza?', 1.5, { words: [2, 40], points: [kw('Irony / situational irony', 'iron')] }),
        ],
      },
      {
        id: 'c3',
        title: 'Section C · Literature — Short answers',
        note: '10 marks — 40–50 words each',
        questions: [
          written('Why does Peggy invent so many illnesses in the poem “Sick”?', 2, {
            words: [40, 60],
            resourceId: 'sick',
            points: [kw('To avoid going to school', 'school', 'avoid'), kw('Exaggerated, unrealistic symptoms', 'exaggerat', 'dramatic', 'unrealistic'), kw('She recovers when she learns it’s Saturday', 'saturday', 'recover', 'pretend')],
            need: 2,
          }),
          written('Describe the contrast between Anka’s and Suzie’s reactions to the exam.', 2, {
            words: [40, 60],
            resourceId: 'day-anka-saw-her-friend',
            points: [kw('Suzie anxious — left a page unanswered', 'anxious', 'worried', 'upset', 'page'), kw('Anka cheerful though she didn’t appear', 'happy', 'cheerful', 'calm', 'didn'), kw('Different perspectives', 'perspective', 'differ', 'mindset')],
            need: 2,
          }),
          written('How did Johannes Gutenberg’s printing press change the way books were produced and shared?', 2, {
            words: [40, 60],
            resourceId: 'becoming-gutenberg',
            points: [kw('Movable metal type', 'movable', 'type'), kw('Faster, cheaper, in large numbers', 'fast', 'cheap', 'large number', 'quick', 'mass'), kw('Knowledge reached more people', 'knowledge', 'more people', 'everyone', 'ordinary', 'literacy')],
            need: 2,
          }),
          written('What is the significance of the lines “Theirs not to reason why, / Theirs but to do and die”?', 2, {
            words: [40, 60],
            resourceId: 'the-charge-of-the-light-brigade',
            points: [kw('Soldiers must obey, not question', 'obey', 'question', 'order'), kw('Discipline / duty / loyalty', 'disciplin', 'duty', 'loyal'), kw('Even though the order was a mistake / dangerous', 'mistake', 'blunder', 'danger', 'die')],
            need: 2,
          }),
          written('In Terri and the Turkey, what can you infer about Terri from her actions?', 2, {
            words: [40, 60],
            resourceId: 'terri-and-the-turkey',
            points: [kw('Performs CPR on Tom', 'cpr'), kw('Compassionate / caring', 'compassion', 'caring', 'kind', 'empath'), kw('Values Tom’s life rather than seeing him as food', 'life', 'food', 'meal', 'alive')],
            need: 2,
          }),
        ],
      },
      {
        id: 'c4',
        title: 'Section C · Literature — Long answers',
        note: '10 marks — 100–120 words each',
        questions: [
          written('Analyse how the idea of perseverance in Mother to Son could help a person facing a modern challenge such as repeated failure. Connect your response with the struggles faced by a character in The Last Leaf.', 5, {
            ...PEEL,
            resourceId: 'long-answers',
            mention: ['mother to son', 'langston hughes', 'hughes'],
            points: [
              kw('Staircase / crystal stair imagery of hardship', 'crystal', 'stair', 'tack', 'splinter'),
              kw('She keeps climbing — perseverance', 'climb', 'persever', 'give up'),
              kw('Applied to a modern challenge', 'fail', 'today', 'modern', 'exam', 'setback', 'real life'),
              kw('Johnsy loses hope / Behrman’s leaf restores it', 'johnsy', 'behrman', 'leaf', 'hope'),
              kw('Link both texts', 'both', 'similarly', 'like', 'whereas'),
            ],
            need: 4,
          }),
          written('Examine how Peggy Ann’s changing attitude towards school in Sick develops the humour and message of the poem. What does her reversal reveal about her character?', 5, {
            ...PEEL,
            resourceId: 'sick',
            mention: ['sick', 'silverstein'],
            points: [
              kw('Exaggerated list of illnesses', 'exaggerat', 'illness', 'measles', 'mumps', 'hyperbole'),
              kw('Reversal when she learns it is Saturday', 'saturday', 'revers', 'sudden'),
              kw('Irony creates the humour', 'iron', 'humour', 'humor', 'funny'),
              kw('Character: imaginative, dramatic, not honest', 'imaginat', 'dramatic', 'honest', 'pretend', 'impulsive'),
              kw('Message: actions reveal the truth', 'action', 'truth', 'honesty'),
            ],
            need: 4,
          }),
        ],
      },
    ],
  },

  // ════════════════════════════════════════ Worksheets (quick, auto-marked)
  {
    id: 'ws-literature',
    title: 'Literature MCQs',
    kind: 'worksheet',
    description: 'Quick-fire questions on every SA1 text — authors, characters, devices, themes and key lines. Fully auto-marked.',
    minutes: 15,
    sections: [
      {
        id: 's1',
        title: 'Step 21 — Custard, Sick, The Last Leaf',
        questions: [
          mcq('Who wrote “The Tale of Custard the Dragon”?', ['Shel Silverstein', 'Ogden Nash', 'O. Henry', 'Langston Hughes'], 1),
          mcq('What is the rhyme scheme of most stanzas in “The Tale of Custard the Dragon”?', ['abab', 'aabb', 'abcb', 'free verse'], 1),
          mcq('Why do the pets call Custard “Percival”?', ['It was his real name', 'To mock him as a coward, after a knight who ran away', 'Because he was brave like a knight', 'It rhymes with “dragon”'], 1),
          mcq('“Brave as a barrel full of bears” is an example of…', ['Simile and alliteration', 'Metaphor only', 'Onomatopoeia', 'Personification'], 0),
          mcq('What is the main irony of the poem?', ['Custard eats the pirate', 'The “brave” pets hide while “cowardly” Custard fights', 'Belinda is a dragon', 'The pirate wins'], 1),
          mcq('Why does Peggy Ann McKay suddenly feel well in “Sick”?', ['Her mother gives her medicine', 'She realises it is Saturday', 'The doctor visits', 'School is cancelled for rain'], 1),
          mcq('“My temperature is one-o-eight” is an example of…', ['Simile', 'Hyperbole', 'Alliteration', 'Metaphor'], 1),
          mcq('What illness does Johnsy have in “The Last Leaf”?', ['Measles', 'Pneumonia', 'Flu', 'Mumps'], 1),
          mcq('Who paints the last leaf?', ['Sue', 'Johnsy', 'Behrman', 'The doctor'], 2),
          mcq('What happens to Behrman at the end?', ['He becomes famous', 'He catches pneumonia and dies', 'He moves away', 'He paints another masterpiece'], 1),
          mcq('The last leaf mainly symbolises…', ['Winter', 'Hope and the will to live', 'Art as a career', 'Friendship between Sue and Johnsy'], 1),
        ],
      },
      {
        id: 's2',
        title: 'Step 22 — Mother to Son, The Day Anka Saw Her Friend',
        questions: [
          mcq('Who wrote “Mother to Son”?', ['Langston Hughes', 'Alfred, Lord Tennyson', 'Ogden Nash', 'Alex Broun'], 0),
          mcq('What does the “crystal stair” represent?', ['A beautiful house', 'A smooth, easy, privileged life', 'Heaven', 'The son’s future job'], 1),
          mcq('“Mother to Son” is written in…', ['Rhyming couplets', 'Free verse', 'A ballad form', 'Sonnet form'], 1),
          mcq('The whole poem is built on which device?', ['An extended metaphor of life as a staircase', 'Onomatopoeia', 'A simile comparing life to a river', 'Alliteration'], 0),
          mcq('Why is Suzie upset after the exam?', ['She missed the exam', 'She forgot to turn the page and left questions unanswered', 'She lost her pen', 'Anka copied her answers'], 1),
          mcq('What does Anka leave Suzie at the end?', ['Her notes', 'A note with lines from “Hope is the thing with feathers”', 'A painting', 'A letter to her parents'], 1),
          mcq('“You see colours far better than you see people” suggests Suzie…', ['Is colour-blind', 'Has artistic talent but misreads others', 'Dislikes art', 'Is unkind'], 1),
        ],
      },
      {
        id: 's3',
        title: 'Step 23 — Gutenberg, The Charge of the Light Brigade',
        questions: [
          mcq('Before the printing press, books were…', ['Printed by machines', 'Copied by hand by scribes', 'Only oral stories', 'Typed on typewriters'], 1),
          mcq('Gutenberg’s key invention was…', ['Paper', 'Movable metal type for printing', 'Ink', 'The library'], 1),
          mcq('The Charge of the Light Brigade is set during…', ['World War I', 'The Crimean War — Battle of Balaclava', 'The Battle of Waterloo', 'The Trojan War'], 1),
          mcq('How many soldiers rode into the valley?', ['Three hundred', 'Six hundred', 'One thousand', 'Sixty'], 1),
          mcq('“Theirs not to reason why, / Theirs but to do and die” shows…', ['The soldiers’ unquestioning obedience and duty', 'That the soldiers ran away', 'That the order was correct', 'The poet’s anger at the soldiers'], 0),
          mcq('“Jaws of Death” is an example of…', ['Simile', 'Personification', 'Onomatopoeia', 'Hyperbole'], 1),
          mcq('What does “blundered” mean in the poem?', ['Won', 'Made a serious mistake', 'Charged', 'Retreated'], 1),
        ],
      },
      {
        id: 's4',
        title: 'Step 24 — Terri and the Turkey, Australia is a Tree…',
        questions: [
          mcq('What is the climax of “Terri and the Turkey”?', ['The family sits down to eat', 'Terri performs CPR on Tom the turkey', 'Grandpa buys the turkey', 'Tom runs away'], 1),
          mcq('What is the central conflict of “Terri and the Turkey”?', ['Terri vs her brother', 'Tradition vs compassion', 'City vs countryside', 'Winning vs losing a race'], 1),
          mcq('Where is “Australia is a Tree Growing in a Garden in Chennai” set?', ['A beach in Chennai', 'A ferry in Mumbai Harbour', 'A garden in Melbourne', 'An airport'], 1),
          mcq('How does Lawrence describe his trip?', ['A business trip', 'An “internal journey”', 'A honeymoon', 'A family holiday'], 1),
          mcq('Where would Ed rather be?', ['Melbourne', 'The Gold Coast', 'Chennai', 'Rocky'], 1),
          mcq('“Appearances can be deceptive” suggests…', ['India is dangerous', 'People and situations may hide more than we see', 'Ed is lying', 'Lawrence dislikes India'], 1),
        ],
      },
    ],
  },
  {
    id: 'ws-tenses',
    title: 'Tenses',
    kind: 'worksheet',
    description: 'Editing, omission and tense-choice questions from Tenses Worksheets 1 & 2. Fully auto-marked.',
    minutes: 12,
    sections: [{ id: 's', title: 'Choose the correct option', questions: tensesMcq() }],
  },
  {
    id: 'ws-modals',
    title: 'Modals',
    kind: 'worksheet',
    description: 'Choose the modal, then correct the errors — from Modals Worksheets 1 & 2 and their answer keys.',
    minutes: 12,
    sections: [
      { id: 's1', title: 'Choose the correct modal', questions: modalsMcq() },
      {
        id: 's2',
        title: 'Correct the errors — rewrite the sentence',
        questions: [
          fill('She can sings beautifully.', ['She can sing beautifully.']),
          fill('You must to complete your homework.', ['You must complete your homework.']),
          fill('He should studies regularly.', ['He should study regularly.']),
          fill('May you help me with this bag?', ['Can you help me with this bag?', 'Could you help me with this bag?']),
          fill('We can playing football after school.', ['We can play football after school.']),
          fill('They might goes to Delhi next week.', ['They might go to Delhi next week.']),
          fill('You must not to waste water.', ['You must not waste water.']),
          fill('She would likes some coffee.', ['She would like some coffee.']),
        ],
      },
    ],
  },
  {
    id: 'ws-determiners',
    title: 'Determiners',
    kind: 'worksheet',
    description: 'Choose the determiner, then fix the errors — from Determiners Worksheet 2 and its answer key.',
    minutes: 12,
    sections: [
      { id: 's1', title: 'Choose the correct determiner', questions: determinersMcq() },
      {
        id: 's2',
        title: 'Correct the errors — rewrite the sentence',
        questions: [
          fill('She bought a orange.', ['She bought an orange.']),
          fill('This books belong to my brother.', ['These books belong to my brother.']),
          fill('Much students participated in the competition.', ['Many students participated in the competition.']),
          fill('Every players performed well.', ['Every player performed well.']),
          fill('There is few sugar left.', ['There is little sugar left.']),
          fill('I don’t have some money.', ['I don’t have any money.', 'I do not have any money.']),
          fill('These boy is my cousin.', ['This boy is my cousin.']),
          fill('He has little friends.', ['He has few friends.']),
          fill('An university is nearby.', ['A university is nearby.']),
          fill('Neither students completed the assignment.', ['Neither student completed the assignment.']),
        ],
      },
    ],
  },
  {
    id: 'ws-adverbs',
    title: 'Adverbs',
    kind: 'worksheet',
    description: 'Identify the adverb type and choose the best-fitting adverb — from the Adverbs worksheet.',
    minutes: 8,
    sections: [
      {
        id: 's1',
        title: 'What type of adverb is underlined?',
        questions: [
          mcq('The students completed the activity carefully. — “carefully”', ['Manner', 'Time', 'Place', 'Frequency', 'Degree'], 0),
          mcq('We are leaving for the museum tomorrow. — “tomorrow”', ['Manner', 'Time', 'Place', 'Frequency', 'Degree'], 1),
          mcq('The children are playing outside. — “outside”', ['Manner', 'Time', 'Place', 'Frequency', 'Degree'], 2),
          mcq('Rohan usually reaches school before the bell. — “usually”', ['Manner', 'Time', 'Place', 'Frequency', 'Degree'], 3),
          mcq('The movie was extremely interesting. — “extremely”', ['Manner', 'Time', 'Place', 'Frequency', 'Degree'], 4),
        ],
      },
      {
        id: 's2',
        title: 'Choose the adverb that best fits',
        questions: [
          mcq('The athlete ran ______ to reach the finish line before the others.', ['yesterday', 'quickly', 'outside', 'rarely'], 1),
          mcq('My grandparents ______ visit us during the holidays.', ['often', 'there', 'carefully', 'tomorrow'], 0),
          mcq('The teacher explained the difficult concept ______.', ['clearly', 'tomorrow', 'outside', 'never'], 0),
          mcq('The box was ______ heavy for the child to lift.', ['extremely', 'upstairs', 'soon', 'weekly'], 0),
          mcq('We searched ______ for the missing notebook.', ['everywhere', 'recently', 'usually', 'deeply'], 0),
        ],
      },
    ],
  },
]

export const getTest = (testId: string) => tests.find((t) => t.id === testId)

export const testMarks = (t: MockTest) => t.sections.reduce((a, s) => a + s.questions.reduce((b, q) => b + q.marks, 0), 0)
export const testQuestions = (t: MockTest) => t.sections.flatMap((s) => s.questions)
