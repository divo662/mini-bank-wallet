import { useState, useEffect } from 'react';
import type { Transaction } from '../../types';
import { formatCurrency } from '../../utils/validation';
import { format } from 'date-fns';
import { useWalletStore } from '../../store/useWalletStore';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

const TransactionDetailModal = ({ transaction, onClose }: TransactionDetailModalProps) => {
  const updateTransaction = useWalletStore((state) => state.updateTransaction);
  const getAccountById = useWalletStore((state) => state.getAccountById);
  const transactions = useWalletStore((state) => state.transactions);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Get the latest transaction from store to ensure we have the most up-to-date data
  const currentTransaction = transaction
    ? transactions.find((t) => t.id === transaction.id) || transaction
    : null;

  useEffect(() => {
    if (currentTransaction) {
      setNotes(currentTransaction.notes || '');
      setTags(currentTransaction.tags || []);
    }
  }, [currentTransaction]);

  if (!currentTransaction) return null;

  const account = getAccountById(currentTransaction.accountId);

  const handleSaveNotes = () => {
    if (currentTransaction) {
      updateTransaction(currentTransaction.id, { notes: notes.trim() });
      setIsEditingNotes(false);
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && currentTransaction) {
      const newTags = [...tags, trimmedTag];
      setTags(newTags);
      updateTransaction(currentTransaction.id, { tags: newTags });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (currentTransaction) {
      const newTags = tags.filter((tag) => tag !== tagToRemove);
      setTags(newTags);
      updateTransaction(currentTransaction.id, { tags: newTags });
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

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
                currentTransaction.type === 'credit'
                  ? 'bg-green-100'
                  : 'bg-red-100'
              }`}
            >
              {currentTransaction.type === 'credit' ? (
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
                currentTransaction.type === 'credit'
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {currentTransaction.type === 'credit' ? '+' : '-'}
              {formatCurrency(currentTransaction.amount)}
            </p>
          </div>

          {/* Details */}
          <div className="space-y-2.5 sm:space-y-3 border-t border-gray-200 pt-3 sm:pt-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-0">
              <span className="text-xs text-gray-600">Merchant</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 break-words text-right sm:text-left">
                {currentTransaction.merchant}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-0">
              <span className="text-xs text-gray-600">Category</span>
              <span className="px-2 py-0.5 bg-[#172030]/10 text-[#172030] rounded-full text-xs font-medium w-fit sm:w-auto">
                {currentTransaction.category}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-0">
              <span className="text-xs text-gray-600">Date</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 break-words text-right sm:text-left">
                {currentTransaction.timestamp
                  ? format(new Date(currentTransaction.timestamp), 'EEEE, MMMM d, yyyy')
                  : format(new Date(currentTransaction.date), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-0">
              <span className="text-xs text-gray-600">Time</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900">
                {currentTransaction.timestamp
                  ? format(new Date(currentTransaction.timestamp), 'h:mm:ss a')
                  : format(new Date(currentTransaction.date + 'T00:00:00'), 'h:mm a')}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-0">
              <span className="text-xs text-gray-600">Type</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium w-fit sm:w-auto ${
                  currentTransaction.type === 'credit'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {currentTransaction.type === 'credit' ? 'Credit' : 'Debit'}
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
                {currentTransaction.runningBalance !== undefined
                  ? formatCurrency(currentTransaction.runningBalance)
                  : 'N/A'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-0">
              <span className="text-xs text-gray-600">Transaction ID</span>
              <span className="text-xs font-mono text-gray-500 break-all text-right sm:text-left">
                {currentTransaction.id}
              </span>
            </div>

            {/* Notes Section */}
            <div className="border-t border-gray-200 pt-3 sm:pt-4 mt-3 sm:mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600 font-medium">Notes</span>
                {!isEditingNotes ? (
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className="text-xs text-[#172030] hover:underline"
                  >
                    {notes ? 'Edit' : 'Add'}
                  </button>
                ) : (
                  <button
                    onClick={handleSaveNotes}
                    className="text-xs text-[#172030] hover:underline"
                  >
                    Save
                  </button>
                )}
              </div>
              {isEditingNotes ? (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this transaction..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] resize-none"
                  rows={3}
                  autoFocus
                  onBlur={handleSaveNotes}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsEditingNotes(false);
                      setNotes(currentTransaction.notes || '');
                    }
                  }}
                />
              ) : (
                <p className="text-xs sm:text-sm text-gray-900 whitespace-pre-wrap min-h-[3rem]">
                  {notes || <span className="text-gray-400 italic">No notes added</span>}
                </p>
              )}
            </div>

            {/* Tags Section */}
            <div className="border-t border-gray-200 pt-3 sm:pt-4 mt-3 sm:mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600 font-medium">Tags</span>
                {!isEditingTags && (
                  <button
                    onClick={() => setIsEditingTags(true)}
                    className="text-xs text-[#172030] hover:underline"
                  >
                    {tags.length > 0 ? 'Edit' : 'Add'}
                  </button>
                )}
              </div>
              {isEditingTags ? (
                <div className="space-y-2">
                  {/* Existing Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-[#172030]/10 text-[#172030] rounded-full text-xs font-medium"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-red-600 transition-colors"
                            aria-label={`Remove tag ${tag}`}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Add Tag Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      placeholder="Add a tag..."
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030]"
                    />
                    <button
                      onClick={handleAddTag}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-[#172030] rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingTags(false);
                        setTagInput('');
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 min-h-[2rem]">
                  {tags.length > 0 ? (
                    tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 bg-[#172030]/10 text-[#172030] rounded-full text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">No tags added</span>
                  )}
                </div>
              )}
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
