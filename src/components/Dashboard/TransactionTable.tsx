import { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useWalletStore } from '../../store/useWalletStore';
import { formatCurrency } from '../../utils/validation';
import { getCategoryLabel } from '../../utils/categories';
import { format, subDays } from 'date-fns';
import type { Transaction } from '../../types';
import TransactionDetailModal from './TransactionDetailModal';

interface TransactionTableProps {
  showAll?: boolean;
}

const ITEMS_PER_PAGE = 10;

const TransactionTable = ({}: TransactionTableProps = {}) => {
  const location = useLocation();
  const isTransactionsPage = location.pathname === '/transactions';
  const transactions = useWalletStore((state) => state.transactions);
  const filters = useWalletStore((state) => state.filters);
  const [timePeriod, setTimePeriod] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const getFilteredTransactions = useWalletStore((state) => state.getFilteredTransactions);

  const filteredTransactions = useMemo(() => {
    // Start with filtered transactions from store (includes all new filters)
    let filtered = getFilteredTransactions();

    // Apply time period filter (only if a period is selected)
    if (timePeriod && timePeriod !== '') {
      const days = parseInt(timePeriod);
      if (!isNaN(days)) {
        const cutoffDate = subDays(new Date(), days).toISOString().split('T')[0];
        filtered = filtered.filter((t) => t.date >= cutoffDate);
      }
    }

    // Sort by date (newest first) - use timestamp if available for accurate sorting
    filtered = filtered.sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : new Date(a.date).getTime();
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : new Date(b.date).getTime();
      return dateB - dateA; // Newest first
    });

    return filtered;
  }, [
    transactions,
    filters.category,
    filters.categories,
    filters.merchant,
    filters.dateFrom,
    filters.dateTo,
    filters.amountMin,
    filters.amountMax,
    filters.tags,
    filters.searchQuery,
    timePeriod,
  ]);

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    filters.category,
    filters.categories,
    filters.merchant,
    filters.dateFrom,
    filters.dateTo,
    filters.amountMin,
    filters.amountMax,
    filters.tags,
    filters.searchQuery,
    timePeriod,
  ]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of transaction list
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 px-3 sm:px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base md:text-lg font-semibold text-gray-900">
              {isTransactionsPage ? 'All Transactions' : 'Last Transactions'}
            </h2>
            {transactions.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
                {filteredTransactions.length !== transactions.length && ` (${transactions.length} total)`}
              </p>
            )}
          </div>
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="text-xs sm:text-sm text-gray-600 border border-gray-300 rounded-lg px-2 md:px-3 py-1.5 md:py-1 focus:outline-none focus:ring-2 focus:ring-[#172030] w-full sm:w-auto"
          >
            <option value="">All time</option>
            <option value="7">Transaction Overview: Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

                <div className="px-0 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
        <div className="space-y-0">
          {transactions.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p className="mb-2">No transactions loaded</p>
              <p className="text-xs text-gray-400">
                Please wait while transactions are being loaded...
              </p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p className="mb-2">No transactions found</p>
              <p className="text-xs text-gray-400">
                Try adjusting your filters or time period. Total transactions: {transactions.length}
              </p>
            </div>
          ) : (
              paginatedTransactions.map((transaction) => (
              <div
                key={transaction.id}
                onClick={() => setSelectedTransaction(transaction)}
                className="flex items-start sm:items-center justify-between py-3 md:py-4 px-3 sm:px-4 md:px-6 border-b border-gray-100 last:border-0 hover:bg-gray-50 active:bg-gray-100 transition-colors group cursor-pointer gap-3"
              >
                {/* Left Section: Icon and Details */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
                      transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'credit' ? (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                      )}
                    </div>
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    {/* Merchant Name - Full width on mobile */}
                    <div className="mb-1.5 sm:mb-1">
                      <p className="text-sm sm:text-base font-medium text-gray-900 break-words">
                        {transaction.merchant}
                      </p>
                    </div>
                    
                    {/* Category and Date - Stack on mobile, side by side on desktop */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 bg-[#172030]/10 text-[#172030] rounded text-xs font-medium w-fit">
                        {getCategoryLabel(transaction.category)}
                      </span>
                      <p className="text-xs text-gray-500">
                        {transaction.timestamp
                          ? format(new Date(transaction.timestamp), 'd MMM yyyy, h:mm a')
                          : format(new Date(transaction.date), 'd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Section: Amount and Arrow */}
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p
                      className={`text-base sm:text-lg font-semibold whitespace-nowrap ${
                        transaction.type === 'credit'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'credit' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </p>
                    {/* Running Balance - Hidden on mobile, shown on desktop */}
                    <p className="text-xs text-gray-500 hidden md:block mt-0.5">
                      {transaction.runningBalance !== undefined
                        ? `Balance: ${formatCurrency(transaction.runningBalance)}`
                        : 'Balance: Calculating...'}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-[#172030] transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredTransactions.length > ITEMS_PER_PAGE && (
          <div className="border-t border-gray-200 px-3 sm:px-4 md:px-6 py-3 md:py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Page Info */}
              <div className="text-xs sm:text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#172030] text-white hover:opacity-90 active:scale-95'
                  }`}
                  aria-label="Previous page"
                >
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden sm:inline">Previous</span>
                  </div>
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    const showPage =
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1);

                    if (!showPage) {
                      // Show ellipsis
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span key={page} className="px-2 text-gray-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`min-w-[2.5rem] px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          currentPage === page
                            ? 'bg-[#172030] text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
                        }`}
                        aria-label={`Go to page ${page}`}
                        aria-current={currentPage === page ? 'page' : undefined}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#172030] text-white hover:opacity-90 active:scale-95'
                  }`}
                  aria-label="Next page"
                >
                  <div className="flex items-center gap-1">
                    <span className="hidden sm:inline">Next</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
      
      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </>
  );
};

export default TransactionTable;

