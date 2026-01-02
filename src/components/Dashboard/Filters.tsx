import { useState, useMemo } from 'react';
import { useWalletStore } from '../../store/useWalletStore';
import { TRANSACTION_CATEGORIES } from '../../utils/categories';
import { subDays, startOfMonth, format } from 'date-fns';
import FilterModal from './FilterModal';

const Filters = () => {
  const filters = useWalletStore((state) => state.filters);
  const setFilters = useWalletStore((state) => state.setFilters);
  const transactions = useWalletStore((state) => state.transactions);
  const clearFilters = useWalletStore((state) => state.clearFilters);
  const filterPresets = useWalletStore((state) => state.filterPresets);
  const saveFilterPreset = useWalletStore((state) => state.saveFilterPreset);
  const applyFilterPreset = useWalletStore((state) => state.applyFilterPreset);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPresetSave, setShowPresetSave] = useState(false);
  const [presetName, setPresetName] = useState('');

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

  // Count active filters for badge
  const activeFilterCount = [
    filters.category,
    filters.categories?.length > 0,
    filters.dateFrom,
    filters.dateTo,
    filters.merchant,
    filters.amountMin,
    filters.amountMax,
    filters.tags?.length > 0,
    filters.searchQuery,
  ].filter(Boolean).length;

  // Quick filter handlers
  const applyQuickFilter = (type: string) => {
    const today = new Date();
    switch (type) {
      case 'lastWeek':
        setFilters({
          dateFrom: format(subDays(today, 7), 'yyyy-MM-dd'),
          dateTo: format(today, 'yyyy-MM-dd'),
        });
        break;
      case 'thisMonth':
        setFilters({
          dateFrom: format(startOfMonth(today), 'yyyy-MM-dd'),
          dateTo: format(today, 'yyyy-MM-dd'),
        });
        break;
      case 'over100':
        setFilters({
          amountMin: '100',
        });
        break;
      case 'last30Days':
        setFilters({
          dateFrom: format(subDays(today, 30), 'yyyy-MM-dd'),
          dateTo: format(today, 'yyyy-MM-dd'),
        });
        break;
      case 'debits':
        setFilters({
          categories: ['Food', 'Shopping', 'Bills', 'Transport', 'Entertainment'],
        });
        break;
      case 'credits':
        setFilters({
          categories: ['Funding', 'Transfer'],
        });
        break;
      default:
        break;
    }
  };

  const handleSavePreset = () => {
    if (presetName.trim()) {
      saveFilterPreset(presetName.trim(), filters);
      setPresetName('');
      setShowPresetSave(false);
    }
  };

  return (
    <>
      {/* Quick Filter Chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => applyQuickFilter('lastWeek')}
          className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-[#172030] transition-colors"
        >
          Last Week
        </button>
        <button
          onClick={() => applyQuickFilter('thisMonth')}
          className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-[#172030] transition-colors"
        >
          This Month
        </button>
        <button
          onClick={() => applyQuickFilter('last30Days')}
          className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-[#172030] transition-colors"
        >
          Last 30 Days
        </button>
        <button
          onClick={() => applyQuickFilter('over100')}
          className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-[#172030] transition-colors"
        >
          Over $100
        </button>
        <button
          onClick={() => applyQuickFilter('debits')}
          className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-[#172030] transition-colors"
        >
          Debits
        </button>
        <button
          onClick={() => applyQuickFilter('credits')}
          className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-[#172030] transition-colors"
        >
          Credits
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 text-xs sm:text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Filter Presets */}
      {filterPresets.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <span className="text-xs sm:text-sm text-gray-600 font-medium">Presets:</span>
          {filterPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyFilterPreset(preset.id)}
              className="px-3 py-1.5 text-xs sm:text-sm font-medium text-[#172030] bg-[#172030]/10 border border-[#172030]/20 rounded-lg hover:bg-[#172030]/20 transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      )}

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
            <span className="text-sm font-medium text-gray-700">Advanced Filters</span>
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
        <div className="flex flex-col gap-4">
          {/* Global Search */}
          <div>
            <label
              htmlFor="global-search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Global Search
            </label>
            <div className="relative">
              <input
                id="global-search"
                type="text"
                value={filters.searchQuery || ''}
                onChange={(e) => setFilters({ searchQuery: e.target.value })}
                placeholder="Search transactions, merchants, notes, tags..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030]"
                aria-label="Global search"
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

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {/* Category Filter (Single - for backward compatibility) */}
            <div>
              <label
                htmlFor="category-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category
              </label>
              <select
                id="category-filter"
                value={filters.category || ''}
                onChange={(e) => setFilters({ category: e.target.value, categories: [] })}
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

            {/* Multiple Categories */}
            <div>
              <label
                htmlFor="categories-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Multiple Categories
              </label>
              <select
                id="categories-filter"
                multiple
                value={filters.categories || []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                  setFilters({ categories: selected, category: '' });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] min-h-[42px]"
                aria-label="Filter by multiple categories"
                size={3}
              >
                {availableCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>

            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div>
                <label
                  htmlFor="tags-filter"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tags
                </label>
                <select
                  id="tags-filter"
                  multiple
                  value={filters.tags || []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                    setFilters({ tags: selected });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] min-h-[42px]"
                  aria-label="Filter by tags"
                  size={3}
                >
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
              </div>
            )}

            {/* Date From */}
            <div>
              <label
                htmlFor="date-from"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                From Date
              </label>
              <input
                id="date-from"
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters({ dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030]"
                aria-label="Filter from date"
              />
            </div>

            {/* Date To */}
            <div>
              <label
                htmlFor="date-to"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                To Date
              </label>
              <input
                id="date-to"
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters({ dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030]"
                aria-label="Filter to date"
                min={filters.dateFrom || undefined}
              />
            </div>

            {/* Amount Min */}
            <div>
              <label
                htmlFor="amount-min"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Min Amount
              </label>
              <input
                id="amount-min"
                type="number"
                step="0.01"
                min="0"
                value={filters.amountMin || ''}
                onChange={(e) => setFilters({ amountMin: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030]"
                aria-label="Minimum amount"
              />
            </div>

            {/* Amount Max */}
            <div>
              <label
                htmlFor="amount-max"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Max Amount
              </label>
              <input
                id="amount-max"
                type="number"
                step="0.01"
                min="0"
                value={filters.amountMax || ''}
                onChange={(e) => setFilters({ amountMax: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030]"
                aria-label="Maximum amount"
              />
            </div>

            {/* Merchant Search */}
            <div>
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
                  value={filters.merchant || ''}
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
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="pt-2 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-600 font-medium">Active:</span>
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
                {filters.dateFrom && (
                  <span className="px-2 py-1 bg-[#172030]/10 text-[#172030] rounded text-xs font-medium">
                    From: {format(new Date(filters.dateFrom), 'MMM d')}
                  </span>
                )}
                {filters.dateTo && (
                  <span className="px-2 py-1 bg-[#172030]/10 text-[#172030] rounded text-xs font-medium">
                    To: {format(new Date(filters.dateTo), 'MMM d')}
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
              </div>
            </div>
          )}

          {/* Save Preset */}
          <div className="pt-2 border-t border-gray-200 flex items-center gap-2">
            {!showPresetSave ? (
              <button
                onClick={() => setShowPresetSave(true)}
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-[#172030] bg-[#172030]/10 border border-[#172030]/20 rounded-lg hover:bg-[#172030]/20 transition-colors"
              >
                Save Filter Preset
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Preset name..."
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSavePreset();
                    } else if (e.key === 'Escape') {
                      setShowPresetSave(false);
                      setPresetName('');
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSavePreset}
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-[#172030] rounded-lg hover:opacity-90 transition-opacity"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowPresetSave(false);
                    setPresetName('');
                  }}
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Modal for Mobile */}
      <FilterModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default Filters;
