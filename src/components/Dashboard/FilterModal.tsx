import { useEffect, useMemo } from 'react';
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

  // Get all unique tags from transactions
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    transactions.forEach((t) => {
      if (t.tags && t.tags.length > 0) {
        t.tags.forEach((tag) => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }, [transactions]);

  const hasActiveFilters =
    filters.category ||
    filters.categories?.length > 0 ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.merchant ||
    filters.amountMin ||
    filters.amountMax ||
    filters.tags?.length > 0 ||
    filters.searchQuery;

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
          {/* Global Search */}
          <div>
            <label
              htmlFor="modal-global-search"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Global Search
            </label>
            <div className="relative">
              <input
                id="modal-global-search"
                type="text"
                value={filters.searchQuery || ''}
                onChange={(e) => setFilters({ searchQuery: e.target.value })}
                placeholder="Search transactions, merchants, notes, tags..."
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] text-sm sm:text-base"
                aria-label="Global search"
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
              value={filters.category || ''}
              onChange={(e) => setFilters({ category: e.target.value, categories: [] })}
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

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div>
              <label
                htmlFor="modal-tags-filter"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tags
              </label>
              <select
                id="modal-tags-filter"
                multiple
                value={filters.tags || []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                  setFilters({ tags: selected });
                }}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] text-sm sm:text-base min-h-[100px]"
                aria-label="Filter by tags"
                size={4}
              >
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold to select multiple</p>
            </div>
          )}

          {/* Amount Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="modal-amount-min"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Min Amount
              </label>
              <input
                id="modal-amount-min"
                type="number"
                step="0.01"
                min="0"
                value={filters.amountMin || ''}
                onChange={(e) => setFilters({ amountMin: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] text-sm sm:text-base"
                aria-label="Minimum amount"
              />
            </div>
            <div>
              <label
                htmlFor="modal-amount-max"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Max Amount
              </label>
              <input
                id="modal-amount-max"
                type="number"
                step="0.01"
                min="0"
                value={filters.amountMax || ''}
                onChange={(e) => setFilters({ amountMax: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] text-sm sm:text-base"
                aria-label="Maximum amount"
              />
            </div>
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
                value={filters.merchant || ''}
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

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
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
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters({ dateFrom: e.target.value })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] text-sm sm:text-base"
                aria-label="Filter from date"
              />
            </div>
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
                value={filters.dateTo || ''}
                onChange={(e) => setFilters({ dateTo: e.target.value })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] text-sm sm:text-base"
                aria-label="Filter to date"
                min={filters.dateFrom || undefined}
              />
            </div>
          </div>

          {/* Active Filters Badge */}
          {hasActiveFilters && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2 font-medium">Active Filters:</p>
              <div className="flex flex-wrap gap-2">
                {filters.category && (
                  <span className="px-2 py-1 bg-[#172030]/10 text-[#172030] rounded text-xs font-medium">
                    Category: {availableCategories.find(c => c.value === filters.category)?.label || filters.category}
                  </span>
                )}
                {filters.categories && filters.categories.length > 0 && (
                  <span className="px-2 py-1 bg-[#172030]/10 text-[#172030] rounded text-xs font-medium">
                    Categories: {filters.categories.length}
                  </span>
                )}
                {filters.tags && filters.tags.length > 0 && (
                  <span className="px-2 py-1 bg-[#172030]/10 text-[#172030] rounded text-xs font-medium">
                    Tags: {filters.tags.length}
                  </span>
                )}
                {filters.amountMin && (
                  <span className="px-2 py-1 bg-[#172030]/10 text-[#172030] rounded text-xs font-medium">
                    Min: ${filters.amountMin}
                  </span>
                )}
                {filters.amountMax && (
                  <span className="px-2 py-1 bg-[#172030]/10 text-[#172030] rounded text-xs font-medium">
                    Max: ${filters.amountMax}
                  </span>
                )}
                {filters.merchant && (
                  <span className="px-2 py-1 bg-[#172030]/10 text-[#172030] rounded text-xs font-medium">
                    Merchant: {filters.merchant}
                  </span>
                )}
                {filters.searchQuery && (
                  <span className="px-2 py-1 bg-[#172030]/10 text-[#172030] rounded text-xs font-medium">
                    Search: {filters.searchQuery}
                  </span>
                )}
                {filters.dateFrom && (
                  <span className="px-2 py-1 bg-[#172030]/10 text-[#172030] rounded text-xs font-medium">
                    From: {new Date(filters.dateFrom).toLocaleDateString()}
                  </span>
                )}
                {filters.dateTo && (
                  <span className="px-2 py-1 bg-[#172030]/10 text-[#172030] rounded text-xs font-medium">
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

