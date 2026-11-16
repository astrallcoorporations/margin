import type { KeywordPoint, McqQuestion, MockTest, TestQuestion, WrittenQuestion } from '@/types/tests'

/**
 * Maths worksheets and a mock paper. Every question uses the numbers from the teacher's worksheets;
 * the answers were worked out by hand and match the Profit and Loss mark scheme where one exists.
 */

let n = 0
const id = (p: string) => `${p}-${++n}`

const mcq = (prompt: string, options: string[], answer: number, marks = 1, extra: Partial<McqQuestion> = {}): McqQuestion => ({ id: id('mq'), kind: 'mcq', prompt, options, answer, marks, ...extra })
const fill = (prompt: string, accept: string[], marks = 1): TestQuestion => ({ id: id('mq'), kind: 'fill', prompt, accept, marks })
const kw = (label: string, ...any: string[]): KeywordPoint => ({ label, any })
const written = (prompt: string, marks: number, rest: Omit<WrittenQuestion, 'id' | 'kind' | 'prompt' | 'marks'>): WrittenQuestion => ({ id: id('mq'), kind: 'written', prompt, marks, ...rest })

export const tests: MockTest[] = [
  {
    id: 'm-percentages-worksheet',
    title: 'Ratio and Percentages Worksheet',
    kind: 'worksheet',
    description: 'Ratio to percentage, percentage of a quantity, and percentage change. Numbers are from the Step 26 worksheets.',
    minutes: 20,
    sections: [
      {
        id: 's1',
        title: 'Ratio to percentage',
        note: 'Type numbers only, for example 30.',
        questions: [
          fill('The ratio of red marbles to blue marbles is 3 : 7. What percentage of the marbles are red?', ['30']),
          mcq('Apples to oranges in a basket are in the ratio 1 : 4. What percentage of the fruit are oranges?', ['20%', '25%', '75%', '80%'], 3, 1, { explain: '1 + 4 = 5 parts, so oranges are 4 ÷ 5 × 100 = 80%.' }),
          fill('Write the ratio 7 : 20 (part : whole) as a percentage.', ['35']),
          fill('A pencil case has pencils and pens in the ratio 5 : 3. What percentage of the items are pens?', ['37.5']),
          fill('A class of 40 students has boys : girls = 3 : 5. How many girls are there?', ['25']),
        ],
      },
      {
        id: 's2',
        title: 'Percentages of a quantity',
        questions: [
          fill('If 30% of x is 450, find x.', ['1500']),
          fill('What percent of 400 is 64?', ['16']),
          fill('58% of 600 guests asked for tea. How many guests did not have tea?', ['252']),
          fill('After spending 20% of his salary, Mr Roy has ₹12,000 left. Find his salary in rupees.', ['15000']),
          mcq('Convert 0.08 into a percentage.', ['0.8%', '8%', '80%', '0.08%'], 1),
        ],
      },
      {
        id: 's3',
        title: 'Percentage change',
        questions: [
          mcq('A price rises by 20% and then falls by 20%. The net change is:', ['No change', '4% decrease', '4% increase', '0.4% decrease'], 1, 1, { explain: '1.2 × 0.8 = 0.96, which is a 4% decrease.' }),
          fill('Savings fell from ₹4,000 to ₹3,200. Find the percentage decrease.', ['20']),
          fill('A rectangle 10 cm by 6 cm becomes 12 cm by 4 cm. Find the percentage decrease in its area.', ['20']),
        ],
      },
    ],
  },
  {
    id: 'm-profit-discount-paper',
    title: 'Profit, Loss and Discount Mock Paper',
    kind: 'paper',
    description: 'Multiple choice, short numerical answers and two reasoning questions. Numbers are from the Step 26 sheets and the learning check.',
    minutes: 40,
    sections: [
      {
        id: 's1',
        title: 'Section A: multiple choice',
        questions: [
          mcq('Profit percent is always calculated on the:', ['Selling price', 'Cost price', 'Marked price', 'Discount'], 1),
          mcq('Discount percent is calculated on the:', ['Cost price', 'Selling price', 'Marked price', 'Profit'], 2),
          mcq('The cost price of 11 articles equals the selling price of 10 articles. The gain percent is:', ['9%', '10%', '11%', '100%'], 1, 1, { explain: 'Let each article cost ₹10; it sells for ₹11, so the gain is 1 ÷ 10 = 10%.' }),
          mcq('Two successive discounts of 20% and 10% equal a single discount of:', ['30%', '28%', '32%', '25%'], 1, 1, { explain: '0.8 × 0.9 = 0.72, so the discount is 28%.' }),
          mcq('Goods are marked 25% above cost and sold at a 12% discount. The result is a:', ['13% profit', '10% profit', '12% profit', '10% loss'], 1, 1, { explain: '1.25 × 0.88 = 1.10 of the cost price.' }),
        ],
      },
      {
        id: 's2',
        title: 'Section B: short answers',
        note: 'Numbers only, no units. Write 472.5 for ₹472.50.',
        questions: [
          fill('Rajat bought a scooter for ₹10,000, spent ₹5,000 on repairs and sold it at a profit of 10%. Find the selling price in rupees.', ['16500'], 2),
          fill('A pair of glasses costs ₹450 and 5% sales tax is charged. Find the bill amount in rupees.', ['472.5', '472.50'], 2),
          fill('A school bag has a marked price of ₹2,500 and a discount of 18%. Find its selling price in rupees.', ['2050'], 2),
          fill('Riya paid ₹1,260 for a jacket after a 30% discount. Find its marked price in rupees.', ['1800'], 2),
          fill('Neha bought two dresses at ₹1,200 each, sold one at a 5% loss and the other at a 10% profit. Find her total profit in rupees.', ['60'], 2),
          fill('A shopkeeper bought 200 bulbs at ₹10 each. 5 were defective and thrown away; the rest sold at ₹12 each. Find the gain percent.', ['17'], 2),
        ],
      },
      {
        id: 's3',
        title: 'Section C: reasoning',
        note: 'Write 2–4 sentences. Use numbers in your answer.',
        questions: [
          written('Rohan says, “Two discounts of 20% and 15% are equal to a 35% discount, so Store A is cheaper than Store B, which gives a flat 33%.” The marked price is ₹10,000. Is Rohan correct? Explain his mistake.', 3, {
            need: 2,
            points: [
              kw('The second discount is taken off the already reduced price', 'reduced price', 'discounted price', 'smaller price', 'lower price', 'after the first', 'new price', 'second discount is'),
              kw('Successive discounts multiply, so the total is 32%, not 35%', '32', 'multipl', '0.8', '0.85', '6800'),
              kw('Store B (₹6,700) is cheaper by ₹100', '6700', '6,700', 'store b is cheaper', 'b is cheaper', '100'),
            ],
            model: 'Rohan is wrong. The second 15% is taken off the price after the first discount, so the discounts multiply: 0.8 × 0.85 = 0.68, a 32% total, not 35%. Store A sells at ₹6,800, while Store B’s flat 33% gives ₹6,700, so Store B is cheaper by ₹100.',
          }),
          written('A student says: “Business X earned ₹900 profit and Business Y earned only ₹600, so X is the more successful business.” X invested ₹9,000 and Y invested ₹3,000. Is the student justified?', 3, {
            need: 2,
            points: [
              kw('Profit percent compares profit with the money invested', 'percent', '%', 'return', 'compared to', 'invest'),
              kw('X made 10% and Y made 20%', '10%', '20%', '10 percent', '20 percent', '10 %', '20 %'),
              kw('So Y did better even though its profit amount is smaller', 'y did better', 'y is better', 'business y', 'y was better', 'y is more', 'y earned a higher', 'higher percent'),
            ],
            model: 'Not justified. A bigger profit amount does not mean a better business. X made 900 ÷ 9000 × 100 = 10%, but Y made 600 ÷ 3000 × 100 = 20%. Y earned the better return on its investment.',
          }),
        ],
      },
    ],
  },
  {
    id: 'm-squares-cubes-worksheet',
    title: 'Squares and Cubes Worksheet',
    kind: 'worksheet',
    description: 'The Step 24 practice worksheet: perfect squares and cubes, roots and prime factorisation.',
    minutes: 25,
    sections: [
      {
        id: 's1',
        title: 'Multiple choice',
        questions: [
          mcq('Which of the following is a perfect square?', ['196', '150', '275', '325'], 0, 1, { explain: '196 = 14 × 14.' }),
          mcq('The units digit of the cube of 23 is:', ['3', '7', '9', '1'], 1, 1, { explain: '3³ = 27, which ends in 7.' }),
          mcq('How many natural numbers lie between 12² and 13²?', ['22', '23', '24', '25'], 2, 1, { explain: 'There are 2 × 12 = 24 numbers between n² and (n + 1)².' }),
          mcq('Which of the following is NOT a perfect cube?', ['343', '512', '600', '729'], 2, 1, { explain: '343 = 7³, 512 = 8³, 729 = 9³, but 600 is not a cube.' }),
        ],
      },
      {
        id: 's2',
        title: 'Short answers',
        note: 'Numbers only.',
        questions: [
          fill('Find the square root of 3364.', ['58'], 2),
          fill('Find the smallest number by which 720 must be multiplied to make it a perfect square.', ['5'], 2),
          fill('What is the resulting perfect square when 720 is multiplied by that number?', ['3600'], 1),
          fill('Find the cube root of 21952.', ['28'], 3),
        ],
      },
      {
        id: 's3',
        title: 'Longer questions',
        questions: [
          fill('The area of a square garden is 11025 m². Find the length of each side in metres.', ['105'], 3),
          fill('A cube-shaped tank has a volume of 9261 cm³. Find the length of each edge in cm.', ['21'], 2),
          fill('If the edge of that tank is tripled, find the new volume in cm³.', ['250047'], 3),
          fill('81 is the sum of the first how many odd numbers?', ['9', 'nine'], 2),
          mcq('Can 60 be written as the sum of consecutive odd numbers starting from 1?', ['Yes', 'No, because 60 is not a perfect square', 'Yes, using 30 odd numbers', 'No, because 60 is even'], 1, 2, { explain: 'The sum of the first n odd numbers is n², so only perfect squares work. 60 is not a perfect square.' }),
        ],
      },
    ],
  },
]
