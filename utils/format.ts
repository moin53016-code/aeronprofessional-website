/**
 * Price & Currency Formatting Utilities
 */

/**
 * Formats a number to Indian Rupee (INR) format (e.g. ₹3,499)
 */
export const fmt = (n: number): string => {
  return '₹' + n.toLocaleString('en-IN');
};

/**
 * Computes discount percentage rounded to nearest whole number
 */
export const calcDiscountPercent = (price: number, oldPrice: number): number => {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round((1 - price / oldPrice) * 100);
};
