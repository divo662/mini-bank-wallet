import { useEffect } from 'react';
import { useWalletStore } from '../../store/useWalletStore';
import { TRANSACTION_CATEGORIES } from '../../utils/categories';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FilterModal = ({ isOpen, onClose }: FilterModalProps) => {
  const filters = useWalletStore((state) => state.filters);
  const setFilters = useWalletStore((state) => state.setFilters);
  const transactions = useWalletStore((state) => state.transactions);
  const clearFilters = useWalletStore((state) => state.clearFilters);

  // Get unique categories from transactions
  const transactionCategories = Array.from(
    new Set(transactions.map((t) => t.category))
  );
  
  // Combine predefined categories with any custom categories from transactions
  const availableCategories = TRANSACTION_CATEGORIES.filter(cat => 
    transactionCategories.includes(cat.value) || 
    cat.value === 'Transfer' || 
    cat.value === 'Funding'
  );

  const hasActiveFilters =
    filters.category || filters.dateFrom || filters.dateTo || filters.merchant;

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApply = () => {
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl sm:rounded-t-2xl flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Filter Transactions</h2>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 sm:space-y-4">
          {/* Category Filter */}
          <div>
            <label
              htmlFor="modal-category-filter"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Category
            </label>
            <select
              id="modal-category-filter"
              value={filters.category}
              onChange={(e) => setFilters({ category: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] text-sm sm:text-base"
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {availableCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Merchant Search */}
          <div>
            <label
              htmlFor="modal-merchant-search"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Search Merchant
            </label>
            <div className="relative">
              <input
                id="modal-merchant-search"
                type="text"
                value={filters.merchant}
                onChange={(e) => setFilters({ merchant: e.target.value })}
                placeholder="Search by merchant name..."
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] text-sm sm:text-base"
                aria-label="Search by merchant"
              />
              <svg
                className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Date From */}
          <div>
            <label
              htmlFor="modal-date-from"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              From Date
            </label>
            <input
              id="modal-date-from"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ dateFrom: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] text-sm sm:text-base"
              aria-label="Filter from date"
            />
          </div>

          {/* Date To */}
          <div>
            <label
              htmlFor="modal-date-to"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              To Date
            </label>
            <input
              id="modal-date-to"
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ dateTo: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] text-sm sm:text-base"
              aria-label="Filter to date"
              min={filters.dateFrom || undefined}
            />
          </div>

          {/* Active Filters Badge */}
          {hasActiveFilters && (
            <div className="pt-2">
              <p className="text-xs text-gray-500 mb-2">Active Filters:</p>
              <div className="flex flex-wrap gap-2">
                {filters.category && (
                  <span className="px-3 py-1 bg-[#172030]/10 text-[#172030] rounded-full text-xs font-medium">
                    Category: {availableCategories.find(c => c.value === filters.category)?.label || filters.category}
                  </span>
                )}
                {filters.merchant && (
                  <span className="px-3 py-1 bg-[#172030]/10 text-[#172030] rounded-full text-xs font-medium">
                    Merchant: {filters.merchant}
                  </span>
                )}
                {filters.dateFrom && (
                  <span className="px-3 py-1 bg-[#172030]/10 text-[#172030] rounded-full text-xs font-medium">
                    From: {new Date(filters.dateFrom).toLocaleDateString()}
                  </span>
                )}
                {filters.dateTo && (
                  <span className="px-3 py-1 bg-[#172030]/10 text-[#172030] rounded-full text-xs font-medium">
                    To: {new Date(filters.dateTo).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl sm:rounded-b-2xl flex gap-2 sm:gap-3 flex-shrink-0">
          {hasActiveFilters && (
            <button
              onClick={() => {
                clearFilters();
              }}
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-colors"
              aria-label="Clear all filters"
            >
              Clear All
            </button>
          )}
          <button
            onClick={handleApply}
            className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-[#172030] text-white rounded-lg font-medium hover:opacity-90 active:opacity-80 transition-opacity text-sm sm:text-base"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;

