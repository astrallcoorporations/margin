import type { Flashcard } from '@/types'

/**
 * Flashcards from the formula chart, the worksheets and their mark schemes.
 * Grouped by resource; ids are stable so progress survives edits to wording.
 */

type Card = [front: string, back: string]

const deck = (resourceId: string, cards: Card[]): Flashcard[] => cards.map(([front, back], i) => ({ id: `${resourceId}:${i + 1}`, resourceId, front, back }))

export const flashcards: Flashcard[] = [
  ...deck('m-ratio-percentage', [
    ['How do you turn a ratio like 3 : 7 into percentages?', 'Add the parts to get the whole (3 + 7 = 10). Each part ÷ whole × 100: 30% and 70%.'],
    ['When do you NOT add the ratio parts?', 'When the ratio is already part : whole, such as 3 : 5 meaning 3 out of 5. Then 3 ÷ 5 × 100 = 60%.'],
    ['Write the ratio 5 : 3 : 2 as three percentages.', '50%, 30% and 20% (the whole is 10 parts).'],
    ['18 out of 24 as a ratio and a percentage?', 'Simplest ratio 3 : 4, and 18 ÷ 24 × 100 = 75%.'],
    ['A class of 40 has boys : girls = 3 : 5. How many of each?', '8 parts in all, 1 part = 5. Boys 15, girls 25 (62.5% girls).'],
  ]),
  ...deck('m-percentage-of-quantity', [
    ['x% of N equals what?', 'x ÷ 100 × N.'],
    ['What percent of 400 is 64?', '64 ÷ 400 × 100 = 16%.'],
    ['If 30% of x is 450, find x.', '1% = 15, so x = 15 × 100 = 1500.'],
    ['Spent 20% of salary and ₹12,000 is left. Salary?', '₹12,000 is 80%, so salary = 12,000 ÷ 80 × 100 = ₹15,000.'],
    ['Convert 0.08 to a percentage.', 'Multiply by 100: 8%.'],
    ['Simple interest formula?', 'SI = P × R × T ÷ 100. ₹6,000 at 15% for 1 year = ₹900.'],
    ['58% of 600 guests had tea. How many did not?', '58% of 600 = 348, so 600 − 348 = 252 did not.'],
    ['Ratio of 9 kg to 1800 g?', 'Same units first: 9000 g : 1800 g = 5 : 1.'],
  ]),
  ...deck('m-percentage-change', [
    ['Percentage change formula?', '(new − old) ÷ old × 100. Always divide by the old value.'],
    ['What does a negative percentage change mean?', 'A decrease. Say “decrease” in your answer.'],
    ['A rise of 20% then a fall of 20%: net change?', '1.2 × 0.8 = 0.96, so a 4% decrease overall.'],
    ['A rise of 25% then a fall of 25%: net change?', '1.25 × 0.75 = 0.9375, so a 6.25% decrease.'],
    ['Savings fell from ₹4,000 to ₹3,200. Percentage decrease?', '800 ÷ 4000 × 100 = 20%.'],
    ['How do you find percentage change in area?', 'Find old area and new area first, then use (new − old) ÷ old × 100. 60 cm² to 48 cm² is a 20% decrease.'],
  ]),
  ...deck('m-profit-loss', [
    ['Profit and loss in terms of CP and SP?', 'Profit = SP − CP (when SP > CP). Loss = CP − SP (when CP > SP).'],
    ['Profit % formula?', 'Profit ÷ CP × 100. It is always on the cost price.'],
    ['Loss % formula?', 'Loss ÷ CP × 100, on the cost price.'],
    ['SP when there is a profit?', 'SP = CP × (100 + Profit %) ÷ 100.'],
    ['SP when there is a loss?', 'SP = CP × (100 − Loss %) ÷ 100.'],
    ['CP when you know SP and profit %?', 'CP = SP × 100 ÷ (100 + Profit %).'],
    ['CP when you know SP and loss %?', 'CP = SP × 100 ÷ (100 − Loss %).'],
    ['What are overhead expenses?', 'Extra costs such as repairs or transport. CP = purchase price + overheads.'],
    ['Bought for ₹10,000, spent ₹5,000 on repair, sold at 10% profit. SP?', 'CP = ₹15,000, so SP = 15,000 × 1.10 = ₹16,500.'],
    ['CP of 11 articles = SP of 10 articles. Gain %?', '10%. (Each article costs 10, sells for 11.)'],
    ['Two items bought at ₹1,200; one sold at 5% loss, one at 10% profit. Overall?', 'SPs are ₹1,140 and ₹1,320. Total SP 2,460 against CP 2,400, so a profit of ₹60.'],
    ['Why is a bigger profit not always a better business?', 'Compare percentages on the money invested. ₹900 on ₹9,000 is 10%, but ₹600 on ₹3,000 is 20%.'],
  ]),
  ...deck('m-discount-gst', [
    ['Discount is calculated on which price?', 'The marked price (MP). Selling price = MP − discount.'],
    ['Paid ₹1,260 after a 30% discount. Marked price?', '₹1,260 is 70% of MP, so MP = 1,260 ÷ 70 × 100 = ₹1,800.'],
    ['Two successive discounts of 20% and 10%: single equivalent?', '0.8 × 0.9 = 0.72, so 28% (not 30%).'],
    ['Why are 20% and 20% successive discounts not 40%?', 'The second 20% is taken off the already reduced price. 0.8 × 0.8 = 0.64, so the total is 36%.'],
    ['Is tax added before or after the discount?', 'After. Bill = discounted price × (1 + tax %).'],
    ['Cost ₹450 with 5% sales tax: the bill?', '450 × 1.05 = ₹472.50.'],
    ['Marked 25% above cost, then 12% off. Gain %?', '1.25 × 0.88 = 1.10, so a 10% gain (not 13%).'],
  ]),
  ...deck('m-squares-cubes', [
    ['How do you find the smallest multiplier that makes a number a perfect square?', 'Prime factorise, spot the unpaired factor, multiply by it. 720 = 2⁴ × 3² × 5, so × 5 gives 3600.'],
    ['How do you take a cube root by prime factorisation?', 'Group the prime factors in threes and take one from each group. 21952 = 2⁶ × 7³, so the root is 2² × 7 = 28.'],
    ['How many natural numbers lie between n² and (n+1)²?', '2n. Between 12² and 13² there are 24.'],
    ['Sum of the first n odd numbers?', 'n². So 1 + 3 + 5 + … + 17 (nine numbers) = 81.'],
    ['Last digit of 23³?', '3³ = 27 ends in 7, so 23³ ends in 7.'],
    ['Is 1350 a perfect cube?', 'No. 1350 = 2 × 3³ × 5², and the 2 and the 5² are not in groups of three.'],
    ['√3364 and √11025?', '58 and 105.'],
  ]),
  ...deck('m-learning-check', [
    ['A shopper says a 25% hike then a 25% discount cancels out. True?', 'No. ₹3,200 → ₹4,000 → ₹3,000, a net 6.25% decrease.'],
    ['Store A: 20% then 15% off. Store B: flat 33% off on ₹10,000. Which is cheaper?', 'A = 10,000 × 0.8 × 0.85 = ₹6,800. B = ₹6,700. B is cheaper by ₹100. 20% and 15% together are 32%, not 35%.'],
    ['Chairs marked 50% up, then 20% off. Gain %?', '1.5 × 0.8 = 1.2, a 20% gain.'],
  ]),
]
