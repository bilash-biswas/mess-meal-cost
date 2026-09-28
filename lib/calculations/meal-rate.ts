/**
 * Pure, deterministic meal rate and meal cost calculation functions.
 * Independent of React and Firebase.
 *
 * Financial Rounding Policy:
 * - Currency values are rounded to 2 decimal places (paisa precision) using
 *   `roundCurrency(val) = Math.round((val + Number.EPSILON) * 100) / 100`.
 * - Meal count values are rounded to 2 decimal places to cleanly support
 *   fractional meal weights such as Breakfast = 0.5.
 */

export interface MealCountLike {
  breakfast: number;
  lunch: number;
  dinner: number;
}

/**
 * Rounds a number to 2 decimal places deterministically using integer paisa math.
 */
export function roundCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/**
 * Calculates the single-day total meal value for one member row.
 */
export function calculateDailyMealTotal(entry: MealCountLike): number {
  const b = Number.isFinite(entry.breakfast) && entry.breakfast > 0 ? entry.breakfast : 0;
  const l = Number.isFinite(entry.lunch) && entry.lunch > 0 ? entry.lunch : 0;
  const d = Number.isFinite(entry.dinner) && entry.dinner > 0 ? entry.dinner : 0;
  return roundCurrency(b + l + d);
}

/**
 * Calculates the sum of all member meal values for a month or collection of entries.
 */
export function calculateTotalMeals(entries: MealCountLike[]): number {
  if (!entries || entries.length === 0) return 0;
  const sum = entries.reduce((acc, item) => acc + calculateDailyMealTotal(item), 0);
  return roundCurrency(sum);
}

/**
 * Calculates the exact (unrounded) meal rate for internal multiplication
 * so member meal costs sum closely to total meal expenses without compounding drift.
 */
export function calculateExactMealRate(mealExpense: number, totalMeals: number): number {
  if (!Number.isFinite(mealExpense) || mealExpense <= 0) return 0;
  if (!Number.isFinite(totalMeals) || totalMeals <= 0) return 0;
  return mealExpense / totalMeals;
}

/**
 * Calculates the monthly meal rate from meal-related expenses and total meals,
 * rounded to 2 decimal places for display and reporting.
 *
 * Formula:
 *   Meal Rate = Meal Expense / Total Meals (0 if Total Meals <= 0)
 */
export function calculateMealRate(mealExpense: number, totalMeals: number): number {
  const exact = calculateExactMealRate(mealExpense, totalMeals);
  return roundCurrency(exact);
}

/**
 * Calculates an individual member's meal cost:
 *   Meal Cost = Member Meals × Meal Rate
 */
export function calculateMemberMealCost(memberMeals: number, mealRate: number): number {
  if (!Number.isFinite(memberMeals) || memberMeals <= 0) return 0;
  if (!Number.isFinite(mealRate) || mealRate <= 0) return 0;
  return roundCurrency(memberMeals * mealRate);
}
