import { useState, useEffect, useMemo } from 'react';
import { useWalletStore } from '../store/useWalletStore';
import Layout from '../components/Layout/Layout';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { formatCurrency } from '../utils/validation';
import { format, addMonths, differenceInDays } from 'date-fns';
import type { Goal } from '../types';

const Goals = () => {
  const getActiveAccounts = useWalletStore((state) => state.getActiveAccounts);
  const goals = useWalletStore((state) => state.goals);
  
  const activeAccounts = getActiveAccounts();
  const isLoading = useWalletStore((state) => state.isLoading);
  const error = useWalletStore((state) => state.error);
  const setLoading = useWalletStore((state) => state.setLoading);
  const setError = useWalletStore((state) => state.setError);
  const setAccounts = useWalletStore((state) => state.setAccounts);
  const setGoals = useWalletStore((state) => state.setGoals);
  const addGoal = useWalletStore((state) => state.addGoal);
  const deleteGoal = useWalletStore((state) => state.deleteGoal);
  const allocateToGoal = useWalletStore((state) => state.allocateToGoal);
  const withdrawFromGoal = useWalletStore((state) => state.withdrawFromGoal);
  const syncGoalsWithAccounts = useWalletStore((state) => state.syncGoalsWithAccounts);

  const [retryCount, setRetryCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState<string | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    targetDate: format(addMonths(new Date(), 6), 'yyyy-MM-dd'),
    accountId: '',
    description: '',
  });
  const [allocateAmount, setAllocateAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);


  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Load accounts
        let accountsData: any[] = [];
        try {
          const stored = localStorage.getItem('wallet_accounts');
          if (stored) {
            accountsData = JSON.parse(stored);
          } else {
            const accountsResponse = await fetch('/accounts.json');
            if (accountsResponse.ok) {
              accountsData = await accountsResponse.json();
              localStorage.setItem('wallet_accounts', JSON.stringify(accountsData));
            }
          }
        } catch (e) {
          console.warn('Failed to load accounts', e);
          const accountsResponse = await fetch('/accounts.json');
          if (accountsResponse.ok) {
            accountsData = await accountsResponse.json();
          }
        }
        setAccounts(accountsData);

        // Load goals from localStorage (store already loads on init, but ensure we have latest)
        let goalsData: Goal[] = [];
        try {
          const stored = localStorage.getItem('wallet_goals');
          if (stored) {
            goalsData = JSON.parse(stored);
            // Only set if different from current store state to avoid unnecessary updates
            if (JSON.stringify(goalsData) !== JSON.stringify(goals)) {
              setGoals(goalsData);
            }
          } else {
            // If no goals in localStorage, ensure store has empty array
            if (goals.length > 0) {
              setGoals([]);
            }
          }
        } catch (e) {
          console.warn('Failed to load goals', e);
        }

        // Sync goals with accounts after both are loaded
        if (accountsData.length > 0) {
          setTimeout(() => {
            syncGoalsWithAccounts();
          }, 100);
        }

        setIsInitialLoad(false);
      } catch (error) {
        const errorMessage = 'Failed to load goals data. Please try again.';
        setError(errorMessage);
        console.error('Goals load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setLoading, setError, setAccounts, setGoals, syncGoalsWithAccounts, retryCount, goals]);

  // Check for newly completed goals and show celebration
  useEffect(() => {
    const completedGoals = goals.filter(
      (goal) => goal.isCompleted && goal.completedAt && new Date(goal.completedAt).getTime() > Date.now() - 5000
    );
    if (completedGoals.length > 0) {
      setShowCelebration(completedGoals[0].id);
      setTimeout(() => setShowCelebration(null), 3000);
    }
  }, [goals]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    setError(null);
  };

  const handleCreateGoal = () => {
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError('Goal title is required');
      return;
    }

    if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
      setFormError('Target amount must be greater than 0');
      return;
    }

    if (!formData.targetDate) {
      setFormError('Target date is required');
      return;
    }

    if (new Date(formData.targetDate) < new Date()) {
      setFormError('Target date must be in the future');
      return;
    }

    if (!formData.accountId) {
      setFormError('Please select an account');
      return;
    }

    addGoal({
      title: formData.title.trim(),
      targetAmount: parseFloat(formData.targetAmount),
      targetDate: formData.targetDate,
      accountId: formData.accountId,
      description: formData.description.trim() || undefined,
    });

    setFormData({
      title: '',
      targetAmount: '',
      targetDate: format(addMonths(new Date(), 6), 'yyyy-MM-dd'),
      accountId: '',
      description: '',
    });
    setShowCreateModal(false);
    setFormError(null);
  };

  const formatAmount = (value: string): string => {
    // Remove all non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, '');
    
    // Only allow one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].slice(0, 2);
    }
    
    return cleaned;
  };


  const handleAllocateAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatAmount(value);
    setAllocateAmount(formatted);
    setActionError(null);
  };

  const handleWithdrawAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatAmount(value);
    setWithdrawAmount(formatted);
    setActionError(null);
  };

  const handleAllocate = (goalId: string) => {
    setActionError(null);

    if (!allocateAmount || allocateAmount.trim() === '') {
      setActionError('Please enter an amount');
      return;
    }

    const amount = parseFloat(allocateAmount);
    if (isNaN(amount) || amount <= 0) {
      setActionError('Amount must be greater than 0');
      return;
    }

    // Validate decimal places
    const decimalParts = allocateAmount.split('.');
    if (decimalParts.length > 1 && decimalParts[1].length > 2) {
      setActionError('Amount can have maximum 2 decimal places');
      return;
    }

    const result = allocateToGoal(goalId, amount);
    if (result.success) {
      setShowAllocateModal(null);
      setAllocateAmount('');
      setActionError(null);
    } else {
      setActionError(result.error || 'Failed to allocate amount');
    }
  };

  const handleWithdraw = (goalId: string) => {
    setActionError(null);
    const goal = goals.find((g) => g.id === goalId);
    
    if (!goal) {
      setActionError('Goal not found');
      return;
    }

    // Check if withdrawal date has been reached
    const targetDate = new Date(goal.targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    if (today < targetDate) {
      const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      setActionError(`Withdrawal is only allowed on or after ${format(targetDate, 'MMMM dd, yyyy')}. ${daysRemaining} day(s) remaining.`);
      return;
    }

    if (!withdrawAmount || withdrawAmount.trim() === '') {
      setActionError('Please enter an amount');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setActionError('Amount must be greater than 0');
      return;
    }

    // Validate decimal places
    const decimalParts = withdrawAmount.split('.');
    if (decimalParts.length > 1 && decimalParts[1].length > 2) {
      setActionError('Amount can have maximum 2 decimal places');
      return;
    }

    const result = withdrawFromGoal(goalId, amount);
    if (result.success) {
      setShowWithdrawModal(null);
      setWithdrawAmount('');
      setActionError(null);
    } else {
      setActionError(result.error || 'Failed to withdraw amount');
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (goal && goal.allocatedAmount > 0) {
      if (!window.confirm(`This goal has ${formatCurrency(goal.allocatedAmount)} allocated. The money will be returned to your account. Delete this goal?`)) {
        return;
      }
    } else {
      if (!window.confirm('Are you sure you want to delete this goal?')) {
        return;
      }
    }
    deleteGoal(goalId);
  };

  const activeGoals = useMemo(() => goals.filter((g) => !g.isCompleted), [goals]);
  const completedGoals = useMemo(() => goals.filter((g) => g.isCompleted), [goals]);

  if (isLoading && isInitialLoad) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading goals..." />
        </div>
      </Layout>
    );
  }

  if (error && isInitialLoad) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-red-200 p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-[#172030] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              Savings Goals
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Create savings buckets and allocate money from your accounts
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-[#172030] text-white rounded-lg font-medium hover:opacity-90 active:opacity-80 transition-opacity text-sm sm:text-base"
          >
            + Create Goal
          </button>
        </div>

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeGoals.map((goal) => {
                const account = activeAccounts.find((acc) => acc.id === goal.accountId);
                
                // Calculate date-based progress
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const targetDate = new Date(goal.targetDate);
                targetDate.setHours(0, 0, 0, 0);
                const createdAt = new Date(goal.createdAt);
                createdAt.setHours(0, 0, 0, 0);
                
                const totalDays = differenceInDays(targetDate, createdAt);
                const daysElapsed = differenceInDays(today, createdAt);
                
                // Date progress: how much time has passed towards the target date
                const dateProgress = totalDays > 0 
                  ? Math.min(Math.max((daysElapsed / totalDays) * 100, 0), 100)
                  : 100; // If target date has passed, show 100%
                
                // Amount progress: how much money has been allocated
                const amountProgress = (goal.allocatedAmount / goal.targetAmount) * 100;
                
                // Overall progress: average of date and amount progress, but cap at 100%
                const progress = Math.min((dateProgress + amountProgress) / 2, 100);
                
                const daysRemaining = differenceInDays(targetDate, today);
                const isOverdue = daysRemaining < 0;
                const amountRemaining = goal.targetAmount - goal.allocatedAmount;
                
                // Goal is only truly complete when both amount and date requirements are met
                const isFullyComplete = goal.allocatedAmount >= goal.targetAmount && today >= targetDate;

                return (
                  <div
                    key={goal.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 relative overflow-hidden"
                  >
                    {/* Celebration Animation */}
                    {showCelebration === goal.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-green-50 bg-opacity-90 z-10 animate-pulse">
                        <div className="text-center">
                          <div className="text-6xl mb-4">🎉</div>
                          <p className="text-2xl font-bold text-green-600">Goal Achieved!</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {goal.title}
                        </h3>
                        {goal.description && (
                          <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Linked to {account?.name || 'Account'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        aria-label="Delete goal"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Goal Balance */}
                    <div className="mb-4 p-4 bg-[#172030]/5 rounded-lg border border-[#172030]/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Goal Balance</span>
                        <span className="text-xl font-bold text-[#172030]">
                          {formatCurrency(goal.allocatedAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Target: {formatCurrency(goal.targetAmount)}</span>
                        <span>Remaining: {formatCurrency(amountRemaining)}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Progress (Date & Amount)
                        </span>
                        <span className="text-sm font-semibold text-[#172030]">
                          {progress.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isFullyComplete
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                              : progress >= 75
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                              : progress >= 50
                              ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                              : 'bg-gradient-to-r from-red-500 to-pink-500'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>Date: {dateProgress.toFixed(1)}%</span>
                        <span>Amount: {amountProgress.toFixed(1)}%</span>
                      </div>
                    </div>

                    {/* Account Balance Info */}
                    {account && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{account.name} Balance</span>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(account.balance)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setShowAllocateModal(goal.id);
                          setAllocateAmount('');
                          setActionError(null);
                        }}
                        disabled={!account || account.balance <= 0}
                        className="flex-1 px-4 py-2.5 bg-[#172030] text-white rounded-lg font-medium hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Allocate
                      </button>
                      <button
                        onClick={() => {
                          setShowWithdrawModal(goal.id);
                          setWithdrawAmount('');
                          setActionError(null);
                        }}
                        disabled={goal.allocatedAmount <= 0 || new Date() < new Date(goal.targetDate)}
                        className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        title={new Date() < new Date(goal.targetDate) ? `Withdrawal available from ${format(new Date(goal.targetDate), 'MMM dd, yyyy')}` : undefined}
                      >
                        Withdraw
                      </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 mt-4 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Target Date</p>
                        <p className={`text-sm font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                          {format(new Date(goal.targetDate), 'MMM dd, yyyy')}
                        </p>
                        {isOverdue && (
                          <p className="text-xs text-red-600 mt-1">Overdue</p>
                        )}
                        {!isOverdue && (
                          <p className="text-xs text-gray-500 mt-1">
                            {daysRemaining} days left
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Status</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {isFullyComplete ? 'Ready to Withdraw' : isOverdue ? 'Overdue' : 'In Progress'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Completed Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedGoals.map((goal) => {
                const account = activeAccounts.find((acc) => acc.id === goal.accountId);
                
                // Calculate date-based progress for completed goals
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const targetDate = new Date(goal.targetDate);
                targetDate.setHours(0, 0, 0, 0);
                const createdAt = new Date(goal.createdAt);
                createdAt.setHours(0, 0, 0, 0);
                
              
                

                return (
                  <div
                    key={goal.id}
                    className="bg-green-50 rounded-xl shadow-sm border border-green-200 p-4 md:p-6 relative"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                          <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-medium">
                            Completed
                          </span>
                        </div>
                        {goal.description && (
                          <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Linked to {account?.name || 'Account'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        aria-label="Delete goal"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <div className="mb-4 p-4 bg-white rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Goal Balance</span>
                        <span className="text-xl font-bold text-green-600">
                          {formatCurrency(goal.allocatedAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Target: {formatCurrency(goal.targetAmount)}</span>
                        <span className="text-green-600 font-semibold">100% Complete</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                          style={{ width: '100%' }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Buttons for Completed Goals */}
                    <div className="flex gap-2 pt-4 border-t border-green-200">
                      <button
                        onClick={() => {
                          setShowWithdrawModal(goal.id);
                          setWithdrawAmount('');
                          setActionError(null);
                        }}
                        disabled={goal.allocatedAmount <= 0 || new Date() < new Date(goal.targetDate)}
                        className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        title={new Date() < new Date(goal.targetDate) ? `Withdrawal available from ${format(new Date(goal.targetDate), 'MMM dd, yyyy')}` : undefined}
                      >
                        Withdraw
                      </button>
                    </div>

                    {goal.completedAt && (
                      <p className="text-xs text-gray-500 mt-4">
                        Completed on {format(new Date(goal.completedAt), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {goals.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12 text-center">
            <div className="w-16 h-16 bg-[#172030]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#172030]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Goals Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first savings goal and start allocating money to it
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-[#172030] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Create Your First Goal
            </button>
          </div>
        )}

        {/* Create Goal Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Create New Goal</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Goal Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Emergency Fund"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700 mb-2">
                    Target Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      id="targetAmount"
                      value={formData.targetAmount}
                      onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Target Date *
                  </label>
                  <input
                    type="date"
                    id="targetDate"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-2">
                    Source Account *
                  </label>
                  <select
                    id="accountId"
                    value={formData.accountId}
                    onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] focus:border-transparent"
                  >
                    <option value="">Select account</option>
                    {activeAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} - {formatCurrency(account.balance)}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Money will be allocated from this account to your goal
                  </p>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add a note about this goal..."
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] focus:border-transparent resize-none"
                  />
                </div>

                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {formError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormError(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateGoal}
                    className="flex-1 px-4 py-2.5 bg-[#172030] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Create Goal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Allocate Modal */}
        {showAllocateModal && (() => {
          const goal = goals.find((g) => g.id === showAllocateModal);
          const account = goal ? activeAccounts.find((acc) => acc.id === goal.accountId) : null;
          if (!goal || !account) return null;

          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Allocate to {goal.title}</h2>
                  <button
                    onClick={() => {
                      setShowAllocateModal(null);
                      setAllocateAmount('');
                      setActionError(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="allocateAmount" className="block text-sm font-medium text-gray-700 mb-2">
                      Amount to Allocate
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                        $
                      </span>
                      <input
                        type="text"
                        id="allocateAmount"
                        value={allocateAmount}
                        onChange={handleAllocateAmountChange}
                        placeholder="0.00"
                        className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] focus:border-transparent text-base"
                        inputMode="decimal"
                      />
                    </div>
                    {allocateAmount && !isNaN(parseFloat(allocateAmount)) && (
                      <p className="mt-1 text-sm font-semibold text-[#172030]">
                        {formatCurrency(parseFloat(allocateAmount))}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Available: {formatCurrency(account.balance)}
                    </p>
                  </div>

                  {actionError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {actionError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setShowAllocateModal(null);
                        setAllocateAmount('');
                        setActionError(null);
                      }}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAllocate(goal.id)}
                      className="flex-1 px-4 py-2.5 bg-[#172030] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                      Allocate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Withdraw Modal */}
        {showWithdrawModal && (() => {
          const goal = goals.find((g) => g.id === showWithdrawModal);
          if (!goal) return null;

          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Withdraw from {goal.title}</h2>
                  <button
                    onClick={() => {
                      setShowWithdrawModal(null);
                      setWithdrawAmount('');
                      setActionError(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="withdrawAmount" className="block text-sm font-medium text-gray-700 mb-2">
                      Amount to Withdraw
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                        $
                      </span>
                      <input
                        type="text"
                        id="withdrawAmount"
                        value={withdrawAmount}
                        onChange={handleWithdrawAmountChange}
                        placeholder="0.00"
                        className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] focus:border-transparent text-base"
                        inputMode="decimal"
                      />
                    </div>
                    {withdrawAmount && !isNaN(parseFloat(withdrawAmount)) && (
                      <p className="mt-1 text-sm font-semibold text-[#172030]">
                        {formatCurrency(parseFloat(withdrawAmount))}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Available: {formatCurrency(goal.allocatedAmount)}
                    </p>
                    {new Date() < new Date(goal.targetDate) && (
                      <p className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                        ⚠️ Withdrawal will be available from {format(new Date(goal.targetDate), 'MMMM dd, yyyy')}
                      </p>
                    )}
                  </div>

                  {actionError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {actionError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setShowWithdrawModal(null);
                        setWithdrawAmount('');
                        setActionError(null);
                      }}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleWithdraw(goal.id)}
                      className="flex-1 px-4 py-2.5 bg-[#172030] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Error Banner */}
        {error && !isInitialLoad && (
          <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 shadow-lg">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800">{error}</p>
                <button
                  onClick={handleRetry}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium underline"
                >
                  Retry
                </button>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 flex-shrink-0"
                aria-label="Dismiss"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Goals;
