import { useState } from 'react';
import { useWalletStore } from '../../store/useWalletStore';
import { TRANSACTION_CATEGORIES } from '../../utils/categories';
import FilterModal from './FilterModal';

const Filters = () => {
  const filters = useWalletStore((state) => state.filters);
  const setFilters = useWalletStore((state) => state.setFilters);
  const transactions = useWalletStore((state) => state.transactions);
  const clearFilters = useWalletStore((state) => state.clearFilters);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get unique categories from transactions, but use predefined categories for display
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

  // Count active filters for badge
  const activeFilterCount = [
    filters.category,
    filters.dateFrom,
    filters.dateTo,
    filters.merchant
  ].filter(Boolean).length;

  return (
    <>
      {/* Mobile: Filter Button */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          aria-label="Open filters"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 bg-[#172030] text-white text-xs font-medium rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Desktop: Full Filter Bar */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4 mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4 items-stretch sm:items-end">
          {/* Category Filter */}
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="category-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Category
            </label>
            <select
              id="category-filter"
              value={filters.category}
              onChange={(e) => setFilters({ category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030]"
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

          {/* Date From */}
          <div className="flex-1 min-w-[150px]">
            <label
              htmlFor="date-from"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              From Date
            </label>
            <input
              id="date-from"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030]"
              aria-label="Filter from date"
            />
          </div>

          {/* Date To */}
          <div className="flex-1 min-w-[150px]">
            <label
              htmlFor="date-to"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              To Date
            </label>
            <input
              id="date-to"
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030]"
              aria-label="Filter to date"
              min={filters.dateFrom || undefined}
            />
          </div>

          {/* Merchant Search */}
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="merchant-search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search Merchant
            </label>
            <div className="relative">
              <input
                id="merchant-search"
                type="text"
                value={filters.merchant}
                onChange={(e) => setFilters({ merchant: e.target.value })}
                placeholder="Search by merchant name..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030]"
                aria-label="Search by merchant"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div>
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                aria-label="Clear all filters"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal for Mobile */}
      <FilterModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default Filters;
