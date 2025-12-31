import { useEffect, useState } from 'react';
import { useWalletStore } from '../store/useWalletStore';
import Layout from '../components/Layout/Layout';
import TotalAssets from '../components/Dashboard/TotalAssets';
import TransactionTable from '../components/Dashboard/TransactionTable';
import RightSidebar from '../components/Dashboard/RightSidebar';
import Filters from '../components/Dashboard/Filters';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const Dashboard = () => {
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
        // Load accounts from localStorage first, fallback to JSON
        let accountsData: any[] = [];
        let accountsError: Error | null = null;
        
        try {
          const stored = localStorage.getItem('wallet_accounts');
          if (stored) {
            accountsData = JSON.parse(stored);
          } else {
            // Fallback to JSON file if localStorage is empty
            const accountsResponse = await fetch('/accounts.json');
            if (!accountsResponse.ok) {
              throw new Error('Failed to load accounts');
            }
            accountsData = await accountsResponse.json();
            // Save to localStorage
            localStorage.setItem('wallet_accounts', JSON.stringify(accountsData));
          }
        } catch (e) {
          accountsError = e instanceof Error ? e : new Error('Failed to load accounts');
          console.warn('Failed to load accounts from localStorage, trying JSON file', e);
          // Fallback to JSON file
          try {
            const accountsResponse = await fetch('/accounts.json');
            if (accountsResponse.ok) {
              accountsData = await accountsResponse.json();
            } else {
              throw new Error('Accounts file not found');
            }
          } catch (fetchError) {
            throw accountsError;
          }
        }
        
        if (accountsData.length === 0) {
          throw new Error('No accounts found');
        }
        
        setAccounts(accountsData);

        // Load transactions from localStorage first, fallback to JSON
        let transactionsData: any[] = [];
        
        try {
          const stored = localStorage.getItem('wallet_transactions');
          if (stored) {
            transactionsData = JSON.parse(stored);
          } else {
            // Fallback to JSON file if localStorage is empty
            const transactionsResponse = await fetch('/transactions.json');
            if (!transactionsResponse.ok) {
              throw new Error('Failed to load transactions');
            }
            transactionsData = await transactionsResponse.json();
          }
        } catch (e) {
          console.warn('Failed to load transactions from localStorage, trying JSON file', e);
          // Fallback to JSON file
          try {
            const transactionsResponse = await fetch('/transactions.json');
            if (transactionsResponse.ok) {
              transactionsData = await transactionsResponse.json();
            }
          } catch (fetchError) {
            // Transactions are optional, so we don't throw here
            transactionsData = [];
          }
        }

        // Ensure transactions are set after accounts for running balance calculation
        if (accountsData.length > 0) {
          setTransactions(transactionsData);
        } else {
          setTransactions(transactionsData);
        }

        setIsInitialLoad(false);
      } catch (error) {
        const errorMessage = 'Failed to load wallet data. Please try again.';
        setError(errorMessage);
        console.error('Dashboard load error:', error);
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
          <LoadingSpinner size="lg" text="Loading your wallet..." />
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-3 md:space-y-4 lg:space-y-6">
          {/* Total Assets & Metrics */}
          <TotalAssets />

          {/* Filters */}
          <Filters />

          {/* Transaction Table */}
          <TransactionTable />
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1">
          <RightSidebar />
        </div>
      </div>

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

export default Dashboard;
