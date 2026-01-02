import { create } from 'zustand';
import type { Account, Transaction, Filters, Goal, FilterPreset, User } from '../types';

interface WalletState {
  accounts: Account[];
  transactions: Transaction[];
  goals: Goal[];
  user: User | null;
  filters: Filters;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setAccounts: (accounts: Account[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setGoals: (goals: Goal[]) => void;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'balance' | 'isArchived'>) => void;
  updateAccount: (accountId: string, updates: Partial<Account>) => void;
  archiveAccount: (accountId: string) => void;
  unarchiveAccount: (accountId: string) => void;
  deleteAccount: (accountId: string) => { success: boolean; error?: string };
  updateAccountBalance: (accountId: string, newBalance: number) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (transactionId: string, updates: Partial<Transaction>) => void;
  removeTransaction: (transactionId: string) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'isCompleted' | 'completedAt' | 'allocatedAmount'>) => void;
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  deleteGoal: (goalId: string) => void;
  allocateToGoal: (goalId: string, amount: number) => { success: boolean; error?: string };
  withdrawFromGoal: (goalId: string, amount: number) => { success: boolean; error?: string };
  syncGoalsWithAccounts: () => void;
  setFilters: (filters: Partial<Filters>) => void;
  clearFilters: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Filter Presets
  filterPresets: FilterPreset[];
  saveFilterPreset: (name: string, filters: Partial<Filters>) => void;
  deleteFilterPreset: (presetId: string) => void;
  applyFilterPreset: (presetId: string) => void;
  
  // Computed
  getFilteredTransactions: () => Transaction[];
  getAccountById: (id: string) => Account | undefined;
  getActiveAccounts: () => Account[];
  getArchivedAccounts: () => Account[];
  getGoalById: (id: string) => Goal | undefined;
  getGoalsByAccount: (accountId: string) => Goal[];
  calculateRunningBalance: () => void;
}

const defaultFilters: Filters = {
  category: '',
  categories: [],
  dateFrom: '',
  dateTo: '',
  merchant: '',
  amountMin: '',
  amountMax: '',
  tags: [],
  searchQuery: '',
};

// Load filter presets from localStorage
const loadFilterPresets = (): FilterPreset[] => {
  try {
    const stored = localStorage.getItem('wallet_filter_presets');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Load user from localStorage
const loadUser = (): User | null => {
  try {
    const stored = localStorage.getItem('wallet_user');
    if (stored) {
      return JSON.parse(stored);
    }
    // Default user
    return {
      id: 'user-1',
      firstName: 'Saikat',
      lastName: '',
      email: 'saikat@example.com',
      avatarColor: '#172030',
      plan: 'Ultimate',
      role: 'Account Holder',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
};

// Load goals from localStorage
const loadGoals = (): Goal[] => {
  try {
    const stored = localStorage.getItem('wallet_goals');
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch {
    return [];
  }
};

export const useWalletStore = create<WalletState>((set, get) => ({
  accounts: [],
  transactions: [],
  goals: loadGoals(),
  user: loadUser(),
  filters: defaultFilters,
  isLoading: false,
  error: null,
  filterPresets: loadFilterPresets(),

  setAccounts: (accounts) => {
    set({ accounts });
    // Recalculate running balance if transactions exist
    const currentTransactions = get().transactions;
    if (currentTransactions.length > 0 && accounts.length > 0) {
      // Recalculate by setting transactions again (which will recalculate)
      get().setTransactions(currentTransactions);
    }
    // Sync goals with account balances
    setTimeout(() => {
      get().syncGoalsWithAccounts();
    }, 0);
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

  addAccount: (accountData) => {
    const newAccount: Account = {
      ...accountData,
      id: `account-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      balance: 0,
      isArchived: false,
      createdAt: new Date().toISOString(),
      color: accountData.color || '#172030',
      icon: accountData.icon || 'wallet',
    };
    
    set((state) => {
      const updatedAccounts = [...state.accounts, newAccount];
      try {
        localStorage.setItem('wallet_accounts', JSON.stringify(updatedAccounts));
      } catch (e) {
        console.warn('Failed to save accounts to localStorage', e);
      }
      return { accounts: updatedAccounts };
    });
  },

  updateAccount: (accountId, updates) => {
    set((state) => {
      const updatedAccounts = state.accounts.map((acc) =>
        acc.id === accountId ? { ...acc, ...updates } : acc
      );
      try {
        localStorage.setItem('wallet_accounts', JSON.stringify(updatedAccounts));
      } catch (e) {
        console.warn('Failed to save accounts to localStorage', e);
      }
      return { accounts: updatedAccounts };
    });
  },

  archiveAccount: (accountId) => {
    set((state) => {
      const updatedAccounts = state.accounts.map((acc) =>
        acc.id === accountId ? { ...acc, isArchived: true } : acc
      );
      try {
        localStorage.setItem('wallet_accounts', JSON.stringify(updatedAccounts));
      } catch (e) {
        console.warn('Failed to save accounts to localStorage', e);
      }
      return { accounts: updatedAccounts };
    });
  },

  unarchiveAccount: (accountId) => {
    set((state) => {
      const updatedAccounts = state.accounts.map((acc) =>
        acc.id === accountId ? { ...acc, isArchived: false } : acc
      );
      try {
        localStorage.setItem('wallet_accounts', JSON.stringify(updatedAccounts));
      } catch (e) {
        console.warn('Failed to save accounts to localStorage', e);
      }
      return { accounts: updatedAccounts };
    });
  },

  deleteAccount: (accountId) => {
    const state = get();
    const account = state.accounts.find((acc) => acc.id === accountId);
    
    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // Check if account has transactions
    const hasTransactions = state.transactions.some((t) => t.accountId === accountId);
    if (hasTransactions) {
      return { success: false, error: 'Cannot delete account with existing transactions. Please archive it instead.' };
    }

    // Check if account has goals
    const hasGoals = state.goals.some((g) => g.accountId === accountId);
    if (hasGoals) {
      return { success: false, error: 'Cannot delete account with existing goals. Please archive it instead.' };
    }

    // Check if account has balance
    if (account.balance !== 0) {
      return { success: false, error: 'Cannot delete account with balance. Please transfer funds first or archive it.' };
    }

    set((state) => {
      const updatedAccounts = state.accounts.filter((acc) => acc.id !== accountId);
      try {
        localStorage.setItem('wallet_accounts', JSON.stringify(updatedAccounts));
      } catch (e) {
        console.warn('Failed to save accounts to localStorage', e);
      }
      return { accounts: updatedAccounts };
    });

    return { success: true };
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
      
      // Sync goals with updated account balance
      setTimeout(() => {
        get().syncGoalsWithAccounts();
      }, 0);
      
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

  updateTransaction: (transactionId, updates) => {
    set((state) => {
      const updatedTransactions = state.transactions.map((t) =>
        t.id === transactionId ? { ...t, ...updates } : t
      );
      
      // Recalculate running balance if needed
      const accounts = state.accounts;
      if (updatedTransactions.length === 0 || accounts.length === 0) {
        try {
          localStorage.setItem('wallet_transactions', JSON.stringify(updatedTransactions));
        } catch (e) {
          console.warn('Failed to save transactions to localStorage', e);
        }
        return { transactions: updatedTransactions };
      }

      // Recalculate running balances
      const transactionsByAccount: Record<string, Transaction[]> = {};
      updatedTransactions.forEach((t) => {
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

  setGoals: (goals) => {
    set({ goals });
    try {
      localStorage.setItem('wallet_goals', JSON.stringify(goals));
    } catch (e) {
      console.warn('Failed to save goals to localStorage', e);
    }
    // Sync goals with account balances
    get().syncGoalsWithAccounts();
  },

  addGoal: (goalData) => {
    const newGoal: Goal = {
      ...goalData,
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      isCompleted: false,
      allocatedAmount: 0,
    };
    
    set((state) => {
      const updatedGoals = [...state.goals, newGoal];
      try {
        localStorage.setItem('wallet_goals', JSON.stringify(updatedGoals));
      } catch (e) {
        console.warn('Failed to save goals to localStorage', e);
      }
      return { goals: updatedGoals };
    });
    
    // Sync goals
    get().syncGoalsWithAccounts();
  },

  updateGoal: (goalId, updates) => {
    set((state) => {
      const updatedGoals = state.goals.map((goal) =>
        goal.id === goalId ? { ...goal, ...updates } : goal
      );
      try {
        localStorage.setItem('wallet_goals', JSON.stringify(updatedGoals));
      } catch (e) {
        console.warn('Failed to save goals to localStorage', e);
      }
      return { goals: updatedGoals };
    });
    
    // Sync with account balance
    get().syncGoalsWithAccounts();
  },

  deleteGoal: (goalId) => {
    set((state) => {
      const goal = state.goals.find((g) => g.id === goalId);
      if (goal && goal.allocatedAmount > 0) {
        // Return money to account when deleting goal
        const account = state.accounts.find((acc) => acc.id === goal.accountId);
        if (account) {
          const updatedAccounts = state.accounts.map((acc) =>
            acc.id === goal.accountId
              ? { ...acc, balance: acc.balance + goal.allocatedAmount }
              : acc
          );
          try {
            localStorage.setItem('wallet_accounts', JSON.stringify(updatedAccounts));
          } catch (e) {
            console.warn('Failed to save accounts to localStorage', e);
          }
          set({ accounts: updatedAccounts });
        }
      }

      const updatedGoals = state.goals.filter((goal) => goal.id !== goalId);
      try {
        localStorage.setItem('wallet_goals', JSON.stringify(updatedGoals));
      } catch (e) {
        console.warn('Failed to save goals to localStorage', e);
      }
      return { goals: updatedGoals };
    });
  },

  allocateToGoal: (goalId, amount) => {
    const state = get();
    const goal = state.goals.find((g) => g.id === goalId);
    if (!goal) {
      return { success: false, error: 'Goal not found' };
    }

    const account = state.accounts.find((acc) => acc.id === goal.accountId);
    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    if (amount <= 0) {
      return { success: false, error: 'Amount must be greater than 0' };
    }

    if (amount > account.balance) {
      return { success: false, error: 'Insufficient balance in account' };
    }

    const newAllocatedAmount = goal.allocatedAmount + amount;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(goal.targetDate);
    targetDate.setHours(0, 0, 0, 0);
    
    // Goal is only completed when BOTH amount and date requirements are met
    const hasEnoughAmount = newAllocatedAmount >= goal.targetAmount;
    const hasReachedDate = today >= targetDate;
    const isCompleted = hasEnoughAmount && hasReachedDate;
    const wasCompleted = goal.isCompleted;

    // Update account balance (deduct from account)
    const updatedAccounts = state.accounts.map((acc) =>
      acc.id === goal.accountId
        ? { ...acc, balance: acc.balance - amount }
        : acc
    );

    // Update goal allocated amount
    const updatedGoals = state.goals.map((g) => {
      if (g.id === goalId) {
        const completedAt = isCompleted && !wasCompleted ? new Date().toISOString() : g.completedAt;
        return {
          ...g,
          allocatedAmount: newAllocatedAmount,
          isCompleted,
          completedAt,
        };
      }
      return g;
    });

    // Create transaction
    const now = new Date();
    const transaction: Transaction = {
      id: `goal-allocate-${Date.now()}-${goalId}`,
      date: now.toISOString().split('T')[0],
      timestamp: now.toISOString(),
      merchant: `Allocated to ${goal.title}`,
      category: 'Savings Goal',
      amount: amount,
      type: 'debit',
      accountId: goal.accountId,
    };

    set({ accounts: updatedAccounts, goals: updatedGoals });
    get().addTransaction(transaction);

    try {
      localStorage.setItem('wallet_accounts', JSON.stringify(updatedAccounts));
      localStorage.setItem('wallet_goals', JSON.stringify(updatedGoals));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }

    return { success: true };
  },

  withdrawFromGoal: (goalId, amount) => {
    const state = get();
    const goal = state.goals.find((g) => g.id === goalId);
    if (!goal) {
      return { success: false, error: 'Goal not found' };
    }

    if (amount <= 0) {
      return { success: false, error: 'Amount must be greater than 0' };
    }

    if (amount > goal.allocatedAmount) {
      return { success: false, error: 'Insufficient balance in goal' };
    }

    const account = state.accounts.find((acc) => acc.id === goal.accountId);
    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // Update account balance (add back to account)
    const updatedAccounts = state.accounts.map((acc) =>
      acc.id === goal.accountId
        ? { ...acc, balance: acc.balance + amount }
        : acc
    );

    // Update goal allocated amount
    const newAllocatedAmount = goal.allocatedAmount - amount;
    const updatedGoals = state.goals.map((g) => {
      if (g.id === goalId) {
        return {
          ...g,
          allocatedAmount: newAllocatedAmount,
          isCompleted: (() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const targetDate = new Date(g.targetDate);
            targetDate.setHours(0, 0, 0, 0);
            return newAllocatedAmount >= g.targetAmount && today >= targetDate;
          })(),
        };
      }
      return g;
    });

    // Create transaction
    const now = new Date();
    const transaction: Transaction = {
      id: `goal-withdraw-${Date.now()}-${goalId}`,
      date: now.toISOString().split('T')[0],
      timestamp: now.toISOString(),
      merchant: `Withdrawn from ${goal.title}`,
      category: 'Savings Goal',
      amount: amount,
      type: 'credit',
      accountId: goal.accountId,
    };

    set({ accounts: updatedAccounts, goals: updatedGoals });
    get().addTransaction(transaction);

    try {
      localStorage.setItem('wallet_accounts', JSON.stringify(updatedAccounts));
      localStorage.setItem('wallet_goals', JSON.stringify(updatedGoals));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }

    return { success: true };
  },

  syncGoalsWithAccounts: () => {
    set((state) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const updatedGoals = state.goals.map((goal) => {
        const targetDate = new Date(goal.targetDate);
        targetDate.setHours(0, 0, 0, 0);
        
        // Goal is only completed when BOTH amount and date requirements are met
        const hasEnoughAmount = goal.allocatedAmount >= goal.targetAmount;
        const hasReachedDate = today >= targetDate;
        const isCompleted = hasEnoughAmount && hasReachedDate;
        const wasCompleted = goal.isCompleted;

        // If goal was just completed, set completedAt
        const completedAt = isCompleted && !wasCompleted 
          ? new Date().toISOString() 
          : goal.completedAt;

        return {
          ...goal,
          isCompleted,
          completedAt,
        };
      });

      try {
        localStorage.setItem('wallet_goals', JSON.stringify(updatedGoals));
      } catch (e) {
        console.warn('Failed to save goals to localStorage', e);
      }

      return { goals: updatedGoals };
    });
  },

  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),

  getAccountById: (id) => {
    return get().accounts.find((acc) => acc.id === id);
  },

  getActiveAccounts: () => {
    return get().accounts.filter((acc) => !acc.isArchived);
  },

  getArchivedAccounts: () => {
    return get().accounts.filter((acc) => acc.isArchived);
  },

  setUser: (user) => {
    set({ user });
    try {
      localStorage.setItem('wallet_user', JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to save user to localStorage', e);
    }
  },

  updateUser: (updates) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const updatedUser: User = {
      ...currentUser,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    set({ user: updatedUser });
    try {
      localStorage.setItem('wallet_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.warn('Failed to save user to localStorage', e);
    }
  },

  getGoalById: (id) => {
    return get().goals.find((goal) => goal.id === id);
  },

  getGoalsByAccount: (accountId) => {
    return get().goals.filter((goal) => goal.accountId === accountId);
  },

  getFilteredTransactions: () => {
    const { transactions, filters } = get();
    let filtered = [...transactions];

    // Global search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter((t) =>
        t.merchant.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        (t.notes && t.notes.toLowerCase().includes(query)) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    // Category filter (single - for backward compatibility)
    if (filters.category) {
      filtered = filtered.filter((t) => t.category === filters.category);
    }

    // Multiple categories filter
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter((t) => filters.categories.includes(t.category));
    }

    // Merchant filter
    if (filters.merchant) {
      filtered = filtered.filter((t) =>
        t.merchant.toLowerCase().includes(filters.merchant.toLowerCase())
      );
    }

    // Date range filters
    if (filters.dateFrom) {
      filtered = filtered.filter((t) => t.date >= filters.dateFrom);
    }

    if (filters.dateTo) {
      filtered = filtered.filter((t) => t.date <= filters.dateTo);
    }

    // Amount range filters
    if (filters.amountMin) {
      const min = parseFloat(filters.amountMin);
      if (!isNaN(min)) {
        filtered = filtered.filter((t) => t.amount >= min);
      }
    }

    if (filters.amountMax) {
      const max = parseFloat(filters.amountMax);
      if (!isNaN(max)) {
        filtered = filtered.filter((t) => t.amount <= max);
      }
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter((t) =>
        t.tags && t.tags.some(tag => filters.tags.includes(tag))
      );
    }

    return filtered;
  },

  saveFilterPreset: (name, filters) => {
    const newPreset: FilterPreset = {
      id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      filters,
    };
    set((state) => {
      const updatedPresets = [...state.filterPresets, newPreset];
      try {
        localStorage.setItem('wallet_filter_presets', JSON.stringify(updatedPresets));
      } catch (e) {
        console.warn('Failed to save filter presets to localStorage', e);
      }
      return { filterPresets: updatedPresets };
    });
  },

  deleteFilterPreset: (presetId) => {
    set((state) => {
      const updatedPresets = state.filterPresets.filter((p) => p.id !== presetId);
      try {
        localStorage.setItem('wallet_filter_presets', JSON.stringify(updatedPresets));
      } catch (e) {
        console.warn('Failed to save filter presets to localStorage', e);
      }
      return { filterPresets: updatedPresets };
    });
  },

  applyFilterPreset: (presetId) => {
    const preset = get().filterPresets.find((p) => p.id === presetId);
    if (preset) {
      get().setFilters(preset.filters);
    }
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

