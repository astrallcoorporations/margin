import type { MockTest } from '@/types/tests'
import { builders } from './helpers'

const { mcq, fill, kw, written } = builders('mmock')

/** A mixed SA-style paper across Steps 21 to 26. Every question uses numbers from the teacher's sheets and every answer was checked. */
export const tests: MockTest[] = [
  {
    id: 'm-sa-mock-paper',
    title: 'Maths Mixed Mock Paper (Steps 21 to 26)',
    kind: 'paper',
    description: 'One question or two from each step: rational numbers, exponents, quadrilaterals, equations, proportion, roots, percentages and profit and loss.',
    minutes: 50,
    sections: [
      {
        id: 's1',
        title: 'Section A: multiple choice (1 mark each)',
        questions: [
          mcq('The multiplicative inverse of −15/17 is:', ['15/17', '17/15', '−17/15', '−15/17'], 2),
          mcq('4⁻² × 4⁵ equals:', ['4⁻¹⁰', '4³', '4⁷', '16'], 1),
          mcq('Each exterior angle of a regular polygon is 40°. It has how many sides?', ['6', '8', '9', '10'], 2),
          mcq('If 3(t − 3) = 5(2t + 1), then t =', ['−2', '2', '−3', '3'], 0),
          mcq('Which of the following is NOT a perfect cube?', ['343', '512', '600', '729'], 2),
          mcq('Profit percent is always calculated on:', ['Selling price', 'Cost price', 'Marked price', 'Discount'], 1),
          mcq('The units digit of the cube of 23 is:', ['3', '7', '9', '1'], 1),
          mcq('A quadrilateral has four equal sides and diagonals meeting at 90°, but no right angles. It is a:', ['Square', 'Rhombus', 'Rectangle', 'Kite'], 1),
        ],
      },
      {
        id: 's2',
        title: 'Section B: short answers (2 marks each)',
        note: 'Numbers only. Fractions as a/b.',
        questions: [
          fill('(−5/17) × (51/−60) = ?', ['1/4', '0.25'], 2),
          fill('What should be added to −16/3 to make 1/9?', ['49/9'], 2),
          fill('Find x: 7x − 9 = 3x + 19.', ['7'], 2),
          fill('Find the number of sides of a regular polygon with each exterior angle 24°.', ['15'], 2),
          fill('The cost of 12 pens is ₹180. Find the cost (₹) of 25 pens.', ['375'], 2),
          fill('28 workers finish a task in 18 days. How many workers are needed to finish in 12 days?', ['42'], 2),
          fill('Find √66049.', ['257'], 2),
          fill('Find the smallest number by which 720 must be multiplied to make it a perfect square.', ['5'], 2),
          fill('Find the cube root of 21952.', ['28'], 2),
          fill('What percent of 400 is 64?', ['16'], 2),
          fill('If 30% of x is 450, find x.', ['1500'], 2),
          fill('A bag has marked price ₹2,500 and a discount of 18%. Find the selling price (₹).', ['2050'], 2),
          fill('Rajat bought a scooter for ₹10,000, spent ₹5,000 on repairs and sold it at 10% profit. Find the selling price (₹).', ['16500'], 2),
          fill('The sum of two numbers is 64 and one is 18 more than the other. Find the larger number.', ['41'], 2),
        ],
      },
      {
        id: 's3',
        title: 'Section C: reasoning (3 marks each)',
        note: 'Write 2–4 sentences with numbers.',
        questions: [
          written('Two discounts of 20% and 20% are given on shoes of marked price ₹5,000. Arjun says this is the same as a 40% discount. Is he correct? Find the selling price and explain.', 3, {
            need: 2,
            points: [
              kw('The second discount is on the already reduced price', 'reduced price', 'discounted price', 'smaller price', 'after the first', 'second discount is'),
              kw('The selling price is ₹3,200 (total discount 36%)', '3200', '3,200', '36', '0.64', '0.8'),
              kw('So Arjun is not correct', 'not correct', 'incorrect', 'wrong', 'no,'),
            ],
            model: 'Arjun is wrong. The second 20% is taken off the already reduced price. 5000 × 0.8 × 0.8 = ₹3,200, which is a 36% discount in total, not 40%.',
          }),
          written('Show that subtraction of rational numbers is not commutative by using a = 1/2 and b = 1/3.', 3, {
            need: 2,
            points: [
              kw('a − b = 1/2 − 1/3 = 1/6', '1/6'),
              kw('b − a = 1/3 − 1/2 = −1/6', '-1/6', '−1/6'),
              kw('The two answers are different, so it is not commutative', 'not equal', 'different', 'not the same', 'not commutative'),
            ],
            model: 'a − b = 1/2 − 1/3 = 1/6, but b − a = 1/3 − 1/2 = −1/6. The answers are different, so subtraction is not commutative.',
          }),
          written('Explain, using angles, why no regular polygon has each interior angle 45°.', 3, {
            need: 2,
            points: [
              kw('Interior and exterior angles add up to 180°, so the exterior angle would be 135°', '135', '180'),
              kw('The number of sides is 360 ÷ 135, which is not a whole number', '360', 'whole number', 'not an integer', 'not a whole', '2.67', '2.7'),
              kw('So such a polygon cannot exist', 'cannot', 'impossible', 'not possible', "can't"),
            ],
            model: 'If the interior angle were 45°, each exterior angle would be 180° − 45° = 135°. The number of sides would be 360 ÷ 135, which is not a whole number, so no regular polygon has interior angles of 45°.',
          }),
        ],
      },
    ],
  },
]
