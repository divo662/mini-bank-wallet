export interface Account {
  id: string;
  name: string;
  balance: number;
  type: 'checking' | 'savings';
}

export interface Transaction {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  timestamp?: string; // ISO datetime string for accurate time
  merchant: string;
  category: string;
  amount: number;
  type: 'credit' | 'debit';
  accountId: string;
  runningBalance?: number;
}

export interface TransferFormData {
  fromAccountId: string;
  toAccountId: string;
  amount: string;
}

export interface Filters {
  category: string;
  dateFrom: string;
  dateTo: string;
  merchant: string;
}

