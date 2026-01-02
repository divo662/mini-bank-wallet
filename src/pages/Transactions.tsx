import { useEffect, useState } from 'react';
import Layout from '../components/Layout/Layout';
import TransactionTable from '../components/Dashboard/TransactionTable';
import Filters from '../components/Dashboard/Filters';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useWalletStore } from '../store/useWalletStore';
import { exportToCSV, exportToPDF, generateExportFilename } from '../utils/export';

const Transactions = () => {
  const setAccounts = useWalletStore((state) => state.setAccounts);
  const setTransactions = useWalletStore((state) => state.setTransactions);
  const accounts = useWalletStore((state) => state.accounts);
  const transactions = useWalletStore((state) => state.transactions);
  const isLoading = useWalletStore((state) => state.isLoading);
  const error = useWalletStore((state) => state.error);
  const setLoading = useWalletStore((state) => state.setLoading);
  const setError = useWalletStore((state) => state.setError);
  const getFilteredTransactions = useWalletStore((state) => state.getFilteredTransactions);
  
  const [retryCount, setRetryCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Check if store already has data (loaded from localStorage on initialization)
        // If store has data, we don't need to reload - it's already persisted
        if (accounts.length > 0 && transactions.length > 0) {
          // Store already has data from localStorage, no need to reload
          setIsInitialLoad(false);
          setLoading(false);
          return;
        }

        // Load accounts - only fetch from JSON if both store and localStorage are empty
        let accountsData: any[] = [];
        if (accounts.length > 0) {
          // Store already has data, use it
          accountsData = accounts;
        } else {
          try {
            const stored = localStorage.getItem('wallet_accounts');
            if (stored) {
              accountsData = JSON.parse(stored);
            } else {
              // Only fetch from JSON if localStorage is also empty (first time user)
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
              try {
                localStorage.setItem('wallet_accounts', JSON.stringify(accountsData));
              } catch (storageError) {
                console.warn('Failed to save accounts to localStorage', storageError);
              }
            }
          }
        }

        if (accountsData.length === 0) {
          throw new Error('No accounts found');
        }

        // Only update accounts if they're different
        if (accounts.length === 0 || JSON.stringify(accountsData) !== JSON.stringify(accounts)) {
          setAccounts(accountsData);
        }

        // Load transactions - only fetch from JSON if both store and localStorage are empty
        let transactionsData: any[] = [];
        if (transactions.length > 0) {
          // Store already has data, use it
          transactionsData = transactions;
        } else {
          try {
            const stored = localStorage.getItem('wallet_transactions');
            if (stored) {
              transactionsData = JSON.parse(stored);
            } else {
              // Only fetch from JSON if localStorage is also empty (first time user)
              const transactionsResponse = await fetch('/transactions.json');
              if (transactionsResponse.ok) {
                transactionsData = await transactionsResponse.json();
                // Save to localStorage will be handled by setTransactions
              }
            }
          } catch (e) {
            console.warn('Failed to load transactions', e);
            const transactionsResponse = await fetch('/transactions.json');
            if (transactionsResponse.ok) {
              transactionsData = await transactionsResponse.json();
            }
          }
        }

        // Only update transactions if they're different
        if (transactions.length === 0 || JSON.stringify(transactionsData) !== JSON.stringify(transactions)) {
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

  const handleExportCSV = () => {
    try {
      setIsExporting(true);
      const filtered = getFilteredTransactions();
      const filename = generateExportFilename(filtered, 'csv');
      exportToCSV(filtered, filename);
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export transactions. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const filtered = getFilteredTransactions();
      const filename = generateExportFilename(filtered, 'pdf');
      await exportToPDF(filtered, filename);
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export transactions. Please try again.');
    } finally {
      setIsExporting(false);
    }
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-1 sm:mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">All Transactions</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">View and filter all your transaction history</p>
            </div>
            {/* Export Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={handleExportCSV}
                disabled={isExporting}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Export to CSV"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </button>
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Export to PDF"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Export PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>
            </div>
          </div>
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
