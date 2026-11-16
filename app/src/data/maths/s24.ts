import type { MockTest } from '@/types/tests'
import { builders, deck, f, R, T } from './helpers'

/** Step 24 extras: square roots, cube roots, Pythagorean triplets. Numbers from More Roots, Cube Root Drill and Finding Squares. */

export const resources = [
  R('m-square-roots', 'Square Roots', 'SQR', 'concept', 'step-24', 'Square roots by prime factorisation and long division, decimals, and the least number to add or subtract.',
    [f('step 24/More Roots.pdf', 'worksheet', 'More Roots'), f('step 24/Practice Sheet - Square and square root.pdf', 'worksheet', 'Practice sheet: square and square root')],
    [
      ['Long division', 'Pair the digits from the right, find the largest square for the first pair, subtract, bring down the next pair, double the root so far, and repeat. √784 = 28 and √16384 = 128.'],
      ['Decimals', 'Pair the digits left and right of the decimal point. √12.96 = 3.6, √1.96 = 1.4, √6.4009 = 2.53, √9.8596 = 3.14.'],
      ['Least number to subtract', 'Take the root as far as the remainder allows: 2509 − 9 = 2500 = 50² (remainder 9).'],
      ['Least number to add', 'Find the next square: 6203 + 38 = 6241 = 79². Add (next root)² minus the number.'],
      ['Extremes', 'The greatest five-digit square is 316² = 99856. The least six-digit square is 317² = 100489.'],
      ['Estimate', 'Between which two squares does it lie? Check the last digit: a square ends in 0, 1, 4, 5, 6 or 9, never in 2, 3, 7 or 8.'],
    ], ['square root', 'long division'], ['m-cube-roots', 'm-squares-cubes']),
  R('m-cube-roots', 'Cube Roots', 'CUB', 'concept', 'step-24', 'Cube roots by prime factorisation, estimating without factors, and cube-shaped objects.',
    [f('step 24/Cube Root Drill.pdf', 'worksheet', 'Cube Root Drill'), f('step 24/Practice Sheet - Cube and Cube root.pdf', 'worksheet', 'Practice sheet: cube and cube root')],
    [
      ['Prime factorisation', 'Group the factors in threes and take one from each group. 512 = 2⁹ so ∛512 = 2³ = 8. 10648 = 2³ × 11³ so ∛10648 = 22.'],
      ['Estimating', 'Split the digits into groups of three from the right. The last digit of the cube gives the last digit of the root (…5 → 5, …7 → 3, …3 → 7, …2 → 8, …8 → 2). The first group tells you the tens digit.'],
      ['Worked estimate', '857375: the first group 857 lies between 9³ = 729 and 10³ = 1000, so the tens digit is 9; the number ends in 5, so the root ends in 5. ∛857375 = 95.'],
      ['More roots', '12167 = 23³, 24389 = 29³, 148877 = 53³, 19683 = 27³, 1331 = 11³, 1157625 = 105³.'],
      ['Cube-shaped box', 'A cubical box of volume 117649 cm³ has side ∛117649 = 49 cm.'],
    ], ['cube root', 'estimation'], ['m-square-roots', 'm-squares-cubes']),
  R('m-pythagorean-triplets', 'Finding Squares and Pythagorean Triplets', 'PTR', 'concept', 'step-24', 'Squares without long multiplication, odd-number patterns, and generating Pythagorean triplets.',
    [f('step 24/Finding Squares.pdf', 'worksheet', 'Finding Squares')],
    [
      ['Square without multiplying', 'Use (a + b)² = a² + 2ab + b² or the pattern n² = (n − 1)² + (2n − 1). 21² = 441, 28² = 784, 35² = 1225, 41² = 1681, 56² = 3136, 145² = 21025.'],
      ['Numbers ending in 5', '(10a + 5)² = a(a + 1) hundreds + 25. So 35² = 3 × 4 = 12 then 25 → 1225, and 145² = 14 × 15 = 210 then 25 → 21025.'],
      ['Pythagorean triplet', 'For m > 1: (2m, m² − 1, m² + 1) is a triplet. It satisfies a² + b² = c².'],
      ['One member is 18', '2m = 18 gives m = 9: (18, 80, 82). Smallest member 24: m = 12, so (24, 143, 145). Largest member 65: m² + 1 = 65, m = 8, so (16, 63, 65).'],
      ['Check', 'Always check by squaring: 18² + 80² = 324 + 6400 = 6724 = 82².'],
    ], ['squares', 'triplets'], ['m-square-roots']),
  R('m-power-play', 'Computational Thinking: Power Play', 'CTH', 'concept', 'step-24', 'Computational thinking tasks on squares, cubes and number patterns.',
    [f('computational thinking/CT - Square and a cube.pdf', 'worksheet', 'CT: square and a cube'), f('computational thinking/CT- Power Play & Number Play.pdf', 'worksheet', 'CT: Power Play and Number Play')],
    [
      ['Break it down', 'Split a problem into smaller steps, look for a pattern, and write the rule.'],
      ['Square and cube together', 'A number that is both a perfect square and a perfect cube is a perfect sixth power: 64 = 8² = 4³, and 729 = 27² = 9³.'],
      ['Check by trying', 'Test your rule on two or three small cases before trusting it.'],
    ], ['patterns', 'computational thinking'], ['m-squares-cubes']),
]

export const tasks = [
  T('m24-long-division', 'm-square-roots', 'Long division method', 'Find the square root of each by the division method: (a) 784  (b) 16384  (c) 66049  (d) 3136.', 'numerical', 'medium', undefined, ['long division']),
  T('m24-decimals', 'm-square-roots', 'Square roots of decimals', 'Find the square root: (a) 12.96  (b) 6.4009  (c) 1.96  (d) 9.8596.', 'numerical', 'medium', 'Pair the digits on both sides of the decimal point.', ['decimals']),
  T('m24-subtract', 'm-square-roots', 'Least number to subtract', 'Find the least number to subtract from 2509 to obtain a perfect square, and from 7581. State each perfect square and its square root.', 'numerical', 'medium', undefined, ['perfect square']),
  T('m24-add', 'm-square-roots', 'Least number to add', 'What least number must be added to 6203 to make the sum a perfect square? Do the same for 5607. State each perfect square and its square root.', 'numerical', 'medium', undefined, ['perfect square']),
  T('m24-extremes', 'm-square-roots', 'Greatest and least', 'Find the greatest five-digit number that is a perfect square, and the least six-digit perfect square. Give their square roots.', 'numerical', 'hard', 'Start from 99999 and 100000 and use the long division method.', ['extremes']),
  T('m24-garden', 'm-square-roots', 'The square garden', 'The area of a square garden is 11025 m². Find the length of each side by the long division method. Find √3364 the same way.', 'numerical', 'medium', undefined, ['long division', 'area']),
  T('m24-cube-factor', 'm-cube-roots', 'Cube roots by factorisation', 'Find the cube root of each by prime factorisation: (a) 512  (b) 1331  (c) 19683  (d) 10648  (e) 1157625.', 'numerical', 'medium', 'Group the prime factors in threes.', ['prime factorisation']),
  T('m24-estimate', 'm-cube-roots', 'Estimate cube roots', 'Without finding prime factors, estimate the cube roots of 857375, 12167, 24389 and 148877. Explain how you found the last digit and the tens digit of one of them.', 'long', 'hard', 'Use the units digit and the first group of three digits.', ['estimation']),
  T('m24-cubical-box', 'm-cube-roots', 'The cubical box', 'The volume of a cubical box is 117649 cm³. Find the length of its side. A cube-shaped tank has volume 9261 cm³; find its edge and the new volume if the edge is tripled.', 'numerical', 'medium', undefined, ['volume']),
  T('m24-squares', 'm-pythagorean-triplets', 'Squares without multiplying', 'Find the squares of 21, 28, 41, 35, 56 and 145 without long multiplication. Say which method you used for each.', 'numerical', 'medium', undefined, ['squares']),
  T('m24-triplets', 'm-pythagorean-triplets', 'Pythagorean triplets', 'Find the Pythagorean triplet (a) with one member 18; (b) with smallest member 24; (c) with largest member 65; (d) with middle member 80. Check each by squaring.', 'numerical', 'hard', 'Use (2m, m² − 1, m² + 1).', ['triplets']),
  T('m24-ct', 'm-power-play', 'A number that is a square and a cube', 'Find two numbers greater than 1 that are both perfect squares and perfect cubes. Explain the pattern you notice using prime factors.', 'short', 'hard', 'Test your rule on at least three cases.', ['patterns']),
]

export const flashcards = [
  ...deck('m-square-roots', [
    ['How does the long division method for square roots start?', 'Pair the digits from the right, then find the largest square not greater than the first pair.'],
    ['√784 = ?', '28.'],
    ['√16384 = ?', '128.'],
    ['√66049 = ?', '257.'],
    ['√3136 = ?', '56.'],
    ['√12.96 = ?', '3.6.'],
    ['√6.4009 = ?', '2.53.'],
    ['√1.96 = ? and √9.8596 = ?', '1.4 and 3.14.'],
    ['Least number to subtract from 2509 to get a perfect square?', '9 (gives 2500 = 50²).'],
    ['Least number to subtract from 7581?', '12 (gives 7569 = 87²).'],
    ['Least number to add to 6203?', '38 (gives 6241 = 79²).'],
    ['Least number to add to 5607?', '18 (gives 5625 = 75²).'],
    ['Greatest five-digit perfect square?', '99856 = 316².'],
    ['Least six-digit perfect square?', '100489 = 317².'],
    ['Which digits can a perfect square NOT end in?', '2, 3, 7 and 8.'],
    ['√3364 and √11025?', '58 and 105.'],
  ]),
  ...deck('m-cube-roots', [
    ['How do you find a cube root by prime factorisation?', 'Group the prime factors in threes and take one from each group.'],
    ['∛512 and ∛1331?', '8 and 11.'],
    ['∛19683 and ∛10648?', '27 and 22.'],
    ['∛1157625 = ?', '105.'],
    ['How do you estimate a cube root quickly?', 'Group the digits in threes from the right; the last digit gives the root’s last digit, the first group gives its tens digit.'],
    ['Cube ending in 5: the root ends in?', '5.'],
    ['Cube ending in 7: the root ends in?', '3 (and a cube ending in 3 has a root ending in 7).'],
    ['∛857375 = ?', '95.'],
    ['∛12167, ∛24389, ∛148877?', '23, 29, 53.'],
    ['A cubical box has volume 117649 cm³. Its side?', '49 cm.'],
    ['Cube tank of volume 9261 cm³: edge, and volume if the edge is tripled?', '21 cm; 63³ = 250047 cm³.'],
  ]),
  ...deck('m-pythagorean-triplets', [
    ['The Pythagorean triplet formula?', '(2m, m² − 1, m² + 1) for m > 1.'],
    ['Triplet with one member 18?', 'm = 9: (18, 80, 82).'],
    ['Triplet with smallest member 24?', 'm = 12: (24, 143, 145).'],
    ['Triplet with largest member 65?', 'm = 8: (16, 63, 65).'],
    ['21², 28², 41²?', '441, 784, 1681.'],
    ['35², 56², 145²?', '1225, 3136, 21025.'],
    ['Quick way to square a number ending in 5?', 'a5² = a(a + 1) followed by 25. 35² → 3 × 4 = 12, then 25 → 1225.'],
    ['Sum of the first n odd numbers?', 'n².'],
  ]),
  ...deck('m-power-play', [
    ['A number that is both a perfect square and a perfect cube?', 'A perfect sixth power: 64 and 729.'],
    ['Why test a rule on a few cases?', 'To catch mistakes and find where the rule stops working.'],
  ]),
]

const { mcq, fill } = builders('m24')

export const tests: MockTest[] = [
  {
    id: 'm-roots-worksheet',
    title: 'Square Roots, Cube Roots and Triplets Worksheet',
    kind: 'worksheet',
    description: 'Roots by division and factorisation, least number problems, and Pythagorean triplets. Numbers from More Roots, Cube Root Drill and Finding Squares.',
    minutes: 30,
    sections: [
      {
        id: 's1',
        title: 'Square roots',
        note: 'Numbers only.',
        questions: [
          fill('√784 = ?', ['28']),
          fill('√16384 = ?', ['128']),
          fill('√66049 = ?', ['257']),
          fill('√3136 = ?', ['56']),
          fill('√12.96 = ?', ['3.6']),
          fill('√6.4009 = ?', ['2.53'], 2),
          fill('√9.8596 = ?', ['3.14'], 2),
          fill('Least number to subtract from 2509 to get a perfect square?', ['9'], 2),
          fill('Least number to subtract from 7581 to get a perfect square?', ['12'], 2),
          fill('Least number to add to 6203 to get a perfect square?', ['38'], 2),
          fill('Least number to add to 5607 to get a perfect square?', ['18'], 2),
          fill('The greatest five-digit perfect square is the square of which number?', ['316'], 2),
          fill('The least six-digit perfect square is the square of which number?', ['317'], 2),
        ],
      },
      {
        id: 's2',
        title: 'Cube roots',
        questions: [
          fill('∛512 = ?', ['8']),
          fill('∛1331 = ?', ['11']),
          fill('∛19683 = ?', ['27']),
          fill('∛10648 = ?', ['22']),
          fill('∛1157625 = ?', ['105'], 2),
          fill('Estimate: ∛857375 = ?', ['95'], 2),
          fill('Estimate: ∛12167 = ?', ['23'], 2),
          fill('Estimate: ∛24389 = ?', ['29'], 2),
          fill('Estimate: ∛148877 = ?', ['53'], 2),
          fill('The volume of a cubical box is 117649 cm³. Find the length of its side in cm.', ['49'], 2),
          mcq('A cube ends in the digit 7. Its cube root ends in the digit:', ['3', '7', '9', '1'], 0),
        ],
      },
      {
        id: 's3',
        title: 'Squares and triplets',
        questions: [
          fill('21² = ?', ['441']),
          fill('35² = ?', ['1225']),
          fill('145² = ?', ['21025'], 2),
          mcq('The Pythagorean triplet with one member 18 is:', ['(18, 80, 82)', '(18, 80, 84)', '(18, 40, 42)', '(18, 24, 32)'], 0, 2, { explain: '2m = 18 gives m = 9, so (18, 9² − 1, 9² + 1) = (18, 80, 82).' }),
          mcq('The Pythagorean triplet whose largest member is 65 and uses (2m, m² − 1, m² + 1) is:', ['(16, 63, 65)', '(30, 56, 65)', '(16, 60, 65)', '(20, 48, 65)'], 0, 2),
          mcq('The Pythagorean triplet with smallest member 24 (formula method) is:', ['(24, 143, 145)', '(24, 70, 72)', '(24, 45, 52)', '(24, 32, 41)'], 0, 2),
        ],
      },
    ],
  },
]
