import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../store/useWalletStore';
import Layout from '../components/Layout/Layout';
import { formatCurrency } from '../utils/validation';
import { TRANSACTION_CATEGORIES } from '../utils/categories';
import type { Transaction } from '../types';
import PINModal from '../components/Common/PINModal';
import SuccessModal from '../components/Common/SuccessModal';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const FundWallet = () => {
  const navigate = useNavigate();
  const accounts = useWalletStore((state) => state.accounts);
  const isLoading = useWalletStore((state) => state.isLoading);
  const error = useWalletStore((state) => state.error);
  const setLoading = useWalletStore((state) => state.setLoading);
  const setError = useWalletStore((state) => state.setError);
  const setAccounts = useWalletStore((state) => state.setAccounts);
  const updateAccountBalance = useWalletStore(
    (state) => state.updateAccountBalance
  );
  const addTransaction = useWalletStore((state) => state.addTransaction);
  const removeTransaction = useWalletStore((state) => state.removeTransaction);
  
  const [retryCount, setRetryCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [step, setStep] = useState<'amount' | 'pin' | 'processing' | 'success'>('amount');
  const [formData, setFormData] = useState({
    accountId: '',
    amount: '',
    category: 'Funding',
  });
  const [formattedAmount, setFormattedAmount] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Default to Main account if available
  const mainAccount = accounts.find((acc) => acc.id === 'main') || accounts[0];
  const selectedAccount = accounts.find((acc) => acc.id === formData.accountId) || mainAccount;

  // Load accounts on mount
  useEffect(() => {
    const loadAccounts = async () => {
      setLoading(true);
      setError(null);

      try {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 300));

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
        setIsInitialLoad(false);
      } catch (error) {
        const errorMessage = 'Failed to load accounts. Please try again.';
        setError(errorMessage);
        console.error('FundWallet load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
  }, [setLoading, setError, setAccounts, retryCount]);

  // Set default account when accounts are loaded
  useEffect(() => {
    if (accounts.length > 0 && !formData.accountId) {
      const defaultAccount = accounts.find((acc) => acc.id === 'main') || accounts[0];
      if (defaultAccount) {
        setFormData((prev) => ({ ...prev, accountId: defaultAccount.id }));
      }
    }
  }, [accounts, formData.accountId]);

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

  const validateAmount = (): boolean => {
    const accountIdToCheck = formData.accountId || (mainAccount?.id || '');
    
    if (!accountIdToCheck) {
      setFormError('Please select an account');
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

    return true;
  };

  const handleContinue = () => {
    if (!validateAmount()) {
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

    const accountIdToUse = formData.accountId || (mainAccount?.id || '');
    const amount = parseFloat(formData.amount);
    const account = accounts.find((acc) => acc.id === accountIdToUse);

    if (!account) {
      setFormError('Account not found');
      setStep('amount');
      setIsProcessing(false);
      return;
    }

    // Store original balance for rollback
    const originalBalance = account.balance;
    const transactionId = `fund-${Date.now()}-${accountIdToUse}`;

    // Optimistic update: Update balance immediately
    updateAccountBalance(accountIdToUse, originalBalance + amount);

    // Create funding transaction with actual timestamp
    const now = new Date();
    const transaction: Transaction = {
      id: transactionId,
      date: now.toISOString().split('T')[0],
      timestamp: now.toISOString(),
      merchant: 'Wallet Funding',
      category: formData.category || 'Funding',
      amount: amount,
      type: 'credit',
      accountId: accountIdToUse,
    };

    // Add transaction optimistically
    addTransaction(transaction);

    // Simulate API call with 2 second delay
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In production, this would be an actual API call:
      // const response = await fetch('/api/fund-wallet', { 
      //   method: 'POST', 
      //   body: JSON.stringify({ accountId, amount, pin }) 
      // });
      // if (!response.ok) throw new Error('Funding failed');

      // Show success modal
      setStep('success');
      setIsProcessing(false);

      // Success modal will handle redirect
    } catch (error) {
      // Rollback on error
      updateAccountBalance(accountIdToUse, originalBalance);
      removeTransaction(transactionId);

      setFormError('Funding failed. Please try again.');
      setStep('amount');
      setIsProcessing(false);
    }
  };

  const handlePINClose = () => {
    setStep('amount');
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    setError(null);
  };

  if (isLoading && isInitialLoad) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading accounts..." />
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
      <div className="max-w-2xl mx-auto px-3 sm:px-4 md:px-6">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Fund Wallet</h1>
            <p className="text-sm sm:text-base text-gray-600">Add money to your wallet account</p>
          </div>

          {step === 'amount' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Account Selection */}
              <div>
                <label
                  htmlFor="accountId"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Select Account
                </label>
                <select
                  id="accountId"
                  name="accountId"
                  value={formData.accountId || (mainAccount?.id || '')}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, accountId: e.target.value }));
                    if (formError) setFormError(null);
                  }}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] focus:border-transparent text-base"
                  required
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
              </div>

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
                    aria-label="Amount"
                  />
                </div>
                
                {/* Formatted Amount Display */}
                {formattedAmount && (
                  <div className="mt-3 p-3 sm:p-4 bg-[#172030]/5 border border-[#172030]/20 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Amount to fund</p>
                    <p className="text-xl sm:text-2xl font-bold text-[#172030]">
                      ${formattedAmount}
                    </p>
                  </div>
                )}

                {selectedAccount && (
                  <div className="mt-3 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Current Balance</span>
                      <span className="text-base sm:text-lg font-semibold text-gray-900">
                        {formatCurrency(selectedAccount.balance)}
                      </span>
                    </div>
                    {formData.amount && !isNaN(parseFloat(formData.amount)) && (
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                        <span className="text-xs sm:text-sm text-gray-600">New Balance</span>
                        <span className="text-base sm:text-lg font-semibold text-green-600">
                          {formatCurrency(selectedAccount.balance + parseFloat(formData.amount))}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <p className="mt-2 text-xs text-gray-500">
                  Maximum 2 decimal places
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
                disabled={step === 'processing' || isProcessing}
                className={`w-full px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-medium transition-opacity text-base sm:text-lg ${
                  step === 'processing' || isProcessing
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-[#172030] text-white hover:opacity-90 active:opacity-80'
                }`}
              >
                {step === 'processing' || isProcessing ? 'Processing...' : 'Continue'}
              </button>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-8 sm:py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-[#172030] border-t-transparent mb-4"></div>
              <p className="text-sm sm:text-base text-gray-600">Processing your funding request...</p>
            </div>
          )}
        </div>
      </div>

      {/* PIN Modal */}
      <PINModal
        isOpen={step === 'pin'}
        onClose={handlePINClose}
        onComplete={handlePINComplete}
        title="Enter PIN"
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={step === 'success'}
        message="Your wallet has been funded successfully!"
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

export default FundWallet;
