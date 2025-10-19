/**
 * Point d'entrée du module d'estimation des prix SNCF
 */

export { estimateTrainPrice, compareTrainOptions } from './calculator';
export { applyDiscountCard, getEligibleCards } from './discounts';
export { generateRecommendations } from './recommendations';
export * from './constants';
