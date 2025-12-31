export const TRANSACTION_CATEGORIES = [
  { value: 'Food', label: 'Food & Dining', icon: '🍽️' },
  { value: 'Transport', label: 'Transport', icon: '🚗' },
  { value: 'Shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'Bills', label: 'Bills & Utilities', icon: '💡' },
  { value: 'Entertainment', label: 'Entertainment', icon: '🎬' },
  { value: 'Healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'Education', label: 'Education', icon: '📚' },
  { value: 'Travel', label: 'Travel', icon: '✈️' },
  { value: 'Transfer', label: 'Transfer', icon: '💸' },
  { value: 'Funding', label: 'Funding', icon: '💰' },
  { value: 'Other', label: 'Other', icon: '📋' },
] as const;

export type CategoryValue = typeof TRANSACTION_CATEGORIES[number]['value'];

export const getCategoryLabel = (value: string): string => {
  const category = TRANSACTION_CATEGORIES.find((cat) => cat.value === value);
  return category?.label || value;
};

