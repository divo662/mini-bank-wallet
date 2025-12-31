import { z } from 'zod';

export const transferSchema = z.object({
  fromAccountId: z.string().min(1, 'Please select a source account'),
  toAccountId: z.string().min(1, 'Please select a destination account'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      { message: 'Amount must be a positive number' }
    )
    .refine(
      (val) => {
        const decimalPlaces = val.split('.')[1]?.length || 0;
        return decimalPlaces <= 2;
      },
      { message: 'Amount can have at most 2 decimal places' }
    ),
});

export type TransferFormData = z.infer<typeof transferSchema>;

export const validateTransfer = (
  amount: string,
  fromBalance: number,
  fromAccountId: string,
  toAccountId: string
): { isValid: boolean; error?: string } => {
  // Allow external transfers (toAccountId === 'external')
  if (toAccountId !== 'external' && fromAccountId === toAccountId) {
    return { isValid: false, error: 'Cannot transfer to the same account' };
  }

  if (!fromAccountId) {
    return { isValid: false, error: 'Please select a source account' };
  }

  if (!amount) {
    return { isValid: false, error: 'Amount is required' };
  }

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return { isValid: false, error: 'Amount must be a positive number' };
  }

  // Validate decimal places
  const decimalParts = amount.split('.');
  if (decimalParts.length > 1 && decimalParts[1].length > 2) {
    return { isValid: false, error: 'Amount can have maximum 2 decimal places' };
  }

  if (amountNum > fromBalance) {
    return { isValid: false, error: 'Insufficient balance' };
  }

  return { isValid: true };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

