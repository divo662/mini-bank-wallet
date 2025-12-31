import { useState, useEffect } from 'react';
import { useWalletStore } from '../store/useWalletStore';
import Layout from '../components/Layout/Layout';
import { formatCurrency } from '../utils/validation';
import { TRANSACTION_CATEGORIES } from '../utils/categories';
import type { Transaction } from '../types';
import PINModal from '../components/Common/PINModal';
import SuccessModal from '../components/Common/SuccessModal';
import LoadingSpinner from '../components/Common/LoadingSpinner';

interface DummyUser {
  id: string;
  name: string;
  accountNumber: string;
  bank: string;
}

const Transfer = () => {
  const accounts = useWalletStore((state) => state.accounts);
  const isLoading = useWalletStore((state) => state.isLoading);
  const error = useWalletStore((state) => state.error);
  const setLoading = useWalletStore((state) => state.setLoading);
  const setError = useWalletStore((state) => state.setError);
  const setAccounts = useWalletStore((state) => state.setAccounts);
  const getAccountById = useWalletStore((state) => state.getAccountById);
  const updateAccountBalance = useWalletStore(
    (state) => state.updateAccountBalance
  );
  const addTransaction = useWalletStore((state) => state.addTransaction);
  const removeTransaction = useWalletStore((state) => state.removeTransaction);
  
  const [retryCount, setRetryCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [transferType, setTransferType] = useState<'internal' | 'external'>('internal');
  const [dummyUsers, setDummyUsers] = useState<DummyUser[]>([]);
  const [step, setStep] = useState<'form' | 'pin' | 'processing' | 'success'>('form');
  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    toDummyUserId: '',
    amount: '',
    category: 'Transfer',
  });
  const [formattedAmount, setFormattedAmount] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const mainAccount = accounts.find((acc) => acc.id === 'main') || accounts[0];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Simulate network delay
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

        if (accountsData.length === 0) {
          throw new Error('No accounts found');
        }

        setAccounts(accountsData);

        // Load dummy users
        try {
          const response = await fetch('/dummy-users.json');
          if (response.ok) {
            const data = await response.json();
            setDummyUsers(data);
          }
        } catch (error) {
          console.warn('Failed to load dummy users', error);
        }

        setIsInitialLoad(false);
      } catch (error) {
        const errorMessage = 'Failed to load data. Please try again.';
        setError(errorMessage);
        console.error('Transfer load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setLoading, setError, setAccounts, retryCount]);

  // Set default from account when accounts are loaded
  useEffect(() => {
    if (accounts.length > 0 && !formData.fromAccountId) {
      if (mainAccount) {
        setFormData((prev) => ({ ...prev, fromAccountId: mainAccount.id }));
      }
    }
  }, [accounts, formData.fromAccountId, mainAccount]);

  const fromAccount = getAccountById(formData.fromAccountId);
  const toAccount = transferType === 'internal' ? getAccountById(formData.toAccountId) : null;
  const selectedDummyUser = transferType === 'external' 
    ? dummyUsers.find((u) => u.id === formData.toDummyUserId) 
    : null;

  const formatAmount = (value: string): string => {
    // Remove all non-digit characters except decimal point
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

  const formatAmountDisplay = (value: string): string => {
    if (!value) return '';
    
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    
    // Format with commas and 2 decimal places
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatAmount(value);
    setFormData((prev) => ({ ...prev, amount: formatted }));
    setFormattedAmount(formatAmountDisplay(formatted));
    if (formError) setFormError(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.fromAccountId) {
      setFormError('Please select a source account');
      return false;
    }

    if (transferType === 'internal' && !formData.toAccountId) {
      setFormError('Please select a destination account');
      return false;
    }

    if (transferType === 'external' && !formData.toDummyUserId) {
      setFormError('Please select a recipient');
      return false;
    }

    if (!formData.amount) {
      setFormError('Please enter an amount');
      return false;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setFormError('Amount must be greater than 0');
      return false;
    }

    // Validate decimal places
    const decimalParts = formData.amount.split('.');
    if (decimalParts.length > 1 && decimalParts[1].length > 2) {
      setFormError('Amount can have maximum 2 decimal places');
      return false;
    }

    if (!fromAccount) {
      setFormError('Source account not found');
      return false;
    }

    // Validate sufficient balance
    if (amount > fromAccount.balance) {
      setFormError('Insufficient balance');
      return false;
    }

    // Validate not transferring to same account (internal only)
    if (transferType === 'internal' && formData.fromAccountId === formData.toAccountId) {
      setFormError('Cannot transfer to the same account');
      return false;
    }

    return true;
  };

  const handleContinue = () => {
    if (!validateForm()) {
      return;
    }
    setStep('pin');
  };

  const handlePINComplete = async (pin: string) => {
    if (pin.length !== 4) {
      return;
    }

    setStep('processing');
    setIsProcessing(true);
    setError(null);

    const amount = parseFloat(formData.amount);
    const timestamp = Date.now();
    const fromTransactionId = `transfer-${timestamp}-from-${formData.fromAccountId}`;

    if (transferType === 'internal') {
      // Internal transfer between accounts
      const toAccount = getAccountById(formData.toAccountId);
      if (!toAccount || !fromAccount) {
        setFormError('Account not found');
        setStep('form');
        setIsProcessing(false);
        return;
      }

      const originalFromBalance = fromAccount.balance;
      const originalToBalance = toAccount.balance;
      const toTransactionId = `transfer-${timestamp}-to-${formData.toAccountId}`;

      // Create transfer transactions with actual timestamp
      const now = new Date();
      const fromTransaction: Transaction = {
        id: fromTransactionId,
        date: now.toISOString().split('T')[0],
        timestamp: now.toISOString(),
        merchant: `Transfer to ${toAccount.name}`,
        category: formData.category || 'Transfer',
        amount: amount,
        type: 'debit',
        accountId: formData.fromAccountId,
      };

      const toTransaction: Transaction = {
        id: toTransactionId,
        date: now.toISOString().split('T')[0],
        timestamp: now.toISOString(),
        merchant: `Transfer from ${fromAccount.name}`,
        category: formData.category || 'Transfer',
        amount: amount,
        type: 'credit',
        accountId: formData.toAccountId,
      };

      // Optimistic update
      updateAccountBalance(formData.fromAccountId, originalFromBalance - amount);
      updateAccountBalance(formData.toAccountId, originalToBalance + amount);
      addTransaction(fromTransaction);
      addTransaction(toTransaction);

      try {
        // Simulate API call with 2 second delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Show success modal
        setStep('success');
        setIsProcessing(false);

        // Success modal will handle redirect
      } catch (error) {
        // Rollback on error
        updateAccountBalance(formData.fromAccountId, originalFromBalance);
        updateAccountBalance(formData.toAccountId, originalToBalance);
        removeTransaction(fromTransactionId);
        removeTransaction(toTransactionId);
        setFormError('Transfer failed. Please try again.');
        setStep('form');
        setIsProcessing(false);
      }
    } else {
      // External transfer to dummy user
      const dummyUser = dummyUsers.find((u) => u.id === formData.toDummyUserId);
      if (!dummyUser || !fromAccount) {
        setFormError('Recipient or account not found');
        setStep('form');
        setIsProcessing(false);
        return;
      }

      const originalFromBalance = fromAccount.balance;

      const now = new Date();
      const transaction: Transaction = {
        id: fromTransactionId,
        date: now.toISOString().split('T')[0],
        timestamp: now.toISOString(),
        merchant: `Transfer to ${dummyUser.name} (${dummyUser.accountNumber})`,
        category: formData.category || 'Transfer',
        amount: amount,
        type: 'debit',
        accountId: formData.fromAccountId,
      };

      // Optimistic update
      updateAccountBalance(formData.fromAccountId, originalFromBalance - amount);
      addTransaction(transaction);

      try {
        // Simulate API call with 2 second delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Show success modal
        setStep('success');
        setIsProcessing(false);

        // Success modal will handle redirect
      } catch (error) {
        // Rollback on error
        updateAccountBalance(formData.fromAccountId, originalFromBalance);
        removeTransaction(fromTransactionId);
        setFormError('Transfer failed. Please try again.');
        setStep('form');
        setIsProcessing(false);
      }
    }
  };

  const handlePINClose = () => {
    setStep('form');
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    setError(null);
  };

  if (isLoading && isInitialLoad) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading transfer data..." />
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
      <div className="max-w-2xl mx-auto px-3 sm:px-4 md:px-6 overflow-visible">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8 overflow-visible">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Fund Transfer</h1>
            <p className="text-sm sm:text-base text-gray-600">Move money between accounts or send to other users</p>
          </div>

          {step === 'form' && (
            <>
              {/* Transfer Type Selection */}
              <div className="mb-4 sm:mb-6">
                <div className="flex gap-2 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setTransferType('internal');
                      setFormData((prev) => ({ ...prev, toDummyUserId: '' }));
                    }}
                    className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 ${
                      transferType === 'internal'
                        ? 'bg-[#172030] text-white shadow-md active:scale-95'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
                    }`}
                  >
                    Internal Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTransferType('external');
                      setFormData((prev) => ({ ...prev, toAccountId: '' }));
                    }}
                    className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 ${
                      transferType === 'external'
                        ? 'bg-[#172030] text-white shadow-md active:scale-95'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
                    }`}
                  >
                    Send to User
                  </button>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* From Account */}
                <div className="relative">
                  <label
                    htmlFor="fromAccountId"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    From Account
                  </label>
                  <select
                    id="fromAccountId"
                    name="fromAccountId"
                    value={formData.fromAccountId || (mainAccount?.id || '')}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] focus:border-transparent text-base appearance-none bg-white cursor-pointer pr-10"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.75rem center',
                      backgroundSize: '12px',
                    }}
                  >
                    {accounts.length === 0 ? (
                      <option value="">Loading accounts...</option>
                    ) : (
                      accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} - {formatCurrency(account.balance)}
                        </option>
                      ))
                    )}
                  </select>
                  {fromAccount && (
                    <p className="mt-2 text-sm text-gray-600">
                      Available balance: {formatCurrency(fromAccount.balance)}
                    </p>
                  )}
                </div>

                {/* To Account (Internal) or Dummy User (External) */}
                {transferType === 'internal' ? (
                  <div className="relative">
                    <label
                      htmlFor="toAccountId"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      To Account
                    </label>
                    <select
                      id="toAccountId"
                      name="toAccountId"
                      value={formData.toAccountId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] focus:border-transparent text-base appearance-none bg-white cursor-pointer pr-10"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '12px',
                      }}
                    >
                      <option value="">Select destination account</option>
                      {accounts
                        .filter((acc) => acc.id !== formData.fromAccountId)
                        .map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.name} - {formatCurrency(account.balance)}
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div className="relative">
                    <label
                      htmlFor="toDummyUserId"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Send To
                    </label>
                    <select
                      id="toDummyUserId"
                      name="toDummyUserId"
                      value={formData.toDummyUserId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] focus:border-transparent text-base appearance-none bg-white cursor-pointer pr-10"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '12px',
                      }}
                    >
                      <option value="">Select recipient</option>
                      {dummyUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} - {user.accountNumber} ({user.bank})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Amount Input with Visual Formatting */}
                <div>
                  <label
                    htmlFor="amount"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-base sm:text-lg font-medium">
                      $
                    </span>
                    <input
                      type="text"
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleAmountChange}
                      placeholder="0.00"
                      className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-3 sm:py-4 text-xl sm:text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] focus:border-[#172030]"
                    />
                  </div>
                  
                  {/* Formatted Amount Display */}
                  {formattedAmount && (
                    <div className="mt-3 p-3 sm:p-4 bg-[#172030]/5 border border-[#172030]/20 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Amount to transfer</p>
                      <p className="text-xl sm:text-2xl font-bold text-[#172030]">
                        ${formattedAmount}
                      </p>
                    </div>
                  )}

                  {/* Balance Preview */}
                  {fromAccount && formData.amount && !isNaN(parseFloat(formData.amount)) && (
                    <div className="mt-3 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-gray-600">Current Balance</span>
                        <span className="text-base sm:text-lg font-semibold text-gray-900">
                          {formatCurrency(fromAccount.balance)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                        <span className="text-xs sm:text-sm text-gray-600">New Balance</span>
                        <span className="text-base sm:text-lg font-semibold text-red-600">
                          {formatCurrency(fromAccount.balance - parseFloat(formData.amount))}
                        </span>
                      </div>
                      {transferType === 'internal' && toAccount && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Recipient will receive</p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-gray-600">{toAccount.name} Balance</span>
                            <span className="text-base sm:text-lg font-semibold text-gray-900">
                              {formatCurrency(toAccount.balance)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs sm:text-sm text-gray-600">New Balance</span>
                            <span className="text-base sm:text-lg font-semibold text-green-600">
                              {formatCurrency(toAccount.balance + parseFloat(formData.amount))}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="mt-2 text-xs text-gray-500">
                    Maximum 2 decimal places
                  </p>
                </div>

                {/* Category/Reason Selection */}
                <div className="relative">
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Transfer Reason / Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] focus:border-transparent text-base appearance-none bg-white cursor-pointer pr-10"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.75rem center',
                      backgroundSize: '12px',
                    }}
                  >
                    {TRANSACTION_CATEGORIES.filter(cat => 
                      cat.value !== 'Funding' // Don't show Funding for transfers
                    ).map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Select a category to help organize your transactions
                  </p>
                </div>

              {/* Error Message */}
              {formError && (
                <div
                  className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                  role="alert"
                >
                  {formError}
                </div>
              )}

              {/* Continue Button */}
              <button
                type="button"
                onClick={handleContinue}
                disabled={isProcessing}
                className={`w-full px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-medium transition-opacity text-base sm:text-lg ${
                  isProcessing
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-[#172030] text-white hover:opacity-90 active:opacity-80'
                }`}
              >
                {isProcessing ? 'Processing...' : 'Continue'}
              </button>
              </div>
            </>
          )}

          {step === 'processing' && (
            <div className="text-center py-8 sm:py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-[#172030] border-t-transparent mb-4"></div>
              <p className="text-sm sm:text-base text-gray-600">Processing your transfer...</p>
            </div>
          )}
        </div>
      </div>

      {/* PIN Modal */}
      <PINModal
        isOpen={step === 'pin'}
        onClose={handlePINClose}
        onComplete={handlePINComplete}
        title="Enter PIN to Confirm Transfer"
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={step === 'success'}
        message={
          transferType === 'internal'
            ? `Successfully transferred ${formatCurrency(parseFloat(formData.amount))} to ${toAccount?.name || 'account'}!`
            : `Successfully sent ${formatCurrency(parseFloat(formData.amount))} to ${selectedDummyUser?.name || 'recipient'}!`
        }
        onClose={() => {}}
        redirectTo="/"
        redirectDelay={2000}
      />

      {/* Error Banner (non-blocking) */}
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
    </Layout>
  );
};

export default Transfer;
