import type { Transaction } from '../../types';
import { formatCurrency } from '../../utils/validation';
import { format } from 'date-fns';
import { useWalletStore } from '../../store/useWalletStore';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

const TransactionDetailModal = ({ transaction, onClose }: TransactionDetailModalProps) => {
  if (!transaction) return null;

  const account = useWalletStore((state) =>
    state.getAccountById(transaction.accountId)
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl max-w-sm w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 flex-shrink-0 bg-white rounded-t-2xl sm:rounded-t-xl">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Transaction Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 active:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* Transaction Icon */}
          <div className="flex justify-center mb-3 sm:mb-4">
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center ${
                transaction.type === 'credit'
                  ? 'bg-green-100'
                  : 'bg-red-100'
              }`}
            >
              {transaction.type === 'credit' ? (
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              ) : (
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="text-center mb-3 sm:mb-4">
            <p className="text-xs text-gray-600 mb-1">Amount</p>
            <p
              className={`text-2xl sm:text-3xl font-bold ${
                transaction.type === 'credit'
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {transaction.type === 'credit' ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </p>
          </div>

          {/* Details */}
          <div className="space-y-2.5 sm:space-y-3 border-t border-gray-200 pt-3 sm:pt-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-0">
              <span className="text-xs text-gray-600">Merchant</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 break-words text-right sm:text-left">
                {transaction.merchant}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-0">
              <span className="text-xs text-gray-600">Category</span>
              <span className="px-2 py-0.5 bg-[#172030]/10 text-[#172030] rounded-full text-xs font-medium w-fit sm:w-auto">
                {transaction.category}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-0">
              <span className="text-xs text-gray-600">Date</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 break-words text-right sm:text-left">
                {transaction.timestamp
                  ? format(new Date(transaction.timestamp), 'EEEE, MMMM d, yyyy')
                  : format(new Date(transaction.date), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-0">
              <span className="text-xs text-gray-600">Time</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900">
                {transaction.timestamp
                  ? format(new Date(transaction.timestamp), 'h:mm:ss a')
                  : format(new Date(transaction.date + 'T00:00:00'), 'h:mm a')}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-0">
              <span className="text-xs text-gray-600">Type</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium w-fit sm:w-auto ${
                  transaction.type === 'credit'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {transaction.type === 'credit' ? 'Credit' : 'Debit'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-0">
              <span className="text-xs text-gray-600">Account</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 break-words text-right sm:text-left">
                {account?.name || 'Unknown'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-0">
              <span className="text-xs text-gray-600">Running Balance</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900">
                {transaction.runningBalance !== undefined
                  ? formatCurrency(transaction.runningBalance)
                  : 'N/A'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-0">
              <span className="text-xs text-gray-600">Transaction ID</span>
              <span className="text-xs font-mono text-gray-500 break-all text-right sm:text-left">
                {transaction.id}
              </span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="p-3 sm:p-4 border-t border-gray-200 flex-shrink-0 bg-gray-50 sm:bg-white rounded-b-2xl sm:rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full bg-[#172030] hover:opacity-90 active:opacity-80 text-white py-2.5 sm:py-3 px-4 rounded-lg font-medium transition-opacity text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;
