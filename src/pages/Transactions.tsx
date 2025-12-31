import { useEffect, useState } from 'react';
import Layout from '../components/Layout/Layout';
import TransactionTable from '../components/Dashboard/TransactionTable';
import Filters from '../components/Dashboard/Filters';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useWalletStore } from '../store/useWalletStore';

const Transactions = () => {
  const setAccounts = useWalletStore((state) => state.setAccounts);
  const setTransactions = useWalletStore((state) => state.setTransactions);
  const isLoading = useWalletStore((state) => state.isLoading);
  const error = useWalletStore((state) => state.error);
  const setLoading = useWalletStore((state) => state.setLoading);
  const setError = useWalletStore((state) => state.setError);
  
  const [retryCount, setRetryCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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

        // Load transactions
        let transactionsData: any[] = [];
        try {
          const stored = localStorage.getItem('wallet_transactions');
          if (stored) {
            transactionsData = JSON.parse(stored);
          } else {
            const transactionsResponse = await fetch('/transactions.json');
            if (transactionsResponse.ok) {
              transactionsData = await transactionsResponse.json();
            }
          }
        } catch (e) {
          console.warn('Failed to load transactions', e);
          const transactionsResponse = await fetch('/transactions.json');
          if (transactionsResponse.ok) {
            transactionsData = await transactionsResponse.json();
          }
        }

        if (accountsData.length > 0) {
          setTransactions(transactionsData);
        } else {
          setTransactions(transactionsData);
        }

        setIsInitialLoad(false);
      } catch (error) {
        const errorMessage = 'Failed to load transactions. Please try again.';
        setError(errorMessage);
        console.error('Transactions load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setAccounts, setTransactions, setLoading, setError, retryCount]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    setError(null);
  };

  if (isLoading && isInitialLoad) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading transactions..." />
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
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">All Transactions</h1>
          <p className="text-sm sm:text-base text-gray-600">View and filter all your transaction history</p>
        </div>

        {/* Filters */}
        <Filters />

        {/* Transaction Table */}
        <TransactionTable />

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
      </div>
    </Layout>
  );
};

export default Transactions;
