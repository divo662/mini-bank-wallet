export interface Account {
  id: string;
  name: string;
  balance: number;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'other';
  color?: string; // Hex color code
  icon?: string; // Icon name/identifier
  isArchived?: boolean;
  createdAt?: string; // ISO date string
  accountNumber?: string; // Optional account number
  description?: string; // Optional description
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
  notes?: string;
  tags?: string[];
}

export interface TransferFormData {
  fromAccountId: string;
  toAccountId: string;
  amount: string;
}

export interface Filters {
  category: string;
  categories: string[]; // Multiple categories
  dateFrom: string;
  dateTo: string;
  merchant: string;
  amountMin: string;
  amountMax: string;
  tags: string[]; // Filter by tags
  searchQuery: string; // Global search query
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: Partial<Filters>;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  allocatedAmount: number; // Amount allocated to this goal (separate from account balance)
  targetDate: string; // ISO date string (YYYY-MM-DD)
  accountId: string; // Source account (where money comes from/goes back to)
  description?: string;
  createdAt: string; // ISO date string
  completedAt?: string; // ISO date string
  isCompleted: boolean;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string; // URL or base64 image
  avatarColor?: string; // Hex color for avatar background if no image
  plan?: string; // e.g., "Ultimate", "Premium", "Basic"
  role?: string; // e.g., "Account Holder", "Admin"
  address?: string;
  city?: string;
  country?: string;
  dateOfBirth?: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

