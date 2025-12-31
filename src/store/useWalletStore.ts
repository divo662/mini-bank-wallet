import { create } from 'zustand';
import type { Account, Transaction, Filters } from '../types';

interface WalletState {
  accounts: Account[];
  transactions: Transaction[];
  filters: Filters;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setAccounts: (accounts: Account[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  updateAccountBalance: (accountId: string, newBalance: number) => void;
  addTransaction: (transaction: Transaction) => void;
  removeTransaction: (transactionId: string) => void;
  setFilters: (filters: Partial<Filters>) => void;
  clearFilters: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Computed
  getFilteredTransactions: () => Transaction[];
  getAccountById: (id: string) => Account | undefined;
  calculateRunningBalance: () => void;
}

const defaultFilters: Filters = {
  category: '',
  dateFrom: '',
  dateTo: '',
  merchant: '',
};

export const useWalletStore = create<WalletState>((set, get) => ({
  accounts: [],
  transactions: [],
  filters: defaultFilters,
  isLoading: false,
  error: null,

  setAccounts: (accounts) => {
    set({ accounts });
    // Recalculate running balance if transactions exist
    const currentTransactions = get().transactions;
    if (currentTransactions.length > 0 && accounts.length > 0) {
      // Recalculate by setting transactions again (which will recalculate)
      get().setTransactions(currentTransactions);
    }
  },

  setTransactions: (transactions) => {
    // Calculate running balance with new transactions before setting
    set((state) => {
      // Temporarily set transactions to calculate
      const tempState = { ...state, transactions };
      const accounts = tempState.accounts;
      
      if (transactions.length === 0 || accounts.length === 0) {
        // Save to localStorage
        try {
          localStorage.setItem('wallet_transactions', JSON.stringify(transactions));
        } catch (e) {
          console.warn('Failed to save transactions to localStorage', e);
        }
        return { transactions };
      }

      // Calculate running balances
      const transactionsByAccount: Record<string, Transaction[]> = {};
      transactions.forEach((t) => {
        if (!transactionsByAccount[t.accountId]) {
          transactionsByAccount[t.accountId] = [];
        }
        transactionsByAccount[t.accountId].push(t);
      });

      const transactionsWithBalance: Transaction[] = [];

      accounts.forEach((account) => {
        const accountTransactions = transactionsByAccount[account.id] || [];
        const sorted = [...accountTransactions].sort((a, b) => {
          const dateA = a.timestamp ? new Date(a.timestamp).getTime() : new Date(a.date).getTime();
          const dateB = b.timestamp ? new Date(b.timestamp).getTime() : new Date(b.date).getTime();
          if (dateA !== dateB) return dateA - dateB;
          return a.id.localeCompare(b.id);
        });

        let balance = account.balance;
        for (let i = sorted.length - 1; i >= 0; i--) {
          const t = sorted[i];
          if (t.type === 'credit') {
            balance -= t.amount;
          } else {
            balance += t.amount;
          }
        }

        sorted.forEach((transaction) => {
          if (transaction.type === 'credit') {
            balance += transaction.amount;
          } else {
            balance -= transaction.amount;
          }
          
          transactionsWithBalance.push({
            ...transaction,
            runningBalance: Number(balance.toFixed(2)),
          });
        });
      });

      transactionsWithBalance.sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : new Date(a.date).getTime();
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : new Date(b.date).getTime();
        if (dateA !== dateB) return dateB - dateA;
        return b.id.localeCompare(a.id);
      });

      // Save to localStorage
      try {
        localStorage.setItem('wallet_transactions', JSON.stringify(transactionsWithBalance));
      } catch (e) {
        console.warn('Failed to save transactions to localStorage', e);
      }

      return { transactions: transactionsWithBalance };
    });
  },

  updateAccountBalance: (accountId, newBalance) => {
    set((state) => {
      const updatedAccounts = state.accounts.map((acc) =>
        acc.id === accountId ? { ...acc, balance: Number(newBalance.toFixed(2)) } : acc
      );
      
      // Save accounts to localStorage
      try {
        localStorage.setItem('wallet_accounts', JSON.stringify(updatedAccounts));
      } catch (e) {
        console.warn('Failed to save accounts to localStorage', e);
      }
      
      return { accounts: updatedAccounts };
    });
  },

  addTransaction: (transaction) => {
    set((state) => {
      const newTransactions = [transaction, ...state.transactions];
      const accounts = state.accounts;
      
      if (accounts.length === 0) {
        // Save to localStorage
        try {
          localStorage.setItem('wallet_transactions', JSON.stringify(newTransactions));
        } catch (e) {
          console.warn('Failed to save transactions to localStorage', e);
        }
        return { transactions: newTransactions };
      }

      // Recalculate running balance for the new transaction list
      const transactionsByAccount: Record<string, Transaction[]> = {};
      newTransactions.forEach((t) => {
        if (!transactionsByAccount[t.accountId]) {
          transactionsByAccount[t.accountId] = [];
        }
        transactionsByAccount[t.accountId].push(t);
      });

      const transactionsWithBalance: Transaction[] = [];

      accounts.forEach((account) => {
        const accountTransactions = transactionsByAccount[account.id] || [];
        const sorted = [...accountTransactions].sort((a, b) => {
          const dateA = a.timestamp ? new Date(a.timestamp).getTime() : new Date(a.date).getTime();
          const dateB = b.timestamp ? new Date(b.timestamp).getTime() : new Date(b.date).getTime();
          if (dateA !== dateB) return dateA - dateB;
          return a.id.localeCompare(b.id);
        });

        let balance = account.balance;
        for (let i = sorted.length - 1; i >= 0; i--) {
          const t = sorted[i];
          if (t.type === 'credit') {
            balance -= t.amount;
          } else {
            balance += t.amount;
          }
        }

        sorted.forEach((t) => {
          if (t.type === 'credit') {
            balance += t.amount;
          } else {
            balance -= t.amount;
          }
          
          transactionsWithBalance.push({
            ...t,
            runningBalance: Number(balance.toFixed(2)),
          });
        });
      });

      transactionsWithBalance.sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : new Date(a.date).getTime();
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : new Date(b.date).getTime();
        if (dateA !== dateB) return dateB - dateA;
        return b.id.localeCompare(a.id);
      });

      // Save to localStorage
      try {
        localStorage.setItem('wallet_transactions', JSON.stringify(transactionsWithBalance));
      } catch (e) {
        console.warn('Failed to save transactions to localStorage', e);
      }

      return { transactions: transactionsWithBalance };
    });
  },

  removeTransaction: (transactionId) => {
    set((state) => {
      const filtered = state.transactions.filter((t) => t.id !== transactionId);
      
      // Recalculate running balance after removal
      const accounts = state.accounts;
      if (filtered.length === 0 || accounts.length === 0) {
        try {
          localStorage.setItem('wallet_transactions', JSON.stringify(filtered));
        } catch (e) {
          console.warn('Failed to save transactions to localStorage', e);
        }
        return { transactions: filtered };
      }

      // Recalculate running balances
      const transactionsByAccount: Record<string, Transaction[]> = {};
      filtered.forEach((t) => {
        if (!transactionsByAccount[t.accountId]) {
          transactionsByAccount[t.accountId] = [];
        }
        transactionsByAccount[t.accountId].push(t);
      });

      const transactionsWithBalance: Transaction[] = [];

      accounts.forEach((account) => {
        const accountTransactions = transactionsByAccount[account.id] || [];
        const sorted = [...accountTransactions].sort((a, b) => {
          const dateA = a.timestamp ? new Date(a.timestamp).getTime() : new Date(a.date).getTime();
          const dateB = b.timestamp ? new Date(b.timestamp).getTime() : new Date(b.date).getTime();
          if (dateA !== dateB) return dateA - dateB;
          return a.id.localeCompare(b.id);
        });

        let balance = account.balance;
        for (let i = sorted.length - 1; i >= 0; i--) {
          const t = sorted[i];
          if (t.type === 'credit') {
            balance -= t.amount;
          } else {
            balance += t.amount;
          }
        }

        sorted.forEach((t) => {
          if (t.type === 'credit') {
            balance += t.amount;
          } else {
            balance -= t.amount;
          }
          
          transactionsWithBalance.push({
            ...t,
            runningBalance: Number(balance.toFixed(2)),
          });
        });
      });

      transactionsWithBalance.sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : new Date(a.date).getTime();
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : new Date(b.date).getTime();
        if (dateA !== dateB) return dateB - dateA;
        return b.id.localeCompare(a.id);
      });

      // Save to localStorage
      try {
        localStorage.setItem('wallet_transactions', JSON.stringify(transactionsWithBalance));
      } catch (e) {
        console.warn('Failed to save transactions to localStorage', e);
      }

      return { transactions: transactionsWithBalance };
    });
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  clearFilters: () => {
    set({ filters: defaultFilters });
  },

  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),

  getAccountById: (id) => {
    return get().accounts.find((acc) => acc.id === id);
  },

  getFilteredTransactions: () => {
    const { transactions, filters } = get();
    let filtered = [...transactions];

    if (filters.category) {
      filtered = filtered.filter((t) => t.category === filters.category);
    }

    if (filters.merchant) {
      filtered = filtered.filter((t) =>
        t.merchant.toLowerCase().includes(filters.merchant.toLowerCase())
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter((t) => t.date >= filters.dateFrom);
    }

    if (filters.dateTo) {
      filtered = filtered.filter((t) => t.date <= filters.dateTo);
    }

    return filtered;
  },

  calculateRunningBalance: () => {
    // This is now handled inline in setTransactions and addTransaction
    // Keeping for backwards compatibility but it's a no-op
    const { transactions, accounts } = get();
    if (transactions.length === 0 || accounts.length === 0) return;
    
    // Only recalculate if running balances are missing
    const needsUpdate = transactions.some((t) => t.runningBalance === undefined);
    if (!needsUpdate) return;

    // Recalculate by calling setTransactions with current transactions
    get().setTransactions(transactions);
  },
}));

