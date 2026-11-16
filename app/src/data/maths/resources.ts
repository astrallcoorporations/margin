import type { Resource, Step } from '@/types'

/**
 * Maths — Class 8. Steps are the Google Classroom topics (Step 24, Step 26, Learning check).
 * Every file is one the teacher posted; paths map to the ../maths folder (served at /files/maths/…).
 * Key points restate what those worksheets and formula charts teach.
 */

const S = 'maths'
const f = (path: string, role?: Resource['files'][number]['role'], label?: string) => ({ path: `maths/${path}`, role, label })

export const steps: Step[] = [
  { id: 'step-21', label: 'Step 21', note: 'rational numbers and exponents', order: 21 },
  { id: 'step-22', label: 'Step 22', note: 'polygons and quadrilaterals', order: 22 },
  { id: 'step-23', label: 'Step 23', note: 'equations and proportion', order: 23 },
  { id: 'step-24', label: 'Step 24', note: 'squares and cubes', order: 24 },
  { id: 'step-26', label: 'Step 26', note: 'percentages, profit and loss, discount', order: 26 },
  { id: 'maths-revision', label: 'Revision', note: 'learning check', order: 27 },
]

export const resources: Resource[] = [
  // ─────────────────────────────── Step 24
  {
    id: 'm-squares-cubes',
    title: 'Squares and Cubes',
    code: 'SQC',
    type: 'concept',
    stepId: 'step-24',
    subjectId: S,
    description: 'Perfect squares and cubes, square and cube roots by prime factorisation and long division, and the pattern of odd numbers.',
    files: [f('step 24/Squares and Cubes - Practice sheet.pdf', 'worksheet', 'Practice worksheet')],
    tags: ['squares', 'cubes', 'roots', 'prime factorisation'],
    related: ['m-learning-check'],
    keyPoints: [
      { label: 'Perfect square', text: 'A number that is n × n for a whole number n. Its prime factors can be paired up exactly: 3600 = 2⁴ × 3² × 5² is a perfect square.' },
      { label: 'Perfect cube', text: 'A number that is n × n × n. Its prime factors group in threes: 21952 = 2⁶ × 7³, so its cube root is 2² × 7 = 28.' },
      { label: 'Making a perfect square', text: 'Prime factorise, find the factor that is left unpaired, and multiply by it. 720 = 2⁴ × 3² × 5, so multiply by 5 to get 3600 = 60².' },
      { label: 'Numbers between squares', text: 'There are 2n natural numbers between n² and (n + 1)². Between 12² and 13² there are 24.' },
      { label: 'Odd numbers', text: 'n² is the sum of the first n odd numbers: 81 = 1 + 3 + 5 + … + 17 (nine numbers). A number is a perfect square if repeated subtraction of 1, 3, 5, … reaches exactly 0.' },
      { label: 'Units digits', text: 'A cube ends in the digit that comes from the last digit cubed: 3³ = 27 ends in 7, so 23³ ends in 7.' },
    ],
  },

  // ─────────────────────────────── Step 26
  {
    id: 'm-ratio-percentage',
    title: 'Ratio to Percentage',
    code: 'RTP',
    type: 'concept',
    stepId: 'step-26',
    subjectId: S,
    description: 'Turn a part-to-part ratio into percentages of the whole, and write scores and parts of a group as percentages.',
    files: [f('step 26/Ratio to percentage worksheet.pdf', 'worksheet', 'Ratio to percentage worksheet')],
    tags: ['ratio', 'percentage'],
    related: ['m-percentage-of-quantity', 'm-percentage-change'],
    keyPoints: [
      { label: 'Add to get the whole', text: 'For a ratio like 3 : 7, the whole is 3 + 7 = 10 parts. Red marbles are 3 out of 10 parts.' },
      { label: 'Fraction to percent', text: 'Write part ÷ whole, then multiply by 100. 3 ÷ 10 × 100 = 30%.' },
      { label: 'Part-to-whole already', text: 'If the ratio is already part : whole (3 : 5), do not add: 3 ÷ 5 × 100 = 60%.' },
      { label: 'Three parts', text: '5 : 3 : 2 has 10 parts in all, so the shares are 50%, 30% and 20%, which always add up to 100%.' },
      { label: 'Rounding', text: 'When it does not come out even, round only at the end: 1 : 6 gives 1 ÷ 7 × 100 = 14.3% to one decimal place.' },
    ],
  },
  {
    id: 'm-percentage-of-quantity',
    title: 'Percentages of a Quantity',
    code: 'PCT',
    type: 'concept',
    stepId: 'step-26',
    subjectId: S,
    description: 'Find a percentage of a number, find what percent one number is of another, and work back to the whole from a given percentage.',
    files: [
      f('step 26/Problem Pool.pdf', 'worksheet', 'Problem Pool'),
      f('step 26/WIKA - Step 26.pdf', 'questions', 'WIKA — Step 26'),
    ],
    tags: ['percentage', 'reverse percentage', 'simple interest'],
    related: ['m-ratio-percentage', 'm-profit-loss'],
    keyPoints: [
      { label: 'Percent of a number', text: 'x% of N = x ÷ 100 × N. 58% of 600 = 348, so 252 guests did not have tea.' },
      { label: 'What percent', text: 'What percent of 400 is 64? 64 ÷ 400 × 100 = 16%.' },
      { label: 'Finding the whole', text: 'If 30% of x is 450, then 1% is 15, so x = 1500. Divide by the percent, multiply by 100.' },
      { label: 'Left over', text: 'Spent 20%, left ₹12,000: the 12,000 is the remaining 80%, so the whole is 12,000 ÷ 80 × 100 = ₹15,000.' },
      { label: 'Decimal to percent', text: 'Multiply by 100: 0.08 = 8%.' },
      { label: 'Simple interest', text: 'Interest = Principal × Rate × Time ÷ 100. ₹6,000 at 15% for 1 year gives ₹900.' },
    ],
  },
  {
    id: 'm-percentage-change',
    title: 'Percentage Change',
    code: 'CHG',
    type: 'concept',
    stepId: 'step-26',
    subjectId: S,
    description: 'Percentage increase and decrease, change in area, and why a rise followed by an equal fall does not return to the start.',
    files: [f('step 26/Percentage change worksheet.pdf', 'worksheet', 'Percentage change worksheet')],
    tags: ['percentage change', 'area'],
    related: ['m-discount-gst', 'm-profit-loss'],
    keyPoints: [
      { label: 'The formula', text: 'Percentage change = (new − old) ÷ old × 100. Always divide by the old value, not the new one.' },
      { label: 'Increase or decrease', text: 'A positive answer is an increase, a negative one is a decrease. State which one in words.' },
      { label: 'Area', text: 'Work out the old and new areas first, then use the formula. 10 × 6 = 60 becomes 12 × 4 = 48, a 20% decrease.' },
      { label: 'Up then down', text: '+20% then −20% is 1.2 × 0.8 = 0.96 of the original, a net 4% decrease. The second percent is taken of a bigger number.' },
      { label: 'Successive changes', text: 'Multiply the factors: +25% then −25% is 1.25 × 0.75 = 0.9375, a net fall of 6.25%.' },
    ],
  },
  {
    id: 'm-profit-loss',
    title: 'Profit and Loss',
    code: 'PNL',
    type: 'concept',
    stepId: 'step-26',
    subjectId: S,
    description: 'Cost price, selling price, profit and loss percent, and the common traps: overhead expenses, two-item sales and markup.',
    files: [
      f('step 26/Profit and loss - Formula chart.pdf', 'reference', 'Formula chart'),
      f('step 26/Profit and loss - Find the solution.pdf', 'questions', 'Find the solution (with mark scheme)'),
    ],
    tags: ['profit', 'loss', 'cost price', 'selling price'],
    related: ['m-discount-gst', 'm-percentage-change'],
    keyPoints: [
      { label: 'Profit and loss', text: 'Profit = SP − CP when SP > CP. Loss = CP − SP when CP > SP. If SP = CP there is neither.' },
      { label: 'Always on cost price', text: 'Profit % = Profit ÷ CP × 100 and Loss % = Loss ÷ CP × 100. The percent is always of the cost price.' },
      { label: 'Overheads', text: 'Repairs, transport and similar costs are added to the purchase price: CP = purchase price + overhead expenses.' },
      { label: 'Finding SP', text: 'SP = CP × (100 + Profit %) ÷ 100 for a profit, and CP × (100 − Loss %) ÷ 100 for a loss.' },
      { label: 'Finding CP', text: 'CP = SP × 100 ÷ (100 + Profit %) for a profit, and SP × 100 ÷ (100 − Loss %) for a loss.' },
      { label: 'Two items', text: 'Work out each SP separately, then compare the total SP with the total CP. A loss on one and a profit on the other need not cancel.' },
      { label: 'Comparing businesses', text: 'A bigger profit amount is not a better result. Compare the percentages: ₹900 on ₹9,000 is 10%, but ₹600 on ₹3,000 is 20%.' },
    ],
  },
  {
    id: 'm-discount-gst',
    title: 'Discount, Marked Price and GST',
    code: 'DSC',
    type: 'concept',
    stepId: 'step-26',
    subjectId: S,
    description: 'Discount on the marked price, successive discounts, tax added to the bill, and estimating a bill after a discount.',
    files: [
      f('step 26/Discount worksheet.pdf', 'worksheet', 'Discount worksheet'),
      f('step 26/Approximate Bill.pdf', 'worksheet', 'Approximate Bill activity'),
    ],
    tags: ['discount', 'marked price', 'GST', 'successive discount'],
    related: ['m-profit-loss', 'm-percentage-change'],
    keyPoints: [
      { label: 'Discount is on the marked price', text: 'Discount = MP × discount %. Selling price = MP − discount. ₹2,500 at 18% off: discount ₹450, price ₹2,050.' },
      { label: 'Finding MP', text: 'If ₹1,260 is paid after 30% off, it is 70% of the MP, so MP = 1,260 ÷ 70 × 100 = ₹1,800.' },
      { label: 'Successive discounts', text: 'Multiply the factors; do not add the percents. 20% then 10% is 0.8 × 0.9 = 0.72, so the single equivalent discount is 28%, not 30%.' },
      { label: 'Tax comes last', text: 'GST or sales tax is charged on the price after the discount: bill = discounted price × (1 + tax %). ₹450 with 5% tax is ₹472.50.' },
      { label: 'Markup then discount', text: 'Marked 25% above cost and then 12% off gives 1.25 × 0.88 = 1.10 of cost, a 10% profit. The 12% and the 25% are of different bases.' },
      { label: 'Estimating a bill', text: 'For 18% off, round the bill and take about a fifth away, then adjust: it is quicker than the exact calculation and close enough to check an answer.' },
    ],
  },

  // ─────────────────────────────── Revision
  {
    id: 'm-learning-check',
    title: 'Step 26 Learning Check',
    code: 'CHK',
    type: 'revision',
    stepId: 'maths-revision',
    subjectId: S,
    description: 'Ten mixed questions from warm-up to higher-order thinking across ratio, percentage, discount and profit and loss.',
    files: [f('revision/Step 26 Learning check.pdf', 'questions', 'Learning check')],
    tags: ['revision', 'mixed'],
    related: ['m-ratio-percentage', 'm-percentage-of-quantity', 'm-profit-loss', 'm-discount-gst', 'm-percentage-change'],
    keyPoints: [
      { label: 'Three levels', text: 'Level 1 is foundation, Level 2 is application and Level 3 is HOTS: questions that ask you to test a claim with numbers.' },
      { label: 'Test the claim', text: 'When a student says something “cancels out”, calculate it. A 25% rise then a 25% fall leaves ₹3,000 from ₹3,200, not ₹3,200.' },
      { label: 'Say why', text: 'Reasoning marks need the mistake named: successive discounts of 20% and 15% are not 35% because the second is taken of a smaller price.' },
    ],
  },
]
